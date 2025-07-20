import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: [true, 'Please provide registration number'],
    unique: true
  },
  chassisNumber: {
    type: String,
    required: [true, 'Please provide chassis number'],
    unique: true
  },
  engineNumber: {
    type: String,
    required: [true, 'Please provide engine number'],
    unique: true
  },
  manufacturingYear: {
    type: Number,
    required: [true, 'Please provide manufacturing year']
  },
  vehicleType: {
    type: String,
    enum: ['mini', 'standard', 'luxury'],
    required: [true, 'Please specify vehicle type']
  },
  seatingCapacity: {
    type: Number,
    required: [true, 'Please provide seating capacity']
  },
  standingCapacity: {
    type: Number,
    default: 0
  },
  number: {
    type: String,
    required: [true, 'Please provide bus number'],
    unique: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  conductor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conductor',
    default: null
  },
  route: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    default: null
  },
  currentLocation: {
    type: String,
    default: 'Depot'
  },
  currentDirection: {
    type: String,
    enum: ['departure', 'return'],
    default: 'departure'
  },
  nextStop: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['on-time', 'delayed', 'early', 'maintenance'], // Add 'early' to the enum
    default: 'on-time'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  currentPassengers: {
    students: {
      type: Number,
      default: 0
    },
    others: {
      type: Number,
      default: 0
    }
  },
  attendanceData: {
    date: {
      type: Date,
      default: Date.now
    },
    route: {
      type: String
    },
    direction: {
      type: String,
      enum: ['departure', 'return']
    },
    stop: {
      type: String
    },
    count: {
      type: Number,
      default: 0
    },
    totalStudents: {
      type: Number,
      default: 0
    }
  },
  alertMessage: {
    type: String,
    default: null
  },
  alertType: {
    type: String,
    enum: ['delayed', 'early', 'normal'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// Add pre-find middleware to populate driver and route
busSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'driver',
    select: 'personalInfo.firstName personalInfo.lastName personalInfo.contactNumber'
  }).populate('route');
  next();
});

// Add validation middleware
busSchema.pre('save', function(next) {
  const totalPassengers = this.currentPassengers.students + this.currentPassengers.others;
  if (totalPassengers > this.seatingCapacity) {
    next(new Error('Total passengers cannot exceed seating capacity'));
  }
  next();
});

// Export for ES6 modules
const BusModel = mongoose.model('Bus', busSchema);
export default BusModel;