import mongoose from 'mongoose';

const feeHeaderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  stream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Unique index on name and stream combination
feeHeaderSchema.index({ name: 1, stream: 1 }, { unique: true });

const FeeHeader = mongoose.model('FeeHeader', feeHeaderSchema);

export default FeeHeader;
