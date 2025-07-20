import mongoose from "mongoose";
import Department from "./AcademicDepartment.js";
import Stream from "./Stream.js";
import StudentCounter from "./StudentCounter.js";

// Utility function to convert number to words
const numberToWords = (num) => {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const thousands = ['', 'Thousand'];

  if (num === 0) return 'Zero';
  if (num < 10) return units[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) return `${tens[Math.floor(num / 10)]} ${units[num % 10]}`.trim();
  if (num < 1000) {
    return `${units[Math.floor(num / 100)]} Hundred ${num % 100 === 0 ? '' : numberToWords(num % 100)}`.trim();
  }
  if (num < 10000) {
    return `${numberToWords(Math.floor(num / 1000))} ${thousands[1]} ${num % 1000 === 0 ? '' : numberToWords(num % 1000)}`.trim();
  }
  return num.toString();
};

// Utility function to convert date to words
const dateToWords = (date) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  const dayInWords = numberToWords(day);
  const yearInWords = numberToWords(year);
  
  return `${dayInWords} ${month} ${yearInWords}`;
};

// Define the schema for subjects within semester records
const subjectRecordSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Passed", "Failed"],
    default: "Pending",
  },
  marks: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
});

// Define the schema for semester records
const semesterRecordSchema = new mongoose.Schema({
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
    required: true,
  },
  subjects: [subjectRecordSchema],
  isBacklog: {
    type: Boolean,
    default: false,
  },
});

// Define the schema for backlogs
const backlogSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
    required: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Cleared"],
    default: "Pending",
  },
});

// Define the main Student schema
const studentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    fatherName: {
      type: String,
      trim: true,
    },
    unicodeFatherName: {
      type: String,
      trim: true,
    },
    motherName: {
      type: String,
      trim: true,
    },
    unicodeMotherName: {
      type: String,
      trim: true,
    },
    unicodeName: {
      type: String,
      trim: true,
    },
    enrollmentNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    studentId: {
      type: String,
      unique: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other", "Transgender"],
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v) => /^\d{10}$/.test(v),
        message: (props) => `${props.value} is not a valid 10-digit mobile number!`,
      },
    },
    guardianNumber: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^\d{10}$/.test(v),
        message: (props) => `${props.value} is not a valid 10-digit guardian mobile number!`,
      },
    },
    address: {
      type: String,
      trim: true,
    },
    casteCategory: {
      type: String,
      trim: true,
    },
    subCaste: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      validate: {
        validator: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    section: {
      type: String,
      trim: true,
    },
    admissionType: {
      type: String,
      enum: ["Regular", "Direct Second Year", "Lateral Entry"],
    },
    admissionThrough: {
      type: String,
      trim: true,
    },
    remark: {
      type: String,
      trim: true,
    },
    stream: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stream",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicDepartment",
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
      },
    ],
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Semester",
    },
    dateOfBirth: {
      type: Date,
    },
    dateOfBirthInWords: {
      type: String,
      trim: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    moralCharacter: {
      type: String,
      default: "good",
      trim: true,
    },
    nationality: {
      type: String,
      trim: true,
    },
    abcId: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^\d{12}$/.test(v),
        message: (props) => `${props.value} is not a valid 12-digit ABC ID!`,
      },
    },
    photo: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => !v || /^https?:\/\/res\.cloudinary\.com\/.*$/.test(v),
        message: (props) => `${props.value} is not a valid Cloudinary URL!`,
      },
    },
    placeOfBirth: {
      type: String,
      trim: true,
    },
    schoolAttended: {
      type: String,
      trim: true,
    },
    nameOfInstitute: {
      type: String,
      default: "NAGARJUNA INSTITUTE OF ENGINEERING, TECHNOLOGY & MANAGEMENT, NAGPUR",
      trim: true,
    },
    customPassword: {
      type: String,
      trim: true,
      select: false, // Don't include in queries by default for security
    },
    passwordLastChanged: {
      type: Date,
      default: null,
    },
    loginEnabled: {
      type: Boolean,
      default: true,
    },
    semesterRecords: [semesterRecordSchema],
    backlogs: [backlogSchema],
  },
  { timestamps: true }
);

// Pre-save hook to generate studentId and dateOfBirthInWords
studentSchema.pre("save", async function (next) {
  try {
    // Generate studentId
    if (this.isNew && !this.studentId) {
      const department = await Department.findById(this.department);
      const stream = await Stream.findById(this.stream);

      if (!department || !stream) {
        throw new Error("Invalid department or stream reference");
      }

      const deptName = department.name.replace(/\ enquetes+/g, "").toUpperCase();
      const streamName = stream.name.replace(/\s+/g, "").toUpperCase();
      const key = `${deptName}-${streamName}`;

      const counter = await StudentCounter.findOneAndUpdate(
        { key },
        { $inc: { count: 1 } },
        { upsert: true, new: true }
      );

      const paddedCount = String(counter.count).padStart(3, "0");
      this.studentId = `${deptName}${streamName}${paddedCount}`;
    }

    // Generate dateOfBirthInWords from dateOfBirth
    if (this.dateOfBirth && !this.dateOfBirthInWords) {
      this.dateOfBirthInWords = dateToWords(new Date(this.dateOfBirth));
    }

    next();
  } catch (error) {
    next(error);
  }
});

const Student = mongoose.model("Student", studentSchema);

export default Student;