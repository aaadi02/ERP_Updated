import mongoose from 'mongoose';

const feePaymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccountStudent',
    required: true,
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true,
  },
  feeHeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeHeader',
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0,
  },
  pendingAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

feePaymentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const FeePayment = mongoose.model('FeePayment', feePaymentSchema);

export default FeePayment;
