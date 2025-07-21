import express from 'express';
const router = express.Router();
import IncomeTax from "../models/IncomeTax.js";

// GET: All income tax records
router.get('/', async (req, res) => {
  try {
    const { financialYear, employeeName, complianceStatus } = req.query;
    
    let query = {};
    if (financialYear) query.financialYear = financialYear;
    if (employeeName) query.employeeName = { $regex: employeeName, $options: 'i' };
    if (complianceStatus) query.complianceStatus = complianceStatus;
    
    const records = await IncomeTax.find(query)
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(records);
  } catch (err) {
    console.error('Error fetching income tax records:', err);
    res.status(500).json({ message: 'Error fetching income tax records' });
  }
});

// GET: Income tax record by ID
router.get('/:id', async (req, res) => {
  try {
    const record = await IncomeTax.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Income tax record not found' });
    }
    res.json(record);
  } catch (err) {
    console.error('Error fetching income tax record:', err);
    res.status(500).json({ message: 'Error fetching income tax record' });
  }
});

// POST: Create new income tax record
router.post('/', async (req, res) => {
  try {
    const incomeTax = new IncomeTax(req.body);
    
    // Calculate quarterly payments
    incomeTax.calculateQuarterlyTax();
    
    await incomeTax.save();
    res.status(201).json(incomeTax);
  } catch (err) {
    console.error('Error creating income tax record:', err);
    if (err.code === 11000) {
      res.status(400).json({ message: 'Employee already has a record for this financial year' });
    } else {
      res.status(500).json({ message: 'Error creating income tax record' });
    }
  }
});

// PUT: Update income tax record
router.put('/:id', async (req, res) => {
  try {
    const record = await IncomeTax.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Income tax record not found' });
    }
    
    // Update fields
    Object.assign(record, req.body);
    
    // Recalculate quarterly payments if income changed
    if (req.body.basicSalary || req.body.hra || req.body.allowances || req.body.bonuses || req.body.otherIncome) {
      record.calculateQuarterlyTax();
    }
    
    await record.save();
    res.json(record);
  } catch (err) {
    console.error('Error updating income tax record:', err);
    res.status(500).json({ message: 'Error updating income tax record' });
  }
});

// DELETE: Delete income tax record
router.delete('/:id', async (req, res) => {
  try {
    const record = await IncomeTax.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Income tax record not found' });
    }
    res.json({ message: 'Income tax record deleted successfully' });
  } catch (err) {
    console.error('Error deleting income tax record:', err);
    res.status(500).json({ message: 'Error deleting income tax record' });
  }
});

// POST: Record advance tax payment
router.post('/:id/advance-payment', async (req, res) => {
  try {
    const { quarter, amount, paymentDate, challanNumber } = req.body;
    
    const record = await IncomeTax.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Income tax record not found' });
    }
    
    const quarterPayment = record.quarterlyPayments.find(q => q.quarter === quarter);
    if (!quarterPayment) {
      return res.status(400).json({ message: 'Invalid quarter' });
    }
    
    quarterPayment.paidAmount = amount;
    quarterPayment.paymentDate = paymentDate;
    quarterPayment.challanNumber = challanNumber;
    quarterPayment.status = amount >= quarterPayment.amount ? 'Paid' : 'Pending';
    
    // Update total advance tax paid
    record.advanceTax = record.quarterlyPayments.reduce((sum, q) => sum + q.paidAmount, 0);
    
    await record.save();
    res.json(record);
  } catch (err) {
    console.error('Error recording advance tax payment:', err);
    res.status(500).json({ message: 'Error recording advance tax payment' });
  }
});

// GET: Tax calculation summary
router.get('/:id/summary', async (req, res) => {
  try {
    const record = await IncomeTax.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Income tax record not found' });
    }
    
    const summary = {
      grossIncome: record.grossIncome,
      totalDeductions: record.totalDeductions,
      taxableIncome: record.taxableIncome,
      incomeTax: record.incomeTax,
      cess: record.cess,
      totalTax: record.totalTax,
      tdsDeducted: record.tdsDeducted,
      advanceTax: record.advanceTax,
      refundDue: record.refundDue,
      quarterlyPayments: record.quarterlyPayments,
      complianceStatus: record.complianceStatus
    };
    
    res.json(summary);
  } catch (err) {
    console.error('Error fetching tax summary:', err);
    res.status(500).json({ message: 'Error fetching tax summary' });
  }
});

// GET: Tax slabs information
router.get('/info/tax-slabs', async (req, res) => {
  try {
    const taxSlabs = IncomeTax.getTaxSlabs();
    res.json(taxSlabs);
  } catch (err) {
    console.error('Error fetching tax slabs:', err);
    res.status(500).json({ message: 'Error fetching tax slabs' });
  }
});

