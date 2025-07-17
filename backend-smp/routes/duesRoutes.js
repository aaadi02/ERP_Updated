import express from 'express';
import IssueRecord from '../models/IssueRecord.js';

const router = express.Router();

// Handle fine payment
router.post('/pay', async (req, res) => {
  try {
    const { studentId, bookId, amount, method, transactionId } = req.body;

    if (!studentId || !bookId || !amount || !method || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Find the issue record
    const issueRecord = await IssueRecord.findOne({
      _id: bookId,
      borrowerId: studentId,
      status: 'active',
      fineStatus: { $ne: 'paid' }
    });

    if (!issueRecord) {
      return res.status(404).json({
        success: false,
        message: 'Issue record not found or fine already paid'
      });
    }

    // Calculate current fine
    const daysLate = calculateDaysLate(issueRecord.dueDate);
    const currentFine = calculateFine(issueRecord.dueDate);

    // Verify payment amount
    if (parseFloat(amount) < currentFine) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount is less than the required fine'
      });
    }

    // Update the issue record
    issueRecord.fineAmount = parseFloat(amount);
    issueRecord.fineStatus = 'paid';
    await issueRecord.save();

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      payment: {
        studentId,
        bookId,
        amount,
        method,
        transactionId,
        date: new Date()
      }
    });
  } catch (error) {
    console.error('Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
});


router.get('/due', async (req, res) => {
  try {
    // Get current date
    const currentDate = new Date();
    
    // Find overdue books
    const dues = await IssueRecord.find({ 
      dueDate: { $lt: currentDate },
      status: 'active',
      transactionType: 'issue',
      fineStatus: { $ne: 'paid' }
    });

    if (!dues || dues.length === 0) {
      return res.json([]);
    }

    // Group dues by borrower
    const duesByBorrower = {};
    
    dues.forEach(issue => {
      const borrowerId = issue.borrowerType === 'student' ? issue.studentId : issue.employeeId;
      const borrowerName = issue.borrowerType === 'student' ? issue.studentName : issue.facultyName;
      
      if (!duesByBorrower[borrowerId]) {
        duesByBorrower[borrowerId] = {
          studentId: borrowerId,
          name: borrowerName,
          department: issue.department,
          rollNumber: issue.borrowerType === 'student' ? issue.studentId : issue.employeeId,
          totalFine: 0,
          books: []
        };
      }

      const daysLate = calculateDaysLate(issue.dueDate);
      const fine = calculateFine(issue.dueDate);

      duesByBorrower[borrowerId].totalFine += fine;
      duesByBorrower[borrowerId].books.push({
        id: issue._id,
        title: issue.bookTitle,
        returnDate: issue.dueDate,
        daysLate: daysLate,
        fine: fine
      });
    });

    // Convert to array and sort by total fine
    const formattedDues = Object.values(duesByBorrower)
      .sort((a, b) => b.totalFine - a.totalFine);

    res.json(formattedDues);
  } catch (error) {
    console.error('Dues Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch dues',
      error: error.message 
    });
  }
});

const calculateDaysLate = (dueDate) => {
  const today = new Date();
  const due = new Date(dueDate);
  
  // Set due date to end of day (23:59:59)
  due.setHours(23, 59, 59, 999);
  
  // Add 1 day to due date before calculating difference
  const gracePeriod = new Date(due);
  gracePeriod.setDate(gracePeriod.getDate() + 1);
  
  // Calculate days between grace period and today
  const daysLate = Math.floor((today - gracePeriod) / (1000 * 60 * 60 * 24));
  
  // Return 0 if not late, otherwise return days late
  return Math.max(0, daysLate);
};

// Get payment history for all paid fines
router.get('/history/all', async (req, res) => {
  try {
    // Find all paid fines
    const paidRecords = await IssueRecord.find({ 
      fineStatus: 'paid',
      fineAmount: { $gt: 0 }
    }).sort({ updatedAt: -1 }); // Sort by most recent first

    if (!paidRecords || paidRecords.length === 0) {
      return res.json([]);
    }

    // Format the payment history
    const paymentHistory = paidRecords.map(record => ({
      studentId: record.borrowerType === 'student' ? record.studentId : record.employeeId,
      studentName: record.borrowerType === 'student' ? record.studentName : record.facultyName,
      bookId: record._id,
      bookTitle: record.bookTitle,
      amount: record.fineAmount,
      method: 'Online', // Default payment method
      transactionId: `TXN${record._id.toString().slice(-8)}`, // Generate transaction ID from record ID
      date: record.updatedAt,
      invoiceUrl: null // No invoice URL for now
    }));

    res.json(paymentHistory);
  } catch (error) {
    console.error('Payment History Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message 
    });
  }
});

const calculateFine = (dueDate) => {
  const daysLate = calculateDaysLate(dueDate);
  return daysLate * 2; // ₹2 per day
};

export default router;