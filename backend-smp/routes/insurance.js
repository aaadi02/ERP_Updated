import express from 'express';
const router = express.Router();
import Insurance from "../models/Insurance.js";
import Student from "../models/StudentManagement.js";

// GET all insurance policies
router.get('/', async (req, res) => {
  try {
    const { status, policyType, studentId, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (policyType) query.policyType = policyType;
    if (studentId) query.studentId = studentId;

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

      query.$or = [
        { studentId: { $in: studentIds } },
        { policyNumber: { $regex: search, $options: 'i' } },
        { insuranceProvider: { $regex: search, $options: 'i' } },
        { agentName: { $regex: search, $options: 'i' } },
      ];
    }

    const insurance = await Insurance.find(query)
      .populate('studentId', 'firstName lastName studentId department')
      .sort({ createdAt: -1 });

    res.json(insurance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET insurance statistics
router.get('/stats', async (req, res) => {
  try {
    const totalPolicies = await Insurance.countDocuments();
    const activePolicies = await Insurance.countDocuments({ status: 'Active' });
    const expiredPolicies = await Insurance.countDocuments({ status: 'Expired' });
    const pendingPayments = await Insurance.countDocuments({ paymentStatus: 'Pending' });
    
    const totalCoverage = await Insurance.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: null, total: { $sum: '$coverageAmount' } } }
    ]);

    const totalPremiums = await Insurance.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: null, total: { $sum: '$premiumAmount' } } }
    ]);

    res.json({
      totalPolicies,
      activePolicies,
      expiredPolicies,
      pendingPayments,
      totalCoverage: totalCoverage[0]?.total || 0,
      totalPremiums: totalPremiums[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET insurance policy by ID
router.get('/:id', async (req, res) => {
  try {
    const insurance = await Insurance.findById(req.params.id)
      .populate('studentId', 'firstName lastName studentId department email phone');
    
    if (!insurance) {
      return res.status(404).json({ message: 'Insurance policy not found' });
    }
    
    res.json(insurance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET insurance policies by student ID
router.get('/student/:studentId', async (req, res) => {
  try {
    const insurance = await Insurance.find({ studentId: req.params.studentId })
      .populate('studentId', 'firstName lastName studentId department')
      .sort({ createdAt: -1 });
    
    res.json(insurance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST create new insurance policy
router.post('/', async (req, res) => {
  console.log('INSURANCE POST BODY:', req.body);
  try {
    const {
      studentId,
      insuranceProvider,
      policyType,
      coverageAmount,
      premiumAmount,
      premiumFrequency,
      startDate,
      endDate,
      coverageDetails,
      exclusions,
      termsAndConditions,
      contactPerson,
      remarks,
      policyNumber,
    } = req.body;

    // Validate required fields
    if (!studentId || !insuranceProvider || !policyType || !coverageAmount || 
        !premiumAmount || !startDate || !endDate || !policyNumber) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if policy already exists for this student and type
    const existingPolicy = await Insurance.findOne({
      studentId,
      policyType,
      status: { $in: ['Active', 'Pending'] }
    });

    if (existingPolicy) {
      return res.status(400).json({ 
        message: 'Active policy already exists for this student and type' 
      });
    }

    const insurance = new Insurance({
      studentId,
      insuranceProvider,
      policyType,
      coverageAmount,
      premiumAmount,
      premiumFrequency,
      startDate,
      endDate,
      coverageDetails,
      exclusions,
      termsAndConditions,
      contactPerson,
      remarks,
      policyNumber
    });

    const newInsurance = await insurance.save();
    await newInsurance.populate('studentId', 'firstName lastName studentId department');
    
    res.status(201).json(newInsurance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update insurance policy
router.put('/:id', async (req, res) => {
  try {
    const insurance = await Insurance.findById(req.params.id);
    if (!insurance) {
      return res.status(404).json({ message: 'Insurance policy not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'policyNumber' && key !== 'createdAt') {
        insurance[key] = req.body[key];
      }
    });

    const updatedInsurance = await insurance.save();
    await updatedInsurance.populate('studentId', 'firstName lastName studentId department');
    
    res.json(updatedInsurance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH update payment status
router.patch('/:id/payment', async (req, res) => {
  try {
    const { paymentStatus, lastPaymentDate, nextPaymentDate } = req.body;
    
    const insurance = await Insurance.findById(req.params.id);
    if (!insurance) {
      return res.status(404).json({ message: 'Insurance policy not found' });
    }

    insurance.paymentStatus = paymentStatus;
    if (lastPaymentDate) insurance.lastPaymentDate = lastPaymentDate;
    if (nextPaymentDate) insurance.nextPaymentDate = nextPaymentDate;

    const updatedInsurance = await insurance.save();
    await updatedInsurance.populate('studentId', 'firstName lastName studentId department');
    
    res.json(updatedInsurance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH update policy status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const insurance = await Insurance.findById(req.params.id);
    if (!insurance) {
      return res.status(404).json({ message: 'Insurance policy not found' });
    }

    insurance.status = status;
    const updatedInsurance = await insurance.save();
    await updatedInsurance.populate('studentId', 'firstName lastName studentId department');
    
    res.json(updatedInsurance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE insurance policy
router.delete('/:id', async (req, res) => {
  try {
    const insurance = await Insurance.findById(req.params.id);
    if (!insurance) {
      return res.status(404).json({ message: 'Insurance policy not found' });
    }

    await Insurance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Insurance policy deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET policies expiring soon (within 30 days)
router.get('/expiring/soon', async (req, res) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringPolicies = await Insurance.find({
      endDate: { $lte: thirtyDaysFromNow, $gte: new Date() },
      status: 'Active'
    }).populate('studentId', 'firstName lastName studentId department email');

    res.json(expiringPolicies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET overdue payments
router.get('/payments/overdue', async (req, res) => {
  try {
    const overduePolicies = await Insurance.find({
      paymentStatus: 'Overdue',
      status: 'Active'
    }).populate('studentId', 'firstName lastName studentId department email');

    res.json(overduePolicies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 

