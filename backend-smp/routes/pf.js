import express from 'express';
const router = express.Router();
import PF from "../models/PF.js";
import Salary from "../models/Salary.js";

// @route   GET /api/pf
// @desc    Get all PF records with filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      financialYear,
      employeeName,
      complianceStatus,
      ptState,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (financialYear) filter.financialYear = financialYear;
    if (employeeName) filter.employeeName = new RegExp(employeeName, 'i');
    if (complianceStatus) filter.complianceStatus = complianceStatus;
    if (ptState) filter.ptState = ptState;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get records with pagination
    const records = await PF.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await PF.countDocuments(filter);

    res.json({
      records,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching PF records:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/pf/stats/dashboard
// @desc    Get dashboard statistics
// @access  Public
router.get('/stats/dashboard', async (req, res) => {
  try {
    const { financialYear } = req.query;
    const stats = await PF.getDashboardStats(financialYear);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/pf/summary/by-employee
// @desc    Get PF summary grouped by employee
// @access  Public
router.get('/summary/by-employee', async (req, res) => {
  try {
    const { financialYear } = req.query;
    const summary = await PF.getPFSummaryByEmployee(financialYear);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching PF summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/pf/info/professional-tax-slabs
// @desc    Get professional tax slabs for all states
// @access  Public
router.get('/info/professional-tax-slabs', async (req, res) => {
  try {
    const slabs = {
      'Karnataka': [
        { min: 0, max: 15000, tax: 0, description: 'No tax' },
        { min: 15001, max: 30000, tax: 200, description: '₹200 per month' },
        { min: 30001, max: Infinity, tax: 300, description: '₹300 per month' }
      ],
      'Maharashtra': [
        { min: 0, max: 5000, tax: 0, description: 'No tax' },
        { min: 5001, max: 10000, tax: 150, description: '₹150 per month' },
        { min: 10001, max: Infinity, tax: 200, description: '₹200 per month' }
      ],
      'West Bengal': [
        { min: 0, max: 10000, tax: 0, description: 'No tax' },
        { min: 10001, max: 15000, tax: 110, description: '₹110 per month' },
        { min: 15001, max: 25000, tax: 130, description: '₹130 per month' },
        { min: 25001, max: Infinity, tax: 200, description: '₹200 per month' }
      ]
    };
    res.json(slabs);
  } catch (error) {
    console.error('Error fetching professional tax slabs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/pf/calculate
// @desc    Calculate PF and professional tax for given parameters
// @access  Public
router.get('/calculate', async (req, res) => {
  try {
    const { basicSalary, state = 'Karnataka' } = req.query;
    
    if (!basicSalary || isNaN(basicSalary)) {
      return res.status(400).json({ message: 'Valid basic salary is required' });
    }

    const annual = parseFloat(basicSalary);
    const monthly = annual / 12;
    
    // Calculate PF
    const pfEligibleMonthly = Math.min(monthly, 15000);
    const pfEligibleAnnual = pfEligibleMonthly * 12;
    const employeePF = Math.round(pfEligibleAnnual * 0.12);
    const employerPF = Math.round(pfEligibleAnnual * 0.12);
    const totalPF = employeePF + employerPF;
    
    // Calculate Professional Tax
    const professionalTax = PF.calculateProfessionalTax(monthly, state);
    
    res.json({
      input: {
        basicSalary: annual,
        monthlySalary: monthly,
        state
      },
      pf: {
        pfEligibleSalary: pfEligibleAnnual,
        employeePFContribution: employeePF,
        employerPFContribution: employerPF,
        totalPFContribution: totalPF,
        monthlyEmployeePF: Math.round(employeePF / 12),
        monthlyEmployerPF: Math.round(employerPF / 12)
      },
      professionalTax: {
        annualTax: professionalTax,
        monthlyTax: Math.round(professionalTax / 12)
      },
      totalDeductions: {
        employee: employeePF + professionalTax,
        monthly: Math.round((employeePF + professionalTax) / 12)
      }
    });
  } catch (error) {
    console.error('Error calculating PF:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/pf/:id
// @desc    Get single PF record
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const record = await PF.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'PF record not found' });
    }
    res.json(record);
  } catch (error) {
    console.error('Error fetching PF record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/pf
// @desc    Create new PF record
// @access  Public
router.post('/', async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      panNumber,
      pfNumber,
      financialYear,
      basicSalary,
      vpfContribution = 0,
      ptState = 'Karnataka',
      pfInterestRate = 8.15,
      remarks
    } = req.body;

    // Validation
    if (!employeeId || !employeeName || !pfNumber || !financialYear || !basicSalary) {
      return res.status(400).json({ 
        message: 'Required fields: employeeId, employeeName, pfNumber, financialYear, basicSalary' 
      });
    }

    // Check for duplicate
    const existing = await PF.findOne({ 
      $or: [
        { pfNumber },
        { employeeId, financialYear }
      ]
    });
    
    if (existing) {
      return res.status(400).json({ 
        message: 'PF record already exists for this employee and financial year, or PF number is duplicate' 
      });
    }

    // Calculate professional tax
    const monthlySalary = basicSalary / 12;
    const professionalTax = PF.calculateProfessionalTax(monthlySalary, ptState);

    // Create new record
    const pfRecord = new PF({
      employeeId,
      employeeName,
      panNumber,
      pfNumber,
      financialYear,
      basicSalary,
      vpfContribution,
      professionalTax,
      ptState,
      pfInterestRate,
      remarks,
      createdBy: req.user?.name || 'System',
      updatedBy: req.user?.name || 'System'
    });

    const savedRecord = await pfRecord.save();
    res.status(201).json(savedRecord);
  } catch (error) {
    console.error('Error creating PF record:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Duplicate record: Employee already has PF record for this financial year' });
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// @route   PUT /api/pf/:id
// @desc    Update PF record
// @access  Public
router.put('/:id', async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      panNumber,
      pfNumber,
      financialYear,
      basicSalary,
      vpfContribution,
      ptState,
      pfInterestRate,
      remarks
    } = req.body;

    // Find existing record
    const existingRecord = await PF.findById(req.params.id);
    if (!existingRecord) {
      return res.status(404).json({ message: 'PF record not found' });
    }

    // Check for duplicate PF number (excluding current record)
    if (pfNumber && pfNumber !== existingRecord.pfNumber) {
      const duplicatePF = await PF.findOne({ pfNumber, _id: { $ne: req.params.id } });
      if (duplicatePF) {
        return res.status(400).json({ message: 'PF number already exists' });
      }
    }

    // Calculate professional tax if basic salary or state changed
    let professionalTax = existingRecord.professionalTax;
    if (basicSalary || ptState) {
      const monthlySalary = (basicSalary || existingRecord.basicSalary) / 12;
      const state = ptState || existingRecord.ptState;
      professionalTax = PF.calculateProfessionalTax(monthlySalary, state);
    }

    // Update record
    const updateData = {
      ...req.body,
      professionalTax,
      updatedBy: req.user?.name || 'System'
    };

    const updatedRecord = await PF.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedRecord);
  } catch (error) {
    console.error('Error updating PF record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/pf/:id
// @desc    Delete PF record
// @access  Public
router.delete('/:id', async (req, res) => {
  try {
    const record = await PF.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'PF record not found' });
    }

    await PF.findByIdAndDelete(req.params.id);
    res.json({ message: 'PF record deleted successfully' });
  } catch (error) {
    console.error('Error deleting PF record:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/pf/bulk-create
// @desc    Create multiple PF records from salary data
// @access  Public
router.post('/bulk-create', async (req, res) => {
  try {
    const { financialYear, ptState = 'Karnataka', pfInterestRate = 8.15 } = req.body;
    
    if (!financialYear) {
      return res.status(400).json({ message: 'Financial year is required' });
    }

    // Get salary data (assuming we have access to Salary model)
    const salaryRecords = await Salary.find({
      month: { $regex: `^(${financialYear.split('-')[0]}|${financialYear.split('-')[1]})` }
    });

    if (salaryRecords.length === 0) {
      return res.status(404).json({ message: 'No salary records found for the specified financial year' });
    }

    // Group by employee
    const employeeData = {};
    salaryRecords.forEach(record => {
      if (!employeeData[record.name]) {
        employeeData[record.name] = {
          name: record.name,
          totalSalary: 0,
          records: []
        };
      }
      employeeData[record.name].totalSalary += record.amount || 0;
      employeeData[record.name].records.push(record);
    });

    const pfRecords = [];
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const [employeeName, data] of Object.entries(employeeData)) {
      try {
        // Check if PF record already exists
        const existing = await PF.findOne({ employeeName, financialYear });
        if (existing) {
          errors.push(`PF record already exists for ${employeeName}`);
          errorCount++;
          continue;
        }

        const basicSalary = Math.round(data.totalSalary * 0.6);
        const monthlySalary = data.totalSalary / 12;
        const professionalTax = PF.calculateProfessionalTax(monthlySalary, ptState);

        const pfRecord = new PF({
          employeeId: `EMP${Date.now()}${Math.random().toString(36).substr(2, 3)}`.toUpperCase(),
          employeeName,
          pfNumber: `PF${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase(),
          financialYear,
          basicSalary,
          professionalTax,
          ptState,
          pfInterestRate,
          remarks: 'Auto-generated from salary data',
          createdBy: req.user?.name || 'System'
        });

        const savedRecord = await pfRecord.save();
        pfRecords.push(savedRecord);
        successCount++;
      } catch (error) {
        errors.push(`Error creating PF record for ${employeeName}: ${error.message}`);
        errorCount++;
      }
    }

    res.json({
      message: `Bulk creation completed. ${successCount} records created, ${errorCount} errors.`,
      successCount,
      errorCount,
      errors: errors.length > 10 ? errors.slice(0, 10).concat(['...and more']) : errors,
      records: pfRecords
    });
  } catch (error) {
    console.error('Error in bulk create:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/pf/export/csv
// @desc    Export PF records as CSV
// @access  Public
router.get('/export/csv', async (req, res) => {
  try {
    const { financialYear, complianceStatus, ptState } = req.query;
    
    const filter = {};
    if (financialYear) filter.financialYear = financialYear;
    if (complianceStatus) filter.complianceStatus = complianceStatus;
    if (ptState) filter.ptState = ptState;

    const records = await PF.find(filter).lean();
    
    if (records.length === 0) {
      return res.status(404).json({ message: 'No records found for export' });
    }

    // CSV headers
    const headers = [
      'Employee ID', 'Employee Name', 'PF Number', 'Financial Year',
      'Basic Salary', 'PF Eligible Salary', 'Employee PF', 'Employer PF',
      'VPF', 'Total PF', 'Professional Tax', 'PT State',
      'Compliance Status', 'Remarks', 'Created Date'
    ];

    // CSV data
    const csvData = records.map(record => [
      record.employeeId,
      record.employeeName,
      record.pfNumber,
      record.financialYear,
      record.basicSalary,
      record.pfEligibleSalary,
      record.employeePFContribution,
      record.employerPFContribution,
      record.vpfContribution || 0,
      record.totalPFContribution,
      record.professionalTax,
      record.ptState,
      record.complianceStatus,
      record.remarks || '',
      new Date(record.createdAt).toLocaleDateString()
    ]);

    // Create CSV content
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="pf_records_${financialYear || 'all'}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;


