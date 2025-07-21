import React, { useState, useEffect } from 'react';

const IncomeTax = () => {
  const [incomeTaxRecords, setIncomeTaxRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalRecords: 0,
    totalTaxLiability: 0,
    totalAdvanceTaxPaid: 0,
    overdueTax: 0
  });
  const [taxSlabs, setTaxSlabs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFY, setFilterFY] = useState('2024-2025');
  const [complianceFilter, setComplianceFilter] = useState('');
  const [salaryData, setSalaryData] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  // Salary Slip States
  const [showSalarySlipModal, setShowSalarySlipModal] = useState(false);
  const [salarySlipEmployee, setSalarySlipEmployee] = useState('');
  const [salarySlipMonth, setSalarySlipMonth] = useState('');
  const [salarySlipYear, setSalarySlipYear] = useState(new Date().getFullYear());
  const [salarySlip, setSalarySlip] = useState(null);
  const [generatingSlip, setGeneratingSlip] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    panNumber: '',
    financialYear: '2024-2025',
    assessmentYear: '2025-2026',
    basicSalary: '',
    hra: '',
    allowances: '',
    bonuses: '',
    otherIncome: '',
    grossIncome: '',
    ppf: '',
    elss: '',
    lifeInsurance: '',
    housingLoan: '',
    tuitionFees: '',
    totalSection80C: '',
    section80D: '',
    section80G: '',
    section24: '',
    professionalTax: '',
    employerPF: '',
    tdsDeducted: '',
    notes: '',
    remarks: ''
  });

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
    fetchIncomeTaxRecords();
    fetchDashboardStats();
    fetchTaxSlabs();
    fetchSalaryData();
  }, [filterFY, complianceFilter]);

  const fetchIncomeTaxRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterFY) params.append('financialYear', filterFY);
      if (complianceFilter) params.append('complianceStatus', complianceFilter);
      if (searchTerm) params.append('employeeName', searchTerm);

      const response = await fetch(`http://localhost:5000/api/income-tax?${params}`);
      if (response.ok) {
        const data = await response.json();
        setIncomeTaxRecords(data);
      } else {
        setError('Failed to fetch income tax records');
      }
    } catch (err) {
      setError('Error fetching income tax records: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/income-tax/stats/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      } else {
        setDashboardStats({
          totalRecords: 0,
          totalTaxLiability: 0,
          totalAdvanceTaxPaid: 0,
          overduePayments: 0
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setDashboardStats({
        totalRecords: 0,
        totalTaxLiability: 0,
        totalAdvanceTaxPaid: 0,
        overduePayments: 0
      });
    }
  };

  const fetchTaxSlabs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/income-tax/info/tax-slabs');
      if (response.ok) {
        const data = await response.json();
        setTaxSlabs(data);
      } else {
        setTaxSlabs([
          { min: 0, max: 300000, rate: 0, description: 'No tax' },
          { min: 300001, max: 600000, rate: 5, description: '5% tax' },
          { min: 600001, max: 900000, rate: 10, description: '10% tax' },
          { min: 900001, max: 1200000, rate: 15, description: '15% tax' },
          { min: 1200001, max: 1500000, rate: 20, description: '20% tax' },
          { min: 1500001, max: Infinity, rate: 30, description: '30% tax' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching tax slabs:', err);
      setTaxSlabs([
        { min: 0, max: 300000, rate: 0, description: 'No tax' },
        { min: 300001, max: 600000, rate: 5, description: '5% tax' },
        { min: 600001, max: 900000, rate: 10, description: '10% tax' },
        { min: 900001, max: 1200000, rate: 15, description: '15% tax' },
        { min: 1200001, max: 1500000, rate: 20, description: '20% tax' },
        { min: 1500001, max: Infinity, rate: 30, description: '30% tax' }
      ]);
    }
  };

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

  const handleEmployeeSelect = (employeeName) => {
    setSelectedEmployee(employeeName);
    
    // Only set the employee name, all other fields must be entered manually
    if (employeeName) {
      setFormData(prev => ({
        ...prev,
        employeeName: employeeName
      }));
    }
  };

  // Check if current form data would create a duplicate
  const isDuplicateRecord = () => {
    if (editingRecord) return false; // Allow editing existing records
    
    return incomeTaxRecords.some(record => 
      record.employeeName === formData.employeeName && 
      record.financialYear === formData.financialYear
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for duplicate record before submitting (only for new records)
    if (!editingRecord) {
      const existingRecord = incomeTaxRecords.find(record => 
        record.employeeName === formData.employeeName && 
        record.financialYear === formData.financialYear
      );
      
      if (existingRecord) {
        setError(`❌ Duplicate Record: ${formData.employeeName} already has an income tax record for ${formData.financialYear}. Please edit the existing record or choose a different financial year.`);
        return;
      }
    }
    
    try {
      const url = editingRecord 
        ? `http://localhost:5000/api/income-tax/${editingRecord._id}`
        : 'http://localhost:5000/api/income-tax';
      
      const method = editingRecord ? 'PUT' : 'POST';

      // Convert string values to numbers for numeric fields
      const submitData = {
        ...formData,
        basicSalary: parseFloat(formData.basicSalary) || 0,
        hra: parseFloat(formData.hra) || 0,
        allowances: parseFloat(formData.allowances) || 0,
        bonuses: parseFloat(formData.bonuses) || 0,
        otherIncome: parseFloat(formData.otherIncome) || 0,
        grossIncome: parseFloat(formData.grossIncome) || 0,
        ppf: parseFloat(formData.ppf) || 0,
        elss: parseFloat(formData.elss) || 0,
        lifeInsurance: parseFloat(formData.lifeInsurance) || 0,
        housingLoan: parseFloat(formData.housingLoan) || 0,
        tuitionFees: parseFloat(formData.tuitionFees) || 0,
        totalSection80C: parseFloat(formData.totalSection80C) || 0,
        section80D: parseFloat(formData.section80D) || 0,
        section80G: parseFloat(formData.section80G) || 0,
        section24: parseFloat(formData.section24) || 0,
        professionalTax: parseFloat(formData.professionalTax) || 0,
        employerPF: parseFloat(formData.employerPF) || 0,
        tdsDeducted: parseFloat(formData.tdsDeducted) || 0
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        await fetchIncomeTaxRecords();
        await fetchDashboardStats();
        setShowModal(false);
        resetForm();
        setError('');
      } else {
        const errorData = await response.json();
        
        // Handle specific error messages
        if (errorData.message === 'Employee already has a record for this financial year') {
          setError(`❌ Duplicate Record: ${formData.employeeName} already has an income tax record for ${formData.financialYear}. Please edit the existing record or choose a different financial year.`);
        } else {
          setError(errorData.message || 'Error saving record');
        }
        console.error('Submit error:', errorData);
      }
    } catch (err) {
      setError('Error saving record: ' + err.message);
      console.error('Submit error:', err);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      panNumber: record.panNumber,
      financialYear: record.financialYear,
      assessmentYear: record.assessmentYear,
      basicSalary: record.basicSalary,
      hra: record.hra,
      allowances: record.allowances,
      bonuses: record.bonuses,
      otherIncome: record.otherIncome,
      grossIncome: record.grossIncome || '',
      ppf: record.ppf,
      elss: record.elss,
      lifeInsurance: record.lifeInsurance,
      housingLoan: record.housingLoan,
      tuitionFees: record.tuitionFees,
      totalSection80C: record.totalSection80C || '',
      section80D: record.section80D,
      section80G: record.section80G,
      section24: record.section24,
      professionalTax: record.professionalTax,
      employerPF: record.employerPF,
      tdsDeducted: record.tdsDeducted,
      notes: record.notes || '',
      remarks: record.remarks || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/income-tax/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await fetchIncomeTaxRecords();
          await fetchDashboardStats();
        } else {
          setError('Error deleting record');
        }
      } catch (err) {
        setError('Error deleting record: ' + err.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      panNumber: '',
      financialYear: '2024-2025',
      assessmentYear: '2025-2026',
      basicSalary: '',
      hra: '',
      allowances: '',
      bonuses: '',
      otherIncome: '',
      grossIncome: '',
      ppf: '',
      elss: '',
      lifeInsurance: '',
      housingLoan: '',
      tuitionFees: '',
      totalSection80C: '',
      section80D: '',
      section80G: '',
      section24: '',
      professionalTax: '',
      employerPF: '',
      tdsDeducted: '',
      notes: '',
      remarks: ''
    });
    setEditingRecord(null);
    setSelectedEmployee('');
  };

  const getComplianceColor = (status) => {
    switch (status) {
      case 'Compliant': return 'bg-green-100 text-green-800';
      case 'Non-Compliant': return 'bg-red-100 text-red-800';
      case 'Partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filterFY) params.append('financialYear', filterFY);
      
      const response = await fetch(`http://localhost:5000/api/income-tax/export/csv?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `income_tax_${filterFY}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Error exporting data');
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

      // Fetch salary records
      const salaryRes = await fetch(`http://localhost:5000/api/faculty/salary?name=${encodeURIComponent(selectedFacultyName)}&year=${salarySlipYear}`);
      const salaryRecords = await salaryRes.json();
      
      // Find salary record for the specific month
      const salaryRecord = salaryRecords.find(record => {
        const recordMonth = parseInt(record.month);
        return recordMonth === parseInt(salarySlipMonth);
      });

      if (!salaryRecord) {
        setError(`No salary record found for ${selectedFacultyName} in ${months.find(m => m.value === parseInt(salarySlipMonth))?.label} ${salarySlipYear}`);
        return;
      }

      // Fetch income tax data
      const incomeTaxRes = await fetch(`http://localhost:5000/api/income-tax?employeeName=${encodeURIComponent(selectedFacultyName)}`);
      let incomeTaxData = null;
      let monthlyIncomeTax = 0;

      if (incomeTaxRes.ok) {
        const incomeTaxRecords = await incomeTaxRes.json();
        if (Array.isArray(incomeTaxRecords) && incomeTaxRecords.length > 0) {
          incomeTaxData = incomeTaxRecords.sort((a, b) => {
            const yearA = parseInt(a.financialYear.split('-')[0]);
            const yearB = parseInt(b.financialYear.split('-')[0]);
            return yearB - yearA;
          })[0];
          
          const annualTax = parseFloat(incomeTaxData.taxLiability || incomeTaxData.totalTax || 0);
          monthlyIncomeTax = parseFloat((annualTax / 12).toFixed(2));
        }
      }

      // Calculate salary details
      const basicSalary = parseFloat(facultyMember.salaryInfo?.basicSalary || 0);
      const allowances = facultyMember.salaryInfo?.allowances || {};
      const deductions = salaryRecord.deductions || {};
      
      const hraAmount = parseFloat(allowances.hra || 0);
      const daAmount = parseFloat(allowances.da || 0);
      const medicalAmount = parseFloat(allowances.medicalAllowance || 0);
      const transportAmount = parseFloat(allowances.transportAllowance || 0);
      const otherAllowancesAmount = parseFloat(allowances.otherAllowances || 0);
      const totalAllowances = hraAmount + daAmount + medicalAmount + transportAmount + otherAllowancesAmount;

      const grossSalary = parseFloat(salaryRecord.amount || (basicSalary + totalAllowances));

      const pfAmount = parseFloat(deductions.pf || 0);
      const esiAmount = parseFloat(deductions.esi || 0);
      const professionalTaxAmount = parseFloat(deductions.professionalTax || 0);
      const incomeTaxAmount = parseFloat(deductions.incomeTax || monthlyIncomeTax || 0);
      const otherDeductionsAmount = parseFloat(deductions.otherDeductions || 0);
      
      const totalDeductions = pfAmount + esiAmount + professionalTaxAmount + incomeTaxAmount + otherDeductionsAmount;
      const netSalary = grossSalary - totalDeductions;

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
        salaryStatus: salaryRecord.status || 'Pending',
        paymentId: salaryRecord._id,
        paymentDate: salaryRecord.paymentDate,
        generatedOn: new Date().toLocaleDateString(),
        incomeTaxData: incomeTaxData,
        // Complete income tax details for display
        taxDetails: incomeTaxData ? {
          employeeId: incomeTaxData.employeeId,
          panNumber: incomeTaxData.panNumber,
          financialYear: incomeTaxData.financialYear,
          assessmentYear: incomeTaxData.assessmentYear,
          incomeBreakdown: {
            basicSalary: incomeTaxData.basicSalary || 0,
            hra: incomeTaxData.hra || 0,
            allowances: incomeTaxData.allowances || 0,
            bonuses: incomeTaxData.bonuses || 0,
            otherIncome: incomeTaxData.otherIncome || 0,
            grossIncome: incomeTaxData.grossIncome || 0
          },
          deductions: {
            ppf: incomeTaxData.ppf || 0,
            elss: incomeTaxData.elss || 0,
            lifeInsurance: incomeTaxData.lifeInsurance || 0,
            housingLoan: incomeTaxData.housingLoan || 0,
            tuitionFees: incomeTaxData.tuitionFees || 0,
            totalSection80C: incomeTaxData.totalSection80C || 0,
            section80D: incomeTaxData.section80D || 0,
            section80G: incomeTaxData.section80G || 0,
            section24: incomeTaxData.section24 || 0,
            professionalTax: incomeTaxData.professionalTax || 0,
            employerPF: incomeTaxData.employerPF || 0
          },
          taxCalculation: {
            taxableIncome: incomeTaxData.taxableIncome || 0,
            totalTax: incomeTaxData.totalTax || 0,
            tdsDeducted: incomeTaxData.tdsDeducted || 0,
            refundDue: incomeTaxData.refundDue || 0,
            taxLiability: incomeTaxData.taxLiability || 0
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

  const printSalarySlip = () => {
    if (!salarySlip) return;

    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary Slip - ${salarySlip.faculty.personalInfo.fullName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
            .slip-container { max-width: 850px; margin: 0 auto; background: white; border: 3px solid #1a365d; padding: 0; }
            .header { background: #1a365d; color: white; padding: 25px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .employee-info { padding: 25px; background: #f8f9fa; }
            .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
            .info-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6; }
            .salary-details { padding: 25px; }
            .salary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            .salary-column { background: #f8f9fa; padding: 20px; border-radius: 8px; }
            .salary-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
            .total-row { background: #1a365d; color: white; padding: 15px 20px; margin: 20px -20px -20px -20px; }
            .net-salary { background: #28a745; color: white; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px; }
            .net-salary .amount { font-size: 32px; font-weight: bold; }
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
              </div>
            </div>
            
            <div class="salary-details">
              <div class="salary-grid">
                <div class="salary-column">
                  <h3>EARNINGS</h3>
                  <div class="salary-item">
                    <span>Basic Salary</span>
                    <span>₹${salarySlip.basicSalary.toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>HRA</span>
                    <span>₹${salarySlip.allowances.hra.toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>DA</span>
                    <span>₹${salarySlip.allowances.da.toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Medical Allowance</span>
                    <span>₹${salarySlip.allowances.medical.toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Transport Allowance</span>
                    <span>₹${salarySlip.allowances.transport.toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Other Allowances</span>
                    <span>₹${salarySlip.allowances.others.toLocaleString()}</span>
                  </div>
                  <div class="total-row">
                    <div class="salary-item">
                      <span>GROSS SALARY</span>
                      <span>₹${salarySlip.grossSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div class="salary-column">
                  <h3>DEDUCTIONS</h3>
                  <div class="salary-item">
                    <span>PF</span>
                    <span>₹${salarySlip.deductions.pf.toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>ESI</span>
                    <span>₹${salarySlip.deductions.esi.toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Professional Tax</span>
                    <span>₹${salarySlip.deductions.professionalTax.toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Income Tax</span>
                    <span>₹${salarySlip.deductions.incomeTax.toLocaleString()}</span>
                  </div>
                  <div class="salary-item">
                    <span>Other Deductions</span>
                    <span>₹${salarySlip.deductions.others.toLocaleString()}</span>
                  </div>
                  <div class="total-row">
                    <div class="salary-item">
                      <span>TOTAL DEDUCTIONS</span>
                      <span>₹${salarySlip.totalDeductions.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              ${salarySlip.taxDetails ? `
              <div class="salary-section">
                <h3>COMPLETE INCOME TAX DETAILS</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span>Employee ID:</span>
                    <span>${salarySlip.taxDetails.employeeId || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span>PAN Number:</span>
                    <span>${salarySlip.taxDetails.panNumber || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span>Financial Year:</span>
                    <span>${salarySlip.taxDetails.financialYear || 'N/A'}</span>
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
                    <h4>INCOME BREAKDOWN</h4>
                    <div class="salary-item">
                      <span>Basic Salary (IT Form)</span>
                      <span>₹${salarySlip.taxDetails.incomeBreakdown.basicSalary.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>HRA (IT Form)</span>
                      <span>₹${salarySlip.taxDetails.incomeBreakdown.hra.toLocaleString()}</span>
                    </div>
                    <div class="salary-item">
                      <span>Allowances (IT Form)</span>
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
                        <span>GROSS INCOME (IT)</span>
                        <span>₹${salarySlip.taxDetails.incomeBreakdown.grossIncome.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="salary-column">
                    <h4>TAX DEDUCTIONS</h4>
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
                  <h4>NOTES</h4>
                  <p style="padding: 10px; background: #f8f9fa; border-radius: 4px; margin: 0;">${salarySlip.taxDetails.notes}</p>
                </div>
                ` : ''}
                
                ${salarySlip.taxDetails.remarks ? `
                <div class="salary-section">
                  <h4>REMARKS</h4>
                  <p style="padding: 10px; background: #f8f9fa; border-radius: 4px; margin: 0;">${salarySlip.taxDetails.remarks}</p>
                </div>
                ` : ''}
              </div>
              ` : ''}
              
              <div class="net-salary">
                <h3>NET SALARY</h3>
                <p class="amount">₹${salarySlip.netSalary.toLocaleString()}</p>
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

  const resetSalarySlip = () => {
    setSalarySlipEmployee('');
    setSalarySlipMonth('');
    setSalarySlipYear(new Date().getFullYear());
    setSalarySlip(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Income Tax Management 💰</h1>
        <p className="text-gray-600">Complete Income Tax & Salary Slip Management System</p>
      </div>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalRecords ?? 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tax Liability</p>
              <p className="text-2xl font-bold text-red-600">₹{(dashboardStats?.totalTaxLiability ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Advance Tax Paid</p>
              <p className="text-2xl font-bold text-green-600">₹{(dashboardStats?.totalAdvanceTaxPaid ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Employees</p>
              <p className="text-2xl font-bold text-blue-600">{availableEmployees.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Income Tax Record
            </button>
            <button
              onClick={() => setShowSalarySlipModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Generate Salary Slip
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <input
            type="text"
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={filterFY}
            onChange={(e) => setFilterFY(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Financial Years</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
            <option value="2022-2023">2022-2023</option>
          </select>
          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Compliance Status</option>
            <option value="Compliant">Compliant</option>
            <option value="Non-Compliant">Non-Compliant</option>
            <option value="Partial">Partial</option>
          </select>
          <button
            onClick={fetchIncomeTaxRecords}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {incomeTaxRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-500 text-xl mb-2">📊</div>
            <p className="text-gray-500">No income tax records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Income
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Liability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compliance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incomeTaxRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                        <div className="text-sm text-gray-500">ID: {record.employeeId}</div>
                        <div className="text-sm text-gray-500">PAN: {record.panNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.financialYear}</div>
                      <div className="text-sm text-gray-500">AY: {record.assessmentYear}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{(record?.grossIncome ?? 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Taxable: ₹{(record?.taxableIncome ?? 0).toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">₹{(record?.totalTax ?? 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-500">
                        {(record?.refundDue ?? 0) >= 0 ? `Refund: ₹${(record?.refundDue ?? 0).toLocaleString()}` : `Due: ₹${Math.abs(record?.refundDue ?? 0).toLocaleString()}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getComplianceColor(record.complianceStatus)}`}>
                        {record.complianceStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(record._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Salary Slip Modal */}
      {showSalarySlipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Generate Salary Slip</h2>
                <button
                  onClick={() => {
                    setShowSalarySlipModal(false);
                    resetSalarySlip();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      {[2024, 2025, 2026].map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowSalarySlipModal(false);
                      resetSalarySlip();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateSalarySlip}
                    disabled={generatingSlip}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      generatingSlip
                        ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {generatingSlip ? 'Generating...' : 'Generate Slip'}
                  </button>
                </div>

                {/* Salary Slip Display */}
                {salarySlip && (
                  <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Salary Slip Generated</h3>
                      <button
                        onClick={printSalarySlip}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Print Slip
                      </button>
                    </div>
                    
                    <div className="bg-white p-4 rounded border">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Employee:</p>
                          <p className="text-gray-900">{salarySlip.faculty.personalInfo.fullName}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Period:</p>
                          <p className="text-gray-900">{salarySlip.month} {salarySlip.year}</p>
                        </div>
                        {salarySlip.taxDetails && (
                          <>
                            <div>
                              <p className="text-sm font-medium text-gray-600">PAN Number:</p>
                              <p className="text-gray-900">{salarySlip.taxDetails.panNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-600">Financial Year:</p>
                              <p className="text-gray-900">{salarySlip.taxDetails.financialYear}</p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Gross Salary:</p>
                          <p className="text-lg font-bold text-gray-900">₹{salarySlip.grossSalary.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Net Salary:</p>
                          <p className="text-lg font-bold text-green-600">₹{salarySlip.netSalary.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {salarySlip.taxDetails && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Annual Gross Income (IT):</p>
                            <p className="text-lg font-bold text-blue-600">₹{salarySlip.taxDetails.incomeBreakdown.grossIncome.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Annual Tax Liability:</p>
                            <p className="text-lg font-bold text-red-600">₹{salarySlip.taxDetails.taxCalculation.totalTax.toLocaleString()}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 p-3 bg-blue-50 rounded">
                        <p className="text-sm font-medium text-blue-800">Income Tax Deduction: ₹{salarySlip.deductions.incomeTax.toLocaleString()}</p>
                        <p className="text-sm font-medium text-blue-800">Total Deductions: ₹{salarySlip.totalDeductions.toLocaleString()}</p>
                        {salarySlip.taxDetails && (
                          <>
                            <p className="text-sm font-medium text-blue-800">TDS Deducted (Annual): ₹{salarySlip.taxDetails.taxCalculation.tdsDeducted.toLocaleString()}</p>
                            <p className="text-sm font-medium text-blue-800">Compliance Status: {salarySlip.taxDetails.complianceStatus}</p>
                          </>
                        )}
                      </div>
                      
                      {salarySlip.taxDetails && (salarySlip.taxDetails.notes || salarySlip.taxDetails.remarks) && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded">
                          {salarySlip.taxDetails.notes && (
                            <p className="text-sm font-medium text-yellow-800">Notes: {salarySlip.taxDetails.notes}</p>
                          )}
                          {salarySlip.taxDetails.remarks && (
                            <p className="text-sm font-medium text-yellow-800">Remarks: {salarySlip.taxDetails.remarks}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Income Tax Modal - Simplified version */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingRecord ? 'Edit Income Tax Record' : 'Add New Income Tax Record'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                    <select
                      value={selectedEmployee}
                      onChange={(e) => handleEmployeeSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose employee...</option>
                      {availableEmployees.map((employee, index) => (
                        <option key={index} value={employee}>{employee}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year</label>
                    <select
                      value={formData.financialYear}
                      onChange={(e) => setFormData({...formData, financialYear: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="2024-2025">2024-2025</option>
                      <option value="2023-2024">2023-2024</option>
                      <option value="2022-2023">2022-2023</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                    <input
                      type="text"
                      value={formData.employeeName}
                      onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                    <input
                      type="text"
                      value={formData.panNumber}
                      onChange={(e) => setFormData({...formData, panNumber: e.target.value.toUpperCase()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ABCDE1234F"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingRecord ? 'Update Record' : 'Create Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomeTax;
