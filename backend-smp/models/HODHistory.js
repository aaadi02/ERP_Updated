import mongoose from "mongoose";

const hodHistorySchema = new mongoose.Schema({
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  reason: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
});

export default mongoose.model("HODHistory", hodHistorySchema);
