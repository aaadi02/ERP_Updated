import mongoose from 'mongoose';
import IssueRecord from '../models/IssueRecord.js';

await mongoose.connect('mongodb+srv://yogibaba1207:74488851@ascetic.zjr8s.mongodb.net/?retryWrites=true&w=majority&appName=Ascetic'); // Change YOUR_DB_NAME

const dummyDues = [
  {
    bookId: '60d21b4667d0d8992e610c85',
    bookTitle: 'Data Structures',
    borrowerType: 'student',
    studentId: 'S001',
    studentName: 'Amit Kumar',
    department: 'CSE',
    course: 'B.Tech',         // <-- Add this
    semester: '5', 
    issueDate: new Date(Date.now() - 10 * 86400000),
    dueDate: new Date(Date.now() - 5 * 86400000),
    status: 'active',
    transactionType: 'issue',
    fineAmount: 50,
    fineStatus: 'pending'
  },
  {
    bookId: '60d21b4667d0d8992e610c86',
    bookTitle: 'Operating Systems',
    borrowerType: 'student',
    studentId: 'S001',
    studentName: 'Amit Kumar',
    department: 'CSE',
    course: 'B.Tech',         // <-- Add this
    semester: '5', 
    issueDate: new Date(Date.now() - 15 * 86400000),
    dueDate: new Date(Date.now() - 10 * 86400000),
    status: 'active',
    transactionType: 'issue',
    fineAmount: 100,
    fineStatus: 'pending'
  },
  {
    bookId: '60d21b4667d0d8992e610c87',
    bookTitle: 'Digital Logic',
    borrowerType: 'student',
    studentId: 'S002',
    studentName: 'Priya Singh',
    department: 'ECE',
    course: 'B.Tech',         // <-- Add this
    semester: '5', 
    issueDate: new Date(Date.now() - 12 * 86400000),
    dueDate: new Date(Date.now() - 8 * 86400000),
    status: 'active',
    transactionType: 'issue',
    fineAmount: 80,
    fineStatus: 'pending'
  },
  {
    bookId: '60d21b4667d0d8992e610c88',
    bookTitle: 'Computer Science',
    borrowerType: 'student',
    studentId: 'S002',
    studentName: 'Sunay Sawant',
    department: 'CS',
    course: 'B.Tech',         // <-- Add this
    semester: '5', 
    issueDate: new Date(Date.now() - 20 * 86400000),
    dueDate: new Date(Date.now() - 8 * 86400000),
    status: 'active',
    transactionType: 'issue',
    fineAmount: 200,
    fineStatus: 'pending'
  }
];

await IssueRecord.insertMany(dummyDues);
console.log('Dummy dues inserted!');
process.exit();