const Book = require('../models/Book');

// Borrow a Book
exports.borrowBook = async (req, res) => {
  try {
    const { bookId, borrowerName } = req.body;
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (!book.available) {
      return res.status(400).json({ message: 'Book is currently unavailable' });
    }

    book.available = false;
    book.borrower = borrowerName;
    book.dueDate = new Date();
    book.dueDate.setDate(book.dueDate.getDate() + 14); // 2 weeks from now

    await book.save();
    res.json({ message: 'Book borrowed successfully', book });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Return a Book
exports.returnBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.available) {
      return res.status(400).json({ message: 'Book was not borrowed' });
    }

    book.available = true;
    book.borrower = null;
    book.dueDate = null;

    await book.save();
    res.json({ message: 'Book returned successfully', book });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
