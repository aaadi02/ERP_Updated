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
  getCCClassStudents,
  deleteCCAssignment,
  removeHodRole,
  removePrincipalRole,
  assignSubject,
  unassignSubject,
  getFacultySubjects,
  getStudentsBySubject,
  getStudentsByDepartment,
  getStudentsWithAttendance,
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
router.get("/get-cc-class-students", protect, getCCClassStudents);
router.post("/delete-cc-assignment", deleteCCAssignment);
router.patch("/remove-hod/:facultyId", removeHodRole);
router.patch("/remove-principal/:facultyId", removePrincipalRole);
router.post("/assign-subject", assignSubject);
router.post("/unassign-subject", unassignSubject);
router.get("/subjects/:employeeId", getFacultySubjects);
router.get("/students/subject/:subjectId", getStudentsBySubject);
router.get("/students/department/:department", protect, getStudentsByDepartment);
router.get("/students-attendance/department/:department", protect, getStudentsWithAttendance); // New route for students with attendance and caste sorting

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
    console.log("[FacultiesByDepartment] Fetching faculties for exact department:", departmentName);

    let faculties = [];
    let searchApproaches = [];

    // Approach 1: Try different direct string matches
    const directMatches = [
      departmentName, // exact as provided
      departmentName.toLowerCase(),
      departmentName.toUpperCase(),
      'Computer Science',
      'Electrical', 
      'Mechanical',
      'Electronics Engineering'
    ];

    for (const matchTerm of directMatches) {
      if (faculties.length > 0) break;
      
      try {
        console.log(`[FacultiesByDepartment] Trying direct match: "${matchTerm}"`);
        faculties = await Faculty.find({
          department: matchTerm
        })
          .populate({
            path: 'subjectsTaught',
            model: 'AdminSubject',
            select: 'name'
          })
          .sort({ firstName: 1 })
          .lean();
        
        if (faculties.length > 0) {
          searchApproaches.push(`Direct match "${matchTerm}": ${faculties.length} found`);
          console.log(`[FacultiesByDepartment] Direct match "${matchTerm}" found: ${faculties.length} faculties`);
          break;
        }
      } catch (err) {
        console.log(`[FacultiesByDepartment] Direct match "${matchTerm}" failed:`, err.message);
        searchApproaches.push(`Direct match "${matchTerm}" failed: ${err.message}`);
      }
    }

    // Approach 2: Get all faculties and filter in JavaScript (fallback)
    if (faculties.length === 0) {
      try {
        console.log("[FacultiesByDepartment] Trying to get all faculties for filtering...");
        const allFaculties = await Faculty.find({})
          .populate({
            path: 'subjectsTaught',
            model: 'AdminSubject',
            select: 'name'
          })
          .sort({ firstName: 1 })
          .lean();
        
        // Filter faculties by department name (case insensitive partial match)
        faculties = allFaculties.filter(faculty => {
          const facultyDept = (faculty.department || '').toString().toLowerCase();
          const searchDept = departmentName.toLowerCase();
          
          return facultyDept.includes(searchDept) || 
                 searchDept.includes(facultyDept) ||
                 (facultyDept.includes('computer') && searchDept.includes('computer')) ||
                 (facultyDept.includes('electrical') && (searchDept.includes('electrical') || searchDept.includes('eletronic'))) ||
                 (facultyDept.includes('mechanical') && searchDept.includes('mechanical')) ||
                 (facultyDept.includes('electronics') && (searchDept.includes('electronics') || searchDept.includes('eletronic')));
        });
        
        searchApproaches.push(`JavaScript filter: ${faculties.length} found from ${allFaculties.length} total`);
        console.log(`[FacultiesByDepartment] JavaScript filtering found: ${faculties.length} faculties from ${allFaculties.length} total`);
        
        // Debug: Show what departments we found
        const foundDepartments = [...new Set(allFaculties.map(f => f.department))];
        console.log("[FacultiesByDepartment] Available departments:", foundDepartments);
        searchApproaches.push(`Available departments: ${foundDepartments.join(', ')}`);
        
      } catch (err) {
        console.log("[FacultiesByDepartment] JavaScript filtering failed:", err.message);
        searchApproaches.push(`JavaScript filtering failed: ${err.message}`);
      }
    }

    // Approach 3: Try with AcademicDepartment ObjectId approach (if still no match)
    if (faculties.length === 0) {
      try {
        console.log("[FacultiesByDepartment] Trying ObjectId approach...");
        const AcademicDepartment = await import("../models/AcademicDepartment.js").then(m => m.default);
        
        const academicDepartments = await AcademicDepartment.find({});
        console.log("[FacultiesByDepartment] Available academic departments:", academicDepartments.map(d => d.name));
        
        // Find academic department with case-insensitive partial match
        let academicDepartment = academicDepartments.find(dept => 
          dept.name.toLowerCase().includes(departmentName.toLowerCase()) ||
          departmentName.toLowerCase().includes(dept.name.toLowerCase())
        );

        if (academicDepartment) {
          console.log('[FacultiesByDepartment] Found academic department:', academicDepartment.name);
          
          faculties = await Faculty.find({ department: academicDepartment._id })
            .populate({
              path: 'department',
              model: 'AcademicDepartment', 
              select: 'name'
            })
            .populate({
              path: 'subjectsTaught',
              model: 'AdminSubject',
              select: 'name'
            })
            .sort({ firstName: 1 })
            .lean();
            
          searchApproaches.push(`ObjectId match with "${academicDepartment.name}": ${faculties.length} found`);
          console.log(`[FacultiesByDepartment] ObjectId approach found: ${faculties.length} faculties`);
        } else {
          searchApproaches.push('ObjectId approach: No matching academic department found');
        }
      } catch (err) {
        console.log("[FacultiesByDepartment] ObjectId approach failed:", err.message);
        searchApproaches.push(`ObjectId approach failed: ${err.message}`);
      }
    }
    
    console.log("[FacultiesByDepartment] Total faculties found:", faculties.length);
    console.log("[FacultiesByDepartment] Search approaches tried:", searchApproaches);

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
        const calculatedFromJoining = Math.max(0, totalYears);
        calculatedExperience = Math.max(faculty.teachingExperience || 0, calculatedFromJoining);
      }

      return {
        ...faculty,
        name: faculty.name || `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim(),
        // Get department name from populated data or use the stored string value
        department: faculty.department?.name || faculty.department || departmentName,
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
      department: departmentName,
      count: formattedFaculties.length,
      searchApproaches: searchApproaches
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

// Debug route to check actual department names in database
router.get("/debug/check-department-names", async (req, res) => {
  try {
    const AcademicDepartment = await import("../models/AcademicDepartment.js").then(m => m.default);
    
    // Get all academic departments
    const academicDepartments = await AcademicDepartment.find({}).select('name').lean();
    
    // Get all faculty departments with their counts - handle both ObjectId and string values
    const facultyDepartments = await Faculty.aggregate([
      {
        $project: {
          department: 1,
          departmentType: { $type: "$department" },
          departmentString: {
            $cond: {
              if: { $eq: [{ $type: "$department" }, "string"] },
              then: "$department",
              else: null
            }
          }
        }
      },
      {
        $group: {
          _id: {
            department: "$department",
            type: "$departmentType",
            stringValue: "$departmentString"
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get simple faculty sample without population first
    const facultiesSample = await Faculty.find({})
      .select('firstName lastName department')
      .limit(10)
      .lean();
    
    console.log("Academic Departments:", academicDepartments);
    console.log("Faculty Department Groups:", facultyDepartments);
    console.log("Sample Faculty with Departments:", facultiesSample);
    
    res.json({
      success: true,
      data: {
        academicDepartments: academicDepartments,
        facultyDepartmentGroups: facultyDepartments,
        sampleFacultiesWithDepartments: facultiesSample,
        totalAcademicDepartments: academicDepartments.length,
        totalFacultyDepartmentGroups: facultyDepartments.length
      }
    });
  } catch (error) {
    console.error("Debug check department names error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
