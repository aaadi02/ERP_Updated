import express from 'express';
import mongoose from 'mongoose';
import IssueRecord from '../models/IssueRecord.js';
import Book from '../models/Book.js';
import Student from "../models/student.js";
import Faculty from "../models/faculty.js";
import Issue from "../models/Issue.js";
import { issueBookHandler, returnBookHandler, getBorrowedBooksByBorrower } from '../controllers/issueController.js';



const router = express.Router();


// Issue a book
router.post('/issue', issueBookHandler);
//     // Update book quantity
//     book.quantity -= 1;

//     // Save both records
//     await Promise.all([
//       issueRecord.save(),
//       book.save()
//     ]);

//     res.status(201).json({ 
//       success: true,
//       message: 'Book issued successfully',
//       data: {
//         issueRecord: issueRecord,
//         remainingQuantity: book.quantity
//       }   
//     });

//     // await issueRecord.save();
//     // res.status(201).json({
//     //   success: true,
//     //   message: 'Book issued successfully',
//     //   data: issueRecord
//     // });

//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to issue book',
//       error: err.message
//     });
//   }
// });

// Issue a book
// router.post('/issue', async (req, res) => {
//   try {
//     const {
//       bookId,
//       bookTitle,
//       borrowerType,
//       employeeId,
//       studentId,
//       borrowerName,
//       designation,
//       department,
//       issueDate,
//       dueDate
//     } = req.body;

//     // Verify if book exists
//     const book = await Book.findOne({ bookId });
//     if (!book) {
//       return res.status(404).json({
//         success: false,
//         message: 'Book not found'
//       });
//     }

//     // Check if book is available
//     if (book.quantity < 1) {
//       return res.status(400).json({
//         success: false,
//         message: 'Book is out of stock'
//       }); 
//     }

//     // Create issue record
//     const issueRecord = new IssueRecord({
//       bookId,
//       bookTitle,
//       borrowerType,
//       borrowerId: borrowerType === 'student' ? studentId : employeeId,
//       borrowerName,
//       designation: borrowerType === 'faculty' ? designation : undefined,
//       department,
//       issueDate: issueDate || new Date(),
//       dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
//       status: 'active',
//       transactionType: 'issue'
//     });

//     // Decrease book quantity
//     book.quantity -= 1;

//     // Save both records
//     await Promise.all([
//       issueRecord.save(),
//       book.save()
//     ]);

//     res.status(201).json({
//       success: true,
//       message: 'Book issued successfully',
//       data: {
//         issueRecord,
//         remainingQuantity: book.quantity
//       }
//     });

//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: 'Failed to issue book',
//       error: err.message
//     });
//   }
// });

// router.post('/issue', async (req, res) => {
//   try {
//     const {
//       bookId,
//       bookTitle,
//       studentId,
//       studentName,
//       borrowerType,
//       department,
//       semester,
//       course,
//       email,
//       phone,
//       issueDate,
//       dueDate
//     } = req.body;

//     // Validate required fields
//     if (!bookId || !bookTitle || !studentId || !studentName || !borrowerType) {
//       return res.status(400).json({
//         success: false,
//         message: 'Required fields missing'
//       });
//     }

//     // Create issue record
//     const issueRecord = new IssueRecord({
//       bookId,
//       bookTitle,
//       studentId,
//       studentName,
//       currentBorrower: {
//         borrowerType: borrowerType.toLowerCase()
//       },
//       department,
//       semester,
//       course,
//       email,
//       phone,
//       issueDate: issueDate || new Date(),
//       dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
//       transactionType: 'issue'
//     });

//     await issueRecord.save();

//     res.status(201).json({
//       success: true,
//       message: 'Book issued successfully',
//       data: issueRecord
//     });

//   } catch (err) {
//     console.error('Issue error:', err);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to issue book',
//       error: err.message
//     });
//   }
// });
// router.post('/issue', async (req, res) => {
//   try {
//     const {
//       bookId,
//       bookTitle,
//       studentId,
//       studentName,
//       department,
//       semester,
//       course,
//       email,
//       phone,
//       issueDate,
//       dueDate
//     } = req.body;

//     // Validate required fields
//     if (!bookId || !bookTitle || !studentId || !studentName) {
//       return res.status(400).json({
//         success: false,
//         message: 'Required fields missing'
//       });
//     }

