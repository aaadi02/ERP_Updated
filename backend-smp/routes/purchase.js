import express from 'express';
const router = express.Router();
import PurchaseOrder from "../models/Purchase.js";
import Department from "../models/Department.js";
import Faculty from "../models/faculty.js";

// Get all purchase orders with filtering and pagination
router.get('/orders', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            department,
            level,
            priority,
            budgetHead,
            dateFrom,
            dateTo
        } = req.query;

        const filter = {};
        
        if (status) filter.status = status;
        if (department) filter.department = department;
        if (level) filter.level = level;
        if (priority) filter.priority = priority;
        if (budgetHead) filter.budgetHead = budgetHead;
        
        if (dateFrom || dateTo) {
            filter.requestDate = {};
            if (dateFrom) filter.requestDate.$gte = new Date(dateFrom);
            if (dateTo) filter.requestDate.$lte = new Date(dateTo);
        }

        const orders = await PurchaseOrder.find(filter)
            .populate('requestedBy', 'name email department')
            .populate('approvals.departmentHead.approvedBy', 'name')
            .populate('approvals.financeHead.approvedBy', 'name')
            .populate('approvals.director.approvedBy', 'name')
            .populate('approvals.purchaseOfficer.approvedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await PurchaseOrder.countDocuments(filter);

        res.json({
            orders,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get purchase order by ID
router.get('/orders/:id', async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id)
            .populate('requestedBy', 'name email department')
            .populate('approvals.departmentHead.approvedBy', 'name')
            .populate('approvals.financeHead.approvedBy', 'name')
            .populate('approvals.director.approvedBy', 'name')
            .populate('approvals.purchaseOfficer.approvedBy', 'name')
            .populate('delivery.receivedBy', 'name');
            
        if (!order) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new purchase order
router.post('/orders', async (req, res) => {
    try {
        const order = new PurchaseOrder(req.body);
        
        // Add audit trail entry
        order.auditTrail.push({
            action: 'Created',
            performedBy: req.body.requestedBy,
            details: 'Purchase order created',
            newStatus: 'Draft'
        });
        
        await order.save();
        
        const populatedOrder = await PurchaseOrder.findById(order._id)
            .populate('requestedBy', 'name email department');
            
        res.status(201).json(populatedOrder);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update purchase order
router.put('/orders/:id', async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        const previousStatus = order.status;
        Object.assign(order, req.body);
        
        // Add audit trail entry if status changed
        if (previousStatus !== order.status) {
            order.auditTrail.push({
                action: 'Status Updated',
                performedBy: req.body.updatedBy,
                details: `Status changed from ${previousStatus} to ${order.status}`,
                previousStatus,
                newStatus: order.status
            });
        }
        
        await order.save();
        
        const updatedOrder = await PurchaseOrder.findById(order._id)
            .populate('requestedBy', 'name email department');
            
        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Approve/Reject purchase order
router.post('/orders/:id/approve', async (req, res) => {
    try {
        const { approvalType, approved, comments, approvedBy } = req.body;
        
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        // Update approval status
        if (order.approvals[approvalType]) {
            order.approvals[approvalType].approved = approved;
            order.approvals[approvalType].approvedBy = approvedBy;
            order.approvals[approvalType].approvedDate = new Date();
            order.approvals[approvalType].comments = comments;
        }
        
        // Update order status based on approval flow
        let newStatus = order.status;
        if (approved) {
            if (approvalType === 'departmentHead' && order.status === 'Submitted') {
                newStatus = 'Department Approved';
            } else if (approvalType === 'financeHead' && order.status === 'Department Approved') {
                newStatus = 'Finance Approved';
            } else if (approvalType === 'director' && order.status === 'Finance Approved') {
                newStatus = 'Director Approved';
            } else if (approvalType === 'purchaseOfficer' && order.status === 'Director Approved') {
                newStatus = 'Purchase Approved';
            }
        } else {
            newStatus = 'Rejected';
        }
        
        const previousStatus = order.status;
        order.status = newStatus;
        
        // Add audit trail entry
        order.auditTrail.push({
            action: approved ? 'Approved' : 'Rejected',
            performedBy: approvedBy,
            details: `${approvalType} ${approved ? 'approved' : 'rejected'}: ${comments || 'No comments'}`,
            previousStatus,
            newStatus
        });
        
        await order.save();
        
        res.json({ message: `Purchase order ${approved ? 'approved' : 'rejected'} successfully`, order });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add quotation to purchase order
router.post('/orders/:id/quotations', async (req, res) => {
    try {
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        order.quotations.push(req.body);
        
        // Add audit trail entry
        order.auditTrail.push({
            action: 'Quotation Added',
            performedBy: req.body.addedBy,
            details: `Quotation from ${req.body.vendorName} added`
        });
        
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Select quotation
router.post('/orders/:id/select-quotation', async (req, res) => {
    try {
        const { quotationId, selectedBy } = req.body;
        
        const order = await PurchaseOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Purchase order not found' });
        }
        
        // Deselect all quotations
        order.quotations.forEach(q => q.isSelected = false);
        
        // Select the specified quotation
        const selectedQuotation = order.quotations.id(quotationId);
        if (selectedQuotation) {
            selectedQuotation.isSelected = true;
            order.vendor = {
                name: selectedQuotation.vendorName,
                // Add other vendor details as needed
            };
            
            // Add audit trail entry
            order.auditTrail.push({
                action: 'Quotation Selected',
                performedBy: selectedBy,
                details: `Quotation from ${selectedQuotation.vendorName} selected`
            });
        }
        
        await order.save();
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get purchase analytics
router.get('/analytics', async (req, res) => {
    try {
        const { department, level, year = new Date().getFullYear() } = req.query;
        
        const filter = {};
        if (department) filter.department = department;
        if (level) filter.level = level;
        
        // Year filter
        filter.createdAt = {
            $gte: new Date(year, 0, 1),
            $lt: new Date(parseInt(year) + 1, 0, 1)
        };
        
        const analytics = await PurchaseOrder.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' },
                    averageAmount: { $avg: '$totalAmount' },
                    pendingOrders: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['Draft', 'Submitted', 'Department Approved', 'Finance Approved', 'Director Approved']] },
                                1,
                                0
                            ]
                        }
                    },
                    completedOrders: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0]
                        }
                    },
                    rejectedOrders: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0]
                        }
                    }
                }
            }
        ]);
        
        // Department-wise analytics
        const departmentAnalytics = await PurchaseOrder.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$department',
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' },
                    averageAmount: { $avg: '$totalAmount' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);
        
        // Monthly trends
        const monthlyTrends = await PurchaseOrder.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    },
                    totalOrders: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);
        
        res.json({
            overview: analytics[0] || {
                totalOrders: 0,
                totalAmount: 0,
                averageAmount: 0,
                pendingOrders: 0,
                completedOrders: 0,
                rejectedOrders: 0
            },
            departmentAnalytics,
            monthlyTrends
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Department routes
router.get('/departments', async (req, res) => {
    try {
        const departments = await Department.find({ isActive: true })
            .populate('head', 'name email')
            .sort({ name: 1 });
        res.json(departments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/departments', async (req, res) => {
    try {
        const department = new Department(req.body);
        await department.save();
        
        const populatedDepartment = await Department.findById(department._id)
            .populate('head', 'name email');
            
        res.status(201).json(populatedDepartment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.put('/departments/:id', async (req, res) => {
    try {
        const department = await Department.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('head', 'name email');
        
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }
        
        res.json(department);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get department budget status
router.get('/departments/:id/budget', async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }
        
        // Calculate current year utilization
        const currentYear = new Date().getFullYear();
        const purchaseOrders = await PurchaseOrder.find({
            department: department.name,
            status: { $in: ['Completed', 'Received'] },
            createdAt: {
                $gte: new Date(currentYear, 0, 1),
                $lt: new Date(currentYear + 1, 0, 1)
            }
        });
        
        const totalUtilized = purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        // Update department budget
        department.budget.utilized = totalUtilized;
        department.budget.remaining = department.budget.allocated - totalUtilized;
        await department.save();
        
        res.json({
            department: department.name,
            budget: department.budget,
            utilizationPercentage: department.budget.allocated > 0 
                ? (totalUtilized / department.budget.allocated * 100).toFixed(2)
                : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all faculty for dropdown/selection purposes
router.get('/faculty', async (req, res) => {
    try {
        const faculty = await Faculty.find(
            {},  // Remove isActive filter for now
            'personalInfo.fullName personalInfo.email employmentInfo.department employmentInfo.designation personalInfo.phoneNumber'
        ).sort({ 'personalInfo.fullName': 1 });
        
        // Transform data for frontend consumption
        const transformedFaculty = faculty.map(f => ({
            _id: f._id,
            name: f.personalInfo?.fullName || 'Unknown',
            email: f.personalInfo?.email || '',
            department: f.employmentInfo?.department || '',
            designation: f.employmentInfo?.designation || '',
            phone: f.personalInfo?.phoneNumber || ''
        }));
        
        res.json(transformedFaculty);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;


