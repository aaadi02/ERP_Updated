// Route for faculty-subject assignments
import express from "express";
import Faculty from "../models/faculty.js";
import AdminSubject from "../models/AdminSubject.js";
import AcademicDepartment from "../models/AcademicDepartment.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET faculty-subject assignments for a specific subject
router.get("/subject-faculty/:subjectId", protect, async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    // Find all faculties who teach this subject
    const faculties = await Faculty.find({
      subjectsTaught: subjectId,
      status: "Active",
      type: { $in: ["teaching", "HOD", "principal"] }
    }).select('employeeId firstName lastName email department subjectsTaught');
    
    res.status(200).json({
      success: true,
      message: "Faculty assignments retrieved successfully",
      data: faculties.map(faculty => ({
        id: faculty._id,
        employeeId: faculty.employeeId,
        name: `${faculty.firstName} ${faculty.lastName}`.trim(),
        email: faculty.email,
        department: faculty.department
      }))
    });
    
  } catch (error) {
    console.error("Error fetching faculty for subject:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching faculty assignments",
      error: error.message
    });
  }
});

// GET faculty-subject assignments by subject name
router.get("/subject-faculty-by-name/:subjectName", protect, async (req, res) => {
  try {
    const { subjectName } = req.params;
    const { department } = req.query;
    
    let query = { name: { $regex: new RegExp(subjectName, 'i') } };
    
    // If department is provided, find the department ObjectId first
    if (department) {
      const academicDepartment = await AcademicDepartment.findOne({ 
        name: { $regex: new RegExp(department, 'i') }
      });
      
      if (academicDepartment) {
        query.department = academicDepartment._id;
      }
    }
    
    // Find the subject
    const subject = await AdminSubject.findOne(query).populate('department', 'name');
    
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }
    
    // Find all faculties who teach this subject
    const faculties = await Faculty.find({
      subjectsTaught: subject._id,
      status: "Active",
      type: { $in: ["teaching", "HOD", "principal"] },
      ...(department && { department })
    }).select('employeeId firstName lastName email department subjectsTaught');
    
    res.status(200).json({
      success: true,
      message: "Faculty assignments retrieved successfully",
      data: {
        subject: {
          id: subject._id,
          name: subject.name,
          code: subject.code,
          department: subject.department?.name || 'Unknown'
        },
        faculties: faculties.map(faculty => ({
          id: faculty._id,
          employeeId: faculty.employeeId,
          name: `${faculty.firstName} ${faculty.lastName}`.trim(),
          email: faculty.email,
          department: faculty.department
        }))
      }
    });
    
  } catch (error) {
    console.error("Error fetching faculty for subject by name:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching faculty assignments",
      error: error.message
    });
  }
});

