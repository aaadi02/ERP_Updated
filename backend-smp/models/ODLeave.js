import mongoose from "mongoose";

const odLeaveSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  firstName: { type: String, required: true },
  department: { type: String, required: true },
  leaveType: {
    type: String,
    enum: ["Conference", "Workshop", "Official Duty"],
    required: true,
  },
  type: {
    type: String,
    enum: ["Faculty", "HOD", "Principal", "Staff"],
    default: "Faculty",
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  leaveDuration: {
    type: String,
    enum: ["Full Day", "Half Day"],
    default: "Full Day",
    required: true,
  },
  reason: { type: String, required: true },
  contact: { type: String },
  attachment: { type: String },
  eventName: { type: String, required: true },
  location: { type: String, required: true },
  approvalLetter: { type: String },
  leaveDays: { type: Number, required: true },
  status: {
    type: String,
    enum: [
      "Pending",
      "HOD Approved",
      "HOD Rejected",
      "Principal Approved",
      "Principal Rejected",
    ],
    default: "Pending",
  },
  hodDecision: {
    employeeId: { type: String },
    decision: { type: String, enum: ["Approved", "Rejected"] },
    comment: { type: String },
    decidedAt: { type: Date },
  },
  principalDecision: {
    employeeId: { type: String },
    decision: { type: String, enum: ["Approved", "Rejected"] },
    comment: { type: String },
    decidedAt: { type: Date },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("ODLeave", odLeaveSchema);
