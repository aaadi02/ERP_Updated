import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  middleName: {
    type: String,
  },
  lastName: {
    type: String,
    required: true,
  },
  fatherName: {
    type: String,
  },
  unicodeFatherName: {
    type: String,
  },
  motherName: {
    type: String,
  },
  unicodeMotherName: {
    type: String,
  },
  unicodeName: {
    type: String,
  },
  enrollmentNumber: {
    type: String,
    required: true,
    unique: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  mobileNumber: {
    type: String,
  },
  guardianNumber: {
    type: String,
  },
  casteCategory: {
    type: String,
  },
  subCaste: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },
  section: {
    type: String,
    required: true,
  },
  admissionType: {
    type: String,
  },
  admissionThrough: {
    type: String,
  },
  remark: {
    type: String,
  },
  stream: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stream",
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AcademicDepartment", // Updated to match AcademicDepartment
    required: true,
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdminSubject", // Updated to match AdminSubject
  }],
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
  },
  dateOfBirth: {
    type: Date,
  },
  moralCharacter: {
    type: String,
  },
  nationality: {
    type: String,
  },
  abcId: {
    type: String,
  },
  placeOfBirth: {
    type: String,
  },
  schoolAttended: {
    type: String,
  },
  nameOfInstitute: {
    type: String,
  },
  semesterRecords: [{
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
    },
    subjects: [{
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdminSubject", // Updated to match AdminSubject
      },
      status: String,
      marks: Number,
    }],
    isBacklog: {
      type: Boolean,
      default: false,
    },
  }],
  admissionDate: {
    type: Date,
  },
  backlogs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdminSubject", // Updated to match AdminSubject
  }],
  studentId: {
    type: String,
    unique: true,
  },
  dateOfBirthInWords: {
    type: String,
  },
  photo: {
    type: String,
  },
}, {
  timestamps: true,
});

export default mongoose.model("student", studentSchema);
