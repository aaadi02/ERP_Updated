import mongoose from "mongoose";

const leaveSummarySchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  monthlyLeaves: [
    {
      year: { type: Number, required: true },
      month: { type: Number, required: true },
      days: { type: Number, default: 0 },
    },
  ],
  yearlyLeaves: [
    {
      year: { type: Number, required: true },
      days: { type: Number, default: 0 },
    },
  ],
});

export default mongoose.model("LeaveSummary", leaveSummarySchema);