//     // Create issue record
//     const issueRecord = new IssueRecord({
//       bookId,
//       bookTitle,
//       studentId,
//       studentName,
//       currentBorrower: {
//         borrowerType: 'student'  // Set default borrower type
//       },
//       department,
//       semester, 
//       course,
//       email,
//       phone,
//       issueDate: issueDate || new Date(),
//       dueDate: dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
//       status: 'active',
//       transactionType: 'issue'
//     });

//     await issueRecord.save();

//     res.status(201).json({
//       success: true,
//       message: 'Book issued successfully',
//       data: issueRecord
//     });

//   } catch (err) {
//     console.error('Issue error:', err);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to issue book',
//       error: err.message
//     });
//   }
// });
router.post('/issue', issueBookHandler);

router.get('/overview', async (req, res) => {
  try {
    const borrowedStats = await IssueRecord.aggregate([
      { $match: { transactionType: 'issue', status: 'active' } },
      {
        $group: {
          _id: '$bookId',
          borrowCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: 'ACCNO',
          as: 'bookInfo'
        }
      },
      { $unwind: '$bookInfo' },
      {
        $project: {
          title: '$bookInfo.TITLENAME',
          borrowCount: 1
        }
      }
    ]);

    res.json({ books: borrowedStats });
  } catch (error) {
    console.error('Error in /overview route:', error);
    res.status(500).json({ message: 'Failed to fetch borrowed book data' });
  }
});


router.post('/issue', async (req, res) => {
  try {
    console.log('Received issue request with data:', req.body);
    const { borrowerType } = req.body;

    // Validate required fields
    if (borrowerType === 'student') {
      if (!req.body.bookId || !req.body.bookTitle || !req.body.studentId || !req.body.studentName) {
        return res.status(400).json({
          success: false,
          message: 'For students: Book ID, Book Title, Student ID and Student Name are required'
        });
      }
    } else if (borrowerType === 'faculty') {
      if (!req.body.bookId || !req.body.bookTitle || !req.body.employeeId || !req.body.facultyName) {
        return res.status(400).json({
          success: false,
          message: 'For faculty: Book ID, Book Title, Employee ID and Faculty Name are required'
        });
      }
    }

    // Find the book
    const book = await Book.findOne({ ACCNO: req.body.bookId });
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (!book.availableQuantity || book.availableQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Book is out of stock'
      });
    }

    // ✅ Create issue record
    const issueRecord = new IssueRecord({
      bookId: req.body.bookId,
      bookTitle: req.body.bookTitle,
      borrowerType: req.body.borrowerType,
      borrowerId: borrowerType === 'student' ? req.body.studentId : req.body.employeeId, // ✅ for borrowed-books API

      // Student
      studentId: borrowerType === 'student' ? req.body.studentId : undefined,
      studentName: borrowerType === 'student' ? req.body.studentName : undefined,
      semester: borrowerType === 'student' ? req.body.semester : undefined,
      course: borrowerType === 'student' ? req.body.course : undefined,

      // Faculty
      employeeId: borrowerType === 'faculty' ? req.body.employeeId : undefined,
      facultyName: borrowerType === 'faculty' ? req.body.facultyName : undefined,
      designation: borrowerType === 'faculty' ? req.body.designation : undefined,

      // Common
      department: req.body.department,
      email: req.body.email,
      phone: req.body.phone,
      issueDate: req.body.issueDate || new Date(),
      dueDate: req.body.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'active',
      transactionType: 'issue'
    });

    // ⬇️ Update book stock
    book.availableQuantity -= 1;

    // Optional: update status
    book.STATUS = 'ISSUE';

    await Promise.all([
      issueRecord.save(),
      book.save()
    ]);

    res.status(201).json({
      success: true,
      message: 'Book issued successfully',
      data: {
        issueRecord,
        remainingQuantity: book.availableQuantity
      }
    });
  } catch (err) {
    console.error('Issue error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to issue book',
      error: err.message
    });
  }
});



// Get books issued to a student
// router.get('/student/:studentId', async (req, res) => {
//   try {
//     const { studentId } = req.params;

//     if (!studentId) {
//       return res.status(400).json({
//         success: false,
//         message: 'BT Number is required'
//       });
//     }

