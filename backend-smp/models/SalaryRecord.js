import mongoose from "mongoose";

const salaryRecordSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    name: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    type: { type: String, enum: ["teaching", "non-teaching"], required: true },
    basicSalary: { type: Number, required: true, default: 0 },
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    grossSalary: { type: Number, required: true, default: 0 },
    taxDeduction: { type: Number, default: 0 },
    pfDeduction: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: true, default: 0 },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ["Bank Transfer", "Cash", "Cheque"],
      required: true,
      default: "Bank Transfer",
    },
    bankAccount: { type: String },
    workingHours: { type: Number, default: 0 },
    leaveDeduction: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Pending", "Processed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("SalaryRecord", salaryRecordSchema);
