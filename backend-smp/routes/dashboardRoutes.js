import express from "express";
import mongoose from "mongoose";
import Faculty from "../models/faculty.js";
import Student from "../models/student.js";
import Attendance from "../models/attendance.js";
import Task from "../models/taskModel.js";
import Todo from "../models/Todo.js";
import Leave from "../models/Leave.js";
import jwt from "jsonwebtoken";
import Department from "../models/Department.js";

const router = express.Router();

// Middleware to verify user
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Test endpoint to check authentication
router.get("/test-auth", authMiddleware, async (req, res) => {
  try {
    res.json({
      message: "Authentication successful",
      user: req.user,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Test endpoint error" });
  }
});

// Public Stats (no auth required)
router.get("/stats", async (req, res) => {
  try {
    const stats = {
      totalFaculty: await Faculty.countDocuments({}),
      totalStudents: await Student.countDocuments({}),
      departments: (await Faculty.distinct("department")).length,
    };
    res.json(stats);
  } catch (err) {
    console.error("Stats fetch error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// HOD specific stats endpoint
router.get("/hod-stats", authMiddleware, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user.id);
    if (!faculty || faculty.role !== "hod") {
      return res
        .status(403)
        .json({ error: "Access denied. HOD access required." });
    }

    const hodDepartment = faculty.department;

    // Get faculty count from HOD's department
    const totalFaculty = await Faculty.countDocuments({
      department: hodDepartment,
      status: { $ne: "Inactive" },
    });

    // Get student count from HOD's department - need to find by department name since Student model references AcademicDepartment ObjectId
    const departmentDoc = await Department.findOne({ name: hodDepartment });
    const totalStudents = departmentDoc
      ? await Student.countDocuments({
          department: departmentDoc._id,
          status: { $ne: "Inactive" },
        })
      : 0;

    // Get pending tasks assigned to HOD
    const pendingTasks = await Task.countDocuments({
      assignedTo: req.user.id,
      status: { $in: ["pending", "in-progress"] },
    });

    // Get completed tasks by HOD
    const completedTasks = await Task.countDocuments({
      assignedTo: req.user.id,
      status: "completed",
    });

    // Get pending leave requests for HOD's department
    const pendingLeaves = await Leave.countDocuments({
      department: hodDepartment,
      status: "pending",
    });

    const stats = {
      totalFaculty,
      totalStudents,
      pendingTasks,
      completedTasks,
      pendingLeaves: pendingLeaves,
      department: hodDepartment,
      todosCount: await Todo.countDocuments({ assignedTo: req.user.id }),
      attendanceAverage: 85, // Can be calculated from actual attendance data
      departmentPerformance: 92, // Can be calculated from actual performance metrics
    };

    res.json(stats);
  } catch (err) {
    console.error("HOD stats fetch error:", err);
    res.status(500).json({ error: "Failed to fetch HOD stats" });
  }
});

// HOD todos endpoint
router.get("/hod-todos", authMiddleware, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user.id);
    if (!faculty || faculty.role !== "hod") {
      return res
        .status(403)
        .json({ error: "Access denied. HOD access required." });
    }

    const { status } = req.query;
    const filter = { assignedTo: req.user.id };

    if (status && status !== "") {
      filter.status = status;
    }

    const todos = await Todo.find(filter).sort({ createdAt: -1 }).limit(50);

    // Calculate todo stats
    const todoStats = await Todo.aggregate([
      { $match: { assignedTo: req.user.id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "Completed"] },
                    { $lt: ["$dueDate", new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats =
      todoStats.length > 0
        ? todoStats[0]
        : {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
            overdue: 0,
          };

    res.json({ todos, stats });
  } catch (err) {
    console.error("HOD todos fetch error:", err);
    res.status(500).json({ error: "Failed to fetch HOD todos" });
  }
});

// Admin Stats
router.get("/admin-stats", authMiddleware, async (req, res) => {
  try {
    if (!["facultymanagement", "principal"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const stats = {
      totalFaculty: await Faculty.countDocuments({}),
      totalStudents: await Student.countDocuments({}),
      newHires: await Faculty.countDocuments({
        dateOfJoining: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        },
      }),
      departments: (await Faculty.distinct("department")).length,
      pendingApprovals: await Faculty.countDocuments({ status: "Pending" }),
      budgetUtilization: 78, // Placeholder
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch admin stats" });
  }
});

// Principal Pending Approvals
router.get("/principal-pending-approvals", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "principal") {
      return res
        .status(403)
        .json({ error: "Unauthorized - Principal access required" });
    }

    // Get pending leave approvals for principal
    const Leave = require("../models/Leave");
    const ODLeave = require("../models/ODLeave");

    // Count regular leaves pending principal approval
    const pendingLeaveApprovals = await Leave.countDocuments({
      $or: [
        { status: "HOD Approved" }, // Teaching staff leaves approved by HOD, pending principal
        {
          status: "Pending",
          applicantType: { $in: ["HOD", "non-teaching"] }, // Direct principal approval for HODs and non-teaching
        },
      ],
    });

    // Count OD leaves pending principal approval
    const pendingODLeaveApprovals = await ODLeave.countDocuments({
      $or: [
        { status: "HOD Approved" }, // Teaching staff OD leaves approved by HOD, pending principal
        {
          status: "Pending",
          applicantType: { $in: ["HOD", "non-teaching"] }, // Direct principal approval for HODs and non-teaching
        },
      ],
    });

    // Get pending faculty approvals (new hires, status changes, etc.)
    const pendingFacultyApprovals = await Faculty.countDocuments({
      status: "Pending",
    });

    // Get pending charge handover approvals (try-catch in case model doesn't exist)
    let pendingHandoverApprovals = 0;
    try {
      const ChargeHandover = require("../models/ChargeHandover");
      pendingHandoverApprovals = await ChargeHandover.countDocuments({
        status: "Pending",
        approvalLevel: "Principal",
      });
    } catch (error) {
      console.log(
        "ChargeHandover model not found, skipping handover approvals count"
      );
    }

    // Calculate total pending approvals
    const totalPendingApprovals =
      pendingLeaveApprovals +
      pendingODLeaveApprovals +
      pendingFacultyApprovals +
      pendingHandoverApprovals;

    res.json({
      totalPendingApprovals,
      breakdown: {
        leaveApprovals: pendingLeaveApprovals,
        odLeaveApprovals: pendingODLeaveApprovals,
        facultyApprovals: pendingFacultyApprovals,
        handoverApprovals: pendingHandoverApprovals,
      },
    });
  } catch (err) {
    console.error("Principal pending approvals fetch error:", err);
    res.status(500).json({ error: "Failed to fetch pending approvals" });
  }
});

// Debug endpoint to check what timetables exist in database
router.get("/debug-timetables", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "principal") {
      return res
        .status(403)
        .json({ error: "Unauthorized - Principal access required" });
    }

    // Import Timetable model
    const Timetable = require("../models/timetable");

    // Get all timetables without any filtering
    const allTimetables = await Timetable.find({});

    // Get unique departments
    const departments = [
      ...new Set(
        allTimetables.map((t) => t.collegeInfo?.department).filter(Boolean)
      ),
    ];

    // Create debug info
    const debugInfo = {
      totalTimetablesInDB: allTimetables.length,
      uniqueDepartments: departments,
      sampleTimetables: allTimetables.slice(0, 3).map((t) => ({
        id: t._id,
        department: t.collegeInfo?.department,
        semester: t.collegeInfo?.semester,
        section: t.collegeInfo?.section,
        year: t.collegeInfo?.year,
        hasData: t.timetableData?.length > 0,
      })),
      departmentCounts: {},
    };

    // Count timetables per department
    departments.forEach((dept) => {
      debugInfo.departmentCounts[dept] = allTimetables.filter(
        (t) => t.collegeInfo?.department === dept
      ).length;
    });

    res.json(debugInfo);
  } catch (err) {
    console.error("Debug timetables error:", err);
    res.status(500).json({ error: "Failed to debug timetables" });
  }
});

