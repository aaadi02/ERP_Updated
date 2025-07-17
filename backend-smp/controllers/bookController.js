import mongoose from 'mongoose';
import Book from '../models/Book.js';

const bookController = {
  // Get all books
  getBooks: async (req, res) => {
    try {
      const { search, status, page = 1, limit = "" } = req.query;
      const query = {};

      if (search) {
        query.$or = [
          { ACCNO: { $regex: search, $options: 'i' } },
          { TITLENAME: { $regex: search, $options: 'i' } },
          { AUTHOR: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        query.status = status;
      }

      const books = await Book.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const count = await Book.countDocuments(query);

      res.json({
        books,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      });
    } catch (err) {
      console.error('Error fetching books:', err);
      res.status(500).json({ message: 'Error fetching books' });
    }
  },

  // Get single book by ID or ACCNO
  getBookById: async (req, res) => {
    try {
      console.log('Fetching book with ID/ACCNO:', req.params.id);
      
      // Try to find by ACCNO first
      let book = await Book.findOne({ ACCNO: req.params.id });
      
      // If not found by ACCNO, try bookId
      if (!book) {
        book = await Book.findOne({ bookId: req.params.id });
      }
      
      if (!book) {
        console.log('Book not found with ID/ACCNO:', req.params.id);
        return res.status(404).json({ message: 'Book not found' });
      }
      
      console.log('Book found:', book);
      res.json(book);
    } catch (error) {
      console.error('Error fetching book:', error);
      res.status(500).json({ 
        message: 'Error fetching book',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Add or Update Book
  addOrUpdateBook: async (req, res) => {
    try {
      const bookData = req.body;
      console.log('Received book data:', bookData);

      // Validate required fields
      if (!bookData.ACCNO || !bookData.TITLENAME || !bookData.AUTHOR) {
        console.log('Missing required fields:', {
          ACCNO: bookData.ACCNO,
          TITLENAME: bookData.TITLENAME,
          AUTHOR: bookData.AUTHOR
        });
        return res.status(400).json({ message: 'ACCNO, TITLENAME, and AUTHOR are required' });
      }

      // Check if book exists
      let book = await Book.findOne({ ACCNO: bookData.ACCNO });
      console.log('Existing book found:', book);

      if (book) {
        // Update existing book
        book = await Book.findOneAndUpdate(
          { ACCNO: bookData.ACCNO },
          { 
            ...bookData, 
            QUANTITY: parseInt(bookData.QUANTITY) || book.QUANTITY || 1,
            updatedAt: new Date() 
          },
          { new: true, runValidators: true }
        );
        console.log('Book updated:', book);
        res.json({ message: 'Book updated successfully', book });
      } else {
        // Create new book
        book = new Book({
          ...bookData,
          STATUS: 'PRESENT',
          QUANTITY: parseInt(bookData.QUANTITY) || 1,
          materialType: 'book'
        });
        await book.save();
        console.log('New book created:', book);
        res.status(201).json({ message: 'Book added successfully', book });
      }
    } catch (err) {
      console.error('Error adding/updating book:', err);
      if (err.code === 11000) {
        res.status(400).json({ message: 'A book with this ACCNO already exists' });
      } else {
        res.status(500).json({ 
          message: 'Error adding/updating book',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
    }
  },

  // Add a new book
  addBook: async (req, res) => {
    try {
      const {
        title,
        author,
        isbn,
        quantity,
        bookId,
        shelf,
        section,
        materialType,
        publisher,
        vendor,
        purchaseDate,
        invoiceNumber,
        price,
        paymentMethod,
        paymentStatus
      } = req.body;

      // Validate material type
      const validMaterialTypes = ['book', 'magazine', 'journal', 'thesis', 'report', 'research', 'newspaper'];
      if (!validMaterialTypes.includes(materialType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid material type'
        });
      }

      const newBook = new Book({
        title,
        author,
        isbn,
        quantity,
        bookId,
        shelf,
        section,
        materialType,
        publisher,
        vendor,
        purchaseDate,
        invoiceNumber,
        price,
        paymentMethod,
        paymentStatus
      });

      await newBook.save();

      res.status(201).json({
        success: true,
        message: 'Material added successfully',
        data: newBook
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Update book by bookId
  updateBook: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Don't allow changing ACCNO
      delete updateData.ACCNO;

      const book = await Book.findOneAndUpdate(
        { ACCNO: id },
        updateData,
        { new: true }
      );

      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      res.json({ message: 'Book updated successfully', book });
    } catch (err) {
      console.error('Error updating book:', err);
      res.status(500).json({ message: 'Error updating book' });
    }
  },

  // Delete book by bookId
  deleteBook: async (req, res) => {
    try {
      const deletedBook = await Book.findOneAndDelete({ ACCNO: req.params.id });
      if (!deletedBook) {
        return res.status(404).json({ message: 'Book not found' });
      }
      res.json({ message: 'Book deleted successfully' });
    } catch (err) {
      console.error('Error deleting book:', err);
      res.status(500).json({ message: 'Error deleting book' });
    }
  },

  // Get book by ACCNO
  getBookByACCNO: async (req, res) => {
    try {
      console.log('Fetching book with ACCNO:', req.params.accno);
      const book = await Book.findOne({ ACCNO: req.params.accno });
      
      if (!book) {
        console.log('Book not found with ACCNO:', req.params.accno);
        return res.status(404).json({ message: 'Book not found' });
      }
      
      console.log('Book found:', book);
      res.json(book);
    } catch (error) {
      console.error('Error fetching book by ACCNO:', error);
      res.status(500).json({ 
        message: 'Error fetching book',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

export default bookController;
