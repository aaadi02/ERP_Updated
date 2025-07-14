import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  userId: { type: String, required: true }, // Recipient of the notification (e.g., senderId)
  message: { type: String, required: true },
  status: { type: String, enum: ["unread", "read"], default: "unread" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);