// Principal All Timetables
router.get("/principal-all-timetables", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "principal") {
      return res
        .status(403)
        .json({ error: "Unauthorized - Principal access required" });
    }

    // Import Timetable model
    const Timetable = require("../models/timetable");

    // Fetch all timetables without any filtering for principal
    const timetables = await Timetable.find({});

    // Group timetables by department and add summary information
    const timetablesByDepartment = {};
    const departmentStats = {};

    timetables.forEach((timetable) => {
      const department =
        timetable.collegeInfo?.department || "Unknown Department";
      const semester = timetable.collegeInfo?.semester || "Unknown Semester";
      const section = timetable.collegeInfo?.section || "Unknown Section";

      if (!timetablesByDepartment[department]) {
        timetablesByDepartment[department] = [];
        departmentStats[department] = {
          totalTimetables: 0,
          semesters: new Set(),
          sections: new Set(),
        };
      }

      timetablesByDepartment[department].push({
        _id: timetable._id,
        department: department,
        semester: semester,
        section: section,
        year: timetable.collegeInfo?.year || "Unknown Year",
        createdAt: timetable.createdAt,
        lastModified: timetable.updatedAt,
        timetableData: timetable.timetableData?.length || 0,
      });

      departmentStats[department].totalTimetables++;
      departmentStats[department].semesters.add(semester);
      departmentStats[department].sections.add(section);
    });

    // Convert sets to arrays for JSON response
    Object.keys(departmentStats).forEach((dept) => {
      departmentStats[dept].semesters = Array.from(
        departmentStats[dept].semesters
      );
      departmentStats[dept].sections = Array.from(
        departmentStats[dept].sections
      );
    });

    // Create summary for dashboard display
    const summary = {
      totalTimetables: timetables.length,
      totalDepartments: Object.keys(timetablesByDepartment).length,
      departmentBreakdown: Object.keys(departmentStats).map((dept) => ({
        department: dept,
        count: departmentStats[dept].totalTimetables,
        semesters: departmentStats[dept].semesters.length,
        sections: departmentStats[dept].sections.length,
      })),
    };

    res.json({
      summary,
      timetablesByDepartment,
      departmentStats,
      allTimetables: timetables.map((t) => ({
        _id: t._id,
        department: t.collegeInfo?.department,
        semester: t.collegeInfo?.semester,
        section: t.collegeInfo?.section,
        year: t.collegeInfo?.year,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  } catch (err) {
    console.error("Principal timetables fetch error:", err);
    res.status(500).json({ error: "Failed to fetch timetables" });
  }
});

// Faculty Distribution
router.get("/faculty-distribution", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "facultymanagement") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const facultyData = await Faculty.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $project: { name: "$_id", count: 1, _id: 0 } },
    ]);
    res.json(facultyData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch faculty distribution" });
  }
});

