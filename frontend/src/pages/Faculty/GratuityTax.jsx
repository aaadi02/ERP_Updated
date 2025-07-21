import { useState, useEffect } from "react";

// Stat Card Component
const StatCard = ({ title, value, icon, color, trend }) => (
  <div className={`bg-gradient-to-r ${color} p-6 rounded-2xl text-white shadow-xl transform hover:scale-105 transition-transform duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-orange-100 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-orange-200 text-xs mt-1">{trend}</p>
      </div>
      <div className="text-4xl opacity-80">{icon}</div>
    </div>
  </div>
);

// Faculty Overview Tab Component
const FacultyOverviewTab = ({ facultyData, onSelectFaculty, calculateGratuity, getEligibilityStatus, searchTerm, setSearchTerm, filterStatus, setFilterStatus }) => {
  const filteredData = facultyData.filter(faculty => {
    const matchesSearch = faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faculty.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'eligible' && faculty.isEligible) ||
                         (filterStatus === 'not-eligible' && !faculty.isEligible);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search faculty by name or ID..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Faculty</option>
          <option value="eligible">Eligible for Gratuity</option>
          <option value="not-eligible">Not Eligible</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filteredData.map((faculty) => {
          const eligibility = getEligibilityStatus(faculty);
          const calculation = calculateGratuity(faculty);
          
          return (
            <div 
              key={faculty.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onSelectFaculty(faculty)}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{faculty.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${eligibility.color}`}>
                      {eligibility.text}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Employee ID:</span> {faculty.employeeId}
                    </div>
                    <div>
                      <span className="font-medium">Department:</span> {faculty.department}
                    </div>
                    <div>
                      <span className="font-medium">Service:</span> {faculty.yearsOfService} years
                    </div>
                    <div>
                      <span className="font-medium">Basic Salary:</span> ₹{faculty.basicSalary.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {faculty.isEligible && (
                  <div className="mt-4 lg:mt-0 lg:ml-6 text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ₹{calculation.gratuityAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">Estimated Gratuity</div>
                    <div className="text-sm text-red-600">
                      Tax: ₹{calculation.taxLiability.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Calculations Tab Component
const CalculationsTab = ({ calculations, facultyData }) => {
  const [isExporting, setIsExporting] = useState(false);

  const getFacultyName = (facultyId) => {
    const faculty = facultyData.find(f => f.id === facultyId);
    return faculty ? faculty.name : 'Unknown';
  };

  const exportCalculations = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch('http://localhost:5000/api/gratuity/reports/summary?format=json', {
        headers: authHeaders
      });
      
      if (!response.ok) {
        throw new Error('Failed to export calculations');
      }
      
      const result = await response.json();
      
      // Create and download the file
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `gratuity_calculations_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
    } catch (error) {
      console.error('Error exporting calculations:', error);
      alert('Failed to export calculations. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Gratuity Calculations</h3>
        <button 
          onClick={exportCalculations}
          disabled={isExporting}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-2 rounded-lg"
        >
          {isExporting ? 'Exporting...' : 'Export Calculations'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faculty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calculation Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Years of Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gratuity Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax Liability</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {calculations.map((calc) => (
              <tr key={calc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {getFacultyName(calc.facultyId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(calc.calculationDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {calc.yearsOfService} years
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₹{calc.basicSalary.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                  ₹{calc.gratuityAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                  ₹{calc.taxLiability.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    calc.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {calc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Tax Planning Tab Component
const TaxPlanningTab = ({ facultyData }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const taxSlabs = [
    { range: '₹0 - ₹2,50,000', rate: '0%', description: 'No tax' },
    { range: '₹2,50,001 - ₹5,00,000', rate: '5%', description: 'Standard rate' },
    { range: '₹5,00,001 - ₹10,00,000', rate: '20%', description: 'Higher rate' },
    { range: '₹10,00,000+', rate: '30%', description: 'Highest rate' }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Tax Slabs */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Income Tax Slabs</h3>
          <div className="space-y-3">
            {taxSlabs.map((slab, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg">
                <div>
                  <div className="font-medium text-gray-800">{slab.range}</div>
                  <div className="text-sm text-gray-600">{slab.description}</div>
                </div>
                <div className="text-xl font-bold text-blue-600">{slab.rate}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Gratuity Exemption Rules */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Gratuity Exemption Rules</h3>
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-lg">
              <div className="font-medium text-gray-800">Government Employees</div>
              <div className="text-sm text-gray-600">Fully exempt from tax</div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="font-medium text-gray-800">Private Employees</div>
              <div className="text-sm text-gray-600">Exempt up to ₹20 lakhs</div>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <div className="font-medium text-gray-800">Minimum Service</div>
              <div className="text-sm text-gray-600">5 years continuous service required</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Planning Strategies */}
      <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-xl">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Tax Planning Strategies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">🎯 Timing Strategy</h4>
            <p className="text-sm text-gray-600">Plan retirement timing to optimize tax implications</p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">💰 Salary Structure</h4>
            <p className="text-sm text-gray-600">Optimize basic salary component for gratuity calculation</p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">📊 Investment Planning</h4>
            <p className="text-sm text-gray-600">Use tax-saving investments to reduce overall liability</p>
          </div>
          <div className="p-4 bg-white rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">🔄 Installment Payment</h4>
            <p className="text-sm text-gray-600">Consider staggered payments across financial years</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reports Tab Component
const ReportsTab = ({ facultyData, calculations }) => {
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('current-year');
  const [reportData, setReportData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const token = localStorage.getItem('token');
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Build query parameters based on selected options
      const params = new URLSearchParams();
      if (dateRange !== 'current-year') {
        // Add date filtering logic here
      }

      let endpoint = '';
      switch (reportType) {
        case 'summary':
          endpoint = 'http://localhost:5000/api/gratuity/reports/summary';
          break;
        case 'detailed':
          endpoint = 'http://localhost:5000/api/gratuity/records';
          break;
        case 'tax-analysis':
          endpoint = 'http://localhost:5000/api/gratuity/analytics';
          break;
        default:
          endpoint = 'http://localhost:5000/api/gratuity/reports/summary';
      }

      const response = await fetch(`${endpoint}?${params}`, {
        headers: authHeaders
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const result = await response.json();
      setReportData(result.data || result);
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generateSummaryReport = () => {
    // Use real data from reportData if available, otherwise fallback to props
    if (reportData && reportData.records) {
      const totalGratuity = reportData.records.reduce((sum, record) => sum + (record.gratuityAmount || 0), 0);
      const totalTax = reportData.records.reduce((sum, record) => sum + (record.taxLiability || 0), 0);
      
      return {
        totalFaculty: facultyData.length,
        eligibleFaculty: facultyData.filter(f => f.isEligible).length,
        totalGratuity,
        totalTax,
        avgGratuity: reportData.records.length > 0 ? totalGratuity / reportData.records.length : 0,
        netAmount: totalGratuity - totalTax
      };
    }
    
    // Fallback to calculating from props
    const totalFaculty = facultyData.length;
    const eligibleFaculty = facultyData.filter(f => f.isEligible).length;
    const totalGratuity = calculations.reduce((sum, calc) => sum + calc.gratuityAmount, 0);
    const totalTax = calculations.reduce((sum, calc) => sum + calc.taxLiability, 0);
    const avgGratuity = calculations.length > 0 ? totalGratuity / calculations.length : 0;

    return {
      totalFaculty,
      eligibleFaculty,
      totalGratuity,
      totalTax,
      avgGratuity,
      netAmount: totalGratuity - totalTax
    };
  };

  const summaryData = generateSummaryReport();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          <option value="summary">Summary Report</option>
          <option value="detailed">Detailed Report</option>
          <option value="tax-analysis">Tax Analysis</option>
          <option value="compliance">Compliance Report</option>
        </select>
        
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="current-year">Current Year</option>
          <option value="last-year">Last Year</option>
          <option value="custom">Custom Range</option>
        </select>

        <button 
          onClick={generateReport}
          disabled={isGeneratingReport}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-6 py-2 rounded-lg flex items-center gap-2"
        >
          <span>📊</span> 
          {isGeneratingReport ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {reportType === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{summaryData.totalFaculty}</div>
              <div className="text-gray-600">Total Faculty</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{summaryData.eligibleFaculty}</div>
              <div className="text-gray-600">Eligible for Gratuity</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">₹{summaryData.totalGratuity.toLocaleString()}</div>
              <div className="text-gray-600">Total Gratuity</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">₹{summaryData.totalTax.toLocaleString()}</div>
              <div className="text-gray-600">Total Tax Liability</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">₹{summaryData.avgGratuity.toLocaleString()}</div>
              <div className="text-gray-600">Average Gratuity</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">₹{summaryData.netAmount.toLocaleString()}</div>
              <div className="text-gray-600">Net Amount</div>
            </div>
          </div>
        </div>
      )}

      {/* Chart placeholder */}
      <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Gratuity Distribution Chart</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <div>Chart visualization would be implemented here</div>
            <div className="text-sm">Using libraries like Chart.js or Recharts</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Gratuity Calculator Modal Component
const GratuityCalculatorModal = ({ onClose, facultyData, calculateGratuity }) => {
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [customSalary, setCustomSalary] = useState('');
  const [customYears, setCustomYears] = useState('');
  const [calculationResult, setCalculationResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const faculty = facultyData.find(f => f.id === selectedFacultyId);
      if (!faculty) {
        alert('Please select a faculty member');
        return;
      }

      const token = localStorage.getItem('token');
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Prepare calculation data
      const calculationData = {
        facultyId: selectedFacultyId,
        basicSalary: customSalary ? parseFloat(customSalary) : faculty.basicSalary,
        serviceYears: customYears ? parseFloat(customYears) : faculty.yearsOfService,
        calculationType: 'preview' // This is just a calculation preview, not saving
      };

      // Use API for calculation if available, otherwise use local function
      try {
        const response = await fetch('http://localhost:5000/api/gratuity/calculate', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(calculationData)
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setCalculationResult(result.data);
          } else {
            throw new Error(result.message || 'API calculation failed');
          }
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        console.warn('API calculation failed, using local calculation:', apiError);
        // Fallback to local calculation
        const salary = customSalary ? parseFloat(customSalary) : faculty.basicSalary;
        const years = customYears ? parseFloat(customYears) : faculty.yearsOfService;
        
        const result = calculateGratuity({ ...faculty, basicSalary: salary, yearsOfService: years });
        setCalculationResult(result);
      }
      
    } catch (error) {
      console.error('Error calculating gratuity:', error);
      alert('Error calculating gratuity. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-blue-600 focus:outline-none"
              title="Back"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-gray-800">Gratuity Calculator</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Faculty</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
            >
              <option value="">Choose faculty member...</option>
              {facultyData.map(faculty => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name} ({faculty.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Basic Salary (Optional)</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Enter custom salary..."
              value={customSalary}
              onChange={(e) => setCustomSalary(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Custom Years of Service (Optional)</label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Enter years of service..."
              value={customYears}
              onChange={(e) => setCustomYears(e.target.value)}
            />
          </div>

          <button
            onClick={handleCalculate}
            disabled={!selectedFacultyId || isCalculating}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Gratuity'}
          </button>

          {calculationResult && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Calculation Result</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Gratuity Amount:</span>
                  <span className="font-semibold text-green-600">₹{calculationResult.gratuityAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exempt Amount:</span>
                  <span className="font-semibold">₹{calculationResult.exemptAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Amount:</span>
                  <span className="font-semibold">₹{calculationResult.taxableAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Tax Liability:</span>
                  <span className="font-semibold text-red-600">₹{calculationResult.taxLiability.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function GratuityTax() {
  const [facultyData, setFacultyData] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [gratuityCalculations, setGratuityCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCalculator, setShowCalculator] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchFacultyData();
    fetchGratuityData();
    fetchAnalyticsData();
  }, []);

  const fetchFacultyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch faculty data from real API
      const response = await fetch('http://localhost:5000/api/gratuity/faculty?limit=100', {
        headers: authHeaders
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch faculty data');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform API data to match component structure
        const transformedData = result.data.faculty.map(faculty => ({
          id: faculty._id,
          name: faculty.personalInfo?.fullName || faculty.name || `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim(),
          employeeId: faculty.employeeId,
          department: faculty.employmentInfo?.department || faculty.department || 'N/A',
          designation: faculty.employmentInfo?.designation || faculty.designation || 'N/A',
          joiningDate: faculty.employmentInfo?.joiningDate || faculty.joiningDate,
          currentSalary: faculty.salaryInfo?.currentSalary || faculty.currentSalary || 0,
          basicSalary: faculty.salaryInfo?.basicSalary || faculty.basicSalary || 0,
          yearsOfService: faculty.employmentInfo?.yearsOfService || faculty.yearsOfService || 0,
          isEligible: faculty.gratuityInfo?.isEligible || (faculty.yearsOfService >= 5),
          lastGratuityPaid: faculty.gratuityInfo?.lastPaymentDate || null,
          calculatedGratuity: faculty.calculatedGratuity || null
        }));
        
        setFacultyData(transformedData);
      } else {
        console.error('Invalid API response structure:', result);
        // Fallback to empty array if API fails
        setFacultyData([]);
      }
    } catch (error) {
      console.error('Error fetching faculty data:', error);
      // Set empty array on error instead of mock data
      setFacultyData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGratuityData = async () => {
    try {
      const token = localStorage.getItem('token');
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Fetch gratuity records from real API
      const response = await fetch('http://localhost:5000/api/gratuity/records?limit=100', {
        headers: authHeaders
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch gratuity records');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform API data to match component structure
        const transformedCalculations = result.data.records.map(record => ({
          id: record._id,
          facultyId: record.facultyId._id || record.facultyId,
          calculationDate: record.calculationDate,
          yearsOfService: record.serviceYears,
          basicSalary: record.basicSalary,
          gratuityAmount: record.gratuityAmount,
          taxableAmount: record.taxableAmount || 0,
          exemptAmount: record.exemptAmount || 0,
          taxLiability: record.taxLiability || 0,
          status: record.paymentStatus || 'calculated'
        }));
        
        setGratuityCalculations(transformedCalculations);
      } else {
        console.error('Invalid API response structure:', result);
        // Set empty array if API fails
        setGratuityCalculations([]);
      }
    } catch (error) {
      console.error('Error fetching gratuity data:', error);
      // Set empty array on error instead of mock data
      setGratuityCalculations([]);
    }
  };

  // Function to create a gratuity record via API
  const createGratuityRecord = async (facultyId, calculationData) => {
    try {
      const token = localStorage.getItem('token');
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch('http://localhost:5000/api/gratuity/records', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          facultyId,
          ...calculationData
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create gratuity record');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh data after creating record
        await Promise.all([
          fetchGratuityData(),
          fetchAnalyticsData()
        ]);
        alert('Gratuity record created successfully!');
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to create record');
      }
    } catch (error) {
      console.error('Error creating gratuity record:', error);
      alert('Failed to create gratuity record. Please try again.');
      throw error;
    }
  };

  // Function to generate reports via API
  const generateHeaderReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch('http://localhost:5000/api/gratuity/reports/summary', {
        headers: authHeaders
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }
      
      const result = await response.json();
      
      // Create and download the file
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `gratuity_summary_report_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  const calculateGratuity = (faculty) => {
    // Gratuity calculation: (Basic Salary × Years of Service × 15) / 26
    const gratuityAmount = (faculty.basicSalary * faculty.yearsOfService * 15) / 26;
    
    // Tax calculation (simplified - based on income tax slabs)
    const exemptLimit = 200000; // Current exempt limit for private employees
    const exemptAmount = Math.min(gratuityAmount, exemptLimit);
    const taxableAmount = Math.max(0, gratuityAmount - exemptLimit);
    
    let taxLiability = 0;
    if (taxableAmount > 0) {
      // Simplified tax calculation - 20% rate for demonstration
      taxLiability = taxableAmount * 0.20;
    }

    return {
      gratuityAmount: Math.round(gratuityAmount),
      taxableAmount: Math.round(taxableAmount),
      exemptAmount: Math.round(exemptAmount),
      taxLiability: Math.round(taxLiability)
    };
  };

  const getEligibilityStatus = (faculty) => {
    if (faculty.yearsOfService >= 5) {
      return { status: 'eligible', color: 'text-green-600 bg-green-100', text: 'Eligible' };
    } else {
      const remaining = 5 - faculty.yearsOfService;
      return { 
        status: 'not-eligible', 
        color: 'text-orange-600 bg-orange-100', 
        text: `${remaining.toFixed(1)} years remaining` 
      };
    }
  };

  const [analyticsData, setAnalyticsData] = useState({
    eligible: 0,
    totalCalculated: 0,
    totalAmount: 0,
    totalTax: 0
  });

  // Fetch analytics data from API
  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch('http://localhost:5000/api/gratuity/analytics', {
        headers: authHeaders
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setAnalyticsData({
          eligible: result.data.eligibleFaculty || 0,
          totalCalculated: result.data.totalRecords || 0,
          totalAmount: result.data.totalGratuityAmount || 0,
          totalTax: result.data.totalTaxLiability || 0
        });
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Keep default values on error
    }
  };

  const getTotalGratuityStats = () => {
    // Use analytics data from API instead of calculating from local data
    return analyticsData;
  };

  const stats = getTotalGratuityStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-orange-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-orange-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <div className="text-2xl font-bold text-gray-700 mb-2">Loading Gratuity Data</div>
          <div className="text-gray-500">Calculating faculty gratuity information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-100">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-pink-700">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20"></div>
        
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white/10 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/10 rounded-full animate-ping"></div>
        </div>

        <div className="relative z-10 px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-4xl lg:text-6xl font-bold text-white mb-2 tracking-tight">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Gratuity
                  </span>
                  <span className="text-white"> Management</span>
                </h1>
                <p className="text-xl text-orange-100 font-medium">
                  Faculty Gratuity Calculation & Tax Management System
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setShowCalculator(true)}
                  className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-colors flex items-center gap-2"
                >
                  <span>🧮</span> Gratuity Calculator
                </button>
                <button 
                  onClick={generateHeaderReport}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
                >
                  <span>📊</span> Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Eligible Faculty"
            value={`${stats.eligible}/${facultyData.length}`}
            icon="👥"
            color="from-green-500 to-emerald-600"
            trend="+2 this month"
          />
          <StatCard
            title="Total Calculations"
            value={stats.totalCalculated}
            icon="🧮"
            color="from-blue-500 to-indigo-600"
            trend="Current FY"
          />
          <StatCard
            title="Total Gratuity"
            value={`₹${stats.totalAmount.toLocaleString()}`}
            icon="💰"
            color="from-orange-500 to-red-600"
            trend="+15% from last year"
          />
          <StatCard
            title="Tax Liability"
            value={`₹${stats.totalTax.toLocaleString()}`}
            icon="📋"
            color="from-purple-500 to-violet-600"
            trend="12% avg rate"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Faculty Overview', icon: '👥' },
                { id: 'calculations', label: 'Gratuity Calculations', icon: '🧮' },
                { id: 'tax-planning', label: 'Tax Planning', icon: '📊' },
                { id: 'reports', label: 'Reports', icon: '📋' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <FacultyOverviewTab 
                facultyData={facultyData}
                onSelectFaculty={setSelectedFaculty}
                calculateGratuity={calculateGratuity}
                getEligibilityStatus={getEligibilityStatus}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
              />
            )}
            
            {activeTab === 'calculations' && (
              <CalculationsTab 
                calculations={gratuityCalculations}
                facultyData={facultyData}
              />
            )}
            
            {activeTab === 'tax-planning' && (
              <TaxPlanningTab facultyData={facultyData} />
            )}
            
            {activeTab === 'reports' && (
              <ReportsTab 
                facultyData={facultyData}
                calculations={gratuityCalculations}
              />
            )}
          </div>
        </div>

      </div>

      {/* Gratuity Calculator Modal */}
      {showCalculator && (
        <GratuityCalculatorModal 
          onClose={() => setShowCalculator(false)}
          facultyData={facultyData}
          calculateGratuity={calculateGratuity}
        />
      )}
    </div>
  );
}
