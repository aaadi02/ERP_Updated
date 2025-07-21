import React, { useState, useEffect } from 'react';

const PFProfessionalTax = () => {
  const [pfRecords, setPfRecords] = useState([]);
  const [salaryData, setSalaryData] = useState([]);
  const [incomeTaxData, setIncomeTaxData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [filterFY, setFilterFY] = useState('2024-2025');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConnectionInfo, setShowConnectionInfo] = useState(false);

  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    totalPFContribution: 0,
    totalProfessionalTax: 0,
    avgPFContribution: 0
  });

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    panNumber: '',
    financialYear: '2024-2025',
    basicSalary: '',
    pfNumber: '',
    employeePFContribution: '',
    employerPFContribution: '',
    vpfContribution: '',
    professionalTax: '',
    ptState: 'Karnataka',
    pfEligibleSalary: '',
    totalPFContribution: '',
    pfInterestRate: 8.15,
    remarks: ''
  });

  // Professional Tax slabs for different states
  const professionalTaxSlabs = {
    'Karnataka': [
      { min: 0, max: 15000, tax: 0 },
      { min: 15001, max: 30000, tax: 200 },
      { min: 30001, max: Infinity, tax: 300 }
    ],
    'Maharashtra': [
      { min: 0, max: 5000, tax: 0 },
      { min: 5001, max: 10000, tax: 150 },
      { min: 10001, max: Infinity, tax: 200 }
    ],
    'West Bengal': [
      { min: 0, max: 10000, tax: 0 },
      { min: 10001, max: 15000, tax: 110 },
      { min: 15001, max: 25000, tax: 130 },
      { min: 25001, max: Infinity, tax: 200 }
    ]
  };

  useEffect(() => {
    fetchSalaryData();
    fetchIncomeTaxData();
    fetchPFRecords();
  }, [filterFY]);

  useEffect(() => {
    if (pfRecords.length > 0) {
      calculateDashboardStats();
    }
  }, [pfRecords, filterFY]);

  const fetchIncomeTaxData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterFY) params.append('financialYear', filterFY);
      
      const response = await fetch(`http://localhost:5000/api/income-tax?${params}`);
      if (response.ok) {
        const data = await response.json();
        setIncomeTaxData(data.records || data);
      }
    } catch (err) {
      console.error('Error fetching income tax data:', err);
    }
  };

  const fetchSalaryData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/faculty/salary');
      if (response.ok) {
        const data = await response.json();
        setSalaryData(data);
      }
    } catch (err) {
      console.error('Error fetching salary data:', err);
    }
  };

  const fetchPFRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterFY) params.append('financialYear', filterFY);
      if (searchTerm) params.append('employeeName', searchTerm);

      const response = await fetch(`http://localhost:5000/api/pf?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPfRecords(data.records || data);
      } else {
        setError('Failed to fetch PF records');
      }
    } catch (err) {
      setError('Error fetching PF records: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filterFY) params.append('financialYear', filterFY);

      const response = await fetch(`http://localhost:5000/api/pf/stats/dashboard?${params}`);
      if (response.ok) {
        const stats = await response.json();
        setDashboardStats({
          totalEmployees: stats.totalRecords || 0,
          totalPFContribution: stats.totalPF || 0,
          totalProfessionalTax: stats.totalProfessionalTax || 0,
          avgPFContribution: stats.avgPFContribution || 0
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  // MANUAL CALCULATION MODE - Auto-calculation commented out
  // const calculatePFContributions = (basicSalary) => {
  //   const monthlyBasic = basicSalary / 12;
  //   const pfEligibleSalary = Math.min(monthlyBasic, 15000);
  //   const annualPFEligible = pfEligibleSalary * 12;
  //   const employeePF = Math.round(annualPFEligible * 0.12);
  //   const employerPF = Math.round(annualPFEligible * 0.12);
  //   const totalPF = employeePF + employerPF;
  //   
  //   return {
  //     pfEligibleSalary: annualPFEligible,
  //     employeePFContribution: employeePF,
  //     employerPFContribution: employerPF,
  //     totalPFContribution: totalPF
  //   };
  // };

  // MANUAL CALCULATION MODE - Auto-calculation commented out
  // const calculateProfessionalTax = (monthlySalary, state) => {
  //   const slabs = professionalTaxSlabs[state] || professionalTaxSlabs['Karnataka'];
  //   const slab = slabs.find(s => monthlySalary >= s.min && monthlySalary <= s.max);
  //   return slab ? slab.tax * 12 : 0; // Annual professional tax
  // };

  const handleEmployeeSelect = (employeeName) => {
    setSelectedEmployee(employeeName);
    
    if (employeeName && salaryData.length > 0) {
      const fyStart = formData.financialYear.split('-')[0];
      const fyEnd = formData.financialYear.split('-')[1];
      
      // Calculate annual salary for reference only
      const employeeSalaries = salaryData.filter(salary => 
        salary.name === employeeName && 
        salary.month && 
        (salary.month.startsWith(fyStart) || salary.month.startsWith(fyEnd))
      );
      
      const totalAnnualSalary = employeeSalaries.reduce((total, salary) => total + (salary.amount || 0), 0);
      const basicSalary = Math.round(totalAnnualSalary * 0.6);
      // const monthlySalary = totalAnnualSalary / 12;
      
      // MANUAL CALCULATION MODE - Auto-calculation commented out
      // const pfCalculations = calculatePFContributions(basicSalary);
      // const professionalTax = calculateProfessionalTax(monthlySalary, formData.ptState);
      
      // Generate employee ID and PF number
      const employeeList = getUniqueEmployees();
      const employeeIndex = employeeList.indexOf(employeeName);
      
      setFormData(prev => ({
        ...prev,
        employeeName: employeeName,
        employeeId: `EMP${(employeeIndex + 1).toString().padStart(3, '0')}`,
        basicSalary: basicSalary,
        // MANUAL ENTRY REQUIRED - All PF and PT fields must be entered manually
        // ...pfCalculations,
        // professionalTax: professionalTax,
        pfNumber: `PF${Date.now().toString().slice(-8)}`
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingRecord 
        ? `http://localhost:5000/api/pf/${editingRecord._id}`
        : 'http://localhost:5000/api/pf';
      
      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const savedRecord = await response.json();
        
        // Auto-sync with Income Tax module
        const syncResult = await syncWithIncomeTax(savedRecord.data || formData);
        
        await fetchPFRecords();
        await calculateDashboardStats();
        
        setShowModal(false);
        resetForm();
        setError('');
        
        // Show success message with sync status
        if (syncResult.success) {
          alert(`PF record saved successfully!\n${syncResult.message}`);
        } else {
          alert(`PF record saved successfully!\nWarning: ${syncResult.message}`);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error saving record');
      }
    } catch (err) {
      setError('Error saving record: ' + err.message);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData(record);
    setSelectedEmployee(record.employeeName);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/pf/${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await fetchPFRecords();
          await calculateDashboardStats();
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
      basicSalary: '',
      pfNumber: '',
      employeePFContribution: '',
      employerPFContribution: '',
      vpfContribution: '',
      professionalTax: '',
      ptState: 'Karnataka',
      pfEligibleSalary: '',
      totalPFContribution: '',
      pfInterestRate: 8.15,
      remarks: ''
    });
    setEditingRecord(null);
    setSelectedEmployee('');
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filterFY) params.append('financialYear', filterFY);
      
      const response = await fetch(`http://localhost:5000/api/pf/export/csv?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `pf_professional_tax_${filterFY || 'all'}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setError('Error exporting data');
      }
    } catch (err) {
      setError('Error exporting data: ' + err.message);
    }
  };

  const handleBulkCreate = async () => {
    if (window.confirm('This will create PF records for all employees with salary data. Continue?')) {
      try {
        const response = await fetch('http://localhost:5000/api/pf/bulk-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            financialYear: filterFY,
            ptState: 'Karnataka',
            pfInterestRate: 8.15
          })
        });

        if (response.ok) {
          const result = await response.json();
          alert(`Bulk creation completed!\n${result.successCount} records created\n${result.errorCount} errors`);
          await fetchPFRecords();
          await calculateDashboardStats();
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Error in bulk creation');
        }
      } catch (err) {
        setError('Error in bulk creation: ' + err.message);
      }
    }
  };

  const getUniqueEmployees = () => {
    return [...new Set(salaryData.map(salary => salary.name))];
  };

  const getEmployeeConnections = (employeeName) => {
    const salaryRecords = salaryData.filter(s => s.name === employeeName && 
      s.month && s.month.includes(filterFY.split('-')[0]));
    const incomeTaxRecord = incomeTaxData.find(it => it.employeeName === employeeName);
    const pfRecord = pfRecords.find(pf => pf.employeeName === employeeName);

    return {
      salary: salaryRecords,
      incomeTax: incomeTaxRecord,
      pf: pfRecord,
      totalSalary: salaryRecords.reduce((sum, s) => sum + (s.amount || 0), 0)
    };
  };

  const syncWithIncomeTax = async (pfRecord) => {
    try {
      // Check if income tax record exists for this employee
      const existingIncomeTax = incomeTaxData.find(it => it.employeeName === pfRecord.employeeName);
      
      if (existingIncomeTax) {
        // Update existing income tax record with PF data
        const updateData = {
          employerPF: pfRecord.employerPFContribution,
          professionalTax: pfRecord.professionalTax,
          ppf: pfRecord.employeePFContribution
        };

        const response = await fetch(`http://localhost:5000/api/income-tax/${existingIncomeTax._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          await fetchIncomeTaxData();
          return { success: true, message: 'Income tax record updated with PF data' };
        }
      } else {
        // Create new income tax record with PF data
        const connections = getEmployeeConnections(pfRecord.employeeName);
        const newIncomeTaxData = {
          employeeId: pfRecord.employeeId,
          employeeName: pfRecord.employeeName,
          panNumber: pfRecord.panNumber || '',
          financialYear: pfRecord.financialYear,
          assessmentYear: `${parseInt(pfRecord.financialYear.split('-')[1])}-${parseInt(pfRecord.financialYear.split('-')[1]) + 1}`,
          basicSalary: pfRecord.basicSalary,
          employerPF: pfRecord.employerPFContribution,
          professionalTax: pfRecord.professionalTax,
          ppf: pfRecord.employeePFContribution,
          notes: `Auto-created from PF record on ${new Date().toLocaleDateString()}`
        };

        const response = await fetch('http://localhost:5000/api/income-tax', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newIncomeTaxData)
        });

        if (response.ok) {
          await fetchIncomeTaxData();
          return { success: true, message: 'New income tax record created with PF data' };
        }
      }
    } catch (err) {
      console.error('Error syncing with income tax:', err);
      return { success: false, message: 'Error syncing with income tax: ' + err.message };
    }
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PF & Professional Tax Management 🏦</h1>
        {/* <p className="text-gray-600">Manual Entry System - All PF and Professional Tax calculations must be entered manually</p> */}
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          {/* <p className="text-sm text-yellow-800">
            <span className="font-semibold">⚠️ Manual Calculation Mode:</span> Auto-calculation is disabled. All PF contributions and Professional Tax amounts must be calculated and entered manually.
          </p> */}
        </div>
      </div>

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalEmployees}</p>
            </div>
            <div className="text-blue-500">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total PF Contribution</p>
              <p className="text-2xl font-bold text-green-600">₹{dashboardStats.totalPFContribution.toLocaleString()}</p>
            </div>
            <div className="text-green-500">🏦</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Professional Tax</p>
              <p className="text-2xl font-bold text-orange-600">₹{dashboardStats.totalProfessionalTax.toLocaleString()}</p>
            </div>
            <div className="text-orange-500">📋</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg PF per Employee</p>
              <p className="text-2xl font-bold text-purple-600">₹{Math.round(dashboardStats.avgPFContribution).toLocaleString()}</p>
            </div>
            <div className="text-purple-500">📊</div>
          </div>
        </div>
      </div>

      {/* Data Connection Status */}
      {showConnectionInfo && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-sm border border-purple-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-purple-900">🔗 Data Connections Overview</h3>
            <button
              onClick={() => setShowConnectionInfo(false)}
              className="text-purple-600 hover:text-purple-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h4 className="font-semibold text-green-700 mb-2">💰 Salary Data</h4>
              <p className="text-sm text-gray-600">{salaryData.length} salary records found</p>
              <p className="text-xs text-gray-500">Source for PF calculations</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-700 mb-2">🏦 PF Data</h4>
              <p className="text-sm text-gray-600">{pfRecords.length} PF records found</p>
              <p className="text-xs text-gray-500">Feeds into Income Tax</p>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <h4 className="font-semibold text-orange-700 mb-2">📊 Income Tax Data</h4>
              <p className="text-sm text-gray-600">{incomeTaxData.length} income tax records found</p>
              <p className="text-xs text-gray-500">Uses PF & PT data</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3">Employee Connection Status</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {getUniqueEmployees().map((employee, index) => {
                const connections = getEmployeeConnections(employee);
                return (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                    <span className="font-medium text-gray-800">{employee}</span>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${connections.salary.length > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        Salary: {connections.salary.length}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${connections.pf ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        PF: {connections.pf ? '✓' : '✗'}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${connections.incomeTax ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                        IT: {connections.incomeTax ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PF Rules & Information */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 PF & Professional Tax Guidelines</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-700 mb-3">🏦 Provident Fund Rules</h4>
            <ul className="text-sm space-y-2 text-gray-600">
              <li>• <strong>Employee Contribution:</strong> 12% of basic salary</li>
              <li>• <strong>Employer Contribution:</strong> 12% of basic salary</li>
              <li>• <strong>Maximum Eligible Salary:</strong> ₹15,000 per month</li>
              <li>• <strong>Interest Rate (FY 2024-25):</strong> 8.15% per annum</li>
              <li>• <strong>Tax Benefit:</strong> Employee contribution u/s 80C</li>
              <li>• <strong>Withdrawal:</strong> Tax-free after 5 years of service</li>
            </ul>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <h4 className="font-semibold text-orange-700 mb-3">📋 Professional Tax Slabs</h4>
            <div className="text-sm space-y-2 text-gray-600">
              <div><strong>Karnataka:</strong></div>
              <div>• Up to ₹15,000/month: Nil</div>
              <div>• ₹15,001 - ₹30,000: ₹200/month</div>
              <div>• Above ₹30,000: ₹300/month</div>
              <div className="mt-2"><strong>Annual Maximum:</strong> ₹2,500</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">PF & Professional Tax Records</h3>
            <button
              onClick={() => setShowConnectionInfo(!showConnectionInfo)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${showConnectionInfo ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 hover:bg-purple-50'}`}
            >
              🔗 Data Connections
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add New Record
            </button>
            <button
              onClick={handleBulkCreate}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Bulk Create from Salary
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.open('/faculty/salary', '_blank')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              📊 Manage Salaries
            </button>
            <button
              onClick={() => window.open('/faculty/incometax', '_blank')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              🧾 Income Tax
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
            <option value="2025-2026">2025-2026</option>
            <option value="2024-2025">2024-2025</option>
            <option value="2023-2024">2023-2024</option>
            <option value="2022-2023">2022-2023</option>
            <option value="2021-2022">2021-2022</option>
            <option value="2020-2021">2020-2021</option>
            <option value="2019-2020">2019-2020</option>
            <option value="2018-2019">2018-2019</option>
            <option value="2017-2018">2017-2018</option>
            <option value="2016-2017">2016-2017</option>
          </select>
          <button
            onClick={fetchPFRecords}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Refresh Data
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
        {pfRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-500 text-xl mb-2">🏦</div>
            <p className="text-gray-500">No PF records found. Add a new record to get started.</p>
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
                    PF Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contributions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Professional Tax
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pfRecords
                  .filter(record => 
                    record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    (!filterFY || record.financialYear === filterFY)
                  )
                  .map((record) => (
                  <tr key={record._id || record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{record.employeeName}</div>
                        <div className="text-sm text-gray-500">ID: {record.employeeId}</div>
                        <div className="text-sm text-gray-500">FY: {record.financialYear}</div>
                        {(() => {
                          const connections = getEmployeeConnections(record.employeeName);
                          return (
                            <div className="flex gap-1 mt-1">
                              <span className={`px-1 py-0.5 text-xs rounded ${connections.salary.length > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                S:{connections.salary.length}
                              </span>
                              <span className={`px-1 py-0.5 text-xs rounded ${connections.incomeTax ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                                IT:{connections.incomeTax ? '✓' : '✗'}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">PF No: {record.pfNumber}</div>
                        <div className="text-sm text-gray-500">Basic: ₹{(record.basicSalary || 0).toLocaleString()}</div>
                        <div className="text-sm text-gray-500">Eligible: ₹{(record.pfEligibleSalary || 0).toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-green-600">Employee: ₹{(record.employeePFContribution || 0).toLocaleString()}</div>
                        <div className="text-sm text-blue-600">Employer: ₹{(record.employerPFContribution || 0).toLocaleString()}</div>
                        <div className="text-sm font-medium text-gray-900">Total: ₹{(record.totalPFContribution || 0).toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-orange-600">₹{(record.professionalTax || 0).toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{record.ptState}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(record._id || record.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                        <button
                          onClick={async () => {
                            const result = await syncWithIncomeTax(record);
                            if (result.success) {
                              alert(result.message);
                            } else {
                              setError(result.message);
                            }
                          }}
                          className="text-xs text-purple-600 hover:text-purple-900 text-left"
                          title="Sync PF data with Income Tax module"
                        >
                          🔗 Sync to IT
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-blue-600 focus:outline-none"
                    title="Back"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingRecord ? 'Edit PF & Professional Tax Record' : 'Add New PF & Professional Tax Record'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  title="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Employee Selection */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-900 mb-4">👤 Employee Selection & Data Connections</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">Select Employee</label>
                      <select
                        value={selectedEmployee}
                        onChange={(e) => handleEmployeeSelect(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        required
                      >
                        <option value="">Choose employee...</option>
                        {getUniqueEmployees().map((employee, index) => {
                          const connections = getEmployeeConnections(employee);
                          return (
                            <option key={index} value={employee}>
                              {employee} (Salary: {connections.salary.length}, IT: {connections.incomeTax ? 'Yes' : 'No'})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">Financial Year</label>
                      <select
                        value={formData.financialYear}
                        onChange={(e) => setFormData({...formData, financialYear: e.target.value})}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="2025-2026">2025-2026</option>
                        <option value="2024-2025">2024-2025</option>
                        <option value="2023-2024">2023-2024</option>
                        <option value="2022-2023">2022-2023</option>
                        <option value="2021-2022">2021-2022</option>
                        <option value="2020-2021">2020-2021</option>
                        <option value="2019-2020">2019-2020</option>
                        <option value="2018-2019">2018-2019</option>
                        <option value="2017-2018">2017-2018</option>
                        <option value="2016-2017">2016-2017</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Connection Status for Selected Employee */}
                  {selectedEmployee && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                      <h4 className="text-sm font-semibold text-blue-800 mb-2">📊 Data Available for {selectedEmployee}</h4>
                      {(() => {
                        const connections = getEmployeeConnections(selectedEmployee);
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div className={`p-2 rounded ${connections.salary.length > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                              <div className="font-medium">💰 Salary Records</div>
                              <div>{connections.salary.length} records found</div>
                              {connections.totalSalary > 0 && <div>Total: ₹{connections.totalSalary.toLocaleString()}</div>}
                            </div>
                            <div className={`p-2 rounded ${connections.pf ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'} border`}>
                              <div className="font-medium">🏦 PF Record</div>
                              <div>{connections.pf ? 'Exists' : 'Not found'}</div>
                              {connections.pf && <div>PF: ₹{connections.pf.totalPFContribution?.toLocaleString()}</div>}
                            </div>
                            <div className={`p-2 rounded ${connections.incomeTax ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'} border`}>
                              <div className="font-medium">📊 Income Tax</div>
                              <div>{connections.incomeTax ? 'Exists' : 'Not found'}</div>
                              {connections.incomeTax && <div>Status: {connections.incomeTax.complianceStatus}</div>}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <input
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">PF Number</label>
                      <input
                        type="text"
                        value={formData.pfNumber}
                        onChange={(e) => setFormData({...formData, pfNumber: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* PF Calculations */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🏦 PF Calculations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (Annual)</label>
                      <input
                        type="number"
                        value={formData.basicSalary}
                        onChange={(e) => {
                          // MANUAL CALCULATION MODE - Auto-calculation commented out
                          const basic = parseFloat(e.target.value) || 0;
                          // const pfCalc = calculatePFContributions(basic);
                          setFormData({...formData, basicSalary: basic});
                          // Manual entry required for all PF calculations
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        placeholder="Enter basic salary manually"
                        required
                      />
                      <p className="text-xs text-red-500 mt-1">⚠️ Manual entry required - no auto-calculation</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PF Eligible Salary</label>
                      <input
                        type="number"
                        value={formData.pfEligibleSalary}
                        onChange={(e) => setFormData({...formData, pfEligibleSalary: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        placeholder="Enter PF eligible salary"
                      />
                      <p className="text-xs text-gray-500 mt-1">Max ₹1,80,000 annually (manual entry)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PF Interest Rate (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.pfInterestRate}
                        onChange={(e) => setFormData({...formData, pfInterestRate: parseFloat(e.target.value) || 8.15})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        max="20"
                      />
                    </div>
                  </div>
                </div>

                {/* PF Contributions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">PF Contributions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">Employee PF (12%)</label>
                      <input
                        type="number"
                        value={formData.employeePFContribution}
                        onChange={(e) => setFormData({...formData, employeePFContribution: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        min="0"
                        placeholder="Enter employee PF"
                      />
                      <p className="text-xs text-green-600 mt-1">Manual entry required</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">Employer PF (12%)</label>
                      <input
                        type="number"
                        value={formData.employerPFContribution}
                        onChange={(e) => setFormData({...formData, employerPFContribution: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        placeholder="Enter employer PF"
                      />
                      <p className="text-xs text-blue-600 mt-1">Manual entry required</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">VPF (Voluntary)</label>
                      <input
                        type="number"
                        value={formData.vpfContribution}
                        onChange={(e) => setFormData({...formData, vpfContribution: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        min="0"
                        placeholder="Enter VPF (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total PF</label>
                      <input
                        type="number"
                        value={formData.totalPFContribution}
                        onChange={(e) => setFormData({...formData, totalPFContribution: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500 font-semibold"
                        min="0"
                        placeholder="Enter total PF"
                      />
                      <p className="text-xs text-gray-600 mt-1">Manual calculation required</p>
                    </div>
                  </div>
                </div>

                {/* Professional Tax */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Professional Tax</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <select
                        value={formData.ptState}
                        onChange={(e) => {
                          const state = e.target.value;
                          // MANUAL CALCULATION MODE - Auto-calculation commented out
                          // const monthlySalary = formData.basicSalary / 12;
                          // const professionalTax = calculateProfessionalTax(monthlySalary, state);
                          setFormData({...formData, ptState: state});
                          // Manual entry required for professional tax calculation
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Karnataka">Karnataka</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="West Bengal">West Bengal</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Annual Professional Tax</label>
                      <input
                        type="number"
                        value={formData.professionalTax}
                        onChange={(e) => setFormData({...formData, professionalTax: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-orange-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        max="2500"
                        placeholder="Enter professional tax"
                      />
                      <p className="text-xs text-orange-600 mt-1">Max ₹2,500 per year (manual entry)</p>
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Any additional notes..."
                  />
                </div>

                {/* Data Sync Options */}
                {selectedEmployee && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-purple-900 mb-4">🔗 Data Synchronization</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded border border-purple-200">
                        <div>
                          <div className="font-medium text-purple-800">Sync with Income Tax Module</div>
                          <div className="text-sm text-purple-600">
                            PF and Professional Tax data will be automatically added to the Income Tax module
                          </div>
                        </div>
                        <div className="text-purple-600">
                          {getEmployeeConnections(selectedEmployee).incomeTax ? '✅ Connected' : '🔗 Will Create'}
                        </div>
                      </div>
                      
                      <div className="text-xs text-purple-700 bg-purple-100 p-2 rounded">
                        <strong>Auto-sync includes:</strong> Employee PF Contribution (PPF), Professional Tax, Employer PF
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
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

export default PFProfessionalTax;
