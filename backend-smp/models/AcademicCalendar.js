import mongoose from "mongoose";

const academicCalendarSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      required: true,
      enum: ["1", "2", "3", "4", "5", "6", "7", "8"],
    },
    department: {
      type: String,
      required: true,
    },
    institutionName: {
      type: String,
      default: "NAGARJUNA UNIVERSITY",
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminSubject",
      required: true,
    },
    subjectName: {
      type: String,
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    facultyName: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
    topics: [
      {
        topicName: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        plannedDate: {
          type: Date,
          required: true,
        },
        actualDate: {
          type: Date,
        },
        duration: {
          type: Number, // in hours
          required: true,
          default: 1,
        },
        lectureType: {
          type: String,
          enum: ["Theory", "Practical", "Tutorial", "Assignment", "Test", "Other"],
          default: "Theory",
        },
        status: {
          type: String,
          enum: ["Planned", "In Progress", "Completed", "Postponed", "Cancelled"],
          default: "Planned",
        },
        notes: {
          type: String,
          trim: true,
        },
        completionPercentage: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        resources: [
          {
            type: String,
            trim: true,
          },
        ],
        assignments: [
          {
            title: String,
            description: String,
            dueDate: Date,
            marks: Number,
          },
        ],
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalPlannedHours: {
      type: Number,
      default: 0,
    },
    totalCompletedHours: {
      type: Number,
      default: 0,
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Draft", "Active", "Completed", "Archived"],
      default: "Draft",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate totals
academicCalendarSchema.pre("save", function (next) {
  if (this.topics && this.topics.length > 0) {
    this.totalPlannedHours = this.topics.reduce((total, topic) => total + (topic.duration || 0), 0);
    
    const completedTopics = this.topics.filter(topic => topic.status === "Completed");
    this.totalCompletedHours = completedTopics.reduce((total, topic) => total + (topic.duration || 0), 0);
    
    this.progressPercentage = this.totalPlannedHours > 0 
      ? Math.round((this.totalCompletedHours / this.totalPlannedHours) * 100) 
      : 0;
  }
  
  this.lastUpdated = new Date();
  next();
});

// Index for efficient queries
academicCalendarSchema.index({ department: 1, academicYear: 1, semester: 1 });
academicCalendarSchema.index({ subject: 1, academicYear: 1 });
academicCalendarSchema.index({ faculty: 1, academicYear: 1 });
academicCalendarSchema.index({ createdBy: 1 });

export default mongoose.models.AcademicCalendar || mongoose.model("AcademicCalendar", academicCalendarSchema);
