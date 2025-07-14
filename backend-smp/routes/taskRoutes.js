import express from "express";
import {
  createTask,
  getAllTasks,
  getPendingTasks,
  getSentTasks,
  getTaskById,
  updateTask,
  approveByHOD,
  approveByFaculty,
  getPendingHandoverForHOD,
  getPendingHandoverForFaculty
} from "../controllers/taskController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Define routes
router.post("/", createTask);
router.get("/", getAllTasks);
router.get("/pending/:receiverName", getPendingTasks);
router.get("/sent/:employeeId", getSentTasks);
router.get("/:id", getTaskById);
router.put("/:id", updateTask);

// HOD approval for charge handover
router.put("/:id/approve-hod", protect, approveByHOD);

// Faculty approval for charge handover
router.put("/:id/approve-faculty", protect, approveByFaculty);

// HOD: Get all pending handover requests for their department
router.get(
  "/pending-handover/hod",
  protect,
  getPendingHandoverForHOD
);

// Faculty: Get all pending handover requests for them
router.get(
  "/pending-handover/faculty",
  protect,
  getPendingHandoverForFaculty
);

export default router;
