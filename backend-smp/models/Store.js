import mongoose from 'mongoose';

// Store Category Schema
const storeCategorySchema = new mongoose.Schema({
  categoryId: {
    type: String,
    required: true,
    unique: true
  },
  categoryName: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Store Item Schema
const storeItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    unique: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Office Supplies', 'Cleaning Supplies', 'IT Equipment', 'Furniture', 'Lab Equipment', 'Books', 'Electronics', 'Maintenance', 'Safety Equipment', 'Sports Equipment', 'Other']
  },
  subcategory: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true,
    enum: ['Piece', 'Kilogram', 'Liter', 'Meter', 'Box', 'Pack', 'Set', 'Dozen', 'Ream', 'Carton', 'Other']
  },
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minimumStock: {
    type: Number,
    required: true,
    min: 0,
    default: 10
  },
  maximumStock: {
    type: Number,
    required: true,
    min: 0,
    default: 1000
  },
  reorderLevel: {
    type: Number,
    required: true,
    min: 0,
    default: 20
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  location: {
    building: String,
    floor: String,
    room: String,
    rack: String,
    shelf: String
  },
  supplier: {
    name: String,
    contact: String,
    email: String,
    address: String
  },
  specifications: String,
  brand: String,
  model: String,
  warranty: {
    duration: String,
    expiryDate: Date
  },
  purchaseDate: Date,
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued', 'out-of-stock'],
    default: 'active'
  },
  tags: [String],
  barcode: String,
  qrCode: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Store Transaction Schema (for stock movements)
const storeTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreItem',
    required: true
  },
  transactionType: {
    type: String,
    enum: ['inward', 'outward', 'adjustment', 'return', 'transfer'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalValue: {
    type: Number,
    min: 0
  },
  previousStock: {
    type: Number,
    required: true,
    min: 0
  },
  newStock: {
    type: Number,
    required: true,
    min: 0
  },
  department: {
    type: String,
    required: true
  },
  issuedTo: {
    name: String,
    employeeId: String,
    department: String,
    contact: String
  },
  receivedBy: {
    name: String,
    employeeId: String,
    department: String
  },
  reason: String,
  remarks: String,
  referenceNumber: String, // PO number, invoice number, etc.
  invoiceDetails: {
    invoiceNumber: String,
    invoiceDate: Date,
    supplierName: String
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Store Issue/Request Schema
const storeRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  requiredDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StoreItem',
      required: true
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    approvedQuantity: {
      type: Number,
      min: 0,
      default: 0
    },
    issuedQuantity: {
      type: Number,
      min: 0,
      default: 0
    },
    unitPrice: Number,
    totalValue: Number,
    remarks: String
  }],
  totalValue: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'partially-issued', 'issued', 'rejected', 'cancelled'],
    default: 'pending'
  },
  approvals: {
    storeKeeper: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
      approvedDate: Date,
      comments: String
    },
    departmentHead: {
      approved: { type: Boolean, default: false },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
      approvedDate: Date,
      comments: String
    }
  },
  issueDetails: {
    issuedDate: Date,
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    receivedBy: String,
    remarks: String
  },
  purpose: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Auto-generate transaction ID
storeTransactionSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.transactionId = `ST${year}${month}${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate total value if not provided
  if (!this.totalValue) {
    this.totalValue = this.quantity * this.unitPrice;
  }
  
  next();
});

// Auto-generate request ID
storeRequestSchema.pre('save', async function(next) {
  if (!this.requestId) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    this.requestId = `SR${year}${month}${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate total value
  if (this.items && this.items.length > 0) {
    this.totalValue = this.items.reduce((total, item) => {
      return total + (item.approvedQuantity * (item.unitPrice || 0));
    }, 0);
  }
  
  next();
});

// Auto-generate item ID
storeItemSchema.pre('save', async function(next) {
  if (!this.itemId) {
    const categoryCode = this.category.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const count = await this.constructor.countDocuments({ category: this.category });
    this.itemId = `${categoryCode}${String(count + 1).padStart(4, '0')}`;
  }
  
  next();
});

// Create indexes for better performance
storeItemSchema.index({ category: 1, status: 1 });
storeItemSchema.index({ itemName: 'text', description: 'text' });
storeItemSchema.index({ currentStock: 1, minimumStock: 1 });

storeTransactionSchema.index({ itemId: 1, transactionDate: -1 });
storeTransactionSchema.index({ transactionType: 1, department: 1 });

storeRequestSchema.index({ requestedBy: 1, status: 1 });
storeRequestSchema.index({ department: 1, requestDate: -1 });

const StoreCategory = mongoose.model('StoreCategory', storeCategorySchema);
const StoreItem = mongoose.model('StoreItem', storeItemSchema);
const StoreTransaction = mongoose.model('StoreTransaction', storeTransactionSchema);
const StoreRequest = mongoose.model('StoreRequest', storeRequestSchema);

export default {
  StoreCategory,
  StoreItem,
  StoreTransaction,
  StoreRequest
};

