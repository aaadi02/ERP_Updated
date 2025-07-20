import React, { useEffect, useState } from 'react';
// import { calculateDeductionsTotal } from './Salary';

export default function SalarySlip() {
  const [faculty, setFaculty] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [salaryRecords, setSalaryRecords] = useState([]); // Store salary records for selected faculty
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [salarySlip, setSalarySlip] = useState(null);
  const [incomeTaxData, setIncomeTaxData] = useState(null);
  const [salaryLiveSummary, setSalaryLiveSummary] = useState(null);

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

  useEffect(() => {
    // Fetch faculty list
    fetch('http://localhost:5000/api/faculty')
      .then(res => res.json())
      .then(data => {
        setFaculty(data?.data || data || []);
      })
      .catch(err => {
        setError('Failed to load faculty data');
      });
  }, []);

  // Fetch salary records and income tax data for selected faculty
  useEffect(() => {
    if (!selectedFaculty) {
      setSalaryRecords([]);
      setIncomeTaxData(null);
      setSalaryLiveSummary(null);
      return;
    }
    setLoading(true);
    setError(null);
    
    const facultyMember = faculty.find(f => f._id === selectedFaculty);
    if (!facultyMember) {
      setSalaryRecords([]);
      setIncomeTaxData(null);
      setSalaryLiveSummary(null);
      setLoading(false);
      return;
    }

    // Get faculty name safely
    const facultyName = facultyMember.personalInfo?.fullName || facultyMember.fullName || `${facultyMember.firstName || ''} ${facultyMember.lastName || ''}`.trim() || 'Unknown Employee';

    // Fetch salary records
    fetch(`http://localhost:5000/api/faculty/salary?name=${encodeURIComponent(facultyName)}&year=${selectedYear}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch salary records');
        return res.json();
      })
      .then(data => {
        // Filter out invalid records and ensure month is properly formatted
        const validRecords = Array.isArray(data) ? data.filter(rec => {
          if (!rec || !rec.month) {
            console.warn('Salary record missing month field:', rec);
            return false;
          }
          
          // Convert month to string if it's not already
          if (typeof rec.month !== 'string') {
            rec.month = String(rec.month);
          }
          
          // Handle different month formats
          if (rec.month && !rec.month.includes('-')) {
            // If it's just a month number (1-12), convert to current year-month format
            if (/^\d{1,2}$/.test(rec.month)) {
              const currentYear = new Date().getFullYear();
              const monthNum = parseInt(rec.month);
              if (monthNum >= 1 && monthNum <= 12) {
                rec.month = `${currentYear}-${monthNum.toString().padStart(2, '0')}`;
              }
            }
            // If it's a 6-digit number like 202407, convert to YYYY-MM format
            else if (/^\d{6}$/.test(rec.month)) {
              const year = rec.month.substring(0, 4);
              const month = rec.month.substring(4, 6);
              rec.month = `${year}-${month}`;
            }
          }
          
          return rec.month && typeof rec.month === 'string';
        }) : [];
        
        setSalaryRecords(validRecords);
      })
      .catch(() => setSalaryRecords([]))
      .finally(() => {
        // Fetch income tax data using employee ID
        if (facultyMember.employeeId) {
          fetchIncomeTaxData(facultyMember.employeeId);
        }
        setLoading(false);
      });
  }, [selectedFaculty, selectedYear, faculty]);
  
  // Function to fetch income tax data for the selected faculty using employee ID
  const fetchIncomeTaxData = async (employeeId) => {
    try {
      console.log('Fetching income tax data for employee ID:', employeeId);
      
      // Fetch from the backend server with full URL
      const response = await fetch(`http://localhost:5000/api/income-tax/faculty/${employeeId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received income tax data:', data);
        setIncomeTaxData(data);
        
        // Generate live salary summary
        const summary = generateLiveSalarySummary(data);
        setSalaryLiveSummary(summary);
        
        return data;
      } else if (response.status === 404) {
        console.log('No income tax data found for this faculty member');
        setIncomeTaxData(null);
        setSalaryLiveSummary(null);
        return null;
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching income tax data:", error);
      setIncomeTaxData(null);
      setSalaryLiveSummary(null);
      return null;
    }
  };

  // Function to generate live salary summary from backend data
  const generateLiveSalarySummary = (incomeTaxData) => {
    if (!incomeTaxData) return null;

    const grossSalary = incomeTaxData.grossIncome || 0;
    const totalDeductions = incomeTaxData.deductions?.totalDeductions || 0;
    const netSalary = grossSalary - totalDeductions;

    return {
      grossSalary,
      allowances: {
        basic: incomeTaxData.basicSalary || 0,
        hra: incomeTaxData.hra || 0,
        other: incomeTaxData.allowances || 0,
        bonus: incomeTaxData.bonuses || 0
      },
      deductions: {
        providentFund: incomeTaxData.deductions?.employerPF || 0,
        professionalTax: incomeTaxData.deductions?.professionalTax || 0,
        incomeTax: (incomeTaxData.tax?.totalTax || 0) / 12, // Monthly tax
        insurance: incomeTaxData.deductions?.lifeInsurance || 0,
        other: incomeTaxData.deductions?.standardDeduction || 0
      },
      totalDeductions,
      netSalary,
      employeeName: incomeTaxData.employeeName,
      employeeId: incomeTaxData.employeeId,
      financialYear: incomeTaxData.financialYear
    };
  };

  const generateSalarySlip = () => {
    if (!selectedFaculty || !selectedMonth || !selectedYear) {
      setError('Please select faculty, month, and year');
      return;
    }

    setLoading(true);
    setError(null);

    // Find selected faculty
    const facultyMember = faculty.find(f => f._id === selectedFaculty);
    if (!facultyMember) {
      setError('Faculty not found');
      setLoading(false);
      return;
    }

    // Get faculty name safely
    const facultyName = facultyMember.personalInfo?.fullName || facultyMember.fullName || `${facultyMember.firstName || ''} ${facultyMember.lastName || ''}`.trim() || 'Unknown Employee';

    console.log('🎯 Generating salary slip for:', {
      facultyId: selectedFaculty,
      facultyName: facultyName,
      month: selectedMonth,
      year: selectedYear
    });

    // Search salary records directly from salaries collection using employee name
    const searchEmployeeName = facultyName;
    const searchMonth = parseInt(selectedMonth);
    const searchYear = parseInt(selectedYear);

    // Fetch salary records directly from salaries collection
    fetch(`http://localhost:5000/api/faculty/salary?name=${encodeURIComponent(searchEmployeeName)}&month=${searchMonth}&year=${searchYear}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch salary records: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(salaryData => {
        console.log('💰 Received salary data from backend:', salaryData);
        
        if (!Array.isArray(salaryData) || salaryData.length === 0) {
          setError(`No salary record found for "${searchEmployeeName}" in ${months.find(m => m.value === searchMonth)?.label} ${searchYear}. Please ensure salary data exists in the salaries collection.`);
          setSalarySlip(null);
          setLoading(false);
          return;
        }

        // Find exact match for the requested month and year
        const salaryRecord = salaryData.find(record => {
          const recordMonth = parseInt(record.month);
          const recordYear = parseInt(record.year);
          
          console.log('🔍 Comparing salary record:', {
            recordEmployee: record.employeeName,
            recordMonth,
            recordYear,
            searchEmployee: searchEmployeeName,
            searchMonth,
            searchYear,
            employeeMatch: record.employeeName === searchEmployeeName,
            monthMatch: recordMonth === searchMonth,
            yearMatch: recordYear === searchYear
          });
          
          return record.employeeName === searchEmployeeName && 
                 recordMonth === searchMonth && 
                 recordYear === searchYear;
        });

        if (!salaryRecord) {
          const availableRecords = salaryData.map(r => `${r.employeeName} - ${r.month}/${r.year}`).join(', ');
          setError(`No exact salary record found for "${searchEmployeeName}" in ${months.find(m => m.value === searchMonth)?.label} ${searchYear}. Available records: ${availableRecords}`);
          setSalarySlip(null);
          setLoading(false);
          return;
        }

        console.log('✅ Found exact salary record:', salaryRecord);

        // Process the salary record and generate slip
        processDataAndGenerateSlip(salaryRecord, facultyMember);
      })
      .catch(err => {
        console.error('❌ Error fetching salary data:', err);
        setError('Failed to fetch salary data: ' + err.message);
        setSalarySlip(null);
        setLoading(false);
      });
  };

  // Function to process salary data and generate slip
  const processDataAndGenerateSlip = (salaryRecord, facultyMember) => {
    console.log('🏗️ Processing salary record for slip generation:', salaryRecord);

    // Extract data from the actual salary record from salaries collection
    const basicSalary = parseFloat(salaryRecord.basicSalary || 0);
    const allowances = salaryRecord.allowances || {};
    const deductions = salaryRecord.deductions || {};
    
    // Calculate allowances from actual salary data
    const hraAmount = parseFloat(allowances.hra || 0);
    const daAmount = parseFloat(allowances.da || 0);
    const medicalAmount = parseFloat(allowances.medicalAllowance || 0);
    const transportAmount = parseFloat(allowances.transportAllowance || 0);
    const claAmount = parseFloat(allowances.claAllowance || 0);
    const otherAllowancesAmount = parseFloat(allowances.otherAllowances || 0);
    const totalAllowances = hraAmount + daAmount + medicalAmount + transportAmount + claAmount + otherAllowancesAmount;

    // Get gross salary from actual salary record
    const grossSalary = parseFloat(salaryRecord.grossSalary || salaryRecord.amount || basicSalary + totalAllowances);

    // Calculate deductions from actual salary data
    const pfAmount = parseFloat(deductions.epf || deductions.pf || 0);
    const esiAmount = parseFloat(deductions.esi || 0);
    const professionalTaxAmount = parseFloat(deductions.professionalTax || 0);
    const tdsAmount = parseFloat(deductions.tds || 0);
    const incomeTaxAmount = parseFloat(deductions.incomeTax || 0);
    const otherDeductionsAmount = parseFloat(deductions.otherDeductions || 0);
    
    // Get total deductions and net salary from actual salary record
    const totalDeductions = parseFloat(salaryRecord.totalDeductions || (pfAmount + esiAmount + professionalTaxAmount + tdsAmount + incomeTaxAmount + otherDeductionsAmount));
    const netSalary = parseFloat(salaryRecord.netSalary || (grossSalary - totalDeductions));

    // Create comprehensive salary slip object with actual data from salaries collection
    const slip = {
      faculty: facultyMember,
      month: months.find(m => m.value === parseInt(selectedMonth))?.label,
      year: selectedYear,
      basicSalary: basicSalary,
      agp: parseFloat(salaryRecord.agp || 0),
      gradePay: parseFloat(salaryRecord.gradePay || 0),
      allowances: {
        hra: hraAmount,
        da: daAmount,
        medical: medicalAmount,
        transport: transportAmount,
        others: otherAllowancesAmount
      },
      deductions: {
        pf: pfAmount,
        esi: esiAmount,
        professionalTax: professionalTaxAmount,
        incomeTax: incomeTaxAmount,
        others: otherDeductionsAmount
      },
      totalAllowances: totalAllowances,
      grossSalary: grossSalary,
      totalDeductions: totalDeductions,
      netSalary: netSalary,
      salaryStatus: salaryRecord.status || 'Generated',
      paymentId: salaryRecord._id,
      paymentDate: salaryRecord.paymentDate || salaryRecord.calculatedOn,
      generatedOn: new Date().toLocaleDateString(),
      salaryType: salaryRecord.salaryType || 'Regular Salary',
      hraRate: salaryRecord.hraRate || '15%',
      city: salaryRecord.city || 'N/A',
      employeeId: facultyMember.employeeId,
      // Additional salary record details
      recordDetails: {
        recordId: salaryRecord._id,
        calculatedOn: salaryRecord.calculatedOn,
        lastModified: salaryRecord.updatedAt || salaryRecord.calculatedOn,
        payslipNumber: `PS-${salaryRecord.year}-${String(salaryRecord.month).padStart(2, '0')}-${facultyMember.employeeId}`,
        salaryPeriod: `${months.find(m => m.value === parseInt(selectedMonth))?.label} ${selectedYear}`,
        dataSource: 'Salaries Collection - Real Database'
      }
    };

    console.log('✅ Generated salary slip with real salaries collection data:', slip);
    setSalarySlip(slip);
    setLoading(false);
  };

  const printSalarySlip = () => {
    if (!salarySlip) return;

    // Get faculty details safely
    const facultyName = salarySlip.faculty?.personalInfo?.fullName || salarySlip.faculty?.fullName || `${salarySlip.faculty?.firstName || ''} ${salarySlip.faculty?.lastName || ''}`.trim() || 'Unknown Employee';
    const employeeId = salarySlip.faculty?.employeeId || salarySlip.faculty?.personalInfo?.employeeId || 'N/A';
    const department = salarySlip.faculty?.employmentInfo?.department || salarySlip.faculty?.department || 'N/A';
    const designation = salarySlip.faculty?.employmentInfo?.designation || salarySlip.faculty?.designation || 'N/A';

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
              position: relative;
            }
            .document-id {
              position: absolute;
              top: 15px;
              right: 25px;
              background: rgba(255,255,255,0.95);
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              color: #1a365d;
              border: 1px solid #1a365d;
              z-index: 10;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: #ffffff;
              color: #333333;
              padding: 0;
              margin-bottom: 0;
              position: relative;
              overflow: hidden;
            }
            .header-border {
              height: 1px;
              background: rgba(0,0,0,0.5);
              margin: 15px 15px 0 15px;
            }
            .header-underline {
              height: 1px;
              background: rgba(0,0,0,0.5);
              margin: 8px 20px 0 20px;
            }
            .header-content {
              position: relative;
              z-index: 1;
              padding: 15px 20px;
              text-align: center;
            }
            .institute-details {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 24px;
              margin-bottom: 8px;
              width: 100%;
            }
            .left-logo, .right-logo {
              width: 60px;
              height: 60px;
              object-fit: contain;
              display: block;
            }
            .institute-content {
              flex: 1;
              text-align: center;
              min-width: 0;
            }
            .society-name {
              font-size: 8px;
              font-weight: normal;
              color: #333333;
              margin-bottom: 3px;
              text-transform: lowercase;
            }
            .institute-name {
              font-size: 25px;
              font-weight: bold;
              color: #333333;
              letter-spacing: 2px;
              margin-bottom: 12px;
            }
            .institute-subname {
              font-size: 14px;
              font-weight: normal;
              color: #333333;
              margin-bottom: 6px;
            }
            .institute-affiliation {
              font-size: 12px;
              color: #333333;
              margin-bottom: 4px;
              font-style: normal;
            }
            .institute-address {
              font-size: 12px;
              color: #333333;
              margin-bottom: 4px;
            }
            .institute-contact {
              font-size: 12px;
              color: #333333;
              margin-bottom: 8px;
            }
            .header-separator {
              height: 0.5px;
              background: #333333;
              margin: 8px 20px;
              position: relative;
            }
            .header-separator::before {
              content: "";
              display: none;
            }
            .slip-title {
              font-size: 18px;
              font-weight: bold;
              margin: 8px 0 3px 0;
              display: inline-block;
              letter-spacing: 1px;
              text-transform: uppercase;
              position: relative;
              color: #333333;
            }
            .slip-title::after {
              content: "";
              display: none;
            }
            .slip-title::before {
              content: "";
              display: none;
            }
            .header-underline {
              height: 0.5px;
              background: #333333;
              margin: 3px 20px 6px 20px;
            }
            .slip-period {
              font-size: 12px;
              font-weight: normal;
              margin-top: 0;
              display: inline-block;
              padding: 0;
              border-radius: 0;
              letter-spacing: 0px;
              background: transparent;
              border: none;
              color: #333333;
            }
            .main-content {
              padding: 30px;
            }
            .employee-info {
              background: #f8f9fa;
              border: 2px solid #e9ecef;
              border-radius: 8px;
              margin-bottom: 25px;
              overflow: hidden;
            }
            .info-header {
              background: #343a40;
              color: white;
              padding: 12px 20px;
              font-weight: bold;
              font-size: 16px;
              letter-spacing: 1px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0;
            }
            .info-item {
              display: grid;
              grid-template-columns: 1fr 1fr;
              border-bottom: 1px solid #dee2e6;
            }
            .info-item:last-child {
              border-bottom: none;
            }
            .info-label, .info-value {
              padding: 12px 20px;
              border-right: 1px solid #dee2e6;
            }
            .info-label {
              background: #f1f3f4;
              font-weight: 600;
              color: #495057;
            }
            .info-value {
              background: white;
              color: #212529;
            }
            .salary-section {
              margin-bottom: 25px;
            }
            .section-title {
              background: linear-gradient(135deg, #1a365d 0%, #2563eb 100%);
              color: white;
              padding: 15px 25px;
              margin: 0 0 15px 0;
              font-size: 18px;
              font-weight: bold;
              text-align: center;
              border-radius: 8px 8px 0 0;
              letter-spacing: 1px;
            }
            .salary-table {
              width: 100%;
              border-collapse: collapse;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }
            .salary-table th {
              background: linear-gradient(135deg, #495057 0%, #6c757d 100%);
              color: white;
              padding: 15px;
              text-align: center;
              font-weight: bold;
              font-size: 14px;
              letter-spacing: 0.5px;
              border: none;
            }
            .salary-table td {
              padding: 12px 15px;
              text-align: left;
              border: 1px solid #dee2e6;
              background: white;
            }
            .salary-table tr:nth-child(even) td {
              background: #f8f9fa;
            }
            .amount {
              text-align: right;
              font-weight: 600;
              font-family: 'Arial', sans-serif;
            }
            .total-row {
              background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%) !important;
              font-weight: bold;
              border-top: 2px solid #2196f3;
            }
            .total-row td {
              background: inherit !important;
              font-size: 15px;
              padding: 15px;
            }
            .net-salary {
              background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%) !important;
              font-size: 18px;
              font-weight: bold;
              border: 2px solid #4caf50;
            }
            .net-salary td {
              background: inherit !important;
              padding: 18px;
              font-size: 16px;
            }
            .amount-words {
              background: #fff3e0;
              border: 2px solid #ff9800;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
              font-weight: 600;
              font-size: 15px;
              color: #e65100;
            }
            .bank-details {
              background: #e8f5e8;
              border: 2px solid #4caf50;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
              font-size: 14px;
            }
            .bank-details h4 {
              margin: 0 0 15px 0;
              color: #2e7d32;
              font-weight: bold;
              font-size: 16px;
            }
            .bank-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .bank-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px dotted #4caf50;
            }
            .bank-label {
              font-weight: 600;
              color: #1b5e20;
            }
            .bank-value {
              color: #2e7d32;
              font-weight: 500;
            }
            .footer {
              margin-top: 40px;
              border-top: 2px solid #1a365d;
              padding-top: 25px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              align-items: end;
            }
            .footer-left {
              text-align: left;
            }
            .footer-right {
              text-align: right;
            }
            .signature-line {
              border-bottom: 2px solid #333;
              margin-bottom: 8px;
              padding-bottom: 40px;
              margin-top: 20px;
            }
            .disclaimer {
              background: #f8f9fa;
              border-left: 4px solid #6c757d;
              padding: 15px 20px;
              margin-top: 25px;
              font-size: 12px;
              color: #6c757d;
              font-style: italic;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(0,0,0,0.03);
              font-weight: bold;
              pointer-events: none;
              z-index: 0;
            }              @media print {
              body { 
                background: white; 
                font-size: 12px;
                color: #000000 !important;
              }
              .slip-container {
                box-shadow: none;
                border: 2px solid #000;
              }
              .no-print { display: none; }
              .salary-table th, .salary-table td {
                font-size: 11px;
                padding: 8px;
                color: #000000 !important;
              }
              .header {
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
              }
              .institute-details {
                gap: 16px;
                margin-bottom: 8px;
              }
              .left-logo, .right-logo {
                width: 100px;
                height: 100px;
              }
              .institute-name {
                font-size: 24px;
                color: #000000 !important;
                print-color-adjust: exact;
              }
              .institute-subname {
                font-size: 16px;
                color: #000000 !important;
                print-color-adjust: exact;
              }
              .society-name, .institute-affiliation, .institute-address, .institute-contact {
                font-size: 10px;
                color: #000000 !important;
                print-color-adjust: exact;
              }
              .slip-title, .slip-period {
                color: #000000 !important;
                print-color-adjust: exact;
              }
            }
            @media (max-width: 768px) {
              .header-top {
                flex-direction: column;
                gap: 15px;
              }
              .college-info {
                text-align: center;
              }
              .college-name {
                font-size: 22px;
              }
            }
          </style>
        </head>
        <body>
          <div class="slip-container">
            <div class="document-id">
              Doc ID: SS-${employeeId}-${salarySlip.month.substring(0,3).toUpperCase()}${salarySlip.year}
            </div>
            <div class="watermark">NIETM</div>
            <div class="header">
              <div class="header-border"></div>
              <div class="header-content">
                <div class="institute-details">
                  <img src="/logo1.png" alt="NIETM Logo" class="left-logo" style="background-color: white; padding: 2px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);" />
                  <div class="institute-content">
                    <div class="society-name">maitrey education society</div>
                    <div class="institute-name">NAGARJUNA</div>
                    <div class="institute-subname">Institute of Engineering, Technology & Management</div>
                    <div class="institute-affiliation">(AICTE, DTE Approved & Affiliated to R.T.M. Nagpur University, Nagpur)</div>
                    <div class="institute-address">Village Satnavri, Amravati Road, Nagpur 440023</div>
                    <div class="institute-contact">Email: maitrey.ngp@gmail.com | Website: www.nietm.in | Phone: 07118 322211, 12</div>
                  </div>
                  <img src="/logo.png" alt="NIETM Logo" class="right-logo" style="background-color: white; padding: 2px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);" />
                </div>
                <div class="header-separator"></div>
                <div class="slip-title" style="color: #000000;">SALARY SLIP</div>
                <div class="slip-period" style="color: #000000;">For the month of ${salarySlip.month} ${salarySlip.year}</div>
                <div class="header-underline"></div>
              </div>
            </div>

            <div class="main-content">
              <div class="employee-info">
                <div class="info-header">Employee Information</div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Employee ID</div>
                    <div class="info-value">${employeeId}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Employee Name</div>
                    <div class="info-value">${facultyName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Department</div>
                    <div class="info-value">${department}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Designation</div>
                    <div class="info-value">${designation}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Date of Joining</div>
                    <div class="info-value">${new Date(salarySlip.faculty.employmentInfo.joiningDate).toLocaleDateString()}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Generated On</div>
                    <div class="info-value">${salarySlip.generatedOn}</div>
                  </div>
                </div>
              </div>

              <div class="salary-section">
                <table class="salary-table">
                  <thead>
                    <tr>
                      <th style="width: 40%;">EARNINGS</th>
                      <th style="width: 15%;">AMOUNT (₹)</th>
                      <th style="width: 30%;">DEDUCTIONS</th>
                      <th style="width: 15%;">AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Basic Salary</strong></td>
                      <td class="amount">${salarySlip.basicSalary.toLocaleString()}</td>
                      <td><strong>Provident Fund (PF)</strong></td>
                      <td class="amount">${salarySlip.deductions.pf.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>House Rent Allowance (HRA)</td>
                      <td class="amount">${salarySlip.allowances.hra.toLocaleString()}</td>
                      <td>Employee State Insurance (ESI)</td>
                      <td class="amount">${salarySlip.deductions.esi.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Dearness Allowance (DA)</td>
                      <td class="amount">${salarySlip.allowances.da.toLocaleString()}</td>
                      <td>Professional Tax</td>
                      <td class="amount">${salarySlip.deductions.professionalTax.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Medical Allowance</td>
                      <td class="amount">${salarySlip.allowances.medical.toLocaleString()}</td>
                      <td>Income Tax (TDS)</td>
                      <td class="amount">${salarySlip.deductions.incomeTax.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Transport Allowance</td>
                      <td class="amount">${salarySlip.allowances.transport.toLocaleString()}</td>
                      <td>Other Deductions</td>
                      <td class="amount">${salarySlip.deductions.others.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td>Other Allowances</td>
                      <td class="amount">${salarySlip.allowances.others.toLocaleString()}</td>
                      <td style="color: #666;">-</td>
                      <td style="color: #666;">-</td>
                    </tr>
                    <tr class="total-row">
                      <td><strong>GROSS SALARY</strong></td>
                      <td class="amount"><strong>₹${salarySlip.grossSalary.toLocaleString()}</strong></td>
                      <td><strong>TOTAL DEDUCTIONS</strong></td>
                      <td class="amount"><strong>₹${salarySlip.totalDeductions.toLocaleString()}</strong></td>
                    </tr>
                    ${/* Calculate and verify if gross salary is correct */
                    console.log('Salary slip verification:', {
                      basicSalary: salarySlip.basicSalary,
                      allowances: {
                        hra: parseFloat(salarySlip.allowances.hra || 0),
                        da: parseFloat(salarySlip.allowances.da || 0),
                        medical: parseFloat(salarySlip.allowances.medical || 0),
                        transport: parseFloat(salarySlip.allowances.transport || 0),
                        others: parseFloat(salarySlip.allowances.others || 0)
                      },
                      allowanceTotal: parseFloat(salarySlip.allowances.hra || 0) + 
                                     parseFloat(salarySlip.allowances.da || 0) + 
                                     parseFloat(salarySlip.allowances.medical || 0) + 
                                     parseFloat(salarySlip.allowances.transport || 0) + 
                                     parseFloat(salarySlip.allowances.others || 0),
                      storedGrossSalary: salarySlip.grossSalary,
                      calculatedGrossSalary: parseFloat(salarySlip.basicSalary) + 
                                            parseFloat(salarySlip.allowances.hra || 0) + 
                                            parseFloat(salarySlip.allowances.da || 0) + 
                                            parseFloat(salarySlip.allowances.medical || 0) + 
                                            parseFloat(salarySlip.allowances.transport || 0) + 
                                            parseFloat(salarySlip.allowances.others || 0)
                    }) || ''}
                    <tr class="net-salary">
                      <td colspan="3"><strong>NET SALARY (Gross Salary - Total Deductions)</strong></td>
                      <td class="amount"><strong>₹${salarySlip.netSalary.toLocaleString()}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="amount-words">
                <strong>Net Salary in Words:</strong> ${numberToWords(salarySlip.netSalary)} Rupees Only
                ${salarySlip.isEstimated ? '<div class="estimated-notice" style="margin-top:10px; color:#b45309; font-size:0.9em; border-top:1px dashed #f59e0b; padding-top:8px;">This is an estimated salary slip based on employee profile data.</div>' : ''}
                ${salarySlip.salaryStatus ? `<div style="margin-top:10px; color:${salarySlip.salaryStatus === 'Paid' ? '#166534' : '#9a3412'}; font-size:0.9em; border-top:1px dashed ${salarySlip.salaryStatus === 'Paid' ? '#22c55e' : '#ea580c'}; padding-top:8px;">Payment Status: ${salarySlip.salaryStatus}${salarySlip.paymentDate ? ` (Paid on ${new Date(salarySlip.paymentDate).toLocaleDateString()})` : ''}</div>` : ''}
              </div>

              <div class="bank-details">
                <h4>Payment Details</h4>
                <div class="bank-grid">
                  <div class="bank-item">
                    <span class="bank-label">Bank Name:</span>
                    <span class="bank-value">${salarySlip.faculty.bankInfo?.bankName || 'State Bank of India'}</span>
                  </div>
                  <div class="bank-item">
                    <span class="bank-label">Account Number:</span>
                    <span class="bank-value">${salarySlip.faculty.bankInfo?.accountNumber || 'XXXX-XXXX-' + (employeeId || '0000').slice(-4)}</span>
                  </div>
                  <div class="bank-item">
                    <span class="bank-label">IFSC Code:</span>
                    <span class="bank-value">${salarySlip.faculty.bankInfo?.ifscCode || 'SBIN0000123'}</span>
                  </div>
                  <div class="bank-item">
                    <span class="bank-label">Payment Mode:</span>
                    <span class="bank-value">Bank Transfer (NEFT)</span>
                  </div>
                </div>
              </div>

              <div class="footer">
                <div class="footer-left">
                  <div><strong>Employee Signature</strong></div>
                  <div class="signature-line"></div>
                  <div>Date: _______________</div>
                </div>
                <div class="footer-right">
                  <div><strong>Authorized Signatory</strong></div>
                  <div class="signature-line"></div>
                  <div>HR Department</div>
                  <div>NIETM</div>
                </div>
              </div>

              <div class="disclaimer">
                <strong>Note:</strong> This is a computer-generated salary slip and does not require a signature. 
                Please verify all details and contact HR department for any discrepancies. 
                Generated on: ${new Date().toLocaleString()}
                ${salarySlip.paymentId ? `<br>Payment Reference: ${salarySlip.paymentId}` : ''}
                ${salarySlip.isFromIncomeTaxData ? '<br><strong>Data Source:</strong> MongoDB Atlas Income Tax Records (Real-time data)' : '<br><strong>Data Source:</strong> Faculty Profile Data'}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const generateReceipt = () => {
    if (!salarySlip) return;

    // Get faculty details safely
    const facultyName = salarySlip.faculty?.personalInfo?.fullName || salarySlip.faculty?.fullName || `${salarySlip.faculty?.firstName || ''} ${salarySlip.faculty?.lastName || ''}`.trim() || 'Unknown Employee';
    const employeeId = salarySlip.faculty?.employeeId || salarySlip.faculty?.personalInfo?.employeeId || 'N/A';
    const department = salarySlip.faculty?.employmentInfo?.department || salarySlip.faculty?.department || 'N/A';
    const designation = salarySlip.faculty?.employmentInfo?.designation || salarySlip.faculty?.designation || 'N/A';

    const receiptWindow = window.open('', '_blank');
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary Payment Receipt - ${facultyName}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background: #f8f9fa;
              line-height: 1.5;
              color: #333;
            }
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: 1px solid #cccccc;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              position: relative;
              overflow: hidden;
            }
            .receipt-header {
              background: #ffffff;
              color: #333333;
              padding: 0;
              position: relative;
              overflow: hidden;
            }
            .receipt-header::before {
              content: '';
              display: none;
            }
            .header-top-border {
              height: 1px;
              background: rgba(0,0,0,0.5);
              margin: 15px 15px 0 15px;
            }
            .header-content {
              position: relative;
              z-index: 2;
              padding: 15px 20px;
              text-align: center;
            }
            .institute-details {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 24px;
              margin-bottom: 8px;
              width: 100%;
            }
            .left-logo, .right-logo {
              width: 60px;
              height: 60px;
              object-fit: contain;
              display: block;
            }
            .institute-content {
              flex: 1;
              text-align: center;
              min-width: 0;
            }
            .society-name {
              font-size: 8px;
              font-weight: normal;
              color: #333333;
              margin-bottom: 3px;
              text-transform: lowercase;
            }
            .institute-name {
              font-size: 25px;
              font-weight: bold;
              color: #333333;
              letter-spacing: 2px;
              margin-bottom: 12px;
            }
            .institute-subname {
              font-size: 14px;
              font-weight: normal;
              color: #333333;
              margin-bottom: 6px;
            }
            .institute-affiliation {
              font-size: 12px;
              color: #333333;
              margin-bottom: 4px;
              font-style: normal;
            }
            .institute-address {
              font-size: 12px;
              color: #333333;
              margin-bottom: 4px;
            }
            .institute-contact {
              font-size: 12px;
              color: #333333;
              margin-bottom: 8px;
            }
            .header-separator {
              height: 0.5px;
              background: #333333;
              margin: 8px 20px;
              position: relative;
            }
            .header-separator::before {
              content: "";
              display: none;
            }
            .receipt-title {
              font-size: 18px;
              font-weight: bold;
              margin: 8px 0 3px 0;
              display: inline-block;
              letter-spacing: 1px;
              text-transform: uppercase;
              position: relative;
              color: #333333;
            }
            .receipt-title::after {
              content: "";
              display: none;
            }
            .receipt-title::before {
              content: "";
              display: none;
            }
            .receipt-no {
              position: absolute;
              top: 20px;
              right: 25px;
              background: rgba(255,255,255,0.95);
              color: #333333;
              padding: 5px 12px;
              border-radius: 15px;
              font-weight: bold;
              font-size: 14px;
            }
            .receipt-body {
              padding: 30px 35px;
              position: relative;
            }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(200, 200, 200, 0.03);
              font-weight: bold;
              pointer-events: none;
              z-index: 0;
              white-space: nowrap;
              letter-spacing: 5px;
            }
            .receipt-section {
              margin-bottom: 30px;
              position: relative;
              z-index: 1;
              background: #ffffff;
              border-radius: 10px;
              box-shadow: 0 3px 10px rgba(0,0,0,0.05);
              padding: 20px;
              border: 1px solid #e6e6e6;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #333333;
              border-bottom: 2px solid #333333;
              padding-bottom: 8px;
              margin-bottom: 15px;
              position: relative;
            }
            .section-title::after {
              content: "";
              position: absolute;
              bottom: -2px;
              left: 0;
              width: 60px;
              height: 2px;
              background: #f59e0b;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .info-item {
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px dotted #e6e6e6;
            }
            .info-label {
              font-weight: 600;
              color: #444;
              font-size: 14px;
              margin-bottom: 5px;
              letter-spacing: 0.3px;
            }
            .info-value {
              color: #222;
              font-size: 16px;
              padding: 3px 0;
              font-weight: 500;
            }
            .payment-details {
              border: 1px solid #d1e7dd;
              border-radius: 10px;
              padding: 20px;
              background: #f0f9f6;
              margin-bottom: 30px;
              box-shadow: 0 3px 10px rgba(0,0,0,0.05);
              border-left: 5px solid #198754;
            }
            .payment-title {
              font-weight: bold;
              color: #198754;
              font-size: 18px;
              margin-bottom: 15px;
              letter-spacing: 0.5px;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .amount-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px dashed #dee2e6;
            }
            .amount-label {
              font-weight: 500;
            }
            .amount-value {
              font-weight: bold;
              font-family: 'Courier New', monospace;
            }
            .total-amount {
              background: #e9f0fd;
              border: 1px solid #c1d7fc;
              border-radius: 5px;
              padding: 12px;
              margin-top: 15px;
              display: flex;
              justify-content: space-between;
              font-weight: bold;
              color: #333333;
            }
            .amount-words {
              background: #fff8e1;
              border-radius: 5px;
              padding: 12px;
              color: #664d03;
              font-style: italic;
              margin-top: 10px;
              text-align: center;
              font-size: 14px;
            }
            .payment-status {
              text-align: center;
              margin: 25px 0;
            }
            .status-paid {
              display: inline-block;
              background: #d1e7dd;
              color: #0a6e31;
              padding: 8px 25px;
              border-radius: 20px;
              font-weight: bold;
              border: 2px solid #75c893;
              letter-spacing: 1px;
              font-size: 18px;
              transform: rotate(-5deg);
            }
            .status-pending {
              display: inline-block;
              background: #fff3cd;
              color: #664d03;
              padding: 8px 25px;
              border-radius: 20px;
              font-weight: bold;
              border: 2px solid #ffda6a;
              letter-spacing: 1px;
              font-size: 18px;
              transform: rotate(-5deg);
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 60px;
              padding: 0 20px;
            }
            .signature {
              text-align: center;
              width: 40%;
              position: relative;
            }
            .signature-line {
              border-top: 2px solid #333333;
              padding-top: 8px;
              margin-bottom: 8px;
              position: relative;
            }
            .signature-line::before {
              content: '';
              position: absolute;
              top: -10px;
              left: 50%;
              transform: translateX(-50%);
              width: 30px;
              height: 20px;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23062c62' width='24' height='24'%3E%3Cpath d='M13.5,17c0,0.55-0.45,1-1,1s-1-0.45-1-1s0.45-1,1-1S13.5,16.45,13.5,17z M12.5,8.5v4.5h-1V8.5H12.5z M12,2 C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8S16.41,20,12,20z'/%3E%3C/svg%3E");
              background-repeat: no-repeat;
              background-position: center;
              background-size: contain;
            }
            .signature-name {
              font-weight: bold;
              font-size: 15px;
              color: #333333;
              margin-bottom: 4px;
            }
            .signature-title {
              font-size: 14px;
              color: #444;
              font-weight: 500;
              padding: 3px 10px;
              background: #f0f5ff;
              border-radius: 12px;
              display: inline-block;
            }
            .receipt-footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 15px;
              color: #333333;
              border-top: 1px solid #cccccc;
              margin-top: 40px;
              border-radius: 0 0 8px 8px;
            }
            .footer-note {
              font-size: 13px;
              color: #555;
              margin-top: 10px;
              line-height: 1.5;
              background: rgba(255,255,255,0.7);
              padding: 10px;
              border-radius: 6px;
              display: inline-block;
            }
            @media print {
              body {
                background: white;
                font-size: 12px;
                color: #000000 !important;
              }
              .receipt-container {
                box-shadow: none;
                border: 1px solid #333333;
              }
              .no-print {
                display: none;
              }
              .receipt-header {
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                print-color-adjust: exact;
              }
              .society-name, .institute-name, .institute-subname, .institute-affiliation, .institute-address, .institute-contact {
                color: #000000 !important;
                print-color-adjust: exact;
              }
              .receipt-title {
                color: #000000 !important;
                print-color-adjust: exact;
              }
              .left-logo, .right-logo {
                width: 30px;
                height: 30px;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="watermark">NIETM</div>
            <div class="receipt-header">
              <div class="header-border"></div>
              <div class="receipt-no">Receipt #: NIETM-SAL-${employeeId}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}</div>
              <div class="header-content">
                <div class="institute-details">
                  <img src="/logo1.png" alt="NIETM Logo" class="left-logo" style="background-color: white; padding: 2px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);" />
                  <div class="institute-content">
                    <div class="society-name">maitrey education society</div>
                    <div class="institute-name">NAGARJUNA</div>
                    <div class="institute-subname">Institute of Engineering, Technology & Management</div>
                    <div class="institute-affiliation">(AICTE, DTE Approved & Affiliated to R.T.M. Nagpur University, Nagpur)</div>
                    <div class="institute-address">Village Satnavri, Amravati Road, Nagpur 440023</div>
                    <div class="institute-contact">Email: maitrey.ngp@gmail.com | Website: www.nietm.in | Phone: 07118 322211, 12</div>
                  </div>
                  <img src="./logo.png" alt="NIETM Logo" class="right-logo" style="background-color: white; padding: 2px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.12);" />
                </div>
                <div class="header-separator"></div>
                <div class="receipt-title">SALARY PAYMENT RECEIPT</div>
                <div class="header-underline"></div>
              </div>
            </div>
            
            <div class="receipt-body">
              <div class="receipt-section">
                <div class="section-title">Employee Information</div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Employee ID:</div>
                    <div class="info-value">${employeeId}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Employee Name:</div>
                    <div class="info-value">${facultyName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Department:</div>
                    <div class="info-value">${department}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Designation:</div>
                    <div class="info-value">${designation}</div>
                  </div>
                </div>
              </div>
              
              <div class="receipt-section">
                <div class="section-title">Payment Details</div>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Payment Period:</div>
                    <div class="info-value">${salarySlip.month} ${salarySlip.year}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Payment Date:</div>
                    <div class="info-value">${salarySlip.paymentDate ? new Date(salarySlip.paymentDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Payment Method:</div>
                    <div class="info-value">Bank Transfer</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Payment Reference:</div>
                    <div class="info-value">${salarySlip.paymentId || 'Not available'}</div>
                  </div>
                </div>
                
                <div class="payment-details">
                  <div class="payment-title">Salary Breakdown</div>
                  <div class="amount-row">
                    <div class="amount-label">Basic Salary</div>
                    <div class="amount-value">₹${salarySlip.basicSalary.toLocaleString()}</div>
                  </div>
                  <div class="amount-row">
                    <div class="amount-label">Allowances (HRA, DA, etc.)</div>
                    <div class="amount-value">₹${(
                      parseFloat(salarySlip.allowances.hra || 0) + 
                      parseFloat(salarySlip.allowances.da || 0) + 
                      parseFloat(salarySlip.allowances.medical || 0) + 
                      parseFloat(salarySlip.allowances.transport || 0) + 
                      parseFloat(salarySlip.allowances.others || 0)
                    ).toLocaleString()}</div>
                  </div>
                  ${/* Debug information to verify calculations */
                  console.log('Receipt calculations:', {
                    basicSalary: salarySlip.basicSalary,
                    allowancesTotal: (
                      parseFloat(salarySlip.allowances.hra || 0) + 
                      parseFloat(salarySlip.allowances.da || 0) + 
                      parseFloat(salarySlip.allowances.medical || 0) + 
                      parseFloat(salarySlip.allowances.transport || 0) + 
                      parseFloat(salarySlip.allowances.others || 0)
                    ),
                    grossSalary: salarySlip.grossSalary,
                    shouldEqual: parseFloat(salarySlip.basicSalary) + 
                      parseFloat(salarySlip.allowances.hra || 0) + 
                      parseFloat(salarySlip.allowances.da || 0) + 
                      parseFloat(salarySlip.allowances.medical || 0) + 
                      parseFloat(salarySlip.allowances.transport || 0) + 
                      parseFloat(salarySlip.allowances.others || 0)
                  }) || ''}
                  <div class="amount-row">
                    <div class="amount-label">Gross Salary</div>
                    <div class="amount-value">₹${salarySlip.grossSalary.toLocaleString()}</div>
                  </div>
                  <div class="amount-row">
                    <div class="amount-label">Total Deductions</div>
                    <div class="amount-value">-₹${salarySlip.totalDeductions.toLocaleString()}</div>
                  </div>
                  
                  <div class="total-amount">
                    <div>NET AMOUNT PAID</div>
                    <div>₹${salarySlip.netSalary.toLocaleString()}</div>
                  </div>
                  
                  <div class="amount-words">
                    <strong>Amount in Words:</strong> ${numberToWords(salarySlip.netSalary)} Rupees Only
                  </div>
                </div>
              </div>
              
              <div class="payment-status">
                <div class="${salarySlip.salaryStatus === 'Paid' ? 'status-paid' : 'status-pending'}">
                  ${salarySlip.salaryStatus || 'PENDING'}
                </div>
              </div>
              
              ${salarySlip.isEstimated ? `
              <div style="background: #fff3cd; border: 1px solid #ffda6a; padding: 10px; margin: 15px 0; border-radius: 5px; text-align: center; color: #664d03;">
                <strong>Note:</strong> This is an estimated receipt based on employee profile data.
              </div>
              ` : ''}
              
              <div class="signatures">
                <div class="signature">
                  <div class="signature-line"></div>
                  <div class="signature-name">Accounts Department</div>
                  <div class="signature-title">NIETM</div>
                </div>
                
                <div class="signature">
                  <div class="signature-line"></div>
                  <div class="signature-name">Director</div>
                  <div class="signature-title">NIETM</div>
                </div>
              </div>
            </div>
            
            <div class="receipt-footer">
              <strong>Thank you for your valuable contribution to NIETM</strong>
              <div class="footer-note">
                This is a computer-generated receipt and does not require a physical signature.<br>
                For any discrepancies, please contact the Finance Department.<br>
                ${salarySlip.isFromIncomeTaxData ? '<strong>Data Source:</strong> MongoDB Atlas Income Tax Records (Real-time data)' : '<strong>Data Source:</strong> Faculty Profile Data'}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    receiptWindow.document.write(receiptContent);
    receiptWindow.document.close();
    receiptWindow.focus();
    
    // Add a slight delay before printing to ensure styles are loaded
    setTimeout(() => {
      receiptWindow.print();
    }, 500);
  };

  // Helper function to convert number to words (simplified)
  const numberToWords = (num) => {
    if (num === 0) return 'Zero';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    const convertHundreds = (n) => {
      let result = '';
      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result;
    };
    
    let result = '';
    if (num >= 10000000) {
      result += convertHundreds(Math.floor(num / 10000000)) + 'Crore ';
      num %= 10000000;
    }
    if (num >= 100000) {
      result += convertHundreds(Math.floor(num / 100000)) + 'Lakh ';
      num %= 100000;
    }
    if (num >= 1000) {
      result += convertHundreds(Math.floor(num / 1000)) + 'Thousand ';
      num %= 1000;
    }
    if (num > 0) {
      result += convertHundreds(num);
    }
    
    return result.trim();
  };

  return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          NIETM Faculty Salary Slip & Receipt Generator
        </h1>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Generate Salary Slip
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Select Faculty Member
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
              >
                <option value="">Choose Faculty Member</option>
                {console.log(faculty)} {/* Debugging: Log faculty data */}
                {faculty?.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.personalInfo?.fullName || f.fullName || `${f.firstName || ''} ${f.lastName || ''}`.trim() || 'Unknown Employee'} ({f.employeeId || f.personalInfo?.employeeId || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V9a2 2 0 00-2-2" />
                </svg>
                Month
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="">
                  {salaryRecords && salaryRecords.length > 0 ? 'Select Month' : 'No salary records available'}
                </option>
                {/* Only show months for which a salary record exists */}
                {salaryRecords && salaryRecords.length > 0 ? salaryRecords.map((rec) => {
                  // Validate rec.month exists and handle different formats
                  if (!rec.month) {
                    return null;
                  }
                  
                  let monthStr = String(rec.month);
                  
                  // Handle different month formats
                  if (!monthStr.includes('-')) {
                    // If it's just a month number (1-12), convert to current year-month format
                    if (/^\d{1,2}$/.test(monthStr)) {
                      const currentYear = new Date().getFullYear();
                      const monthNum = parseInt(monthStr);
                      if (monthNum >= 1 && monthNum <= 12) {
                        monthStr = `${currentYear}-${monthNum.toString().padStart(2, '0')}`;
                      } else {
                        return null;
                      }
                    }
                    // If it's a 6-digit number like 202407, convert to YYYY-MM format
                    else if (/^\d{6}$/.test(monthStr)) {
                      const year = monthStr.substring(0, 4);
                      const month = monthStr.substring(4, 6);
                      monthStr = `${year}-${month}`;
                    } else {
                      return null;
                    }
                  }
                  
                  const [year, month] = monthStr.split('-');
                  if (parseInt(year) !== selectedYear) return null;
                  const monthObj = months.find(m => m.value === parseInt(month));
                  return monthObj ? (
                    <option key={rec.month} value={parseInt(month)}>
                      {monthObj.label}
                    </option>
                  ) : null;
                }) : null}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Year
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={generateSalarySlip}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Slip
                  </>
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Live Salary Summary from Backend Data */}
          {salaryLiveSummary && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 mb-6 border border-green-200">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Live Salary Summary - {salaryLiveSummary.employeeName}
              </h3>
              <div className="text-sm text-gray-600 mb-4">
                Financial Year: {salaryLiveSummary.financialYear} | Employee ID: {salaryLiveSummary.employeeId}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income Section */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Income & Allowances
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Basic Salary:</span>
                      <span className="font-semibold text-green-600">₹{salaryLiveSummary.allowances.basic.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">HRA:</span>
                      <span className="font-semibold text-green-600">₹{salaryLiveSummary.allowances.hra.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Other Allowances:</span>
                      <span className="font-semibold text-green-600">₹{salaryLiveSummary.allowances.other.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bonus:</span>
                      <span className="font-semibold text-green-600">₹{salaryLiveSummary.allowances.bonus.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-800">Gross Salary:</span>
                        <span className="text-green-700">₹{salaryLiveSummary.grossSalary.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                    Deductions
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Provident Fund:</span>
                      <span className="font-semibold text-red-600">₹{salaryLiveSummary.deductions.providentFund.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Professional Tax:</span>
                      <span className="font-semibold text-red-600">₹{salaryLiveSummary.deductions.professionalTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income Tax (Monthly):</span>
                      <span className="font-semibold text-red-600">₹{salaryLiveSummary.deductions.incomeTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insurance:</span>
                      <span className="font-semibold text-red-600">₹{salaryLiveSummary.deductions.insurance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Other Deductions:</span>
                      <span className="font-semibold text-red-600">₹{salaryLiveSummary.deductions.other.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-800">Total Deductions:</span>
                        <span className="text-red-700">₹{salaryLiveSummary.totalDeductions.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-4 text-center">
                <div className="text-lg font-semibold mb-1">Net Salary</div>
                <div className="text-3xl font-bold">₹{salaryLiveSummary.netSalary.toLocaleString()}</div>
                <div className="text-blue-100 text-sm mt-1">
                  {salaryLiveSummary.employeeId ? 'Based on MongoDB Atlas Income Tax Records' : 'Based on Faculty Profile Data'}
                </div>
              </div>
            </div>
          )}
        </div>

        {salarySlip && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Salary Slip Preview
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={printSalarySlip}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Salary Slip
                </button>
                <button
                  onClick={generateReceipt}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Generate Receipt
                </button>
              </div>
            </div>
            
            <div className="border-2 border-blue-200 rounded-lg p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="pb-6 mb-8">
                <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-t-lg overflow-hidden shadow-lg">
                  <div className="h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"></div>
                  <div className="p-6">
                    <div className="flex items-center gap-5 border-b border-white/20 pb-4 mb-4">
                      <img src="/logo1.png" alt="NIETM Logo" className="left-logo bg-white p-2 rounded-md shadow-md" style={{width: '60px', height: '60px', objectFit: 'contain'}} />
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-1 font-serif">Nagarjuna Institute of Engineering, Technology & Management</h3>
                        <p className="text-yellow-300 font-semibold">NIETM</p>
                        
                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            Village Satnavari, Amrawati Road, Nagpur
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                            </svg>
                            +91 9049472992
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            maitrey.ngp@gmail.com
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"></path>
                            </svg>
                            www.nietm.in
                          </div>
                        </div>
                      </div>
                      <img src="/logo.png" alt="NIETM Logo" className="right-logo bg-white p-2 rounded-md shadow-md" style={{width: '60px', height: '60px', objectFit: 'contain'}} />
                    </div>
                    <div className="inline-block bg-white/15 px-6 py-3 rounded border-l-4 border-amber-500 shadow-lg">
                      <h4 className="text-xl font-bold">SALARY SLIP</h4>
                      <p className="text-lg">For the month of {salarySlip.month} {salarySlip.year}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                  <h5 className="font-bold text-lg mb-4 text-gray-800 border-b border-gray-300 pb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Employee Information
                  </h5>
                  <div className="space-y-3">
                    <p className="flex justify-between"><span className="font-medium text-gray-600">Employee ID:</span> <span className="font-semibold">{salarySlip.faculty?.employeeId || 'N/A'}</span></p>
                    <p className="flex justify-between"><span className="font-medium text-gray-600">Name:</span> <span className="font-semibold">{salarySlip.faculty?.personalInfo?.fullName || salarySlip.faculty?.fullName || `${salarySlip.faculty?.firstName || ''} ${salarySlip.faculty?.lastName || ''}`.trim() || 'Unknown Employee'}</span></p>
                    <p className="flex justify-between"><span className="font-medium text-gray-600">Department:</span> <span className="font-semibold">{salarySlip.faculty?.employmentInfo?.department || salarySlip.faculty?.department || 'N/A'}</span></p>
                    <p className="flex justify-between"><span className="font-medium text-gray-600">Designation:</span> <span className="font-semibold">{salarySlip.faculty?.employmentInfo?.designation || salarySlip.faculty?.designation || 'N/A'}</span></p>
                    <p className="flex justify-between"><span className="font-medium text-gray-600">Joining Date:</span> <span className="font-semibold">{salarySlip.faculty?.employmentInfo?.joiningDate ? new Date(salarySlip.faculty.employmentInfo.joiningDate).toLocaleDateString() : 'N/A'}</span></p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
                  <h5 className="font-bold text-lg mb-4 text-gray-800 border-b border-gray-300 pb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Salary Summary
                  </h5>
                  <div className="space-y-3">
                    <p className="flex justify-between"><span className="font-medium text-gray-600">Basic Salary:</span> <span className="font-semibold">₹{salarySlip.basicSalary.toLocaleString()}</span></p>
                    <p className="flex justify-between"><span className="font-medium text-gray-600">Total Allowances:</span> <span className="font-semibold text-green-600">₹{(salarySlip.allowances.hra + salarySlip.allowances.da + salarySlip.allowances.medical + salarySlip.allowances.transport + salarySlip.allowances.others).toLocaleString()}</span></p>
                    <p className="flex justify-between"><span className="font-medium text-gray-600">Gross Salary:</span> <span className="font-semibold text-blue-600">₹{salarySlip.grossSalary.toLocaleString()}</span></p>
                    <p className="flex justify-between"><span className="font-medium text-gray-600">Total Deductions:</span> <span className="font-semibold text-red-600">₹{salarySlip.totalDeductions.toLocaleString()}</span></p>
                    <div className="border-t-2 border-green-500 pt-3">
                      <p className="flex justify-between text-xl font-bold text-green-700">
                        <span>Net Salary:</span> 
                        <span>₹{salarySlip.netSalary.toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-6 text-center">
                <p className="text-lg font-semibold text-amber-800 mb-2">
                  Net Salary in Words: <span className="text-orange-700">{numberToWords(salarySlip.netSalary)} Rupees Only</span>
                </p>
                {salarySlip.isEstimated && (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-md mt-3 text-sm">
                    <svg className="w-5 h-5 inline mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    This is an estimated salary slip based on employee profile, as no salary record was found for this month.
                  </div>
                )}
                {salarySlip.salaryStatus && (
                  <div className={`mt-3 ${salarySlip.salaryStatus === 'Paid' ? 'text-green-600' : 'text-orange-600'} font-semibold`}>
                    Payment Status: {salarySlip.salaryStatus}
                    {salarySlip.paymentDate && ` (Paid on ${new Date(salarySlip.paymentDate).toLocaleDateString()})`}
                  </div>
                )}
                <p className="text-sm text-amber-700 mt-3">
                  This is a preview. You can generate either a detailed salary slip or an official NIETM-styled payment receipt.
                </p>
              </div>
              
              <div className="mt-6 text-center text-xs text-gray-500">
                Generated on: {salarySlip.generatedOn} | NIETM HR System
                {salarySlip.paymentId && ` | Payment ID: ${salarySlip.paymentId}`}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
