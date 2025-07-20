import express from "express";
import jwt from "jsonwebtoken";
import Student from "../models/StudentManagement.js";
import upload from "../middleware/upload.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// Debug middleware for student auth routes
router.use((req, res, next) => {
  console.log(`[STUDENT AUTH ROUTE] ${req.method} ${req.path}`);
  next();
});

// Student login endpoint
router.post("/login", async (req, res) => {
  try {
    const { studentId, password } = req.body;

    console.log(`[STUDENT LOGIN] Attempting login for studentId: ${studentId}`);

    // Validate required fields
    if (!studentId || !password) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Password are required"
      });
    }

    // Find student by studentId (include customPassword field for comparison)
    const student = await Student.findOne({ studentId: studentId.trim() })
      .select('+customPassword') // Include customPassword field
      .populate("stream", "name")
      .populate("department", "name")
      .populate("semester", "number");

    if (!student) {
      console.log(`[STUDENT LOGIN] Student not found with ID: ${studentId}`);
      return res.status(404).json({
        success: false,
        message: "Student not found. Please check your Student ID."
      });
    }

    // Check if student login is enabled
    if (student.loginEnabled === false) {
      console.log(`[STUDENT LOGIN] Login disabled for student: ${studentId}`);
      return res.status(403).json({
        success: false,
        message: "Your account access has been disabled. Please contact administration."
      });
    }

    // Check if student has a custom password set
    if (student.customPassword) {
      console.log(`[STUDENT LOGIN] Using custom password for student: ${studentId}`);
      
      // Compare with custom password (you may want to hash this in production)
      if (password !== student.customPassword) {
        console.log(`[STUDENT LOGIN] Custom password mismatch for student: ${studentId}`);
        return res.status(401).json({
          success: false,
          message: "Invalid password."
        });
      }
    } else {
      console.log(`[STUDENT LOGIN] Using date of birth for student: ${studentId}`);
      
      // Use original date of birth verification logic
      if (!student.dateOfBirth) {
        console.log(`[STUDENT LOGIN] No date of birth set for student: ${studentId}`);
        return res.status(400).json({
          success: false,
          message: "Date of birth not set for this student. Please contact administration."
        });
      }

      // Validate password format (YYYYMMDD)
      if (!/^\d{8}$/.test(password)) {
        return res.status(400).json({
          success: false,
          message: "Password must be in YYYYMMDD format (8 digits)"
        });
      }

      // Convert password (YYYYMMDD) to date and compare with stored date of birth
      const year = parseInt(password.substring(0, 4));
      const month = parseInt(password.substring(4, 6)) - 1; // Month is 0-indexed in JavaScript
      const day = parseInt(password.substring(6, 8));
      
      // Validate date components
      if (year < 1900 || year > new Date().getFullYear() || month < 0 || month > 11 || day < 1 || day > 31) {
        return res.status(401).json({
          success: false,
          message: "Invalid date format in password. Please check your date of birth."
        });
      }
      
      // Create date object and get YYYYMMDD format for comparison
      const inputDate = new Date(year, month, day);
      const studentDOB = new Date(student.dateOfBirth);
      
      // Format both dates to YYYYMMDD for comparison
      const formatToYYYYMMDD = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}${m}${d}`;
      };
      
      const inputDateStr = formatToYYYYMMDD(inputDate);
      const studentDOBStr = formatToYYYYMMDD(studentDOB);

      console.log(`[STUDENT LOGIN] Input password: ${password}`);
      console.log(`[STUDENT LOGIN] Formatted input date: ${inputDateStr}`);
      console.log(`[STUDENT LOGIN] Formatted student DOB: ${studentDOBStr}`);

      if (inputDateStr !== studentDOBStr) {
        console.log(`[STUDENT LOGIN] Date of birth mismatch for student: ${studentId}`);
        return res.status(401).json({
          success: false,
          message: "Invalid password. Please check your date of birth."
        });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: student._id,
        studentId: student.studentId,
        email: student.email,
        type: "student"
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log(`[STUDENT LOGIN] Login successful for student: ${studentId}`);

    // Return success response with student data
    res.json({
      success: true,
      message: "Login successful",
      token,
      student: {
        _id: student._id,
        studentId: student.studentId,
        firstName: student.firstName,
        middleName: student.middleName,
        lastName: student.lastName,
        email: student.email,
        mobileNumber: student.mobileNumber,
        enrollmentNumber: student.enrollmentNumber,
        stream: student.stream,
        department: student.department,
        semester: student.semester,
        photo: student.photo,
        dateOfBirth: student.dateOfBirth
      }
    });

  } catch (error) {
    console.error("[STUDENT LOGIN] Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later."
    });
  }
});

// Student profile endpoint (requires authentication)
router.get("/profile", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Student token required."
      });
    }

    // Enhanced population to ensure all subject fields are included
    const student = await Student.findById(decoded.id)
      .populate("stream", "name")
      .populate("department", "name")
      .populate("semester", "number")
      .populate({
        path: "subjects",
        select: "name subjectCode code year department" // Include all relevant subject fields
      })
      .populate("semesterRecords.semester", "number")
      .populate({
        path: "semesterRecords.subjects.subject",
        select: "name subjectCode code year department" // Include all relevant subject fields
      })
      .populate({
        path: "backlogs.subject",
        select: "name subjectCode code year department" // Include all relevant subject fields
      })
      .populate("backlogs.semester", "number");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.json({
      success: true,
      student
    });

  } catch (error) {
    console.error("[STUDENT PROFILE] Error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Change password endpoint (requires authentication)
router.post("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log(`[STUDENT CHANGE PASSWORD] Attempting password change`);

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long"
      });
    }

    // Check for password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasSpecialChar) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least one uppercase letter, one lowercase letter, and one special character"
      });
    }

    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Student token required."
      });
    }

    // Find student and include customPassword field
    const student = await Student.findById(decoded.id).select('+customPassword');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Verify current password
    let currentPasswordValid = false;

    if (student.customPassword) {
      // Check against custom password
      currentPasswordValid = (currentPassword === student.customPassword);
    } else {
      // Check against date of birth (YYYYMMDD format)
      if (student.dateOfBirth) {
        const studentDOB = new Date(student.dateOfBirth);
        const formatToYYYYMMDD = (date) => {
          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const d = String(date.getDate()).padStart(2, '0');
          return `${y}${m}${d}`;
        };
        
        const expectedPassword = formatToYYYYMMDD(studentDOB);
        currentPasswordValid = (currentPassword === expectedPassword);
      }
    }

    if (!currentPasswordValid) {
      console.log(`[STUDENT CHANGE PASSWORD] Current password verification failed for student: ${student.studentId}`);
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Update password and set passwordLastChanged
    student.customPassword = newPassword;
    student.passwordLastChanged = new Date();
    
    await student.save();

    console.log(`[STUDENT CHANGE PASSWORD] Password changed successfully for student: ${student.studentId}`);

    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (error) {
    console.error("[STUDENT CHANGE PASSWORD] Error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// Upload profile photo endpoint (requires authentication)
router.post("/upload-photo", upload.single('photo'), async (req, res) => {
  try {
    console.log(`[STUDENT UPLOAD PHOTO] Attempting photo upload`);

    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token, authorization denied"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== "student") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Student token required."
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    // File validation is now handled by multer middleware
    // But we can add additional checks here if needed

    // Find student
    const student = await Student.findById(decoded.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Upload to Cloudinary using buffer from memory storage
    console.log(`[STUDENT UPLOAD PHOTO] Uploading to Cloudinary for student: ${student.studentId}`);
    
    // Convert buffer to base64 data URL for Cloudinary upload
    const uploadResult = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      {
        folder: 'student_profiles',
        public_id: `student_${student.studentId}_${Date.now()}`,
        transformation: [
          { width: 300, height: 300, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      }
    );

    console.log(`[STUDENT UPLOAD PHOTO] Cloudinary upload successful: ${uploadResult.secure_url}`);

    // Update student photo URL with Cloudinary URL
    student.photo = uploadResult.secure_url;
    
    await student.save();

    console.log(`[STUDENT UPLOAD PHOTO] Photo uploaded successfully for student: ${student.studentId}`);

    res.json({
      success: true,
      message: "Photo uploaded successfully",
      photoUrl: uploadResult.secure_url
    });

  } catch (error) {
    console.error("[STUDENT UPLOAD PHOTO] Error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
    if (error.message && error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again."
    });
  }
});

export default router;
