import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "student",
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdminSubject", // Updated to match AdminSubject model
    required: true,
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["present", "absent"],
    required: true,
  },
  reason: {
    type: String,
    enum: ["", "Sick", "Leave", "Unexcused", "Late", "Other"],
    default: "",
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AcademicDepartment",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
