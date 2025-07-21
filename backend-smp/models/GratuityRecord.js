import mongoose from 'mongoose';

const gratuityRecordSchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  employeeId: {
    type: String,
    required: true
  },
  calculationDate: {
    type: Date,
    default: Date.now
  },
  yearsOfService: {
    type: Number,
    required: true,
    min: 0
  },
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  gratuityAmount: {
    type: Number,
    required: true,
    min: 0
  },
  exemptAmount: {
    type: Number,
    required: true,
    min: 0
  },
  taxableAmount: {
    type: Number,
    required: true,
    min: 0
  },
  taxLiability: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0.20 // 20% default tax rate
  },
  paymentStatus: {
    type: String,
    enum: ['calculated', 'approved', 'paid', 'pending', 'rejected'],
    default: 'calculated'
  },
  paymentDate: {
    type: Date
  },
  financialYear: {
    type: String,
    required: true
  },
  calculationMethod: {
    type: String,
    enum: ['statutory', 'company_policy', 'custom'],
    default: 'statutory'
  },
  remarks: {
    type: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  documents: [{
    fileName: String,
    filePath: String,
    fileType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  audit: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
gratuityRecordSchema.index({ facultyId: 1 });
gratuityRecordSchema.index({ employeeId: 1 });
gratuityRecordSchema.index({ financialYear: 1 });
gratuityRecordSchema.index({ paymentStatus: 1 });
gratuityRecordSchema.index({ calculationDate: -1 });

// Virtual for net amount after tax
gratuityRecordSchema.virtual('netAmount').get(function() {
  return this.gratuityAmount - this.taxLiability;
});

// Pre-save middleware to calculate financial year
gratuityRecordSchema.pre('save', function(next) {
  if (!this.financialYear) {
    const calculationDate = this.calculationDate || new Date();
    const year = calculationDate.getFullYear();
    const month = calculationDate.getMonth();
    
    // Financial year starts from April
    if (month >= 3) { // April to March (next year)
      this.financialYear = `${year}-${year + 1}`;
    } else {
      this.financialYear = `${year - 1}-${year}`;
    }
  }
  
  // Update audit trail
  if (this.isModified() && !this.isNew) {
    this.audit.updatedAt = new Date();
  }
  
  next();
});

// Static method to calculate gratuity
gratuityRecordSchema.statics.calculateGratuity = function(basicSalary, yearsOfService, calculationMethod = 'statutory') {
  let gratuityAmount = 0;
  
  switch (calculationMethod) {
    case 'statutory':
      // Standard formula: (Basic Salary × Years of Service × 15) / 26
      gratuityAmount = (basicSalary * yearsOfService * 15) / 26;
      break;
    case 'company_policy':
      // Company specific formula (can be customized)
      gratuityAmount = (basicSalary * yearsOfService * 30) / 26;
      break;
    default:
      gratuityAmount = (basicSalary * yearsOfService * 15) / 26;
  }
  
  // Current exemption limit for private employees
  const exemptionLimit = 200000; // 2 lakhs (not 20 lakhs)
  const exemptAmount = Math.min(gratuityAmount, exemptionLimit);
  const taxableAmount = Math.max(0, gratuityAmount - exemptionLimit);
  
  // Calculate tax liability based on income tax slabs
  let taxLiability = 0;
  if (taxableAmount > 0) {
    // Simplified tax calculation - 20% for demonstration
    // In reality, this would be based on the employee's total income and tax slabs
    taxLiability = taxableAmount * 0.20;
  }
  
  return {
    gratuityAmount: Math.round(gratuityAmount),
    exemptAmount: Math.round(exemptAmount),
    taxableAmount: Math.round(taxableAmount),
    taxLiability: Math.round(taxLiability),
    netAmount: Math.round(gratuityAmount - taxLiability)
  };
};

// Instance method to update payment status
gratuityRecordSchema.methods.updatePaymentStatus = function(status, userId) {
  this.paymentStatus = status;
  if (status === 'paid') {
    this.paymentDate = new Date();
  }
  this.audit.updatedBy = userId;
  this.audit.updatedAt = new Date();
  return this.save();
};

// Instance method to approve gratuity
gratuityRecordSchema.methods.approve = function(userId) {
  this.paymentStatus = 'approved';
  this.approvedBy = userId;
  this.approvalDate = new Date();
  this.audit.updatedBy = userId;
  this.audit.updatedAt = new Date();
  return this.save();
};

export default mongoose.model('GratuityRecord', gratuityRecordSchema);

