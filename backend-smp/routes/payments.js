import express from 'express';
const router = express.Router();

import Payment from '../models/Payment.js';
import Student from '../models/StudentManagement.js';
import FeeHead from '../models/FeeHead.js';
import Salary from '../models/Salary.js';
// const Student = require('../models/Student');
// const FeeHead = require('../models/FeeHead');
// const Salary = require('../models/Salary');

// GET: unified payment history (student payments + salary payments)
router.get('/history', async (req, res) => {
  try {
    const { search, type, status } = req.query;
    
    // Fetch student payments
    let studentPaymentQuery = {};
    if (search) {
      const studentQuery = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } },
        ],
      };
      const matchingStudents = await Student.find(studentQuery).select('_id');
      const studentIds = matchingStudents.map(s => s._id);

      studentPaymentQuery = {
        $or: [
          { studentId: { $in: studentIds } },
          { paymentId: { $regex: search, $options: 'i' } },
          { receiptNumber: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { transactionId: { $regex: search, $options: 'i' } },
          { remarks: { $regex: search, $options: 'i' } },
        ],
      };
    }
    
    if (status) {
      studentPaymentQuery.status = status;
    }

    // Fetch salary payments
    let salaryQuery = {};
    if (search) {
      salaryQuery = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { month: { $regex: search, $options: 'i' } },
        ],
      };
    }
    
    if (status) {
      salaryQuery.status = status;
    }

    let allPayments = [];

    // Fetch student payments if not filtered to salary only
    if (!type || type === 'student') {
      const studentPayments = await Payment.find(studentPaymentQuery)
        .populate('studentId', 'firstName lastName studentId department casteCategory')
        .populate('feeHead', 'title amount description applyTo')
        .lean();
      
      // Transform student payments to unified format
      const transformedStudentPayments = studentPayments.map(payment => ({
        _id: payment._id,
        type: 'student',
        paymentId: payment.paymentId || `SP-${payment._id.toString().slice(-8)}`,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        status: payment.status,
        description: payment.description || `Fee payment for ${payment.studentId?.firstName} ${payment.studentId?.lastName}`,
        student: {
          id: payment.studentId?._id,
          studentId: payment.studentId?.studentId,
          name: `${payment.studentId?.firstName || ''} ${payment.studentId?.lastName || ''}`.trim(),
          firstName: payment.studentId?.firstName,
          lastName: payment.studentId?.lastName,
          department: payment.studentId?.department,
          casteCategory: payment.studentId?.casteCategory
        },
        feeHead: payment.feeHead ? {
          id: payment.feeHead._id,
          title: payment.feeHead.title,
          amount: payment.feeHead.amount,
          description: payment.feeHead.description,
          applyTo: payment.feeHead.applyTo
        } : null,
        receiptNumber: payment.receiptNumber,
        transactionId: payment.transactionId,
        collectedBy: payment.collectedBy,
        remarks: payment.remarks
      }));
      
      allPayments = [...allPayments, ...transformedStudentPayments];
    }

    // Fetch salary payments if not filtered to student only
    if (!type || type === 'salary') {
      const salaryPayments = await Salary.find(salaryQuery).lean();
      
      // Transform salary payments to unified format
      const transformedSalaryPayments = salaryPayments.map(salary => ({
        _id: salary._id,
        type: 'salary',
        paymentId: `SAL-${salary._id.toString().slice(-8)}`,
        amount: salary.amount,
        paymentMethod: 'Bank Transfer',
        paymentDate: new Date(), // You might want to add a proper date field to Salary model
        status: salary.status,
        description: `Salary payment for ${salary.month}`,
        recipientName: salary.name,
        month: salary.month,
        receiptNumber: `SAL-${salary._id.toString().slice(-8)}`,
        transactionId: null,
        remarks: `Monthly salary for ${salary.month}`
      }));
      
      allPayments = [...allPayments, ...transformedSalaryPayments];
    }

    // Sort by payment date (newest first)
    allPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    
    res.json(allPayments);
  } catch (err) {
    console.error('Error fetching unified payment history:', err);
    res.status(500).json({ message: 'Error fetching payment history' });
  }
});

