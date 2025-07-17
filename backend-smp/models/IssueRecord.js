import mongoose from 'mongoose';

const IssueRecordSchema = new mongoose.Schema({
  bookId: { type: String, required: true },
  bookTitle: { type: String, required: true },
  // Make borrowerType and borrowerId optional for lost book
  borrowerType: { type: String, enum: ['student', 'faculty'], required: false },
  borrowerId: { type: String, required: false },

  // Student fields (optional for lost book)
  studentId: { type: String, required: false },
  studentName: { type: String, required: false },
  semester: { type: String, default: '' },
  course: { type: String, default: 'General' },

  // Faculty fields (optional for lost book)
  employeeId: { type: String, required: false },
  facultyName: { type: String, required: false },
  designation: { type: String, required: false },

  // Common fields
  department: { type: String },
  email: { type: String },
  phone: { type: String },
  issueDate: { type: Date, default: Date.now },
  dueDate: { 
    type: Date, 
    required: true,
    default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days from now
  },
  returnDate: Date,
  actualReturnDate: Date,
  status: { 
    type: String, 
    enum: ['active', 'returned', 'lost'], 
    default: 'active' 
  },
  transactionType: { 
    type: String, 
    enum: ['issue', 'return', 'renew', 'lost'], 
    default: 'issue' 
  },
  fineAmount: { 
    type: Number, 
    default: 0 
  },
  fineStatus: { 
    type: String, 
    enum: ['none', 'pending', 'paid'], 
    default: 'none' 
  },
  
  // Lost book specific fields
  lostDate: { type: Date },
  lostReason: { 
    type: String, 
    enum: ['misplaced', 'damaged', 'stolen', 'torn', 'water_damage', 'other'] 
  },
  replacementCost: { type: Number, default: 0 },
  lostRemarks: { type: String },
  
  // Book details
  author: { type: String },
  publisher: { type: String },
  SERIESCODE: { type: String },
  
  payment: {
    method: String,
    transactionId: String,
    invoiceFile: String,
    paidAt: Date
  }
}, { timestamps: true });

// Add indexes for better query performance
IssueRecordSchema.index({ bookId: 1, status: 1 });
IssueRecordSchema.index({ studentId: 1, status: 1 });
IssueRecordSchema.index({ employeeId: 1, status: 1 });
IssueRecordSchema.index({ transactionType: 1 });

const IssueRecord = mongoose.model('IssueRecord', IssueRecordSchema);
export default IssueRecord;