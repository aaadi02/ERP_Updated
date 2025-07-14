import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema({
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  name: {
    type: String,
    required: true, // e.g., "Odd Semester", "Even Semester"
  },
  semesterNumber: {
    type: Number,
    required: true, // 1, 2, 3, 4, 5, 6, 7, 8
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  examStartDate: {
    type: Date,
  },
  examEndDate: {
    type: Date,
  },
  holidays: [{
    date: Date,
    name: String,
    type: {
      type: String,
      enum: ['national', 'regional', 'university', 'college']
    }
  }],
  workingDays: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
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

export default mongoose.model("Semester", semesterSchema);
