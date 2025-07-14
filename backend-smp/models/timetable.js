import mongoose from "mongoose";

const timetableSchema = new mongoose.Schema(
  {
    collegeInfo: {
      name: { type: String, trim: true },
      status: { type: String, trim: true },
      address: { type: String, trim: true },
      department: { type: String, required: true, trim: true },
      year: { type: String, trim: true },
      semester: { type: String, required: true, trim: true },
      section: { type: String, required: true, trim: true, uppercase: true },
      date: { type: String, trim: true },
      room: { type: String, trim: true },
    },
    subjects: [
      {
        code: { type: String, trim: true },
        name: { type: String, required: true, trim: true },
        faculty: { type: String, trim: true },
      },
    ],
    timetableData: [
      {
        day: { type: String, required: true, trim: true },
        classes: [
          {
            subject: { type: String, trim: true },
            type: { type: String, enum: ['Theory', 'Practical', 'Break', 'Free'], default: 'Theory' },
            faculty: { type: String, trim: true },
            colSpan: { type: Number, min: 1, max: 6, default: 1 },
            timeSlot: { type: String, trim: true }
          },
        ],
      },
    ],
    timeSlots: [{ type: String, required: true, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    isActive: { type: Boolean, default: true },
    academicYear: { type: String, trim: true }
  },
  { 
    timestamps: true,
    // Add index for better query performance
    index: [
      { 'collegeInfo.department': 1, 'collegeInfo.semester': 1, 'collegeInfo.section': 1 },
      { 'createdBy': 1 },
      { 'isActive': 1 }
    ]
  }
);

// Add compound unique index to prevent duplicate timetables
timetableSchema.index(
  { 
    'collegeInfo.department': 1, 
    'collegeInfo.semester': 1, 
    'collegeInfo.section': 1 
  }, 
  { 
    unique: true,
    name: 'unique_department_semester_section'
  }
);

// Pre-save middleware for data validation and cleanup
timetableSchema.pre('save', function(next) {
  // Ensure section is uppercase
  if (this.collegeInfo && this.collegeInfo.section) {
    this.collegeInfo.section = this.collegeInfo.section.toUpperCase();
  }
  
  // Validate timetableData structure
  if (this.timetableData && Array.isArray(this.timetableData)) {
    this.timetableData.forEach(dayData => {
      if (dayData.classes && Array.isArray(dayData.classes)) {
        dayData.classes.forEach(classData => {
          // Ensure colSpan is within valid range
          if (classData.colSpan && (classData.colSpan < 1 || classData.colSpan > 6)) {
            classData.colSpan = 1;
          }
        });
      }
    });
  }
  
  next();
});

export default mongoose.model("Timetable", timetableSchema);