// GET: all payments
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      // Find students matching the search term first
      const studentQuery = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } },
        ],
      };
      const matchingStudents = await Student.find(studentQuery).select('_id');
      const studentIds = matchingStudents.map(s => s._id);

      query = {
        $or: [
          { studentId: { $in: studentIds } },
          { paymentId: { $regex: search, $options: 'i' } },
          { receiptNumber: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { transactionId: { $regex: search, $options: 'i' } },
          { remarks: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const payments = await Payment.find(query)
      .populate('studentId', 'firstName lastName studentId department casteCategory')
      .populate({
        path: 'feeHead',
        select: 'title amount description applyTo filters totalCollected collectionCount lastCollectionDate isActive'
      })
      .sort({ paymentDate: -1 });
    
    // Transform payments to include complete student and fee head details
    const transformedPayments = payments.map(payment => {
      const transformedPayment = {
        _id: payment._id,
        paymentId: payment.paymentId,
        receiptNumber: payment.receiptNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        status: payment.status,
        description: payment.description,
        transactionId: payment.transactionId,
        collectedBy: payment.collectedBy,
        remarks: payment.remarks,
        student: payment.studentId ? {
          id: payment.studentId._id,
          studentId: payment.studentId.studentId,
          name: `${payment.studentId.firstName} ${payment.studentId.lastName}`,
          firstName: payment.studentId.firstName,
          lastName: payment.studentId.lastName,
          department: payment.studentId.department,
          casteCategory: payment.studentId.casteCategory
        } : null,
        feeHead: payment.feeHead ? {
          id: payment.feeHead._id,
          title: payment.feeHead.title,
          amount: payment.feeHead.amount,
          description: payment.feeHead.description,
          applyTo: payment.feeHead.applyTo,
          filters: payment.feeHead.filters,
          collectionStats: {
            totalCollected: payment.feeHead.totalCollected || 0,
            collectionCount: payment.feeHead.collectionCount || 0,
            lastCollectionDate: payment.feeHead.lastCollectionDate
          },
          isActive: payment.feeHead.isActive
        } : null,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      };
      
      // Debug log for problematic payments
      if (!transformedPayment.feeHead && payment.feeHead) {
        console.log('⚠️ Payment with unpopulated feeHead:', {
          paymentId: payment._id,
          feeHeadId: payment.feeHead,
          feeHeadType: typeof payment.feeHead
        });
      }
      
      return transformedPayment;
    });
    
    res.json(transformedPayments);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

// GET: payments by student
router.get('/student/:studentId', async (req, res) => {
  try {
    const payments = await Payment.find({ studentId: req.params.studentId })
      .populate('studentId', 'firstName lastName studentId department casteCategory')
      .populate('feeHead', 'title amount description applyTo')
      .sort({ paymentDate: -1 });
    
    // Transform payments to include complete details
    const transformedPayments = payments.map(payment => ({
      _id: payment._id,
      paymentId: payment.paymentId,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      status: payment.status,
      description: payment.description,
      transactionId: payment.transactionId,
      collectedBy: payment.collectedBy,
      remarks: payment.remarks,
      student: {
        id: payment.studentId._id,
        studentId: payment.studentId.studentId,
        name: `${payment.studentId.firstName} ${payment.studentId.lastName}`,
        firstName: payment.studentId.firstName,
        lastName: payment.studentId.lastName,
        department: payment.studentId.department,
        casteCategory: payment.studentId.casteCategory
      },
      feeHead: payment.feeHead ? {
        id: payment.feeHead._id,
        title: payment.feeHead.title,
        amount: payment.feeHead.amount,
        description: payment.feeHead.description,
        applyTo: payment.feeHead.applyTo
      } : null,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    }));
    
    res.json(transformedPayments);
  } catch (err) {
    console.error('Error fetching student payments:', err);
    res.status(500).json({ message: 'Error fetching student payments' });
  }
});

// POST: make a payment
router.post('/', async (req, res) => {
  try {
    console.log('Payment request body:', req.body);
    
    const {
      studentId,
      amount,
      paymentMethod,
      feeHead,
      description,
      transactionId,
      collectedBy,
      remarks
    } = req.body;

    // Validate required fields
    if (!studentId || !amount || !paymentMethod) {
      console.log('Missing required fields:', { studentId, amount, paymentMethod });
      return res.status(400).json({ message: 'Student ID, amount, and payment method are required' });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      console.log('Student not found:', studentId);
      return res.status(404).json({ message: 'Student not found' });
    }

    console.log('Found student:', student.firstName, student.lastName);

    // Validate and verify fee head if provided
    let feeHeadDetails = null;
    if (feeHead && feeHead !== '') {
      feeHeadDetails = await FeeHead.findById(feeHead);
      if (!feeHeadDetails) {
        console.log('Invalid fee head ID:', feeHead);
        return res.status(400).json({ message: 'Invalid fee head selected' });
      }
      console.log('Fee head verified:', feeHeadDetails.title, 'Amount:', feeHeadDetails.amount);
    }

    // Create payment (receipt number and payment ID will be auto-generated)
    const payment = new Payment({
      studentId,
      amount: parseFloat(amount),
      paymentMethod,
      feeHead: feeHead && feeHead !== '' ? feeHead : undefined,
      description: description || (feeHeadDetails ? `${feeHeadDetails.title} - ${student.firstName} ${student.lastName}` : ''),
      transactionId: transactionId || '',
      collectedBy: collectedBy || '',
      remarks: remarks || (feeHeadDetails ? `Payment for ${feeHeadDetails.title}` : '')
    });

    console.log('Payment object created:', {
      ...payment.toObject(),
      feeHeadTitle: feeHeadDetails?.title
    });

    await payment.save();
    console.log('Payment saved successfully with receipt:', payment.receiptNumber);

    // Update fee head usage statistics if fee head is specified
    if (feeHeadDetails) {
      try {
        // Update fee head with latest collection info
        feeHeadDetails.lastCollectionDate = new Date();
        feeHeadDetails.totalCollected = (feeHeadDetails.totalCollected || 0) + parseFloat(amount);
        feeHeadDetails.collectionCount = (feeHeadDetails.collectionCount || 0) + 1;
        await feeHeadDetails.save();
        console.log('Fee head statistics updated:', {
          title: feeHeadDetails.title,
          totalCollected: feeHeadDetails.totalCollected,
          collectionCount: feeHeadDetails.collectionCount
        });
      } catch (feeHeadUpdateErr) {
        console.warn('Failed to update fee head statistics:', feeHeadUpdateErr.message);
        // Don't fail the payment if fee head update fails
      }
    }

    // Update student's fees paid using findByIdAndUpdate to avoid validation issues
    const updatedFeesPaid = (student.feesPaid || 0) + parseFloat(amount);
    const updatedPendingAmount = Math.max(0, (student.pendingAmount || 0) - parseFloat(amount));
    
    await Student.findByIdAndUpdate(
      student._id,
      {
        feesPaid: updatedFeesPaid,
        pendingAmount: updatedPendingAmount
      },
      { runValidators: false } // Skip validation for this update
    );
    console.log('Student updated:', { feesPaid: updatedFeesPaid, pendingAmount: updatedPendingAmount });

    // Populate payment for response with complete details
    await payment.populate('studentId', 'firstName lastName studentId department casteCategory');
    await payment.populate('feeHead', 'title amount description applyTo filters totalCollected collectionCount lastCollectionDate');

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment: {
        _id: payment._id,
        paymentId: payment.paymentId,
        receiptNumber: payment.receiptNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        status: payment.status,
        description: payment.description,
        transactionId: payment.transactionId,
        collectedBy: payment.collectedBy,
        remarks: payment.remarks,
        student: {
          id: payment.studentId._id,
          studentId: payment.studentId.studentId,
          name: `${payment.studentId.firstName} ${payment.studentId.lastName}`,
          firstName: payment.studentId.firstName,
          lastName: payment.studentId.lastName,
          department: payment.studentId.department,
          casteCategory: payment.studentId.casteCategory
        },
        feeHead: payment.feeHead ? {
          id: payment.feeHead._id,
          title: payment.feeHead.title,
          amount: payment.feeHead.amount,
          description: payment.feeHead.description,
          applyTo: payment.feeHead.applyTo,
          filters: payment.feeHead.filters,
          collectionStats: {
            totalCollected: payment.feeHead.totalCollected || 0,
            collectionCount: payment.feeHead.collectionCount || 0,
            lastCollectionDate: payment.feeHead.lastCollectionDate
          }
        } : null,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      },
      feeHeadInfo: feeHeadDetails ? {
        id: feeHeadDetails._id,
        title: feeHeadDetails.title,
        standardAmount: feeHeadDetails.amount,
        updatedTotalCollected: feeHeadDetails.totalCollected,
        updatedCollectionCount: feeHeadDetails.collectionCount
      } : null,
      updatedStudent: {
        feesPaid: student.feesPaid,
        pendingAmount: student.pendingAmount
      }
    });
  } catch (err) {
    console.error('Error recording payment:', err);
    console.error('Error stack:', err.stack);
    if (err.code === 11000) {
      // Duplicate receipt number - try again
      return res.status(500).json({ message: 'Receipt number conflict. Please try again.' });
    }
    res.status(500).json({ message: 'Error recording payment: ' + err.message });
  }
});

// GET: payment receipt
router.get('/receipt/:receiptNumber', async (req, res) => {
  try {
    const payment = await Payment.findOne({ receiptNumber: req.params.receiptNumber })
      .populate('studentId', 'firstName lastName studentId department casteCategory')
      .populate({
        path: 'feeHead',
        select: 'title amount description applyTo filters totalCollected collectionCount lastCollectionDate isActive'
      });
    
    if (!payment) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    
    // Transform payment to include complete details
    const transformedPayment = {
      _id: payment._id,
      paymentId: payment.paymentId,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      status: payment.status,
      description: payment.description,
      transactionId: payment.transactionId,
      collectedBy: payment.collectedBy,
      remarks: payment.remarks,
      student: {
        id: payment.studentId._id,
        studentId: payment.studentId.studentId,
        name: `${payment.studentId.firstName} ${payment.studentId.lastName}`,
        firstName: payment.studentId.firstName,
        lastName: payment.studentId.lastName,
        department: payment.studentId.department,
        casteCategory: payment.studentId.casteCategory
      },
      feeHead: payment.feeHead ? {
        id: payment.feeHead._id,
        title: payment.feeHead.title,
        amount: payment.feeHead.amount,
        description: payment.feeHead.description,
        applyTo: payment.feeHead.applyTo,
        filters: payment.feeHead.filters,
        collectionStats: {
          totalCollected: payment.feeHead.totalCollected || 0,
          collectionCount: payment.feeHead.collectionCount || 0,
          lastCollectionDate: payment.feeHead.lastCollectionDate
        },
        isActive: payment.feeHead.isActive
      } : null,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };
    
    res.json(transformedPayment);
  } catch (err) {
    console.error('Error fetching receipt:', err);
    res.status(500).json({ message: 'Error fetching receipt' });
  }
});

// GET: all fee heads with collection stats
router.get('/fee-heads', async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    
    let query = {};
    if (!includeInactive) {
      query.isActive = { $ne: false }; // Include undefined as well as true
    }

    const feeHeads = await FeeHead.find(query)
      .populate('filters.stream', 'name')
      .sort({ title: 1 });

    // Enrich with real-time collection data from payments
    const enrichedFeeHeads = await Promise.all(
      feeHeads.map(async (feeHead) => {
        // Get real-time collection stats
        const collectionStats = await Payment.aggregate([
          { $match: { feeHead: feeHead._id } },
          {
            $group: {
              _id: null,
              realTimeTotal: { $sum: '$amount' },
              realTimeCount: { $sum: 1 },
              lastPayment: { $max: '$paymentDate' }
            }
          }
        ]);

        const realTimeData = collectionStats[0] || { 
          realTimeTotal: 0, 
          realTimeCount: 0, 
          lastPayment: null 
        };

        return {
          ...feeHead.toObject(),
          collectionStats: {
            storedTotal: feeHead.totalCollected || 0,
            storedCount: feeHead.collectionCount || 0,
            realTimeTotal: realTimeData.realTimeTotal,
            realTimeCount: realTimeData.realTimeCount,
            lastPayment: realTimeData.lastPayment || feeHead.lastCollectionDate,
            avgPayment: realTimeData.realTimeCount > 0 ? 
              Math.round((realTimeData.realTimeTotal / realTimeData.realTimeCount) * 100) / 100 : 0,
            collectionRate: feeHead.amount > 0 && realTimeData.realTimeCount > 0 ? 
              Math.round((realTimeData.realTimeTotal / (feeHead.amount * realTimeData.realTimeCount)) * 100 * 100) / 100 : 0
          }
        };
      })
    );

    res.json(enrichedFeeHeads);
  } catch (err) {
    console.error('Error fetching fee heads:', err);
    res.status(500).json({ message: 'Error fetching fee heads with collection stats' });
  }
});

