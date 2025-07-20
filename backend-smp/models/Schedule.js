import mongoose from 'mongoose';

const stopTimingSchema = new mongoose.Schema({
  stopName: {
    type: String,
    required: true
  },
  arrivalTime: {
    type: String,
    required: true
  },
  departureTime: {
    type: String,
    required: true
  }
});

const scheduleSchema = new mongoose.Schema({
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true
  },
  bus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  direction: {
    type: String,
    enum: ['outbound', 'inbound'],
    required: true
  },
  dayOfWeek: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  }],
  departureTime: {
    type: String,
    required: true
  },
  returnTime: {
    type: String,
    required: true
  },
  stopTimings: {
    outbound: [stopTimingSchema],
    inbound: [stopTimingSchema]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Export for ES6 modules
const Schedule = mongoose.model('Schedule', scheduleSchema);
export default Schedule;