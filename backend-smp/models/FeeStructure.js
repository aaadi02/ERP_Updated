const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  academicYear: {
    type: Number,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  program: {
    type: String,
    required: true,
    trim: true
  },
  feeComponents: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    isOptional: {
      type: Boolean,
      default: false
    },
    description: String
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  lateFeeAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  lateFeePercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
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

// Calculate total amount before saving
feeStructureSchema.pre('save', function(next) {
  this.totalAmount = this.feeComponents.reduce((sum, component) => sum + component.amount, 0);
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema); 