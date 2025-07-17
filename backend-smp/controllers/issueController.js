// controllers/issueController.js
import IssueModel from '../models/Issue.js';
import IssueRecord from '../models/IssueRecord.js';
import Book from '../models/Book.js';
import Student from '../models/student.js';
import Faculty from '../models/faculty.js';

export const issueBookHandler = async (req, res) => {
  try {
    const {
      ACCNO,
      bookTitle,
      author,
      publisher,
      isbn,
      borrowerType,
      studentId,
      employeeId,
      studentName,
      facultyName,
      semester,
      course,
      designation,
      department,
      email,
      phone,
      issueDate,
      dueDate
    } = req.body;

    console.log('📚 Issue Request:', req.body);

    // Validate required fields
    if (!ACCNO || !borrowerType) {
      return res.status(400).json({ 
        success: false,
        message: 'Book ACCNO and borrower type are required'
      });
    }

    // Validate borrower ID
    const borrowerId = borrowerType === 'student' ? studentId : employeeId;
    if (!borrowerId) {
      return res.status(400).json({ 
        success: false,
        message: `${borrowerType === 'student' ? 'Student ID' : 'Employee ID'} is required`
      });
    }

    // Check if book exists and is available
    const book = await Book.findOne({ ACCNO });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (book.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Book is out of stock'
      });
    }

    // Check if borrower exists
    let borrower;
    if (borrowerType === 'student') {
      borrower = await Student.findOne({ studentId });
      if (!borrower) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
    } else {
      borrower = await Faculty.findOne({ employeeId });
      if (!borrower) {
        return res.status(404).json({
          success: false,
          message: 'Faculty not found'
        });
      }
    }

    // Check if book is already issued to this borrower in either collection
    const [existingIssue, existingIssueRecord] = await Promise.all([
      IssueModel.findOne({
        ACCNO,
        [borrowerType === 'student' ? 'studentId' : 'employeeId']: borrowerId,
        status: 'active',
        transactionType: 'issue'
      }),
      IssueRecord.findOne({
        bookId: ACCNO,
        [borrowerType === 'student' ? 'studentId' : 'employeeId']: borrowerId,
        status: 'active',
        transactionType: 'issue'
      })
    ]);

    if (existingIssue || existingIssueRecord) {
      return res.status(400).json({
        success: false,
        message: 'This book is already issued to this borrower'
      });
    }

    // Create issue record
    const issueData = {
      ACCNO,
      bookTitle: bookTitle || book.TITLE,
      author: author || book.AUTHOR,
      publisher: publisher || book.PUBLISHER,
      isbn: isbn || book.ISBN,
      borrowerType,
      borrowerId, // Universal borrower ID
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'active',
      transactionType: 'issue'
    };

    // Add borrower specific fields
    if (borrowerType === 'student') {
      issueData.studentId = studentId;
      issueData.studentName = studentName || `${borrower.firstName} ${borrower.lastName}`.trim();
      issueData.semester = semester || borrower.semester?.number || borrower.semester || '';
      issueData.course = course || borrower.stream?.name || borrower.course || borrower.branch || 'General';
      issueData.department = department || borrower.department?.name || borrower.department || '';
      issueData.email = email || borrower.email || '';
      issueData.phone = phone || borrower.mobileNumber || '';
    } else {
      issueData.employeeId = employeeId;
      issueData.facultyName = facultyName || borrower.name || `${borrower.firstName} ${borrower.lastName}`.trim();
      issueData.designation = designation || borrower.designation || '';
      issueData.department = department || borrower.department || '';
      issueData.email = email || borrower.email || '';
      issueData.phone = phone || borrower.mobile || '';
    }

    // Create records in both Issue and IssueRecord collections
    const issueRecord = new IssueModel(issueData);
    
    // Create an IssueRecord with the same data (with field mapping)
    const issueRecordData = {
      bookId: issueData.ACCNO,
      bookTitle: issueData.bookTitle,
      borrowerType: issueData.borrowerType,
      borrowerId: issueData.borrowerId,
      issueDate: issueData.issueDate,
      dueDate: issueData.dueDate,
      status: 'active',
      transactionType: 'issue'
    };
    
    // Add borrower specific fields to IssueRecord
    if (issueData.borrowerType === 'student') {
      issueRecordData.studentId = issueData.studentId;
      issueRecordData.studentName = issueData.studentName;
      issueRecordData.semester = issueData.semester;
      issueRecordData.course = issueData.course;
      issueRecordData.department = issueData.department;
      issueRecordData.email = issueData.email;
      issueRecordData.phone = issueData.phone;
    } else {
      issueRecordData.employeeId = issueData.employeeId;
      issueRecordData.facultyName = issueData.facultyName;
      issueRecordData.designation = issueData.designation;
      issueRecordData.department = issueData.department;
      issueRecordData.email = issueData.email;
      issueRecordData.phone = issueData.phone;
    }
    
    const issueRecordEntry = new IssueRecord(issueRecordData);

    // Update book quantity
    book.quantity -= 1;

    // Save all records
    await Promise.all([
      issueRecord.save(),
      issueRecordEntry.save(),
      book.save()
    ]);

    console.log('✅ Book issued successfully:', issueRecord._id);
    console.log('✅ IssueRecord created successfully:', issueRecordEntry._id);

    res.status(201).json({ 
      success: true,
      message: 'Book issued successfully',
      data: {
        issueRecord,
        issueRecordEntry,
        remainingQuantity: book.quantity
      }
    });

  } catch (error) {
    console.error('❌ Error issuing book:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error issuing book', 
      error: error.message 
    });
  }
};

// 📁 controllers/issueController.js