// GET all faculty-subject mappings for a department
router.get("/department-faculty-subjects/:department", protect, async (req, res) => {
  try {
    const { department } = req.params;
    console.log(`[Faculty-Subject API] Fetching data for department: ${department}`);
    
    // First, find the department ObjectId in AcademicDepartment collection
    const academicDepartment = await AcademicDepartment.findOne({ 
      name: { $regex: new RegExp(department, 'i') }
    });
    
    if (!academicDepartment) {
      console.log(`[Faculty-Subject API] Academic department not found: ${department}`);
      return res.status(404).json({
        success: false,
        message: `Academic department "${department}" not found`
      });
    }
    
    console.log(`[Faculty-Subject API] Found academic department ID: ${academicDepartment._id}`);
    
    // Get all subjects for the department using the ObjectId
    const subjects = await AdminSubject.find({ 
      department: academicDepartment._id 
    }).select('name code').populate('department', 'name');
    
    console.log(`[Faculty-Subject API] Found ${subjects.length} subjects for ${department}`);
    
    // Get all faculties for the department using the ObjectId
    const faculties = await Faculty.find({
      department: academicDepartment._id, // Use ObjectId for department
      status: "Active",
      type: { $in: ["teaching", "HOD", "principal"] }
    }).populate({
      path: 'subjectsTaught',
      select: 'name code',
      populate: {
        path: 'department',
        select: 'name'
      }
    }).select('employeeId firstName lastName email subjectsTaught');
    
    console.log(`[Faculty-Subject API] Found ${faculties.length} faculties for ${department}`);
    
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
      if (faculty.subjectsTaught && Array.isArray(faculty.subjectsTaught)) {
        faculty.subjectsTaught.forEach(subject => {
          if (subject && subject.name && subjectFacultyMap[subject.name]) {
            subjectFacultyMap[subject.name].faculties.push({
              id: faculty._id,
              employeeId: faculty.employeeId,
              name: `${faculty.firstName} ${faculty.lastName}`.trim(),
              email: faculty.email
            });
          }
        });
      }
    });
    
    console.log(`[Faculty-Subject API] Built mapping for ${Object.keys(subjectFacultyMap).length} subjects`);
    
    res.status(200).json({
      success: true,
      message: "Department faculty-subject mapping retrieved successfully",
      data: {
        department,
        academicDepartmentId: academicDepartment._id,
        totalSubjects: subjects.length,
        totalFaculties: faculties.length,
        subjectFacultyMap
      }
    });
    
  } catch (error) {
    console.error("Error fetching department faculty-subject mapping:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching faculty-subject mapping",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST assign faculty to subject
router.post("/assign-faculty-subject", async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] POST /api/faculty-subject/assign-faculty-subject`);
    console.log('[ASSIGN] Request body:', req.body);
    
    const { facultyId, subjectId } = req.body;
    
    if (!facultyId || !subjectId) {
      console.log('[ASSIGN] Missing required fields:', { facultyId, subjectId });
      return res.status(400).json({
        success: false,
        message: "Faculty ID and Subject ID are required"
      });
    }
    
    console.log('[ASSIGN] Looking for faculty:', facultyId);
    
    // Verify faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      console.log('[ASSIGN] Faculty not found');
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }
    
    console.log('[ASSIGN] Found faculty:', faculty.firstName, faculty.lastName);
    console.log('[ASSIGN] Looking for subject:', subjectId);
    
    // Verify subject exists
    const subject = await AdminSubject.findById(subjectId);
    if (!subject) {
      console.log('[ASSIGN] Subject not found');
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }
    
    console.log('[ASSIGN] Found subject:', subject.name);
    
    // Check if already assigned
    if (faculty.subjectsTaught.includes(subjectId)) {
      console.log('[ASSIGN] Already assigned');
      return res.status(400).json({
        success: false,
        message: "Faculty is already assigned to this subject"
      });
    }
    
    console.log('[ASSIGN] Adding subject to faculty');
    
    // Add subject to faculty's subjectsTaught
    faculty.subjectsTaught.push(subjectId);
    await faculty.save();
    
    console.log('[ASSIGN] Assignment successful');
    
    res.status(200).json({
      success: true,
      message: "Faculty assigned to subject successfully",
      data: {
        faculty: `${faculty.firstName} ${faculty.lastName}`,
        subject: subject.name
      }
    });
    
  } catch (error) {
    console.error("[ASSIGN] Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while assigning faculty to subject",
      error: error.message
    });
  }
});

// DELETE remove faculty from subject
router.delete("/remove-faculty-subject", protect, async (req, res) => {
  try {
    const { facultyId, subjectId } = req.body;
    
    if (!facultyId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "Faculty ID and Subject ID are required"
      });
    }
    
    // Find and update faculty
    const faculty = await Faculty.findByIdAndUpdate(
      facultyId,
      { $pull: { subjectsTaught: subjectId } },
      { new: true }
    );
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Faculty removed from subject successfully"
    });
    
  } catch (error) {
    console.error("Error removing faculty from subject:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing faculty from subject",
      error: error.message
    });
  }
});

// Test route for faculty-subject assignment (without authentication)
router.post("/test-assign-faculty-subject", async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] POST /api/faculty-subject/test-assign-faculty-subject`);
    console.log('[TEST ASSIGN] Request body:', req.body);
    
    const { facultyId, subjectId } = req.body;
    
    if (!facultyId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "Faculty ID and Subject ID are required"
      });
    }
    
    console.log('[TEST ASSIGN] Looking for faculty:', facultyId);
    
    // Find faculty
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      console.log('[TEST ASSIGN] Faculty not found');
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }
    
    console.log('[TEST ASSIGN] Found faculty:', faculty.firstName, faculty.lastName);
    
    console.log('[TEST ASSIGN] Looking for subject:', subjectId);
    
    // Find subject
    const subject = await AdminSubject.findById(subjectId);
    if (!subject) {
      console.log('[TEST ASSIGN] Subject not found');
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }
    
    console.log('[TEST ASSIGN] Found subject:', subject.name);
    
    // Check if already assigned
    const isAlreadyAssigned = faculty.subjectsTaught.some(
      subj => subj._id?.toString() === subjectId || subj.toString() === subjectId
    );
    
    if (isAlreadyAssigned) {
      console.log('[TEST ASSIGN] Already assigned');
      return res.status(200).json({
        success: false,
        message: "Faculty is already assigned to this subject"
      });
    }
    
    console.log('[TEST ASSIGN] Adding subject to faculty');
    
    // Add subject to faculty
    faculty.subjectsTaught.push(subjectId);
    await faculty.save();
    
    console.log('[TEST ASSIGN] Assignment successful');
    
    res.status(200).json({
      success: true,
      message: "Subject assigned to faculty successfully",
      data: {
        facultyId: faculty._id,
        facultyName: `${faculty.firstName} ${faculty.lastName}`,
        subjectId: subject._id,
        subjectName: subject.name
      }
    });
    
  } catch (error) {
    console.error('[TEST ASSIGN] Error:', error);
    res.status(500).json({
      success: false,
      message: "Server error while assigning faculty to subject",
      error: error.message
    });
  }
});

export default router;
