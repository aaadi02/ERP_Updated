import express from "express";
import upload from "../middleware/upload.js";
import File from "../models/File.js";
import {
  uploadFile,
  getFiles,
  getFilesByDepartment,
  downloadFile,
  deleteFile,
  downloadStudentAttendance,
} from "../controllers/fileController.js";
import { protect } from "../middleware/auth.js";
import { protectStudent } from "../middleware/studentAuth.js";

const router = express.Router();

// List all files
router.get("/", getFiles);
// Get files by department (for students)
router.get("/department/:department", getFilesByDepartment);
// Upload a file (protected)
router.post("/", protect, upload.single("file"), uploadFile);
// Download a file
router.get("/download/:id", downloadFile);
// Delete a file (protected)
router.delete("/:id", protect, deleteFile);
// Download student attendance data (protected)
router.get(
  "/student-attendance/:studentId/:subjectId/download",
  protect,
  downloadStudentAttendance
);
// Get files for logged-in student (filtered by their department)
router.get("/student/my-files", protectStudent, async (req, res) => {
  try {
    const studentDepartment = req.user.department?.name;
    if (!studentDepartment) {
      return res.status(400).json({
        success: false,
        message: "Student department not found",
      });
    }

    const files = await File.find({
      uploaderDepartment: { $regex: studentDepartment, $options: "i" },
    })
      .populate("uploaderId", "firstName lastName department")
      .sort({ createdAt: -1 });

    res.json({ success: true, files, department: studentDepartment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
