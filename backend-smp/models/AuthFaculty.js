import mongoose from "mongoose";

const authFacultySchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "Teaching",
      "HOD",
      "Student Management",
      "Account Section Management",
      "Document Section Management",
      "Scholarship Management",
      "Notification System Management",
      "Library Management",
      "Bus Management",
      "Hostel Management",
    ],
    required: true,
  },
  employmentStatus: {
    type: String,
    enum: ["Probation Period", "Permanent Employee"],
    default: "Probation Period",
  },
  employeeId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String }, // Flexible for frontend grouping
});

export default mongoose.models.AuthFaculty || mongoose.model("AuthFaculty", authFacultySchema);