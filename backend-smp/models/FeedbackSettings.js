import mongoose from "mongoose";

const FeedbackSettingsSchema = new mongoose.Schema(
  {
    allow: {
      type: Boolean,
      default: false,
      required: true,
    },
    department: {
      type: String,
      required: false,
      default: "general", // Can be specific to departments or "general" for institution-wide
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "faculty",
      required: false,
    },
    notes: {
      type: String,
      required: false,
      maxlength: 500,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Create a compound index for department to ensure uniqueness per department
FeedbackSettingsSchema.index({ department: 1 }, { unique: true });

const FeedbackSettings = mongoose.model("FeedbackSettings", FeedbackSettingsSchema);

export default FeedbackSettings;
