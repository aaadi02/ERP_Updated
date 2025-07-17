import mongoose from 'mongoose';

const borrowSchema = new mongoose.Schema({
  ookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
  bookTitle: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  studentName: { type: String },
  borrowedAt: { type: Date, default: Date.now },
  dueDate: { type: Date },
  returnedAt: { type: Date },
  isReturned: { type: Boolean, default: false }
});

const Borrow = mongoose.model("Borrow", borrowSchema);

export default Borrow;

