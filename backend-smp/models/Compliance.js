import mongoose from 'mongoose';

const complianceSchema = new mongoose.Schema({
  facultyId: {
    type: String,
    required: true,
    ref: 'Faculty'
  },
  facultyName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Mandatory Training',
      'License Renewal', 
      'Health & Safety',
      'Research Ethics',
      'Professional Development',
      'Legal Compliance',
      'Quality Assurance',
      'Data Protection',
      'Environmental Compliance'
    ]
  },
  requirement: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Completed', 'Pending', 'In Progress', 'Overdue', 'Not Started'],
    default: 'Pending'
  },
  priority: {
    type: String,
    required: true,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date,
    default: null
  },
  assignedDate: {
    type: Date,
    default: Date.now
  },
  reminderDate: {
    type: Date
  },
  certificateUrl: {
    type: String,
    default: null
  },
  certificateNumber: {
    type: String,
    default: null
  },
  issuingAuthority: {
    type: String,
    default: null
  },
  validUntil: {
    type: Date,
    default: null
  },
  renewalRequired: {
    type: Boolean,
    default: false
  },
  renewalPeriod: {
    type: Number, // in months
    default: null
  },
  documentUrls: [{
    name: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    note: String,
    addedBy: String,
    addedDate: {
      type: Date,
      default: Date.now
    }
  }],
  remindersSent: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['email', 'sms', 'notification']
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending']
    }
  }],
  approvalRequired: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: String,
    default: null
  },
  approvedDate: {
    type: Date,
    default: null
  },
  cost: {
    type: Number,
    default: 0
  },
  vendor: {
    type: String,
    default: null
  },
  trainingHours: {
    type: Number,
    default: 0
  },
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
complianceSchema.index({ facultyId: 1 });
complianceSchema.index({ status: 1 });
complianceSchema.index({ category: 1 });
complianceSchema.index({ dueDate: 1 });
complianceSchema.index({ priority: 1 });
complianceSchema.index({ department: 1 });

// Virtual for days until due
complianceSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = dueDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for overdue status
complianceSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'Completed') return false;
  return new Date() > new Date(this.dueDate);
});

// Pre-save middleware to update status based on completion
complianceSchema.pre('save', function(next) {
  if (this.completedDate && this.status !== 'Completed') {
    this.status = 'Completed';
    this.progressPercentage = 100;
  }
  
  if (!this.completedDate && this.status === 'Completed') {
    this.completedDate = new Date();
    this.progressPercentage = 100;
  }

  // Check if overdue
  if (this.dueDate && new Date() > new Date(this.dueDate) && this.status !== 'Completed') {
    this.status = 'Overdue';
  }

  next();
});

// Static method to get compliance statistics
complianceSchema.statics.getStatistics = async function(filters = {}) {
  const matchStage = { isActive: true };
  
  if (filters.department) matchStage.department = filters.department;
  if (filters.facultyId) matchStage.facultyId = filters.facultyId;
  if (filters.category) matchStage.category = filters.category;
  if (filters.dateRange) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(filters.dateRange));
    matchStage.createdAt = { $gte: daysAgo };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        },
        inProgress: {
          $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
        },
        overdue: {
          $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] }
        },
        critical: {
          $sum: { $cond: [{ $eq: ['$priority', 'Critical'] }, 1, 0] }
        },
        high: {
          $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    total: 0, completed: 0, pending: 0, inProgress: 0, overdue: 0, critical: 0, high: 0
  };
};

// Static method to get department-wise statistics
complianceSchema.statics.getDepartmentStats = async function() {
  return await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$department',
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
        },
        overdue: {
          $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        department: '$_id',
        total: 1,
        completed: 1,
        pending: 1,
        overdue: 1,
        complianceRate: {
          $round: [
            { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
            2
          ]
        }
      }
    },
    { $sort: { department: 1 } }
  ]);
};

// Static method to get upcoming deadlines
complianceSchema.statics.getUpcomingDeadlines = async function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return await this.find({
    isActive: true,
    status: { $ne: 'Completed' },
    dueDate: { $lte: futureDate }
  })
  .sort({ dueDate: 1 })
  .limit(10);
};

export default mongoose.model('Compliance', complianceSchema);
