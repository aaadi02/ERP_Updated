import mongoose from "mongoose";

const BorrowerEntrySchema = new mongoose.Schema({
  borrowerType: String,
  employeeId: String,
  firstName: String,
  lastName: String,
  gender: String,
  branchFaculty: String,
  designation: String,
  btStatus: String,
  active: String,
  btValidDate: String,
  librarian: String,
  admissionBatchSem: String,
  academicYear: String,
  duration: String,
  noOfRenewal: String,
  issueBooksWithinCategory: String,
  issueBBBook: String,
  bookBankDuration: String,
  bookBankValidDate: String,
  bookId: String,
  bookTitle: String,
  borrowDate: String,
  dueDate: String,
}, { timestamps: true });

export default mongoose.model("BorrowerEntry", BorrowerEntrySchema);