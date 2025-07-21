import mongoose from 'mongoose';

const pfSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    trim: true
  },
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  pfNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  financialYear: {
    type: String,
    required: true,
    match: /^\d{4}-\d{4}$/
  },
  // Salary Information
  basicSalary: {
    type: Number,
    required: true,
    min: 0
  },
  pfEligibleSalary: {
    type: Number,
    required: true,
    min: 0,
    max: 180000 // Annual cap of ₹1,80,000
  },
  // PF Contributions
  employeePFContribution: {
    type: Number,
    required: true,
    min: 0
  },
  employerPFContribution: {
    type: Number,
    required: true,
    min: 0
  },
  vpfContribution: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPFContribution: {
    type: Number,
    required: true,
    min: 0
  },
  // Professional Tax
  professionalTax: {
    type: Number,
    required: true,
    min: 0,
    max: 2500 // Annual cap
  },
  ptState: {
    type: String,
    required: true,
    enum: ['Karnataka', 'Maharashtra', 'West Bengal', 'Tamil Nadu', 'Andhra Pradesh', 'Other']
  },
  // PF Settings
  pfInterestRate: {
    type: Number,
    default: 8.15,
    min: 0,
    max: 20
  },
  // Compliance & Status
  complianceStatus: {
    type: String,
    enum: ['Compliant', 'Non-Compliant', 'Pending', 'Review Required'],
    default: 'Pending'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Additional Information
  remarks: {
    type: String,
    maxlength: 500
  },
  // Audit Fields
  createdBy: {
    type: String,
    default: 'System'
  },
  updatedBy: {
    type: String,
    default: 'System'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for unique employee per financial year
pfSchema.index({ employeeId: 1, financialYear: 1 }, { unique: true });

// Indexes for performance
pfSchema.index({ employeeName: 1 });
pfSchema.index({ financialYear: 1 });
pfSchema.index({ complianceStatus: 1 });
pfSchema.index({ createdAt: -1 });

// Virtual for monthly PF contribution
pfSchema.virtual('monthlyEmployeePF').get(function() {
  return Math.round(this.employeePFContribution / 12);
});

// Virtual for monthly professional tax
pfSchema.virtual('monthlyProfessionalTax').get(function() {
  return Math.round(this.professionalTax / 12);
});

// Virtual for total annual deduction
pfSchema.virtual('totalAnnualDeduction').get(function() {
  return this.employeePFContribution + this.professionalTax;
});

// Virtual for PF maturity calculation (approximate)
pfSchema.virtual('pfMaturityValue').get(function() {
  const years = 5; // Assuming 5 years for calculation
  const principal = this.totalPFContribution;
  const rate = this.pfInterestRate / 100;
  return Math.round(principal * Math.pow(1 + rate, years));
});

// Pre-save middleware to calculate values
pfSchema.pre('save', function(next) {
  // Calculate PF eligible salary (capped at ₹15,000 per month = ₹1,80,000 per year)
  const monthlyBasic = this.basicSalary / 12;
  const pfEligibleMonthly = Math.min(monthlyBasic, 15000);
  this.pfEligibleSalary = pfEligibleMonthly * 12;
  
  // Calculate PF contributions
  this.employeePFContribution = Math.round(this.pfEligibleSalary * 0.12);
  this.employerPFContribution = Math.round(this.pfEligibleSalary * 0.12);
  this.totalPFContribution = this.employeePFContribution + this.employerPFContribution + (this.vpfContribution || 0);
  
  // Update compliance status based on calculations
  if (this.employeePFContribution > 0 && this.professionalTax >= 0) {
    this.complianceStatus = 'Compliant';
  } else {
    this.complianceStatus = 'Review Required';
  }
  
  this.lastUpdated = new Date();
  next();
});

// Static method to calculate professional tax by state
pfSchema.statics.calculateProfessionalTax = function(monthlySalary, state) {
  const slabs = {
    'Karnataka': [
      { min: 0, max: 15000, tax: 0 },
      { min: 15001, max: 30000, tax: 200 },
      { min: 30001, max: Infinity, tax: 300 }
    ],
    'Maharashtra': [
      { min: 0, max: 5000, tax: 0 },
      { min: 5001, max: 10000, tax: 150 },
      { min: 10001, max: Infinity, tax: 200 }
    ],
    'West Bengal': [
      { min: 0, max: 10000, tax: 0 },
      { min: 10001, max: 15000, tax: 110 },
      { min: 15001, max: 25000, tax: 130 },
      { min: 25001, max: Infinity, tax: 200 }
    ]
  };
  
  const stateSlabs = slabs[state] || slabs['Karnataka'];
  const slab = stateSlabs.find(s => monthlySalary >= s.min && monthlySalary <= s.max);
  return slab ? Math.min(slab.tax * 12, 2500) : 0; // Annual professional tax capped at ₹2,500
};

// Static method to get dashboard statistics
pfSchema.statics.getDashboardStats = async function(financialYear) {
  const match = financialYear ? { financialYear } : {};
  
  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalEmployeePF: { $sum: '$employeePFContribution' },
        totalEmployerPF: { $sum: '$employerPFContribution' },
        totalPF: { $sum: '$totalPFContribution' },
        totalProfessionalTax: { $sum: '$professionalTax' },
        avgPFContribution: { $avg: '$totalPFContribution' },
        avgProfessionalTax: { $avg: '$professionalTax' },
        compliantRecords: {
          $sum: { $cond: [{ $eq: ['$complianceStatus', 'Compliant'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalRecords: 0,
    totalEmployeePF: 0,
    totalEmployerPF: 0,
    totalPF: 0,
    totalProfessionalTax: 0,
    avgPFContribution: 0,
    avgProfessionalTax: 0,
    compliantRecords: 0
  };
};

// Static method for PF summary by employee
pfSchema.statics.getPFSummaryByEmployee = async function(financialYear) {
  const match = financialYear ? { financialYear } : {};
  
  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$employeeName',
        totalPF: { $sum: '$totalPFContribution' },
        totalProfessionalTax: { $sum: '$professionalTax' },
        records: { $push: '$$ROOT' }
      }
    },
    { $sort: { totalPF: -1 } }
  ]);
};

export default mongoose.model('PF', pfSchema);

