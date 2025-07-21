import express from 'express';
const router = express.Router();
import { syncCrossModuleData } from "../sync-cross-module-data.js";

// Import models
import Student from "../models/StudentManagement.js";
import Payment from "../models/Payment.js";
import Salary from "../models/Salary.js";
import IncomeTax from "../models/IncomeTax.js";
import PF from "../models/PF.js";
import Expense from "../models/Expense.js";
import Insurance from "../models/Insurance.js";

// GET /api/integration/dashboard - Comprehensive integration dashboard
router.get('/dashboard', async (req, res) => {
  try {
    console.log('📊 Fetching integration dashboard data...');
    
    // Parallel data fetching for performance
    const [
      studentStats,
      paymentStats,
      salaryStats,
      pfStats,
      incomeTaxStats,
      expenseStats,
      insuranceStats
    ] = await Promise.all([
      getStudentStats(),
      getPaymentStats(),
      getSalaryStats(),
      getPFStats(),
      getIncomeTaxStats(),
      getExpenseStats(),
      getInsuranceStats()
    ]);

    // Calculate integration metrics
    const integrationMetrics = await calculateIntegrationMetrics();
    
    // Generate system health score
    const healthScore = calculateSystemHealth(
      studentStats, paymentStats, salaryStats, pfStats, incomeTaxStats
    );

    const dashboard = {
      timestamp: new Date(),
      systemHealth: {
        score: healthScore.score,
        status: healthScore.status,
        details: healthScore.details
      },
      modules: {
        students: studentStats,
        payments: paymentStats,
        faculty: {
          salary: salaryStats,
          pf: pfStats,
          incomeTax: incomeTaxStats
        },
        expenses: expenseStats,
        insurance: insuranceStats
      },
      integration: integrationMetrics,
      financialSummary: {
        totalRevenue: (studentStats.totalFeesPaid || 0),
        totalExpenses: (expenseStats.totalApproved || 0) + (salaryStats.totalPaid || 0),
        pendingCollections: studentStats.totalPending || 0,
        netPosition: (studentStats.totalFeesPaid || 0) - ((expenseStats.totalApproved || 0) + (salaryStats.totalPaid || 0))
      },
      alerts: generateSystemAlerts(integrationMetrics, healthScore)
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Error fetching integration dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch integration dashboard' });
  }
});

// GET /api/integration/sync-status - Real-time sync status
router.get('/sync-status', async (req, res) => {
  try {
    const syncStatus = await calculateSyncStatus();
    res.json(syncStatus);
  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

// POST /api/integration/auto-sync - Trigger auto-sync
router.post('/auto-sync', async (req, res) => {
  try {
    
    console.log('🔄 Triggering auto-sync...');
    const syncResult = await syncCrossModuleData();
    
    res.json({
      success: true,
      message: 'Auto-sync completed successfully',
      result: syncResult
    });
  } catch (error) {
    console.error('Error during auto-sync:', error);
    res.status(500).json({ 
      success: false,
      error: 'Auto-sync failed',
      details: error.message 
    });
  }
});

// GET /api/integration/connections - Module connection matrix
router.get('/connections', async (req, res) => {
  try {
    const connections = await generateConnectionMatrix();
    res.json(connections);
  } catch (error) {
    console.error('Error fetching connections:', error);
    res.status(500).json({ error: 'Failed to fetch connection matrix' });
  }
});

// Helper functions
async function getStudentStats() {
  const [totalStudents, activeStudents, totalFeesPaid, totalPending] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ academicStatus: 'Active' }),
    Student.aggregate([{ $group: { _id: null, total: { $sum: '$feesPaid' } } }]),
    Student.aggregate([{ $group: { _id: null, total: { $sum: '$pendingAmount' } } }])
  ]);

  return {
    total: totalStudents,
    active: activeStudents,
    totalFeesPaid: totalFeesPaid[0]?.total || 0,
    totalPending: totalPending[0]?.total || 0
  };
}

async function getPaymentStats() {
  const [totalPayments, studentPayments, totalAmount] = await Promise.all([
    Payment.countDocuments(),
    Payment.countDocuments({ studentId: { $exists: true } }),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
  ]);

  return {
    total: totalPayments,
    studentPayments,
    totalAmount: totalAmount[0]?.total || 0
  };
}

