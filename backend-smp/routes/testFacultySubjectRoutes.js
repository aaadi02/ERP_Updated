// Temporary route to test faculty-subject API without auth
import express from "express";
import Faculty from "../models/faculty.js";
import AdminSubject from "../models/AdminSubject.js";
import AcademicDepartment from "../models/AcademicDepartment.js";

const router = express.Router();

// GET department faculty-subject mapping WITHOUT AUTH (for testing)
router.get("/test-department-faculty-subjects/:department", async (req, res) => {
  try {
    const { department } = req.params;
    console.log(`[TEST API] Fetching data for department: "${department}"`);
    
    // First, find the department ObjectId in AcademicDepartment collection
    const academicDepartment = await AcademicDepartment.findOne({ 
      name: { $regex: new RegExp(department, 'i') }
    });
    
    if (!academicDepartment) {
      console.log(`[TEST API] Academic department not found: ${department}`);
      return res.status(404).json({
        success: false,
        message: `Academic department "${department}" not found`
      });
    }
    
    console.log(`[TEST API] Found academic department ID: ${academicDepartment._id}`);
    
    // Get all subjects for the department using the ObjectId
    const subjects = await AdminSubject.find({ 
      department: academicDepartment._id 
    }).select('name code').populate('department', 'name');
    console.log(`[TEST API] Found ${subjects.length} subjects:`, subjects.map(s => s.name));
    
    // Get all faculties for the department using the ObjectId
    const faculties = await Faculty.find({
      department: academicDepartment._id, // Use ObjectId for department
      status: "Active"
    }).populate({
      path: 'subjectsTaught',
      select: 'name code',
      populate: {
        path: 'department',
        select: 'name'
      }
    }).select('employeeId firstName lastName email subjectsTaught');
    
    console.log(`[TEST API] Found ${faculties.length} active faculties for ${department}`);
    
    // Build subject-faculty mapping
    const subjectFacultyMap = {};
    
    // Initialize all subjects with empty faculty arrays
    subjects.forEach(subject => {
      subjectFacultyMap[subject.name] = {
        subjectInfo: {
          id: subject._id,
          name: subject.name,
          code: subject.code
        },
        faculties: []
      };
    });
    
    // Populate faculty for each subject
    faculties.forEach(faculty => {
      console.log(`[TEST API] Processing faculty: ${faculty.firstName} ${faculty.lastName}`);
      console.log(`[TEST API] Subjects taught:`, faculty.subjectsTaught?.map(s => s?.name || s));
      
      if (faculty.subjectsTaught && Array.isArray(faculty.subjectsTaught)) {
        faculty.subjectsTaught.forEach(subject => {
          if (subject && subject.name && subjectFacultyMap[subject.name]) {
            subjectFacultyMap[subject.name].faculties.push({
              id: faculty._id,
              employeeId: faculty.employeeId,
              name: `${faculty.firstName} ${faculty.lastName}`.trim(),
              email: faculty.email
            });
            console.log(`[TEST API] Added ${faculty.firstName} to ${subject.name}`);
          }
        });
      }
    });
    
    console.log(`[TEST API] Final mapping:`, Object.keys(subjectFacultyMap));
    
    res.status(200).json({
      success: true,
      message: "Department faculty-subject mapping retrieved successfully (TEST)",
      data: {
        department,
        academicDepartmentId: academicDepartment._id,
        totalSubjects: subjects.length,
        totalFaculties: faculties.length,
        subjectFacultyMap,
        debug: {
          subjectNames: subjects.map(s => s.name),
          facultyNames: faculties.map(f => `${f.firstName} ${f.lastName}`),
          facultyDepartments: faculties.map(f => f.department)
        }
      }
    });
    
  } catch (error) {
    console.error("[TEST API] Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching faculty-subject mapping (TEST)",
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;
