import express from "express";
import upload from "../middleware/upload.js";
import { protect } from "../middleware/auth.js";
import {
  facultyRegister,
  staffLogin,
  updatePassword,
  updateFaculty,
  deleteFaculty,
  getStudent,
  getFaculties,
  getLastEmployeeId,
  assignCC,
  getCCAssignments,
  deleteCCAssignment,
  removeHodRole,
  removePrincipalRole,
  assignSubject,
  unassignSubject,
  getFacultySubjects,
  getStudentsBySubject,
  getStudentsByDepartment,
} from "../controllers/facultyController.js";
import {
  getHodHistory,
  getPrincipalHistory,
  assignHod,
  assignPrincipal,
} from "../controllers/facultyHistoryController.js";
import Department from "../models/Department.js";
import Student from "../models/student.js";
import Subject from "../models/Subject.js";
import AdminSubject from "../models/AdminSubject.js";
import Faculty from "../models/faculty.js";
import mongoose from "mongoose";

const router = express.Router();

router.post(
  "/register",
  upload.fields([
    { name: "imageUpload", maxCount: 1 },
    { name: "signatureUpload", maxCount: 1 },
  ]),
  facultyRegister
);
router.post("/login", staffLogin);
router.post("/updatepassword", updatePassword);
router.put("/update/:email", updateFaculty);
router.delete("/delete/:facultyId", deleteFaculty);
router.post("/getstudent", getStudent);
router.get("/faculties", getFaculties);
router.get("/last-id", getLastEmployeeId);
router.get("/hod-history", getHodHistory);
router.get("/principal-history", getPrincipalHistory);
router.post("/assign-hod", assignHod);
router.post("/assign-principal", assignPrincipal);
router.post("/assign-cc", assignCC);
router.get("/cc-assignments", getCCAssignments);
router.post("/delete-cc-assignment", deleteCCAssignment);
router.patch("/remove-hod/:facultyId", removeHodRole);
router.patch("/remove-principal/:facultyId", removePrincipalRole);
router.post("/assign-subject", assignSubject);
router.post("/unassign-subject", unassignSubject);
router.get("/subjects/:employeeId", getFacultySubjects);
router.get("/students/subject/:subjectId", getStudentsBySubject);
router.get("/students/department/:department", protect, getStudentsByDepartment);