// Teaching Stats
router.get("/teaching-stats", authMiddleware, async (req, res) => {
  try {
    if (!["teaching", "HOD"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const faculty = await Faculty.findById(req.user.id).select(
      "subjectsTaught"
    );

    const averageAttendance = await Attendance.aggregate([
      {
        $match: {
          facultyId: new mongoose.Types.ObjectId(req.user.id),
          date: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      },
      { $group: { _id: null, avg: { $avg: "$attendance" } } },
    ]).then((result) => result[0]?.avg || 0);

    const stats = {
      totalStudents: await Attendance.countDocuments({
        facultyId: req.user.id,
      }),
      averageAttendance,
      upcomingClasses: 4, // Placeholder
      assignmentsPending: 12, // Placeholder
      coursesTeaching: faculty?.subjectsTaught?.length || 0,
      officeHours: 5, // Placeholder
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch teaching stats" });
  }
});

// Attendance Data
router.get("/attendance-data", authMiddleware, async (req, res) => {
  try {
    if (!["teaching", "HOD"].includes(req.user.role)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          facultyId: new mongoose.Types.ObjectId(req.user.id),
          date: {
            $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$date" },
          attendance: { $avg: "$attendance" },
        },
      },
      {
        $project: {
          name: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 1] }, then: "Sunday" },
                { case: { $eq: ["$_id", 2] }, then: "Monday" },
                { case: { $eq: ["$_id", 3] }, then: "Tuesday" },
                { case: { $eq: ["$_id", 4] }, then: "Wednesday" },
                { case: { $eq: ["$_id", 5] }, then: "Thursday" },
                { case: { $eq: ["$_id", 6] }, then: "Friday" },
                { case: { $eq: ["$_id", 7] }, then: "Saturday" },
              ],
              default: "Unknown",
            },
          },
          attendance: 1,
        },
      },
    ]);
    res.json(attendanceData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch attendance data" });
  }
});

// Non-Teaching Stats
router.get("/non-teaching-stats", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "non-teaching") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const stats = {
      totalTasks: await Task.countDocuments({ assignedTo: req.user.id }),
      completedTasks: await Task.countDocuments({
        assignedTo: req.user.id,
        status: "Completed",
      }),
      pendingTasks: await Task.countDocuments({
        assignedTo: req.user.id,
        status: "Pending",
      }),
      upcomingMeetings: 3, // Placeholder
      supportRequests: 8, // Placeholder
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch non-teaching stats" });
  }
});

