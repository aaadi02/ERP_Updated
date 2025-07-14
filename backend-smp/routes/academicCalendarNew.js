import express from "express";
import {
  createAcademicYear,
  createSemester,
  createSubjectSchedule,
  getFacultyCalendar,
  updateLectureProgress,
  getDepartmentCalendar,
  logLecture,
  getActiveAcademicYear
} from "../controllers/academicCalendarNewController.js";
import { protect as auth } from "../middleware/auth.js";

const router = express.Router();

// Academic Year Management (Admin/Principal only)
router.post("/academic-year", auth, createAcademicYear);
router.get("/academic-year/active", auth, getActiveAcademicYear);

// Semester Management (Admin/Principal only)
router.post("/semester", auth, createSemester);

// Subject Schedule Management (HOD)
router.post("/subject-schedule", auth, createSubjectSchedule);
router.get("/department/:departmentId", auth, getDepartmentCalendar);

// Faculty Calendar Views
router.get("/faculty/:facultyId", auth, getFacultyCalendar);
router.put("/schedule/:scheduleId/progress", auth, updateLectureProgress);

// Lecture Logging
router.post("/lecture-log", auth, logLecture);

export default router;
