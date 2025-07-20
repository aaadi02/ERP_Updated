import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const driverSchema = new mongoose.Schema({
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required']
    },
    middleName: String,
    lastName: {
      type: String,
      required: [true, 'Last name is required']
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true
    },
    contactNumber: {
      type: String,
      required: [true, 'Contact number is required']
    },
    email: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    }
  },
  license: {
    number: {
      type: String,
      required: [true, 'License number is required'],
      unique: true
    },
    expiryDate: {
      type: Date,
      required: [true, 'License expiry date is required']
    },
    issuingAuthority: {
      type: String,
      required: [true, 'Issuing authority is required']
    },
    aadharNumber: String
  },
  assignedBus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  employment: {
    employeeId: {
      type: String,
      unique: true,
      required: [true, 'Employee ID is required']
    },
    dateOfJoining: {
      type: Date,
      required: true
    },
    assignedBus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bus',
      default: null
    },
    assignedRoute: {
      type: mongoose.Schema.ObjectId,
      ref: 'Route'
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    }
  },
  emergencyContact: {
    name: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    relation: {
      type: String,
      required: true
    }
  },
  documents: {
    licenseImage: {
      type: String,
      required: [true, 'License image is required']
    },
    idProof: {
      type: String,
      required: [true, 'ID proof document is required']
    },
    photo: {
      type: String,
      required: [true, 'Profile photo is required']
    }
  },
  health: {
    bloodGroup: String,
    medicalConditions: String
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    default: 'driver',
    enum: ['driver']
  }
}, {
  timestamps: true
});

// Hash password before saving
driverSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash password
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Add password comparison method
driverSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Add static method to generate next employee ID
driverSchema.statics.generateNextEmployeeId = async function() {
  const lastDriver = await this.findOne({}, {}, { sort: { 'employment.employeeId': -1 } });
  if (!lastDriver || !lastDriver.employment?.employeeId) {
    return 'DRV001';
  }
  const lastNumber = parseInt(lastDriver.employment.employeeId.replace('DRV', ''));
  const nextNumber = lastNumber + 1;
  return `DRV${String(nextNumber).padStart(3, '0')}`;
};

export default mongoose.model('Driver', driverSchema);