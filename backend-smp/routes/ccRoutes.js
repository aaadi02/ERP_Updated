// Route to get faculty's CC assignments
import express from "express";
import Faculty from "../models/faculty.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET faculty's CC assignments
router.get("/my-cc-assignments", protect, async (req, res) => {
  try {
    const facultyId = req.faculty?.id || req.user?.id;
    
    if (!facultyId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    const faculty = await Faculty.findById(facultyId);
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty record not found"
      });
    }

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
        ccAssignments: faculty.ccAssignments || [],
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
