import mongoose from "mongoose";
import "./Department.js";
const { Schema } = mongoose;

const subjectSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  subjectCode: {
    type: String,
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AcademicDepartment", // Updated to match AcademicDepartment
    required: true,
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
    required: true,
  },
  totalLectures: {
    type: Number,
    default: 10,
  },
  year: {
    type: String,
    required: true,
  },
  faculties: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
  }],
  attendance: [{
    type: Schema.Types.ObjectId,
    ref: "Attendance",
  }],
}, {
  timestamps: true
});

export default mongoose.models.Subject || mongoose.model("Subject", subjectSchema);
