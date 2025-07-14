// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import Faculty from "../models/faculty.js"; // Ensure Faculty model is correctly imported

// Middleware for general authentication
const protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Attach decoded token to req (as faculty or user, depending on context)
      req.faculty = decoded; // Consistent with first file
      req.user = decoded; // Consistent with second file for HOD validation

      // Optional: Log decoded token for debugging
      console.log("Decoded token:", decoded);

      // Check for Account Section Management role (from first file)
      if (decoded.role === "Account Section Management") {
        return next(); // Allow access for Account Section Management
      }

      // If not Account Section Management, proceed to other role checks
      next();
    } catch (error) {
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ error: "Not authorized, no token" });
  }
};

// Middleware to validate HOD department access
const validateHODDepartment = async (req, res, next) => {
  try {
    if (req.user.role !== "hod" && req.user.role !== "HOD") {
      return res.status(403).json({ message: "Access denied. HOD role required." });
    }

    // Get HOD's faculty record to find their department
    const hodFaculty = await Faculty.findById(req.user.id);
    if (!hodFaculty) {
      return res.status(404).json({ message: "HOD faculty record not found" });
    }

    // Attach HOD's department to request for use in route handlers
    req.hodDepartment = hodFaculty.department;
    next();
  } catch (error) {
    console.error("HOD department validation error:", error);
    return res.status(500).json({ message: "Server error during HOD validation" });
  }
};

// Middleware for Account Section Management role (optional, if you want to separate it)
const restrictToAccountSection = async (req, res, next) => {
  if (req.faculty.role !== "Account Section Management") {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

export { protect, validateHODDepartment, restrictToAccountSection };