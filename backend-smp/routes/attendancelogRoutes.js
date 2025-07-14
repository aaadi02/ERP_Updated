import express from "express";
import {
  getAttendanceLogs,
  getAttendanceLog,
  createAttendanceLog,
  updateAttendanceLog,
  deleteAttendanceLog,
} from "../controllers/attendanceController.js";

const router = express.Router();

// Removed the protect middleware for open-source access

router.route("/").get(getAttendanceLogs).post(createAttendanceLog);

router
  .route("/:id")
  .get(getAttendanceLog)
  .put(updateAttendanceLog)
  .delete(deleteAttendanceLog);

export default router;