// GET: Dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const currentFY = '2024-2025'; // You can make this dynamic
    
    const totalRecords = await IncomeTax.countDocuments({ financialYear: currentFY });
    
    const complianceStats = await IncomeTax.aggregate([
      { $match: { financialYear: currentFY } },
      { $group: { _id: '$complianceStatus', count: { $sum: 1 } } }
    ]);
    
    const totalTaxLiability = await IncomeTax.aggregate([
      { $match: { financialYear: currentFY } },
      { $group: { _id: null, total: { $sum: '$totalTax' } } }
    ]);
    
    const totalAdvanceTaxPaid = await IncomeTax.aggregate([
      { $match: { financialYear: currentFY } },
      { $group: { _id: null, total: { $sum: '$advanceTax' } } }
    ]);
    
    const totalTDSDeducted = await IncomeTax.aggregate([
      { $match: { financialYear: currentFY } },
      { $group: { _id: null, total: { $sum: '$tdsDeducted' } } }
    ]);
    
    // Upcoming due dates
    const upcomingDues = await IncomeTax.find({
      financialYear: currentFY,
      'quarterlyPayments.status': 'Pending',
      'quarterlyPayments.dueDate': { $gte: new Date() }
    }).select('employeeName quarterlyPayments').lean();
    
    const overdueTax = await IncomeTax.find({
      financialYear: currentFY,
      'quarterlyPayments.status': 'Pending',
      'quarterlyPayments.dueDate': { $lt: new Date() }
    }).countDocuments();
    
    res.json({
      totalRecords,
      complianceStats,
      totalTaxLiability: totalTaxLiability[0]?.total || 0,
      totalAdvanceTaxPaid: totalAdvanceTaxPaid[0]?.total || 0,
      totalTDSDeducted: totalTDSDeducted[0]?.total || 0,
      upcomingDues: upcomingDues.length,
      overdueTax
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// POST: Generate Form 16
router.post('/:id/form16', async (req, res) => {
  try {
    const record = await IncomeTax.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Income tax record not found' });
    }
    
    // Mark Form 16 as issued
    record.form16.issued = true;
    record.form16.issueDate = new Date();
    record.form16.downloadUrl = `/api/income-tax/${req.params.id}/form16/download`;
    
    await record.save();
    res.json({ message: 'Form 16 generated successfully', downloadUrl: record.form16.downloadUrl });
  } catch (err) {
    console.error('Error generating Form 16:', err);
    res.status(500).json({ message: 'Error generating Form 16' });
  }
});

// POST: File ITR
router.post('/:id/file-itr', async (req, res) => {
  try {
    const { returnType, acknowledgmentNumber } = req.body;
    
    const record = await IncomeTax.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Income tax record not found' });
    }
    
    record.itrFiling.filed = true;
    record.itrFiling.filingDate = new Date();
    record.itrFiling.returnType = returnType;
    record.itrFiling.acknowledgmentNumber = acknowledgmentNumber;
    record.itrFiling.status = 'Filed';
    record.complianceStatus = 'Compliant';
    
    await record.save();
    res.json({ message: 'ITR filed successfully', record });
  } catch (err) {
    console.error('Error filing ITR:', err);
    res.status(500).json({ message: 'Error filing ITR' });
  }
});

// GET: Export data
router.get('/export/csv', async (req, res) => {
  try {
    const { financialYear } = req.query;
    
    let query = {};
    if (financialYear) query.financialYear = financialYear;
    
    const records = await IncomeTax.find(query).lean();
    
    // Generate CSV content
    const csvHeaders = [
      'Employee ID', 'Employee Name', 'PAN', 'Financial Year',
      'Gross Income', 'Total Deductions', 'Taxable Income',
      'Income Tax', 'Cess', 'Total Tax', 'TDS Deducted',
      'Advance Tax', 'Refund Due', 'Compliance Status'
    ].join(',');
    
    const csvRows = records.map(record => [
      record.employeeId,
      `"${record.employeeName}"`,
      record.panNumber,
      record.financialYear,
      record.grossIncome,
      record.totalDeductions,
      record.taxableIncome,
      record.incomeTax,
      record.cess,
      record.totalTax,
      record.tdsDeducted,
      record.advanceTax,
      record.refundDue,
      record.complianceStatus
    ].join(','));
    
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 
      `attachment; filename="income_tax_${financialYear || 'all'}_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error exporting data:', err);
    res.status(500).json({ message: 'Error exporting data' });
  }
});

// GET: Income tax data by employee ID (for salary slip integration)
router.get('/faculty/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { financialYear } = req.query;
    
    let query = { employeeId };
    
    // If financial year is provided, filter by it, otherwise get the latest record
    if (financialYear) {
      query.financialYear = financialYear;
    }
    
    let record;
    if (financialYear) {
      record = await IncomeTax.findOne(query).lean();
    } else {
      // Get the most recent record for this employee
      record = await IncomeTax.findOne(query)
        .sort({ createdAt: -1 })
        .lean();
    }
    
    if (!record) {
      return res.status(404).json({ 
        message: 'No income tax record found for this faculty member',
        employeeId 
      });
    }
    
    // Return formatted data for salary slip
    const salaryData = {
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      financialYear: record.financialYear,
      basicSalary: record.basicSalary || 0,
      hra: record.hra || 0,
      allowances: record.allowances || 0,
      bonuses: record.bonuses || 0,
      otherIncome: record.otherIncome || 0,
      grossIncome: record.grossIncome || 0,
      deductions: {
        ppf: record.ppf || 0,
        elss: record.elss || 0,
        lifeInsurance: record.lifeInsurance || 0,
        housingLoan: record.housingLoan || 0,
        tuitionFees: record.tuitionFees || 0,
        total80C: record.total80C || 0,
        section80D: record.section80D || 0,
        section80G: record.section80G || 0,
        section24: record.section24 || 0,
        standardDeduction: record.standardDeduction || 0,
        professionalTax: record.professionalTax || 0,
        employerPF: record.employerPF || 0,
        totalDeductions: record.totalDeductions || 0
      },
      tax: {
        taxableIncome: record.taxableIncome || 0,
        incomeTax: record.incomeTax || 0,
        cess: record.cess || 0,
        totalTax: record.totalTax || 0,
        tdsDeducted: record.tdsDeducted || 0,
        advanceTax: record.advanceTax || 0,
        refundDue: record.refundDue || 0
      }
    };
    
    res.json(salaryData);
  } catch (err) {
    console.error('Error fetching faculty income tax data:', err);
    res.status(500).json({ message: 'Error fetching faculty income tax data' });
  }
});

export default router;

