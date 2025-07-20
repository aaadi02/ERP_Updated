// Route Model for ES6 modules
import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Route name is required'],
    unique: true,
    trim: true
  },
  startPoint: {
    type: String,
    required: [true, 'Start point is required']
  },
  endPoint: {
    type: String,
    required: [true, 'End point is required']
  },
  stops: [{
    name: {
      type: String,
      required: [true, 'Stop name is required'],
      trim: true
    },
    sequence: {
      type: Number,
      required: [true, 'Stop sequence is required']
    },
    students: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
distance: {
    type: Number,
    // required: [true, 'Route distance is required']
  },
  duration: {
    type: Number,
    // required: [true, 'Route duration is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Route = mongoose.model('Route', routeSchema);

export default Route;