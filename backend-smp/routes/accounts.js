import express from 'express';
const router = express.Router();

// Mock data for student accounts
let studentAccounts = [
  {
    id: 1,
    studentId: 'STU2024001',
    studentName: 'John Doe',
    academicYear: 2024,
    semester: 1,
    totalAmount: 50000,
    paidAmount: 30000,
    balanceAmount: 20000,
    lateFees: 0,
    dueDate: '2024-08-15',
    status: 'Partial',
    department: 'Computer Science',
    program: 'Bachelor of Technology'
  },
  {
    id: 2,
    studentId: 'STU2024002',
    studentName: 'Jane Smith',
    academicYear: 2024,
    semester: 1,
    totalAmount: 55000,
    paidAmount: 55000,
    balanceAmount: 0,
    lateFees: 0,
    dueDate: '2024-08-15',
    status: 'Paid',
    department: 'Electrical Engineering',
    program: 'Bachelor of Engineering'
  },
  {
    id: 3,
    studentId: 'STU2023001',
    studentName: 'Mike Johnson',
    academicYear: 2024,
    semester: 1,
    totalAmount: 52000,
    paidAmount: 0,
    balanceAmount: 52000,
    lateFees: 2600,
    dueDate: '2024-07-15',
    status: 'Overdue',
    department: 'Mechanical Engineering',
    program: 'Bachelor of Engineering'
  }
];

// GET all student accounts
router.get('/', (req, res) => {
  const { status, department, search, academicYear, semester } = req.query;
  
  let filteredAccounts = [...studentAccounts];
  
  // Filter by status
  if (status) {
    filteredAccounts = filteredAccounts.filter(account => account.status === status);
  }
  
  // Filter by department
  if (department) {
    filteredAccounts = filteredAccounts.filter(account => 
      account.department.toLowerCase().includes(department.toLowerCase())
    );
  }
  
  // Filter by academic year
  if (academicYear) {
    filteredAccounts = filteredAccounts.filter(account => account.academicYear === parseInt(academicYear));
  }
  
  // Filter by semester
  if (semester) {
    filteredAccounts = filteredAccounts.filter(account => account.semester === parseInt(semester));
  }
  
  // Search by student name or ID
  if (search) {
    filteredAccounts = filteredAccounts.filter(account => 
      account.studentName.toLowerCase().includes(search.toLowerCase()) ||
      account.studentId.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  res.json({
    success: true,
    count: filteredAccounts.length,
    data: filteredAccounts
  });
});

// GET account statistics - MUST BE BEFORE /:id route
router.get('/stats/overview', (req, res) => {
  const totalAccounts = studentAccounts.length;
  const totalAmount = studentAccounts.reduce((sum, account) => sum + account.totalAmount, 0);
  const totalPaid = studentAccounts.reduce((sum, account) => sum + account.paidAmount, 0);
  const totalBalance = studentAccounts.reduce((sum, account) => sum + account.balanceAmount, 0);
  const totalLateFees = studentAccounts.reduce((sum, account) => sum + account.lateFees, 0);
  
  const statusStats = studentAccounts.reduce((acc, account) => {
    acc[account.status] = (acc[account.status] || 0) + 1;
    return acc;
  }, {});
  
  const departmentStats = studentAccounts.reduce((acc, account) => {
    if (!acc[account.department]) {
      acc[account.department] = {
        count: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalBalance: 0
      };
    }
    acc[account.department].count++;
    acc[account.department].totalAmount += account.totalAmount;
    acc[account.department].totalPaid += account.paidAmount;
    acc[account.department].totalBalance += account.balanceAmount;
    return acc;
  }, {});
  
  res.json({
    success: true,
    data: {
      totalAccounts,
      totalAmount,
      totalPaid,
      totalBalance,
      totalLateFees,
      collectionRate: totalAmount > 0 ? ((totalPaid / totalAmount) * 100).toFixed(2) : 0,
      statusStats,
      departmentStats
    }
  });
});

// GET account by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const account = studentAccounts.find(a => a.id === parseInt(id) || a.studentId === id);
  
  if (!account) {
    return res.status(404).json({
      success: false,
      error: 'Account not found'
    });
  }
  
  res.json({
    success: true,
    data: account
  });
});

