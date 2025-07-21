import express from 'express';
import mongoose from 'mongoose';
const router = express.Router();
import Faculty from '../models/faculty.js';
import GratuityRecord from '../models/GratuityRecord.js';
import { body, validationResult, param, query } from 'express-validator';

// Middleware to check validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/gratuity/faculty - Get all faculty with gratuity eligibility
router.get('/faculty', [
  query('department').optional().isString(),
  query('status').optional().isIn(['all', 'eligible', 'not-eligible']),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const { department, status, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    if (department) {
      query['employmentInfo.department'] = department;
    }
    
    if (status === 'eligible') {
      query['gratuityInfo.isEligible'] = true;
    } else if (status === 'not-eligible') {
      query['gratuityInfo.isEligible'] = false;
    }
    
    if (search) {
      query.$or = [
        { 'personalInfo.fullName': { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const faculty = await Faculty.find(query)
      .select('employeeId personalInfo.fullName employmentInfo salaryInfo.basicSalary gratuityInfo')
      .sort({ 'personalInfo.fullName': 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Faculty.countDocuments(query);
    
    // Add calculated gratuity info to each faculty
    const facultyWithGratuity = faculty.map(f => {
      const facultyObj = f.toObject();
      facultyObj.yearsOfService = f.yearsOfService;
      
      if (f.gratuityInfo.isEligible) {
        facultyObj.calculatedGratuity = f.calculatePotentialGratuity();
      }
      
      return facultyObj;
    });
    
    res.json({
      success: true,
      data: {
        faculty: facultyWithGratuity,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching faculty for gratuity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty data',
      error: error.message
    });
  }
});

// GET /api/gratuity/faculty/:id - Get specific faculty with detailed gratuity info
router.get('/faculty/:id', [
  param('id').isMongoId()
], handleValidationErrors, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id)
      .populate('gratuityInfo.gratuityRecords');
    
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }
    
    const facultyObj = faculty.toObject();
    facultyObj.yearsOfService = faculty.yearsOfService;
    facultyObj.age = faculty.age;
    facultyObj.grossSalary = faculty.grossSalary;
    facultyObj.netSalary = faculty.netSalary;
    
    if (faculty.gratuityInfo.isEligible) {
      facultyObj.calculatedGratuity = faculty.calculatePotentialGratuity();
    }
    
    res.json({
      success: true,
      data: facultyObj
    });
  } catch (error) {
    console.error('Error fetching faculty details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty details',
      error: error.message
    });
  }
});

// POST /api/gratuity/calculate - Calculate gratuity for faculty
router.post('/calculate', [
  body('facultyId').isMongoId(),
  body('basicSalary').optional().isNumeric({ min: 0 }),
  body('yearsOfService').optional().isNumeric({ min: 0 }),
  body('calculationMethod').optional().isIn(['statutory', 'company_policy', 'custom'])
], handleValidationErrors, async (req, res) => {
  try {
    const { facultyId, basicSalary, yearsOfService, calculationMethod = 'statutory' } = req.body;
    
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }
    
    // Use provided values or faculty's current values
    const salaryToUse = basicSalary || faculty.salaryInfo.basicSalary;
    const yearsToUse = yearsOfService || faculty.yearsOfService;
    
    const calculation = GratuityRecord.calculateGratuity(salaryToUse, yearsToUse, calculationMethod);
    
    res.json({
      success: true,
      data: {
        faculty: {
          id: faculty._id,
          name: faculty.personalInfo.fullName,
          employeeId: faculty.employeeId
        },
        calculation: {
          ...calculation,
          basicSalary: salaryToUse,
          yearsOfService: yearsToUse,
          calculationMethod,
          calculationDate: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error calculating gratuity:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating gratuity',
      error: error.message
    });
  }
});

// POST /api/gratuity/records - Create new gratuity record
router.post('/records', [
  body('facultyId').isMongoId(),
  body('basicSalary').isNumeric({ min: 0 }),
  body('yearsOfService').isNumeric({ min: 0 }),
  body('calculationMethod').optional().isIn(['statutory', 'company_policy', 'custom']),
  body('remarks').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { facultyId, basicSalary, yearsOfService, calculationMethod = 'statutory', remarks } = req.body;
    
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }
    
    if (!faculty.gratuityInfo.isEligible) {
      return res.status(400).json({
        success: false,
        message: 'Faculty is not eligible for gratuity'
      });
    }
    
    // Calculate gratuity amounts
    const calculation = GratuityRecord.calculateGratuity(basicSalary, yearsOfService, calculationMethod);
    
    // Create gratuity record
    const gratuityRecord = new GratuityRecord({
      facultyId,
      employeeId: faculty.employeeId,
      yearsOfService,
      basicSalary,
      ...calculation,
      calculationMethod,
      remarks,
      audit: {
        createdBy: new mongoose.Types.ObjectId() // Mock user ID for now
      }
    });
    
    await gratuityRecord.save();
    
    // Add record reference to faculty
    faculty.gratuityInfo.gratuityRecords.push(gratuityRecord._id);
    await faculty.save();
    
    res.status(201).json({
      success: true,
      message: 'Gratuity record created successfully',
      data: gratuityRecord
    });
  } catch (error) {
    console.error('Error creating gratuity record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating gratuity record',
      error: error.message
    });
  }
});

