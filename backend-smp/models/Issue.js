import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  ACCNO: {
    type: String,
    required: true,
    ref: 'Book'
  },
  bookTitle: {
    type: String,
    required: true
  },
  author: String,
  publisher: String,
  isbn: String,
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: Date,
  actualReturnDate: Date,
  borrowerType: {
    type: String,
    enum: ['student', 'faculty'],
    required: true
  },
  borrowerId: String, // Universal borrower ID field
  studentId: String,
  studentName: String,
  semester: String,
  course: String,
  employeeId: String,
  facultyName: String,
  designation: String,
  department: String,
  email: String,
  phone: String,
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue'],
    default: 'active'
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  fineStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },
  transactionType: {
    type: String,
    enum: ['issue', 'return', 'renew'],
    required: true
  }
}, {
  timestamps: true
});

// Create indexes
issueSchema.index({ ACCNO: 1, status: 1 });
issueSchema.index({ studentId: 1, status: 1 });
issueSchema.index({ employeeId: 1, status: 1 });
issueSchema.index({ issueDate: 1 });
issueSchema.index({ dueDate: 1 });
issueSchema.index({ returnDate: 1 });

const Issue = mongoose.model("Issue", issueSchema);

export default Issue;