// Task Data
router.get("/task-data", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "non-teaching") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const taskData = await Task.aggregate([
      { $match: { assignedTo: req.user.id } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
        },
      },
      { $project: { name: "$_id", count: 1, completed: 1, _id: 0 } },
    ]);
    res.json(taskData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch task data" });
  }
});

// HOD Stats (temporarily without auth for testing)
router.get("/hod-stats", async (req, res) => {
  try {
    // For testing, assume HOD role and department
    const testUser = {
      role: "HOD",
      id: "686901b2b13ca1ded96a295e", // Test faculty ID
      employeeId: "NCAT2011",
    };
    req.user = testUser;

    console.log("[HOD-STATS] Test user:", testUser);

    // Get HOD's faculty record to find their department
    let hodFaculty = await Faculty.findById(req.user.id);
    if (!hodFaculty && req.user.employeeId) {
      hodFaculty = await Faculty.findOne({ employeeId: req.user.employeeId });
    }
    if (!hodFaculty) {
      return res.status(404).json({ error: "HOD faculty record not found" });
    }

    const hodDepartmentName = hodFaculty.department;

    // Find the department document by name to get its ObjectId
    // Handle different naming conventions between Faculty and Department models

    // Create a mapping for common department name variations
    const departmentMappings = {
      Mechanical: "mechanical",
      "Computer Science": "cse",
      "Information Technology": "it",
      Electronics: "electronic",
      Civil: "civil",
      Electrical: "electrical",
      "Data Science": "ai ml",
    };

    // Try exact match first, then try mapped name, then partial match
    let departmentDoc = await Department.findOne({
      name: { $regex: new RegExp(`^${hodDepartmentName}$`, "i") },
    });

    if (!departmentDoc && departmentMappings[hodDepartmentName]) {
      departmentDoc = await Department.findOne({
        name: {
          $regex: new RegExp(`^${departmentMappings[hodDepartmentName]}$`, "i"),
        },
      });
    }

    if (!departmentDoc) {
      // Try partial match
      departmentDoc = await Department.findOne({
        name: { $regex: new RegExp(hodDepartmentName, "i") },
      });
    }

    if (!departmentDoc) {
      console.log(`Department not found for HOD: ${hodDepartmentName}`);
      console.log(
        "Available departments:",
        await Department.find({}).select("name")
      );
      return res.status(404).json({
        error: "Department not found",
        hodDepartment: hodDepartmentName,
        availableDepartments: await Department.find({}).select("name"),
      });
    }

    // Filter faculty and students by HOD's department
    // Faculty uses string department, Student uses ObjectId department
    const stats = {
      totalFaculty: await Faculty.countDocuments({
        department: hodDepartmentName,
      }),
      totalStudents: await Student.countDocuments({
        department: departmentDoc._id,
      }),
      department: hodDepartmentName,
      departmentId: departmentDoc._id,
    };
    res.json(stats);
  } catch (err) {
    console.error("HOD Stats fetch error:", err);
    res.status(500).json({ error: "Failed to fetch HOD stats" });
  }
});

// Todo Management Endpoints for HOD Dashboard