// GET /api/gratuity/records - Get all gratuity records
router.get('/records', [
  query('facultyId').optional().isMongoId(),
  query('status').optional().isIn(['calculated', 'approved', 'paid', 'pending', 'rejected']),
  query('financialYear').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], handleValidationErrors, async (req, res) => {
  try {
    const { facultyId, status, financialYear, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    
    if (facultyId) {
      query.facultyId = facultyId;
    }
    
    if (status) {
      query.paymentStatus = status;
    }
    
    if (financialYear) {
      query.financialYear = financialYear;
    }
    
    const records = await GratuityRecord.find(query)
      .populate('facultyId', 'employeeId personalInfo.fullName employmentInfo.department')
      .sort({ calculationDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await GratuityRecord.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        records,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching gratuity records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gratuity records',
      error: error.message
    });
  }
});

// PUT /api/gratuity/records/:id/status - Update gratuity record status
router.put('/records/:id/status', [
  param('id').isMongoId(),
  body('status').isIn(['calculated', 'approved', 'paid', 'pending', 'rejected']),
  body('remarks').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    
    const record = await GratuityRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Gratuity record not found'
      });
    }
    
    // Update status using instance method
    await record.updatePaymentStatus(status, new mongoose.Types.ObjectId());
    
    if (remarks) {
      record.remarks = remarks;
      await record.save();
    }
    
    res.json({
      success: true,
      message: 'Gratuity record status updated successfully',
      data: record
    });
  } catch (error) {
    console.error('Error updating gratuity record status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating gratuity record status',
      error: error.message
    });
  }
});

// PUT /api/gratuity/records/:id/approve - Approve gratuity record
router.put('/records/:id/approve', [
  param('id').isMongoId(),
  body('remarks').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { remarks } = req.body;
    
    const record = await GratuityRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Gratuity record not found'
      });
    }
    
    // Approve using instance method
    await record.approve(new mongoose.Types.ObjectId());
    
    if (remarks) {
      record.remarks = remarks;
      await record.save();
    }
    
    res.json({
      success: true,
      message: 'Gratuity record approved successfully',
      data: record
    });
  } catch (error) {
    console.error('Error approving gratuity record:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving gratuity record',
      error: error.message
    });
  }
});