//     // Find all active issues for the student
//     const issuedBooks = await IssueRecord.find({
//       studentId: studentId,
//       status: 'active',
//       transactionType: 'issue'
//     }).select('_id bookId bookTitle author returnDate issueDate');

//     // If no books are issued
//     if (!issuedBooks || issuedBooks.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'No active books issued to this student'
//       });
//     }

//     // Return the issued books
//     res.status(200).json({
//       success: true,
//       data: issuedBooks,
//       count: issuedBooks.length
//     });

//   } catch (err) {
//     console.error('Error fetching issued books:', err);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch issued books',
//       error: err.message
//     });
//   }
// });

// Get books issued to a borrower (student or faculty)
// Get all borrowed books for a faculty member or student
// router.get('/borrowed-books', async (req, res) => {
//   try {
//     const { borrowerId, borrowerType } = req.query;
    
//     // Build query object
//     let query = { 
//       status: 'borrowed',
//       returnDate: null // or however you track unreturned books
//     };

//     // Add borrower filter if provided
//     if (borrowerId) {
//       if (borrowerType === 'student') {
//         query.user = borrowerId; // Assuming 'user' field stores student ID
//       } else if (borrowerType === 'teacher' || borrowerType === 'faculty') {
//         query.teacher = borrowerId; // Assuming you have a 'teacher' field
//         // OR if you store both in the same field with type:
//         // query.borrower = borrowerId;
//         // query.borrowerType = borrowerType;
//       }
//     }

//     console.log('Query:', query); // Debug log

//     // Find all active issues (borrowed books that haven't been returned)
//     const borrowedBooks = await Issue.find(query)
//       .populate('book', 'title author isbn category') // Populate book details
//       .populate('user', 'name email studentId') // Populate user details
//       .populate('teacher', 'name email employeeId') // If you have teacher field
//       .sort({ issueDate: -1 }); // Sort by most recent first

//     // Alternative query if you store status differently
//     // const borrowedBooks = await Issue.find({ 
//     //   returned: false 
//     // })
//     // .populate('book')
//     // .populate('user')
//     // .sort({ issueDate: -1 });

//     if (borrowedBooks.length === 0) {
//       return res.json({
//         success: true,
//         count: 0,
//         data: [],
//         message: 'No books currently issued to this borrower'
//       });
//     }

//     res.json({
//       success: true,
//       count: borrowedBooks.length,
//       data: borrowedBooks
//     });

//   } catch (error) {
//     console.error('Error fetching borrowed books:', error);
//     res.status(500).json({ 
//       success: false,
//       error: error.message 
//     });
//   }
// });


// routes/issueRoutes.js

router.get('/borrowed-books', getBorrowedBooksByBorrower);



