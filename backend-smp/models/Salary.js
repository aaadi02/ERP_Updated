import mongoose from 'mongoose';
const SalarySchema = new mongoose.Schema({
  name: String,
  employeeName: String,
  salaryType: String,
  basicSalary: Number,
  agp: Number,
  gradePay: Number,
  allowances: {
    da: Number,
    hra: Number,
    transportAllowance: Number,
    claAllowance: Number,
    medicalAllowance: Number,
    otherAllowances: Number
  },
  deductions: {
    tds: Number,
    epf: Number,
    professionalTax: Number
  },
  amount: Number, // Gross salary
  grossSalary: Number,
  totalDeductions: Number,
  netSalary: Number,
  month: Number, // Month as number (1-12)
  year: Number, // Year as number
  status: String,
  calculatedOn: Date,
  hraRate: String,
  city: String,
  paymentDate: Date
});
export default mongoose.model('Salary', SalarySchema);
