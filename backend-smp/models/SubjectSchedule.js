import mongoose from "mongoose";

const subjectScheduleSchema = new mongoose.Schema({
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicYear',
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  
  // Lecture Planning
  totalLecturesRequired: {
    type: Number,
    required: true, // Total lectures needed for syllabus completion
  },
  lectureHours: {
    type: Number,
    default: 1, // Each lecture duration in hours
  },
  totalHoursRequired: {
    type: Number, // totalLecturesRequired * lectureHours
  },
  
  // Weekly Schedule
  weeklyLectures: {
    type: Number,
    required: true, // How many lectures per week
  },
  
  // Syllabus Breakdown
  syllabusUnits: [{
    unitNumber: Number,
    unitName: String,
    topics: [String],
    plannedLectures: Number,
    completedLectures: {
      type: Number,
      default: 0
    },
    startDate: Date,
    targetEndDate: Date,
    actualEndDate: Date,
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed', 'delayed'],
      default: 'not-started'
    }
  }],
  
  // Progress Tracking
  progress: {
    lecturesCompleted: {
      type: Number,
      default: 0
    },
    percentageCompleted: {
      type: Number,
      default: 0
    },
    isOnTrack: {
      type: Boolean,
      default: true
    },
    expectedCompletionDate: Date,
    actualPace: {
      type: String,
      enum: ['ahead', 'on-time', 'behind'],
      default: 'on-time'
    }
  },
  
  // Important Dates
  syllabusStartDate: {
    type: Date,
    required: true
  },
  syllabusEndDate: {
    type: Date,
    required: true
  },
  
  // Created by HOD
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Approval Status
  approvalStatus: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'revision-required'],
    default: 'draft'
  },
  
  remarks: String,
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Calculate total hours before saving
subjectScheduleSchema.pre('save', function(next) {
  this.totalHoursRequired = this.totalLecturesRequired * this.lectureHours;
  
  // Calculate progress percentage
  if (this.totalLecturesRequired > 0) {
    this.progress.percentageCompleted = Math.round(
      (this.progress.lecturesCompleted / this.totalLecturesRequired) * 100
    );
  }
  
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("SubjectSchedule", subjectScheduleSchema);
