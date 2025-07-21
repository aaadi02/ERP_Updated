import mongoose from 'mongoose';

const studentAccountSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  academicYear: {
    type: Number,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  feeStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  lateFees: {
    type: Number,
    default: 0,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid', 'Overdue', 'Waived'],
    default: 'Pending'
  },
  paymentHistory: [{
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    amount: Number,
    date: Date,
    method: String,
    description: String
  }],
  remarks: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate balance before saving
studentAccountSchema.pre('save', function(next) {
  this.balanceAmount = this.totalAmount - this.paidAmount + this.lateFees;
  
  // Update status based on balance
  if (this.balanceAmount <= 0) {
    this.status = 'Paid';
  } else if (this.paidAmount > 0) {
    this.status = 'Partial';
  } else if (new Date() > this.dueDate) {
    this.status = 'Overdue';
  } else {
    this.status = 'Pending';
  }
  
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('StudentAccount', studentAccountSchema); 
