import mongoose from 'mongoose';

const insuranceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  policyNumber: {
    type: String,
    required: false,
    unique: true,
    trim: true
  },
  insuranceProvider: {
    type: String,
    required: true,
    trim: true
  },
  policyType: {
    type: String,
    enum: ['Health', 'Accident', 'Life', 'Comprehensive', 'Other'],
    required: true
  },
  coverageAmount: {
    type: Number,
    required: true,
    min: 0
  },
  premiumAmount: {
    type: Number,
    required: true,
    min: 0
  },
  premiumFrequency: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'],
    default: 'Yearly'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Cancelled', 'Pending'],
    default: 'Active'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Overdue', 'Partial'],
    default: 'Pending'
  },
  lastPaymentDate: {
    type: Date
  },
  nextPaymentDate: {
    type: Date
  },
  coverageDetails: {
    type: String,
    trim: true
  },
  exclusions: {
    type: String,
    trim: true
  },
  termsAndConditions: {
    type: String,
    trim: true
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String
  },
  agentName: {
    type: String,
    trim: true,
    default: ''
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
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

// Update the updatedAt field before saving
insuranceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Insurance', insuranceSchema); 
