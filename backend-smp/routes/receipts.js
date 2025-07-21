import express from 'express';
const router = express.Router();
import Payment from "../models/Payment.js";
import Student from "../models/StudentManagement.js";
import Salary from "../models/Salary.js";

// GET: All receipts with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      type, 
      status, 
      startDate, 
      endDate,
      department 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let allReceipts = [];

    // Fetch student payment receipts
    if (!type || type === 'student') {
      let studentPaymentQuery = {};
      
      // Date range filter
      if (startDate || endDate) {
        studentPaymentQuery.paymentDate = {};
        if (startDate) studentPaymentQuery.paymentDate.$gte = new Date(startDate);
        if (endDate) studentPaymentQuery.paymentDate.$lte = new Date(endDate);
      }

      // Status filter
      if (status) studentPaymentQuery.status = status;

      // Search filter
      if (search) {
        const studentQuery = {
          $or: [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { studentId: { $regex: search, $options: 'i' } },
          ],
        };
        const matchingStudents = await Student.find(studentQuery).select('_id');
        const studentIds = matchingStudents.map(s => s._id);

        studentPaymentQuery = {
          ...studentPaymentQuery,
          $or: [
            { studentId: { $in: studentIds } },
            { paymentId: { $regex: search, $options: 'i' } },
            { receiptNumber: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { transactionId: { $regex: search, $options: 'i' } },
            { remarks: { $regex: search, $options: 'i' } },
          ],
        };
      }

      const studentPayments = await Payment.find(studentPaymentQuery)
        .populate('studentId', 'firstName lastName studentId department casteCategory')
        .populate('feeHead', 'title')
        .sort({ paymentDate: -1 })
        .lean();

      // Filter by department if specified
      const filteredStudentPayments = department 
        ? studentPayments.filter(p => p.studentId?.department === department)
        : studentPayments;

      // Transform student payments
      const transformedStudentReceipts = filteredStudentPayments.map(payment => ({
        _id: payment._id,
        type: 'student',
        receiptNumber: payment.receiptNumber,
        paymentId: payment.paymentId || `SP-${payment._id.toString().slice(-8)}`,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        status: payment.status,
        description: payment.description || `Fee payment for ${payment.studentId?.firstName} ${payment.studentId?.lastName}`,
        recipientName: `${payment.studentId?.firstName || ''} ${payment.studentId?.lastName || ''}`.trim(),
        studentId: payment.studentId?.studentId,
        department: payment.studentId?.department,
        casteCategory: payment.studentId?.casteCategory,
        feeHead: payment.feeHead?.title,
        transactionId: payment.transactionId,
        remarks: payment.remarks,
        collectedBy: payment.collectedBy,
        semester: payment.semester
      }));

      allReceipts = [...allReceipts, ...transformedStudentReceipts];
    }

    // Fetch salary payment receipts
    if (!type || type === 'salary') {
      let salaryQuery = {};
      
      if (search) {
        salaryQuery = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { month: { $regex: search, $options: 'i' } },
            { employeeId: { $regex: search, $options: 'i' } },
          ],
        };
      }

      if (status) salaryQuery.status = status;

      const salaryPayments = await Salary.find(salaryQuery)
        .sort({ createdAt: -1 })
        .lean();

      // Transform salary payments
      const transformedSalaryReceipts = salaryPayments.map(salary => ({
        _id: salary._id,
        type: 'salary',
        receiptNumber: `SAL-${salary._id.toString().slice(-8)}`,
        paymentId: `SAL-${salary._id.toString().slice(-8)}`,
        amount: salary.amount,
        paymentMethod: 'Bank Transfer',
        paymentDate: salary.createdAt || new Date(),
        status: salary.status,
        description: `Salary payment for ${salary.month}`,
        recipientName: salary.name,
        studentId: '',
        department: salary.department || '',
        casteCategory: '',
        feeHead: '',
        transactionId: '',
        remarks: `Monthly salary for ${salary.month}`,
        collectedBy: 'System',
        semester: null,
        employeeId: salary.employeeId
      }));

      allReceipts = [...allReceipts, ...transformedSalaryReceipts];
    }

    // Sort by payment date (newest first)
    allReceipts.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    // Apply pagination
    const paginatedReceipts = allReceipts.slice(skip, skip + limitNum);
    const totalReceipts = allReceipts.length;
    const totalPages = Math.ceil(totalReceipts / limitNum);

    res.json({
      receipts: paginatedReceipts,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalReceipts,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (err) {
    console.error('Error fetching receipts:', err);
    res.status(500).json({ message: 'Error fetching receipts: ' + err.message });
  }
});

