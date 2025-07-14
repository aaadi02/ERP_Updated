import mongoose from "mongoose";

const adminSubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AcademicDepartment", // Reference AdminDepartment
    required: true,
  },
});

export default mongoose.model("AdminSubject", adminSubjectSchema);
