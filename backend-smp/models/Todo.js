import mongoose from "mongoose";

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Urgent"],
    default: "Medium"
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "Cancelled"],
    default: "Pending"
  },
  category: {
    type: String,
    enum: ["Administrative", "Academic", "Meeting", "Review", "Other"],
    default: "Other"
  },
  assignedBy: {
    type: String,
    required: true
  },
  assignedTo: {
    type: String,
    required: true
  },
  assignedToRole: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadDate: Date
  }],
  comments: [{
    author: String,
    text: String,
    date: { type: Date, default: Date.now }
  }],
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better query performance
todoSchema.index({ assignedTo: 1, status: 1 });
todoSchema.index({ department: 1, status: 1 });
todoSchema.index({ dueDate: 1 });
todoSchema.index({ priority: 1 });

export default mongoose.model("Todo", todoSchema);
