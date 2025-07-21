import React, { useState, useEffect } from 'react';

const IncomeTaxSimple = () => {
  const [salaryInputs, setSalaryInputs] = useState({
    employeeName: '',
    salaryMonth: new Date().getMonth() + 1,
    salaryYear: new Date().getFullYear(),
    decidedSalary: '',
    basicSalary: '',
    workingDays: '',
    totalMonthDays: '',
    professionalTax: '',
    epfDeduction: '',
    loanDeduction: '',
    tdsDeduction: ''
  });

  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [error, setError] = useState('');

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

  // Load employees
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/faculty');
        if (response.ok) {
          const facultyData = await response.json();
          const employeeNames = facultyData.map(faculty => faculty.personalInfo?.fullName || 'Unknown');
          setAvailableEmployees(employeeNames);
        }
      } catch (error) {
        setAvailableEmployees(['Sample Employee 1', 'Sample Employee 2', 'Sample Employee 3']);
      }
    };
    loadEmployees();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teaching Staff Daily Salary Calculator</h1>
          <p className="text-gray-600">Calculate daily pro-rata salary for teaching staff</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <span className="font-medium">Error:</span> {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <span className="bg-green-100 text-green-600 p-2 rounded-lg mr-3">👨‍🏫</span>
            Teaching Staff - Daily Calculation
          </h2>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
            <h3 className="font-semibold text-green-800 mb-2">💡 How it works:</h3>
            <p className="text-sm text-green-700">
              Enter decided salary → Add working days → Get daily calculated salary automatically
            </p>
          </div>

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
                onChange={(e) => setSalaryInputs({...salaryInputs, employeeName: e.target.value})}
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
                onChange={(e) => setSalaryInputs({...salaryInputs, salaryMonth: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
              <select
                value={salaryInputs.salaryYear}
                onChange={(e) => setSalaryInputs({...salaryInputs, salaryYear: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>

            {/* Total Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Days in Month *</label>
              <input
                type="number"
                value={salaryInputs.totalMonthDays}
                onChange={(e) => setSalaryInputs({...salaryInputs, totalMonthDays: e.target.value})}
                placeholder="e.g., 30"
                min="28"
                max="31"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Working Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Working Days *</label>
              <input
                type="number"
                value={salaryInputs.workingDays}
                onChange={(e) => setSalaryInputs({...salaryInputs, workingDays: e.target.value})}
                placeholder="e.g., 25"
                min="1"
                max="31"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Decided Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decided Monthly Salary *</label>
              <input
                type="number"
                value={salaryInputs.decidedSalary}
                onChange={(e) => setSalaryInputs({
                  ...salaryInputs, 
                  decidedSalary: e.target.value, 
                  basicSalary: e.target.value // For teaching staff, decided = basic
                })}
                placeholder="e.g., 50000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Basic Salary (Auto-filled) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (Auto-filled)</label>
              <input
                type="number"
                value={salaryInputs.basicSalary}
                onChange={(e) => setSalaryInputs({...salaryInputs, basicSalary: e.target.value})}
                placeholder="Basic salary"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Gross Salary with Daily Calculation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gross Salary 
                <span className="text-xs text-green-600 ml-1">(Daily calculated)</span>
              </label>
              <input
                type="text"
                value={`₹${(() => {
                  const basic = parseFloat(salaryInputs.basicSalary) || 0;
                  let gross = basic;
                  
                  // Apply daily calculation if working days specified
                  const workingDays = parseFloat(salaryInputs.workingDays);
                  const totalDays = parseFloat(salaryInputs.totalMonthDays);
                  
                  if (workingDays > 0 && totalDays > 0 && workingDays < totalDays) {
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
                onChange={(e) => setSalaryInputs({...salaryInputs, professionalTax: e.target.value})}
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
                onChange={(e) => setSalaryInputs({...salaryInputs, epfDeduction: e.target.value})}
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
                onChange={(e) => setSalaryInputs({...salaryInputs, loanDeduction: e.target.value})}
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
                onChange={(e) => setSalaryInputs({...salaryInputs, tdsDeduction: e.target.value})}
                placeholder="TDS deduction"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Net Salary with Daily Calculation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Net Salary 
                <span className="text-xs text-green-600 ml-1">(Daily calculated)</span>
              </label>
              <input
                type="text"
                value={`₹${(() => {
                  const basic = parseFloat(salaryInputs.basicSalary) || 0;
                  let gross = basic;
                  
                  // Deductions
                  let pt = parseFloat(salaryInputs.professionalTax) || 0;
                  let epf = parseFloat(salaryInputs.epfDeduction) || 0;
                  let advance = parseFloat(salaryInputs.loanDeduction) || 0;
                  let tds = parseFloat(salaryInputs.tdsDeduction) || 0;
                  
                  // Apply daily calculation to all amounts
                  const workingDays = parseFloat(salaryInputs.workingDays);
                  const totalDays = parseFloat(salaryInputs.totalMonthDays);
                  
                  if (workingDays > 0 && totalDays > 0 && workingDays < totalDays) {
                    const dailyMultiplier = workingDays / totalDays;
                    gross = gross * dailyMultiplier;
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

          {/* Daily Calculation Info */}
          {salaryInputs.workingDays && salaryInputs.totalMonthDays && salaryInputs.basicSalary && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">📊 Daily Calculation Applied:</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-yellow-100 p-3 rounded-md">
                  <span className="text-yellow-700 font-medium">Full Month Salary:</span>
                  <div className="text-yellow-800 font-bold">₹{parseFloat(salaryInputs.basicSalary).toLocaleString()}</div>
                </div>
                <div className="bg-yellow-100 p-3 rounded-md">
                  <span className="text-yellow-700 font-medium">Per Day Rate:</span>
                  <div className="text-yellow-800 font-bold">₹{(parseFloat(salaryInputs.basicSalary) / parseFloat(salaryInputs.totalMonthDays)).toFixed(2)}</div>
                </div>
                <div className="bg-yellow-100 p-3 rounded-md">
                  <span className="text-yellow-700 font-medium">Working Days:</span>
                  <div className="text-yellow-800 font-bold">{salaryInputs.workingDays} days</div>
                </div>
                <div className="bg-yellow-100 p-3 rounded-md">
                  <span className="text-yellow-700 font-medium">Final %:</span>
                  <div className="text-yellow-800 font-bold">{((parseFloat(salaryInputs.workingDays) / parseFloat(salaryInputs.totalMonthDays)) * 100).toFixed(1)}%</div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-yellow-100 rounded-md">
                <p className="text-yellow-800 text-sm">
                  <span className="font-semibold">💡 Calculation:</span> 
                  ₹{parseFloat(salaryInputs.basicSalary).toLocaleString()} ÷ {salaryInputs.totalMonthDays} days = ₹{(parseFloat(salaryInputs.basicSalary) / parseFloat(salaryInputs.totalMonthDays)).toFixed(2)} per day × {salaryInputs.workingDays} working days = Final Salary
                </p>
              </div>
            </div>
          )}

          {/* Quick Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">🚀 Quick Steps:</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1️⃣ Select employee name and month/year</li>
              <li>2️⃣ Enter total days in month (e.g., 30)</li>
              <li>3️⃣ Enter working days (e.g., 25)</li>
              <li>4️⃣ Enter decided monthly salary</li>
              <li>5️⃣ Add deductions (PT, EPF, Advance, TDS)</li>
              <li>6️⃣ See daily calculated gross and net salary automatically!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeTaxSimple;
