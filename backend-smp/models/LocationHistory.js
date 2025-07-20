import mongoose from 'mongoose';

const locationHistorySchema = new mongoose.Schema({
  bus: {
    type: mongoose.Schema.ObjectId,
    ref: 'Bus',
    required: true
  },
  location: {
    type: String,
    required: true
  },
  nextStop: {
    type: String
  },
  status: {
    type: String,
    enum: ['on-time', 'delayed', 'early'], // Add 'early' here too
    default: 'on-time'
  },
  direction: { type: String, enum: ['departure', 'return'] },
  count: { type: Number }, // student count
  totalStudents: { type: Number },
  stop: { type: String },
  alertMessage: {
    type: String,
    default: null
  },
  alertType: {
    type: String,
    enum: ['delayed', 'early', 'normal'],
    default: 'normal'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
locationHistorySchema.index({ bus: 1, timestamp: -1 });

export default mongoose.model('LocationHistory', locationHistorySchema);