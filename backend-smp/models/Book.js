import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  // Primary identifier
  ACCNO: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Book details
  ACCDATE: String,
  STATUS: {
    type: String,
    enum: ['PRESENT', 'ISSUE', 'LOST', 'DAMAGED'],
    default: 'PRESENT'
  },
  SERIESCODE: String,
  CLASSNO: String,
  AUTHOR: {
    type: String,
    required: true
  },
  TITLENAME: {
    type: String,
    required: true
  },
  'PUBLISHER NAME': String,
  CITY: String,
  'PUB.YEAR': String,
  PAGES: String,
  'VENDER CITY': String,
  INVOICENO: String,
  INVOICE_DATE: String,
  'SUB SUBJECT NAME': String,
  PRINTPRICE: String,
  PURPRICE: String,
  REFCIR: String,

  // ✅ Quantity tracking fields (add them here)
  QUANTITY: { type: Number, default: 1 },
  AVAILABLE: { type: Number, default: 1 },
  ISSUED: { type: Number, default: 0 },

  // Optional fields
  shelf: String,
  section: String,
  publisher: String,
  category: String,
  subCategory: String,
  price: Number,
  vendor: String,
  purchaseDate: String,
  invoiceNumber: String,

  materialType: {
    type: String,
    enum: ['book', 'magazine', 'journal', 'thesis', 'report', 'research', 'newspaper'],
    default: 'book'
  },

  currentBorrower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    default: null
  },

  issueHistory: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    returnDate: Date,
    actualReturnDate: Date,
    fine: {
      type: Number,
      default: 0
    }
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Book = mongoose.model('Book', bookSchema);
export default Book;
