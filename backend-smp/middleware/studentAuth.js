// middleware/studentAuth.js
import jwt from "jsonwebtoken";
import Student from "../models/StudentManagement.js";

// Middleware for student authentication
const protectStudent = async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if token is for a student
      if (decoded.type !== "student") {
        return res.status(401).json({ 
          success: false,
          error: "Not authorized. Student access only." 
        });
      }

      // Get student data from database
      const student = await Student.findById(decoded.id)
        .populate("department", "name")
        .populate("stream", "name")
        .populate("semester", "number");

      if (!student) {
        return res.status(401).json({ 
          success: false,
          error: "Student not found" 
        });
      }

      // Attach student data to request
      req.student = student;
      req.user = {
        id: student._id,
        studentId: student.studentId,
        department: student.department,
        stream: student.stream,
        semester: student.semester,
        section: student.section, // section is a string field
        type: "student"
      };

      next();
    } catch (error) {
      console.error("Student auth error:", error);
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

export { protectStudent };
