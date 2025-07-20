import React, { useState, useEffect } from 'react';

const IncomeTax = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Salary Slip States
  const [showSalarySlipModal, setShowSalarySlipModal] = useState(false);
  const [salarySlipEmployee, setSalarySlipEmployee] = useState('');
  const [salarySlipMonth, setSalarySlipMonth] = useState('');
  const [salarySlipYear, setSalarySlipYear] = useState(new Date().getFullYear());
  const [salarySlip, setSalarySlip] = useState(null);
  const [generatingSlip, setGeneratingSlip] = useState(false);

  const [salaryData, setSalaryData] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);

  // History states
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState({
    employeeName: '',
    month: '',
    year: '',
    status: '',
    salaryType: ''
  });
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showReport, setShowReport] = useState(false);

  // Salary calculation states
  const [salaryCalculationType, setSalaryCalculationType] = useState('actual');
  const [staffType, setStaffType] = useState('teaching'); // teaching or non-teaching
  const [salaryInputs, setSalaryInputs] = useState({
    employeeName: '', // Employee name for salary record
    salaryMonth: new Date().getMonth() + 1, // Default to current month
    salaryYear: new Date().getFullYear(), // Default to current year
    basicSalary: '',
    gradePay: '',
    agp: '', // Academic Grade Pay for teaching staff
    payLevel: '',
    hraRate: '',
    daRate: '', // DA rate for actual salary calculation
    city: 'X',
    medicalAllowance: '',
    transportAllowance: '',
    claAllowance: '', // City Compensatory Allowance
    otherAllowances: '',
    // Additional allowances based on reference table
    specialAllowance: '', // Special allowance
    conveyanceAllowance: '', // Conveyance allowance  
    // Deductions
    tdsDeduction: '',
    epfDeduction: '',
    professionalTax: '', // Professional Tax - manual entry for all calculation types
    esiDeduction: '', // ESI deduction
    loanDeduction: '', // Loan/Advance deduction
    insuranceDeduction: '', // Insurance premium deduction
    otherDeductions: '', // Other deductions
    // Daily salary calculation fields
    workingDays: '', // Number of days worked in the month
    totalMonthDays: '', // Total days in the month (for pro-rata calculation)
    // Quick decided salary field
    decidedSalary: '' // Total fixed monthly salary amount
  });
  const [calculatedSalary, setCalculatedSalary] = useState(null);

  // 6th Pay Commission Pay Scales for Teaching Staff
  const teachingPayScales = {
    'Assistant Professor': {
      range: '15600-39100',
      agp: [6000, 7000, 8000],
      description: 'Assistant Professor (AGP 6000-8000)'
    },
    'Associate Professor': {
      range: '37400-67000',
      agp: [9000],
      description: 'Associate Professor (AGP 9000)'
    },
    'Professor': {
      range: '37400-67000',
      agp: [10000],
      description: 'Professor (AGP 10000)'
    },
    'Principal/Director': {
      range: '37400-67000',
      agp: [12000],
      description: 'Principal/Director (AGP 12000)'
    }
  };

  // 6th Pay Commission Pay Scales for Non-Teaching Staff
  const nonTeachingPayScales = {
    'PB-1': { range: '5200-20200', gradePay: [1800, 1900, 2000, 2400, 2800] },
    'PB-2': { range: '9300-34800', gradePay: [4200, 4600, 4800, 5400] },
    'PB-3': { range: '15600-39100', gradePay: [5400, 6600, 7600, 8700, 8900] },
    'PB-4': { range: '37400-67000', gradePay: [8700, 8900, 10000] },
    'HAG': { range: '67000-79000', gradePay: [10000, 12000] },
    'HAG+': { range: '75500-80000', gradePay: [12000] },
    'Apex': { range: '80000 (Fixed)', gradePay: [12000] }
  };

  // HRA Rates
  const hraRates = {
    'X': 0.15, // Metro cities (15%)
    'Y': 0.15, // Non-metro cities (15%)
    'Z': 0.15  // Other cities (15%)
  };

  // Months array for salary slip
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Professional Tax Slabs (Monthly)
  const professionalTaxSlabs = [
    { min: 0, max: 10000, pt: 0 },
    { min: 10001, max: 15000, pt: 110 },
    { min: 15001, max: 25000, pt: 130 },
    { min: 25001, max: 40000, pt: 150 },
    { min: 40001, max: Infinity, pt: 200 }
  ];

  // Calculate Professional Tax based on gross salary
  const calculateProfessionalTax = (grossSalary) => {
    const monthlyGross = grossSalary / 12; // Convert annual to monthly
    const slab = professionalTaxSlabs.find(slab =>
      monthlyGross >= slab.min && monthlyGross <= slab.max
    );
    return slab ? slab.pt * 12 : 0; // Return annual PT
  };

  // Calculate 6th Pay Commission Teaching Staff Salary
  const calculateTeachingSalary = () => {
    const basic = parseFloat(salaryInputs.basicSalary) || 0;
    const agp = parseFloat(salaryInputs.agp) || 0; // Academic Grade Pay
    const hraRate = hraRates[salaryInputs.city] || 0.15;

    // Teaching Staff Calculation: Basic + AGP first, then other allowances
    const basicPlusAGP = basic + agp;
    const da = (basicPlusAGP * 164) / 100; // Fixed 164% DA
    const hra = (basicPlusAGP * hraRate);
    const ta = parseFloat(salaryInputs.transportAllowance) || 0; // TA
    const cla = parseFloat(salaryInputs.claAllowance) || 0; // City Compensatory Allowance
    const medical = parseFloat(salaryInputs.medicalAllowance) || 0;
    const others = parseFloat(salaryInputs.otherAllowances) || 0;

    // Daily salary calculation if working days are specified
    const workingDays = parseFloat(salaryInputs.workingDays) || 0;
    const totalMonthDays = parseFloat(salaryInputs.totalMonthDays) || 30;

    let adjustedBasicPlusAGP = basicPlusAGP;
    let adjustedDA = da;
    let adjustedHRA = hra;
    let adjustedTA = ta;
    let adjustedCLA = cla;
    let adjustedMedical = medical;
    let adjustedOthers = others;
    let isProRata = false;

    // Apply daily calculation if working days provided
    if (workingDays > 0 && totalMonthDays > 0 && workingDays < totalMonthDays) {
      const dailyMultiplier = workingDays / totalMonthDays;
      adjustedBasicPlusAGP = basicPlusAGP * dailyMultiplier;
      adjustedDA = da * dailyMultiplier;
      adjustedHRA = hra * dailyMultiplier;
      adjustedTA = ta * dailyMultiplier;
      adjustedCLA = cla * dailyMultiplier;
      adjustedMedical = medical * dailyMultiplier;
      adjustedOthers = others * dailyMultiplier;
      isProRata = true;
    }

    const gross = adjustedBasicPlusAGP + adjustedDA + adjustedHRA + adjustedTA + adjustedCLA + adjustedMedical + adjustedOthers;

    // Deductions
    const tds = parseFloat(salaryInputs.tdsDeduction) || 0;
    const epf = parseFloat(salaryInputs.epfDeduction) || 0;
    const pt = parseFloat(salaryInputs.professionalTax) || 0; // Manual PT entry

    // Apply proportional deductions if working partial days
    let adjustedTds = tds;
    let adjustedEpf = epf;
    let adjustedPt = pt;

    if (workingDays > 0 && totalMonthDays > 0 && workingDays < totalMonthDays) {
      const dailyMultiplier = workingDays / totalMonthDays;
      adjustedTds = tds * dailyMultiplier;
      adjustedEpf = epf * dailyMultiplier;
      adjustedPt = pt * dailyMultiplier;
    }

    const totalDeductions = adjustedTds + adjustedEpf + adjustedPt;
    const netSalary = gross - totalDeductions;

    return {
      basic,
      agp,
      basicPlusAGP: adjustedBasicPlusAGP,
      da: adjustedDA,
      hra: adjustedHRA,
      ta: adjustedTA,
      cla: adjustedCLA,
      medical: adjustedMedical,
      others: adjustedOthers,
      gross,
      tds: adjustedTds,
      epf: adjustedEpf,
      pt: adjustedPt,
      totalDeductions,
      netSalary,
      type: '6th Pay Commission - Teaching Staff',
      // Daily calculation details
      fullMonthSalary: basicPlusAGP + da + hra + ta + cla + medical + others,
      perDayRate: workingDays > 0 && totalMonthDays > 0 ? ((basicPlusAGP + da + hra + ta + cla + medical + others) / totalMonthDays) : 0,
      workingDays: workingDays || totalMonthDays,
      totalMonthDays: totalMonthDays,
      dailyRate: workingDays > 0 && totalMonthDays > 0 ? (workingDays / totalMonthDays) : 1,
      isProRata: isProRata
    }
  };

  // Calculate 6th Pay Commission Non-Teaching Staff Salary
  const calculateNonTeachingSalary = () => {
    const basic = parseFloat(salaryInputs.basicSalary) || 0;
    const grade = parseFloat(salaryInputs.gradePay) || 0;
    const hraRate = hraRates[salaryInputs.city] || 0.15;

    const basicPlusGrade = basic + grade;
    const da = (basicPlusGrade * 90) / 100; // Fixed 90% DA for Non-Teaching Staff
    const hra = (basicPlusGrade * hraRate);
    const ta = parseFloat(salaryInputs.transportAllowance) || 800;
    const cla = parseFloat(salaryInputs.claAllowance) || 120;
    const medical = parseFloat(salaryInputs.medicalAllowance) || 0;
    const others = parseFloat(salaryInputs.otherAllowances) || 0;

    // Daily salary calculation if working days are specified
    const workingDays = parseFloat(salaryInputs.workingDays) || 0;
    const totalMonthDays = parseFloat(salaryInputs.totalMonthDays) || 30;

    let adjustedBasicPlusGrade = basicPlusGrade;
    let adjustedDA = da;
    let adjustedHRA = hra;
    let adjustedTA = ta;
    let adjustedCLA = cla;
    let adjustedMedical = medical;
    let adjustedOthers = others;
    let isProRata = false;

    // Apply daily calculation if working days provided
    if (workingDays > 0 && totalMonthDays > 0 && workingDays < totalMonthDays) {
      const dailyMultiplier = workingDays / totalMonthDays;
      adjustedBasicPlusGrade = basicPlusGrade * dailyMultiplier;
      adjustedDA = da * dailyMultiplier;
      adjustedHRA = hra * dailyMultiplier;
      adjustedTA = ta * dailyMultiplier;
      adjustedCLA = cla * dailyMultiplier;
      adjustedMedical = medical * dailyMultiplier;
      adjustedOthers = others * dailyMultiplier;
      isProRata = true;
    }

    const gross = adjustedBasicPlusGrade + adjustedDA + adjustedHRA + adjustedTA + adjustedCLA + adjustedMedical + adjustedOthers;

    // Deductions
    const tds = parseFloat(salaryInputs.tdsDeduction) || 0;
    const epf = parseFloat(salaryInputs.epfDeduction) || 0;
    const pt = parseFloat(salaryInputs.professionalTax) || 0; // Manual PT entry

    // Apply proportional deductions if working partial days
    let adjustedTds = tds;
    let adjustedEpf = epf;
    let adjustedPt = pt;

    if (workingDays > 0 && totalMonthDays > 0 && workingDays < totalMonthDays) {
      const dailyMultiplier = workingDays / totalMonthDays;
      adjustedTds = tds * dailyMultiplier;
      adjustedEpf = epf * dailyMultiplier;
      adjustedPt = pt * dailyMultiplier;
    }

    const totalDeductions = adjustedTds + adjustedEpf + adjustedPt;
    const netSalary = gross - totalDeductions;

    return {
      basic,
      gradePay: grade,
      basicPlusGrade: adjustedBasicPlusGrade,
      da: adjustedDA,
      hra: adjustedHRA,
      ta: adjustedTA,
      cla: adjustedCLA,
      medical: adjustedMedical,
      others: adjustedOthers,
      gross,
      tds: adjustedTds,
      epf: adjustedEpf,
      pt: adjustedPt,
      totalDeductions,
      netSalary,
      type: '6th Pay Commission - Non-Teaching Staff',
      // Daily calculation details
      fullMonthSalary: basicPlusGrade + da + hra + ta + cla + medical + others,
      perDayRate: workingDays > 0 && totalMonthDays > 0 ? ((basicPlusGrade + da + hra + ta + cla + medical + others) / totalMonthDays) : 0,
      workingDays: workingDays || totalMonthDays,
      totalMonthDays: totalMonthDays,
      dailyRate: workingDays > 0 && totalMonthDays > 0 ? (workingDays / totalMonthDays) : 1,
      isProRata: isProRata
    };
  };

  // Calculate Actual Salary
  const calculateActualSalary = () => {
    // Priority: Use decided salary first, then individual components
    let fullMonthSalary = 0;
    let basic = 0, da = 0, hra = 0, ta = 0, cla = 0, medical = 0, others = 0;

    if (salaryInputs.decidedSalary && parseFloat(salaryInputs.decidedSalary) > 0) {
      // Use decided salary - either use existing components or auto-distribute
      fullMonthSalary = parseFloat(salaryInputs.decidedSalary);

      // Check if components are already filled, otherwise auto-distribute
      const existingComponents = (parseFloat(salaryInputs.basicSalary) || 0) +
        (parseFloat(salaryInputs.daRate) || 0) +
        (parseFloat(salaryInputs.hraRate) || 0) +
        (parseFloat(salaryInputs.transportAllowance) || 0) +
        (parseFloat(salaryInputs.claAllowance) || 0) +
        (parseFloat(salaryInputs.medicalAllowance) || 0) +
        (parseFloat(salaryInputs.otherAllowances) || 0);

      if (existingComponents > 0) {
        // Use existing components
        basic = parseFloat(salaryInputs.basicSalary) || 0;
        da = parseFloat(salaryInputs.daRate) || 0;
        hra = parseFloat(salaryInputs.hraRate) || 0;
        ta = parseFloat(salaryInputs.transportAllowance) || 0;
        cla = parseFloat(salaryInputs.claAllowance) || 0;
        medical = parseFloat(salaryInputs.medicalAllowance) || 0;
        others = parseFloat(salaryInputs.otherAllowances) || 0;
      } else {
        // Auto-distribute decided salary into components based on staff type
        if (staffType === 'teaching') {
          // Teaching staff - Decided salary becomes basic salary (no breakdown)
          basic = fullMonthSalary; // Decided salary = Basic salary for teaching staff
          da = 0; // No DA for teaching
          hra = 0; // No auto HRA breakdown
          ta = 0; // No auto TA breakdown
          cla = 0; // No auto CLA breakdown
          medical = 0; // No auto medical breakdown
          others = 0; // No auto others breakdown
        } else {
          // Non-teaching staff - Use decided salary as total package, calculate components properly
          // For non-teaching: decided salary includes all components, so break it down properly
          
          // If individual components are filled manually, use them
          const existingBasic = parseFloat(salaryInputs.basicSalary) || 0;
          const existingDA = parseFloat(salaryInputs.daRate) || 0;
          const existingHRA = parseFloat(salaryInputs.hraRate) || 0;
          const existingTA = parseFloat(salaryInputs.transportAllowance) || 0;
          const existingCLA = parseFloat(salaryInputs.claAllowance) || 0;
          const existingMedical = parseFloat(salaryInputs.medicalAllowance) || 0;
          const existingOthers = parseFloat(salaryInputs.otherAllowances) || 0;
          
          const totalExistingComponents = existingBasic + existingDA + existingHRA + existingTA + existingCLA + existingMedical + existingOthers;
          
          if (totalExistingComponents > 0) {
            // Use manually entered components
            basic = existingBasic;
            da = existingDA;
            hra = existingHRA;
            ta = existingTA;
            cla = existingCLA;
            medical = existingMedical;
            others = existingOthers;
          } else {
            // Auto-calculate from decided salary for non-teaching staff
            // Use decided salary as the total target amount
            basic = Math.round(fullMonthSalary * 0.4); // 40% basic
            da = Math.round(basic * 0.9); // 90% of basic as DA (correct DA rate)
            hra = Math.round(basic * 0.15); // 15% of basic as HRA
            ta = Math.round(fullMonthSalary * 0.05); // 5% as TA
            cla = Math.round(fullMonthSalary * 0.03); // 3% as CLA
            medical = Math.round(fullMonthSalary * 0.02); // 2% as Medical
            
            // Adjust others to match decided salary exactly
            const calculatedTotal = basic + da + hra + ta + cla + medical;
            others = Math.max(0, fullMonthSalary - calculatedTotal);
          }
        }
      }
    } else {
      // Calculate from individual components
      basic = parseFloat(salaryInputs.basicSalary) || 0;
      da = staffType === 'teaching' ? 0 : (parseFloat(salaryInputs.daRate) || 0); // No DA for teaching staff
      hra = parseFloat(salaryInputs.hraRate) || 0;
      ta = parseFloat(salaryInputs.transportAllowance) || 0;
      cla = parseFloat(salaryInputs.claAllowance) || 0;
      medical = parseFloat(salaryInputs.medicalAllowance) || 0;
      others = parseFloat(salaryInputs.otherAllowances) || 0;
      fullMonthSalary = basic + da + hra + ta + cla + medical + others;
    }

    // Daily salary calculation if working days are specified
    const workingDays = parseFloat(salaryInputs.workingDays) || 0;
    const totalMonthDays = parseFloat(salaryInputs.totalMonthDays) || 30; // Default to 30 days

    // Initialize special allowances
    const special = parseFloat(salaryInputs.specialAllowance) || 0;
    const conveyance = parseFloat(salaryInputs.conveyanceAllowance) || 0;

    let adjustedBasic = basic;
    let adjustedDA = da;
    let adjustedHRA = hra;
    let adjustedTA = ta;
    let adjustedCLA = cla;
    let adjustedMedical = medical;
    let adjustedSpecial = special;
    let adjustedConveyance = conveyance;
    let adjustedOthers = others;
    let perDayRate = 0;
    let isProRata = false;

    // If working days are provided, calculate per day salary
    if (workingDays > 0 && totalMonthDays > 0) {
      // Calculate per day rate from full month salary (decided salary or component total)
      perDayRate = fullMonthSalary / totalMonthDays;

      // Calculate proportional salary based on working days
      const dailyMultiplier = workingDays / totalMonthDays;
      adjustedBasic = basic * dailyMultiplier;
      adjustedDA = da * dailyMultiplier;
      adjustedHRA = hra * dailyMultiplier;
      adjustedTA = ta * dailyMultiplier;
      adjustedCLA = cla * dailyMultiplier;
      adjustedMedical = medical * dailyMultiplier;
      adjustedSpecial = special * dailyMultiplier;
      adjustedConveyance = conveyance * dailyMultiplier;
      adjustedOthers = others * dailyMultiplier;

      isProRata = workingDays < totalMonthDays;
    }

    const gross = adjustedBasic + adjustedDA + adjustedHRA + adjustedTA + adjustedCLA + adjustedMedical + adjustedSpecial + adjustedConveyance + adjustedOthers;

    // Deductions (usually proportional to gross salary)
    const tds = parseFloat(salaryInputs.tdsDeduction) || 0;
    const epf = parseFloat(salaryInputs.epfDeduction) || 0; // Use correct field name
    const pt = parseFloat(salaryInputs.professionalTax) || 0;
    const loanDeduction = parseFloat(salaryInputs.loanDeduction) || 0; // Add loan deduction
    const insurance = parseFloat(salaryInputs.insuranceDeduction) || 0; // Add insurance
    const esi = parseFloat(salaryInputs.esiDeduction) || 0; // Add ESI
    const otherDed = parseFloat(salaryInputs.otherDeductions) || 0; // Add other deductions

    // Apply proportional deductions if working partial days
    let adjustedTds = tds;
    let adjustedEpf = epf;
    let adjustedPt = pt;
    let adjustedLoan = loanDeduction;
    let adjustedInsurance = insurance;
    let adjustedEsi = esi;
    let adjustedOtherDed = otherDed;

    if (workingDays > 0 && totalMonthDays > 0 && workingDays < totalMonthDays) {
      const dailyMultiplier = workingDays / totalMonthDays;
      adjustedTds = tds * dailyMultiplier;
      adjustedEpf = epf * dailyMultiplier;
      adjustedPt = pt * dailyMultiplier;
      adjustedLoan = loanDeduction * dailyMultiplier;
      adjustedInsurance = insurance * dailyMultiplier;
      adjustedEsi = esi * dailyMultiplier;
      adjustedOtherDed = otherDed * dailyMultiplier;
    }

    const totalDeductions = adjustedTds + adjustedEpf + adjustedPt + adjustedLoan + adjustedInsurance + adjustedEsi + adjustedOtherDed;
    const netSalary = gross - totalDeductions;

    return {
      basic: adjustedBasic,
      gradePay: 0,
      agp: 0,
      da: adjustedDA,
      hra: adjustedHRA,
      ta: adjustedTA,
      cla: adjustedCLA,
      medical: adjustedMedical,
      special: adjustedSpecial,
      conveyance: adjustedConveyance,
      others: adjustedOthers,
      gross,
      tds: adjustedTds,
      epf: adjustedEpf,
      pt: adjustedPt,
      esi: adjustedEsi,
      loan: adjustedLoan,
      insurance: adjustedInsurance,
      otherDed: adjustedOtherDed,
      totalDeductions,
      netSalary,
      type: 'Actual Salary',
      // Daily calculation details
      fullMonthSalary: fullMonthSalary,
      perDayRate: perDayRate,
      workingDays: workingDays || totalMonthDays,
      totalMonthDays: totalMonthDays,
      dailyRate: workingDays > 0 && totalMonthDays > 0 ? (workingDays / totalMonthDays) : 1,
      isProRata: isProRata
    };
  };

  // Handle salary calculation
  const handleSalaryCalculation = () => {
    // Check if employee is selected
    if (!salaryInputs.employeeName) {
      setError('Please select an employee first');
      return;
    }

    let result;
    if (salaryCalculationType === '6pay') {
      if (staffType === 'teaching') {
        result = calculateTeachingSalary();
      } else {
        result = calculateNonTeachingSalary();
      }
    } else {
      result = calculateActualSalary();
    }
    setCalculatedSalary(result);

    console.log(`Calculated salary for ${salaryInputs.employeeName}:`, result);
  };

  // Save calculated salary to database
  const saveSalaryRecord = async () => {
    if (!calculatedSalary) {
      setError('Please calculate salary first');
      return;
    }

    if (!salaryInputs.employeeName) {
      setError('Please select an employee first');
      return;
    }

    if (!salaryInputs.salaryMonth || !salaryInputs.salaryYear) {
      setError('Please select both month and year for the salary record');
      return;
    }

    try {
      // Use the selected month and year from salaryInputs
      const selectedMonth = parseInt(salaryInputs.salaryMonth);
      const selectedYear = parseInt(salaryInputs.salaryYear);

      const salaryRecord = {
        name: salaryInputs.employeeName, // Using 'name' field to match existing schema
        employeeName: salaryInputs.employeeName,
        salaryType: calculatedSalary.type,
        basicSalary: calculatedSalary.basic,
        agp: calculatedSalary.agp || 0,
        gradePay: calculatedSalary.gradePay || 0,
        allowances: {
          da: calculatedSalary.da,
          hra: calculatedSalary.hra,
          transportAllowance: calculatedSalary.ta,
          claAllowance: calculatedSalary.cla,
          medicalAllowance: calculatedSalary.medical,
          otherAllowances: calculatedSalary.others
        },
        deductions: {
          tds: calculatedSalary.tds,
          epf: calculatedSalary.epf,
          professionalTax: calculatedSalary.pt
        },
        amount: calculatedSalary.gross, // Gross salary as total amount
        grossSalary: calculatedSalary.gross,
        totalDeductions: calculatedSalary.totalDeductions,
        netSalary: calculatedSalary.netSalary,
        month: selectedMonth,
        year: selectedYear,
        status: 'Calculated',
        calculatedOn: new Date().toISOString(),
        hraRate: salaryInputs.city === 'X' ? '15% (Metro)' : salaryInputs.city === 'Y' ? '15% (Non-Metro)' : '15% (Other)',
        city: salaryInputs.city,
        paymentDate: new Date().toISOString().split('T')[0], // Current date as payment date
        // Daily salary calculation details
        dailyCalculation: {
          fullMonthSalary: calculatedSalary.fullMonthSalary || null,
          perDayRate: calculatedSalary.perDayRate || null,
          workingDays: calculatedSalary.workingDays || null,
          totalMonthDays: calculatedSalary.totalMonthDays || null,
          dailyRate: calculatedSalary.dailyRate || 1,
          isProRata: calculatedSalary.isProRata || false
        }
      };

      const response = await fetch('http://localhost:5000/api/faculty/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salaryRecord)
      });

      if (response.ok) {
        alert(`✅ Salary record saved successfully for ${salaryInputs.employeeName}!`);
        await fetchSalaryData(); // Refresh salary data

        // Clear the form
        setSalaryInputs({
          ...salaryInputs,
          basicSalary: '',
          gradePay: '',
          agp: '',
          medicalAllowance: '',
          transportAllowance: '',
          claAllowance: '',
          otherAllowances: '',
          tdsDeduction: '',
          epfDeduction: '',
          professionalTax: '',
          workingDays: '',
          totalMonthDays: ''
        });
        setCalculatedSalary(null);
      } else {
        const errorData = await response.json();
        setError(`Failed to save salary record for ${salaryInputs.employeeName}: ` + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      setError(`Error saving salary record for ${salaryInputs.employeeName}: ` + err.message);
    }
  };

  // Real-time DA calculation for display
  const calculateRealTimeDA = () => {
    const basic = parseFloat(salaryInputs.basicSalary) || 0;
    if (salaryCalculationType === '6pay') {
      if (staffType === 'teaching') {
        const agp = parseFloat(salaryInputs.agp) || 0;
        const basicPlusAGP = basic + agp;
        return (basicPlusAGP * 164) / 100; // 164% DA for Teaching Staff
      } else {
        const grade = parseFloat(salaryInputs.gradePay) || 0;
        const basicPlusGrade = basic + grade;
        return (basicPlusGrade * 90) / 100; // 90% DA for Non-Teaching Staff
      }
    }
    return 0;
  };

  // Real-time HRA calculation for display
  const calculateRealTimeHRA = () => {
    const basic = parseFloat(salaryInputs.basicSalary) || 0;
    if (salaryCalculationType === '6pay') {
      const hraRate = hraRates[salaryInputs.city] || 0.15;
      if (staffType === 'teaching') {
        const agp = parseFloat(salaryInputs.agp) || 0;
        const basicPlusAGP = basic + agp;
        return (basicPlusAGP * hraRate); // 15% HRA
      } else {
        const grade = parseFloat(salaryInputs.gradePay) || 0;
        const basicPlusGrade = basic + grade;
        return (basicPlusGrade * hraRate); // 15% HRA
      }
    }
    return 0;
  };

  // Real-time Professional Tax calculation for display
  const calculateRealTimePT = () => {
    const basic = parseFloat(salaryInputs.basicSalary) || 0;
    if (salaryCalculationType === '6pay') {
      if (staffType === 'teaching') {
        const agp = parseFloat(salaryInputs.agp) || 0;
        const basicPlusAGP = basic + agp;
        const da = (basicPlusAGP * 164) / 100;
        const hra = calculateRealTimeHRA();
        const ta = parseFloat(salaryInputs.transportAllowance) || 0;
        const cla = parseFloat(salaryInputs.claAllowance) || 0;
        const medical = parseFloat(salaryInputs.medicalAllowance) || 0;
        const others = parseFloat(salaryInputs.otherAllowances) || 0;
        const gross = basicPlusAGP + da + hra + ta + cla + medical + others;
        return calculateProfessionalTax(gross);
      } else {
        const grade = parseFloat(salaryInputs.gradePay) || 0;
        const basicPlusGrade = basic + grade;
        const da = (basicPlusGrade * 90) / 100; // 90% DA for Non-Teaching Staff
        const hra = calculateRealTimeHRA();
        const ta = parseFloat(salaryInputs.transportAllowance) || 800;
        const cla = parseFloat(salaryInputs.claAllowance) || 120;
        const medical = parseFloat(salaryInputs.medicalAllowance) || 0;
        const others = parseFloat(salaryInputs.otherAllowances) || 0;
        const gross = basicPlusGrade + da + hra + ta + cla + medical + others;
        return calculateProfessionalTax(gross);
      }
    }
    return 0;
  };

  useEffect(() => {
    fetchSalaryData();
    fetchSalaryHistory();
  }, []);

  // Fetch salary history for history section
  const fetchSalaryHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch('http://localhost:5000/api/faculty/salary');
      if (response.ok) {
        const data = await response.json();
        // Sort by most recent first
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.calculatedOn || a.paymentDate);
          const dateB = new Date(b.calculatedOn || b.paymentDate);
          return dateB - dateA;
        });
        setSalaryHistory(sortedData);
      } else {
        console.error('Failed to fetch salary history');
      }
    } catch (err) {
      console.error('Error fetching salary history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Filter salary history based on filters
  const getFilteredHistory = () => {
    return salaryHistory.filter(record => {
      const matchesEmployee = !historyFilters.employeeName || 
        (record.employeeName || record.name || '').toLowerCase().includes(historyFilters.employeeName.toLowerCase());
      const matchesMonth = !historyFilters.month || record.month == historyFilters.month;
      const matchesYear = !historyFilters.year || record.year == historyFilters.year;
      const matchesStatus = !historyFilters.status || record.status === historyFilters.status;
      const matchesType = !historyFilters.salaryType || record.salaryType === historyFilters.salaryType;
      
      return matchesEmployee && matchesMonth && matchesYear && matchesStatus && matchesType;
    });
  };

  // Generate salary slip from history record
  const generateSlipFromHistory = async (record) => {
    try {
      setGeneratingSlip(true);
      
      // Fetch faculty data for the employee
      const facultyRes = await fetch('http://localhost:5000/api/faculty');
      if (!facultyRes.ok) {
        throw new Error('Failed to fetch faculty data');
      }
      const facultyData = await facultyRes.json();
      
      // Find faculty member
      const employeeName = record.employeeName || record.name;
      let facultyMember = facultyData.find(f => f.personalInfo?.fullName === employeeName);
      
      if (!facultyMember) {
        facultyMember = facultyData.find(f => f.fullName === employeeName);
      }
      
      if (!facultyMember) {
        facultyMember = facultyData.find(f => {
          const firstName = f.personalInfo?.firstName || f.firstName || '';
          const lastName = f.personalInfo?.lastName || f.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          return fullName === employeeName;
        });
      }

      if (!facultyMember) {
        setError(`Faculty member "${employeeName}" not found`);
        return;
      }

      // Create salary slip object
      const slip = {
        faculty: facultyMember,
        month: months.find(m => m.value === parseInt(record.month))?.label,
        year: record.year,
        basicSalary: parseFloat(record.basicSalary || 0),
        allowances: {
          hra: parseFloat(record.allowances?.hra || 0),
          da: parseFloat(record.allowances?.da || 0),
          medical: parseFloat(record.allowances?.medicalAllowance || 0),
          transport: parseFloat(record.allowances?.transportAllowance || 0),
          cla: parseFloat(record.allowances?.claAllowance || 0),
          others: parseFloat(record.allowances?.otherAllowances || 0)
        },
        deductions: {
          pf: parseFloat(record.deductions?.epf || record.deductions?.pf || 0),
          esi: parseFloat(record.deductions?.esi || 0),
          professionalTax: parseFloat(record.deductions?.professionalTax || 0),
          tds: parseFloat(record.deductions?.tds || 0),
          incomeTax: parseFloat(record.deductions?.incomeTax || 0),
          others: parseFloat(record.deductions?.otherDeductions || 0)
        },
        grossSalary: parseFloat(record.grossSalary || record.amount || 0),
        totalDeductions: parseFloat(record.totalDeductions || 0),
        netSalary: parseFloat(record.netSalary || 0),
        salaryStatus: record.status || 'Calculated',
        paymentId: record._id,
        paymentDate: record.paymentDate,
        generatedOn: new Date().toLocaleDateString(),
        salaryType: record.salaryType || 'Calculated Salary',
        hraRate: record.hraRate || '15%',
        city: record.city || 'N/A'
      };

      // Auto-print the salary slip
      printSalarySlipAuto(slip);
      
    } catch (err) {
      setError('Failed to generate salary slip: ' + err.message);
    } finally {
      setGeneratingSlip(false);
    }
  };

  // Generate different types of reports
  const generateReport = (reportType = 'summary') => {
    const recordsToReport = selectedRecords.length > 0 ? 
      salaryHistory.filter(record => selectedRecords.includes(record._id)) : 
      getFilteredHistory();

    if (recordsToReport.length === 0) {
      setError('No records selected for report');
      return;
    }

    let reportContent = '';

    if (reportType === 'detailed') {
      reportContent = generateDetailedReport(recordsToReport);
    } else if (reportType === 'summary') {
      reportContent = generateSummaryReport(recordsToReport);
    } else if (reportType === 'monthly') {
      reportContent = generateMonthlyReport(recordsToReport);
    }

    const reportWindow = window.open('', '_blank');
    reportWindow.document.write(reportContent);
    reportWindow.document.close();
  };

  // Generate Summary Report
  const generateSummaryReport = (records) => {
    const totalGross = records.reduce((sum, r) => sum + (parseFloat(r.grossSalary || r.amount || 0)), 0);
    const totalDeductions = records.reduce((sum, r) => sum + (parseFloat(r.totalDeductions || 0)), 0);
    const totalNet = records.reduce((sum, r) => sum + (parseFloat(r.netSalary || 0)), 0);
    const paidRecords = records.filter(r => r.status === 'Paid').length;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary Summary Report - NIETM</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; color: #333; background: #f8f9fa; }
            .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; }
            .institute-header { margin: 15px 0; }
            .society { font-size: 14px; color: #666; text-transform: lowercase; margin-bottom: 5px; }
            .institute-header h1 { color: #1e3a8a; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 2px; }
            .institute-name { font-size: 18px; color: #333; font-weight: 600; margin: 5px 0; }
            .affiliation { font-size: 13px; color: #666; margin: 5px 0; }
            .address { font-size: 13px; color: #666; margin: 5px 0; }
            .contact { font-size: 12px; color: #666; margin: 10px 0; }
            .report-title { font-size: 24px; color: #1e3a8a; font-weight: bold; margin: 20px 0 10px; }
            .subtitle { color: #666; margin: 10px 0; font-size: 16px; }
            .logo { width: 80px; height: 80px; margin: 0 auto 15px; background: #1e3a8a; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
            .summary-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 25px; border-radius: 10px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
            .summary-card.green { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
            .summary-card.red { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
            .summary-card.purple { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; }
            .summary-value { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
            .summary-label { font-size: 14px; opacity: 0.9; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e1e5e9; padding: 12px 8px; text-align: left; font-size: 14px; }
            th { background: #1e3a8a; color: white; font-weight: 600; text-transform: uppercase; font-size: 12px; }
            tr:nth-child(even) { background: #f8f9fa; }
            tr:hover { background: #e3f2fd; }
            .amount { text-align: right; font-weight: 600; color: #1e3a8a; }
            .status { text-align: center; }
            .status-paid { background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 15px; font-size: 12px; font-weight: bold; }
            .status-calculated { background: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 15px; font-size: 12px; font-weight: bold; }
            .status-pending { background: #f8d7da; color: #721c24; padding: 4px 8px; border-radius: 15px; font-size: 12px; font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #dee2e6; padding-top: 20px; }
            .department-stats { margin: 30px 0; }
            .filters-applied { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            @media print { 
              body { background: white; } 
              .container { box-shadow: none; } 
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">NIETM</div>
              <div class="institute-header">
                <div class="society">maitrey education society</div>
                <h1>NAGARJUNA</h1>
                <div class="institute-name">Institute of Engineering, Technology & Management</div>
                <div class="affiliation">(AICTE, DTE Approved & Affiliated to R.T.M. Nagpur University, Nagpur)</div>
                <div class="address">Village Satnavri, Amravati Road, Nagpur 440023</div>
                <div class="contact">Email: maitrey.ngp@gmail.com | Website: www.nietm.in | Phone: 07118 322211, 12</div>
              </div>
              <div class="report-title">Salary Summary Report</div>
              <div class="subtitle">Report Period: ${new Date().toLocaleDateString()} | Records: ${records.length}</div>
            </div>

            ${historyFilters.employeeName || historyFilters.month || historyFilters.year || historyFilters.status || historyFilters.salaryType ? `
            <div class="filters-applied">
              <strong>Filters Applied:</strong>
              ${historyFilters.employeeName ? `Employee: ${historyFilters.employeeName} | ` : ''}
              ${historyFilters.month ? `Month: ${months.find(m => m.value == historyFilters.month)?.label} | ` : ''}
              ${historyFilters.year ? `Year: ${historyFilters.year} | ` : ''}
              ${historyFilters.status ? `Status: ${historyFilters.status} | ` : ''}
              ${historyFilters.salaryType ? `Type: ${historyFilters.salaryType}` : ''}
            </div>
            ` : ''}

            <div class="summary-grid">
              <div class="summary-card">
                <div class="summary-value">₹${totalGross.toLocaleString()}</div>
                <div class="summary-label">Total Gross Salary</div>
              </div>
              <div class="summary-card green">
                <div class="summary-value">₹${totalNet.toLocaleString()}</div>
                <div class="summary-label">Total Net Salary</div>
              </div>
              <div class="summary-card red">
                <div class="summary-value">₹${totalDeductions.toLocaleString()}</div>
                <div class="summary-label">Total Deductions</div>
              </div>
              <div class="summary-card purple">
                <div class="summary-value">${paidRecords}/${records.length}</div>
                <div class="summary-label">Paid Records</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Month/Year</th>
                  <th>Salary Type</th>
                  <th>Basic Salary</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${records.map(record => `
                  <tr>
                    <td style="font-weight: 600;">${record.employeeName || record.name || 'N/A'}</td>
                    <td>${months.find(m => m.value === parseInt(record.month))?.label || record.month}/${record.year}</td>
                    <td>${record.salaryType || 'Calculated Salary'}</td>
                    <td class="amount">₹${(parseFloat(record.basicSalary || 0)).toLocaleString()}</td>
                    <td class="amount">₹${(parseFloat(record.grossSalary || record.amount || 0)).toLocaleString()}</td>
                    <td class="amount">₹${(parseFloat(record.totalDeductions || 0)).toLocaleString()}</td>
                    <td class="amount" style="font-weight: bold;">₹${(parseFloat(record.netSalary || 0)).toLocaleString()}</td>
                    <td class="status">
                      <span class="status-${record.status?.toLowerCase() || 'calculated'}">${record.status || 'Calculated'}</span>
                    </td>
                    <td style="text-align: center;">${new Date(record.calculatedOn || record.paymentDate).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p><strong>Generated by NIETM HR Management System</strong></p>
              <p>Report generated on ${new Date().toLocaleString()} | Total Amount: ₹${totalNet.toLocaleString()}</p>
              <p>This is a computer-generated report and does not require a signature</p>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `;
  };

  // Generate Detailed Report
  const generateDetailedReport = (records) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Detailed Salary Report - NIETM</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 15px; color: #333; }
            .container { max-width: 1400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; }
            .institute-header { margin: 15px 0; }
            .society { font-size: 12px; color: #666; text-transform: lowercase; margin-bottom: 3px; }
            .institute-header h1 { color: #1e3a8a; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px; }
            .institute-name { font-size: 16px; color: #333; font-weight: 600; margin: 3px 0; }
            .affiliation { font-size: 11px; color: #666; margin: 3px 0; }
            .address { font-size: 11px; color: #666; margin: 3px 0; }
            .contact { font-size: 10px; color: #666; margin: 8px 0; }
            .report-title { font-size: 20px; color: #1e3a8a; font-weight: bold; margin: 15px 0 5px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 8px 6px; text-align: left; }
            th { background: #1e3a8a; color: white; font-weight: 600; }
            tr:nth-child(even) { background: #f9f9f9; }
            .amount { text-align: right; font-weight: 600; }
            .breakdown { background: #f8f9fa; padding: 4px; border-radius: 4px; }
            @media print { @page { margin: 0.5cm; size: A4 landscape; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="institute-header">
                <div class="society">maitrey education society</div>
                <h1>NAGARJUNA</h1>
                <div class="institute-name">Institute of Engineering, Technology & Management</div>
                <div class="affiliation">(AICTE, DTE Approved & Affiliated to R.T.M. Nagpur University, Nagpur)</div>
                <div class="address">Village Satnavri, Amravati Road, Nagpur 440023</div>
                <div class="contact">Email: maitrey.ngp@gmail.com | Website: www.nietm.in | Phone: 07118 322211, 12</div>
              </div>
              <div class="report-title">Detailed Salary Report</div>
              <p>Generated on: ${new Date().toLocaleString()} | Records: ${records.length}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Month/Year</th>
                  <th>Basic</th>
                  <th>HRA</th>
                  <th>DA</th>
                  <th>Medical</th>
                  <th>Transport</th>
                  <th>Others</th>
                  <th>Gross</th>
                  <th>PF</th>
                  <th>ESI</th>
                  <th>PT</th>
                  <th>TDS</th>
                  <th>Other Ded</th>
                  <th>Total Ded</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${records.map(record => `
                  <tr>
                    <td style="font-weight: 600; min-width: 120px;">${record.employeeName || record.name || 'N/A'}</td>
                    <td>${months.find(m => m.value === parseInt(record.month))?.label || record.month}/${record.year}</td>
                    <td class="amount">₹${(parseFloat(record.basicSalary || 0)).toLocaleString()}</td>
                    <td class="amount">₹${(parseFloat(record.allowances?.hra || 0)).toLocaleString()}</td>
                    <td class="amount">₹${(parseFloat(record.allowances?.da || 0)).toLocaleString()}</td>
                    <td class="amount">₹${(parseFloat(record.allowances?.medicalAllowance || 0)).toLocaleString()}</td>
                    <td class="amount">₹${(parseFloat(record.allowances?.transportAllowance || 0)).toLocaleString()}</td>
                    <td class="amount">₹${(parseFloat(record.allowances?.otherAllowances || 0)).toLocaleString()}</td>
                    <td class="amount" style="background: #e3f2fd; font-weight: bold;">₹${(parseFloat(record.grossSalary || record.amount || 0)).toLocaleString()}</td>
                    <td class="amount">₹${(parseFloat(record.deductions?.epf || record.deductions?.pf || 0)).toLocaleString()}</td>
                    <td class="amount">₹${(parseFloat(record.deductions?.esi || 0)).toLocaleString()}</td>
                    <td class="amount">₹${(parseFloat(record.deductions?.professionalTax || 0)).toLocaleString()}</td>
                    <td class="amount">₹${(parseFloat(record.deductions?.tds || 0)).toLocaleString()}</td>
                    <td class="amount">₹${(parseFloat(record.deductions?.otherDeductions || 0)).toLocaleString()}</td>
                    <td class="amount" style="background: #ffebee;">₹${(parseFloat(record.totalDeductions || 0)).toLocaleString()}</td>
                    <td class="amount" style="background: #e8f5e8; font-weight: bold;">₹${(parseFloat(record.netSalary || 0)).toLocaleString()}</td>
                    <td style="text-align: center;">${record.status || 'Calculated'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `;
  };

  // Generate Monthly Report
  const generateMonthlyReport = (records) => {
    const monthlyData = {};
    records.forEach(record => {
      const monthYear = `${months.find(m => m.value === parseInt(record.month))?.label || record.month} ${record.year}`;
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          count: 0,
          totalGross: 0,
          totalNet: 0,
          totalDeductions: 0,
          records: []
        };
      }
      monthlyData[monthYear].count++;
      monthlyData[monthYear].totalGross += parseFloat(record.grossSalary || record.amount || 0);
      monthlyData[monthYear].totalNet += parseFloat(record.netSalary || 0);
      monthlyData[monthYear].totalDeductions += parseFloat(record.totalDeductions || 0);
      monthlyData[monthYear].records.push(record);
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Monthly Salary Report - NIETM</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; }
            .institute-header { margin: 15px 0; }
            .society { font-size: 14px; color: #666; text-transform: lowercase; margin-bottom: 5px; }
            .institute-header h1 { color: #1e3a8a; margin: 0; font-size: 30px; font-weight: bold; letter-spacing: 1px; }
            .institute-name { font-size: 17px; color: #333; font-weight: 600; margin: 5px 0; }
            .affiliation { font-size: 12px; color: #666; margin: 5px 0; }
            .address { font-size: 12px; color: #666; margin: 5px 0; }
            .contact { font-size: 11px; color: #666; margin: 10px 0; }
            .report-title { font-size: 22px; color: #1e3a8a; font-weight: bold; margin: 20px 0 10px; }
            .month-section { margin-bottom: 40px; page-break-inside: avoid; }
            .month-header { background: #1e3a8a; color: white; padding: 15px; border-radius: 8px 8px 0 0; }
            .month-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; padding: 20px; background: #f8f9fa; }
            .summary-item { text-align: center; }
            .summary-value { font-size: 24px; font-weight: bold; color: #1e3a8a; }
            .summary-label { font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 0; }
            th, td { border: 1px solid #ddd; padding: 10px 8px; text-align: left; font-size: 12px; }
            th { background: #f1f3f4; color: #333; }
            .amount { text-align: right; font-weight: 600; }
            @media print { .month-section { page-break-after: always; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="institute-header">
              <div class="society">maitrey education society</div>
              <h1>NAGARJUNA</h1>
              <div class="institute-name">Institute of Engineering, Technology & Management</div>
              <div class="affiliation">(AICTE, DTE Approved & Affiliated to R.T.M. Nagpur University, Nagpur)</div>
              <div class="address">Village Satnavri, Amravati Road, Nagpur 440023</div>
              <div class="contact">Email: maitrey.ngp@gmail.com | Website: www.nietm.in | Phone: 07118 322211, 12</div>
            </div>
            <div class="report-title">Monthly Salary Report</div>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>

          ${Object.keys(monthlyData).map(monthYear => `
            <div class="month-section">
              <div class="month-header">
                <h2 style="margin: 0;">${monthYear}</h2>
              </div>
              
              <div class="month-summary">
                <div class="summary-item">
                  <div class="summary-value">${monthlyData[monthYear].count}</div>
                  <div class="summary-label">Total Records</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">₹${monthlyData[monthYear].totalGross.toLocaleString()}</div>
                  <div class="summary-label">Total Gross</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">₹${monthlyData[monthYear].totalDeductions.toLocaleString()}</div>
                  <div class="summary-label">Total Deductions</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value">₹${monthlyData[monthYear].totalNet.toLocaleString()}</div>
                  <div class="summary-label">Total Net</div>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Salary Type</th>
                    <th>Basic Salary</th>
                    <th>Gross Salary</th>
                    <th>Total Deductions</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${monthlyData[monthYear].records.map(record => `
                    <tr>
                      <td style="font-weight: 600;">${record.employeeName || record.name || 'N/A'}</td>
                      <td>${record.salaryType || 'Calculated Salary'}</td>
                      <td class="amount">₹${(parseFloat(record.basicSalary || 0)).toLocaleString()}</td>
                      <td class="amount">₹${(parseFloat(record.grossSalary || record.amount || 0)).toLocaleString()}</td>
                      <td class="amount">₹${(parseFloat(record.totalDeductions || 0)).toLocaleString()}</td>
                      <td class="amount" style="font-weight: bold;">₹${(parseFloat(record.netSalary || 0)).toLocaleString()}</td>
                      <td style="text-align: center;">${record.status || 'Calculated'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `).join('')}

          <script>
            window.onload = function() {
              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `;
  };

  const fetchSalaryData = async () => {
    try {
      // Always fetch faculty data first to get all available employees
      console.log('Fetching faculty data...');
      const facultyResponse = await fetch('http://localhost:5000/api/faculty');
      let allEmployees = [];
      
      if (facultyResponse.ok) {
        const facultyData = await facultyResponse.json();
        console.log('Faculty data fetched:', facultyData.length, 'records');
        console.log('Sample faculty record:', facultyData[0]); // Debug log
        
        // Create full name from personalInfo structure
        allEmployees = facultyData.map(faculty => {
          // Try multiple approaches to get name
          let fullName = '';
          
          // Approach 1: Use personalInfo.fullName if available
          if (faculty.personalInfo?.fullName) {
            fullName = faculty.personalInfo.fullName;
          }
          // Approach 2: Use direct fullName if available
          else if (faculty.fullName) {
            fullName = faculty.fullName;
          }
          // Approach 3: Construct from personalInfo fields
          else if (faculty.personalInfo) {
            const firstName = faculty.personalInfo.firstName || '';
            const middleName = faculty.personalInfo.middleName || '';
            const lastName = faculty.personalInfo.lastName || '';

            // Create full name, handling empty middle name
            fullName = firstName;
            if (middleName && middleName.trim()) {
              fullName += ' ' + middleName;
            }
            if (lastName && lastName.trim()) {
              fullName += ' ' + lastName;
            }
            fullName = fullName.trim();
          }
          // Approach 4: Construct from direct fields (fallback)
          else {
            const firstName = faculty.firstName || '';
            const middleName = faculty.middleName || '';
            const lastName = faculty.lastName || '';

            fullName = firstName;
            if (middleName && middleName.trim()) {
              fullName += ' ' + middleName;
            }
            if (lastName && lastName.trim()) {
              fullName += ' ' + lastName;
            }
            fullName = fullName.trim();
          }

          return fullName;
        }).filter(name => name && name.length > 0);
        
        console.log('Extracted faculty names:', allEmployees);
      }

      // Now fetch salary data
      console.log('Fetching salary data...');
      const response = await fetch('http://localhost:5000/api/faculty/salary');
      if (response.ok) {
        const data = await response.json();
        setSalaryData(data);

        // Use employeeName field if available, fallback to name
        const salaryEmployees = [...new Set(data.map(salary => salary.employeeName || salary.name))];
        console.log('Salary employees:', salaryEmployees);
        
        // Combine both faculty and salary employees (unique)
        const allUniqueEmployees = [...new Set([...allEmployees, ...salaryEmployees])];
        setAvailableEmployees(allUniqueEmployees);
        console.log('Combined employee data loaded:', allUniqueEmployees.length, 'employees available');
        console.log('Available employee names:', allUniqueEmployees);
      } else {
        console.error('Failed to fetch salary data, using faculty data only');
        // Use faculty data only if salary fetch fails
        setAvailableEmployees(allEmployees);
        console.log('Faculty data loaded (salary fetch failed):', allEmployees.length, 'employees available');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      // Try to fetch faculty data as ultimate fallback
      try {
        const facultyResponse = await fetch('http://localhost:5000/api/faculty');
        if (facultyResponse.ok) {
          const facultyData = await facultyResponse.json();
          console.log('Faculty data fetched as ultimate fallback:', facultyData.length, 'records');
          
          const fallbackEmployees = facultyData.map(faculty => {
            if (faculty.personalInfo?.fullName) {
              return faculty.personalInfo.fullName;
            } else if (faculty.fullName) {
              return faculty.fullName;
            } else {
              const firstName = faculty.personalInfo?.firstName || faculty.firstName || '';
              const lastName = faculty.personalInfo?.lastName || faculty.lastName || '';
              return `${firstName} ${lastName}`.trim();
            }
          }).filter(name => name && name.length > 0);

          setAvailableEmployees(fallbackEmployees);
          console.log('Ultimate fallback loaded:', fallbackEmployees.length, 'employees available');
        }
      } catch (fallbackErr) {
        console.error('Ultimate fallback failed:', fallbackErr);
        setAvailableEmployees([]);
      }
    }
  };

  // Salary Slip Functions
  const generateSalarySlip = async () => {
    if (!salarySlipEmployee || !salarySlipMonth || !salarySlipYear) {
      setError('Please select employee, month, and year for salary slip');
      return;
    }

    try {
      setGeneratingSlip(true);
      setError('');

      console.log('Generating salary slip for:', {
        employee: salarySlipEmployee,
        month: salarySlipMonth,
        year: salarySlipYear
      });

      // Find selected employee details
      const selectedFacultyName = salarySlipEmployee;

      // Fetch faculty data
      console.log('Fetching faculty data...');
      const facultyRes = await fetch('http://localhost:5000/api/faculty');
      if (!facultyRes.ok) {
        throw new Error(`Faculty API failed: ${facultyRes.status}`);
      }
      const facultyData = await facultyRes.json();
      console.log('Faculty data fetched:', facultyData.length, 'records');
      
      // Find faculty member - try multiple approaches
      console.log('Available faculty names:');
      facultyData.forEach((f, index) => {
        const fullName1 = f.personalInfo?.fullName;
        const fullName2 = f.fullName;
        const firstName = f.personalInfo?.firstName || f.firstName;
        const lastName = f.personalInfo?.lastName || f.lastName;
        console.log(`Faculty ${index}:`, { fullName1, fullName2, firstName, lastName });
      });

      let facultyMember = facultyData.find(f => f.personalInfo?.fullName === selectedFacultyName);
      
      // Try alternative matching if first attempt fails
      if (!facultyMember) {
        facultyMember = facultyData.find(f => f.fullName === selectedFacultyName);
      }
      
      // Try creating name from firstName + lastName
      if (!facultyMember) {
        facultyMember = facultyData.find(f => {
          const firstName = f.personalInfo?.firstName || f.firstName || '';
          const lastName = f.personalInfo?.lastName || f.lastName || '';
          const fullName = `${firstName} ${lastName}`.trim();
          return fullName === selectedFacultyName;
        });
      }

      if (!facultyMember) {
        const availableNames = facultyData.map(f => 
          f.personalInfo?.fullName || f.fullName || 
          `${f.personalInfo?.firstName || f.firstName || ''} ${f.personalInfo?.lastName || f.lastName || ''}`.trim()
        ).filter(name => name);
        
        setError(`Faculty member "${selectedFacultyName}" not found in database. 

Available faculty members: 
${availableNames.join('\n')}

Please make sure the employee name exactly matches one of the above names.`);
        return;
      }
      console.log('Faculty member found:', facultyMember);

      // Fetch salary records from our calculator saved data - include year in query
      console.log('Fetching salary records...');
      const salaryUrl = `http://localhost:5000/api/faculty/salary?name=${encodeURIComponent(selectedFacultyName)}&month=${salarySlipMonth}&year=${salarySlipYear}`;
      console.log('Salary API URL:', salaryUrl);
      
      const salaryRes = await fetch(salaryUrl);
      if (!salaryRes.ok) {
        throw new Error(`Failed to fetch salary records: ${salaryRes.status} - ${salaryRes.statusText}`);
      }
      const salaryRecords = await salaryRes.json();
      console.log('Salary records fetched:', salaryRecords);

      // Find salary record for the specific month and year
      const salaryRecord = salaryRecords.find(record => {
        const recordMonth = parseInt(record.month);
        const recordYear = parseInt(record.year);
        return recordMonth === parseInt(salarySlipMonth) && recordYear === parseInt(salarySlipYear);
      });

      if (!salaryRecord) {
        const availableRecords = salaryRecords.map(r => `${months.find(m => m.value === parseInt(r.month))?.label} ${r.year}`).join(', ');
        setError(`No salary record found for ${selectedFacultyName} in ${months.find(m => m.value === parseInt(salarySlipMonth))?.label} ${salarySlipYear}. 

Available records: ${availableRecords || 'None'}

Please:
1. Go to "Actual Salary" tab above
2. Fill in employee details and salary information  
3. Click "Calculate Salary"
4. Click "Save Salary Record"
5. Then try generating salary slip again`);
        return;
      }
      console.log('Salary record found:', salaryRecord);

      // Fetch income tax data for the employee
      const incomeTaxRes = await fetch(`http://localhost:5000/api/income-tax?employeeName=${encodeURIComponent(selectedFacultyName)}`);
      let incomeTaxData = null;
      let monthlyIncomeTax = 0;

      if (incomeTaxRes.ok) {
        const incomeTaxRecords = await incomeTaxRes.json();
        if (Array.isArray(incomeTaxRecords) && incomeTaxRecords.length > 0) {
          // Get the most recent record
          incomeTaxData = incomeTaxRecords.sort((a, b) => {
            const yearA = parseInt(a.financialYear.split('-')[0]);
            const yearB = parseInt(b.financialYear.split('-')[0]);
            return yearB - yearA;
          })[0];

          // Calculate monthly income tax
          const annualTax = parseFloat(incomeTaxData.taxLiability || incomeTaxData.totalTax || 0);
          monthlyIncomeTax = parseFloat((annualTax / 12).toFixed(2));
        }
      }

      // Use saved salary record data from calculator
      const basicSalary = parseFloat(salaryRecord.basicSalary || 0);
      const allowances = salaryRecord.allowances || {};
      const deductions = salaryRecord.deductions || {};

      // Calculate allowances from saved calculator data
      const hraAmount = parseFloat(allowances.hra || 0);
      const daAmount = parseFloat(allowances.da || 0);
      const medicalAmount = parseFloat(allowances.medicalAllowance || 0);
      const transportAmount = parseFloat(allowances.transportAllowance || 0);
      const claAmount = parseFloat(allowances.claAllowance || 0);
      const otherAllowancesAmount = parseFloat(allowances.otherAllowances || 0);
      const totalAllowances = hraAmount + daAmount + medicalAmount + transportAmount + claAmount + otherAllowancesAmount;

      // Use saved gross salary from calculator
      const grossSalary = parseFloat(salaryRecord.grossSalary || salaryRecord.amount || 0);

      // Calculate deductions from saved calculator data
      const pfAmount = parseFloat(deductions.epf || deductions.pf || 0);
      const esiAmount = parseFloat(deductions.esi || 0);
      const professionalTaxAmount = parseFloat(deductions.professionalTax || 0);
      const tdsAmount = parseFloat(deductions.tds || 0);
      const incomeTaxAmount = parseFloat(deductions.incomeTax || monthlyIncomeTax || 0);
      const otherDeductionsAmount = parseFloat(deductions.otherDeductions || 0);

      // Use saved total deductions and net salary from calculator
      const totalDeductions = parseFloat(salaryRecord.totalDeductions || 0);
      const netSalary = parseFloat(salaryRecord.netSalary || 0);

      // Create salary slip object with saved calculator data
      const slip = {
        faculty: facultyMember,
        month: months.find(m => m.value === parseInt(salarySlipMonth))?.label,
        year: salarySlipYear,
        basicSalary: basicSalary,
        allowances: {
          hra: hraAmount,
          da: daAmount,
          medical: medicalAmount,
          transport: transportAmount,
          cla: claAmount,
          others: otherAllowancesAmount
        },
        deductions: {
          pf: pfAmount,
          esi: esiAmount,
          professionalTax: professionalTaxAmount,
          tds: tdsAmount,
          incomeTax: incomeTaxAmount,
          others: otherDeductionsAmount
        },
        totalAllowances: totalAllowances,
        grossSalary: grossSalary,
        totalDeductions: totalDeductions,
        netSalary: netSalary,
        salaryStatus: salaryRecord.status || 'Calculated',
        paymentId: salaryRecord._id,
        paymentDate: salaryRecord.paymentDate,
        generatedOn: new Date().toLocaleDateString(),
        salaryType: salaryRecord.salaryType || 'Calculated Salary',
        hraRate: salaryRecord.hraRate || '15%',
        city: salaryRecord.city || 'N/A',
        incomeTaxData: incomeTaxData,
        // Complete income tax details for display in salary slip
        taxDetails: incomeTaxData ? {
          employeeId: incomeTaxData.employeeId,
          panNumber: incomeTaxData.panNumber,
          financialYear: incomeTaxData.financialYear,
          assessmentYear: incomeTaxData.assessmentYear,
          incomeBreakdown: {
            basicSalary: parseFloat(incomeTaxData.basicSalary || 0),
            hra: parseFloat(incomeTaxData.hra || 0),
            allowances: parseFloat(incomeTaxData.allowances || 0),
            bonuses: parseFloat(incomeTaxData.bonuses || 0),
            otherIncome: parseFloat(incomeTaxData.otherIncome || 0),
            grossIncome: parseFloat(incomeTaxData.grossIncome || 0)
          },
          deductions: {
            ppf: parseFloat(incomeTaxData.ppf || 0),
            elss: parseFloat(incomeTaxData.elss || 0),
            lifeInsurance: parseFloat(incomeTaxData.lifeInsurance || 0),
            housingLoan: parseFloat(incomeTaxData.housingLoan || 0),
            tuitionFees: parseFloat(incomeTaxData.tuitionFees || 0),
            totalSection80C: parseFloat(incomeTaxData.totalSection80C || 0),
            section80D: parseFloat(incomeTaxData.section80D || 0),
            section80G: parseFloat(incomeTaxData.section80G || 0),
            section24: parseFloat(incomeTaxData.section24 || 0),
            professionalTax: parseFloat(incomeTaxData.professionalTax || 0),
            employerPF: parseFloat(incomeTaxData.employerPF || 0)
          },
          taxCalculation: {
            taxableIncome: parseFloat(incomeTaxData.taxableIncome || 0),
            totalTax: parseFloat(incomeTaxData.totalTax || incomeTaxData.taxLiability || 0),
            tdsDeducted: parseFloat(incomeTaxData.tdsDeducted || 0),
            refundDue: parseFloat(incomeTaxData.refundDue || 0),
            taxLiability: parseFloat(incomeTaxData.taxLiability || 0)
          },
          complianceStatus: incomeTaxData.complianceStatus || 'N/A',
          notes: incomeTaxData.notes || '',
          remarks: incomeTaxData.remarks || ''
        } : null
      };

      setSalarySlip(slip);
      
      // Auto-print the salary slip in a new window
      setTimeout(() => {
        printSalarySlipAuto(slip);
      }, 500); // Small delay to ensure state is updated
      
    } catch (err) {
      setError('Failed to generate salary slip: ' + err.message);
      setSalarySlip(null);
    } finally {
      setGeneratingSlip(false);
    }
  };

  // Auto-print function that doesn't depend on state
  const printSalarySlipAuto = (slip) => {
    if (!slip) return;

    // Get faculty name safely
    let facultyName = 'Unknown Employee';
    if (slip.faculty) {
      if (slip.faculty.personalInfo?.fullName) {
        facultyName = slip.faculty.personalInfo.fullName;
      } else if (slip.faculty.firstName || slip.faculty.lastName) {
        const firstName = slip.faculty.firstName || '';
        const lastName = slip.faculty.lastName || '';
        facultyName = `${firstName} ${lastName}`.trim();
      } else if (slip.faculty.fullName) {
        facultyName = slip.faculty.fullName;
      }
    }

    // Get employee details safely
    const employeeId = slip.faculty?.personalInfo?.employeeId || slip.faculty?.employeeId || 'N/A';
    const department = slip.faculty?.personalInfo?.department || slip.faculty?.department || 'N/A';
    const designation = slip.faculty?.personalInfo?.designation || slip.faculty?.employmentInfo?.designation || 'N/A';
    const joiningDate = slip.faculty?.personalInfo?.joiningDate || slip.faculty?.employmentInfo?.joiningDate || 'N/A';

    // Helper function to convert number to words (simplified)
    const numberToWords = (num) => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      const thousands = ['', 'Thousand', 'Lakh', 'Crore'];

      if (num === 0) return 'Zero';
      
      let numStr = num.toString();
      let result = '';
      let groupIndex = 0;
      
      while (numStr.length > 0) {
        let group = '';
        if (numStr.length >= 3) {
          group = numStr.slice(-3);
          numStr = numStr.slice(0, -3);
        } else {
          group = numStr;
          numStr = '';
        }
        
        if (parseInt(group) !== 0) {
          let groupWords = '';
          let groupNum = parseInt(group);
          
          if (groupNum >= 100) {
            groupWords += ones[Math.floor(groupNum / 100)] + ' Hundred ';
            groupNum %= 100;
          }
          
          if (groupNum >= 20) {
            groupWords += tens[Math.floor(groupNum / 10)] + ' ';
            groupNum %= 10;
          } else if (groupNum >= 10) {
            groupWords += teens[groupNum - 10] + ' ';
            groupNum = 0;
          }
          
          if (groupNum > 0) {
            groupWords += ones[groupNum] + ' ';
          }
          
          result = groupWords + thousands[groupIndex] + ' ' + result;
        }
        
        groupIndex++;
      }
      
      return result.trim();
    };

    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary Slip - ${facultyName}</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #ffffff;
              line-height: 1.4;
              color: #333;
            }
            .slip-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 2px solid #ddd;
              padding: 0;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: #f8f9fa;
              color: #333;
              padding: 20px;
              text-align: center;
              border-bottom: 1px solid #e9ecef;
            }
            .header-strip {
              height: 6px;
              background: linear-gradient(90deg, #007bff, #28a745, #ffc107, #dc3545);
            }
            .institute-header {
              padding: 20px;
              background: #f8f9fa;
              color: #333;
              border-bottom: 2px solid #dee2e6;
              position: relative;
            }
            .institute-info {
              display: flex;
              align-items: center;
              gap: 20px;
              justify-content: space-between;
              min-height: 80px;
            }
            .left-logo, .right-logo {
              flex-shrink: 0;
            }
            .institute-details {
              flex: 1;
              text-align: center;
              padding: 0 20px;
            }
            .institute-name {
              font-size: 20px;
              font-weight: bold;
              margin: 0 0 5px 0;
              color: #495057;
            }
            .institute-subtitle {
              color: #6c757d;
              font-weight: 500;
              margin: 0 0 8px 0;
              font-size: 14px;
            }
            .contact-info {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
              justify-content: center;
              font-size: 11px;
              color: #6c757d;
            }
            .contact-item {
              display: flex;
              align-items: center;
              gap: 3px;
            }
            .salary-slip-title {
              background: #e9ecef;
              padding: 12px 20px;
              border-radius: 5px;
              border: 1px solid #dee2e6;
              margin-top: 15px;
              display: inline-block;
            }
            .employee-info {
              padding: 20px;
              background: #f8f9fa;
              border-bottom: 1px solid #dee2e6;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 10px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-label {
              font-weight: 600;
              color: #495057;
            }
            .info-value {
              font-weight: 500;
              color: #212529;
            }
            .salary-details {
              padding: 20px;
            }
            .salary-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            .salary-column {
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 5px;
              overflow: hidden;
            }
            .column-header {
              background: #6c757d;
              color: white;
              padding: 12px 15px;
              font-size: 14px;
              font-weight: bold;
              text-align: center;
            }
            .column-content {
              padding: 15px;
            }
            .salary-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
              font-size: 13px;
            }
            .salary-item:last-child {
              border-bottom: none;
            }
            .salary-label {
              color: #495057;
              font-weight: 500;
            }
            .salary-amount {
              font-weight: 600;
              color: #212529;
            }
            .total-row {
              background: #e9ecef;
              color: #495057;
              padding: 10px 15px;
              margin: 15px -15px -15px -15px;
              font-weight: bold;
            }
            .net-salary-section {
              background: #e9ecef;
              color: #495057;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
              border-radius: 5px;
              border: 2px solid #dee2e6;
            }
            .net-salary-title {
              font-size: 16px;
              font-weight: bold;
              margin: 0 0 8px 0;
            }
            .net-salary-amount {
              font-size: 28px;
              font-weight: bold;
              margin: 0;
            }
            .salary-words {
              background: #f8f9fa;
              color: #495057;
              padding: 15px;
              text-align: center;
              border-radius: 5px;
              margin: 15px 0;
              font-weight: 500;
              border: 1px solid #dee2e6;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding: 15px;
              border-top: 1px solid #dee2e6;
              color: #6c757d;
              font-size: 11px;
            }
            @media print {
              body { background: white; padding: 0; }
              .slip-container { box-shadow: none; border: 1px solid #ccc; }
              .salary-grid { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="slip-container">
            <!-- Header Strip -->
            <div class="header-strip"></div>
            
            <!-- Institute Header -->
            <div class="institute-header">
              <div class="institute-info">
                <div class="left-logo" style="display: flex; align-items: center; gap: 10px;">
                  <img src="/logo1.png" alt="NIETM Logo" style="width: 60px; height: 60px; object-fit: contain; border: 2px solid #ddd; border-radius: 8px; padding: 5px; background: white;" />
                </div>
                <div class="institute-details">
                  <div style="font-size: 12px; color: #6c757d; margin-bottom: 3px;">maitrey education society</div>
                  <h1 class="institute-name">NAGARJUNA</h1>
                  <p class="institute-subtitle">Institute of Engineering, Technology & Management</p>
                  <div style="font-size: 11px; color: #6c757d; margin: 3px 0;">(AICTE, DTE Approved & Affiliated to R.T.M. Nagpur University, Nagpur)</div>
                  <div style="font-size: 11px; color: #6c757d; margin: 3px 0;">Village Satnavri, Amravati Road, Nagpur 440023</div>
                  <div class="contact-info" style="margin-top: 8px;">
                    <div class="contact-item">
                      <span>📧</span>
                      <span>maitrey.ngp@gmail.com</span>
                    </div>
                    <div class="contact-item">
                      <span>🌐</span>
                      <span>www.nietm.in</span>
                    </div>
                    <div class="contact-item">
                      <span>📞</span>
                      <span>07118 322211, 12</span>
                    </div>
                  </div>
                </div>
                <div class="right-logo" style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                  <img src="/logo.png" alt="NAAC B++ Accreditation" style="width: 70px; height: 70px; object-fit: contain; border: 3px solid #FFD700; border-radius: 50%; padding: 5px; background: white; box-shadow: 0 3px 10px rgba(255,215,0,0.4);" />
                  <div style="font-size: 8px; color: #B8860B; font-weight: bold; text-align: center; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">NAAC B++<br/>ACCREDITED</div>
                </div>
              </div>
              <div class="salary-slip-title" style="text-align: center; margin: 20px auto; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <h2 style="margin: 0; font-size: 18px; color: #495057; background: linear-gradient(45deg, #28a745, #20c997); color: white; padding: 12px 24px; border-radius: 8px; display: inline-block; box-shadow: 0 3px 6px rgba(0,0,0,0.1);">SALARY SLIP</h2>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #6c757d; font-weight: 500; text-align: center;">For the month of ${slip.month} ${slip.year}</p>
              </div>
            </div>
            
            <!-- Employee Information --> 
            <div class="employee-info">
              <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 14px; display: flex; align-items: center; gap: 5px;">
                Employee Information
              </h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Employee Name:</span>
                  <span class="info-value">${facultyName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Employee ID:</span>
                  <span class="info-value">${employeeId}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Department:</span>
                  <span class="info-value">${department}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Designation:</span>
                  <span class="info-value">${designation}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Joining Date:</span>
                  <span class="info-value">${joiningDate !== 'N/A' ? new Date(joiningDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Payment Status:</span>
                  <span class="info-value">${slip.salaryStatus}</span>
                </div>
              </div>
            </div>
            
            <!-- Salary Details -->
            <div class="salary-details">
              <div class="salary-grid">
                <!-- Earnings Column -->
                <div class="salary-column">
                  <div class="column-header">
                    EARNINGS
                  </div>
                  <div class="column-content">
                    <div class="salary-item">
                      <span class="salary-label">Basic Salary</span>
                      <span class="salary-amount">₹${(slip.basicSalary || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span class="salary-label">HRA</span>
                      <span class="salary-amount">₹${(slip.allowances?.hra || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span class="salary-label">DA</span>
                      <span class="salary-amount">₹${(slip.allowances?.da || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span class="salary-label">Medical Allowance</span>
                      <span class="salary-amount">₹${(slip.allowances?.medical || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span class="salary-label">Transport Allowance</span>
                      <span class="salary-amount">₹${(slip.allowances?.transport || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span class="salary-label">CLA</span>
                      <span class="salary-amount">₹${(slip.allowances?.cla || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span class="salary-label">Other Allowances</span>
                      <span class="salary-amount">₹${(slip.allowances?.others || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div class="total-row">
                    <div class="salary-item" style="border: none; font-size: 13px;">
                      <span>GROSS SALARY</span>
                      <span>₹${(slip.grossSalary || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Deductions Column -->
                <div class="salary-column">
                  <div class="column-header">
                    DEDUCTIONS
                  </div>
                  <div class="column-content">
                    <div class="salary-item">
                      <span class="salary-label">PF</span>
                      <span class="salary-amount">₹${(slip.deductions?.pf || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span class="salary-label">ESI</span>
                      <span class="salary-amount">₹${(slip.deductions?.esi || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span class="salary-label">Professional Tax</span>
                      <span class="salary-amount">₹${(slip.deductions?.professionalTax || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span class="salary-label">TDS</span>
                      <span class="salary-amount">₹${(slip.deductions?.tds || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span class="salary-label">Income Tax</span>
                      <span class="salary-amount">₹${(slip.deductions?.incomeTax || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span class="salary-label">Other Deductions</span>
                      <span class="salary-amount">₹${(slip.deductions?.others || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item" style="height: 54px;">
                      <!-- Empty space to balance columns -->
                    </div>
                  </div>
                  <div class="total-row">
                    <div class="salary-item" style="border: none; font-size: 13px;">
                      <span>TOTAL DEDUCTIONS</span>
                      <span>₹${(slip.totalDeductions || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Net Salary -->
              <div class="net-salary-section">
                <h3 class="net-salary-title">NET SALARY</h3>
                <p class="net-salary-amount">₹${(slip.netSalary || 0).toLocaleString()}</p>
              </div>
              
              <!-- Salary in Words -->
              <div class="salary-words">
                <strong>Net Salary in Words:</strong> ${numberToWords(slip.netSalary || 0)} Rupees Only
              </div>
              
              <!-- Additional Information -->
              ${slip.salaryStatus && slip.salaryStatus !== 'Calculated' ? `
              <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                <div style="color: #15803d; font-weight: 600;">
                  Payment Status: ${slip.salaryStatus}
                  ${slip.paymentDate ? ` (Paid on ${new Date(slip.paymentDate).toLocaleDateString()})` : ''}
                </div>
              </div>
              ` : ''}
              
              <!-- Footer -->
              <div class="footer">
                <p style="margin: 0;">This is a computer-generated salary slip and does not require a signature.</p>
                <p style="margin: 5px 0 0 0;">Generated on: ${slip.generatedOn} | NIETM HR System</p>
                ${slip.paymentId ? `<p style="margin: 5px 0 0 0;">Payment ID: ${slip.paymentId}</p>` : ''}
              </div>
            </div>
          </div>
          
          <script>
            // Auto-print when window loads
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const resetSalarySlip = () => {
    setSalarySlipEmployee('');
    setSalarySlipMonth('');
    setSalarySlipYear(new Date().getFullYear());
    setSalarySlip(null);
    setError('');
  };

  const printSalarySlip = () => {
    if (!salarySlip) return;

    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary Slip - ${salarySlip.faculty?.personalInfo?.fullName || salarySlip.faculty?.fullName || 'Employee'}</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #f8f9fa;
              line-height: 1.5;
              color: #333;
            }
            .slip-container {
              max-width: 850px;
              margin: 0 auto;
              background: white;
              border: 3px solid #1a365d;
              padding: 0;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%);
              color: white;
              padding: 25px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .employee-info {
              padding: 25px;
              background: #f8f9fa;
              border-bottom: 2px solid #e9ecef;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 15px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #dee2e6;
            }
            .salary-details {
              padding: 25px;
            }
            .salary-section {
              margin-bottom: 25px;
            }
            .salary-section h3 {
              margin: 0 0 15px 0;
              color: #1a365d;
              font-size: 18px;
              font-weight: bold;
              border-bottom: 2px solid #1a365d;
              padding-bottom: 5px;
            }
            .salary-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
            }
            .salary-column {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e9ecef;
            }
            .salary-item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #dee2e6;
            }
            .total-row {
              background: #1a365d;
              color: white;
              padding: 15px 20px;
              margin: 20px -20px -20px -20px;
            }
            .net-salary {
              background: #28a745;
              color: white;
              padding: 20px;
              text-align: center;
              margin: 25px 0;
              border-radius: 8px;
            }
            .net-salary .amount {
              font-size: 32px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="slip-container">
            <div class="header">
              <h1>SALARY SLIP</h1>
              <p>Pay Period: ${salarySlip.month || 'N/A'} ${salarySlip.year || 'N/A'}</p>
            </div>
            
            <div class="employee-info">
              <h2>Employee Information</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span>Employee Name:</span>
                  <span>${salarySlip.faculty?.personalInfo?.fullName || salarySlip.faculty?.fullName || (salarySlip.faculty?.firstName && salarySlip.faculty?.lastName ? `${salarySlip.faculty?.firstName} ${salarySlip.faculty?.lastName}`.trim() : 'N/A')}</span>
                </div>
                <div class="info-item">
                  <span>Employee ID:</span>
                  <span>${salarySlip.faculty?.personalInfo?.employeeId || salarySlip.faculty?.employeeId || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span>Department:</span>
                  <span>${salarySlip.faculty?.personalInfo?.department || salarySlip.faculty?.department || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span>Payment Status:</span>
                  <span>${salarySlip.salaryStatus}</span>
                </div>
                <div class="info-item">
                  <span>Salary Type:</span>
                  <span>${salarySlip.salaryType}</span>
                </div>
                <div class="info-item">
                  <span>HRA Rate:</span>
                  <span>${salarySlip.hraRate}</span>
                </div>
                <div class="info-item">
                  <span>City Category:</span>
                  <span>${salarySlip.city}</span>
                </div>
                ${salarySlip.taxDetails ? `
                <div class="info-item">
                  <span>PAN Number:</span>
                  <span>${salarySlip.taxDetails?.panNumber || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span>Financial Year:</span>
                  <span>${salarySlip.taxDetails?.financialYear || 'N/A'}</span>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="salary-details">
              <div class="salary-grid">
                <div class="salary-column">
                  <h3>EARNINGS</h3>
                  <div class="salary-item">
                    <span>Basic Salary</span>
                    <span>₹${(salarySlip.basicSalary || 0).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>HRA</span>
                    <span>₹${(salarySlip.allowances?.hra || 0).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>DA</span>
                    <span>₹${(salarySlip.allowances?.da || 0).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Medical Allowance</span>
                    <span>₹${(salarySlip.allowances?.medical || 0).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Transport Allowance</span>
                    <span>₹${(salarySlip.allowances?.transport || 0).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>CLA</span>
                    <span>₹${(salarySlip.allowances?.cla || 0).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Other Allowances</span>
                    <span>₹${(salarySlip.allowances?.others || 0).toLocaleString()}</span>
                  </div>
                  <div class="total-row">
                    <div class="salary-item">
                      <span>GROSS SALARY (Monthly)</span>
                      <span>₹${(salarySlip.grossSalary || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div class="salary-column">
                  <h3>DEDUCTIONS</h3>
                  <div class="salary-item">
                    <span>PF</span>
                    <span>₹${(salarySlip.deductions?.pf || 0).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>ESI</span>
                    <span>₹${(salarySlip.deductions?.esi || 0).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Professional Tax</span>
                    <span>₹${(salarySlip.deductions?.professionalTax || 0).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>TDS</span>
                    <span>₹${(salarySlip.deductions?.tds || 0).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Income Tax (Monthly)</span>
                    <span>₹${(salarySlip.deductions?.incomeTax || 0).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Other Deductions</span>
                    <span>₹${(salarySlip.deductions?.others || 0).toLocaleString()}</span>
                  </div>
                  <div class="total-row">
                    <div class="salary-item">
                      <span>TOTAL DEDUCTIONS (Monthly)</span>
                      <span>₹${(salarySlip.totalDeductions || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              ${salarySlip.taxDetails ? `
              <div class="salary-section">
                <h3>COMPLETE INCOME TAX DETAILS (From Form Entry)</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span>Employee ID:</span>
                    <span>${salarySlip.taxDetails?.employeeId || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span>Assessment Year:</span>
                    <span>${salarySlip.taxDetails?.assessmentYear || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span>Compliance Status:</span>
                    <span>${salarySlip.taxDetails?.complianceStatus || 'N/A'}</span>
                  </div>
                </div>
                
                <div class="salary-grid" style="margin-top: 20px;">
                  <div class="salary-column">
                    <h4>INCOME BREAKDOWN (From IT Form)</h4>
                    <div class="salary-item">
                      <span>Basic Salary</span>
                      <span>₹${(salarySlip.taxDetails?.incomeBreakdown?.basicSalary || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>HRA</span>
                      <span>₹${(salarySlip.taxDetails?.incomeBreakdown?.hra || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Allowances</span>
                      <span>₹${(salarySlip.taxDetails?.incomeBreakdown?.allowances || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Bonuses</span>
                      <span>₹${(salarySlip.taxDetails?.incomeBreakdown?.bonuses || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Other Income</span>
                      <span>₹${(salarySlip.taxDetails?.incomeBreakdown?.otherIncome || 0).toLocaleString()}</span>
                    </div>
                    <div class="total-row">
                      <div class="salary-item">
                        <span>GROSS INCOME (Annual)</span>
                        <span>₹${(salarySlip.taxDetails?.incomeBreakdown?.grossIncome || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="salary-column">
                    <h4>TAX DEDUCTIONS (From IT Form)</h4>
                    <div class="salary-item">
                      <span>PPF</span>
                      <span>₹${(salarySlip.taxDetails?.deductions?.ppf || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>ELSS</span>
                      <span>₹${(salarySlip.taxDetails?.deductions?.elss || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Life Insurance</span>
                      <span>₹${(salarySlip.taxDetails?.deductions?.lifeInsurance || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Housing Loan</span>
                      <span>₹${(salarySlip.taxDetails?.deductions?.housingLoan || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Tuition Fees</span>
                      <span>₹${(salarySlip.taxDetails?.deductions?.tuitionFees || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Section 80C Total</span>
                      <span>₹${(salarySlip.taxDetails?.deductions?.totalSection80C || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Section 80D</span>
                      <span>₹${(salarySlip.taxDetails?.deductions?.section80D || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Section 80G</span>
                      <span>₹${(salarySlip.taxDetails?.deductions?.section80G || 0).toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Section 24</span>
                      <span>₹${(salarySlip.taxDetails?.deductions?.section24 || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div class="salary-section" style="margin-top: 20px;">
                  <h4>TAX CALCULATION SUMMARY</h4>
                  <div class="info-grid">
                    <div class="info-item">
                      <span>Taxable Income:</span>
                      <span>₹${(salarySlip.taxDetails?.taxCalculation?.taxableIncome || 0).toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                      <span>Total Tax Liability:</span>
                      <span>₹${(salarySlip.taxDetails?.taxCalculation?.totalTax || 0).toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                      <span>TDS Deducted:</span>
                      <span>₹${(salarySlip.taxDetails?.taxCalculation?.tdsDeducted || 0).toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                      <span>Refund/Due:</span>
                      <span>₹${(salarySlip.taxDetails?.taxCalculation?.refundDue || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                ${salarySlip.taxDetails.notes ? `
                <div class="salary-section">
                  <h4>NOTES (From IT Form)</h4>
                  <p style="padding: 10px; background: #f8f9fa; border-radius: 4px; margin: 0; border: 1px solid #dee2e6;">${salarySlip.taxDetails.notes}</p>
                </div>
                ` : ''}
                
                ${salarySlip.taxDetails.remarks ? `
                <div class="salary-section">
                  <h4>REMARKS (From IT Form)</h4>
                  <p style="padding: 10px; background: #f8f9fa; border-radius: 4px; margin: 0; border: 1px solid #dee2e6;">${salarySlip.taxDetails.remarks}</p>
                </div>
                ` : ''}
              </div>
              ` : ''}
              
              <div class="net-salary">
                <h3>NET SALARY (Monthly)</h3>
                <p class="amount">₹${(salarySlip.netSalary).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Salary Calculator & Slip Generator</h1>
          <p className="text-gray-600">Calculate salary using 6th Pay Commission rules and generate salary slips</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8">
          {/* Salary Calculator Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">💰</span>
              Salary Calculator
            </h2>

            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setSalaryCalculationType('actual')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${salaryCalculationType === 'actual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600 border border-blue-300'
                  }`}
              >
                Actual Salary
              </button>
              <button
                onClick={() => setSalaryCalculationType('6pay')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${salaryCalculationType === '6pay'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600 border border-blue-300'
                  }`}
              >
                6th Pay Commission
              </button>
            </div>

            {salaryCalculationType === '6pay' ? (
              <div>
                <div className="mb-4">
                  <h4 className="font-semibold text-blue-800 mb-3">🏛️ 6th Pay Commission Calculator</h4>
                  <div className="flex gap-4 mb-4">
                    <button
                      onClick={() => setStaffType('teaching')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${staffType === 'teaching'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-green-600 border border-green-300'
                        }`}
                    >
                      👨‍🏫 Teaching Staff
                    </button>
                    <button
                      onClick={() => setStaffType('non-teaching')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${staffType === 'non-teaching'
                        ? 'bg-orange-600 text-white'
                        : 'bg-white text-orange-600 border border-orange-300'
                        }`}
                    >
                      👩‍💼 Non-Teaching Staff
                    </button>
                  </div>
                </div>

                {/* Employee & Salary Month Selection */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <span className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-3">👤</span>
                    Employee & Salary Period
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee Name
                        {availableEmployees.length === 0 && (
                          <span className="ml-2 text-xs text-red-500">(Loading employees...)</span>
                        )}
                      </label>
                      <select
                        value={salaryInputs.employeeName}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, employeeName: e.target.value })}
                        className={`w-full px-3 py-2 border ${availableEmployees.length === 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      >
                        <option value="">Select Employee</option>
                        {availableEmployees.map((employee, index) => (
                          <option key={index} value={employee}>{employee}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salary Month</label>
                      <select
                        value={salaryInputs.salaryMonth}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, salaryMonth: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salary Year</label>
                      <select
                        value={salaryInputs.salaryYear}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, salaryYear: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {[...Array(5)].map((_, i) => {
                          const year = new Date().getFullYear() - 2 + i;
                          return <option key={year} value={year}>{year}</option>
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                {staffType === 'teaching' ? (
                  <div>
                    <div className="bg-green-50 p-3 rounded-lg mb-4 border border-green-200">
                      <h5 className="font-semibold text-green-800 mb-2">👨‍🏫 Teaching Staff Calculation Formula:</h5>
                      <p className="text-sm text-green-700">Basic + AGP → DA (164% of Basic+AGP) → HRA (15% of Basic+AGP) → TA + CLA + Medical + Others = Gross → Gross - TDS - EPF - PT = Net</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Basic Pay</label>
                        <input
                          type="number"
                          value={salaryInputs.basicSalary}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, basicSalary: e.target.value })}
                          placeholder="Enter basic pay"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">AGP</label>
                        <select
                          value={salaryInputs.agp}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, agp: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select AGP</option>
                          <option value="6000">6000</option>
                          <option value="7000">7000</option>
                          <option value="8000">8000</option>
                          <option value="9000">9000</option>
                          <option value="10000">10000</option>
                          <option value="12000">12000</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City Category</label>
                        <select
                          value={salaryInputs.city}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, city: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="X">X (Metro) - 15%</option>
                          <option value="Y">Y (Non-Metro) - 15%</option>
                          <option value="Z">Z (Other) - 15%</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DA (Auto-calculated)</label>
                        <input
                          type="text"
                          value={`₹${calculateRealTimeDA().toLocaleString()}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">HRA (Auto-calculated)</label>
                        <input
                          type="text"
                          value={`₹${calculateRealTimeHRA().toLocaleString()}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transport Allowance</label>
                        <input
                          type="number"
                          value={salaryInputs.transportAllowance}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, transportAllowance: e.target.value })}
                          placeholder="TA amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CLA</label>
                        <input
                          type="number"
                          value={salaryInputs.claAllowance}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, claAllowance: e.target.value })}
                          placeholder="CLA amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical Allowance</label>
                        <input
                          type="number"
                          value={salaryInputs.medicalAllowance}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, medicalAllowance: e.target.value })}
                          placeholder="Medical allowance"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Other Allowances</label>
                        <input
                          type="number"
                          value={salaryInputs.otherAllowances}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, otherAllowances: e.target.value })}
                          placeholder="Other allowances"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TDS</label>
                        <input
                          type="number"
                          value={salaryInputs.tdsDeduction}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, tdsDeduction: e.target.value })}
                          placeholder="TDS deduction"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">EPF</label>
                        <input
                          type="number"
                          value={salaryInputs.epfDeduction}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, epfDeduction: e.target.value })}
                          placeholder="EPF deduction"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Professional Tax (Manual)</label>
                        <input
                          type="number"
                          value={salaryInputs.professionalTax}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, professionalTax: e.target.value })}
                          placeholder="PT amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="bg-orange-50 p-3 rounded-lg mb-4 border border-orange-200">
                      <h5 className="font-semibold text-orange-800 mb-2">👩‍💼 Non-Teaching Staff Calculation Formula:</h5>
                      <p className="text-sm text-orange-700">Basic + Grade Pay → DA (164% of Basic+Grade) → HRA (15% of Basic+Grade) → TA + CLA + Medical + Others = Gross → Gross - TDS - EPF - PT = Net</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Basic Pay</label>
                        <input
                          type="number"
                          value={salaryInputs.basicSalary}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, basicSalary: e.target.value })}
                          placeholder="Enter basic pay"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grade Pay</label>
                        <select
                          value={salaryInputs.gradePay}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, gradePay: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Grade Pay</option>
                          <option value="1800">1800</option>
                          <option value="1900">1900</option>
                          <option value="2000">2000</option>
                          <option value="2400">2400</option>
                          <option value="2800">2800</option>
                          <option value="4200">4200</option>
                          <option value="4600">4600</option>
                          <option value="4800">4800</option>
                          <option value="5400">5400</option>
                          <option value="6600">6600</option>
                          <option value="7600">7600</option>
                          <option value="8700">8700</option>
                          <option value="8900">8900</option>
                          <option value="10000">10000</option>
                          <option value="12000">12000</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City Category</label>
                        <select
                          value={salaryInputs.city}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, city: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="X">X (Metro) - 15%</option>
                          <option value="Y">Y (Non-Metro) - 15%</option>
                          <option value="Z">Z (Other) - 15%</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DA (Auto-calculated)</label>
                        <input
                          type="text"
                          value={`₹${calculateRealTimeDA().toLocaleString()}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">HRA (Auto-calculated)</label>
                        <input
                          type="text"
                          value={`₹${calculateRealTimeHRA().toLocaleString()}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transport Allowance</label>
                        <input
                          type="number"
                          value={salaryInputs.transportAllowance}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, transportAllowance: e.target.value })}
                          placeholder="1600"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CLA</label>
                        <input
                          type="number"
                          value={salaryInputs.claAllowance}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, claAllowance: e.target.value })}
                          placeholder="CLA amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical Allowance</label>
                        <input
                          type="number"
                          value={salaryInputs.medicalAllowance}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, medicalAllowance: e.target.value })}
                          placeholder="500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Other Allowances</label>
                        <input
                          type="number"
                          value={salaryInputs.otherAllowances}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, otherAllowances: e.target.value })}
                          placeholder="Other allowances"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TDS</label>
                        <input
                          type="number"
                          value={salaryInputs.tdsDeduction}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, tdsDeduction: e.target.value })}
                          placeholder="TDS deduction"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">EPF</label>
                        <input
                          type="number"
                          value={salaryInputs.epfDeduction}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, epfDeduction: e.target.value })}
                          placeholder="EPF deduction"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Professional Tax (Manual)</label>
                        <input
                          type="number"
                          value={salaryInputs.professionalTax}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, professionalTax: e.target.value })}
                          placeholder="PT amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200">
                  <h5 className="font-semibold text-gray-800 mb-2">💼 Actual Salary Calculator:</h5>
                  <p className="text-sm text-gray-700">Enter actual salary components as per current pay structure</p>
                </div>

                {/* Staff Type Selection for Actual Salary */}
                <div className="mb-4">
                  <h6 className="font-semibold text-gray-800 mb-3">👥 Staff Type Selection</h6>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStaffType('teaching')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${staffType === 'teaching'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-green-600 border border-green-300'
                        }`}
                    >
                      👨‍🏫 Teaching Staff (No DA)
                    </button>
                    <button
                      onClick={() => setStaffType('non-teaching')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${staffType === 'non-teaching'
                        ? 'bg-orange-600 text-white'
                        : 'bg-white text-orange-600 border border-orange-300'
                        }`}
                    >
                      👩‍💼 Non-Teaching Staff (With DA)
                    </button>
                  </div>
                </div>

                {/* Quick Decided Salary Section */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h6 className="font-semibold text-blue-800 mb-3 flex items-center">
                    💰 Decided Salary Calculator
                    <span className="ml-2 text-xs text-blue-600 font-normal">
                      Enter total decided salary → Add working days → Get final salary
                    </span>
                  </h6>
                  <div className="bg-blue-100 p-3 rounded-md mb-4 border border-blue-300">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">🎯 Simple Process:</span>
                      1️⃣ Enter your decided monthly salary
                      2️⃣ {staffType === 'teaching' ? 'For teaching staff: decided salary = basic salary' : 'For non-teaching: auto-calculate basic+DA+allowances from decided salary'}
                      3️⃣ Add working days for pro-rata calculation (optional)
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Decided Monthly Salary (तय की गई सैलरी)
                        <span className="text-xs text-gray-500 ml-1">(Total fixed salary amount)</span>
                      </label>
                      <input
                        type="number"
                        value={salaryInputs.decidedSalary || ''}
                        onChange={(e) => {
                          const decidedAmount = e.target.value;
                          const decided = parseFloat(decidedAmount);

                          // Check if any components are already filled (removed daRate check)
                          const hasExistingComponents = salaryInputs.basicSalary ||
                            salaryInputs.hraRate || salaryInputs.transportAllowance ||
                            salaryInputs.claAllowance || salaryInputs.medicalAllowance ||
                            salaryInputs.otherAllowances;

                          if (decidedAmount && decided > 0 && !hasExistingComponents) {
                            // Auto-distribute if no existing components (without DA)
                            setSalaryInputs({
                              ...salaryInputs,
                              decidedSalary: decidedAmount,
                              basicSalary: Math.round(decided * 0.6), // 60% (increased from 50%)
                              hraRate: Math.round(decided * 0.2), // 20% (increased from 15%)
                              transportAllowance: Math.round(decided * 0.06), // 6% (increased from 5%)
                              claAllowance: Math.round(decided * 0.04), // 4% (increased from 3%)
                              medicalAllowance: Math.round(decided * 0.04), // 4% (increased from 2%)
                              otherAllowances: Math.round(decided * 0.06) // 6% (increased from 5%)
                            });
                          } else {
                            // Just update decided salary if components exist
                            setSalaryInputs({
                              ...salaryInputs,
                              decidedSalary: decidedAmount
                            });
                          }
                        }}
                        placeholder="e.g., 90000"
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          const decided = parseFloat(salaryInputs.decidedSalary);
                          if (decided) {
                            if (staffType === 'teaching') {
                              // Teaching staff - Decided salary becomes basic salary (no breakdown)
                              setSalaryInputs({
                                ...salaryInputs,
                                basicSalary: decided, // Decided salary = Basic salary for teaching staff
                                daRate: 0, // No DA for teaching
                                hraRate: 0, // No auto HRA breakdown
                                transportAllowance: 0, // No auto TA breakdown
                                claAllowance: 0, // No auto CLA breakdown
                                medicalAllowance: 0, // No auto medical breakdown
                                otherAllowances: 0 // No auto others breakdown
                              });
                            } else {
                              // Non-teaching staff - Proper component breakdown with correct DA calculation
                              const basic = Math.round(decided * 0.4); // 40% basic
                              const da = Math.round(basic * 0.9); // 90% of basic as DA (correct DA rate)
                              const hra = Math.round(basic * 0.15); // 15% of basic as HRA
                              const ta = Math.round(decided * 0.05); // 5% as TA
                              const cla = Math.round(decided * 0.03); // 3% as CLA
                              const medical = Math.round(decided * 0.02); // 2% as Medical
                              
                              // Calculate others to match decided salary exactly
                              const calculatedTotal = basic + da + hra + ta + cla + medical;
                              const others = Math.max(0, decided - calculatedTotal);
                              
                              setSalaryInputs({
                                ...salaryInputs,
                                basicSalary: basic,
                                daRate: da,
                                hraRate: hra,
                                transportAllowance: ta,
                                claAllowance: cla,
                                medicalAllowance: medical,
                                otherAllowances: others
                              });
                            }
                          }
                        }}
                        disabled={!salaryInputs.decidedSalary}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {staffType === 'teaching' ? '📊 Set as Basic Salary' : '📊 Auto-Calculate Components'}
                      </button>
                    </div>
                  </div>
                  {salaryInputs.decidedSalary && (
                    <div className="mt-3 p-3 bg-blue-100 rounded-md border border-blue-300">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">💡 Quick Info:</span>
                        Decided Salary: ₹{parseFloat(salaryInputs.decidedSalary).toLocaleString()} per month
                        {staffType === 'teaching' && (
                          <span className="text-green-700 font-medium"> → This will be set as Basic Salary for teaching staff</span>
                        )}
                        {staffType === 'non-teaching' && (
                          <span className="text-blue-700 font-medium"> → This will be distributed as Basic (40%) + DA (90% of basic) + HRA (15% of basic) + Allowances for non-teaching staff</span>
                        )}
                        {salaryInputs.workingDays && salaryInputs.totalMonthDays && (
                          <>
                            {' '}→ Per Day: ₹{(parseFloat(salaryInputs.decidedSalary) / parseFloat(salaryInputs.totalMonthDays)).toLocaleString()}
                            {' '}→ {salaryInputs.workingDays} days: ₹{((parseFloat(salaryInputs.decidedSalary) / parseFloat(salaryInputs.totalMonthDays)) * parseFloat(salaryInputs.workingDays)).toLocaleString()}
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Teaching and Non-Teaching Staff Sections */}
                <div>
                  {staffType === 'teaching' && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Employee Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee Name *
                          {availableEmployees.length === 0 && (
                            <span className="ml-2 text-xs text-red-500">(Loading employees...)</span>
                          )}
                        </label>
                        <select
                          value={salaryInputs.employeeName}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, employeeName: e.target.value })}
                          className={`w-full px-3 py-2 border ${availableEmployees.length === 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        >
                          <option value="">Select Employee</option>
                          {availableEmployees.map((employee, index) => (
                            <option key={index} value={employee}>{employee}</option>
                          ))}
                        </select>
                      </div>

                      {/* Month */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                        <select
                          value={salaryInputs.salaryMonth}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, salaryMonth: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {months.map((month) => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Total Days */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Days *</label>
                        <input
                          type="number"
                          value={salaryInputs.totalMonthDays}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, totalMonthDays: e.target.value })}
                          placeholder="e.g., 30"
                          min="28"
                          max="31"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Present Days */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Present Days *</label>
                        <input
                          type="number"
                          value={salaryInputs.workingDays}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, workingDays: e.target.value })}
                          placeholder="e.g., 25"
                          min="1"
                          max="31"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Decided Salary */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Decided Salary *</label>
                        <input
                          type="number"
                          value={salaryInputs.decidedSalary}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, decidedSalary: e.target.value, basicSalary: e.target.value })}
                          placeholder="e.g., 50000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Actual Salary (Basic) - Auto-calculated based on days */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Actual Salary (Basic) - Days Based *</label>
                        <input
                          type="text"
                          value={`₹${(() => {
                            let basic = parseFloat(salaryInputs.decidedSalary) || 0;
                            const workingDays = parseFloat(salaryInputs.workingDays) || 0;
                            const totalDays = parseFloat(salaryInputs.totalMonthDays) || 30;

                            if (workingDays > 0 && totalDays > 0) {
                              const dailyMultiplier = workingDays / totalDays;
                              basic = basic * dailyMultiplier;
                            }

                            return basic.toLocaleString();
                          })()}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-yellow-50 font-semibold"
                        />
                      </div>

                      {/* Gross Salary */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gross Salary (Days Based)</label>
                        <input
                          type="text"
                          value={`₹${(() => {
                            let gross = parseFloat(salaryInputs.decidedSalary) || 0;
                            const workingDays = parseFloat(salaryInputs.workingDays) || 0;
                            const totalDays = parseFloat(salaryInputs.totalMonthDays) || 30;

                            if (workingDays > 0 && totalDays > 0) {
                              const dailyMultiplier = workingDays / totalDays;
                              gross = gross * dailyMultiplier;
                            }

                            return gross.toLocaleString();
                          })()}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                        />
                      </div>

                      {/* Professional Tax */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Professional Tax</label>
                        <input
                          type="number"
                          value={salaryInputs.professionalTax}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, professionalTax: e.target.value })}
                          placeholder="PT amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* EPF */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">EPF</label>
                        <input
                          type="number"
                          value={salaryInputs.epfDeduction}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, epfDeduction: e.target.value })}
                          placeholder="EPF deduction"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Advance */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Advance</label>
                        <input
                          type="number"
                          value={salaryInputs.loanDeduction || ''}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, loanDeduction: e.target.value })}
                          placeholder="Advance/Loan amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* TDS */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TDS</label>
                        <input
                          type="number"
                          value={salaryInputs.tdsDeduction}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, tdsDeduction: e.target.value })}
                          placeholder="TDS deduction"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Net Salary */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Net Salary (Days Based)</label>
                        <input
                          type="text"
                          value={`₹${(() => {
                            let gross = parseFloat(salaryInputs.decidedSalary) || 0;
                            const workingDays = parseFloat(salaryInputs.workingDays) || 0;
                            const totalDays = parseFloat(salaryInputs.totalMonthDays) || 30;

                            if (workingDays > 0 && totalDays > 0) {
                              const dailyMultiplier = workingDays / totalDays;
                              gross = gross * dailyMultiplier;
                            }

                            let pt = parseFloat(salaryInputs.professionalTax) || 0;
                            let epf = parseFloat(salaryInputs.epfDeduction) || 0;
                            let advance = parseFloat(salaryInputs.loanDeduction) || 0;
                            let tds = parseFloat(salaryInputs.tdsDeduction) || 0;

                            if (workingDays > 0 && totalDays > 0) {
                              const dailyMultiplier = workingDays / totalDays;
                              pt = pt * dailyMultiplier;
                              epf = epf * dailyMultiplier;
                              advance = advance * dailyMultiplier;
                              tds = tds * dailyMultiplier;
                            }

                            const net = gross - pt - epf - advance - tds;
                            return net.toLocaleString();
                          })()}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 font-semibold"
                        />
                      </div>
                    </div>

                    {/* Daily Calculation Display */}
                    {salaryInputs.workingDays && salaryInputs.totalMonthDays && salaryInputs.decidedSalary && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h6 className="font-semibold text-blue-800 mb-2">
                          📊 Daily Salary Calculation (Based on Present Days)
                        </h6>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-blue-100 p-3 rounded-md">
                            <span className="text-blue-700 font-medium">Total Salary:</span>
                            <div className="text-blue-800 font-bold text-lg">₹{parseFloat(salaryInputs.decidedSalary).toLocaleString()}</div>
                          </div>
                          <div className="bg-blue-100 p-3 rounded-md">
                            <span className="text-blue-700 font-medium">Per Day Rate:</span>
                            <div className="text-blue-800 font-bold text-lg">₹{(parseFloat(salaryInputs.decidedSalary) / parseFloat(salaryInputs.totalMonthDays)).toLocaleString()}</div>
                          </div>
                          <div className="bg-blue-100 p-3 rounded-md">
                            <span className="text-blue-700 font-medium">Present Days:</span>
                            <div className="text-blue-800 font-bold text-lg">{salaryInputs.workingDays} days</div>
                          </div>
                          <div className="bg-blue-100 p-3 rounded-md">
                            <span className="text-blue-700 font-medium">Final Salary:</span>
                            <div className="text-blue-800 font-bold text-lg">₹{((parseFloat(salaryInputs.decidedSalary) / parseFloat(salaryInputs.totalMonthDays)) * parseFloat(salaryInputs.workingDays)).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-blue-100 rounded-md">
                          <p className="text-blue-800 text-sm">
                            <span className="font-semibold">💡 Formula:</span>
                            Total Salary (₹{parseFloat(salaryInputs.decidedSalary).toLocaleString()}) ÷ {salaryInputs.totalMonthDays} days = ₹{(parseFloat(salaryInputs.decidedSalary) / parseFloat(salaryInputs.totalMonthDays)).toLocaleString()} per day × {salaryInputs.workingDays} present days = ₹{((parseFloat(salaryInputs.decidedSalary) / parseFloat(salaryInputs.totalMonthDays)) * parseFloat(salaryInputs.workingDays)).toLocaleString()} final salary
                          </p>
                        </div>
                      </div>
                    )}
                    </div>
                  )}
                </div>

                {/* Non-Teaching Staff - Full Form  */}
                {staffType === 'non-teaching' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Employee Name
                        {availableEmployees.length === 0 && (
                          <span className="ml-2 text-xs text-red-500">(Loading employees...)</span>
                        )}
                      </label>
                      <select
                        value={salaryInputs.employeeName}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, employeeName: e.target.value })}
                        className={`w-full px-3 py-2 border ${availableEmployees.length === 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      >
                        <option value="">Select Employee</option>
                        {availableEmployees.map((employee, index) => (
                          <option key={index} value={employee}>{employee}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (Auto-calculated from Decided Salary)</label>
                      <input
                        type="text"
                        value={`₹${(() => {
                          let basic = parseFloat(salaryInputs.decidedSalary) || 0;
                          const workingDays = parseFloat(salaryInputs.workingDays) || 0;
                          const totalDays = parseFloat(salaryInputs.totalMonthDays) || 30;

                          if (workingDays > 0 && totalDays > 0) {
                            const dailyMultiplier = workingDays / totalDays;
                            basic = basic * dailyMultiplier;
                          }

                          return basic.toLocaleString();
                        })()}`}
                        readOnly
                        placeholder="Will auto-calculate from decided salary and days"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-yellow-50 font-semibold cursor-not-allowed"
                      />
                    </div>
                    {/* DA field - only for non-teaching staff */}
                    {staffType === 'non-teaching' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DA</label>
                        <input
                          type="number"
                          value={salaryInputs.daRate}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, daRate: e.target.value })}
                          placeholder="DA amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HRA</label>
                      <input
                        type="number"
                        value={salaryInputs.hraRate}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, hraRate: e.target.value })}
                        placeholder="HRA amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">TA</label>
                      <input
                        type="number"
                        value={salaryInputs.transportAllowance}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, transportAllowance: e.target.value })}
                        placeholder="TA amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CLA</label>
                      <input
                        type="number"
                        value={salaryInputs.claAllowance}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, claAllowance: e.target.value })}
                        placeholder="CLA amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medical Allowance</label>
                      <input
                        type="number"
                        value={salaryInputs.medicalAllowance}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, medicalAllowance: e.target.value })}
                        placeholder="Medical allowance"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Other Allowances</label>
                      <input
                        type="number"
                        value={salaryInputs.otherAllowances}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, otherAllowances: e.target.value })}
                        placeholder="Other allowances"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PF</label>
                      <input
                        type="number"
                        value={salaryInputs.epfDeduction}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, epfDeduction: e.target.value })}
                        placeholder="PF deduction"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">TDS</label>
                      <input
                        type="number"
                        value={salaryInputs.tdsDeduction}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, tdsDeduction: e.target.value })}
                        placeholder="TDS deduction"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Professional Tax</label>
                      <input
                        type="number"
                        value={salaryInputs.professionalTax}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, professionalTax: e.target.value })}
                        placeholder="PT amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Non-Teaching Staff - Actual Salary Section */}
                {staffType === 'non-teaching' && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h6 className="font-semibold text-blue-800 mb-4 flex items-center">
                    📊 Non-Teaching Staff - Actual Salary Calculation (Days Based)
                    </h6>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Employee Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Employee Name *
                          {availableEmployees.length === 0 && (
                            <span className="ml-2 text-xs text-red-500">(Loading employees...)</span>
                          )}
                        </label>
                        <select
                          value={salaryInputs.employeeName}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, employeeName: e.target.value })}
                          className={`w-full px-3 py-2 border ${availableEmployees.length === 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        >
                          <option value="">Select Employee</option>
                          {availableEmployees.map((employee, index) => (
                            <option key={index} value={employee}>{employee}</option>
                          ))}
                        </select>
                      </div>

                      {/* Month */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                        <select
                          value={salaryInputs.salaryMonth}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, salaryMonth: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {months.map((month) => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Total Days */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Days *</label>
                        <input
                          type="number"
                          value={salaryInputs.totalMonthDays}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, totalMonthDays: e.target.value })}
                          placeholder="e.g., 30"
                          min="28"
                          max="31"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Present Days */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Present Days *</label>
                        <input
                          type="number"
                          value={salaryInputs.workingDays}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, workingDays: e.target.value })}
                          placeholder="e.g., 25"
                          min="1"
                          max="31"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Basic Salary */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary *</label>
                        <input
                          type="number"
                          value={salaryInputs.basicSalary}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, basicSalary: e.target.value })}
                          placeholder="e.g., 20000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* DA */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DA (90% of Basic typically) *</label>
                        <input
                          type="number"
                          value={salaryInputs.daRate}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, daRate: e.target.value })}
                          placeholder="e.g., 18000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* HRA */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">HRA (15% of Basic typically) *</label>
                        <input
                          type="number"
                          value={salaryInputs.hraRate}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, hraRate: e.target.value })}
                          placeholder="e.g., 3000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* TA */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transport Allowance</label>
                        <input
                          type="number"
                          value={salaryInputs.transportAllowance}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, transportAllowance: e.target.value })}
                          placeholder="e.g., 2500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* CLA */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CLA</label>
                        <input
                          type="number"
                          value={salaryInputs.claAllowance}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, claAllowance: e.target.value })}
                          placeholder="e.g., 1500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Medical Allowance */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical Allowance</label>
                        <input
                          type="number"
                          value={salaryInputs.medicalAllowance}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, medicalAllowance: e.target.value })}
                          placeholder="e.g., 1000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Other Allowances */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Other Allowances</label>
                        <input
                          type="number"
                          value={salaryInputs.otherAllowances}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, otherAllowances: e.target.value })}
                          placeholder="e.g., 4000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* PF Deduction */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">PF Deduction</label>
                        <input
                          type="number"
                          value={salaryInputs.epfDeduction}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, epfDeduction: e.target.value })}
                          placeholder="e.g., 2400"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* TDS Deduction */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TDS Deduction</label>
                        <input
                          type="number"
                          value={salaryInputs.tdsDeduction}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, tdsDeduction: e.target.value })}
                          placeholder="e.g., 500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Professional Tax */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Professional Tax</label>
                        <input
                          type="number"
                          value={salaryInputs.professionalTax}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, professionalTax: e.target.value })}
                          placeholder="e.g., 200"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Loan/Advance Deduction */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loan/Advance Deduction</label>
                        <input
                          type="number"
                          value={salaryInputs.loanDeduction}
                          onChange={(e) => setSalaryInputs({ ...salaryInputs, loanDeduction: e.target.value })}
                          placeholder="e.g., 0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Actual Salary (Basic) - Days Based Calculation */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Actual Basic Salary (Days Based) *</label>
                        <input
                          type="text"
                          value={`₹${(() => {
                            let basic = parseFloat(salaryInputs.basicSalary) || 0;
                            const workingDays = parseFloat(salaryInputs.workingDays) || 0;
                            const totalDays = parseFloat(salaryInputs.totalMonthDays) || 30;

                            if (workingDays > 0 && totalDays > 0 && workingDays < totalDays) {
                              const dailyMultiplier = workingDays / totalDays;
                              basic = basic * dailyMultiplier;
                            }

                            return basic.toLocaleString();
                          })()}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-yellow-50 font-semibold"
                        />
                      </div>

                      {/* Gross Salary */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gross Salary (Days Based)</label>
                        <input
                          type="text"
                          value={`₹${(() => {
                            const basic = parseFloat(salaryInputs.basicSalary) || 0;
                            const da = parseFloat(salaryInputs.daRate) || 0;
                            const hra = parseFloat(salaryInputs.hraRate) || 0;
                            const ta = parseFloat(salaryInputs.transportAllowance) || 0;
                            const cla = parseFloat(salaryInputs.claAllowance) || 0;
                            const medical = parseFloat(salaryInputs.medicalAllowance) || 0;
                            const others = parseFloat(salaryInputs.otherAllowances) || 0;
                            
                            let gross = basic + da + hra + ta + cla + medical + others;
                            const workingDays = parseFloat(salaryInputs.workingDays) || 0;
                            const totalDays = parseFloat(salaryInputs.totalMonthDays) || 30;

                            if (workingDays > 0 && totalDays > 0 && workingDays < totalDays) {
                              const dailyMultiplier = workingDays / totalDays;
                              gross = gross * dailyMultiplier;
                            }

                            return gross.toLocaleString();
                          })()}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 font-semibold"
                        />
                      </div>

                      {/* Net Salary */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Net Salary (Days Based)</label>
                        <input
                          type="text"
                          value={`₹${(() => {
                            const basic = parseFloat(salaryInputs.basicSalary) || 0;
                            const da = parseFloat(salaryInputs.daRate) || 0;
                            const hra = parseFloat(salaryInputs.hraRate) || 0;
                            const ta = parseFloat(salaryInputs.transportAllowance) || 0;
                            const cla = parseFloat(salaryInputs.claAllowance) || 0;
                            const medical = parseFloat(salaryInputs.medicalAllowance) || 0;
                            const others = parseFloat(salaryInputs.otherAllowances) || 0;
                            
                            let gross = basic + da + hra + ta + cla + medical + others;
                            const workingDays = parseFloat(salaryInputs.workingDays) || 0;
                            const totalDays = parseFloat(salaryInputs.totalMonthDays) || 30;

                            if (workingDays > 0 && totalDays > 0 && workingDays < totalDays) {
                              const dailyMultiplier = workingDays / totalDays;
                              gross = gross * dailyMultiplier;
                            }

                            // Apply deductions
                            let pt = parseFloat(salaryInputs.professionalTax) || 0;
                            let epf = parseFloat(salaryInputs.epfDeduction) || 0;
                            let advance = parseFloat(salaryInputs.loanDeduction) || 0;
                            let tds = parseFloat(salaryInputs.tdsDeduction) || 0;

                            if (workingDays > 0 && totalDays > 0 && workingDays < totalDays) {
                              const dailyMultiplier = workingDays / totalDays;
                              pt = pt * dailyMultiplier;
                              epf = epf * dailyMultiplier;
                              advance = advance * dailyMultiplier;
                              tds = tds * dailyMultiplier;
                            }

                            const net = gross - pt - epf - advance - tds;
                            return net.toLocaleString();
                          })()}`}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 font-semibold"
                        />
                      </div>

                      {/* Quick Calculator Button */}
                      <div className="md:col-span-3">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h6 className="font-semibold text-gray-800 mb-2">🧮 Quick Component Calculator</h6>
                          <p className="text-sm text-gray-600 mb-3">
                            Enter a total salary amount and auto-calculate typical component breakdown:
                          </p>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Total Salary</label>
                              <input
                                type="number"
                                placeholder="e.g., 50000"
                                id="quickCalcInput"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <button
                              onClick={() => {
                                const input = document.getElementById('quickCalcInput');
                                const totalSalary = parseFloat(input.value) || 0;
                                if (totalSalary > 0) {
                                  const basic = Math.round(totalSalary * 0.4); // 40% basic
                                  const da = Math.round(basic * 0.9); // 90% of basic as DA
                                  const hra = Math.round(basic * 0.15); // 15% of basic as HRA
                                  const ta = Math.round(totalSalary * 0.05); // 5% as TA
                                  const cla = Math.round(totalSalary * 0.03); // 3% as CLA
                                  const medical = Math.round(totalSalary * 0.02); // 2% as Medical
                                  const calculatedTotal = basic + da + hra + ta + cla + medical;
                                  const others = Math.max(0, totalSalary - calculatedTotal);
                                  
                                  setSalaryInputs({
                                    ...salaryInputs,
                                    basicSalary: basic,
                                    daRate: da,
                                    hraRate: hra,
                                    transportAllowance: ta,
                                    claAllowance: cla,
                                    medicalAllowance: medical,
                                    otherAllowances: others
                                  });
                                  input.value = '';
                                }
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              📊 Auto-Fill
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            💡 This will calculate: Basic (40%), DA (90% of basic), HRA (15% of basic), TA (5%), CLA (3%), Medical (2%), Others (remaining)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Daily Calculation Display */}
                    {salaryInputs.workingDays && salaryInputs.totalMonthDays && (salaryInputs.basicSalary || salaryInputs.daRate || salaryInputs.hraRate) && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h6 className="font-semibold text-blue-800 mb-2">
                          📊 Daily Salary Calculation (Based on Present Days)
                        </h6>
                        {(() => {
                          const basic = parseFloat(salaryInputs.basicSalary) || 0;
                          const da = parseFloat(salaryInputs.daRate) || 0;
                          const hra = parseFloat(salaryInputs.hraRate) || 0;
                          const ta = parseFloat(salaryInputs.transportAllowance) || 0;
                          const cla = parseFloat(salaryInputs.claAllowance) || 0;
                          const medical = parseFloat(salaryInputs.medicalAllowance) || 0;
                          const others = parseFloat(salaryInputs.otherAllowances) || 0;
                          const totalSalary = basic + da + hra + ta + cla + medical + others;
                          const perDayRate = totalSalary / parseFloat(salaryInputs.totalMonthDays);
                          const finalSalary = perDayRate * parseFloat(salaryInputs.workingDays);

                          return (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div className="bg-blue-100 p-3 rounded-md">
                                  <span className="text-blue-700 font-medium">Total Salary:</span>
                                  <div className="text-blue-800 font-bold text-lg">₹{totalSalary.toLocaleString()}</div>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-md">
                                  <span className="text-blue-700 font-medium">Per Day Rate:</span>
                                  <div className="text-blue-800 font-bold text-lg">₹{perDayRate.toLocaleString()}</div>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-md">
                                  <span className="text-blue-700 font-medium">Present Days:</span>
                                  <div className="text-blue-800 font-bold text-lg">{salaryInputs.workingDays} days</div>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-md">
                                  <span className="text-blue-700 font-medium">Final Salary:</span>
                                  <div className="text-blue-800 font-bold text-lg">₹{finalSalary.toLocaleString()}</div>
                                </div>
                              </div>
                              <div className="mt-3 p-3 bg-blue-100 rounded-md">
                                <p className="text-blue-800 text-sm">
                                  <span className="font-semibold">💡 Formula:</span>
                                  Total Salary (₹{totalSalary.toLocaleString()}) ÷ {salaryInputs.totalMonthDays} days = ₹{perDayRate.toLocaleString()} per day × {salaryInputs.workingDays} present days = ₹{finalSalary.toLocaleString()} final salary
                                </p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                    </div>
                  )}

                {/* Salary Calculation Reference Info */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h6 className="font-semibold text-gray-800 mb-2 flex items-center">
                    📊 Salary Components Reference
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-green-700">Earnings:</span>
                      <div className="text-gray-600 ml-2">
                        • Basic Salary, DA, HRA<br />
                        • Transport, CLA, Medical<br />
                        • Special, Conveyance, Others
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-red-700">Deductions:</span>
                      <div className="text-gray-600 ml-2">
                        • TDS, EPF, Professional Tax<br />
                        • ESI, Loan/Advance<br />
                        • Insurance, Other Deductions
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Salary Calculation Section */}
                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h6 className="font-semibold text-yellow-800 mb-3 flex items-center">
                    📅 Daily Salary Calculation (Optional)
                    <span className="ml-2 text-xs text-yellow-600 font-normal">
                      Leave blank for full month salary
                    </span>
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Working Days
                        <span className="text-xs text-gray-500 ml-1">(Days actually worked)</span>
                      </label>
                      <input
                        type="number"
                        value={salaryInputs.workingDays}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, workingDays: e.target.value })}
                        placeholder="e.g., 25"
                        min="1"
                        max="31"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Month Days
                        <span className="text-xs text-gray-500 ml-1">(Total days in month)</span>
                      </label>
                      <input
                        type="number"
                        value={salaryInputs.totalMonthDays}
                        onChange={(e) => setSalaryInputs({ ...salaryInputs, totalMonthDays: e.target.value })}
                        placeholder="e.g., 30"
                        min="28"
                        max="31"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      />
                    </div>
                  </div>

                  {/* Daily Rate Preview - Priority: Decided Salary > Component Total */}
                  {salaryInputs.workingDays && salaryInputs.totalMonthDays && (salaryInputs.decidedSalary || salaryInputs.basicSalary) && (
                    <div className="mt-3 p-3 bg-yellow-100 rounded-md border border-yellow-300">
                      <p className="text-sm text-yellow-800">
                        <span className="font-semibold">📊 Daily Salary Calculation:</span>
                        {parseFloat(salaryInputs.workingDays) > 0 && parseFloat(salaryInputs.totalMonthDays) > 0 ? (
                          <>
                            {(() => {
                              // Priority: Use decided salary first, then calculate from components
                              let fullMonthSalary = 0;

                              if (salaryInputs.decidedSalary && parseFloat(salaryInputs.decidedSalary) > 0) {
                                // Use decided salary directly
                                fullMonthSalary = parseFloat(salaryInputs.decidedSalary);
                              } else {
                                // Calculate from individual components
                                const basic = parseFloat(salaryInputs.basicSalary) || 0;
                                const da = parseFloat(salaryInputs.daRate) || 0;
                                const hra = parseFloat(salaryInputs.hraRate) || 0;
                                const ta = parseFloat(salaryInputs.transportAllowance) || 0;
                                const cla = parseFloat(salaryInputs.claAllowance) || 0;
                                const medical = parseFloat(salaryInputs.medicalAllowance) || 0;
                                const special = parseFloat(salaryInputs.specialAllowance) || 0;
                                const conveyance = parseFloat(salaryInputs.conveyanceAllowance) || 0;
                                const others = parseFloat(salaryInputs.otherAllowances) || 0;
                                fullMonthSalary = basic + da + hra + ta + cla + medical + special + conveyance + others;
                              }

                              const perDayRate = fullMonthSalary / parseFloat(salaryInputs.totalMonthDays);
                              const workingDays = parseFloat(salaryInputs.workingDays);
                              const expectedSalary = perDayRate * workingDays;
                              const percentage = (workingDays / parseFloat(salaryInputs.totalMonthDays)) * 100;

                              return (
                                <>
                                  <br />
                                  <span className="font-bold text-yellow-900">
                                    {salaryInputs.decidedSalary ? '💰 From Decided Salary:' : '📊 From Components:'}
                                  </span>
                                  <br />
                                  Full Month: ₹{fullMonthSalary.toLocaleString()} ÷ {salaryInputs.totalMonthDays} days = ₹{perDayRate.toFixed(2)} per day
                                  <br />
                                  <span className="font-bold text-green-800">
                                    Final Salary: ₹{perDayRate.toFixed(2)} × {workingDays} days = ₹{expectedSalary.toLocaleString()} ({percentage.toFixed(1)}% of full month)
                                  </span>
                                </>
                              );
                            })()}
                          </>
                        ) : (
                          ' Please enter working days and total month days'
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}


            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSalaryCalculation}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                💰 Calculate Salary
              </button>

              {calculatedSalary && (
                <>
                  <button
                    onClick={saveSalaryRecord}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    💾 Save Salary Record
                  </button>
                  <button
                    onClick={() => setCalculatedSalary(null)}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Clear Results
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Salary Calculation Results */}
          {calculatedSalary && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h5 className="font-semibold text-green-800 mb-3">💰 {calculatedSalary.type} - Calculation Results</h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h6 className="font-medium text-green-700">Earnings:</h6>
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span className="font-medium">₹{calculatedSalary.basic.toLocaleString()}</span>
                  </div>
                  {calculatedSalary.agp > 0 && (
                    <div className="flex justify-between">
                      <span>AGP:</span>
                      <span className="font-medium">₹{calculatedSalary.agp.toLocaleString()}</span>
                    </div>
                  )}
                  {calculatedSalary.gradePay > 0 && (
                    <div className="flex justify-between">
                      <span>Grade Pay:</span>
                      <span className="font-medium">₹{calculatedSalary.gradePay.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>DA:</span>
                    <span className="font-medium">₹{calculatedSalary.da.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HRA:</span>
                    <span className="font-medium">₹{calculatedSalary.hra.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TA:</span>
                    <span className="font-medium">₹{calculatedSalary.ta.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLA:</span>
                    <span className="font-medium">₹{calculatedSalary.cla.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Medical:</span>
                    <span className="font-medium">₹{calculatedSalary.medical.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Others:</span>
                    <span className="font-medium">₹{calculatedSalary.others.toLocaleString()}</span>
                  </div>
                  {calculatedSalary.special > 0 && (
                    <div className="flex justify-between">
                      <span>Special Allowance:</span>
                      <span className="font-medium">₹{calculatedSalary.special.toLocaleString()}</span>
                    </div>
                  )}
                  {calculatedSalary.conveyance > 0 && (
                    <div className="flex justify-between">
                      <span>Conveyance:</span>
                      <span className="font-medium">₹{calculatedSalary.conveyance.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
                    <div className="flex justify-between">
                      <span className="font-bold text-green-800">Gross Salary:</span>
                      <span className="font-bold text-green-800 text-lg">₹{calculatedSalary.gross.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h6 className="font-medium text-red-700">Deductions:</h6>
                  <div className="flex justify-between">
                    <span>TDS:</span>
                    <span className="font-medium">₹{calculatedSalary.tds.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>EPF:</span>
                    <span className="font-medium">₹{calculatedSalary.epf.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Professional Tax:</span>
                    <span className="font-medium">₹{calculatedSalary.pt.toLocaleString()}</span>
                  </div>
                  {calculatedSalary.esi > 0 && (
                    <div className="flex justify-between">
                      <span>ESI:</span>
                      <span className="font-medium">₹{calculatedSalary.esi.toLocaleString()}</span>
                    </div>
                  )}
                  {calculatedSalary.loan > 0 && (
                    <div className="flex justify-between">
                      <span>Loan/Advance:</span>
                      <span className="font-medium">₹{calculatedSalary.loan.toLocaleString()}</span>
                    </div>
                  )}
                  {calculatedSalary.insurance > 0 && (
                    <div className="flex justify-between">
                      <span>Insurance:</span>
                      <span className="font-medium">₹{calculatedSalary.insurance.toLocaleString()}</span>
                    </div>
                  )}
                  {calculatedSalary.otherDed > 0 && (
                    <div className="flex justify-between">
                      <span>Other Deductions:</span>
                      <span className="font-medium">₹{calculatedSalary.otherDed.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-300">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total Deductions:</span>
                      <span className="font-bold text-red-600">₹{calculatedSalary.totalDeductions.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
                    <div className="flex justify-between">
                      <span className="font-bold text-blue-800">Net Salary:</span>
                      <span className="font-bold text-blue-800 text-lg">₹{calculatedSalary.netSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Calculation Information */}
              {calculatedSalary.isProRata && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h6 className="font-semibold text-yellow-800 mb-2 flex items-center">
                    📅 Daily Salary Calculation Applied
                  </h6>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-yellow-100 p-3 rounded-md">
                      <span className="text-yellow-700 font-medium">Full Month Salary:</span>
                      <div className="text-yellow-800 font-bold text-lg">₹{calculatedSalary.fullMonthSalary?.toLocaleString()}</div>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-md">
                      <span className="text-yellow-700 font-medium">Per Day Rate:</span>
                      <div className="text-yellow-800 font-bold text-lg">₹{calculatedSalary.perDayRate?.toLocaleString()}</div>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-md">
                      <span className="text-yellow-700 font-medium">Working Days:</span>
                      <div className="text-yellow-800 font-bold text-lg">{calculatedSalary.workingDays}</div>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-md">
                      <span className="text-yellow-700 font-medium">Percentage:</span>
                      <div className="text-yellow-800 font-bold text-lg">{(calculatedSalary.dailyRate * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-yellow-100 rounded-md">
                    <p className="text-yellow-800 text-sm">
                      <span className="font-semibold">💡 Calculation:</span>
                      Full Month Salary (₹{calculatedSalary.fullMonthSalary?.toLocaleString()}) ÷ {calculatedSalary.totalMonthDays} days = ₹{calculatedSalary.perDayRate?.toLocaleString()} per day × {calculatedSalary.workingDays} working days = ₹{calculatedSalary.gross?.toLocaleString()} gross salary
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <span className="font-semibold">💡 Annual Calculation:</span> Monthly Net × 12 = ₹{(calculatedSalary.netSalary * 12).toLocaleString()} per year
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Salary Slip Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <span className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-3">🧾</span>
            Salary Slip Generator
          </h2>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-purple-800 text-sm mb-4">
              <span className="font-semibold">📋 Instructions:</span>
              First calculate and save salary using the calculator above, then generate professional salary slips for any month/year.
            </p>

            <button
              onClick={() => setShowSalarySlipModal(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <span className="mr-2">🧾</span>
              Generate Salary Slip
            </button>
          </div>
        </div>

        {/* Salary Slip Modal */}
        {showSalarySlipModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Generate Salary Slip
                </h2>
              </div>

              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Important Steps Before Generating Salary Slip:</h3>
                <ol className="list-decimal list-inside text-yellow-700 text-sm space-y-1">
                  <li>Go to "Actual Salary" tab above (if not already done)</li>
                  <li>Select Teaching Staff and fill in all required details</li>
                  <li>Enter employee name, month, present days, total days, and salary</li>
                  <li>Click "💰 Calculate Salary" button</li>
                  <li>Click "💾 Save Salary Record" button</li>
                  <li>Then come back here to generate the salary slip</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                  <select
                    value={salarySlipEmployee}
                    onChange={(e) => setSalarySlipEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose employee...</option>
                    {availableEmployees.map((employee, index) => (
                      <option key={index} value={employee}>{employee}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
                  <select
                    value={salarySlipMonth}
                    onChange={(e) => setSalarySlipMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose month...</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Year</label>
                  <select
                    value={salarySlipYear}
                    onChange={(e) => setSalarySlipYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                    <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                    <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                <button
                  onClick={generateSalarySlip}
                  disabled={generatingSlip}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {generatingSlip ? 'Generating...' : '🧾 Generate Slip'}
                </button>
                
                <button
                  onClick={() => {
                    // Quick redirect to calculator section
                    setShowSalarySlipModal(false);
                    setSalaryCalculationType('actual');
                    setStaffType('teaching');
                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📊 Go to Calculator
                </button>
                
                <button
                  onClick={resetSalarySlip}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowSalarySlipModal(false)}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Close
                </button>
              </div>

              {/* Salary Slip Display */}
              {salarySlip && (
                <div className="border-t pt-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Salary Slip Generated</h3>
                    <p className="text-gray-600">
                      Employee: {salarySlip.faculty?.personalInfo?.fullName || 
                                salarySlip.faculty?.fullName || 
                                `${salarySlip.faculty?.firstName || ''} ${salarySlip.faculty?.lastName || ''}`.trim() || 
                                'Unknown Employee'} |
                      Month: {salarySlip.month} {salarySlip.year} |
                      Net Salary: ₹{(salarySlip.netSalary).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={printSalarySlip}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      🖨️ Print Salary Slip
                    </button>
                  </div>

                  <div className="bg-green-50 p-3 rounded border text-center mt-4">
                    <p className="text-green-800 text-sm font-medium">
                      ✅ Salary slip is ready for printing!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Salary History</h2>
            <div className="flex gap-3">
              {selectedRecords.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      selectedRecords.forEach(recordId => {
                        const record = salaryHistory.find(r => r._id === recordId);
                        if (record) generateSlipFromHistory(record);
                      });
                    }}
                    disabled={generatingSlip}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Generate Slips ({selectedRecords.length})
                  </button>
                  <button
                    onClick={() => setSelectedRecords([])}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Clear Selection
                  </button>
                </>
              )}
              <button
                onClick={() => generateReport('summary')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Summary Report
              </button>
              <button
                onClick={() => generateReport('detailed')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Detailed Report
              </button>
              <button
                onClick={() => generateReport('monthly')}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Monthly Report
              </button>
              <button
                onClick={fetchSalaryHistory}
                disabled={historyLoading}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Filter Records</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name</label>
                <input
                  type="text"
                  value={historyFilters.employeeName}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, employeeName: e.target.value }))}
                  placeholder="Search employee..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                <select
                  value={historyFilters.month}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, month: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Months</option>
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={historyFilters.year}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Years</option>
                  {[2024, 2023, 2022, 2021, 2020].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={historyFilters.status}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="Calculated">Calculated</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Type</label>
                <select
                  value={historyFilters.salaryType}
                  onChange={(e) => setHistoryFilters(prev => ({ ...prev, salaryType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="Calculated Salary">Calculated Salary</option>
                  <option value="Advance Payment">Advance Payment</option>
                  <option value="Bonus">Bonus</option>
                  <option value="Arrears">Arrears</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setHistoryFilters({
                  employeeName: '',
                  month: '',
                  year: '',
                  status: '',
                  salaryType: ''
                })}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
              >
                Clear Filters
              </button>
              <span className="text-sm text-gray-600 flex items-center">
                Showing {getFilteredHistory().length} of {salaryHistory.length} records
              </span>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {historyLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading salary history...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRecords(getFilteredHistory().map(r => r._id));
                            } else {
                              setSelectedRecords([]);
                            }
                          }}
                          checked={selectedRecords.length === getFilteredHistory().length && getFilteredHistory().length > 0}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month/Year</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary Type</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Salary</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Salary</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Salary</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredHistory().length === 0 ? (
                      <tr>
                        <td colSpan="10" className="px-6 py-8 text-center text-gray-500">
                          {salaryHistory.length === 0 ? 'No salary records found' : 'No records match your filters'}
                        </td>
                      </tr>
                    ) : (
                      getFilteredHistory().map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedRecords.includes(record._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRecords(prev => [...prev, record._id]);
                                } else {
                                  setSelectedRecords(prev => prev.filter(id => id !== record._id));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {record.employeeName || record.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {months.find(m => m.value === parseInt(record.month))?.label || record.month}/{record.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.salaryType || 'Calculated Salary'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            ₹{(parseFloat(record.basicSalary || 0)).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            ₹{(parseFloat(record.grossSalary || record.amount || 0)).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                            ₹{(parseFloat(record.netSalary || 0)).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.status === 'Paid' 
                                ? 'bg-green-100 text-green-800'
                                : record.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {record.status || 'Calculated'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {new Date(record.calculatedOn || record.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => generateSlipFromHistory(record)}
                              disabled={generatingSlip}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 mx-auto"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Slip
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {getFilteredHistory().length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 text-sm font-medium">Total Records</div>
                <div className="text-2xl font-bold text-blue-800">{getFilteredHistory().length}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 text-sm font-medium">Total Gross</div>
                <div className="text-2xl font-bold text-green-800">
                  ₹{getFilteredHistory().reduce((sum, r) => sum + (parseFloat(r.grossSalary || r.amount || 0)), 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-red-600 text-sm font-medium">Total Deductions</div>
                <div className="text-2xl font-bold text-red-800">
                  ₹{getFilteredHistory().reduce((sum, r) => sum + (parseFloat(r.totalDeductions || 0)), 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-purple-600 text-sm font-medium">Total Net</div>
                <div className="text-2xl font-bold text-purple-800">
                  ₹{getFilteredHistory().reduce((sum, r) => sum + (parseFloat(r.netSalary || 0)), 0).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomeTax;
