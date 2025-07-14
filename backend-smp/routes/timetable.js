import express from "express";
import jwt from "jsonwebtoken";
import Student from "../models/StudentManagement.js";
import {
  getAllTimetables,
  createTimetable,
  updateTimetable,
  deleteTimetable,
} from "../controllers/timetableController.js";
import { protect } from "../middleware/auth.js";
import { validateCCTimetableAccess, validateCCTimetableAccessForDelete } from "../middleware/ccAccess.js";

// Middleware that allows both faculty and student authentication
const protectFacultyOrStudent = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: "No token provided"
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log("Token decoded:", { 
        type: decoded.type, 
        role: decoded.role, 
        id: decoded.id, 
        employeeId: decoded.employeeId 
      });

      // Check if it's a student token
      if (decoded.type === "student") {
        console.log("Processing as student token");
        // Use student authentication
        const student = await Student.findById(decoded.id)
          .populate("department", "name")
          .populate("stream", "name")
          .populate("semester", "number");

        if (!student) {
          console.log("Student not found in database");
          return res.status(401).json({
            success: false,
            error: "Student not found"
          });
        }

        req.student = student;
        req.user = {
          id: student._id,
          studentId: student.studentId,
          department: student.department,
          stream: student.stream,
          semester: student.semester,
          section: student.section,
          type: "student"
        };
        console.log("Student authenticated:", student.studentId);
      } else {
        console.log("Processing as faculty/staff token");
        // Faculty, Principal, or other type of authentication
        req.user = decoded;
        req.faculty = decoded;
        console.log("Faculty/Principal authenticated:", decoded.employeeId || decoded.id, "Type:", decoded.type, "Role:", decoded.role);
      }

      next();
    } catch (error) {
      console.error("Authentication error:", error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: "Invalid token"
        });
      } else if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: "Token expired"
        });
      }
      
      return res.status(401).json({
        success: false,
        error: "Not authorized, token failed"
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      error: "Not authorized, no token provided"
    });
  }
};

const router = express.Router();

// GET route - allows both faculty and student authentication
router.get("/", protectFacultyOrStudent, getAllTimetables);

// Debug route to test authentication
router.get("/test-auth", protectFacultyOrStudent, (req, res) => {
  res.json({
    success: true,
    message: "Authentication successful",
    user: req.user,
    userType: req.user?.type || "unknown"
  });
});

// POST route - CC access control for creating timetables
router.post("/", protect, validateCCTimetableAccess, createTimetable);

// PUT route - CC access control for updating timetables
router.put("/:id", protect, validateCCTimetableAccess, updateTimetable);

// DELETE route - CC access control for deleting timetables
router.delete("/:id", protect, validateCCTimetableAccessForDelete, deleteTimetable);

export default router;