// Temporary test route without authentication
router.get("/debug/students/:department", async (req, res) => {
  try {
    const { department } = req.params;

    console.log(`Testing students endpoint for department: ${department}`);

    // Find department
    const departmentDoc = await Department.findOne({
      name: { $regex: new RegExp(`^${department}$`, "i") },
    });

    console.log("Found department:", departmentDoc);

    if (!departmentDoc) {
      return res.json({ success: false, message: "Department not found" });
    }

    // Let's also check how many students total exist
    const totalStudents = await Student.countDocuments();
    console.log(`Total students in database: ${totalStudents}`);

    // Let's see all students and their department ObjectIds
    const allStudents = await Student.find({})
      .select("firstName lastName department studentId")
      .lean();
    console.log("All students with their departments:", allStudents);

    // Find students with exact ObjectId match
    console.log("Looking for students with department ObjectId:", departmentDoc._id);
    const students = await Student.find({ department: departmentDoc._id })
      .populate("department", "name")
      .select(
        "firstName middleName lastName email studentId department semester section"
      )
      .lean();

    console.log(`Found ${students.length} students for department ObjectId ${departmentDoc._id}`);

    res.json({
      success: true,
      department: departmentDoc,
      totalStudentsInDB: totalStudents,
      studentCount: students.length,
      allStudentsPreview: allStudents.slice(0, 3), // First 3 for preview
      students: students,
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add this temporary debug route to list all departments
router.get("/debug/departments", async (req, res) => {
  try {
    const departments = await Department.find({}).select("name departmentCode");
    res.json({
      success: true,
      departments: departments,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check specific student endpoint
router.get("/debug/student/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log(`Looking for student with ID: ${studentId}`);
    
    const student = await Student.findById(studentId)
      .populate('department', 'name')
      .lean();
    
    console.log('Found student:', student);
    
    if (!student) {
      return res.json({ success: false, message: "Student not found" });
    }
    
    res.json({
      success: true,
      student: student
    });
  } catch (error) {
    console.error('Debug student endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test different query types
router.get("/debug/query-test/:department", async (req, res) => {
  try {
    const { department } = req.params;
    
    console.log(`Testing different queries for department: ${department}`);
    
    // Find department
    const departmentDoc = await Department.findOne({ 
      name: { $regex: new RegExp(`^${department}$`, 'i') }
    });
    
    if (!departmentDoc) {
      return res.json({ success: false, message: "Department not found" });
    }
    
    console.log('Department ObjectId:', departmentDoc._id);
    console.log('Department ObjectId as string:', departmentDoc._id.toString());
    
    // Test 1: Query with ObjectId
    const studentsWithObjectId = await Student.find({ 
      department: departmentDoc._id 
    }).lean();
    
    // Test 2: Query with string
    const studentsWithString = await Student.find({ 
      department: departmentDoc._id.toString() 
    }).lean();
    
    // Test 3: Query with both (using $in)
    const studentsWithBoth = await Student.find({ 
      department: { $in: [departmentDoc._id, departmentDoc._id.toString()] }
    }).lean();
    
    console.log(`ObjectId query found: ${studentsWithObjectId.length}`);
    console.log(`String query found: ${studentsWithString.length}`);
    console.log(`Both query found: ${studentsWithBoth.length}`);
    
    res.json({
      success: true,
      department: departmentDoc,
      results: {
        objectIdQuery: studentsWithObjectId.length,
        stringQuery: studentsWithString.length,
        bothQuery: studentsWithBoth.length,
        students: studentsWithBoth
      }
    });
  } catch (error) {
    console.error('Query test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET faculties by department
router.get("/department/:departmentName", async (req, res) => {
  try {
    const { departmentName } = req.params;
    console.log("[FacultiesByDepartment] Fetching faculties for department:", departmentName);

    // Department name corrections for common typos
    const departmentCorrections = {
      'eletronic enigneering': 'Electronics',
      'electronics engineering': 'Electronics',
      'electronics': 'Electronics',
      'computer science engineering': 'Computer Science',
      'computer science': 'Computer Science',
      'mechanical engineering': 'Mechanical',
      'mechanical': 'Mechanical',
      'civil engineering': 'Civil',
      'civil': 'Civil',
      'electrical engineering': 'Electrical',
      'electrical': 'Electrical'
    };

    // Try to correct department name
    const normalizedDeptName = departmentName.toLowerCase().trim();
    const correctedDeptName = departmentCorrections[normalizedDeptName] || departmentName;

    console.log("[FacultiesByDepartment] Department name correction:", {
      original: departmentName,
      normalized: normalizedDeptName,
      corrected: correctedDeptName
    });

    // Find faculties using multiple department name variations
    let faculties;
    let populationError = null;
    
    // Create query with multiple department name variations
    const departmentVariations = [
      departmentName,          // Original input
      correctedDeptName,       // Corrected name
      normalizedDeptName       // Normalized name
    ];

    // Remove duplicates and create case-insensitive regex patterns
    const uniqueVariations = [...new Set(departmentVariations)];
    const departmentQuery = {
      $or: uniqueVariations.map(variation => ({
        department: { $regex: new RegExp(`^${variation}$`, 'i') }
      }))
    };

    console.log("[FacultiesByDepartment] Using query:", JSON.stringify(departmentQuery, null, 2));
    
    try {
      // Try with population of subjectsTaught first
      console.log("[FacultiesByDepartment] Attempting population of subjectsTaught...");
      faculties = await Faculty.find(departmentQuery)
        .populate({
          path: 'subjectsTaught',
          model: 'AdminSubject'
        })
        .sort({ firstName: 1 })
        .lean();
      console.log("[FacultiesByDepartment] Population successful");
    } catch (err) {
      // If population fails due to bad data, try again without population
      populationError = err.message;
      console.warn("[FacultiesByDepartment] Population failed, trying without:", err.message);
      faculties = await Faculty.find(departmentQuery)
        .sort({ firstName: 1 })
        .lean();
    }
    
    console.log("[FacultiesByDepartment] Faculties found:", faculties.length);

    // Debug logging for subjects
    faculties.forEach((faculty, index) => {
      console.log(`[FacultiesByDepartment] Faculty ${index + 1} (${faculty.employeeId}):`, {
        name: faculty.name || `${faculty.firstName} ${faculty.lastName}`,
        subjectsTaught: faculty.subjectsTaught,
        subjectsTaughtLength: Array.isArray(faculty.subjectsTaught) ? faculty.subjectsTaught.length : 'Not array',
        subjectsTaughtType: typeof faculty.subjectsTaught
      });
    });

    // Format faculties with proper name handling and full data
    const formattedFaculties = faculties.map(faculty => {
      // Calculate experience from dateOfJoining
      let calculatedExperience = faculty.teachingExperience || 0;
      if (faculty.dateOfJoining) {
        const joiningDate = new Date(faculty.dateOfJoining);
        const currentDate = new Date();
        const yearsDiff = currentDate.getFullYear() - joiningDate.getFullYear();
        const monthsDiff = currentDate.getMonth() - joiningDate.getMonth();
        const daysDiff = currentDate.getDate() - joiningDate.getDate();
        
        // More precise calculation including months
        let totalYears = yearsDiff;
        if (monthsDiff < 0 || (monthsDiff === 0 && daysDiff < 0)) {
          totalYears -= 1;
        }
        
        // Use the maximum of stored experience and calculated experience
        // This handles cases where faculty had previous experience before joining this institution
        const calculatedFromJoining = Math.max(0, totalYears);
        calculatedExperience = Math.max(faculty.teachingExperience || 0, calculatedFromJoining);
      }

      return {
        ...faculty,
        name: faculty.name || `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim(),
        // Include both original and calculated experience for frontend decision
        teachingExperience: calculatedExperience,
        originalExperience: faculty.teachingExperience || 0,
        calculatedExperienceFromJoining: faculty.dateOfJoining ? (() => {
          const joiningDate = new Date(faculty.dateOfJoining);
          const currentDate = new Date();
          const yearsDiff = currentDate.getFullYear() - joiningDate.getFullYear();
          const monthsDiff = currentDate.getMonth() - joiningDate.getMonth();
          const daysDiff = currentDate.getDate() - joiningDate.getDate();
          let totalYears = yearsDiff;
          if (monthsDiff < 0 || (monthsDiff === 0 && daysDiff < 0)) {
            totalYears -= 1;
          }
          return Math.max(0, totalYears);
        })() : 0,
        // Ensure subjectsTaught is always an array
        subjectsTaught: Array.isArray(faculty.subjectsTaught) ? faculty.subjectsTaught : []
      };
    });

    res.json({
      success: true,
      message: "Faculties retrieved successfully",
      data: formattedFaculties,
      department: correctedDeptName,
      warning: populationError ? `Population error: ${populationError}` : undefined,
    });
  } catch (error) {
    console.error("[FacultiesByDepartment] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching faculties",
      error: error.message,
    });
  }
});

// Get faculties by subject ID
router.get("/subject/:subjectId", async (req, res) => {
  try {
    const { subjectId } = req.params;
    console.log("[FacultiesBySubject] Fetching faculties for subject:", subjectId);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID format",
        data: [],
      });
    }

    // Find faculties who teach this subject
    const faculties = await Faculty.find({ 
      subjectsTaught: subjectId,
      status: "Active" 
    })
      .select("firstName lastName employeeId email role department")
      .sort({ firstName: 1 });
    
    console.log("[FacultiesBySubject] Faculties found:", faculties.length);

    const formattedFaculties = faculties.map(faculty => ({
      _id: faculty._id,
      name: `${faculty.firstName} ${faculty.lastName}`,
      employeeId: faculty.employeeId,
      email: faculty.email,
      role: faculty.role,
      department: faculty.department
    }));

    res.json({
      success: true,
      message: "Faculties retrieved successfully",
      data: formattedFaculties,
    });
  } catch (error) {
    console.error("[FacultiesBySubject] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching faculties by subject",
      error: error.message,
    });
  }
});

export default router;
