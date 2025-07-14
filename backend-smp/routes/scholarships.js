

import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import fileUpload from 'express-fileupload';
import Scholarship from '../models/Scholarship.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware for file uploads
router.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
}));

router.get("/", async (req, res) => {
  try {
    const scholarships = await Scholarship.find();
    console.log("Fetched scholarships:", scholarships);
    res.json(scholarships);
  } catch (err) {
    console.error("Error in GET /api/scholarships:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: "Request body is missing" });
    }

    const {
      studentId,
      firstName,
      lastName,
      stream,
      department,
      casteCategory,
      subCaste,
      mobileNumber,
      enrollmentNumber,
      scholarshipStatus,
    } = req.body;

    if (!studentId || !firstName || !scholarshipStatus) {
      return res.status(400).json({ error: "Missing required fields: studentId, firstName, scholarshipStatus" });
    }

    const scholarship = await Scholarship.findOneAndUpdate(
      { studentId },
      {
        studentId,
        firstName,
        lastName: lastName || "",
        stream: stream || "N/A",
        department: department || "N/A",
        casteCategory: casteCategory || "N/A",
        subCaste: subCaste || "N/A",
        mobileNumber: mobileNumber || "N/A",
        enrollmentNumber: enrollmentNumber || "N/A",
        scholarshipStatus,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(scholarship);
  } catch (err) {
    console.error("Error in POST /api/scholarships:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/upload-pdf", async (req, res) => {
  try {
    if (!req.files || !req.files.pdf) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const { studentId, year } = req.body;
    if (!studentId || !year) {
      return res.status(400).json({ error: "Missing studentId or year" });
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1) {
      return res.status(400).json({ error: "Invalid year" });
    }

    const pdfFile = req.files.pdf;
    if (pdfFile.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "File must be a PDF" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(pdfFile.tempFilePath, {
      resource_type: "raw",
      folder: "scholarship_pdfs",
      public_id: `scholarship_${studentId}_year_${year}_${Date.now()}`,
    });

    // Check if PDF for this year exists
    const scholarship = await Scholarship.findOne({ studentId });
    if (!scholarship) {
      return res.status(404).json({ error: "Scholarship not found" });
    }

    const existingPDF = scholarship.pdfs.find((pdf) => pdf.year === yearNum);

    let update;
    if (existingPDF) {
      // Update existing PDF
      update = await Scholarship.findOneAndUpdate(
        { studentId, "pdfs.year": yearNum },
        { $set: { "pdfs.$.pdfUrl": result.secure_url, "pdfs.$.uploadedAt": new Date() } },
        { new: true }
      );
    } else {
      // Add new PDF
      update = await Scholarship.findOneAndUpdate(
        { studentId },
        { $push: { pdfs: { year: yearNum, pdfUrl: result.secure_url, remark: "", uploadedAt: new Date() } } },
        { new: true }
      );
    }

    if (!update) {
      return res.status(404).json({ error: "Failed to update scholarship" });
    }

    res.json({ pdfUrl: result.secure_url });
  } catch (err) {
    console.error("Error in POST /api/scholarships/upload-pdf:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/add-remark", async (req, res) => {
  try {
    const { studentId, year, remark } = req.body;
    if (!studentId || !year || remark === undefined) {
      return res.status(400).json({ error: "Missing studentId, year, or remark" });
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1) {
      return res.status(400).json({ error: "Invalid year" });
    }

    const scholarship = await Scholarship.findOne({ studentId });
    if (!scholarship) {
      return res.status(404).json({ error: "Scholarship not found" });
    }

    const existingPDF = scholarship.pdfs.find((pdf) => pdf.year === yearNum);
    if (!existingPDF) {
      return res.status(404).json({ error: `No PDF found for year ${year}` });
    }

    const update = await Scholarship.findOneAndUpdate(
      { studentId, "pdfs.year": yearNum },
      { $set: { "pdfs.$.remark": remark } }, // Fixed syntax: "pdfs$.remark" → "pdfs.$.remark"
      { new: true }
    );

    if (!update) {
      return res.status(404).json({ error: "Failed to update remark" });
    }

    console.log(`Added remark for studentId: ${studentId}, year: ${year}, remark: ${remark}`);
    res.json({ message: "Remark added successfully", remark });
  } catch (err) {
    console.error("Error in POST /api/scholarships/add-remark:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add endpoint to get scholarship by enrollment number or student ID
router.get("/student/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by enrollmentNumber or studentId
    const scholarship = await Scholarship.findOne({
      $or: [
        { enrollmentNumber: identifier },
        { studentId: identifier }
      ]
    });
    
    if (!scholarship) {
      return res.status(404).json({ error: "Scholarship not found for this student" });
    }
    
    console.log("Found scholarship for student:", scholarship);
    res.json(scholarship);
  } catch (err) {
    console.error("Error in GET /api/scholarships/student:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;