// GET /api/gratuity/analytics - Get gratuity analytics
router.get('/analytics', [
  query('financialYear').optional().isString(),
  query('department').optional().isString()
], handleValidationErrors, async (req, res) => {
  try {
    const { financialYear, department } = req.query;
    
    // Build match conditions
    let matchConditions = {};
    if (financialYear) {
      matchConditions.financialYear = financialYear;
    }
    if (department) {
      matchConditions['facultyData.employmentInfo.department'] = department;
    }
    
    // Aggregate analytics data
    const analytics = await GratuityRecord.aggregate([
      {
        $lookup: {
          from: 'faculties',
          localField: 'facultyId',
          foreignField: '_id',
          as: 'facultyData'
        }
      },
      {
        $unwind: '$facultyData'
      },
      {
        $match: matchConditions
      },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalGratuityAmount: { $sum: '$gratuityAmount' },
          totalTaxLiability: { $sum: '$taxLiability' },
          totalNetAmount: { $sum: { $subtract: ['$gratuityAmount', '$taxLiability'] } },
          avgGratuityAmount: { $avg: '$gratuityAmount' },
          avgTaxLiability: { $avg: '$taxLiability' },
          statusBreakdown: {
            $push: '$paymentStatus'
          },
          departmentBreakdown: {
            $push: '$facultyData.employmentInfo.department'
          }
        }
      }
    ]);
    
    // Get faculty eligibility stats
    let facultyQuery = {};
    if (department) {
      facultyQuery['employmentInfo.department'] = department;
    }
    
    const totalFaculty = await Faculty.countDocuments(facultyQuery);
    const eligibleFaculty = await Faculty.countDocuments({
      ...facultyQuery,
      'gratuityInfo.isEligible': true
    });
    
    // Format response
    const result = analytics[0] || {
      totalRecords: 0,
      totalGratuityAmount: 0,
      totalTaxLiability: 0,
      totalNetAmount: 0,
      avgGratuityAmount: 0,
      avgTaxLiability: 0,
      statusBreakdown: [],
      departmentBreakdown: []
    };
    
    // Count status occurrences
    const statusCounts = {};
    result.statusBreakdown.forEach(status => {
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    // Count department occurrences
    const departmentCounts = {};
    result.departmentBreakdown.forEach(dept => {
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: {
        summary: {
          totalFaculty,
          eligibleFaculty,
          eligibilityPercentage: totalFaculty > 0 ? ((eligibleFaculty / totalFaculty) * 100).toFixed(2) : 0,
          totalGratuityRecords: result.totalRecords,
          totalGratuityAmount: Math.round(result.totalGratuityAmount),
          totalTaxLiability: Math.round(result.totalTaxLiability),
          totalNetAmount: Math.round(result.totalNetAmount),
          avgGratuityAmount: Math.round(result.avgGratuityAmount),
          avgTaxLiability: Math.round(result.avgTaxLiability),
          avgTaxRate: result.totalGratuityAmount > 0 ? 
            ((result.totalTaxLiability / result.totalGratuityAmount) * 100).toFixed(2) : 0
        },
        breakdowns: {
          byStatus: statusCounts,
          byDepartment: departmentCounts
        }
      }
    });
  } catch (error) {
    console.error('Error fetching gratuity analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gratuity analytics',
      error: error.message
    });
  }
});

// GET /api/gratuity/reports/summary - Get summary report
router.get('/reports/summary', [
  query('financialYear').optional().isString(),
  query('department').optional().isString(),
  query('format').optional().isIn(['json', 'csv', 'pdf'])
], handleValidationErrors, async (req, res) => {
  try {
    const { financialYear, department, format = 'json' } = req.query;
    
    // This would generate various report formats
    // For now, returning JSON format
    
    let query = {};
    if (financialYear) {
      query.financialYear = financialYear;
    }
    
    const records = await GratuityRecord.find(query)
      .populate('facultyId', 'employeeId personalInfo.fullName employmentInfo.department employmentInfo.designation')
      .sort({ calculationDate: -1 });
    
    // Filter by department if specified
    const filteredRecords = department ? 
      records.filter(record => record.facultyId.employmentInfo.department === department) :
      records;
    
    if (format === 'json') {
      res.json({
        success: true,
        data: {
          reportType: 'Gratuity Summary Report',
          generatedAt: new Date(),
          filters: { financialYear, department },
          totalRecords: filteredRecords.length,
          records: filteredRecords
        }
      });
    } else {
      // TODO: Implement CSV and PDF export functionality
      res.status(501).json({
        success: false,
        message: `${format.toUpperCase()} format not yet implemented`
      });
    }
  } catch (error) {
    console.error('Error generating summary report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating summary report',
      error: error.message
    });
  }
});

export default router;

