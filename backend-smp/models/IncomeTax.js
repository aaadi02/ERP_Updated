import mongoose from 'mongoose';

const IncomeTaxSchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  panNumber: {
    type: String,
    required: true,
    match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  },
  financialYear: {
    type: String,
    required: true,
    match: /^\d{4}-\d{4}$/
  },
  assessmentYear: {
    type: String,
    required: true,
    match: /^\d{4}-\d{4}$/
  },
  
  // Income Details
  basicSalary: {
    type: Number,
    default: 0
  },
  hra: {
    type: Number,
    default: 0
  },
  allowances: {
    type: Number,
    default: 0
  },
  bonuses: {
    type: Number,
    default: 0
  },
  otherIncome: {
    type: Number,
    default: 0
  },
  grossIncome: {
    type: Number,
    default: 0
  },
  
  // Deductions under Section 80C
  ppf: {
    type: Number,
    default: 0,
    max: 150000
  },
  elss: {
    type: Number,
    default: 0
  },
  lifeInsurance: {
    type: Number,
    default: 0
  },
  housingLoan: {
    type: Number,
    default: 0
  },
  tuitionFees: {
    type: Number,
    default: 0
  },
  total80C: {
    type: Number,
    default: 0,
    max: 150000
  },
  
  // Other Deductions
  section80D: {
    type: Number,
    default: 0,
    max: 25000
  },
  section80G: {
    type: Number,
    default: 0
  },
  section24: {
    type: Number,
    default: 0,
    max: 200000
  },
  standardDeduction: {
    type: Number,
    default: 50000
  },
  
  // Professional Tax and Other Deductions
  professionalTax: {
    type: Number,
    default: 0
  },
  employerPF: {
    type: Number,
    default: 0
  },
  
  // Calculated Fields
  totalDeductions: {
    type: Number,
    default: 0
  },
  taxableIncome: {
    type: Number,
    default: 0
  },
  incomeTax: {
    type: Number,
    default: 0
  },
  cess: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  
  // TDS Details
  tdsDeducted: {
    type: Number,
    default: 0
  },
  advanceTax: {
    type: Number,
    default: 0
  },
  refundDue: {
    type: Number,
    default: 0
  },
  
  // Quarterly Advance Tax
  quarterlyPayments: [{
    quarter: {
      type: String,
      enum: ['Q1', 'Q2', 'Q3', 'Q4']
    },
    dueDate: Date,
    amount: Number,
    paidAmount: {
      type: Number,
      default: 0
    },
    paymentDate: Date,
    challanNumber: String,
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Overdue'],
      default: 'Pending'
    }
  }],
  
  // Form 16 Details
  form16: {
    issued: {
      type: Boolean,
      default: false
    },
    issueDate: Date,
    downloadUrl: String
  },
  
  // ITR Filing
  itrFiling: {
    filed: {
      type: Boolean,
      default: false
    },
    filingDate: Date,
    acknowledgmentNumber: String,
    returnType: {
      type: String,
      enum: ['ITR-1', 'ITR-2', 'ITR-3', 'ITR-4']
    },
    status: {
      type: String,
      enum: ['Not Filed', 'Filed', 'Processed', 'Defective'],
      default: 'Not Filed'
    }
  },
  
  // Compliance Status
  complianceStatus: {
    type: String,
    enum: ['Compliant', 'Non-Compliant', 'Partial'],
    default: 'Partial'
  },
  
  // Audit Trail
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastCalculatedAt: Date,
  
  // Notes and Remarks
  notes: String,
  remarks: String
});

// Pre-save middleware to calculate taxes
IncomeTaxSchema.pre('save', function(next) {
  // Calculate total 80C (max 150000)
  this.total80C = Math.min(
    this.ppf + this.elss + this.lifeInsurance + this.housingLoan + this.tuitionFees,
    150000
  );
  
  // Calculate gross income
  this.grossIncome = this.basicSalary + this.hra + this.allowances + this.bonuses + this.otherIncome;
  
  // Calculate total deductions
  this.totalDeductions = this.total80C + this.section80D + this.section80G + 
                        this.section24 + this.standardDeduction + this.professionalTax + this.employerPF;
  
  // Calculate taxable income
  this.taxableIncome = Math.max(0, this.grossIncome - this.totalDeductions);
  
  // Calculate income tax based on new tax regime (2023-24)
  let tax = 0;
  const income = this.taxableIncome;
  
  if (income <= 300000) {
    tax = 0;
  } else if (income <= 600000) {
    tax = (income - 300000) * 0.05;
  } else if (income <= 900000) {
    tax = 15000 + (income - 600000) * 0.10;
  } else if (income <= 1200000) {
    tax = 45000 + (income - 900000) * 0.15;
  } else if (income <= 1500000) {
    tax = 90000 + (income - 1200000) * 0.20;
  } else {
    tax = 150000 + (income - 1500000) * 0.30;
  }
  
  this.incomeTax = Math.round(tax);
  
  // Calculate cess (4% of income tax)
  this.cess = Math.round(this.incomeTax * 0.04);
  
  // Total tax
  this.totalTax = this.incomeTax + this.cess;
  
  // Calculate refund/due
  const totalPaid = this.tdsDeducted + this.advanceTax;
  this.refundDue = totalPaid - this.totalTax;
  
  // Update timestamps
  this.updatedAt = Date.now();
  this.lastCalculatedAt = Date.now();
  
  next();
});

// Method to calculate quarterly advance tax
IncomeTaxSchema.methods.calculateQuarterlyTax = function() {
  const totalAdvanceTax = Math.max(0, this.totalTax - this.tdsDeducted);
  
  // Quarterly percentages: 15%, 45%, 75%, 100%
  const percentages = [0.15, 0.45, 0.75, 1.0];
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const dueDates = [
    new Date(`${this.financialYear.split('-')[0]}-06-15`),
    new Date(`${this.financialYear.split('-')[0]}-09-15`),
    new Date(`${this.financialYear.split('-')[0]}-12-15`),
    new Date(`${this.financialYear.split('-')[1]}-03-15`)
  ];
  
  this.quarterlyPayments = quarters.map((quarter, index) => {
    const cumulativeAmount = Math.round(totalAdvanceTax * percentages[index]);
    const previousAmount = index > 0 ? Math.round(totalAdvanceTax * percentages[index - 1]) : 0;
    
    return {
      quarter,
      dueDate: dueDates[index],
      amount: cumulativeAmount - previousAmount,
      paidAmount: 0,
      status: 'Pending'
    };
  });
};

// Static method to get tax slab info
IncomeTaxSchema.statics.getTaxSlabs = function() {
  return [
    { min: 0, max: 300000, rate: 0, description: 'No tax' },
    { min: 300001, max: 600000, rate: 5, description: '5% tax' },
    { min: 600001, max: 900000, rate: 10, description: '10% tax' },
    { min: 900001, max: 1200000, rate: 15, description: '15% tax' },
    { min: 1200001, max: 1500000, rate: 20, description: '20% tax' },
    { min: 1500001, max: Infinity, rate: 30, description: '30% tax' }
  ];
};

// Compound unique index to ensure one record per employee per financial year
IncomeTaxSchema.index({ employeeId: 1, financialYear: 1 }, { unique: true });

export default mongoose.model('IncomeTax', IncomeTaxSchema);

