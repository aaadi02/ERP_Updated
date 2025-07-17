import mongoose from "mongoose";

// Simple schema for Faculty-Department-Subject relationships
const facultyDepartmentSubjectSchema = new mongoose.Schema({
  // Faculty Information (Reference to Faculty collection)
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true,
    index: true
  },
  
  // Department Information
  department: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and string
    required: true,
    index: true
  },
  
  // Subjects assigned to this faculty
  assignedSubjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminSubject",
      required: true
    },
    // Academic year for which this subject is assigned
    academicYear: {
      type: String,
      required: true,
      default: "2025-2026"
    },
    // Semester for which this subject is assigned
    semester: {
      type: String,
      required: true,
      enum: ["1", "2", "3", "4", "5", "6", "7", "8"]
    },
    // Section for which this subject is assigned
    section: {
      type: String,
      required: true,
      default: "A"
    },
    // When this subject was assigned
    assignedAt: {
      type: Date,
      default: Date.now
    },
    // Status of assignment
    status: {
      type: String,
      enum: ["active", "inactive", "completed"],
      default: "active"
    }
  }],
  
  // Record status
  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Simple pre-save middleware
facultyDepartmentSubjectSchema.pre('save', async function(next) {
  next(); // No validation for simplicity
});

// Simple static methods

// Get all faculty assignments for a specific department
facultyDepartmentSubjectSchema.statics.getFacultyByDepartment = function(departmentId) {
  return this.find({ department: departmentId, isActive: true })
    .populate('faculty', 'firstName lastName email')
    .populate('assignedSubjects.subject', 'name code');
};

// Get all subjects taught by a specific faculty
facultyDepartmentSubjectSchema.statics.getSubjectsByFaculty = function(facultyId) {
  return this.find({ faculty: facultyId, isActive: true })
    .populate('assignedSubjects.subject', 'name code');
};

// Instance methods

// Add a subject to faculty
facultyDepartmentSubjectSchema.methods.addSubject = function(subjectId, academicYear, semester, section = 'A') {
  this.assignedSubjects.push({
    subject: subjectId,
    academicYear,
    semester,
    section,
    status: 'active'
  });
  
  return this.save();
};

// Remove a subject from faculty
facultyDepartmentSubjectSchema.methods.removeSubject = function(subjectId, academicYear, semester, section) {
  this.assignedSubjects = this.assignedSubjects.filter(
    assignment => !(assignment.subject.toString() === subjectId.toString() &&
                   assignment.academicYear === academicYear &&
                   assignment.semester === semester &&
                   assignment.section === section)
  );
  
  return this.save();
};

const FacultyDepartmentSubject = mongoose.model("FacultyDepartmentSubject", facultyDepartmentSubjectSchema);

export default FacultyDepartmentSubject;
