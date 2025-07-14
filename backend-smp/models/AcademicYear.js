import mongoose from "mongoose";

const academicYearSchema = new mongoose.Schema({
  year: {
    type: String,
    required: true,
    unique: true, // e.g., "2024-25"
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  semesters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester'
  }],
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model("AcademicYear", academicYearSchema);
