import mongoose from "mongoose";

// Task Schema
const taskSchema = new mongoose.Schema({
  senderId: { type: String, required: false },
  employeeId: { type: String, required: true },
  designation: { type: String, required: true },
  department: { type: String, required: true },
  reportingManager: { type: String, required: true },
  handoverStartDate: { type: Date, required: true },
  handoverEndDate: { type: Date, required: true },
  reason: { type: String, required: true },
  receiverName: { type: String, required: true },
  receiverId: { type: String, required: true },
  receiverDesignation: { type: String, required: true },
  documents: [{ type: String }],
  assets: [{ type: String }],
  pendingTasks: [{ type: String }],
  remarks: { type: String },
  receiverDepartment: { type: String },
  receiverEmployeeId: { type: String },

  status: {
    type: String,
    enum: ["pending_hod", "pending_faculty", "approved", "rejected"],
    default: "pending_hod",
  },
  hodApproval: {
    decision: { type: String, enum: ["approved", "rejected", ""], default: "" },
    date: { type: Date },
    remarks: { type: String },
    approverId: { type: String },
  },
  facultyApproval: {
    decision: { type: String, enum: ["approved", "rejected", ""], default: "" },
    date: { type: Date },
    remarks: { type: String },
    approverId: { type: String },
  },
  date: { type: Date, default: Date.now },
  actionDate: { type: Date },
});

const Task = mongoose.model("Task", taskSchema);
export default Task;

// Create Task
export const createTask = async (data) => {
  try {
    console.log("createTask input:", data);
    const requiredFields = [
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
      receiverDepartment: data.receiverDepartment,
      receiverEmployeeId: data.receiverEmployeeId,

      documents: Array.isArray(data.documents) ? data.documents : [],
      assets: Array.isArray(data.assets) ? data.assets : [],
      pendingTasks: Array.isArray(data.pendingTasks) ? data.pendingTasks : [],
      remarks: data.remarks,
      status: "pending_hod",
    });
    const savedTask = await task.save();
    return savedTask;
  } catch (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
};

// Get All Tasks
export const getAllTasks = async (receiverId) => {
  try {
    let query = {};
    if (receiverId) query.receiverId = receiverId;
    const tasks = await Task.find(query).sort({ date: -1 });
    return tasks;
  } catch (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }
};

// Get Pending Tasks for Receiver
export const getPendingTasks = async (receiverName) => {
  try {
    const tasks = await Task.find({ receiverName, status: "pending_hod" }).sort(
      {
        date: -1,
      }
    );
    return tasks;
  } catch (error) {
    throw new Error(`Failed to fetch pending tasks: ${error.message}`);
  }
};

// Get Tasks Sent by Employee
export const getSentTasks = async (employeeId) => {
  try {
    const tasks = await Task.find({ employeeId }).sort({ date: -1 });
    return tasks;
  } catch (error) {
    throw new Error(`Failed to fetch sent tasks: ${error.message}`);
  }
};

// Get Task by ID
export const getTaskById = async (id) => {
  try {
    const task = await Task.findById(id);
    if (!task) {
      throw new Error("Task not found");
    }
    return task;
  } catch (error) {
    throw new Error(`Failed to fetch task: ${error.message}`);
  }
};

// Update Task Status
export const updateTask = async (id, data) => {
  try {
    const task = await Task.findByIdAndUpdate(
      id,
      {
        status: data.status,
        remarks: data.remarks,
        actionDate: Date.now(),
      },
      { new: true }
    );
    if (!task) {
      throw new Error("Task not found");
    }
    return task;
  } catch (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }
};
