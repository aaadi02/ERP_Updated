import mongoose from 'mongoose';

// Maintenance Ticket Schema
const maintenanceTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Electrical', 'Plumbing', 'HVAC', 'Electronics', 'Furniture', 'Safety', 'Cleaning', 'Security', 'Other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'pending-approval', 'completed', 'cancelled'],
    default: 'open'
  },
  location: {
    building: { type: String, required: true },
    floor: { type: String },
    room: { type: String },
    area: { type: String }
  },
  reportedBy: {
    name: { type: String, required: true },
    employeeId: { type: String },
    email: { type: String },
    phone: { type: String },
    department: { type: String }
  },
  assignedTo: {
    name: { type: String },
    employeeId: { type: String },
    team: { type: String },
    contactInfo: { type: String }
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  actualCost: {
    type: Number,
    default: 0
  },
  budget: {
    approved: { type: Boolean, default: false },
    approvedBy: { type: String },
    approvalDate: { type: Date },
    budgetCategory: { 
      type: String, 
      enum: ['Routine', 'Emergency', 'Capital', 'Preventive', 'Repair'],
      default: 'Routine'
    }
  },
  timeline: {
    reportedDate: { type: Date, default: Date.now },
    targetCompletionDate: { type: Date },
    actualCompletionDate: { type: Date },
    estimatedHours: { type: Number },
    actualHours: { type: Number }
  },
  attachments: [{
    filename: String,
    url: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  workLog: [{
    date: { type: Date, default: Date.now },
    technician: String,
    workDone: String,
    hoursSpent: Number,
    materialsUsed: [String],
    notes: String
  }],
  materials: [{
    item: String,
    quantity: Number,
    unitCost: Number,
    totalCost: Number,
    supplier: String
  }],
  inspection: {
    required: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    inspector: String,
    inspectionDate: Date,
    passed: Boolean,
    notes: String
  }
}, {
  timestamps: true
});

// Auto-generate ticket ID
maintenanceTicketSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    const count = await this.constructor.countDocuments();
    const ticketNumber = (count + 1).toString().padStart(6, '0');
    this.ticketId = `MT${new Date().getFullYear()}${ticketNumber}`;
  }
  next();
});

// Scheduled Maintenance Schema
const scheduledMaintenanceSchema = new mongoose.Schema({
  scheduleId: {
    type: String
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Electrical', 'Plumbing', 'HVAC', 'Electronics', 'Furniture', 'Safety', 'Cleaning', 'Security', 'Other'],
    required: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'semi-annually', 'annually'],
    required: true
  },
  location: {
    building: { type: String, required: true },
    floor: { type: String },
    room: { type: String },
    area: { type: String }
  },
  assignedTeam: {
    type: String,
    required: true
  },
  estimatedDuration: {
    type: Number, // in hours
    required: true
  },
  estimatedCost: {
    type: Number,
    default: 0
  },
  nextScheduledDate: {
    type: Date,
    required: true
  },
  lastCompletedDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  checklist: [{
    task: String,
    required: { type: Boolean, default: true },
    completed: { type: Boolean, default: false }
  }],
  history: [{
    completedDate: Date,
    completedBy: String,
    actualDuration: Number,
    actualCost: Number,
    notes: String,
    issues: [String]
  }]
}, {
  timestamps: true
});

// Auto-generate schedule ID
scheduledMaintenanceSchema.pre('save', async function(next) {
  if (!this.scheduleId) {
    const count = await this.constructor.countDocuments();
    const scheduleNumber = (count + 1).toString().padStart(4, '0');
    this.scheduleId = `SM${new Date().getFullYear()}${scheduleNumber}`;
  }
  next();
});

// Maintenance Budget Schema
const maintenanceBudgetSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  category: {
    type: String,
    enum: ['Routine', 'Emergency', 'Capital', 'Preventive', 'Repair'],
    required: true
  },
  allocatedAmount: {
    type: Number,
    required: true
  },
  spentAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  department: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Calculate remaining amount before saving
maintenanceBudgetSchema.pre('save', function(next) {
  this.remainingAmount = this.allocatedAmount - this.spentAmount;
  next();
});

// Asset Maintenance Schema
const assetMaintenanceSchema = new mongoose.Schema({
  assetId: {
    type: String,
    required: true,
    unique: true
  },
  assetName: {
    type: String,
    required: true
  },
  assetType: {
    type: String,
    enum: ['HVAC', 'Generator', 'Elevator', 'Fire Safety', 'Security System', 'IT Equipment', 'Furniture', 'Vehicle', 'Other'],
    required: true
  },
  location: {
    building: String,
    floor: String,
    room: String
  },
  purchaseDate: Date,
  warrantyExpiry: Date,
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  maintenanceFrequency: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'semi-annually', 'annually']
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'repair', 'retired'],
    default: 'active'
  },
  maintenanceHistory: [{
    date: Date,
    type: { type: String, enum: ['routine', 'repair', 'emergency'] },
    description: String,
    cost: Number,
    performedBy: String
  }]
}, {
  timestamps: true
});

const MaintenanceTicket = mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
const ScheduledMaintenance = mongoose.model('ScheduledMaintenance', scheduledMaintenanceSchema);
const MaintenanceBudget = mongoose.model('MaintenanceBudget', maintenanceBudgetSchema);
const AssetMaintenance = mongoose.model('AssetMaintenance', assetMaintenanceSchema);

export {
  MaintenanceTicket,
  ScheduledMaintenance,
  MaintenanceBudget,
  AssetMaintenance
};

