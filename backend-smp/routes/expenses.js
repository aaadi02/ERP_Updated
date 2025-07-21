import express from 'express';
const router = express.Router();
import Expense from '../models/Expense.js';
import Audit from '../models/Audit.js';
import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit-table';
import path from 'path';
import fs from 'fs';

// Clean up audit collection indexes on startup
const cleanupAuditIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('audits');
    const indexes = await collection.indexes();
    
    console.log('Checking audit collection indexes...');
    for (const index of indexes) {
      // Drop any unique indexes except _id_
      if (index.name !== '_id_' && index.unique) {
        console.log(`Dropping unique audit index: ${index.name}`);
        try {
          await collection.dropIndex(index.name);
        } catch (dropErr) {
          console.log(`Could not drop index ${index.name}:`, dropErr.message);
        }
      }
    }
    console.log('Audit collection index cleanup completed');
  } catch (err) {
    console.log('Audit index cleanup failed:', err.message);
  }
};

// Run cleanup once when the module loads
if (mongoose.connection.readyState === 1) {
  cleanupAuditIndexes();
} else {
  mongoose.connection.once('open', cleanupAuditIndexes);
}

// GET all expenses
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { remarks: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new expense
router.post('/', async (req, res) => {
  try {
    console.log('Expense creation request body:', req.body);
    const { title, description, amount, date, category, remarks } = req.body;
    if ((!title && !description) || !amount) {
      return res.status(400).json({ message: 'Title/Description and amount are required' });
    }
    
    // Create expense with a unique timestamp to avoid duplicates
    const now = new Date();
    const expense = new Expense({
      title: title || description,
      amount: parseFloat(amount),
      date: date || now,
      category: category || 'General',
      remarks: remarks || '',
      createdAt: now,
      updatedAt: now
    });
    
    console.log('About to save expense:', expense);
    
    try {
      const saved = await expense.save();
      console.log('Expense saved successfully:', saved._id);
      
      // Audit log
      try {
        await Audit.create({
          action: 'Expense Created',
          entityType: 'Expense',
          entityId: saved._id,
          user: 'system',
          details: `Expense "${saved.title}" of ₹${saved.amount} created.`
        });
      } catch (auditErr) {
        console.log('Audit log failed but expense created:', auditErr.message);
      }
      
      res.status(201).json(saved);
    } catch (saveErr) {
      // If duplicate key error, try to drop problematic indexes and retry
      if (saveErr.code === 11000) {
        console.log('Attempting to fix duplicate key issue...');
        try {
          // Drop any unique indexes on the expenses collection
          const collection = expense.collection;
          const indexes = await collection.indexes();
          
          for (const index of indexes) {
            if (index.name !== '_id_' && (index.unique || index.name.includes('title'))) {
              console.log(`Dropping problematic index: ${index.name}`);
              await collection.dropIndex(index.name);
            }
          }
          
          // Try saving again
          const retryExpense = new Expense({
            title: (title || description) + ` (${Date.now()})`, // Add timestamp to make it unique
            amount: parseFloat(amount),
            date: date || now,
            category: category || 'General',
            remarks: remarks || '',
            createdAt: now,
            updatedAt: now
          });
          
          const saved = await retryExpense.save();
          console.log('Expense saved successfully after index fix:', saved._id);
          
          res.status(201).json(saved);
        } catch (retryErr) {
          console.error('Failed to fix and retry:', retryErr);
          res.status(400).json({ message: 'Unable to save expense. Please try with a different title.' });
        }
      } else {
        throw saveErr;
      }
    }
  } catch (err) {
    console.error('Expense creation error:', err);
    if (err.code === 11000) {
      // Handle duplicate key error
      const duplicateField = err.message.includes('title') ? 'title' : 'unknown field';
      res.status(400).json({ 
        message: `Duplicate expense detected on ${duplicateField}. Please check if this expense already exists or try with different details.` 
      });
    } else {
      res.status(400).json({ message: err.message || 'Failed to create expense' });
    }
  }
});

// PATCH update expense status (approve/reject)
router.patch('/:id/status', async (req, res) => {
  try {
    console.log('Status update request:', { id: req.params.id, body: req.body });
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required in request body' });
    }
    
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Pending, Approved, or Rejected' });
    }
    
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    console.log('Found expense:', expense.title, 'Current status:', expense.status, 'New status:', status);
    
    expense.status = status;
    expense.updatedAt = new Date();
    const updated = await expense.save();
    
    console.log('Updated expense status successfully');
    
    // Audit log
    try {
      await Audit.create({
        action: `Expense ${status}`,
        entityType: 'Expense',
        entityId: expense._id,
        user: 'system',
        details: `Expense "${expense.title}" marked as ${status}.`,
        timestamp: new Date()
        // Removed actionId to avoid any potential conflicts
      });
      console.log('Audit log created successfully');
    } catch (auditErr) {
      console.log('Audit log failed but status updated:', auditErr.message);
      // Continue anyway - audit failure shouldn't block the main operation
    }
    
    res.json(updated);
  } catch (err) {
    console.error('Status update error:', err);
    res.status(400).json({ message: err.message || 'Failed to update expense status' });
  }
});

