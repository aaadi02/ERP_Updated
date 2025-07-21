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

  // Salary calculation states
  const [salaryCalculationType, setSalaryCalculationType] = useState('actual');
  const [staffType, setStaffType] = useState('teaching'); // teaching or non-teaching
  const [salaryInputs, setSalaryInputs] = useState({
    employeeName: '', // Employee name for salary record
    basicSalary: '',
    gradePay: '',
    agp: '', // Academic Grade Pay for teaching staff
    payLevel: '',
    hraRate: '',
    city: 'X',
    medicalAllowance: '',
    transportAllowance: '',
    claAllowance: '', // City Compensatory Allowance
    otherAllowances: '',
    tdsDeduction: '',
    epfDeduction: '',
    professionalTax: '' // Professional Tax - manual entry for all calculation types
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
    
    const gross = basicPlusAGP + da + hra + ta + cla + medical + others;
    
    // Deductions
    const tds = parseFloat(salaryInputs.tdsDeduction) || 0;
    const epf = parseFloat(salaryInputs.epfDeduction) || 0;
    const pt = parseFloat(salaryInputs.professionalTax) || 0; // Manual PT entry
    const totalDeductions = tds + epf + pt;
    const netSalary = gross - totalDeductions;
    
    return {
      basic,
      agp,
      basicPlusAGP,
      da,
      hra,
      ta,
      cla,
      medical,
      others,
      gross,
      tds,
      epf,
      pt,
      totalDeductions,
      netSalary,
      type: '6th Pay Commission - Teaching Staff'
    }
  };

  // Calculate 6th Pay Commission Non-Teaching Staff Salary
  const calculateNonTeachingSalary = () => {
    const basic = parseFloat(salaryInputs.basicSalary) || 0;
    const grade = parseFloat(salaryInputs.gradePay) || 0;
    const hraRate = hraRates[salaryInputs.city] || 0.15;
    
    const basicPlusGrade = basic + grade;
    const da = (basicPlusGrade * 164) / 100; // Fixed 164% DA
    const hra = (basicPlusGrade * hraRate);
    const ta = parseFloat(salaryInputs.transportAllowance) || 1600;
    const cla = parseFloat(salaryInputs.claAllowance) || 0;
    const medical = parseFloat(salaryInputs.medicalAllowance) || 500;
    const others = parseFloat(salaryInputs.otherAllowances) || 0;
    
    const gross = basicPlusGrade + da + hra + ta + cla + medical + others;
    
    // Deductions
    const tds = parseFloat(salaryInputs.tdsDeduction) || 0;
    const epf = parseFloat(salaryInputs.epfDeduction) || 0;
    const pt = parseFloat(salaryInputs.professionalTax) || 0; // Manual PT entry
    const totalDeductions = tds + epf + pt;
    const netSalary = gross - totalDeductions;
    
    return {
      basic,
      gradePay: grade,
      basicPlusGrade,
      da,
      hra,
      ta,
      cla,
      medical,
      others,
      gross,
      tds,
      epf,
      pt,
      totalDeductions,
      netSalary,
      type: '6th Pay Commission - Non-Teaching Staff'
    };
  };

  // Calculate Actual Salary
  const calculateActualSalary = () => {
    const basic = parseFloat(salaryInputs.basicSalary) || 0;
    const da = parseFloat(salaryInputs.daRate) || 0;
    const hra = parseFloat(salaryInputs.hraRate) || 0;
    const ta = parseFloat(salaryInputs.transportAllowance) || 0;
    const cla = parseFloat(salaryInputs.claAllowance) || 0;
    const medical = parseFloat(salaryInputs.medicalAllowance) || 0;
    const others = parseFloat(salaryInputs.otherAllowances) || 0;
    
    const gross = basic + da + hra + ta + cla + medical + others;
    
    // Deductions
    const tds = parseFloat(salaryInputs.tdsDeduction) || 0;
    const epf = parseFloat(salaryInputs.epfDeduction) || 0;
    const pt = parseFloat(salaryInputs.professionalTax) || 0; // Manual PT entry
    const totalDeductions = tds + epf + pt;
    const netSalary = gross - totalDeductions;
    
    return {
      basic,
      gradePay: 0,
      agp: 0,
      da,
      hra,
      ta,
      cla,
      medical,
      others,
      gross,
      tds,
      epf,
      pt,
      totalDeductions,
      netSalary,
      type: 'Actual Salary'
    };
  };

  // Handle salary calculation
  const handleSalaryCalculation = () => {
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

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

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
        month: currentMonth,
        year: currentYear,
        status: 'Calculated',
        calculatedOn: new Date().toISOString(),
        hraRate: salaryInputs.city === 'X' ? '15% (Metro)' : salaryInputs.city === 'Y' ? '15% (Non-Metro)' : '15% (Other)',
        city: salaryInputs.city,
        paymentDate: new Date().toISOString().split('T')[0] // Current date as payment date
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
          professionalTax: ''
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
        return (basicPlusAGP * 164) / 100; // 164% DA
      } else {
        const grade = parseFloat(salaryInputs.gradePay) || 0;
        const basicPlusGrade = basic + grade;
        return (basicPlusGrade * 164) / 100; // 164% DA
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
        const da = (basicPlusGrade * 164) / 100;
        const hra = calculateRealTimeHRA();
        const ta = parseFloat(salaryInputs.transportAllowance) || 1600;
        const cla = parseFloat(salaryInputs.claAllowance) || 0;
        const medical = parseFloat(salaryInputs.medicalAllowance) || 500;
        const others = parseFloat(salaryInputs.otherAllowances) || 0;
        const gross = basicPlusGrade + da + hra + ta + cla + medical + others;
        return calculateProfessionalTax(gross);
      }
    }
    return 0;
  };

  useEffect(() => {
    fetchSalaryData();
  }, []);

  const fetchSalaryData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/faculty/salary');
      if (response.ok) {
        const data = await response.json();
        setSalaryData(data);
        
        const uniqueEmployees = [...new Set(data.map(salary => salary.name))];
        setAvailableEmployees(uniqueEmployees);
      } else {
        console.error('Failed to fetch salary data');
      }
    } catch (err) {
      console.error('Error fetching salary data:', err);
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

      // Find selected employee details
      const selectedFacultyName = salarySlipEmployee;
      
      // Fetch faculty data
      const facultyRes = await fetch('http://localhost:5000/api/faculty');
      const facultyData = await facultyRes.json();
      const facultyMember = facultyData.find(f => f.personalInfo?.fullName === selectedFacultyName);
      
      if (!facultyMember) {
        setError('Faculty member not found');
        return;
      }

      // Fetch salary records from our calculator saved data - include year in query
      const salaryRes = await fetch(`http://localhost:5000/api/faculty/salary?name=${encodeURIComponent(selectedFacultyName)}&month=${salarySlipMonth}&year=${salarySlipYear}`);
      if (!salaryRes.ok) {
        throw new Error(`Failed to fetch salary records: ${salaryRes.status}`);
      }
      const salaryRecords = await salaryRes.json();
      
      // Find salary record for the specific month and year
      const salaryRecord = salaryRecords.find(record => {
        const recordMonth = parseInt(record.month);
        const recordYear = parseInt(record.year);
        return recordMonth === parseInt(salarySlipMonth) && recordYear === parseInt(salarySlipYear);
      });

      if (!salaryRecord) {
        setError(`No salary record found for ${selectedFacultyName} in ${months.find(m => m.value === parseInt(salarySlipMonth))?.label} ${salarySlipYear}. Please calculate and save salary first using the calculator above.`);
        return;
      }

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
    } catch (err) {
      setError('Failed to generate salary slip: ' + err.message);
      setSalarySlip(null);
    } finally {
      setGeneratingSlip(false);
    }
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
          <title>Salary Slip - ${salarySlip.faculty.personalInfo.fullName}</title>
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
              <p>Pay Period: ${salarySlip.month} ${salarySlip.year}</p>
            </div>
            
            <div class="employee-info">
              <h2>Employee Information</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span>Employee Name:</span>
                  <span>${salarySlip.faculty.personalInfo.fullName}</span>
                </div>
                <div class="info-item">
                  <span>Employee ID:</span>
                  <span>${salarySlip.faculty.personalInfo.employeeId || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span>Department:</span>
                  <span>${salarySlip.faculty.personalInfo.department || 'N/A'}</span>
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
                  <span>${salarySlip.taxDetails.panNumber || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span>Financial Year:</span>
                  <span>${salarySlip.taxDetails.financialYear || 'N/A'}</span>
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
                    <span>₹${(salarySlip.basicSalary / 12).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>HRA</span>
                    <span>₹${(salarySlip.allowances.hra / 12).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>DA</span>
                    <span>₹${(salarySlip.allowances.da / 12).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Medical Allowance</span>
                    <span>₹${(salarySlip.allowances.medical / 12).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Transport Allowance</span>
                    <span>₹${(salarySlip.allowances.transport / 12).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>CLA</span>
                    <span>₹${(salarySlip.allowances.cla / 12).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Other Allowances</span>
                    <span>₹${(salarySlip.allowances.others / 12).toLocaleString()}</span>
                  </div>
                  <div class="total-row">
                    <div class="salary-item">
                      <span>GROSS SALARY (Monthly)</span>
                      <span>₹${(salarySlip.grossSalary / 12).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div class="salary-column">
                  <h3>DEDUCTIONS</h3>
                  <div class="salary-item">
                    <span>PF</span>
                    <span>₹${(salarySlip.deductions.pf / 12).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>ESI</span>
                    <span>₹${(salarySlip.deductions.esi / 12).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Professional Tax</span>
                    <span>₹${(salarySlip.deductions.professionalTax / 12).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>TDS</span>
                    <span>₹${(salarySlip.deductions.tds / 12).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Income Tax (Monthly)</span>
                    <span>₹${(salarySlip.deductions.incomeTax / 12).toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Other Deductions</span>
                    <span>₹${(salarySlip.deductions.others / 12).toLocaleString()}</span>
                  </div>
                  <div class="total-row">
                    <div class="salary-item">
                      <span>TOTAL DEDUCTIONS (Monthly)</span>
                      <span>₹${(salarySlip.totalDeductions / 12).toLocaleString()}</span>
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
                    <span>${salarySlip.taxDetails.employeeId || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span>Assessment Year:</span>
                    <span>${salarySlip.taxDetails.assessmentYear || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span>Compliance Status:</span>
                    <span>${salarySlip.taxDetails.complianceStatus}</span>
                  </div>
                </div>
                
                <div class="salary-grid" style="margin-top: 20px;">
                  <div class="salary-column">
                    <h4>INCOME BREAKDOWN (From IT Form)</h4>
                    <div class="salary-item">
                      <span>Basic Salary</span>
                      <span>₹${salarySlip.taxDetails.incomeBreakdown.basicSalary.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>HRA</span>
                      <span>₹${salarySlip.taxDetails.incomeBreakdown.hra.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Allowances</span>
                      <span>₹${salarySlip.taxDetails.incomeBreakdown.allowances.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Bonuses</span>
                      <span>₹${salarySlip.taxDetails.incomeBreakdown.bonuses.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Other Income</span>
                      <span>₹${salarySlip.taxDetails.incomeBreakdown.otherIncome.toLocaleString()}</span>
                    </div>
                    <div class="total-row">
                      <div class="salary-item">
                        <span>GROSS INCOME (Annual)</span>
                        <span>₹${salarySlip.taxDetails.incomeBreakdown.grossIncome.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="salary-column">
                    <h4>TAX DEDUCTIONS (From IT Form)</h4>
                    <div class="salary-item">
                      <span>PPF</span>
                      <span>₹${salarySlip.taxDetails.deductions.ppf.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>ELSS</span>
                      <span>₹${salarySlip.taxDetails.deductions.elss.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Life Insurance</span>
                      <span>₹${salarySlip.taxDetails.deductions.lifeInsurance.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Housing Loan</span>
                      <span>₹${salarySlip.taxDetails.deductions.housingLoan.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Tuition Fees</span>
                      <span>₹${salarySlip.taxDetails.deductions.tuitionFees.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Section 80C Total</span>
                      <span>₹${salarySlip.taxDetails.deductions.totalSection80C.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Section 80D</span>
                      <span>₹${salarySlip.taxDetails.deductions.section80D.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Section 80G</span>
                      <span>₹${salarySlip.taxDetails.deductions.section80G.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Section 24</span>
                      <span>₹${salarySlip.taxDetails.deductions.section24.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div class="salary-section" style="margin-top: 20px;">
                  <h4>TAX CALCULATION SUMMARY</h4>
                  <div class="info-grid">
                    <div class="info-item">
                      <span>Taxable Income:</span>
                      <span>₹${salarySlip.taxDetails.taxCalculation.taxableIncome.toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                      <span>Total Tax Liability:</span>
                      <span>₹${salarySlip.taxDetails.taxCalculation.totalTax.toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                      <span>TDS Deducted:</span>
                      <span>₹${salarySlip.taxDetails.taxCalculation.tdsDeducted.toLocaleString()}</span>
                    </div>
                    <div class="info-item">
                      <span>Refund/Due:</span>
                      <span>₹${salarySlip.taxDetails.taxCalculation.refundDue.toLocaleString()}</span>
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
                <p class="amount">₹${(salarySlip.netSalary / 12).toLocaleString()}</p>
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  salaryCalculationType === 'actual' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-blue-600 border border-blue-300'
                }`}
              >
                Actual Salary
              </button>
              <button
                onClick={() => setSalaryCalculationType('6pay')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  salaryCalculationType === '6pay' 
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
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        staffType === 'teaching' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-white text-green-600 border border-green-300'
                      }`}
                    >
                      👨‍🏫 Teaching Staff
                    </button>
                    <button
                      onClick={() => setStaffType('non-teaching')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        staffType === 'non-teaching' 
                          ? 'bg-orange-600 text-white' 
                          : 'bg-white text-orange-600 border border-orange-300'
                      }`}
                    >
                      👩‍💼 Non-Teaching Staff
                    </button>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                        <select
                          value={salaryInputs.employeeName}
                          onChange={(e) => setSalaryInputs({...salaryInputs, employeeName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Employee</option>
                          {availableEmployees.map((employee, index) => (
                            <option key={index} value={employee}>{employee}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Basic Pay</label>
                        <input
                          type="number"
                          value={salaryInputs.basicSalary}
                          onChange={(e) => setSalaryInputs({...salaryInputs, basicSalary: e.target.value})}
                          placeholder="Enter basic pay"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">AGP</label>
                        <select
                          value={salaryInputs.agp}
                          onChange={(e) => setSalaryInputs({...salaryInputs, agp: e.target.value})}
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
                          onChange={(e) => setSalaryInputs({...salaryInputs, city: e.target.value})}
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
                          onChange={(e) => setSalaryInputs({...salaryInputs, transportAllowance: e.target.value})}
                          placeholder="TA amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CLA</label>
                        <input
                          type="number"
                          value={salaryInputs.claAllowance}
                          onChange={(e) => setSalaryInputs({...salaryInputs, claAllowance: e.target.value})}
                          placeholder="CLA amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical Allowance</label>
                        <input
                          type="number"
                          value={salaryInputs.medicalAllowance}
                          onChange={(e) => setSalaryInputs({...salaryInputs, medicalAllowance: e.target.value})}
                          placeholder="Medical allowance"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Other Allowances</label>
                        <input
                          type="number"
                          value={salaryInputs.otherAllowances}
                          onChange={(e) => setSalaryInputs({...salaryInputs, otherAllowances: e.target.value})}
                          placeholder="Other allowances"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TDS</label>
                        <input
                          type="number"
                          value={salaryInputs.tdsDeduction}
                          onChange={(e) => setSalaryInputs({...salaryInputs, tdsDeduction: e.target.value})}
                          placeholder="TDS deduction"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">EPF</label>
                        <input
                          type="number"
                          value={salaryInputs.epfDeduction}
                          onChange={(e) => setSalaryInputs({...salaryInputs, epfDeduction: e.target.value})}
                          placeholder="EPF deduction"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Professional Tax (Manual)</label>
                        <input
                          type="number"
                          value={salaryInputs.professionalTax}
                          onChange={(e) => setSalaryInputs({...salaryInputs, professionalTax: e.target.value})}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                        <select
                          value={salaryInputs.employeeName}
                          onChange={(e) => setSalaryInputs({...salaryInputs, employeeName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Employee</option>
                          {availableEmployees.map((employee, index) => (
                            <option key={index} value={employee}>{employee}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Basic Pay</label>
                        <input
                          type="number"
                          value={salaryInputs.basicSalary}
                          onChange={(e) => setSalaryInputs({...salaryInputs, basicSalary: e.target.value})}
                          placeholder="Enter basic pay"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grade Pay</label>
                        <select
                          value={salaryInputs.gradePay}
                          onChange={(e) => setSalaryInputs({...salaryInputs, gradePay: e.target.value})}
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
                          onChange={(e) => setSalaryInputs({...salaryInputs, city: e.target.value})}
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
                          onChange={(e) => setSalaryInputs({...salaryInputs, transportAllowance: e.target.value})}
                          placeholder="1600"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CLA</label>
                        <input
                          type="number"
                          value={salaryInputs.claAllowance}
                          onChange={(e) => setSalaryInputs({...salaryInputs, claAllowance: e.target.value})}
                          placeholder="CLA amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical Allowance</label>
                        <input
                          type="number"
                          value={salaryInputs.medicalAllowance}
                          onChange={(e) => setSalaryInputs({...salaryInputs, medicalAllowance: e.target.value})}
                          placeholder="500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Other Allowances</label>
                        <input
                          type="number"
                          value={salaryInputs.otherAllowances}
                          onChange={(e) => setSalaryInputs({...salaryInputs, otherAllowances: e.target.value})}
                          placeholder="Other allowances"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TDS</label>
                        <input
                          type="number"
                          value={salaryInputs.tdsDeduction}
                          onChange={(e) => setSalaryInputs({...salaryInputs, tdsDeduction: e.target.value})}
                          placeholder="TDS deduction"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">EPF</label>
                        <input
                          type="number"
                          value={salaryInputs.epfDeduction}
                          onChange={(e) => setSalaryInputs({...salaryInputs, epfDeduction: e.target.value})}
                          placeholder="EPF deduction"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Professional Tax (Manual)</label>
                        <input
                          type="number"
                          value={salaryInputs.professionalTax}
                          onChange={(e) => setSalaryInputs({...salaryInputs, professionalTax: e.target.value})}
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                    <select
                      value={salaryInputs.employeeName}
                      onChange={(e) => setSalaryInputs({...salaryInputs, employeeName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Employee</option>
                      {availableEmployees.map((employee, index) => (
                        <option key={index} value={employee}>{employee}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                    <input
                      type="number"
                      value={salaryInputs.basicSalary}
                      onChange={(e) => setSalaryInputs({...salaryInputs, basicSalary: e.target.value})}
                      placeholder="Basic salary"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">DA</label>
                    <input
                      type="number"
                      value={salaryInputs.daRate}
                      onChange={(e) => setSalaryInputs({...salaryInputs, daRate: e.target.value})}
                      placeholder="DA amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HRA</label>
                    <input
                      type="number"
                      value={salaryInputs.hraRate}
                      onChange={(e) => setSalaryInputs({...salaryInputs, hraRate: e.target.value})}
                      placeholder="HRA amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transport Allowance</label>
                    <input
                      type="number"
                      value={salaryInputs.transportAllowance}
                      onChange={(e) => setSalaryInputs({...salaryInputs, transportAllowance: e.target.value})}
                      placeholder="TA amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CLA</label>
                    <input
                      type="number"
                      value={salaryInputs.claAllowance}
                      onChange={(e) => setSalaryInputs({...salaryInputs, claAllowance: e.target.value})}
                      placeholder="CLA amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical Allowance</label>
                    <input
                      type="number"
                      value={salaryInputs.medicalAllowance}
                      onChange={(e) => setSalaryInputs({...salaryInputs, medicalAllowance: e.target.value})}
                      placeholder="Medical allowance"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Allowances</label>
                    <input
                      type="number"
                      value={salaryInputs.otherAllowances}
                      onChange={(e) => setSalaryInputs({...salaryInputs, otherAllowances: e.target.value})}
                      placeholder="Other allowances"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TDS</label>
                    <input
                      type="number"
                      value={salaryInputs.tdsDeduction}
                      onChange={(e) => setSalaryInputs({...salaryInputs, tdsDeduction: e.target.value})}
                      placeholder="TDS deduction"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">EPF</label>
                    <input
                      type="number"
                      value={salaryInputs.epfDeduction}
                      onChange={(e) => setSalaryInputs({...salaryInputs, epfDeduction: e.target.value})}
                      placeholder="EPF deduction"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional Tax (Manual)</label>
                    <input
                      type="number"
                      value={salaryInputs.professionalTax}
                      onChange={(e) => setSalaryInputs({...salaryInputs, professionalTax: e.target.value})}
                      placeholder="PT amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
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
                {generatingSlip ? 'Generating...' : 'Generate Slip'}
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
                    Employee: {salarySlip.faculty.personalInfo.fullName} | 
                    Month: {salarySlip.month} {salarySlip.year} | 
                    Net Salary: ₹{(salarySlip.netSalary / 12).toLocaleString()}
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
    </div>
  );
};

export default IncomeTax;
