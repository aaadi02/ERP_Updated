import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const conductorSchema = new mongoose.Schema({
  personalInfo: {
    firstName: { type: String, required: true },
    middleName: String,
    lastName: { type: String, required: true },
    dateOfBirth: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    contactNumber: { type: String, required: true },
    email: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    }
  },
  employment: {
    employeeId: { type: String, unique: true, required: true },
    dateOfJoining: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
  },
  emergencyContact: {
    name: String,
    contactNumber: String,
    relation: String
  },
  govtId: {
    aadharNumber: String,
    issuingAuthority: String
  },
  documents: {
    aadharCard: String,
    photo: String
  },
  health: {
    bloodGroup: String,
    medicalConditions: String
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  password: { type: String, required: true, select: false },
  assignedBus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    default: null
  },
  // Legacy fields for backward compatibility
  employeeId: { type: String, unique: true, required: true },
  dateOfJoining: Date,
  name: String,
  email: String,
  contact: String
}, { timestamps: true });

// Index for better performance
conductorSchema.index({ 'employment.employeeId': 1 });
conductorSchema.index({ employeeId: 1 });

// Hash password before saving
conductorSchema.pre('save', async function(next) {
  // Ensure employeeId is set from employment.employeeId for backward compatibility
  if (this.employment?.employeeId && !this.employeeId) {
    this.employeeId = this.employment.employeeId;
  }
  
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Password comparison method
conductorSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('Conductor', conductorSchema);