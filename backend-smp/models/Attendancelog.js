import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    department: { type: String, required: true },
    date: { type: String, required: true }, // Stored as YYYY-MM-DD
    checkIn: { type: String, default: "" },
    checkOut: { type: String, default: "" },
    status: {
      type: String,
      enum: ["present", "absent", "half-day"],
      required: true,
    },
    workHours: { type: String, default: "0:00" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default
  mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