// GET account by student ID
router.get('/student/:studentId', (req, res) => {
  const { studentId } = req.params;
  const accounts = studentAccounts.filter(a => a.studentId === studentId);
  
  res.json({
    success: true,
    count: accounts.length,
    data: accounts
  });
});

// POST create new account
router.post('/', (req, res) => {
  const {
    studentId,
    studentName,
    academicYear,
    semester,
    totalAmount,
    dueDate,
    department,
    program
  } = req.body;
  
  // Validation
  if (!studentId || !studentName || !academicYear || !semester || !totalAmount || !dueDate) {
    return res.status(400).json({
      success: false,
      error: 'Required fields missing'
    });
  }
  
  // Check if account already exists for this student, year, and semester
  const existingAccount = studentAccounts.find(a => 
    a.studentId === studentId && 
    a.academicYear === academicYear && 
    a.semester === semester
  );
  
  if (existingAccount) {
    return res.status(400).json({
      success: false,
      error: 'Account already exists for this student, year, and semester'
    });
  }
  
  const newAccount = {
    id: studentAccounts.length + 1,
    studentId,
    studentName,
    academicYear,
    semester,
    totalAmount,
    paidAmount: 0,
    balanceAmount: totalAmount,
    lateFees: 0,
    dueDate,
    status: 'Pending',
    department,
    program,
    createdAt: new Date().toISOString()
  };
  
  studentAccounts.push(newAccount);
  
  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: newAccount
  });
});

// PUT update account
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const accountIndex = studentAccounts.findIndex(a => a.id === parseInt(id) || a.studentId === id);
  
  if (accountIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Account not found'
    });
  }
  
  const updatedAccount = {
    ...studentAccounts[accountIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  // Recalculate balance
  updatedAccount.balanceAmount = updatedAccount.totalAmount - updatedAccount.paidAmount + updatedAccount.lateFees;
  
  // Update status based on balance
  if (updatedAccount.balanceAmount <= 0) {
    updatedAccount.status = 'Paid';
  } else if (updatedAccount.paidAmount > 0) {
    updatedAccount.status = 'Partial';
  } else if (new Date() > new Date(updatedAccount.dueDate)) {
    updatedAccount.status = 'Overdue';
  } else {
    updatedAccount.status = 'Pending';
  }
  
  studentAccounts[accountIndex] = updatedAccount;
  
  res.json({
    success: true,
    message: 'Account updated successfully',
    data: updatedAccount
  });
});

// POST record payment
router.post('/:id/payment', (req, res) => {
  const { id } = req.params;
  const { amount, paymentMethod, remarks } = req.body;
  
  const accountIndex = studentAccounts.findIndex(a => a.id === parseInt(id) || a.studentId === id);
  
  if (accountIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Account not found'
    });
  }
  
  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid payment amount'
    });
  }
  
  const account = studentAccounts[accountIndex];
  const newPaidAmount = account.paidAmount + amount;
  const newBalance = account.totalAmount - newPaidAmount + account.lateFees;
  
  // Update account
  account.paidAmount = newPaidAmount;
  account.balanceAmount = newBalance;
  
  // Update status
  if (newBalance <= 0) {
    account.status = 'Paid';
  } else if (newPaidAmount > 0) {
    account.status = 'Partial';
  }
  
  account.updatedAt = new Date().toISOString();
  
  // Add payment record
  const payment = {
    id: Date.now(),
    accountId: account.id,
    amount,
    paymentMethod,
    remarks,
    paymentDate: new Date().toISOString()
  };
  
  res.json({
    success: true,
    message: 'Payment recorded successfully',
    data: {
      account,
      payment
    }
  });
});

export default router; 