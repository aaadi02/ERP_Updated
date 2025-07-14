import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "student",
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject", // FIX: model is registered as 'Subject'
    required: true,
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty", // FIX: model is registered as 'Faculty'
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  subjects: [
    {
      subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
      name: String,
      code: String,
    },
  ],
  department: {
    name: String,
    code: String,
  },
});

attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
