import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String }, // Added subject field
  year: { type: String, required: true },
  section: { type: String, required: true },
  uploaderName: { type: String },
  uploaderDepartment: { type: String }, // Added sender's department
  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" }, // Added sender's ID for reference
  filePath: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("File", fileSchema);
