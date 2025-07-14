import express from "express";
import Faculty from "../models/faculty.js";
import Student from "../models/student.js";
import AdminSubject from "../models/AdminSubject.js";
import Attendance from "../models/attendance.js";

const router = express.Router();

// POST /api/faculty/markattendance
router.post("/", async (req, res) => {
  try {
    const { subjectId, facultyId, selectedStudents = [], date } = req.body;
    if (
      !subjectId ||
      !facultyId ||
      !Array.isArray(selectedStudents) ||
      selectedStudents.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "subjectId, facultyId, and selectedStudents[] are required",
      });
    }
    const adminSubject = await AdminSubject.findById(subjectId);
    if (!adminSubject)
      return res
        .status(404)
        .json({ success: false, message: "Subject not found" });
    const faculty =
      (await Faculty.findOne({ employeeId: facultyId })) ||
      (await Faculty.findById(facultyId));
    if (!faculty)
      return res
        .status(404)
        .json({ success: false, message: "Faculty not found" });
    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance is already marked for today by this faculty for this subject
    const existingAttendance = await Attendance.findOne({
      subject: subjectId,
      faculty: faculty._id,
      date: today,
    });

    // If attendance already exists, return appropriate message
    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance has already been marked for today for this subject",
        alreadyMarked: true,
      });
    }

    // Mark attendance for each selected student as present, others as absent
    const allStudents = await Student.find({ subjects: subjectId });
    if (!allStudents.length)
      return res.status(404).json({
        success: false,
        message: "No students found for this subject",
      });

    // Remove any previous attendance for this subject/date (should not happen now due to check above)
    // await Attendance.deleteMany({ subject: subjectId, date: today });

    // Prepare attendance records
    const records = allStudents.map((student) => ({
      student: student._id,
      subject: adminSubject._id,
      faculty: faculty._id,
      date: today,
      status: selectedStudents.includes(student._id.toString())
        ? "present"
        : "absent",
    }));
    await Attendance.insertMany(records);
    res.json({ success: true, message: "Attendance marked for all students." });
  } catch (error) {
    console.error("Mark Attendance Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/faculty/attendance/:subjectId?date=YYYY-MM-DD
router.get("/attendance/:subjectId", async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { date } = req.query;
    const query = { subject: subjectId };
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      query.date = d;
    }
    const records = await Attendance.find(query)
      .populate("student")
      .populate("faculty");
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
