import express from 'express';
import {
  getStudentWithFullDetails,
  getFacultyWithFullDetails,
  getAttendanceWithFullDetails,
  getAllStudentsWithDetails,
  getAllFacultiesWithDetails,
  getAccountStudentWithDetails,
  getAttendanceReportWithFullDetails
} from '../controllers/examplePopulatedController.js';

const router = express.Router();

// Student routes with full population
router.get('/students', getAllStudentsWithDetails);
router.get('/students/:studentId', getStudentWithFullDetails);

// Faculty routes with full population
router.get('/faculties', getAllFacultiesWithDetails);
router.get('/faculties/:facultyId', getFacultyWithFullDetails);

// Attendance routes with full population
router.get('/attendance/:attendanceId', getAttendanceWithFullDetails);
router.get('/attendance-report', getAttendanceReportWithFullDetails);

// Account Student routes with full population
router.get('/account-students/:studentId', getAccountStudentWithDetails);

export default router;
