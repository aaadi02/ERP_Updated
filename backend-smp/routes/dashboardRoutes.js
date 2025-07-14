import express from "express";
import mongoose from "mongoose";
import Faculty from "../models/faculty.js";
import Student from "../models/student.js";
import Attendance from "../models/attendance.js";
import Task from "../models/taskModel.js";
import Todo from "../models/Todo.js";
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
      timestamp: new Date().toISOString()
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

// HOD Stats
router.get("/hod-stats", authMiddleware, async (req, res) => {
  try {
    // Accept both "hod" and "HOD" for backward compatibility
    if (req.user.role !== "HOD" && req.user.role !== "hod") {
      console.log("Access denied. User role:", req.user.role);
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Get HOD's faculty record to find their department
    // Try to find by user ID first, then by employeeId if that fails
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
      'Mechanical': 'mechanical',
      'Computer Science': 'cse',
      'Information Technology': 'it', 
      'Electronics': 'electronic',
      'Civil': 'civil',
      'Electrical': 'electrical',
      'Data Science': 'ai ml'
    };
    
    // Try exact match first, then try mapped name, then partial match
    let departmentDoc = await Department.findOne({
      name: { $regex: new RegExp(`^${hodDepartmentName}$`, 'i') }
    });
    
    if (!departmentDoc && departmentMappings[hodDepartmentName]) {
      departmentDoc = await Department.findOne({
        name: { $regex: new RegExp(`^${departmentMappings[hodDepartmentName]}$`, 'i') }
      });
    }
    
    if (!departmentDoc) {
      // Try partial match
      departmentDoc = await Department.findOne({
        name: { $regex: new RegExp(hodDepartmentName, 'i') }
      });
    }

    if (!departmentDoc) {
      console.log(`Department not found for HOD: ${hodDepartmentName}`);
      console.log('Available departments:', await Department.find({}).select('name'));
      return res.status(404).json({ 
        error: "Department not found",
        hodDepartment: hodDepartmentName,
        availableDepartments: await Department.find({}).select('name')
      });
    }

    // Filter faculty and students by HOD's department
    // Faculty uses string department, Student uses ObjectId department
    const stats = {
      totalFaculty: await Faculty.countDocuments({ department: hodDepartmentName }),
      totalStudents: await Student.countDocuments({ department: departmentDoc._id }),
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
router.get("/hod-todos", authMiddleware, async (req, res) => {
  try {
    // Accept both "hod" and "HOD" for backward compatibility
    if (req.user.role !== "hod" && req.user.role !== "HOD") {
      return res.status(403).json({ error: "Unauthorized" });
    }

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
      pending: await Todo.countDocuments({ department: hodDepartment, status: "Pending" }),
      inProgress: await Todo.countDocuments({ department: hodDepartment, status: "In Progress" }),
      completed: await Todo.countDocuments({ department: hodDepartment, status: "Completed" }),
      overdue: await Todo.countDocuments({ 
        department: hodDepartment, 
        status: { $ne: "Completed" },
        dueDate: { $lt: new Date() }
      })
    };

    res.json({
      todos,
      stats: todoStats,
      department: hodDepartment
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

    const { title, description, priority, category, assignedTo, assignedToRole, dueDate, tags } = req.body;

    if (!title || !assignedTo || !dueDate) {
      return res.status(400).json({ error: "Title, assignedTo, and dueDate are required" });
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
      tags: tags || []
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
          date: new Date()
        }
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
      department: hodFaculty.department
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
        dueDate: { $lt: new Date() }
      })
    };

    res.json({
      todos,
      stats: todoStats
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

    const { title, description, priority, category, assignedTo, assignedToRole, department, dueDate, tags } = req.body;

    if (!title || !assignedTo || !department || !dueDate) {
      return res.status(400).json({ error: "Title, assignedTo, department, and dueDate are required" });
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
      tags: tags || []
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
          date: new Date()
        }
      };
    }

    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

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
        dueDate: { $lt: new Date() }
      })
    };

    res.json({
      todos,
      stats: todoStats
    });
  } catch (err) {
    console.error("Principal Todos fetch error:", err);
    res.status(500).json({ error: "Failed to fetch todos" });
  }
});

// Create new todo (demo version)
router.post("/principal-todos-demo", async (req, res) => {
  try {
    const { title, description, priority, category, assignedTo, assignedToRole, department, dueDate, tags } = req.body;

    if (!title || !assignedTo || !department || !dueDate) {
      return res.status(400).json({ error: "Title, assignedTo, department, and dueDate are required" });
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
      tags: tags || []
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
          date: new Date()
        }
      };
    }

    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

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
