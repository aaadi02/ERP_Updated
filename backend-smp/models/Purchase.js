import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    itemCode: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Office Supplies', 'Lab Equipment', 'Furniture', 'Electronics', 'Software', 'Books', 'Maintenance', 'Other']
    },
    subcategory: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    specifications: {
        type: String,
        required: true
    },
    urgency: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    }
});

const purchaseOrderSchema = new mongoose.Schema({
    poNumber: {
        type: String,
        unique: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: true
    },
    department: {
        type: String,
        required: true,
        enum: [
            'Computer Science',
            'Computer Science & Engineering',
            'Electronics',
            'Electronics & Communication Engineering',
            'Mechanical',
            'Civil',
            'Chemical',
            'MBA',
            'MCA',
            'Administration',
            'Library',
            'Sports',
            'Other'
        ]
    },
    level: {
        type: String,
        required: true,
        enum: ['Department', 'Institute'],
        default: 'Department'
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    requiredDate: {
        type: Date,
        required: true
    },
    items: [purchaseItemSchema],
    totalAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Department Approved', 'Finance Approved', 'Director Approved', 'Purchase Approved', 'Ordered', 'Received', 'Completed', 'Rejected', 'Cancelled'],
        default: 'Draft'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    budgetHead: {
        type: String,
        required: true,
        enum: ['Capital', 'Revenue', 'Research', 'Development', 'Maintenance', 'Emergency']
    },
    budgetAllocation: {
        type: Number,
        required: true
    },
    approvals: {
        departmentHead: {
            approved: { type: Boolean, default: false },
            approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
            approvedDate: Date,
            comments: String
        },
        financeHead: {
            approved: { type: Boolean, default: false },
            approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
            approvedDate: Date,
            comments: String
        },
        director: {
            approved: { type: Boolean, default: false },
            approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
            approvedDate: Date,
            comments: String
        },
        purchaseOfficer: {
            approved: { type: Boolean, default: false },
            approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
            approvedDate: Date,
            comments: String
        }
    },
    vendor: {
        name: String,
        contact: String,
        email: String,
        address: String,
        gst: String
    },
    quotations: [{
        vendorName: String,
        quotationNumber: String,
        quotationDate: Date,
        totalAmount: Number,
        validUntil: Date,
        items: [{
            itemCode: String,
            unitPrice: Number,
            totalPrice: Number
        }],
        isSelected: { type: Boolean, default: false }
    }],
    delivery: {
        expectedDate: Date,
        actualDate: Date,
        deliveryAddress: String,
        receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
        condition: String,
        remarks: String
    },
    payment: {
        method: {
            type: String,
            enum: ['Cheque', 'NEFT', 'RTGS', 'Cash', 'Credit Card']
        },
        advanceAmount: { type: Number, default: 0 },
        paidAmount: { type: Number, default: 0 },
        balanceAmount: { type: Number, default: 0 },
        paymentDate: Date,
        transactionId: String,
        invoiceNumber: String,
        invoiceDate: Date
    },
    attachments: [{
        fileName: String,
        filePath: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
        uploadedDate: { type: Date, default: Date.now }
    }],
    auditTrail: [{
        action: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
        date: { type: Date, default: Date.now },
        details: String,
        previousStatus: String,
        newStatus: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Middleware to generate PO number
purchaseOrderSchema.pre('save', async function(next) {
    if (this.isNew && (!this.poNumber || this.poNumber === null || this.poNumber === undefined)) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const count = await this.constructor.countDocuments({
            createdAt: {
                $gte: new Date(year, 0, 1),
                $lt: new Date(year + 1, 0, 1)
            }
        });
        this.poNumber = `PO${year}${month}${String(count + 1).padStart(4, '0')}`;
    }
    
    // Calculate total amount
    if (this.items && this.items.length > 0) {
        this.totalAmount = this.items.reduce((total, item) => total + item.totalPrice, 0);
    }
    
    // Calculate balance amount
    if (this.payment) {
        this.payment.balanceAmount = this.totalAmount - (this.payment.paidAmount || 0);
    }
    
    next();
});

// Create indexes for better performance
purchaseOrderSchema.index({ department: 1, status: 1 });
purchaseOrderSchema.index({ requestedBy: 1 });
purchaseOrderSchema.index({ createdAt: -1 });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema);

