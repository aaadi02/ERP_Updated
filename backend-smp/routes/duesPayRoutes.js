import express from 'express';
import IssueRecord from '../models/IssueRecord.js';

const router = express.Router();


router.post('/pay', async (req, res) => {
  try {
    const { studentId, bookId, amount, method, transactionId } = req.body;

    console.log('Payment Request:', { studentId, bookId, amount, method, transactionId });

    if (!studentId || !bookId || !amount || !method || !transactionId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields',
        received: { studentId, bookId, amount, method, transactionId }
      });
    }

    // Find the issue record
    const issue = await IssueRecord.findById(bookId);
    
    if (!issue) {
      return res.status(404).json({ 
        success: false, 
        message: 'Issue record not found',
        details: { bookId }
      });
    }

    // Verify this is the correct borrower
    if (issue.studentId !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'This fine can only be paid by the assigned student'
      });
    }

    // Check if already paid
    if (issue.fineStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This fine has already been paid'
      });
    }

    // Verify status is active
    if (issue.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This issue is no longer active'
      });
    }

    console.log('Found issue:', issue);

    if (!issue) {
      return res.status(404).json({ 
        success: false, 
        message: 'Issue record not found or already paid.',
        details: { bookId, studentId }
      });
    }

    // Update the issue record
    issue.fineStatus = 'paid';
    issue.fineAmount = parseFloat(amount);
    issue.borrowerId = studentId; // Set the borrowerId
    issue.payment = {
      method,
      transactionId,
      paidAt: new Date()
    };

    const savedIssue = await issue.save();
    console.log('Saved issue:', savedIssue);

    res.json({ 
      success: true, 
      message: 'Payment successful! Fine marked as paid.',
      payment: {
        amount: savedIssue.fineAmount,
        method: savedIssue.payment.method,
        transactionId: savedIssue.payment.transactionId,
        paidAt: savedIssue.payment.paidAt
      }
    });
  } catch (err) {
    console.error('Payment Error:', err);
    res.status(500).json({ success: false, message: 'Payment failed!', error: err.message });
  }
});

// Get payment history for a student
router.get('/history/all', async (req, res) => {
  try {
    const paidIssues = await IssueRecord.find({
      fineStatus: 'paid',
      'payment.paidAt': { $exists: true }
    }).sort({ 'payment.paidAt': -1 });

    const history = paidIssues.map(issue => ({
      bookTitle: issue.bookTitle,
      amount: issue.fineAmount,
      method: issue.payment?.method,
      transactionId: issue.payment?.transactionId,
      invoiceUrl: issue.payment?.invoiceFile,
      date: issue.payment?.paidAt,
      studentId: issue.studentId,
      studentName: issue.studentName,
      department: issue.department
    }));

    res.json(history);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment history', error: err.message });
  }
});

router.get('/due', async (req, res) => {
  try {
    const currentDate = new Date();

    // Find overdue books
    const dues = await IssueRecord.find({
      dueDate: { $lt: currentDate },
      status: 'active',
      transactionType: 'issue',
      fineStatus: { $ne: 'paid' }
    });

    // Group dues by student
    const duesByStudent = {};
    dues.forEach(issue => {
      if (!duesByStudent[issue.studentId]) {
        duesByStudent[issue.studentId] = {
          studentId: issue.studentId,
          name: issue.studentName,
          rollNumber: issue.studentId,
          department: issue.department,
          totalFine: 0,
          books: []
        };
      }
      // Calculate days late and fine
      const daysLate = Math.max(
        0,
        Math.floor((currentDate - new Date(issue.dueDate)) / (1000 * 60 * 60 * 24))
      );
      const fine = daysLate * 2; // ₹2 per day

      duesByStudent[issue.studentId].totalFine += fine;
      duesByStudent[issue.studentId].books.push({
        id: issue._id,
        title: issue.bookTitle,
        returnDate: issue.dueDate,
        daysLate,
        fine
      });
    });

    res.json(Object.values(duesByStudent));
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dues', error: error.message });
  }
});

export default router;