// GET total of approved expenses only (more specific route first)
router.get('/total/approved', async (req, res) => {
  try {
    const result = await Expense.aggregate([
      { $match: { status: 'Approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    res.json({ total: result[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET total of all non-rejected expenses
router.get('/total', async (req, res) => {
  try {
    const result = await Expense.aggregate([
      { $match: { status: { $ne: 'Rejected' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    res.json({ total: result[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.deleteOne();

    // Create audit log
    try {
      await Audit.create({
        action: 'Expense Deleted',
        entityType: 'Expense',
        entityId: expense._id,
        user: 'system',
        details: `Expense "${expense.title}" of ₹${expense.amount} was deleted.`,
        timestamp: new Date()
      });
    } catch (auditErr) {
      console.log('Audit log failed but expense deleted:', auditErr.message);
    }

    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET expenses as Excel
router.get('/export/excel', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    const headerInfo = req.query.headerInfo ? JSON.parse(req.query.headerInfo) : null;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses Report');

    // Set column widths
    worksheet.getColumn(1).width = 20;
    worksheet.getColumn(2).width = 18;
    worksheet.getColumn(3).width = 15;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 25;

    if (headerInfo) {
      // Document ID in top right (A1:F1)
      worksheet.mergeCells('A1:F1');
      const docIdCell = worksheet.getCell('F1');
      docIdCell.value = headerInfo.docId;
      docIdCell.font = { size: 10, bold: true };
      docIdCell.alignment = { horizontal: 'right' };
      
      // Society name
      worksheet.mergeCells('A2:F2');
      worksheet.getCell('A2').value = headerInfo.society;
      worksheet.getCell('A2').font = { size: 10 };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };
      
      // Institution Name (Large and Bold)
      worksheet.mergeCells('A3:F3');
      const nameCell = worksheet.getCell('A3');
      nameCell.value = headerInfo.instituteName;
      nameCell.font = { size: 16, bold: true };
      nameCell.alignment = { horizontal: 'center' };
      
      // Full Institute Name
      worksheet.mergeCells('A4:F4');
      worksheet.getCell('A4').value = headerInfo.instituteFullName;
      worksheet.getCell('A4').font = { size: 12, bold: true };
      worksheet.getCell('A4').alignment = { horizontal: 'center' };
      
      // Affiliation Info
      worksheet.mergeCells('A5:F5');
      worksheet.getCell('A5').value = headerInfo.affiliationInfo;
      worksheet.getCell('A5').font = { size: 10 };
      worksheet.getCell('A5').alignment = { horizontal: 'center' };
      
      // Address
      worksheet.mergeCells('A6:F6');
      worksheet.getCell('A6').value = headerInfo.address;
      worksheet.getCell('A6').font = { size: 10 };
      worksheet.getCell('A6').alignment = { horizontal: 'center' };
      
      // Contact Info (Email, Website, Phone)
      worksheet.mergeCells('A7:F7');
      worksheet.getCell('A7').value = `Email: ${headerInfo.email} | Website: ${headerInfo.website} | Phone: ${headerInfo.phone}`;
      worksheet.getCell('A7').font = { size: 10 };
      worksheet.getCell('A7').alignment = { horizontal: 'center' };
      
      // Separator line
      worksheet.mergeCells('A8:F8');
      const separatorCell = worksheet.getCell('A8');
      separatorCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      
      // Add some spacing
      worksheet.addRow([]);
    }
    
    // Add headers and data
    const headers = ['Title', 'Amount (₹)', 'Date', 'Category', 'Status', 'Remarks'];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };
    
    // Add data
    expenses.forEach(expense => {
      worksheet.addRow([
        expense.title,
        expense.amount,
        new Date(expense.date).toLocaleDateString(),
        expense.category,
        expense.status,
        expense.remarks || ''
      ]);
    });
    
    // Format amount column
    worksheet.getColumn(2).numFmt = '₹#,##0.00';
    
    // Add totals
    const totalRow = worksheet.addRow([
      'Total',
      expenses.reduce((sum, exp) => sum + exp.amount, 0),
      '', '', '', ''
    ]);
    totalRow.font = { bold: true };
    
    // Set content type and disposition
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Expenses_Report.xlsx');
    
    // Write to response
    await workbook.xlsx.write(res);
    
  } catch (err) {
    console.error('Excel export error:', err);
    res.status(500).json({ message: 'Failed to generate Excel report' });
  }
});

// GET expenses as PDF
router.get('/export/pdf', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    const headerInfo = req.query.headerInfo ? JSON.parse(req.query.headerInfo) : null;
    
    // Create PDF document with margins for proper alignment in landscape mode
    const doc = new PDFDocument({ 
      margin: { top: 30, bottom: 30, left: 40, right: 40 }, 
      size: 'A4',
      layout: 'landscape',
      bufferPages: true,
      autoFirstPage: true,
      font: 'Helvetica'
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Expenses_Report.pdf');
    
    // Pipe the PDF to the response
    doc.pipe(res);

    if (headerInfo) {
      // Set initial position for header text
      const startY = 35; // Fixed starting position from top
      doc.y = startY;

      // Try to load and add the logo
      try {
        // Try different image formats in order
        const possibleFormats = ['nietm.png', 'logo.png', 'nietm-logo.png', 'nietm-logo-new.png'];
        const searchPaths = [
          path.join(__dirname, '../..', 'frontend/public'),
          path.join(__dirname, '../..', 'frontend/src/assets'),
          path.join(__dirname, '../..', 'public'),
          path.join(__dirname, '..', 'public')
        ];

        let logoPath;
        let logoFound = false;

        // Search for logo in all possible locations
        for (const searchPath of searchPaths) {
          for (const format of possibleFormats) {
            const testPath = path.join(searchPath, format);
            console.log('Checking logo path:', testPath);
            if (fs.existsSync(testPath)) {
              logoPath = testPath;
              logoFound = true;
              console.log('Logo found at:', logoPath);
              break;
            }
          }
          if (logoFound) break;
        }

        if (logoFound) {
          // Add logo with specific dimensions on the left side
          const logoWidth = 120;
          const logoHeight = 120;
          const leftMargin = 40; // Match the document's left margin
          
          // Place logo on the left
          doc.image(logoPath, leftMargin, startY, {
            width: logoWidth,
            height: logoHeight,
            fit: [logoWidth, logoHeight]
          });
          
          // Adjust text position to accommodate logo
          doc.x = leftMargin + logoWidth + 25; // 25px spacing between logo and text
        } else {
          console.log('No suitable logo file found in any of the search paths');
          // Reset position if no logo
          doc.x = 40;
        }
      } catch (logoErr) {
        console.error('Logo loading failed:', logoErr);
        // Reset position if logo fails
        doc.x = 40;
      }

      // Calculate page dimensions for centering
      const pageWidth = doc.page.width;
      const textWidth = pageWidth - 80; // Full width minus margins

      // Document ID (top right corner)
      doc.font('Helvetica-Bold')
         .fontSize(9)
         .text(headerInfo.docId, pageWidth - 150, doc.y, { width: 110, align: 'right' });
      
      // Society name - centered across full width
      doc.font('Helvetica')
         .fontSize(10)
         .text(headerInfo.society, 40, doc.y, { width: textWidth, align: 'center' });
      
      // Institution Name (larger, bold)
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold')
         .fontSize(16)
         .text(headerInfo.instituteName.toUpperCase(), 40, doc.y, { width: textWidth, align: 'center' });
      
      // Institute full name
      doc.moveDown(0.4);
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .text(headerInfo.instituteFullName, 40, doc.y, { width: textWidth, align: 'center' });
      
      // Affiliation info
      doc.moveDown(0.4);
      doc.font('Helvetica')
         .fontSize(10)
         .text(headerInfo.affiliationInfo, 40, doc.y, { width: textWidth, align: 'center' });
      
      // Address
      doc.moveDown(0.4);
      doc.text(headerInfo.address, 40, doc.y, { width: textWidth, align: 'center' });
      
      // Contact Info as a single line
      doc.moveDown(0.4);
      doc.font('Helvetica')
         .fontSize(9)
         .text(
           `Email: ${headerInfo.email} | Website: ${headerInfo.website} | Phone: ${headerInfo.phone}`,
           40,
           doc.y,
           { width: textWidth, align: 'center' }
         );
      
      // Double separator lines with gradient
      doc.moveDown(1);
      // First line (thinner)
      doc.lineWidth(0.5)
         .lineCap('butt')
         .strokeColor('#666666')
         .moveTo(40, doc.y)
         .lineTo(doc.page.width - 40, doc.y)
         .stroke();
      
      // Second line (thicker, slightly below)
      doc.lineWidth(1)
         .lineCap('butt')
         .strokeColor('#000000')
         .moveTo(40, doc.y + 2)
         .lineTo(doc.page.width - 40, doc.y + 2)
         .stroke();
      
      // Add title
      doc.moveDown(1);
      doc.font('Helvetica-Bold')
         .fontSize(13)
         .text('EXPENSE REPORT', { align: 'center' });
      
      doc.moveDown(1);
    }
    
    // Configure table layout for landscape mode with center alignment
    const pageWidth = doc.page.width;
    const tableWidth = 742; // Adjusted for landscape A4 width
    const leftPadding = (pageWidth - tableWidth) / 2; // Calculate padding for centering

    const tableLayout = {
      width: tableWidth,
      x: leftPadding, // Position table from calculated left padding
      padding: 8,
      divider: {
        header: { width: 1, opacity: 1 },
        horizontal: { width: 0.5, opacity: 0.5 }
      },
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
      prepareRow: (row, indexCount) => {
        doc.font('Helvetica').fontSize(10);
        // Add subtle zebra striping
        return indexCount % 2 ? { backgroundColor: '#f5f5f5' } : null;
      }
    };
    
    // Create table data with column widths
    const tableData = {
      headers: ['Title', 'Amount (₹)', 'Date', 'Category', 'Status', 'Remarks'],
      columnSpacing: 10,
      columnWidths: [200, 100, 100, 120, 100, 122], // Sum should equal tableWidth - padding
      rows: expenses.map(expense => [
        expense.title,
        new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR'
        }).format(expense.amount),
        new Date(expense.date).toLocaleDateString(),
        expense.category,
        expense.status,
        expense.remarks || ''
      ])
    };
    
    // Add total row
    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    tableData.rows.push([
      'Total',
      new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(totalAmount),
      '', '', '', ''
    ]);
    
    // Draw table
    await doc.table(tableData, tableLayout);
    
    // Add footer with page numbers
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      
      // Add page numbers at bottom
      doc.font('Helvetica')
         .fontSize(8)
         .text(
           `Page ${i + 1} of ${pages.count}`,
           50,
           doc.page.height - 50,
           { align: 'center', width: doc.page.width - 100 }
         );
    }
    
    // Finalize PDF
    doc.end();
    
  } catch (err) {
    console.error('PDF export error:', err);
    // Send more detailed error information
    res.status(500).json({ 
      message: 'Failed to generate PDF report',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

export default router;
