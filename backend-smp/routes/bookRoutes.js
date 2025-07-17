import express from 'express';
import bookController from '../controllers/bookController.js';
import Book from '../models/Book.js';
import IssueRecord from '../models/IssueRecord.js';

const router = express.Router();


// Get all books (with optional type filter)
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    let filter = {};
    if (type) {
      // Assuming your Book model has a field called 'materialType'
      filter.materialType = type.toLowerCase(); // e.g., 'book', 'journal', 'ebooksource'
    }
    const books = await Book.find(filter);
    res.json({ books });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch books', error: err.message });
  }
});

// Get book by ACCNO
router.get('/accno/:accno', bookController.getBookByACCNO);

// Get book by ID
router.get('/:id', bookController.getBookById);

// POST /api/books - Add new book
router.post('/', async (req, res) => {
  try {
    console.log('Received book creation request with data:', req.body);

    // Check if book with same ACCNO already exists
    const existingBook = await Book.findOne({ ACCNO: req.body.ACCNO });
    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: `A book with ACCNO ${req.body.ACCNO} already exists. Please use a different ACCNO.`
      });
    }

    // Create new book
    const book = new Book({
      ACCNO: req.body.ACCNO,
      TITLENAME: req.body.TITLENAME,
      AUTHOR: req.body.AUTHOR,
      'PUBLISHER NAME': req.body['PUBLISHER NAME'],
      SERIESCODE: req.body.SERIESCODE,
      CLASSNO: req.body.CLASSNO,
      'PUB.YEAR': req.body['PUB.YEAR'],
      PAGES: req.body.PAGES,
      PRINTPRICE: req.body.PRINTPRICE,
      PURPRICE: req.body.PURPRICE,
      ACCDATE: req.body.ACCDATE,
      CITY: req.body.CITY,
      'VENDER CITY': req.body['VENDER CITY'],
      INVOICENO: req.body.INVOICENO,
      INVOICE_DATE: req.body.INVOICE_DATE,
      'SUB SUBJECT NAME': req.body['SUB SUBJECT NAME'],
      REFCIR: req.body.REFCIR,
      STATUS: 'PRESENT',
      QUANTITY: req.body.QUANTITY || 1,
      materialType: req.body.materialType || 'book'
    });

    await book.save();

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: book
    });

  } catch (err) {
    console.error('Error adding book:', err);
    
    // Handle duplicate key error specifically
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `A book with ACCNO ${req.body.ACCNO} already exists. Please use a different ACCNO.`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add book',
      error: err.message
    });
  }
});

// PUT /api/books/:id - Update book
router.put('/:id', bookController.updateBook);

// DELETE /api/books/:id - Delete book
router.delete('/:id', bookController.deleteBook);

// POST /api/books/issue - Issue a book
router.post('/issue', async (req, res) => {
  try {
    const {
      ACCNO,
      studentId,
      borrowerName,
      department,
      course,
      semester,
      issueDate,
      returnDate
    } = req.body;

    // Validate required fields
    if (!ACCNO || !studentId || !borrowerName) {
      return res.status(400).json({ 
        success: false,
        message: 'Required fields are missing' 
      });
    }

    // Check if book exists
    const book = await Book.findOne({ ACCNO });
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: 'Book not found' 
      });
    }

    // Check if book is already issued
    const activeIssue = await IssueRecord.findOne({
      bookId: ACCNO,
      status: 'active'
    });

    if (activeIssue) {
      return res.status(400).json({
        success: false,
        message: `This book (ACCNO: ${ACCNO}) is already issued to ${activeIssue.borrowerType === 'student' ? 'student' : 'faculty'} ${activeIssue.borrowerType === 'student' ? activeIssue.studentId : activeIssue.employeeId}`
      });
    }

    // Check if book has available quantity
    if (!book.QUANTITY || book.QUANTITY < 1) {
      return res.status(400).json({
        success: false,
        message: 'Book is out of stock'
      });
    }

    // Create issue record
    const issueRecord = new IssueRecord({
      bookId: ACCNO,
      bookTitle: book.TITLENAME,
      borrowerType: 'student',
      borrowerId: studentId, // Always set borrowerId for validation
      studentId,
      studentName: borrowerName,
      department,
      course,
      semester,
      issueDate: new Date(issueDate),
      dueDate: new Date(returnDate),
      status: 'active',
      transactionType: 'issue'
    });

    // Update book status and quantity
    book.QUANTITY -= 1;
    book.STATUS = 'ISSUE';
    
    // Save both records
    await Promise.all([
      issueRecord.save(),
      book.save()
    ]);

    return res.status(200).json({
      success: true,
      message: "Book issued successfully",
    });

  } catch (error) {
    console.error("Error issuing book:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to issue book",
    });
  }
});

// POST /api/books/return - Return a book
// POST /api/books/return - Return a book
router.post('/return', async (req, res) => {
  try {
    const { ACCNO } = req.body;

    // Step 1: Find active issue record
    const issueRecord = await IssueRecord.findOne({ bookId: ACCNO, status: 'active' });
    if (!issueRecord) {
      return res.status(404).json({ message: 'No active issue found for this book' });
    }

    // Step 2: Update issue status
    issueRecord.status = 'returned';
    issueRecord.actualReturnDate = new Date();
    await issueRecord.save();

    // ✅ Step 3: Update book stock
    const book = await Book.findOne({ ACCNO });
    if (!book) return res.status(404).json({ message: 'Book not found' });

    book.AVAILABLE += 1;
    book.ISSUED = Math.max(0, book.ISSUED - 1); // Prevent negative values
    book.STATUS = 'PRESENT'; // Optional: reset status
    await book.save();

    res.status(200).json({ 
      success: true, 
      message: 'Book returned successfully', 
      availableNow: book.AVAILABLE 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// POST /api/books/renew - Renew a book
router.post('/renew', async (req, res) => {
  try {
    const { ACCNO } = req.body;
    const issueRecord = await IssueRecord.findOne({ ACCNO, returned: false });
    if (!issueRecord) {
      return res.status(404).json({ message: 'No active issue found for this book' });
    }

    const newReturnDate = new Date();
    newReturnDate.setDate(newReturnDate.getDate() + 14); // Extend by 14 days
    issueRecord.returnDueDate = newReturnDate;
    await issueRecord.save();

    res.status(200).json({ message: 'Book renewed successfully', newReturnDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update book location route
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { shelf, section } = req.body;
    
    const book = await Book.findOneAndUpdate(
      { ACCNO: id },
      { $set: { shelf, section } },
      { new: true }
    );
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    console.error('Error updating book location:', error);
    res.status(500).json({ message: 'Failed to update book location' });
  }
});

// Get borrowed books for a faculty member
router.get('/api/books/borrowed', async (req, res) => {
  const { facultyId } = req.query;
  if (!facultyId) {
    return res.status(400).json({ success: false, message: 'facultyId is required' });
  }
  try {
    // Assuming Book model has a field like issuedTo or borrowerId that matches facultyId
    const borrowedBooks = await Book.find({ issuedTo: facultyId, returnDate: { $exists: false } });
    res.json({ success: true, books: borrowedBooks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

router.get('/accno/:accno', async (req, res) => {
  try {
    const book = await Book.findOne({ accessionNumber: req.params.accno });
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, book });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
