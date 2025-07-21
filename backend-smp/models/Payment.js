import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    unique: true,
    sparse: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Online', 'Cheque', 'Bank Transfer', 'UPI', 'Card'],
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  feeHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeHead'
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Completed'
  },
  transactionId: {
    type: String,
    trim: true
  },
  remarks: {
    type: String,
    trim: true
  },
  collectedBy: {
    type: String,
    trim: true
  },
  semester: {
    type: Number,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add schema transformation to ensure populated data is returned
paymentSchema.methods.toJSON = function() {
  const payment = this.toObject();
  
  // Ensure student data is properly formatted
  if (payment.studentId && typeof payment.studentId === 'object' && payment.studentId._id) {
    payment.student = {
      id: payment.studentId._id,
      studentId: payment.studentId.studentId,
      name: `${payment.studentId.firstName || ''} ${payment.studentId.lastName || ''}`.trim(),
      firstName: payment.studentId.firstName,
      lastName: payment.studentId.lastName,
      department: payment.studentId.department,
      casteCategory: payment.studentId.casteCategory
    };
  }
  
  // Ensure fee head data is properly formatted
  if (payment.feeHead && typeof payment.feeHead === 'object' && payment.feeHead._id) {
    payment.feeHeadDetails = {
      id: payment.feeHead._id,
      title: payment.feeHead.title,
      amount: payment.feeHead.amount,
      description: payment.feeHead.description,
      applyTo: payment.feeHead.applyTo,
      filters: payment.feeHead.filters,
      collectionStats: {
        totalCollected: payment.feeHead.totalCollected || 0,
        collectionCount: payment.feeHead.collectionCount || 0,
        lastCollectionDate: payment.feeHead.lastCollectionDate
      }
    };
  }
  
  return payment;
};

// Auto-generate receipt number and payment ID before saving
paymentSchema.pre('save', async function(next) {
  try {
    // Generate payment ID if not exists
    if (!this.paymentId) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      this.paymentId = `PAY${year}${month}${day}${timestamp}${random}`;
    }

    // Generate receipt number if not exists
    if (!this.receiptNumber) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      this.receiptNumber = `RCP${year}${month}${day}${timestamp}${random}`;
    }

    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('Payment', paymentSchema); 