export const getBorrowedBooksByBorrower = async (req, res) => {
  try {
    const { borrowerId, borrowerType } = req.query;

    if (!borrowerId || !borrowerType) {
      return res.status(400).json({ success: false, message: "Missing borrowerId or borrowerType" });
    }

    // Query both models
    const [issueModelBooks, issueRecordBooks] = await Promise.all([
      IssueModel.find({
        borrowerId,
        borrowerType,
        status: 'active',
        transactionType: 'issue'
      }).lean(),
      
      IssueRecord.find({
        [borrowerType === 'student' ? 'studentId' : 'employeeId']: borrowerId,
        borrowerType,
        status: 'active',
        transactionType: 'issue'
      }).lean()
    ]);

    console.log(`Found ${issueModelBooks.length} books in Issue model and ${issueRecordBooks.length} books in IssueRecord model`);

    // Map IssueRecord books to match Issue model format for consistency
    const mappedIssueRecordBooks = issueRecordBooks.map(book => ({
      ...book,
      ACCNO: book.bookId, // Map bookId to ACCNO for frontend consistency
      bookId: book.bookId // Keep bookId for reference
    }));

    // Merge both arrays, avoiding duplicates by checking ACCNO/bookId
    const seenAccnos = new Set();
    const allBorrowedBooks = [];
    
    // Add Issue model books first
    issueModelBooks.forEach(book => {
      if (book.ACCNO && !seenAccnos.has(book.ACCNO)) {
        seenAccnos.add(book.ACCNO);
        allBorrowedBooks.push(book);
      }
    });
    
    // Then add IssueRecord books if not already included
    mappedIssueRecordBooks.forEach(book => {
      const accno = book.ACCNO || book.bookId;
      if (accno && !seenAccnos.has(accno)) {
        seenAccnos.add(accno);
        allBorrowedBooks.push(book);
      }
    });

    console.log(`Returning ${allBorrowedBooks.length} unique borrowed books`);

    res.status(200).json({ 
      success: true, 
      data: allBorrowedBooks,
      borrowedBooks: allBorrowedBooks // Include both formats for backward compatibility
    });
  } catch (error) {
    console.error('Error getting borrowed books:', error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const returnBookHandler = async (req, res) => {
  try {
    console.log('Received return request with data:', req.body);
    const { ACCNO, borrowerId, borrowerType, returnDate } = req.body;

    // Prepare queries for both models
    const issueModelQuery = {
      ACCNO,
      borrowerType,
      [borrowerType === 'student' ? 'studentId' : 'employeeId']: borrowerId,
      status: 'active',
      transactionType: { $in: ['issue', 'renew'] } // Include both issue and renew
    };

    const issueRecordQuery = {
      bookId: ACCNO,
      borrowerType,
      [borrowerType === 'student' ? 'studentId' : 'employeeId']: borrowerId,
      status: 'active',
      transactionType: { $in: ['issue', 'renew'] } // Include both issue and renew
    };

    console.log('Finding issue records with queries:', { issueModelQuery, issueRecordQuery });
    
    // Search for records in both collections
    const [issueModelRecord, issueRecord] = await Promise.all([
      IssueModel.findOne(issueModelQuery),
      IssueRecord.findOne(issueRecordQuery)
    ]);

    console.log('Found records:', { 
      issueModel: issueModelRecord ? issueModelRecord._id : 'not found', 
      issueRecord: issueRecord ? issueRecord._id : 'not found' 
    });

    if (!issueModelRecord && !issueRecord) {
      console.log('No active issue found for this book and borrower');
      return res.status(404).json({
        success: false,
        message: 'No active book found for this borrower. The book may not be currently issued or renewed to this borrower.'
      });
    }

    const today = new Date();
    let fineAmount = 0;

    // Process updates for both models if they exist
    const updates = [];

    // Update book quantity
    console.log('Updating book with ACCNO:', ACCNO);
    const book = await Book.findOne({ ACCNO });
    if (book) {
      book.quantity = (book.quantity || 0) + 1;
      updates.push(book.save());
      console.log('Book quantity updated');
    } else {
      console.log('Book not found with ACCNO:', ACCNO);
    }

    // Calculate fine based on the first record found
    const recordForFineCalc = issueModelRecord || issueRecord;
    if (recordForFineCalc && today > recordForFineCalc.dueDate) {
      const daysOverdue = Math.floor(
        (today - recordForFineCalc.dueDate) / (1000 * 60 * 60 * 24)
      );
      fineAmount = daysOverdue * 2;
      console.log(`Fine calculated: ${fineAmount} Rs for ${daysOverdue} days overdue`);
    }

    // Update IssueModel record if it exists
    if (issueModelRecord) {
      issueModelRecord.status = 'returned';
      issueModelRecord.transactionType = 'return';
      issueModelRecord.returnDate = returnDate || today;
      issueModelRecord.actualReturnDate = today;
      issueModelRecord.fineAmount = fineAmount;
      updates.push(issueModelRecord.save());
      console.log('IssueModel record updated');
    }

    // Update IssueRecord if it exists
    if (issueRecord) {
      issueRecord.status = 'returned';
      issueRecord.transactionType = 'return';
      issueRecord.returnDate = returnDate || today;
      issueRecord.actualReturnDate = today;
      issueRecord.fineAmount = fineAmount;
      issueRecord.fineStatus = fineAmount > 0 ? 'pending' : 'none';
      updates.push(issueRecord.save());
      console.log('IssueRecord updated');
    }

    // Save all updates
    await Promise.all(updates);
    
    const returnedRecord = issueRecord || issueModelRecord;

    res.status(200).json({
      success: true,
      message: fineAmount > 0
        ? `Book returned successfully. Fine amount: Rs. ${fineAmount}`
        : 'Book returned successfully',
      data: returnedRecord
    });

  } catch (err) {
    console.error('Error returning book:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to return book',
      error: err.message
    });
  }
};
