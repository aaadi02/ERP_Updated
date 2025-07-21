import express from 'express';
// const express = require('express');
const router = express.Router();
import Student from '../models/StudentManagement.js';
// const Student = require('../models/Student');
import FeeHead from '../models/FeeHead.js';
// const FeeHead = require('../models/FeeHead');
// const mongoose = require('mongoose');
import mongoose  from 'mongoose';

// GET all students
router.get('/', async (req, res) => {
  try {
    const { department, program, academicStatus, search } = req.query;
    
    let query = {};
    
    // Filter by department
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }
    
    // Filter by program
    if (program) {
      query.program = { $regex: program, $options: 'i' };
    }
    
    // Filter by academic status
    if (academicStatus) {
      query.academicStatus = academicStatus;
    }
    
    // Search by name, email, or student ID
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { middleName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { enrollmentNumber: { $regex: search, $options: 'i' } },
        { fatherName: { $regex: search, $options: 'i' } },
        { scholarshipDetails: { $regex: search, $options: 'i' } }
      ];
    }
    
    const students = await Student.find(query)
      .populate('stream', 'name code')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });
    
    res.json(students);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

// GET student statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ academicStatus: 'Active' });
    
    const departmentStats = await Student.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const enrollmentYearStats = await Student.aggregate([
      {
        $group: {
          _id: '$enrollmentYear',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        departmentStats,
        enrollmentYearStats
      }
    });
  } catch (err) {
    console.error('Error fetching student stats:', err);
    res.status(500).json({ message: 'Error fetching student statistics' });
  }
});

// GET: pending fees for a specific student (must come before /:id route)
router.get('/:id/pending-fees', async (req, res) => {
  try {
    const { id } = req.params;
    const { academicYear } = req.query;
    
    // Get student data
    const student = await Student.findById(id).populate('stream');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get all fee heads
    const FeeHead = require('../models/FeeHead');
    const allFeeHeads = await FeeHead.find();
    
    // Filter applicable fee heads for this student
    const applicableHeads = allFeeHeads.filter((head) => {
      if (head.applyTo === "all") return true;

      const matchStream = head.filters?.stream
        ? String(head.filters.stream) === String(student.stream?._id)
        : true;

      // Normalize caste category mapping
      let studentCaste = student.casteCategory || "Open";
      const casteMapping = {
        'sc': 'SC',
        'st': 'ST', 
        'obc': 'OBC',
        'general': 'Open',
        'open': 'Open'
      };
      const normalizedCaste = casteMapping[studentCaste.toLowerCase()] || 'Open';

      const matchCaste = head.filters?.casteCategory
        ? head.filters.casteCategory.toLowerCase() === normalizedCaste.toLowerCase()
        : true;

      return matchStream && matchCaste;
    });

    // Get student's payment history for applicable fee heads
    const Payment = require('../models/Payment');
    const payments = await Payment.find({ 
      studentId: id,
      feeHead: { $in: applicableHeads.map(h => h._id) }
    });

    // Calculate pending fees
    const pendingFeesCalc = applicableHeads.map(feeHead => {
      const totalPaid = payments
        .filter(payment => String(payment.feeHead) === String(feeHead._id))
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      const pendingAmount = feeHead.amount - totalPaid;
      
      if (pendingAmount > 0) {
        return {
          feeHead: feeHead.title,
          feeHeadId: feeHead._id,
          totalAmount: feeHead.amount,
          paidAmount: totalPaid,
          pendingAmount: pendingAmount,
          dueDate: feeHead.dueDate || null,
          description: feeHead.description
        };
      }
      return null;
    }).filter(fee => fee !== null);

    res.json(pendingFeesCalc);
  } catch (err) {
    console.error('Error calculating pending fees for student:', err);
    res.status(500).json({ message: 'Error calculating pending fees' });
  }
});

// GET student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('stream');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ message: 'Error fetching student' });
  }
});

// POST create new student
router.post('/', async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(500).json({ message: 'Error creating student' });
  }
});

// PUT update student
router.put('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(student);
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ message: 'Error updating student' });
  }
});

// DELETE student
router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: 'Error deleting student' });
  }
});

// Dashboard aggregator
// Dashboard aggregator (for all students, sum all applicable fee heads)
router.get('/fees/status', async (req, res) => {
  try {
    const students = await Student.find().populate("stream");
    let pendingFees = 0;
    let totalFeePaid = 0;
    let totalFeeExpected = 0;

    // Get all fee heads to filter applicable ones per student
    const allFeeHeads = await FeeHead.find();

    for (const s of students) {
      // Filter applicable fee heads for this student (same logic as /api/fee-heads/applicable/:studentId)
      const applicableHeads = allFeeHeads.filter((head) => {
        if (head.applyTo === "all") return true;

        const matchStream = head.filters?.stream
          ? String(head.filters.stream) === String(s.stream?._id)
          : true;

        // Normalize caste category mapping (same as feeHeadRoutes.js)
        let studentCaste = s.casteCategory || "Open";
        const casteMapping = {
          'sc': 'SC',
          'st': 'ST', 
          'obc': 'OBC',
          'general': 'Open',
          'open': 'Open'
        };
        const normalizedCaste = casteMapping[studentCaste.toLowerCase()] || 'Open';

        const matchCaste = head.filters?.casteCategory
          ? head.filters.casteCategory.toLowerCase() === normalizedCaste.toLowerCase()
          : true;

        return matchStream && matchCaste;
      });

      // Calculate total applicable fee for this student (same as frontend logic)
      const studentTotal = applicableHeads.reduce((sum, h) => sum + (h.amount || 0), 0);
      const paid = s.feesPaid || 0;
      const pending = studentTotal - paid; // Same as frontend: total - paid (no Math.max)
      
      pendingFees += pending;
      totalFeePaid += paid;
      totalFeeExpected += studentTotal;
    }

    res.json({ pendingFees, totalFeePaid, totalFeeExpected });
  } catch (err) {
    console.error('Error calculating fees:', err);
    res.status(500).json({ error: 'Failed to calculate fees' });
  }
});

export default router;