// Get todos for HOD department
router.get("/hod-todos", async (req, res) => {
  try {
    // For testing, assume HOD role and department
    const testUser = {
      role: "HOD",
      id: "686901b2b13ca1ded96a295e", // Test faculty ID
      employeeId: "NCAT2011",
    };
    req.user = testUser;

    console.log("[HOD-TODOS] Test user:", testUser);

    // Get HOD's faculty record to find their department
    let hodFaculty = await Faculty.findById(req.user.id);
    if (!hodFaculty && req.user.employeeId) {
      hodFaculty = await Faculty.findOne({ employeeId: req.user.employeeId });
    }
    if (!hodFaculty) {
      return res.status(404).json({ error: "HOD faculty record not found" });
    }

    const hodDepartment = hodFaculty.department;
    const { status, priority, limit = 20 } = req.query;

    // Build query for todos in HOD's department
    let query = { department: hodDepartment };

    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }

    const todos = await Todo.find(query)
      .sort({ createdAt: -1, dueDate: 1 })
      .limit(parseInt(limit));

    const todoStats = {
      total: await Todo.countDocuments({ department: hodDepartment }),
      pending: await Todo.countDocuments({
        department: hodDepartment,
        status: "Pending",
      }),
      inProgress: await Todo.countDocuments({
        department: hodDepartment,
        status: "In Progress",
      }),
      completed: await Todo.countDocuments({
        department: hodDepartment,
        status: "Completed",
      }),
      overdue: await Todo.countDocuments({
        department: hodDepartment,
        status: { $ne: "Completed" },
        dueDate: { $lt: new Date() },
      }),
    };

    res.json({
      todos,
      stats: todoStats,
      department: hodDepartment,
    });
  } catch (err) {
    console.error("HOD Todos fetch error:", err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// Create new todo
router.post("/hod-todos", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "hod" && req.user.role !== "HOD") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let hodFaculty = await Faculty.findById(req.user.id);
    if (!hodFaculty && req.user.employeeId) {
      hodFaculty = await Faculty.findOne({ employeeId: req.user.employeeId });
    }
    if (!hodFaculty) {
      return res.status(404).json({ error: "HOD faculty record not found" });
    }

    const {
      title,
      description,
      priority,
      category,
      assignedTo,
      assignedToRole,
      dueDate,
      tags,
    } = req.body;

    if (!title || !assignedTo || !dueDate) {
      return res
        .status(400)
        .json({ error: "Title, assignedTo, and dueDate are required" });
    }

    const todo = new Todo({
      title,
      description: description || "",
      priority: priority || "Medium",
      category: category || "Other",
      assignedBy: req.user.employeeId || req.user.id,
      assignedTo,
      assignedToRole: assignedToRole || "faculty",
      department: hodFaculty.department,
      dueDate: new Date(dueDate),
      tags: tags || [],
    });

    await todo.save();
    res.status(201).json({ message: "Todo created successfully", todo });
  } catch (err) {
    console.error("Create todo error:", err);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// Update todo status
router.put("/hod-todos/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "hod" && req.user.role !== "HOD") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let hodFaculty = await Faculty.findById(req.user.id);
    if (!hodFaculty && req.user.employeeId) {
      hodFaculty = await Faculty.findOne({ employeeId: req.user.employeeId });
    }
    if (!hodFaculty) {
      return res.status(404).json({ error: "HOD faculty record not found" });
    }

    const { status, progress, comments } = req.body;
    const updateData = {};

    if (status) {
      updateData.status = status;
      if (status === "Completed") {
        updateData.completedDate = new Date();
        updateData.progress = 100;
      }
    }

    if (progress !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, progress));
    }

    if (comments) {
      updateData.$push = {
        comments: {
          author: req.user.employeeId || req.user.id,
          text: comments,
          date: new Date(),
        },
      };
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, department: hodFaculty.department },
      updateData,
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ error: "Todo not found or access denied" });
    }

    res.json({ message: "Todo updated successfully", todo });
  } catch (err) {
    console.error("Update todo error:", err);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

// Delete todo
router.delete("/hod-todos/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "hod" && req.user.role !== "HOD") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let hodFaculty = await Faculty.findById(req.user.id);
    if (!hodFaculty && req.user.employeeId) {
      hodFaculty = await Faculty.findOne({ employeeId: req.user.employeeId });
    }
    if (!hodFaculty) {
      return res.status(404).json({ error: "HOD faculty record not found" });
    }

    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      department: hodFaculty.department,
    });

    if (!todo) {
      return res.status(404).json({ error: "Todo not found or access denied" });
    }

    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    console.error("Delete todo error:", err);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

// Todo Management Endpoints for Principal Dashboard