// GET: Receipt by ID (student payment receipt)
router.get('/student/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('studentId', 'firstName lastName studentId department casteCategory')
      .populate('feeHead', 'title');
    
    if (!payment) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    
    res.json(payment);
  } catch (err) {
    console.error('Error fetching receipt:', err);
    res.status(500).json({ message: 'Error fetching receipt details' });
  }
});

// GET: Receipt by receipt number
router.get('/number/:receiptNumber', async (req, res) => {
  try {
    const payment = await Payment.findOne({ receiptNumber: req.params.receiptNumber })
      .populate('studentId', 'firstName lastName studentId department casteCategory')
      .populate('feeHead', 'title');
    
    if (!payment) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    
    res.json(payment);
  } catch (err) {
    console.error('Error fetching receipt:', err);
    res.status(500).json({ message: 'Error fetching receipt by number' });
  }
});

// GET: Salary receipt by ID
router.get('/salary/:id', async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary receipt not found' });
    }
    
    // Transform to receipt format
    const receipt = {
      _id: salary._id,
      type: 'salary',
      receiptNumber: `SAL-${salary._id.toString().slice(-8)}`,
      paymentId: `SAL-${salary._id.toString().slice(-8)}`,
      amount: salary.amount,
      paymentMethod: 'Bank Transfer',
      paymentDate: salary.createdAt || new Date(),
      status: salary.status,
      description: `Salary payment for ${salary.month}`,
      recipient: {
        name: salary.name,
        employeeId: salary.employeeId,
        department: salary.department
      },
      remarks: `Monthly salary for ${salary.month}`,
      collectedBy: 'System'
    };
    
    res.json(receipt);
  } catch (err) {
    console.error('Error fetching salary receipt:', err);
    res.status(500).json({ message: 'Error fetching salary receipt details' });
  }
});

// GET: Receipt statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Today's receipts
    const todayReceipts = await Payment.countDocuments({
      paymentDate: { $gte: startOfDay }
    });
    const todayAmount = await Payment.aggregate([
      { $match: { paymentDate: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // This month's receipts
    const monthReceipts = await Payment.countDocuments({
      paymentDate: { $gte: startOfMonth }
    });
    const monthAmount = await Payment.aggregate([
      { $match: { paymentDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // This year's receipts
    const yearReceipts = await Payment.countDocuments({
      paymentDate: { $gte: startOfYear }
    });
    const yearAmount = await Payment.aggregate([
      { $match: { paymentDate: { $gte: startOfYear } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Receipt status distribution
    const statusDistribution = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]);

    // Payment method distribution
    const methodDistribution = await Payment.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]);

    res.json({
      today: {
        count: todayReceipts,
        amount: todayAmount[0]?.total || 0
      },
      month: {
        count: monthReceipts,
        amount: monthAmount[0]?.total || 0
      },
      year: {
        count: yearReceipts,
        amount: yearAmount[0]?.total || 0
      },
      statusDistribution,
      methodDistribution
    });

  } catch (err) {
    console.error('Error fetching receipt stats:', err);
    res.status(500).json({ message: 'Error fetching receipt statistics' });
  }
});

// POST: Generate bulk receipts (for record keeping)
router.post('/bulk-generate', async (req, res) => {
  try {
    const { startDate, endDate, type = 'student' } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    let query = {
      paymentDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const payments = await Payment.find(query)
      .populate('studentId', 'firstName lastName studentId department')
      .populate('feeHead', 'title')
      .sort({ paymentDate: -1 });

    // Generate receipt summary
    const receiptSummary = {
      totalReceipts: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      dateRange: { startDate, endDate },
      receipts: payments.map(payment => ({
        receiptNumber: payment.receiptNumber,
        paymentId: payment.paymentId,
        studentName: `${payment.studentId?.firstName || ''} ${payment.studentId?.lastName || ''}`.trim(),
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        status: payment.status
      }))
    };

    res.json(receiptSummary);

  } catch (err) {
    console.error('Error generating bulk receipts:', err);
    res.status(500).json({ message: 'Error generating bulk receipts' });
  }
});

export default router;