async function getSalaryStats() {
  const [totalRecords, uniqueEmployees, totalPaid] = await Promise.all([
    Salary.countDocuments(),
    Salary.distinct('name'),
    Salary.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
  ]);

  return {
    totalRecords,
    uniqueEmployees: uniqueEmployees.length,
    totalPaid: totalPaid[0]?.total || 0,
    employees: uniqueEmployees
  };
}

async function getPFStats() {
  const [totalRecords, uniqueEmployees, pfTotals] = await Promise.all([
    PF.countDocuments(),
    PF.distinct('employeeName'),
    PF.aggregate([{
      $group: {
        _id: null,
        totalEmployeePF: { $sum: '$employeePFContribution' },
        totalEmployerPF: { $sum: '$employerPFContribution' },
        totalProfessionalTax: { $sum: '$professionalTax' }
      }
    }])
  ]);

  return {
    totalRecords,
    uniqueEmployees: uniqueEmployees.length,
    totals: pfTotals[0] || {},
    employees: uniqueEmployees
  };
}

async function getIncomeTaxStats() {
  const [totalRecords, uniqueEmployees, itTotals] = await Promise.all([
    IncomeTax.countDocuments(),
    IncomeTax.distinct('employeeName'),
    IncomeTax.aggregate([{
      $group: {
        _id: null,
        totalTaxLiability: { $sum: '$taxLiability' },
        totalTdsDeducted: { $sum: '$tdsDeducted' }
      }
    }])
  ]);

  return {
    totalRecords,
    uniqueEmployees: uniqueEmployees.length,
    totals: itTotals[0] || {},
    employees: uniqueEmployees
  };
}

