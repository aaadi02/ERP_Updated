import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  leaveType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  contact: { type: String, required: true },
  reason: { type: String, required: true },
  attachment: { type: String }, // Path to uploaded file
  department: { type: String, required: true }, // To route to HoD
  hodId: { type: String, required: true }, // HoD's employeeId
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("LeaveRequest", leaveRequestSchema);
