import express from "express";
import {
  createAcademicCalendar,
  getAcademicCalendars,
  getAcademicCalendarById,
  updateAcademicCalendar,
  updateTopicStatus,
  publishAcademicCalendar,
  deleteAcademicCalendar,
  getAcademicCalendarAnalytics,
} from "../controllers/academicCalendarController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Create academic calendar (HOD only)
router.post("/", protect, createAcademicCalendar);

// Get academic calendars with filters
router.get("/", protect, getAcademicCalendars);

// Get analytics
router.get("/analytics", protect, getAcademicCalendarAnalytics);

// Get academic calendar by ID
router.get("/:id", protect, getAcademicCalendarById);

// Update academic calendar
router.put("/:id", protect, updateAcademicCalendar);

// Update topic status
router.patch("/:id/topics/:topicId", protect, updateTopicStatus);

// Publish academic calendar
router.patch("/:id/publish", protect, publishAcademicCalendar);

// Delete academic calendar
router.delete("/:id", protect, deleteAcademicCalendar);

export default router;
