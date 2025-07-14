import AttendanceModel from "../models/attendance.js";
import mongoose from "mongoose";

// Get monthly attendance stats for a student in a subject
const getMonthlyStats = async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;
    const { month, year } = req.query; // month: 1-12, year: 4-digit
    if (!month || !year) {
      return res
        .status(400)
        .json({ success: false, message: "Month and year are required" });
    }
    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(subjectId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid studentId or subjectId" });
    }
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const records = await AttendanceModel.find({
      student: studentId,
      subject: subjectId,
      date: { $gte: start, $lt: end },
    });
    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    res.json({ total, present, absent, percentage, records });
  } catch (err) {
    console.error("[getMonthlyStats] Error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message, stack: err.stack });
  }
};

// Get overall attendance stats for a student in a subject
const getOverallStats = async (req, res) => {
  try {
    const { studentId, subjectId } = req.params;
    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(subjectId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid studentId or subjectId" });
    }
    const records = await AttendanceModel.find({
      student: studentId,
      subject: subjectId,
    }).populate("student");
    const total = records.length;
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    res.json({ total, present, absent, percentage, records });
  } catch (err) {
    console.error("[getOverallStats] Error:", err);
    res
      .status(500)
      .json({ success: false, message: err.message, stack: err.stack });
  }
};

export { getMonthlyStats, getOverallStats };
