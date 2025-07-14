import mongoose from "mongoose";

const academicDepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  stream: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stream",
    required: true,
  },
});

export default mongoose.model("AcademicDepartment", academicDepartmentSchema);