import express from "express";
import { queryAttendance } from "../controllers/attendanceQueryController.js";

const router = express.Router();

// GET /api/faculty/attendance/query
router.get("/query", queryAttendance);

export default router;
