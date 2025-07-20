import express from "express";
import FacultyDepartmentSubject from "../models/FacultyDepartmentSubject.js";
import {
  getFacultyByDepartment,
  getSubjectsByFaculty,
  getFacultyBySubject,
  getDepartmentTimetableData,
  assignSubjectToFaculty,
  removeSubjectFromFaculty,
  getFacultyAssignmentSummary,
  updateFacultyPreferences,
  getAllRecords,
} from "../controllers/facultyDepartmentSubjectController.js";

const router = express.Router();

// ============ GET Routes ============

// Get all faculty assignments for a specific department
// Query params: ?academicYear=2025-2026&semester=1
router.get("/department/:departmentId/faculty", getFacultyByDepartment);

// Get all subjects taught by a specific faculty
// Query params: ?academicYear=2025-2026&semester=1
router.get("/faculty/:facultyId/subjects", getSubjectsByFaculty);

// Get faculty teaching a specific subject
// Query params: ?academicYear=2025-2026&semester=1&section=A
router.get("/subject/:subjectId/faculty", getFacultyBySubject);

// Get complete timetable data for a department
// Query params: ?academicYear=2025-2026&semester=1
router.get("/department/:departmentId/timetable", getDepartmentTimetableData);

// New route for timetable - Get department faculty-subject mapping
// For Timetable.jsx compatibility
router.get("/department-faculty-subjects/:departmentName", async (req, res) => {
  try {
    const { departmentName } = req.params;
    console.log(
      "[TIMETABLE] Getting faculty-subject mapping for department:",
      departmentName
    );

    // First, find the department by name
    const AcademicDepartment = (await import("../models/AcademicDepartment.js"))
      .default;
    const department = await AcademicDepartment.findOne({
      name: { $regex: new RegExp(departmentName, "i") }, // Case-insensitive match
    });

    if (!department) {
      console.log("[TIMETABLE] Department not found:", departmentName);
      return res.status(404).json({
        success: false,
        message: `Department not found: ${departmentName}`,
        data: { subjectFacultyMap: {}, totalSubjects: 0, totalAssignments: 0 },
      });
    }

    console.log(
      "[TIMETABLE] Found department:",
      department.name,
      "ID:",
      department._id
    );

    // Get faculty records from our new collection using department ObjectId
    const records = await FacultyDepartmentSubject.find({
      department: department._id, // Use the ObjectId
      isActive: true,
    })
      .populate("faculty", "firstName lastName email")
      .populate("assignedSubjects.subject", "name code");

    console.log("[TIMETABLE] Found records:", records.length);

    // Build subject-faculty mapping for frontend
    const subjectFacultyMap = {};

    records.forEach((record) => {
      if (record.faculty && record.assignedSubjects) {
        record.assignedSubjects.forEach((assignment) => {
          if (assignment.subject && assignment.status === "active") {
            const subjectName = assignment.subject.name;

            if (!subjectFacultyMap[subjectName]) {
              subjectFacultyMap[subjectName] = { faculties: [] };
            }

            // Add faculty to this subject
            subjectFacultyMap[subjectName].faculties.push({
              name: `${record.faculty.firstName} ${
                record.faculty.lastName || ""
              }`.trim(),
              employeeId: record.faculty.employeeId || record.faculty._id,
              id: record.faculty._id,
              email: record.faculty.email,
            });
          }
        });
      }
    });

    console.log("[TIMETABLE] Built mapping:", Object.keys(subjectFacultyMap));

    res.json({
      success: true,
      message: `Faculty-subject mapping for ${departmentName}`,
      data: {
        subjectFacultyMap,
        totalSubjects: Object.keys(subjectFacultyMap).length,
        totalAssignments: Object.values(subjectFacultyMap).reduce(
          (sum, data) => sum + data.faculties.length,
          0
        ),
      },
    });
  } catch (error) {
    console.error("[TIMETABLE] Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get department faculty-subject mapping",
      error: error.message,
    });
  }
});

// Get faculty assignment summary across all departments
// Query params: ?academicYear=2025-2026&semester=1
router.get("/summary", getFacultyAssignmentSummary);

// ============ POST Routes ============

// Assign a subject to a faculty
// Body: { facultyId, subjectId, academicYear?, semester?, section? }
router.post("/assign-subject", assignSubjectToFaculty);

// ============ DELETE Routes ============

// Remove a subject from faculty
// Body: { facultyId, subjectId, academicYear?, semester?, section? }
router.delete("/remove-subject", removeSubjectFromFaculty);

// ============ PUT Routes ============

// Update faculty preferences (timetable preferences, specializations, qualifications)
// Body: { timetablePreferences?, specializations?, qualifications? }
router.put("/faculty/:facultyId/preferences", updateFacultyPreferences);

// ============ Debug Routes ============

// Get all records (for debugging)
router.get("/all", getAllRecords);

// ============ Test Routes ============

// Test route for basic functionality
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Faculty Department Subject routes are working!",
    timestamp: new Date().toISOString(),
    routes: {
      GET: [
        "/department/:departmentId/faculty",
        "/faculty/:facultyId/subjects",
        "/subject/:subjectId/faculty",
        "/department/:departmentId/timetable",
        "/summary",
      ],
      POST: ["/assign-subject"],
      DELETE: ["/remove-subject"],
      PUT: ["/faculty/:facultyId/preferences"],
    },
  });
});

// Test route for quick subject assignment
router.post("/test-assign", async (req, res) => {
  try {
    const testData = {
      facultyId: req.body.facultyId || "675e8cd66f01c3b3c3e5f123", // Replace with actual faculty ID
      subjectId: req.body.subjectId || "675e8cd66f01c3b3c3e5f456", // Replace with actual subject ID
      academicYear: req.body.academicYear || "2025-2026",
      semester: req.body.semester || "1",
      section: req.body.section || "A",
    };

    console.log("[Test-Assign] Testing assignment with data:", testData);

    // Call the assign function
    req.body = testData;
    await assignSubjectToFaculty(req, res);
  } catch (error) {
    console.error("[Test-Assign] Error:", error);
    res.status(500).json({
      success: false,
      message: "Test assignment failed",
      error: error.message,
    });
  }
});

export default router;
