import mongoose from "mongoose";

const lectureLogSchema = new mongoose.Schema({
  subjectSchedule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubjectSchedule',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  
  // Lecture Details
  lectureNumber: {
    type: Number,
    required: true
  },
  lectureDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    default: 1, // in hours
  },
  
  // Content Covered
  unitCovered: {
    type: Number, // which unit was covered
  },
  topicsCovered: [String],
  syllabusPercentage: {
    type: Number, // percentage of syllabus covered in this lecture
  },
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'conducted', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  
  // Notes
  facultyNotes: String,
  studentsFeedback: String,
  
  // Attendance
  attendanceMarked: {
    type: Boolean,
    default: false
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

export default mongoose.model("LectureLog", lectureLogSchema);
