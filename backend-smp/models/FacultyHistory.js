import mongoose from "mongoose";

const facultyHistorySchema = new mongoose.Schema({
  facultyId: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["hod", "principal"], required: true },
  department: {
    type: String,
    required: function () {
      return this.role === "hod";
    },
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  reason: { type: String, required: true },
  notes: { type: String },
});

export default mongoose.model("FacultyHistory", facultyHistorySchema);
