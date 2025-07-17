import File from "../models/File.js";
import Attendance from "../models/attendance.js";
import Student from "../models/student.js";
import Subject from "../models/Subject.js";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";

// Upload file
const uploadFile = async (req, res) => {
  try {
    const { title, year, section, department, subject } = req.body;
    const uploaderName = req.user ? req.user.firstName : "Unknown";
    // Use department from request body if provided, otherwise fall back to user's department
    const uploaderDepartment = department || (req.user ? req.user.department : "Unknown");
    const uploaderId = req.user ? req.user.id : null;
    
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    
    const file = new File({
      title,
      subject,
      year,
      section,
      uploaderName,
      uploaderDepartment,
      uploaderId,
      filePath: req.file.path,
    });
    
    await file.save();
    res.json({ success: true, file });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all files
const getFiles = async (req, res) => {
  try {
    const files = await File.find()
      .populate('uploaderId', 'firstName lastName department') // Populate uploader details
      .sort({ createdAt: -1 });
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get files by department (for students to see files from their department faculty)
const getFilesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const files = await File.find({ 
      uploaderDepartment: { $regex: department, $options: "i" } 
    })
      .populate('uploaderId', 'firstName lastName department')
      .sort({ createdAt: -1 });
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Download file
const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file)
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    res.download(path.resolve(file.filePath));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete file
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file)
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    fs.unlinkSync(file.filePath);
    await file.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Download student attendance data as PDF
const downloadStudentAttendance = async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;

    // Fetch student and subject details
    const student = await Student.findById(studentId);
    const subject = await Subject.findById(subjectId);

    if (!student || !subject) {
      return res
        .status(404)
        .json({ success: false, message: "Student or subject not found" });
    }

    // Fetch attendance data for this student and subject
    const attendanceRecords = await Attendance.find({
      student: studentId,
      subject: subjectId,
    }).sort({ date: 1 });

    // Calculate attendance statistics
    const totalClasses = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(
      (record) => record.status === "present"
    ).length;
    const absentCount = totalClasses - presentCount;
    const attendancePercentage =
      totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;

    // Create PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${student.name}_attendance_report.pdf"`
    );

    doc.pipe(res);

    // Add content to PDF with simple colors
    doc
      .fontSize(20)
      .fillColor("black")
      .text("Student Attendance Report", { align: "center" });
    doc.moveDown();

    // Student Information
    doc
      .fontSize(14)
      .fillColor("blue")
      .text("Student Information:", { underline: true });
    doc.fontSize(12).fillColor("black").text(`Name: ${student.name}`);
    doc.text(`Email: ${student.email}`);
    doc.text(`Department: ${student.department}`);
    doc.text(`Section: ${student.section}`);
    doc.text(`Year: ${student.year}`);
    doc.moveDown();

    // Subject Information
    doc
      .fontSize(14)
      .fillColor("blue")
      .text("Subject Information:", { underline: true });
    doc.fontSize(12).fillColor("black").text(`Subject: ${subject.name}`);
    doc.moveDown();

    // Attendance Summary
    doc
      .fontSize(14)
      .fillColor("blue")
      .text("Attendance Summary:", { underline: true });
    doc.fontSize(12).fillColor("black").text(`Total Classes: ${totalClasses}`);
    doc.text(`Present: ${presentCount}`);
    doc.text(`Absent: ${absentCount}`);
    doc.text(`Attendance Percentage: ${attendancePercentage}%`);
    doc.moveDown();

    // Detailed Attendance Records
    if (attendanceRecords.length > 0) {
      doc
        .fontSize(14)
        .fillColor("blue")
        .text("Detailed Attendance Records:", { underline: true });
      doc.moveDown();

      attendanceRecords.forEach((record, index) => {
        const date = new Date(record.date).toLocaleDateString();
        const status =
          record.status.charAt(0).toUpperCase() + record.status.slice(1);
        const reason = record.reason || "N/A";

        // Color code the status
        const statusColor = record.status === "present" ? "green" : "red";
        doc
          .fontSize(10)
          .fillColor("black")
          .text(`${index + 1}. Date: ${date} | `);
        doc
          .fillColor(statusColor)
          .text(`Status: ${status}`, { continued: true });
        doc.fillColor("black").text(` | Reason: ${reason}`);
      });
    } else {
      doc
        .fontSize(12)
        .fillColor("black")
        .text("No attendance records found for this student and subject.");
    }

    doc.end();
  } catch (error) {
    console.error("Error generating attendance PDF:", error);
    res
      .status(500)
      .json({ success: false, message: "Error generating attendance report" });
  }
};

// Helper function to fetch student attendance data
const fetchStudentAttendanceData = async (studentId, subjectId) => {
  // This is a placeholder - implement based on your attendance data structure
  // You'll need to query your attendance model/collection
  try {
    // Example: const Attendance = require("../models/attendance");
    // return await Attendance.find({ studentId, subjectId }).sort({ date: -1 });
    return [];
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    return [];
  }
};

export {
  uploadFile,
  getFiles,
  getFilesByDepartment,
  downloadFile,
  deleteFile,
  downloadStudentAttendance,
  fetchStudentAttendanceData,
};