// GET: fee head collection statistics
router.get('/fee-heads/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.paymentDate = {};
      if (startDate) dateFilter.paymentDate.$gte = new Date(startDate);
      if (endDate) dateFilter.paymentDate.$lte = new Date(endDate);
    }

    // Get fee head collection stats
    const feeHeadStats = await Payment.aggregate([
      { $match: { ...dateFilter, feeHead: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: 'feeheads',
          localField: 'feeHead',
          foreignField: '_id',
          as: 'feeHeadDetails'
        }
      },
      { $unwind: '$feeHeadDetails' },
      {
        $group: {
          _id: '$feeHead',
          feeHeadTitle: { $first: '$feeHeadDetails.title' },
          feeHeadAmount: { $first: '$feeHeadDetails.amount' },
          totalCollected: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          avgPayment: { $avg: '$amount' },
          lastPayment: { $max: '$paymentDate' },
          paymentMethods: { $addToSet: '$paymentMethod' }
        }
      },
      { $sort: { totalCollected: -1 } }
    ]);

    // Get payments without fee head
    const paymentsWithoutFeeHead = await Payment.countDocuments({
      ...dateFilter,
      $or: [
        { feeHead: { $exists: false } },
        { feeHead: null }
      ]
    });

    const amountWithoutFeeHead = await Payment.aggregate([
      {
        $match: {
          ...dateFilter,
          $or: [
            { feeHead: { $exists: false } },
            { feeHead: null }
          ]
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Calculate totals
    const totalFeeHeadCollections = feeHeadStats.reduce((sum, stat) => sum + stat.totalCollected, 0);
    const totalFeeHeadPayments = feeHeadStats.reduce((sum, stat) => sum + stat.totalPayments, 0);

    res.json({
      feeHeadStats: feeHeadStats.map(stat => ({
        feeHeadId: stat._id,
        feeHeadTitle: stat.feeHeadTitle,
        standardAmount: stat.feeHeadAmount,
        totalCollected: stat.totalCollected,
        totalPayments: stat.totalPayments,
        avgPayment: Math.round(stat.avgPayment * 100) / 100,
        lastPayment: stat.lastPayment,
        paymentMethods: stat.paymentMethods,
        collectionRate: stat.feeHeadAmount > 0 ? 
          Math.round((stat.totalCollected / stat.feeHeadAmount) * 100 * 100) / 100 : 0
      })),
      summary: {
        totalFeeHeadCollections,
        totalFeeHeadPayments,
        paymentsWithoutFeeHead,
        amountWithoutFeeHead: amountWithoutFeeHead[0]?.total || 0,
        avgFeeHeadPayment: totalFeeHeadPayments > 0 ? 
          Math.round((totalFeeHeadCollections / totalFeeHeadPayments) * 100) / 100 : 0
      }
    });
  } catch (err) {
    console.error('Error fetching fee head stats:', err);
    res.status(500).json({ message: 'Error fetching fee head collection statistics' });
  }
});

// GET: detailed fee head collection report
router.get('/fee-heads/:feeHeadId/report', async (req, res) => {
  try {
    const { feeHeadId } = req.params;
    const { startDate, endDate, status } = req.query;
    
    // Validate fee head exists
    const feeHead = await FeeHead.findById(feeHeadId);
    if (!feeHead) {
      return res.status(404).json({ message: 'Fee head not found' });
    }

    // Build query
    let query = { feeHead: feeHeadId };
    
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }
    
    if (status) query.status = status;

    // Get payments for this fee head
    const payments = await Payment.find(query)
      .populate('studentId', 'firstName lastName studentId department casteCategory')
      .populate('feeHead', 'title amount')
      .sort({ paymentDate: -1 });

    // Calculate statistics
    const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPayments = payments.length;
    const avgPayment = totalPayments > 0 ? totalCollected / totalPayments : 0;

    // Department wise breakdown
    const departmentStats = {};
    payments.forEach(payment => {
      const dept = payment.studentId?.department || 'Unknown';
      if (!departmentStats[dept]) {
        departmentStats[dept] = { count: 0, amount: 0, students: new Set() };
      }
      departmentStats[dept].count++;
      departmentStats[dept].amount += payment.amount;
      departmentStats[dept].students.add(payment.studentId?._id?.toString());
    });

    // Convert sets to counts
    Object.keys(departmentStats).forEach(dept => {
      departmentStats[dept].uniqueStudents = departmentStats[dept].students.size;
      delete departmentStats[dept].students;
    });

    // Payment method breakdown
    const paymentMethodStats = {};
    payments.forEach(payment => {
      const method = payment.paymentMethod;
      if (!paymentMethodStats[method]) {
        paymentMethodStats[method] = { count: 0, amount: 0 };
      }
      paymentMethodStats[method].count++;
      paymentMethodStats[method].amount += payment.amount;
    });

    // Monthly trend (last 12 months)
    const monthlyTrend = {};
    const currentDate = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend[key] = { count: 0, amount: 0 };
    }

    payments.forEach(payment => {
      const paymentDate = new Date(payment.paymentDate);
      const key = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyTrend[key]) {
        monthlyTrend[key].count++;
        monthlyTrend[key].amount += payment.amount;
      }
    });

    res.json({
      feeHead: {
        id: feeHead._id,
        title: feeHead.title,
        standardAmount: feeHead.amount,
        description: feeHead.description
      },
      summary: {
        totalCollected,
        totalPayments,
        avgPayment: Math.round(avgPayment * 100) / 100,
        collectionRate: feeHead.amount > 0 ? 
          Math.round((totalCollected / (feeHead.amount * totalPayments)) * 100 * 100) / 100 : 0,
        firstPayment: payments.length > 0 ? payments[payments.length - 1].paymentDate : null,
        lastPayment: payments.length > 0 ? payments[0].paymentDate : null
      },
      breakdowns: {
        departmentStats,
        paymentMethodStats,
        monthlyTrend: Object.entries(monthlyTrend).map(([month, data]) => ({
          month,
          ...data
        }))
      },
      recentPayments: payments.slice(0, 10).map(payment => ({
        id: payment._id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        status: payment.status,
        student: {
          name: `${payment.studentId?.firstName || ''} ${payment.studentId?.lastName || ''}`.trim(),
          studentId: payment.studentId?.studentId,
          department: payment.studentId?.department
        },
        receiptNumber: payment.receiptNumber,
        transactionId: payment.transactionId
      }))
    });
  } catch (err) {
    console.error('Error fetching fee head report:', err);
    res.status(500).json({ message: 'Error fetching fee head collection report' });
  }
});

