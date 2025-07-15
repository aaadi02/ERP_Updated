
import mongoose from "mongoose";

const facultySchema = new mongoose.Schema({
  ccAssignments: [
    {
      academicYear: { type: String, required: true },
      semester: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Semester",
        required: true 
      },
      section: { type: String, required: true },
      department: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "AcademicDepartment",
        required: true 
      },
      assignedAt: { type: Date, default: Date.now },
    },
  ],
  employeeId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    enum: ["Mr", "Ms", "Mrs", "Dr", "Prof"],
    default: "Mr",
  },
  firstName: {
    type: String,
    default: "",
  },
  middleName: {
    type: String,
    default: "",
  },
  lastName: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/\S+@\S+\.\S+/, "Invalid email format"],
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    default: "Other",
  },
  designation: {
    type: String,
    default: "",
  },
  mobile: {
    type: String,
    match: [/^\d{10}$/, "Mobile number must be 10 digits"],
    default: "0000000000",
  },
  dateOfBirth: {
    type: Date,
    default: null,
  },
  dateOfJoining: {
    type: Date,
    default: null,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AcademicDepartment",
    required: true,
  },
  address: {
    type: String,
    default: "",
  },
  aadhaar: {
    type: String,
    match: [/^\d{12}$/, "Aadhaar number must be 12 digits"],
    default: "000000000000",
  },
  employmentStatus: {
    type: String,
    enum: ["Probation Period", "Permanent Employee"],
    default: "Probation Period",
  },
  status: {
    type: String,
    default: "Active",
    enum: ["Active", "Inactive"],
  },
  type: {
    type: String,
    required: true,
    enum: ["teaching", "non-teaching", "HOD", "principal", "cc"],
    default: "teaching",
  },
  role: {
    type: String,
    enum: [null, "hod", "principal"],
    default: null,
  },
  teachingExperience: {
    type: Number,
    default: 0,
  },
  subjectsTaught: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminSubject",
    },
  ],
  technicalSkills: {
    type: [String],
    default: [],
  },
  fathersName: {
    type: String,
    default: "",
  },
  rfidNo: {
    type: String,
    default: "",
  },
  sevarthNo: {
    type: String,
    default: "",
  },
  personalEmail: {
    type: String,
    default: "",
    match: [/\S+@\S+\.\S+/, "Invalid personal email format"],
  },
  communicationEmail: {
    type: String,
    default: "",
    match: [/\S+@\S+\.\S+/, "Invalid communication email format"],
  },
  spouseName: {
    type: String,
    default: "",
  },
  dateOfIncrement: {
    type: Date,
  },
  dateOfRetirement: {
    type: Date,
    default: null,
  },
  relievingDate: {
    type: Date,
  },
  payRevisedDate: {
    type: Date,
  },
  transportAllowance: {
    type: String,
    default: "NO",
    enum: ["YES", "NO"],
  },
  handicap: {
    type: String,
    default: "NO",
    enum: ["YES", "NO"],
  },
  seniorCitizen: {
    type: String,
    default: "NO",
    enum: ["YES", "NO"],
  },
  hra: {
    type: String,
    default: "NO",
    enum: ["YES", "NO"],
  },
  quarter: {
    type: String,
    default: "NO",
    enum: ["YES", "NO"],
  },
  bankName: {
    type: String,
    default: "",
  },
  panNumber: {
    type: String,
    match: [/^[A-Z]{5}\d{4}[A-Z]{1}$/, "Invalid PAN number format"],
    default: "",
  },
  motherTongue: {
    type: String,
    enum: [
      "Marathi",
      "Hindi",
      "English",
      "Tamil",
      "Telugu",
      "Kannada",
      "Malayalam",
      "Gujarati",
      "Bengali",
      "Punjabi",
      "Other",
    ],
    default: "Other",
  },
  designationNature: {
    type: String,
    enum: ["Permanent", "Temporary", "Contract", "Visiting"],
    default: "Contract",
  },
  pf: {
    type: String,
    default: "",
  },
  pfNumber: {
    type: String,
    default: "",
  },
  npsNumber: {
    type: String,
    default: "",
  },
  bankBranchName: {
    type: String,
    default: "",
  },
  uanNumber: {
    type: String,
    default: "",
  },
  ifscCode: {
    type: String,
    match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"],
    default: "",
  },
  esicNumber: {
    type: String,
    default: "",
  },
  pfApplicable: {
    type: String,
    enum: ["Yes", "No"],
    default: "No",
  },
  imageUpload: {
    type: String,
    default: "",
  },
  signatureUpload: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  password: {
    type: String,
  },
});

export default mongoose.models.Faculty || mongoose.model("Faculty", facultySchema);