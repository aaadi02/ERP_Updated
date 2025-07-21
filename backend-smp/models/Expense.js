import mongoose from 'mongoose';
const expenseSchema = new mongoose.Schema({
  expenseId: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Office Supplies',
      'Utilities',
      'Maintenance',
      'Equipment',
      'Travel',
      'Marketing',
      'Software',
      'Training',
      'Professional Services',
      'Insurance',
      'Rent',
      'Salaries',
      'Benefits',
      'Taxes',
      'Other'
    ]
  },
  department: {
    type: String,
    required: true
  },
  expenseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'Bank Transfer', 'Cheque', 'Credit Card', 'Debit Card', 'UPI', 'Online']
  },
  vendor: {
    type: String,
    trim: true
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  billNumber: {
    type: String,
    trim: true
  },
  approvedBy: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Paid', 'Cancelled'],
    default: 'Pending'
  },
  attachments: [{
    filename: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  remarks: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Yearly'],
    required: function() {
      return this.isRecurring;
    }
  },
  nextDueDate: {
    type: Date,
    required: function() {
      return this.isRecurring;
    }
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate expense ID before saving
expenseSchema.pre('save', async function(next) {
  if (!this.expenseId) {
    const count = await mongoose.model('Expense').countDocuments();
    this.expenseId = `EXP-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Auto-generate receipt number if not provided
  if (!this.receiptNumber) {
    const timestamp = Date.now().toString().slice(-6);
    this.receiptNumber = `REC-${this.expenseId}-${timestamp}`;
  }
  
  // Calculate total amount including tax
  if (this.taxRate && this.taxRate > 0) {
    this.taxAmount = (this.amount * this.taxRate) / 100;
    this.totalAmount = this.amount + this.taxAmount;
  } else {
    this.taxAmount = 0;
    this.totalAmount = this.amount;
  }
  
  next();
});

// Index for better query performance
expenseSchema.index({ expenseId: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ department: 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ createdBy: 1 });
expenseSchema.index({ vendor: 1 });

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function() {
  return `₹${this.totalAmount.toLocaleString('en-IN')}`;
});

// Virtual for expense age
expenseSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.expenseDate) / (1000 * 60 * 60 * 24));
});

// Static methods
expenseSchema.statics.getExpensesByCategory = function(category, startDate, endDate) {
  const query = { category };
  if (startDate || endDate) {
    query.expenseDate = {};
    if (startDate) query.expenseDate.$gte = new Date(startDate);
    if (endDate) query.expenseDate.$lte = new Date(endDate);
  }
  return this.find(query).sort({ expenseDate: -1 });
};

expenseSchema.statics.getExpensesByDepartment = function(department, startDate, endDate) {
  const query = { department };
  if (startDate || endDate) {
    query.expenseDate = {};
    if (startDate) query.expenseDate.$gte = new Date(startDate);
    if (endDate) query.expenseDate.$lte = new Date(endDate);
  }
  return this.find(query).sort({ expenseDate: -1 });
};

expenseSchema.statics.getTotalExpenses = function(startDate, endDate) {
  const match = {};
  if (startDate || endDate) {
    match.expenseDate = {};
    if (startDate) match.expenseDate.$gte = new Date(startDate);
    if (endDate) match.expenseDate.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$totalAmount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$totalAmount' }
      }
    }
  ]);
};

expenseSchema.statics.getExpensesByStatus = function(status) {
  return this.find({ status }).sort({ expenseDate: -1 });
};

expenseSchema.statics.getMonthlyExpenseTrend = function(months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  return this.aggregate([
    { $match: { expenseDate: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$expenseDate' },
          month: { $month: '$expenseDate' }
        },
        totalAmount: { $sum: '$totalAmount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$totalAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
};

// Instance methods
expenseSchema.methods.approve = function(approvedBy) {
  this.status = 'Approved';
  this.approvedBy = approvedBy;
  this.updatedBy = approvedBy;
  return this.save();
};

expenseSchema.methods.reject = function(rejectedBy, reason) {
  this.status = 'Rejected';
  this.updatedBy = rejectedBy;
  if (reason) {
    this.remarks = (this.remarks || '') + `\nRejected: ${reason}`;
  }
  return this.save();
};

expenseSchema.methods.markAsPaid = function(paidBy) {
  this.status = 'Paid';
  this.updatedBy = paidBy;
  return this.save();
};

expenseSchema.methods.addAttachment = function(filename, filepath) {
  this.attachments.push({
    filename: filename,
    path: filepath,
    uploadDate: new Date()
  });
  return this.save();
};

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