// GET: payment statistics
router.get('/stats', async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const totalAmount = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const todayPayments = await Payment.countDocuments({
      paymentDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });
    
    const todayAmount = await Payment.aggregate([
      {
        $match: {
          paymentDate: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const paymentMethods = await Payment.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      totalPayments,
      totalAmount: totalAmount[0]?.total || 0,
      todayPayments,
      todayAmount: todayAmount[0]?.total || 0,
      paymentMethods
    });
  } catch (err) {
    console.error('Error fetching payment stats:', err);
    res.status(500).json({ message: 'Error fetching payment statistics' });
  }
});

// Fees status API for dashboard
router.get('/fees/status', async (req, res) => {
  try {
    // Total paid (Completed or Paid)
    const paidResult = await Payment.aggregate([
      { $match: { status: { $in: ["Completed", "Paid"] } } },
      { $group: { _id: null, totalFeePaid: { $sum: "$amount" } } }
    ]);
    // Pending
    const pendingResult = await Payment.aggregate([
      { $match: { status: "Pending" } },
      { $group: { _id: null, pendingFees: { $sum: "$amount" } } }
    ]);
    res.json({
      totalFeePaid: paidResult[0]?.totalFeePaid || 0,
      pendingFees: pendingResult[0]?.pendingFees || 0
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching fee status" });
  }
});

// GET: advanced analytics and insights
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30', type = 'all' } = req.query;
    const daysBack = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    let studentPayments = [];
    let salaryPayments = [];

    // Fetch student payments
    if (type === 'all' || type === 'student') {
      studentPayments = await Payment.find({
        paymentDate: { $gte: startDate }
      }).populate('studentId', 'firstName lastName department');
    }

    // Fetch salary payments
    if (type === 'all' || type === 'salary') {
      salaryPayments = await Salary.find({
        createdAt: { $gte: startDate }
      });
    }

    // Daily revenue trends
    const dailyRevenue = {};
    for (let i = 0; i < daysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyRevenue[dateStr] = { student: 0, salary: 0, total: 0 };
    }

    // Calculate daily student revenue
    studentPayments.forEach(payment => {
      const dateStr = payment.paymentDate.toISOString().split('T')[0];
      if (dailyRevenue[dateStr]) {
        dailyRevenue[dateStr].student += payment.amount;
        dailyRevenue[dateStr].total += payment.amount;
      }
    });

    // Calculate daily salary expenses
    salaryPayments.forEach(salary => {
      const dateStr = new Date(salary.createdAt || new Date()).toISOString().split('T')[0];
      if (dailyRevenue[dateStr]) {
        dailyRevenue[dateStr].salary += salary.amount;
        dailyRevenue[dateStr].total += salary.amount;
      }
    });

    // Department-wise fee collection
    const departmentStats = {};
    studentPayments.forEach(payment => {
      const dept = payment.studentId?.department || 'Unknown';
      if (!departmentStats[dept]) {
        departmentStats[dept] = { count: 0, amount: 0 };
      }
      departmentStats[dept].count++;
      departmentStats[dept].amount += payment.amount;
    });

    // Payment method trends
    const methodTrends = {};
    studentPayments.forEach(payment => {
      const method = payment.paymentMethod;
      if (!methodTrends[method]) {
        methodTrends[method] = { count: 0, amount: 0 };
      }
      methodTrends[method].count++;
      methodTrends[method].amount += payment.amount;
    });

    // Average transaction values
    const avgStudentPayment = studentPayments.length > 0 
      ? studentPayments.reduce((sum, p) => sum + p.amount, 0) / studentPayments.length 
      : 0;
    
    const avgSalaryPayment = salaryPayments.length > 0 
      ? salaryPayments.reduce((sum, p) => sum + p.amount, 0) / salaryPayments.length 
      : 0;

    // Peak payment hours (for student payments)
    const hourlyDistribution = Array(24).fill(0);
    studentPayments.forEach(payment => {
      const hour = payment.paymentDate.getHours();
      hourlyDistribution[hour]++;
    });

    res.json({
      period: daysBack,
      totalStudentPayments: studentPayments.length,
      totalSalaryPayments: salaryPayments.length,
      totalStudentRevenue: studentPayments.reduce((sum, p) => sum + p.amount, 0),
      totalSalaryExpenses: salaryPayments.reduce((sum, p) => sum + p.amount, 0),
      avgStudentPayment,
      avgSalaryPayment,
      dailyRevenue: Object.entries(dailyRevenue).map(([date, data]) => ({
        date,
        ...data
      })).reverse(),
      departmentStats,
      methodTrends,
      hourlyDistribution,
      peakHour: hourlyDistribution.indexOf(Math.max(...hourlyDistribution))
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
});

// GET: payment forecasting and predictions
router.get('/forecast', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const forecastDays = parseInt(days);
    
    // Get historical data for the last 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    const historicalPayments = await Payment.find({
      paymentDate: { $gte: startDate }
    });
    
    // Simple moving average prediction
    const dailyAverages = {};
    historicalPayments.forEach(payment => {
      const dayOfWeek = payment.paymentDate.getDay();
      if (!dailyAverages[dayOfWeek]) {
        dailyAverages[dayOfWeek] = { total: 0, count: 0 };
      }
      dailyAverages[dayOfWeek].total += payment.amount;
      dailyAverages[dayOfWeek].count++;
    });
    
    // Calculate average for each day of week
    Object.keys(dailyAverages).forEach(day => {
      dailyAverages[day] = dailyAverages[day].total / dailyAverages[day].count;
    });
    
    // Generate forecast
    const forecast = [];
    for (let i = 1; i <= forecastDays; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      const dayOfWeek = futureDate.getDay();
      
      forecast.push({
        date: futureDate.toISOString().split('T')[0],
        predictedAmount: Math.round(dailyAverages[dayOfWeek] || 0),
        confidence: historicalPayments.length > 30 ? 'High' : 'Medium'
      });
    }
    
    res.json({
      forecast,
      totalPredicted: forecast.reduce((sum, day) => sum + day.predictedAmount, 0),
      basedOnDays: 90,
      confidence: historicalPayments.length > 30 ? 'High' : 'Medium'
    });
  } catch (err) {
    console.error('Error generating forecast:', err);
    res.status(500).json({ message: 'Error generating payment forecast' });
  }
});

