import Task from "../models/taskModel.js";

// Create Task
const createTask = async (req, res) => {
  console.log("createTask request body:", req.body);

  try {
    console.log("createTask request body:", req.body);
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Request body is empty" });
    }
    // Extract user ID from authenticated user (set by protect middleware)
    const senderId = req.body.senderId;
    const data = { ...req.body, senderId }; // Add senderId to data
    const requiredFields = [
      "senderId",
      "employeeId",
      "designation",
      "department",
      "reportingManager",
      "handoverStartDate",
      "handoverEndDate",
      "reason",
      "receiverName",
      "receiverId",
      "receiverDesignation",
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`${field} is required`);
      }
    }
    // Validate dates
    const startDate = new Date(data.handoverStartDate);
    const endDate = new Date(data.handoverEndDate);
    if (isNaN(startDate) || isNaN(endDate)) {
      throw new Error("Invalid handoverStartDate or handoverEndDate");
    }
    if (startDate > endDate) {
      throw new Error("handoverStartDate must be before handoverEndDate");
    }
    const task = new Task({
      senderId: data.senderId,
      employeeId: data.employeeId,
      designation: data.designation,
      department: data.department,
      reportingManager: data.reportingManager,
      handoverStartDate: startDate,
      handoverEndDate: endDate,
      reason: data.reason,
      receiverName: data.receiverName,
      receiverId: data.receiverId,
      receiverDesignation: data.receiverDesignation,
      documents: Array.isArray(data.documents) ? data.documents : [],
      assets: Array.isArray(data.assets) ? data.assets : [],
      pendingTasks: Array.isArray(data.pendingTasks) ? data.pendingTasks : [],
      remarks: data.remarks,
      status: "pending_hod",
    });
    const savedTask = await task.save();
    res
      .status(201)
      .json({ message: "Task created successfully", result: savedTask });
  } catch (error) {
    console.error("Error in createTask:", error.message);
    console.error("Full stack:", error.stack);
    res.status(500).json({ error: error.message });
  }
};

// Get All Tasks
const getAllTasks = async (req, res) => {
  try {
    const receiverId = req.query.receiverId;
    let query = {};
    if (receiverId) query.receiverId = receiverId;
    const tasks = await Task.find(query).sort({ date: -1 });
    res.json(tasks);
  } catch (error) {
    console.error("Error in getAllTasks:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get Pending Tasks for Receiver
const getPendingTasks = async (req, res) => {
  try {
    const tasks = await Task.getPendingTasks(req.params.receiverName);
    res.json(tasks);
  } catch (error) {
    console.error("Error in getPendingTasks:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get Tasks Sent by Employee
const getSentTasks = async (req, res) => {
  try {
    const tasks = await Task.getSentTasks(req.params.employeeId);
    res.json(tasks);
  } catch (error) {
    console.error("Error in getSentTasks:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get Task by ID
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    res.json(task);
  } catch (error) {
    console.error("Error in getTaskById:", error);
    if (error.message === "Task not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update Task Status
const updateTask = async (req, res) => {
  try {
    console.log("updateTask request body:", req.body);
    if (
      !req.body.status ||
      !["approved", "rejected"].includes(req.body.status)
    ) {
      return res
        .status(400)
        .json({ error: "Valid status (approved or rejected) is required" });
    }
    const task = await Task.updateTask(req.params.id, req.body);
    res.json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error("Error in updateTask:", error);
    if (error.message === "Task not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// Approve/Reject by HOD
const approveByHOD = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, approverId } = req.body;

    console.log("HOD approval triggered for Task:", id);
    console.log("Decision received:", decision);

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (decision === "approved") {
      task.status = "pending_faculty";
    } else if (decision === "rejected") {
      task.status = "rejected";
    } else {
      return res.status(400).json({ message: "Invalid decision" });
    }

    console.log("Status being set to:", task.status);

    task.hodApproval = {
      decision,
      approverId,
      date: new Date(),
    };

    await task.save();

    return res.status(200).json({ success: true, message: "Updated", task });
  } catch (err) {
    console.error("Error in approveByHOD:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
};

// Approve/Reject by Faculty
const approveByFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, remarks, approverId } = req.body;

    if (!decision || !["approved", "rejected"].includes(decision)) {
      return res
        .status(400)
        .json({ error: 'Decision must be "approved" or "rejected"' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (task.status !== "pending_faculty") {
      return res
        .status(400)
        .json({ error: "Task is not pending faculty approval" });
    }

    // Check if the approver is the designated receiver
    // approverId could be the user's _id or employeeId, and receiverId is typically the user's _id
    if (approverId !== task.receiverId && approverId !== task.receiverEmployeeId) {
      console.log("Authorization check failed:", {
        approverId,
        receiverId: task.receiverId,
        receiverEmployeeId: task.receiverEmployeeId
      });
      return res
        .status(403)
        .json({ error: "Not authorized to approve this task" });
    }

    task.facultyApproval = {
      decision,
      date: new Date(),
      remarks,
      approverId,
    };

    task.status = decision === "approved" ? "approved" : "rejected";

    await task.save();
    res.json({ message: `Task ${decision} by faculty`, task });
  } catch (error) {
    console.error("Error in approveByFaculty:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all pending handover requests for HOD's department
const getPendingHandoverForHOD = async (req, res) => {
  try {
    const department = req.user.department;
    if (!department) {
      return res
        .status(400)
        .json({ error: "Department not found in user profile" });
    }
    const tasks = await Task.find({
      status: "pending_hod",
      department,
    }).sort({ date: -1 });
    res.json(tasks);
  } catch (error) {
    console.error("Error in getPendingHandoverForHOD:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all pending handover requests for a faculty (receiver)
const getPendingHandoverForFaculty = async (req, res) => {
  try {
    const receiverId = req.user.employeeId;
    console.log("receiverId", receiverId);
    if (!receiverId) {
      return res
        .status(400)
        .json({ error: "Employee ID not found in user profile" });
    }
    const tasks = await Task.find({
      status: "pending_faculty",
      receiverEmployeeId: receiverId,
    });
    res.json(tasks);
  } catch (error) {
    console.error("Error in getPendingHandoverForFaculty:", error);
    res.status(500).json({ error: error.message });
  }
};

export {
  createTask,
  getAllTasks,
  getPendingTasks,
  getSentTasks,
  getTaskById,
  updateTask,
  approveByHOD,
  approveByFaculty,
  getPendingHandoverForHOD,
  getPendingHandoverForFaculty,
};
