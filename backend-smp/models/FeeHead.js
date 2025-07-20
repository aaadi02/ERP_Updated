import  mongoose from 'mongoose';

const feeHeadSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    applyTo: {
      type: String,
      enum: ["all", "filtered"],
      default: "all",
    },
    filters: {
      stream: { type: mongoose.Schema.Types.ObjectId, ref: "Stream", default: null },
      casteCategory: { type: String, default: null },
    },
    // Collection tracking fields
    totalCollected: { 
      type: Number, 
      default: 0,
      min: 0
    },
    collectionCount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    lastCollectionDate: { 
      type: Date, 
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("FeeHead", feeHeadSchema);
