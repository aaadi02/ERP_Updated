import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  firstName: { type: String, required: true },
  department: { type: String, required: true },
  leaveCategory: {
    type: String,
    enum: ["Regular", "OD"],
    default: "Regular",
    required: true,
  },
  leaveType: {
    type: String,
    enum: [
      "Sick Leave",
      "Casual Leave",
      "Earned Leave",
      "Sabbatical", // Regular leave types
      "Conference",
      "Workshop",
      "Official Duty", // OD leave types
      "CompOff Leave",
    ],
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
  odDetails: {
    eventName: { type: String }, // OD-specific: e.g., conference name
    location: { type: String }, // OD-specific: event location
    approvalLetter: { type: String }, // OD-specific: file path for approval letter
  },
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

export default mongoose.model("Leave", leaveSchema);
