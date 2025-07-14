import Attendance from "../models/Attendancelog.js";

// Get all attendance logs
const getAttendanceLogs = async (req, res, next) => {
  try {
    // Populate student name for each attendance log
    const logs = await Attendance.find().populate("student");
    res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
};

// Get single attendance log by ID
const getAttendanceLog = async (req, res, next) => {
  try {
    // Populate student name for single log
    const log = await Attendance.findById(req.params.id).populate("student");

    console.log(log);
    if (!log) {
      return res.status(404).json({ message: "Attendance log not found" });
    }
    res.status(200).json(log);
  } catch (error) {
    next(error);
  }
};

// Create new attendance log
const createAttendanceLog = async (req, res, next) => {
  try {
    const log = await Attendance.create(req.body);
    res.status(201).json(log);
  } catch (error) {
    next(error);
  }
};

// Update attendance log (correction)
const updateAttendanceLog = async (req, res, next) => {
  try {
    // Allow updating status and reason
    const allowedFields = ["status", "reason"];
    const update = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });
    const log = await Attendance.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate("student", "name");
    if (!log) {
      return res.status(404).json({ message: "Attendance log not found" });
    }
    res.status(200).json(log);
  } catch (error) {
    next(error);
  }
};

// Delete attendance log
const deleteAttendanceLog = async (req, res, next) => {
  try {
    const log = await Attendance.findByIdAndDelete(req.params.id);
    if (!log) {
      return res.status(404).json({ message: "Attendance log not found" });
    }
    res.status(200).json({ message: "Attendance log deleted" });
  } catch (error) {
    next(error);
  }
};

export {
  getAttendanceLogs,
  getAttendanceLog,
  createAttendanceLog,
  updateAttendanceLog,
  deleteAttendanceLog,
};
