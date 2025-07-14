
import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true }, // Custom student ID (e.g., ST12345)
  firstName: { type: String, required: true },
  lastName: { type: String, default: "" },
  stream: { type: String, default: "N/A" },
  department: { type: String, default: "N/A" },
  casteCategory: { type: String, default: "N/A" },
  subCaste: { type: String, default: "N/A" },
  mobileNumber: { type: String, default: "N/A" },
  enrollmentNumber: { type: String, default: "N/A" },
  scholarshipStatus: { type: String, enum: ["Yes", "No"], required: true },
  pdfs: [{
    year: { type: Number, required: true }, // Year of the course (e.g., 1, 2, 3, 4)
    pdfUrl: { type: String, required: true }, // Cloudinary PDF URL
    remark: { type: String, default: "" }, // Remark for the specific year
    uploadedAt: { type: Date, default: Date.now } // Timestamp for when this PDF was uploaded
  }],
}, { timestamps: true });

export default mongoose.model("Scholarship", scholarshipSchema);