// GET: advanced export with custom formats
router.get('/export', async (req, res) => {
  try {
    const { 
      format = 'csv', 
      type = 'all', 
      startDate, 
      endDate, 
      department,
      status,
      paymentMethod 
    } = req.query;

    let query = {};
    let salaryQuery = {};

    // Date range filter
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    // Status filter
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    let allData = [];

    // Fetch student payments
    if (type === 'all' || type === 'student') {
      const studentPayments = await Payment.find(query)
        .populate('studentId', 'firstName lastName studentId department casteCategory')
        .populate('feeHead', 'title')
        .lean();

      const transformedStudentData = studentPayments
        .filter(payment => !department || payment.studentId?.department === department)
        .map(payment => ({
          type: 'Student Fee',
          receiptNumber: payment.receiptNumber,
          paymentId: payment.paymentId || `SP-${payment._id.toString().slice(-8)}`,
          recipientName: `${payment.studentId?.firstName || ''} ${payment.studentId?.lastName || ''}`.trim(),
          studentId: payment.studentId?.studentId,
          department: payment.studentId?.department,
          category: payment.studentId?.casteCategory,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentDate: payment.paymentDate,
          status: payment.status,
          feeHead: payment.feeHead?.title,
          transactionId: payment.transactionId,
          description: payment.description,
          collectedBy: payment.collectedBy,
          remarks: payment.remarks
        }));

      allData = [...allData, ...transformedStudentData];
    }

    // Fetch salary payments
    if (type === 'all' || type === 'salary') {
      const salaryPayments = await Salary.find(salaryQuery).lean();
      
      const transformedSalaryData = salaryPayments.map(salary => ({
        type: 'Faculty Salary',
        receiptNumber: `SAL-${salary._id.toString().slice(-8)}`,
        paymentId: `SAL-${salary._id.toString().slice(-8)}`,
        recipientName: salary.name,
        studentId: '',
        department: '',
        category: '',
        amount: salary.amount,
        paymentMethod: 'Bank Transfer',
        paymentDate: salary.createdAt || new Date(),
        status: salary.status,
        feeHead: '',
        transactionId: '',
        description: `Salary payment for ${salary.month}`,
        collectedBy: 'System',
        remarks: `Monthly salary for ${salary.month}`
      }));

      allData = [...allData, ...transformedSalaryData];
    }

    // Sort by date
    allData.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    if (format === 'json') {
      res.json(allData);
    } else if (format === 'csv') {
      const csv = [
        // Header
        'Type,Receipt Number,Payment ID,Recipient Name,Student ID,Department,Category,Amount,Payment Method,Payment Date,Status,Fee Head,Transaction ID,Description,Collected By,Remarks',
        // Data rows
        ...allData.map(row => [
          row.type,
          row.receiptNumber,
          row.paymentId,
          `"${row.recipientName}"`,
          row.studentId,
          row.department,
          row.category,
          row.amount,
          row.paymentMethod,
          new Date(row.paymentDate).toLocaleDateString('en-IN'),
          row.status,
          `"${row.feeHead}"`,
          row.transactionId,
          `"${row.description}"`,
          row.collectedBy,
          `"${row.remarks}"`
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 
        `attachment; filename="payment_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.status(400).json({ message: 'Unsupported format. Use csv or json.' });
    }
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ message: 'Error exporting payment data' });
  }
});

// DEBUG: Test endpoint to check specific payment population
router.get('/debug/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
    console.log('🔍 Debugging payment ID:', paymentId);
    
    // Get payment without population first
    const rawPayment = await Payment.findById(paymentId);
    console.log('Raw payment feeHead:', rawPayment?.feeHead);
    
    // Get payment with population
    const populatedPayment = await Payment.findById(paymentId)
      .populate('studentId', 'firstName lastName studentId department casteCategory')
      .populate('feeHead', 'title amount description applyTo filters totalCollected collectionCount lastCollectionDate');
    
    console.log('Populated payment feeHead:', populatedPayment?.feeHead);
    
    // Check if fee head exists separately
    let feeHeadExists = null;
    if (rawPayment?.feeHead) {
      feeHeadExists = await FeeHead.findById(rawPayment.feeHead);
      console.log('Fee head exists:', !!feeHeadExists);
    }
    
    res.json({
      debug: true,
      paymentId,
      rawFeeHeadId: rawPayment?.feeHead,
      populatedFeeHead: populatedPayment?.feeHead,
      feeHeadExists: !!feeHeadExists,
      feeHeadDetails: feeHeadExists ? {
        id: feeHeadExists._id,
        title: feeHeadExists.title,
        amount: feeHeadExists.amount
      } : null,
      fullPayment: populatedPayment ? {
        _id: populatedPayment._id,
        paymentId: populatedPayment.paymentId,
        receiptNumber: populatedPayment.receiptNumber,
        amount: populatedPayment.amount,
        paymentMethod: populatedPayment.paymentMethod,
        paymentDate: populatedPayment.paymentDate,
        status: populatedPayment.status,
        description: populatedPayment.description,
        student: populatedPayment.studentId ? {
          id: populatedPayment.studentId._id,
          studentId: populatedPayment.studentId.studentId,
          name: `${populatedPayment.studentId.firstName} ${populatedPayment.studentId.lastName}`,
          firstName: populatedPayment.studentId.firstName,
          lastName: populatedPayment.studentId.lastName,
          department: populatedPayment.studentId.department,
          casteCategory: populatedPayment.studentId.casteCategory
        } : null,
        feeHead: populatedPayment.feeHead ? {
          id: populatedPayment.feeHead._id,
          title: populatedPayment.feeHead.title,
          amount: populatedPayment.feeHead.amount,
          description: populatedPayment.feeHead.description,
          applyTo: populatedPayment.feeHead.applyTo,
          filters: populatedPayment.feeHead.filters,
          collectionStats: {
            totalCollected: populatedPayment.feeHead.totalCollected || 0,
            collectionCount: populatedPayment.feeHead.collectionCount || 0,
            lastCollectionDate: populatedPayment.feeHead.lastCollectionDate
          }
        } : null
      } : null
    });
  } catch (err) {
    console.error('Error debugging payment:', err);
    res.status(500).json({ 
      message: 'Error debugging payment',
      error: err.message,
      paymentId: req.params.id
    });
  }
});

// GET: payment details by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('studentId', 'firstName lastName studentId department casteCategory')
      .populate({
        path: 'feeHead',
        select: 'title amount description applyTo filters totalCollected collectionCount lastCollectionDate isActive'
      });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Transform payment to include complete details
    const transformedPayment = {
      _id: payment._id,
      paymentId: payment.paymentId,
      receiptNumber: payment.receiptNumber,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      status: payment.status,
      description: payment.description,
      transactionId: payment.transactionId,
      collectedBy: payment.collectedBy,
      remarks: payment.remarks,
      student: {
        id: payment.studentId._id,
        studentId: payment.studentId.studentId,
        name: `${payment.studentId.firstName} ${payment.studentId.lastName}`,
        firstName: payment.studentId.firstName,
        lastName: payment.studentId.lastName,
        department: payment.studentId.department,
        casteCategory: payment.studentId.casteCategory
      },
      feeHead: payment.feeHead ? {
        id: payment.feeHead._id,
        title: payment.feeHead.title,
        amount: payment.feeHead.amount,
        description: payment.feeHead.description,
        applyTo: payment.feeHead.applyTo,
        filters: payment.feeHead.filters,
        collectionStats: {
          totalCollected: payment.feeHead.totalCollected || 0,
          collectionCount: payment.feeHead.collectionCount || 0,
          lastCollectionDate: payment.feeHead.lastCollectionDate
        },
        isActive: payment.feeHead.isActive
      } : null,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    };
    
    res.json(transformedPayment);
  } catch (err) {
    console.error('Error fetching payment:', err);
    res.status(500).json({ message: 'Error fetching payment details' });
  }
});

// BULK: POST /api/payments/exam-fee/bulk
router.post('/exam-fee/bulk', async (req, res) => {
  try {
    const { semester, amount, paymentMethod, transactionId, collectedBy } = req.body;
    if (!semester || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'Semester, amount, and payment method are required' });
    }
    // Get all students
    const students = await Student.find({ academicStatus: 'Active' });
    if (!students.length) {
      return res.status(404).json({ message: 'No active students found' });
    }
    let success = 0;
    let failed = 0;
    let errors = [];
    let payments = [];
    for (const student of students) {
      try {
        const payment = new Payment({
          studentId: student._id,
          amount: parseFloat(amount),
          paymentMethod,
          description: `Exam Fee - Semester ${semester}`,
          transactionId: transactionId || '',
          collectedBy: collectedBy || '',
          remarks: `Bulk exam fee for semester ${semester}`,
          semester: semester,
          // Optionally, you can add a custom field for semester if needed
        });
        await payment.save();
        payments.push(payment);
        success++;
      } catch (err) {
        failed++;
        errors.push({ student: student.studentId, error: err.message });
      }
    }
    res.json({
      message: `Bulk exam fee payment complete. Success: ${success}, Failed: ${failed}`,
      success,
      failed,
      errors,
      payments: payments.map(p => ({
        studentId: p.studentId,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        receiptNumber: p.receiptNumber,
        paymentDate: p.paymentDate,
        description: p.description,
        semester: p.semester
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Bulk exam fee error: ' + err.message });
  }
});

// POST: individual exam fee payment
router.post('/exam-fee', async (req, res) => {
  try {
    const {
      studentId,
      semester,
      amount,
      paymentMethod,
      transactionId,
      collectedBy,
      description,
      remarks
    } = req.body;

    // Validate required fields
    if (!studentId || !semester || !amount || !paymentMethod) {
      return res.status(400).json({ 
        message: 'Student ID, semester, amount, and payment method are required' 
      });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Create exam fee payment
    const payment = new Payment({
      studentId,
      semester: parseInt(semester),
      amount: parseFloat(amount),
      paymentMethod,
      description: description || `Exam Fee - Semester ${semester}`,
      transactionId: transactionId || '',
      collectedBy: collectedBy || '',
      remarks: remarks || `Exam fee payment for semester ${semester}`
    });

    await payment.save();

    // Populate student details for receipt
    await payment.populate('studentId', 'firstName lastName studentId department casteCategory');

    res.status(201).json({
      message: 'Exam fee payment recorded successfully',
      payment
    });

  } catch (err) {
    console.error('Error recording exam fee payment:', err);
    if (err.code === 11000) {
      return res.status(500).json({ 
        message: 'Receipt number conflict. Please try again.' 
      });
    }
    res.status(500).json({ 
      message: 'Error recording exam fee payment: ' + err.message 
    });
  }
});

// Fees status API for dashboard
router.get('/fees/status', async (req, res) => {
  try {
    // Total paid (Completed or Paid)
    const paidResult = await Payment.aggregate([
      { $match: { status: { $in: ["Completed", "Paid"] } } },
      { $group: { _id: null, totalFeePaid: { $sum: "$amount" } } }
    ]);
    // Pending
    const pendingResult = await Payment.aggregate([
      { $match: { status: "Pending" } },
      { $group: { _id: null, pendingFees: { $sum: "$amount" } } }
    ]);
    res.json({
      totalFeePaid: paidResult[0]?.totalFeePaid || 0,
      pendingFees: pendingResult[0]?.pendingFees || 0
    });
  } catch (err) {
    res.status(500).json({ error: "Error fetching fee status" });
  }
});

// GET: advanced analytics and insights
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30', type = 'all' } = req.query;
    const daysBack = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    let studentPayments = [];
    let salaryPayments = [];

    // Fetch student payments
    if (type === 'all' || type === 'student') {
      studentPayments = await Payment.find({
        paymentDate: { $gte: startDate }
      }).populate('studentId', 'firstName lastName department');
    }

    // Fetch salary payments
    if (type === 'all' || type === 'salary') {
      salaryPayments = await Salary.find({
        createdAt: { $gte: startDate }
      });
    }

    // Daily revenue trends
    const dailyRevenue = {};
    for (let i = 0; i < daysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyRevenue[dateStr] = { student: 0, salary: 0, total: 0 };
    }

    // Calculate daily student revenue
    studentPayments.forEach(payment => {
      const dateStr = payment.paymentDate.toISOString().split('T')[0];
      if (dailyRevenue[dateStr]) {
        dailyRevenue[dateStr].student += payment.amount;
        dailyRevenue[dateStr].total += payment.amount;
      }
    });

    // Calculate daily salary expenses
    salaryPayments.forEach(salary => {
      const dateStr = new Date(salary.createdAt || new Date()).toISOString().split('T')[0];
      if (dailyRevenue[dateStr]) {
        dailyRevenue[dateStr].salary += salary.amount;
        dailyRevenue[dateStr].total += salary.amount;
      }
    });

    // Department-wise fee collection
    const departmentStats = {};
    studentPayments.forEach(payment => {
      const dept = payment.studentId?.department || 'Unknown';
      if (!departmentStats[dept]) {
        departmentStats[dept] = { count: 0, amount: 0 };
      }
      departmentStats[dept].count++;
      departmentStats[dept].amount += payment.amount;
    });

    // Payment method trends
    const methodTrends = {};
    studentPayments.forEach(payment => {
      const method = payment.paymentMethod;
      if (!methodTrends[method]) {
        methodTrends[method] = { count: 0, amount: 0 };
      }
      methodTrends[method].count++;
      methodTrends[method].amount += payment.amount;
    });

    // Average transaction values
    const avgStudentPayment = studentPayments.length > 0 
      ? studentPayments.reduce((sum, p) => sum + p.amount, 0) / studentPayments.length 
      : 0;
    
    const avgSalaryPayment = salaryPayments.length > 0 
      ? salaryPayments.reduce((sum, p) => sum + p.amount, 0) / salaryPayments.length 
      : 0;

    // Peak payment hours (for student payments)
    const hourlyDistribution = Array(24).fill(0);
    studentPayments.forEach(payment => {
      const hour = payment.paymentDate.getHours();
      hourlyDistribution[hour]++;
    });

    res.json({
      period: daysBack,
      totalStudentPayments: studentPayments.length,
      totalSalaryPayments: salaryPayments.length,
      totalStudentRevenue: studentPayments.reduce((sum, p) => sum + p.amount, 0),
      totalSalaryExpenses: salaryPayments.reduce((sum, p) => sum + p.amount, 0),
      avgStudentPayment,
      avgSalaryPayment,
      dailyRevenue: Object.entries(dailyRevenue).map(([date, data]) => ({
        date,
        ...data
      })).reverse(),
      departmentStats,
      methodTrends,
      hourlyDistribution,
      peakHour: hourlyDistribution.indexOf(Math.max(...hourlyDistribution))
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
});

// GET: payment forecasting and predictions
router.get('/forecast', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const forecastDays = parseInt(days);
    
    // Get historical data for the last 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    
    const historicalPayments = await Payment.find({
      paymentDate: { $gte: startDate }
    });
    
    // Simple moving average prediction
    const dailyAverages = {};
    historicalPayments.forEach(payment => {
      const dayOfWeek = payment.paymentDate.getDay();
      if (!dailyAverages[dayOfWeek]) {
        dailyAverages[dayOfWeek] = { total: 0, count: 0 };
      }
      dailyAverages[dayOfWeek].total += payment.amount;
      dailyAverages[dayOfWeek].count++;
    });
    
    // Calculate average for each day of week
    Object.keys(dailyAverages).forEach(day => {
      dailyAverages[day] = dailyAverages[day].total / dailyAverages[day].count;
    });
    
    // Generate forecast
    const forecast = [];
    for (let i = 1; i <= forecastDays; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      const dayOfWeek = futureDate.getDay();
      
      forecast.push({
        date: futureDate.toISOString().split('T')[0],
        predictedAmount: Math.round(dailyAverages[dayOfWeek] || 0),
        confidence: historicalPayments.length > 30 ? 'High' : 'Medium'
      });
    }
    
    res.json({
      forecast,
      totalPredicted: forecast.reduce((sum, day) => sum + day.predictedAmount, 0),
      basedOnDays: 90,
      confidence: historicalPayments.length > 30 ? 'High' : 'Medium'
    });
  } catch (err) {
    console.error('Error generating forecast:', err);
    res.status(500).json({ message: 'Error generating payment forecast' });
  }
});

// GET: advanced export with custom formats
router.get('/export', async (req, res) => {
  try {
    const { 
      format = 'csv', 
      type = 'all', 
      startDate, 
      endDate, 
      department,
      status,
      paymentMethod 
    } = req.query;

    let query = {};
    let salaryQuery = {};

    // Date range filter
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    // Status filter
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    let allData = [];

    // Fetch student payments
    if (type === 'all' || type === 'student') {
      const studentPayments = await Payment.find(query)
        .populate('studentId', 'firstName lastName studentId department casteCategory')
        .populate('feeHead', 'title')
        .lean();

      const transformedStudentData = studentPayments
        .filter(payment => !department || payment.studentId?.department === department)
        .map(payment => ({
          type: 'Student Fee',
          receiptNumber: payment.receiptNumber,
          paymentId: payment.paymentId || `SP-${payment._id.toString().slice(-8)}`,
          recipientName: `${payment.studentId?.firstName || ''} ${payment.studentId?.lastName || ''}`.trim(),
          studentId: payment.studentId?.studentId,
          department: payment.studentId?.department,
          category: payment.studentId?.casteCategory,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentDate: payment.paymentDate,
          status: payment.status,
          feeHead: payment.feeHead?.title,
          transactionId: payment.transactionId,
          description: payment.description,
          collectedBy: payment.collectedBy,
          remarks: payment.remarks
        }));

      allData = [...allData, ...transformedStudentData];
    }

    // Fetch salary payments
    if (type === 'all' || type === 'salary') {
      const salaryPayments = await Salary.find(salaryQuery).lean();
      
      const transformedSalaryData = salaryPayments.map(salary => ({
        type: 'Faculty Salary',
        receiptNumber: `SAL-${salary._id.toString().slice(-8)}`,
        paymentId: `SAL-${salary._id.toString().slice(-8)}`,
        recipientName: salary.name,
        studentId: '',
        department: '',
        category: '',
        amount: salary.amount,
        paymentMethod: 'Bank Transfer',
        paymentDate: salary.createdAt || new Date(),
        status: salary.status,
        feeHead: '',
        transactionId: '',
        description: `Salary payment for ${salary.month}`,
        collectedBy: 'System',
        remarks: `Monthly salary for ${salary.month}`
      }));

      allData = [...allData, ...transformedSalaryData];
    }

    // Sort by date
    allData.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    if (format === 'json') {
      res.json(allData);
    } else if (format === 'csv') {
      const csv = [
        // Header
        'Type,Receipt Number,Payment ID,Recipient Name,Student ID,Department,Category,Amount,Payment Method,Payment Date,Status,Fee Head,Transaction ID,Description,Collected By,Remarks',
        // Data rows
        ...allData.map(row => [
          row.type,
          row.receiptNumber,
          row.paymentId,
          `"${row.recipientName}"`,
          row.studentId,
          row.department,
          row.category,
          row.amount,
          row.paymentMethod,
          new Date(row.paymentDate).toLocaleDateString('en-IN'),
          row.status,
          `"${row.feeHead}"`,
          row.transactionId,
          `"${row.description}"`,
          row.collectedBy,
          `"${row.remarks}"`
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 
        `attachment; filename="payment_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else {
      res.status(400).json({ message: 'Unsupported format. Use csv or json.' });
    }
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ message: 'Error exporting payment data' });
  }
});

export default router;