// Get todos for Principal (all departments)
router.get("/principal-todos", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "principal") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { status, priority, department, limit = 20 } = req.query;

    // Build query for todos (Principal can see all departments)
    let query = {};

    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (department) {
      query.department = department;
    }

    const todos = await Todo.find(query)
      .sort({ createdAt: -1, dueDate: 1 })
      .limit(parseInt(limit));

    const todoStats = {
      total: await Todo.countDocuments({}),
      pending: await Todo.countDocuments({ status: "Pending" }),
      inProgress: await Todo.countDocuments({ status: "In Progress" }),
      completed: await Todo.countDocuments({ status: "Completed" }),
      overdue: await Todo.countDocuments({
        status: { $ne: "Completed" },
        dueDate: { $lt: new Date() },
      }),
    };

    res.json({
      todos,
      stats: todoStats,
    });
  } catch (err) {
    console.error("Principal Todos fetch error:", err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// Create new todo (Principal)
router.post("/principal-todos", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "principal") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const {
      title,
      description,
      priority,
      category,
      assignedTo,
      assignedToRole,
      department,
      dueDate,
      tags,
    } = req.body;

    if (!title || !assignedTo || !department || !dueDate) {
      return res.status(400).json({
        error: "Title, assignedTo, department, and dueDate are required",
      });
    }

    const todo = new Todo({
      title,
      description: description || "",
      priority: priority || "Medium",
      category: category || "Administrative",
      assignedBy: req.user.employeeId || req.user.id,
      assignedTo,
      assignedToRole: assignedToRole || "faculty",
      department,
      dueDate: new Date(dueDate),
      tags: tags || [],
    });

    await todo.save();
    res.status(201).json({ message: "Todo created successfully", todo });
  } catch (err) {
    console.error("Create todo error:", err);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// Update todo status (Principal)
router.put("/principal-todos/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "principal") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { status, progress, comments } = req.body;
    const updateData = {};

    if (status) {
      updateData.status = status;
      if (status === "Completed") {
        updateData.completedDate = new Date();
        updateData.progress = 100;
      }
    }

    if (progress !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, progress));
    }

    if (comments) {
      updateData.$push = {
        comments: {
          author: req.user.employeeId || req.user.id,
          text: comments,
          date: new Date(),
        },
      };
    }

    const todo = await Todo.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json({ message: "Todo updated successfully", todo });
  } catch (err) {
    console.error("Update todo error:", err);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

// Delete todo (Principal)
router.delete("/principal-todos/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "principal") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    console.error("Delete todo error:", err);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

// Simple todos endpoint for demo (without strict auth)
router.get("/principal-todos-demo", async (req, res) => {
  try {
    const { status, priority, department, limit = 20 } = req.query;

    // Build query for todos
    let query = {};

    if (status) {
      query.status = status;
    }
    if (priority) {
      query.priority = priority;
    }
    if (department) {
      query.department = department;
    }

    const todos = await Todo.find(query)
      .sort({ createdAt: -1, dueDate: 1 })
      .limit(parseInt(limit));

    const todoStats = {
      total: await Todo.countDocuments({}),
      pending: await Todo.countDocuments({ status: "Pending" }),
      inProgress: await Todo.countDocuments({ status: "In Progress" }),
      completed: await Todo.countDocuments({ status: "Completed" }),
      overdue: await Todo.countDocuments({
        status: { $ne: "Completed" },
        dueDate: { $lt: new Date() },
      }),
    };

    res.json({
      todos,
      stats: todoStats,
    });
  } catch (err) {
    console.error("Principal Todos fetch error:", err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// Create new todo (demo version)
router.post("/principal-todos-demo", async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      category,
      assignedTo,
      assignedToRole,
      department,
      dueDate,
      tags,
    } = req.body;

    if (!title || !assignedTo || !department || !dueDate) {
      return res.status(400).json({
        error: "Title, assignedTo, department, and dueDate are required",
      });
    }

    const todo = new Todo({
      title,
      description: description || "",
      priority: priority || "Medium",
      category: category || "Administrative",
      assignedBy: "PRINCIPAL_DEMO", // Demo value
      assignedTo,
      assignedToRole: assignedToRole || "faculty",
      department,
      dueDate: new Date(dueDate),
      tags: tags || [],
    });

    await todo.save();
    res.status(201).json({ message: "Todo created successfully", todo });
  } catch (err) {
    console.error("Create todo error:", err);
    res.status(500).json({ error: "Failed to create todo" });
  }
});

// Update todo status (demo version)
router.put("/principal-todos-demo/:id", async (req, res) => {
  try {
    const { status, progress, comments } = req.body;
    const updateData = {};

    if (status) {
      updateData.status = status;
      if (status === "Completed") {
        updateData.completedDate = new Date();
        updateData.progress = 100;
      }
    }

    if (progress !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, progress));
    }

    if (comments) {
      updateData.$push = {
        comments: {
          author: "PRINCIPAL_DEMO",
          text: comments,
          date: new Date(),
        },
      };
    }

    const todo = await Todo.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json({ message: "Todo updated successfully", todo });
  } catch (err) {
    console.error("Update todo error:", err);
    res.status(500).json({ error: "Failed to update todo" });
  }
});

// Delete todo (demo version)
router.delete("/principal-todos-demo/:id", async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }

    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    console.error("Delete todo error:", err);
    res.status(500).json({ error: "Failed to delete todo" });
  }
});

export default router;