router.get('/borrowed-books/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userBorrowedBooks = await Issue.find({ 
      user: userId,
      status: 'borrowed',
      returnDate: null
    })
    .populate('book', 'title author isbn category')
    .sort({ issueDate: -1 });

    res.json({
      success: true,
      count: userBorrowedBooks.length,
      data: userBorrowedBooks
    });

  } catch (error) {
    console.error('Error fetching user borrowed books:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// GET /api/issues/overdue-books - Fetch overdue books
router.get('/overdue-books', async (req, res) => {
  try {
    const currentDate = new Date();
    
    const overdueBooks = await Issue.find({
      status: 'borrowed',
      returnDate: null,
      dueDate: { $lt: currentDate } // Due date is less than current date
    })
    .populate('book', 'title author isbn')
    .populate('user', 'name email studentId')
    .sort({ dueDate: 1 }); // Sort by most overdue first

    res.json({
      success: true,
      count: overdueBooks.length,
      data: overdueBooks
    });

  } catch (error) {
    console.error('Error fetching overdue books:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});


// Return a book with fine calculation
router.post('/return', returnBookHandler);

router.post('/return/confirm-payment', async (req, res) => {
  try {
    const { issueId } = req.body;

    const record = await IssueRecord.findById(issueId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Issue record not found' });
    }

    if (record.fineAmount > 0) {
      record.fineStatus = 'paid';
      await record.save();
      return res.status(200).json({ success: true, message: 'Fine marked as paid' });
    }

    return res.status(400).json({ success: false, message: 'No fine to confirm' });
  } catch (err) {
    console.error('Fine confirm error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Renew a book
router.post('/renew', async (req, res) => {
  try {
    const { bookId, borrowerId, borrowerType, newReturnDate } = req.body;

    if (!bookId || !borrowerId || !borrowerType || !newReturnDate) {
      return res.status(400).json({
        success: false,
        message: 'Book ID, Borrower ID, Borrower Type and New Return Date are required'
      });
    }

    // Build query based on borrower type
    const query = {
      bookId,
      status: 'active'
    };

    if (borrowerType === 'student') {
      query.studentId = borrowerId;
    } else {
      query.employeeId = borrowerId;
    }

    const currentIssue = await IssueRecord.findOne(query);

    if (!currentIssue) {
      return res.status(404).json({
        success: false,
        message: 'No active issue found for this book and borrower'
      });
    }

    // Check if book has any pending fines
    if (currentIssue.fineStatus === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot renew - Book has pending fines'
      });
    }

    // Create new issue record for renewal
    const renewalRecord = new IssueRecord({
      bookId: currentIssue.bookId,
      bookTitle: currentIssue.bookTitle,
      borrowerType: borrowerType,
      // Student fields
      studentId: borrowerType === 'student' ? borrowerId : undefined,
      studentName: currentIssue.studentName,
      semester: currentIssue.semester,
      course: currentIssue.course,
      // Faculty fields
      employeeId: borrowerType === 'faculty' ? borrowerId : undefined,
      facultyName: currentIssue.facultyName,
      designation: currentIssue.designation,
      // Common fields
      department: currentIssue.department,
      email: currentIssue.email,
      phone: currentIssue.phone,
      issueDate: new Date(),
      dueDate: new Date(newReturnDate),
      status: 'active',
      transactionType: 'renew',
      previousIssueId: currentIssue._id,
      renewalCount: (currentIssue.renewalCount || 0) + 1
    });

    // Update current issue status to 'returned' instead of 'renewed'
    currentIssue.status = 'returned';
    currentIssue.actualReturnDate = new Date();
    currentIssue.transactionType = 'return';

    // Save both records
    await Promise.all([
      renewalRecord.save(),
      currentIssue.save()
    ]);

    res.status(200).json({
      success: true,
      message: 'Book renewed successfully',
      data: {
        renewalRecord,
        previousIssue: currentIssue
      }
    });

  } catch (err) {
    console.error('Renew error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to renew book',
      error: err.message
    });
  }
});

// Get active issues with fines
router.get('/active', async (req, res) => {
  try {
    const activeIssues = await Issue.find({ returnDate: null })
      .populate('bookId', 'title author')
      .lean();

    const issuesWithFines = activeIssues.map(issue => {
      const today = new Date();
      let fine = 0;
      let daysOverdue = 0;

      if (today > issue.dueDate) {
        daysOverdue = Math.floor((today - issue.dueDate) / (1000 * 60 * 60 * 24));
        fine = daysOverdue * 2;
      }

      return {
        ...issue,
        currentFine: fine,
        daysOverdue
      };
    });

    res.json(issuesWithFines);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch active issues' });
  }
});

// Get transaction history with filters
router.get('/history', async (req, res) => {
  try {
    const { bookId, studentId, employeeId, borrowerType, transactionType, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);


    // Build filter object
    const filter = {};

    if (bookId) {
      filter.bookId = bookId;
    }

    // Handle both student and faculty cases
    if (borrowerType === 'student' && studentId) {
      filter.studentId = studentId;
    } else if (borrowerType === 'faculty' && employeeId) {
      filter.employeeId = employeeId;
    }

    // Always include all transaction types in history, including 'return'
    // Only filter by transactionType if it is provided and not 'all'
    if (transactionType && transactionType !== 'all') {
      filter.transactionType = transactionType;
    }
    // Get total count for pagination
    const totalRecords = await IssueRecord.countDocuments(filter);
    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    // Get records with pagination
    const records = await IssueRecord.find(filter)
      .sort({ createdAt: -1 }) // Sort by latest first
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    res.status(200).json({
      success: true,
      data: {
        records,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords,
          limit: parseInt(limit)
        }
      }

    });

  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: err.message
    });
  }
});

// Generic issue creation endpoint
router.post('/', async (req, res) => {
  try {
    console.log('Received issue request with data:', req.body);
    const { borrowerType } = req.body;

    // Validate based on borrower type
    if (borrowerType === 'student') {
      if (!req.body.bookId || !req.body.bookTitle || !req.body.studentId || !req.body.studentName) {
        console.log('Missing required fields for student:', {
          bookId: req.body.bookId,
          bookTitle: req.body.bookTitle,
          studentId: req.body.studentId,
          studentName: req.body.studentName
        });
        return res.status(400).json({
          success: false,
          message: 'For students: Book ID, Book Title, Student ID and Student Name are required'
        });
      }
    } else if (borrowerType === 'faculty') {
      if (!req.body.bookId || !req.body.bookTitle || !req.body.employeeId || !req.body.facultyName) {
        console.log('Missing required fields for faculty:', {
          bookId: req.body.bookId,
          bookTitle: req.body.bookTitle,
          employeeId: req.body.employeeId,
          facultyName: req.body.facultyName
        });
        return res.status(400).json({
          success: false,
          message: 'For faculty: Book ID, Book Title, Employee ID and Faculty Name are required'
        });
      }
    }

    // Find the book and check its availability
    console.log('Looking up book with ACCNO:', req.body.bookId);
    const book = await Book.findOne({ ACCNO: req.body.bookId });
    if (!book) {
      console.log('Book not found with ACCNO:', req.body.bookId);
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }
    console.log('Found book:', book);

    // Check if book has available quantity
    if (!book.QUANTITY || book.QUANTITY < 1) {
      console.log('Book is out of stock:', book);
      return res.status(400).json({
        success: false,
        message: 'Book is out of stock'
      });
    }

    // Create issue record
    console.log('Creating issue record with data:', req.body);
    const issueRecord = new IssueRecord({
      ...req.body,
      issueDate: req.body.issueDate || new Date(),
      dueDate: req.body.dueDate || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      status: 'active',
      transactionType: 'issue'
    });

    // Decrease book quantity and update status
    book.QUANTITY -= 1;
    book.STATUS = 'ISSUE';

    // Save both records
    console.log('Saving records...');
    try {
      await Promise.all([
        issueRecord.save(),
        book.save()
      ]);
      console.log('Records saved successfully');
    } catch (saveError) {
      console.error('Error saving records:', saveError);
      throw saveError;
    }

    res.status(201).json({
      success: true,
      message: 'Book issued successfully',
      data: {
        issueRecord,
        remainingQuantity: book.QUANTITY
      }
    });
  } catch (err) {
    console.error('Issue error:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({
      success: false,
      message: 'Failed to issue book',
      error: err.message
    });
  }
});

// GET /api/borrowed-books/overview - Borrow count for each book
router.get('/borrowed-books/overview', async (req, res) => {
  try {
    // Aggregate all issue records (not just active), group by bookId
    const borrowedStats = await IssueRecord.aggregate([
      { $match: { transactionType: 'issue' } },
      {
        $group: {
          _id: '$bookId',
          borrowCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: 'ACCNO',
          as: 'bookInfo'
        }
      },
      { $unwind: { path: '$bookInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          bookId: '$_id',
          title: { $ifNull: ['$bookInfo.TITLE', '$bookId'] },
          borrowCount: 1
        }
      },
      { $sort: { borrowCount: -1 } }
    ]);
    res.json({ books: borrowedStats });
  } catch (error) {
    console.error('Error in /borrowed-books/overview:', error);
    res.status(500).json({ message: 'Failed to fetch borrowed book data' });
  }
});

// Get borrowed books for a student or faculty
router.get('/borrowed-books', async (req, res) => {
  try {
    const { borrowerId, borrowerType } = req.query;
    
    console.log('📚 Fetching borrowed books:', { borrowerId, borrowerType });

    if (!borrowerId || !borrowerType) {
      return res.status(400).json({ 
        success: false, 
        message: 'borrowerId and borrowerType are required' 
      });
    }

    // Validate borrower exists
    let borrower;
    if (borrowerType === 'student') {
      borrower = await Student.findOne({ studentId: borrowerId });
    } else {
      borrower = await Faculty.findOne({ employeeId: borrowerId });
    }

    if (!borrower) {
      return res.status(404).json({ 
        success: false, 
        message: `${borrowerType} not found` 
      });
    }

    // Find active issues for this borrower
    const query = {
      status: 'active',
      returnDate: null
    };

    // Set the correct ID field based on borrower type
    if (borrowerType === 'student') {
      query.studentId = borrowerId;
    } else {
      query.employeeId = borrowerId;
    }

    console.log('🔍 Finding issues with query:', query);

    const issues = await Issue.find(query)
      .select('ACCNO bookTitle issueDate dueDate status')
      .lean();

    console.log(`📖 Found ${issues.length} issues:`, issues);

    // Get full book details for each issue
    const borrowedBooks = await Promise.all(
      issues.map(async (issue) => {
        const book = await Book.findOne({ ACCNO: issue.ACCNO })
          .select('ACCNO TITLENAME AUTHOR PUBLISHER ISBN')
          .lean();

        return {
          ...issue,
          bookTitle: book?.TITLENAME || issue.bookTitle,
          author: book?.AUTHOR,
          publisher: book?.PUBLISHER,
          isbn: book?.ISBN,
          borrowerId,
          borrowerType
        };
      })
    );

    console.log(`📚 Sending ${borrowedBooks.length} books:`, borrowedBooks);

    res.json({
      success: true,
      borrowedBooks
    });
  } catch (error) {
    console.error('❌ Error fetching borrowed books:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching borrowed books',
      error: error.message
    });
  }
});

// Record a lost book
router.post('/lost', async (req, res) => {
  try {
    const {
      bookId,
      bookTitle,
      author,
      publisher,
      SERIESCODE,
      lostDate,
      lostReason,
      replacementCost,
      lostRemarks,
      borrowerType,
      studentId,
      studentName,
      employeeId,
      facultyName,
      department,
      course,
      semester,
      designation,
      email,
      phone,
      borrowerId
    } = req.body;

    console.log('📋 Recording lost book with borrower information:', {
      bookId,
      borrowerType,
      borrowerId: borrowerId || studentId || employeeId,
      studentId,
      employeeId
    });

    // Find the active issue record for this book and borrower
    const query = {
      bookId,
      status: 'active',
      transactionType: { $in: ['issue', 'renew'] } // Look for both issued and renewed books
    };

    // Add borrower-specific query
    if (borrowerType === 'student') {
      query.studentId = studentId;
    } else if (borrowerType === 'faculty') {
      query.employeeId = employeeId;
    }

    console.log('🔍 Looking for active issue with query:', query);

    const activeIssue = await IssueRecord.findOne(query);

    if (!activeIssue) {
      return res.status(404).json({
        success: false,
        message: `No active book found for this ${borrowerType}. The book may not be currently issued or renewed to this borrower.`
      });
    }

    console.log('📖 Found active issue:', {
      id: activeIssue._id,
      bookId: activeIssue.bookId,
      borrowerType: activeIssue.borrowerType,
      borrowerId: activeIssue.borrowerType === 'student' ? activeIssue.studentId : activeIssue.employeeId,
      currentTransactionType: activeIssue.transactionType
    });

    // Update the active issue record to mark it as lost
    activeIssue.status = 'lost';
    activeIssue.transactionType = 'lost';
    activeIssue.lostDate = lostDate || new Date();
    activeIssue.lostReason = lostReason;
    activeIssue.replacementCost = replacementCost;
    activeIssue.lostRemarks = lostRemarks;
    activeIssue.actualReturnDate = lostDate || new Date();

    // If missing borrower info in the original record, add it
    if (!activeIssue.author && author) activeIssue.author = author;
    if (!activeIssue.publisher && publisher) activeIssue.publisher = publisher;

    await activeIssue.save();
    
    console.log('✅ Active issue updated to lost status:', {
      id: activeIssue._id,
      status: activeIssue.status,
      transactionType: activeIssue.transactionType,
      borrowerType: activeIssue.borrowerType,
      borrowerId: activeIssue.borrowerType === 'student' ? activeIssue.studentId : activeIssue.employeeId
    });
    
    res.json({ 
      success: true, 
      message: 'Book marked as lost successfully', 
      data: activeIssue 
    });
  } catch (error) {
    console.error('Error recording lost book:', error);
    res.status(500).json({ success: false, message: 'Failed to record lost book', error: error.message });
  }
});

export default router;