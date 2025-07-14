// Middleware to check CC (Class Coordinator) timetable access
import Faculty from "../models/faculty.js";

export const validateCCTimetableAccess = async (req, res, next) => {
  try {
    // Get faculty ID from the JWT token
    const facultyId = req.faculty?.id || req.user?.id;
    
    if (!facultyId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Get the timetable details from request body
    const { collegeInfo } = req.body;
    
    if (!collegeInfo || !collegeInfo.department || !collegeInfo.semester || !collegeInfo.section) {
      return res.status(400).json({
        success: false,
        message: "College info with department, semester, and section is required"
      });
    }

    // Get faculty record with CC assignments
    const faculty = await Faculty.findById(facultyId);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty record not found"
      });
    }

    // Check if faculty has special roles that bypass CC restriction
    const bypassRoles = ['principal', 'hod', 'HOD'];
    if (bypassRoles.includes(faculty.role) || bypassRoles.includes(faculty.type)) {
      console.log(`[CC Access] Bypassing CC check for ${faculty.role || faculty.type}: ${faculty.firstName} ${faculty.lastName}`);
      return next();
    }

    // Check if faculty has CC assignment for the requested class
    const hasValidCCAssignment = faculty.ccAssignments?.some(assignment => {
      const departmentMatch = assignment.department.toLowerCase().trim() === 
                             collegeInfo.department.toLowerCase().trim();
      const semesterMatch = assignment.semester === collegeInfo.semester;
      const sectionMatch = assignment.section.toLowerCase() === 
                          collegeInfo.section.toLowerCase();
      
      console.log(`[CC Access] Checking assignment:`, {
        assignmentDept: assignment.department,
        requestDept: collegeInfo.department,
        departmentMatch,
        assignmentSem: assignment.semester,
        requestSem: collegeInfo.semester,
        semesterMatch,
        assignmentSec: assignment.section,
        requestSec: collegeInfo.section,
        sectionMatch
      });
      
      return departmentMatch && semesterMatch && sectionMatch;
    });

    if (!hasValidCCAssignment) {
      console.log(`[CC Access] Access denied for ${faculty.firstName} ${faculty.lastName}`);
      console.log(`[CC Access] Faculty CC assignments:`, faculty.ccAssignments);
      console.log(`[CC Access] Requested: ${collegeInfo.department} - Sem ${collegeInfo.semester} - Sec ${collegeInfo.section}`);
      
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only create/modify timetables for classes where you are assigned as Class Coordinator.`,
        yourAssignments: faculty.ccAssignments?.map(a => ({
          department: a.department,
          semester: a.semester,
          section: a.section
        })) || [],
        requested: {
          department: collegeInfo.department,
          semester: collegeInfo.semester,
          section: collegeInfo.section
        }
      });
    }

    console.log(`[CC Access] Access granted for ${faculty.firstName} ${faculty.lastName} to modify ${collegeInfo.department} - Sem ${collegeInfo.semester} - Sec ${collegeInfo.section}`);
    next();
    
  } catch (error) {
    console.error("[CC Access] Error validating CC access:", error);
    res.status(500).json({
      success: false,
      message: "Server error while validating access",
      error: error.message
    });
  }
};

// Middleware to check CC access for DELETE operations (gets timetable info from DB)
export const validateCCTimetableAccessForDelete = async (req, res, next) => {
  try {
    // Get faculty ID from the JWT token
    const facultyId = req.faculty?.id || req.user?.id;
    
    if (!facultyId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Get the timetable ID from params
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Timetable ID is required"
      });
    }

    // Get the existing timetable to check its collegeInfo
    const Timetable = (await import("../models/timetable.js")).default;
    const timetable = await Timetable.findById(id);
    
    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found"
      });
    }

    // Get faculty record with CC assignments
    const faculty = await Faculty.findById(facultyId);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty record not found"
      });
    }

    // Check if faculty has special roles that bypass CC restriction
    const bypassRoles = ['principal', 'hod', 'HOD'];
    if (bypassRoles.includes(faculty.role) || bypassRoles.includes(faculty.type)) {
      console.log(`[CC Delete Access] Bypassing CC check for ${faculty.role || faculty.type}: ${faculty.firstName} ${faculty.lastName}`);
      return next();
    }

    // Check if faculty has CC assignment for the timetable's class
    const collegeInfo = timetable.collegeInfo;
    const hasValidCCAssignment = faculty.ccAssignments?.some(assignment => {
      const departmentMatch = assignment.department.toLowerCase().trim() === 
                             collegeInfo.department.toLowerCase().trim();
      const semesterMatch = assignment.semester === collegeInfo.semester;
      const sectionMatch = assignment.section.toLowerCase() === 
                          collegeInfo.section.toLowerCase();
      
      return departmentMatch && semesterMatch && sectionMatch;
    });

    if (!hasValidCCAssignment) {
      console.log(`[CC Delete Access] Access denied for ${faculty.firstName} ${faculty.lastName}`);
      
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only delete timetables for classes where you are assigned as Class Coordinator.`,
        yourAssignments: faculty.ccAssignments?.map(a => ({
          department: a.department,
          semester: a.semester,
          section: a.section
        })) || [],
        timetableInfo: {
          department: collegeInfo.department,
          semester: collegeInfo.semester,
          section: collegeInfo.section
        }
      });
    }

    console.log(`[CC Delete Access] Access granted for ${faculty.firstName} ${faculty.lastName} to delete ${collegeInfo.department} - Sem ${collegeInfo.semester} - Sec ${collegeInfo.section}`);
    next();
    
  } catch (error) {
    console.error("[CC Delete Access] Error validating CC access:", error);
    res.status(500).json({
      success: false,
      message: "Server error while validating access",
      error: error.message
    });
  }
};