async function getExpenseStats() {
  const [totalExpenses, approvedExpenses, totalApproved] = await Promise.all([
    Expense.countDocuments(),
    Expense.countDocuments({ status: 'Approved' }),
    Expense.aggregate([
      { $match: { status: 'Approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  return {
    total: totalExpenses,
    approved: approvedExpenses,
    totalApproved: totalApproved[0]?.total || 0
  };
}

async function getInsuranceStats() {
  const [totalInsurance, activeInsurance] = await Promise.all([
    Insurance.countDocuments(),
    Insurance.countDocuments({ status: 'Active' })
  ]);

  return {
    total: totalInsurance,
    active: activeInsurance
  };
}

async function calculateIntegrationMetrics() {
  // Student-Payment integration
  const studentsWithPayments = await Payment.distinct('studentId');
  const totalStudents = await Student.countDocuments();
  const studentPaymentRate = totalStudents > 0 ? (studentsWithPayments.length / totalStudents * 100) : 0;

  // Faculty integration chain
  const salaryEmployees = await Salary.distinct('name');
  const pfEmployees = await PF.distinct('employeeName');
  const itEmployees = await IncomeTax.distinct('employeeName');
  
  const salaryPFRate = salaryEmployees.length > 0 ? (pfEmployees.length / salaryEmployees.length * 100) : 0;
  const pfITRate = pfEmployees.length > 0 ? (itEmployees.length / pfEmployees.length * 100) : 0;

  return {
    studentPayment: {
      rate: parseFloat(studentPaymentRate.toFixed(1)),
      connected: studentsWithPayments.length,
      total: totalStudents
    },
    facultyChain: {
      salaryToPF: {
        rate: parseFloat(salaryPFRate.toFixed(1)),
        connected: pfEmployees.length,
        total: salaryEmployees.length
      },
      pfToIncomeTax: {
        rate: parseFloat(pfITRate.toFixed(1)),
        connected: itEmployees.length,
        total: pfEmployees.length
      }
    },
    overallIntegration: parseFloat(((studentPaymentRate + salaryPFRate + pfITRate) / 3).toFixed(1))
  };
}

function calculateSystemHealth(studentStats, paymentStats, salaryStats, pfStats, incomeTaxStats) {
  let score = 0;
  let details = [];

  // Students module health (25 points)
  if (studentStats.total > 0) {
    score += 15;
    details.push('✅ Student module active');
  }
  if (paymentStats.studentPayments > 0) {
    score += 10;
    details.push('✅ Payment processing functional');
  }

  // Faculty module health (45 points)
  if (salaryStats.totalRecords > 0) {
    score += 15;
    details.push('✅ Salary management active');
  }
  if (pfStats.totalRecords > 0) {
    score += 15;
    details.push('✅ PF management functional');
  }
  if (incomeTaxStats.totalRecords > 0) {
    score += 15;
    details.push('✅ Income tax tracking active');
  }

  // Integration health (30 points)
  if (paymentStats.studentPayments / Math.max(studentStats.total, 1) > 0.1) {
    score += 10;
    details.push('✅ Student-payment integration good');
  }
  if (pfStats.uniqueEmployees / Math.max(salaryStats.uniqueEmployees, 1) > 0.5) {
    score += 10;
    details.push('✅ Salary-PF integration good');
  }
  if (incomeTaxStats.uniqueEmployees / Math.max(pfStats.uniqueEmployees, 1) > 0.5) {
    score += 10;
    details.push('✅ PF-Income Tax integration good');
  }

  let status;
  if (score >= 90) status = 'EXCELLENT';
  else if (score >= 75) status = 'GOOD';
  else if (score >= 50) status = 'FAIR';
  else status = 'POOR';

  return { score, status, details };
}

async function calculateSyncStatus() {
  const lastSyncTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  
  // Check for recent updates
  const recentUpdates = await Promise.all([
    Student.countDocuments({ updatedAt: { $gte: lastSyncTime } }),
    Payment.countDocuments({ createdAt: { $gte: lastSyncTime } }),
    Salary.countDocuments({ updatedAt: { $gte: lastSyncTime } }),
    PF.countDocuments({ updatedAt: { $gte: lastSyncTime } }),
    IncomeTax.countDocuments({ updatedAt: { $gte: lastSyncTime } })
  ]);

  return {
    lastSync: lastSyncTime,
    recentActivity: {
      students: recentUpdates[0],
      payments: recentUpdates[1],
      salary: recentUpdates[2],
      pf: recentUpdates[3],
      incomeTax: recentUpdates[4]
    },
    needsSync: recentUpdates.some(count => count > 0),
    status: recentUpdates.some(count => count > 0) ? 'SYNC_NEEDED' : 'UP_TO_DATE'
  };
}

async function generateConnectionMatrix() {
  const students = await Student.find().select('_id studentId firstName lastName');
  const payments = await Payment.find().select('studentId amount').populate('studentId', 'studentId');
  const salaryEmployees = await Salary.distinct('name');
  const pfEmployees = await PF.distinct('employeeName');
  const itEmployees = await IncomeTax.distinct('employeeName');

  const studentConnections = students.map(student => {
    const studentPayments = payments.filter(p => p.studentId && p.studentId._id.toString() === student._id.toString());
    return {
      id: student.studentId,
      name: `${student.firstName} ${student.lastName}`,
      hasPayments: studentPayments.length > 0,
      paymentCount: studentPayments.length,
      totalPaid: studentPayments.reduce((sum, p) => sum + p.amount, 0)
    };
  });

  const facultyConnections = salaryEmployees.map(name => ({
    name,
    hasSalary: true,
    hasPF: pfEmployees.includes(name),
    hasIncomeTax: itEmployees.includes(name),
    isFullyConnected: pfEmployees.includes(name) && itEmployees.includes(name)
  }));

  return {
    students: studentConnections,
    faculty: facultyConnections,
    summary: {
      totalStudents: students.length,
      studentsWithPayments: studentConnections.filter(s => s.hasPayments).length,
      totalFaculty: salaryEmployees.length,
      facultyFullyConnected: facultyConnections.filter(f => f.isFullyConnected).length
    }
  };
}

function generateSystemAlerts(integrationMetrics, healthScore) {
  const alerts = [];

  if (healthScore.score < 75) {
    alerts.push({
      type: 'warning',
      message: 'System health score is below optimal level',
      action: 'Review module connections and data integrity'
    });
  }

  if (integrationMetrics.studentPayment.rate < 50) {
    alerts.push({
      type: 'info',
      message: 'Low student-payment integration rate',
      action: 'Consider encouraging more student payments'
    });
  }

  if (integrationMetrics.facultyChain.salaryToPF.rate < 80) {
    alerts.push({
      type: 'warning',
      message: 'Some employees missing PF records',
      action: 'Run auto-sync to create missing PF records'
    });
  }

  if (integrationMetrics.facultyChain.pfToIncomeTax.rate < 80) {
    alerts.push({
      type: 'warning',
      message: 'Some employees missing Income Tax records',
      action: 'Run auto-sync to create missing Income Tax records'
    });
  }

  return alerts;
}

export default router;


