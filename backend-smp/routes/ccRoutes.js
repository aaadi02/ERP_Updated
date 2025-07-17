// Route to get faculty's CC assignments
import express from "express";
import Faculty from "../models/faculty.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET faculty's CC assignments
router.get("/my-cc-assignments", protect, async (req, res) => {
  try {
    const facultyId = req.faculty?.id || req.user?.id;
    
    console.log('CC Assignment API called by facultyId:', facultyId);
    
    if (!facultyId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // No need to populate since ccAssignments store strings directly
    const faculty = await Faculty.findById(facultyId);
    
    console.log('Faculty found:', faculty ? 'Yes' : 'No');
    console.log('CC assignments count:', faculty?.ccAssignments?.length || 0);
    console.log('Raw CC assignments:', faculty?.ccAssignments);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty record not found"
      });
    }

    // Parse ccAssignments from strings to objects
    const ccAssignments = (faculty.ccAssignments || []).map(assignment => {
      if (typeof assignment === 'string') {
        // Parse string format like "department:eletronic enigneering,semester:3,section:D,academicYear:2025-2026,assignedAt:2025-07-10T06:17:35.465Z"
        const assignmentObj = {};
        const pairs = assignment.split(',');
        pairs.forEach(pair => {
          const [key, value] = pair.split(':');
          if (key && value) {
            assignmentObj[key.trim()] = value.trim();
          }
        });
        return assignmentObj;
      }
      // If already an object, return as is
      return assignment;
    });
    
    console.log('Parsed CC assignments:', ccAssignments);

    res.status(200).json({
      success: true,
      message: "CC assignments retrieved successfully",
      data: {
        facultyInfo: {
          name: `${faculty.firstName} ${faculty.lastName}`,
          employeeId: faculty.employeeId,
          role: faculty.role,
          type: faculty.type
        },
        ccAssignments: ccAssignments,
        canBypassCCRestriction: ['principal', 'hod', 'HOD'].includes(faculty.role) || 
                               ['principal', 'hod', 'HOD'].includes(faculty.type)
      }
    });
    
  } catch (error) {
    console.error("Error fetching CC assignments:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching CC assignments",
      error: error.message
    });
  }
});

export default router;
