// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import Faculty from "../models/faculty.js"; // Ensure Faculty model is correctly imported
import Conductor from "../models/Conductor.js";
import Driver from "../models/Driver.js";

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

// Middleware specifically for conductor authentication
const protectConductor = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log("🔐 Conductor auth - decoded token:", decoded);

      // Check if user is a conductor
      if (decoded.role !== 'conductor' && decoded.type !== 'conductor') {
        return res.status(403).json({ 
          success: false,
          error: "Access denied. Conductor role required." 
        });
      }

      // Attach decoded token to req
      req.user = decoded;
      req.conductor = decoded;

      // Verify conductor exists in database
      const conductor = await Conductor.findById(decoded.id);
      if (!conductor) {
        return res.status(401).json({ 
          success: false,
          error: "Conductor not found" 
        });
      }

      console.log(`✅ Conductor authenticated: ${conductor.personalInfo?.firstName} (${decoded.employeeId})`);
      next();
    } catch (error) {
      console.error("❌ Conductor auth error:", error);
      return res.status(401).json({ 
        success: false,
        error: "Not authorized, token failed" 
      });
    }
  } else {
    return res.status(401).json({ 
      success: false,
      error: "Not authorized, no token" 
    });
  }
};

// Middleware specifically for driver authentication
const protectDriver = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log("🔐 Driver auth - decoded token:", decoded);

      // Check if user is a driver
      if (decoded.role !== 'driver' && decoded.type !== 'driver') {
        return res.status(403).json({ 
          success: false,
          error: "Access denied. Driver role required." 
        });
      }

      // Attach decoded token to req
      req.user = decoded;
      req.driver = decoded;

      // Verify driver exists in database
      const driver = await Driver.findById(decoded.id);
      if (!driver) {
        // Try to find by email if ID lookup fails
        if (decoded.email) {
          const driverByEmail = await Driver.findOne({ 'personalInfo.email': decoded.email });
          if (driverByEmail) {
            req.user = { ...decoded, _id: driverByEmail._id };
            console.log(`✅ Driver authenticated by email: ${driverByEmail.personalInfo?.firstName} (${decoded.employeeId || decoded.email})`);
            return next();
          }
        }
        return res.status(401).json({ 
          success: false,
          error: "Driver not found" 
        });
      }

      console.log(`✅ Driver authenticated: ${driver.personalInfo?.firstName} (${decoded.employeeId})`);
      next();
    } catch (error) {
      console.error("❌ Driver auth error:", error);
      return res.status(401).json({ 
        success: false,
        error: "Not authorized, token failed" 
      });
    }
  } else {
    return res.status(401).json({ 
      success: false,
      error: "Not authorized, no token" 
    });
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
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

export { protect, protectConductor, protectDriver, validateHODDepartment, restrictToAccountSection,authorize };