import { useState, useEffect } from "react";

// API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Stat Card Component
const StatCard = ({ title, value, icon, color, trend, loading = false }) => (
  <div className={`bg-gradient-to-r ${color} p-6 rounded-2xl text-white shadow-xl transform hover:scale-105 transition-transform duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-orange-100 text-sm font-medium">{title}</p>
        {loading ? (
          <div className="h-8 w-20 bg-white/20 rounded animate-pulse"></div>
        ) : (
          <p className="text-3xl font-bold">{value}</p>
        )}
        <p className="text-orange-200 text-xs mt-1">{trend}</p>
      </div>
      <div className="text-4xl opacity-80">{icon}</div>
    </div>
  </div>
);

// Faculty Overview Tab Component with Real Data Integration
const FacultyOverviewTab = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus }) => {
  const [facultyData, setFacultyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  useEffect(() => {
    fetchFacultyData();
  }, [filterStatus]);

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      
      const response = await fetch(`${API_BASE_URL}/gratuity/faculty?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch faculty data');
      }
      
      const result = await response.json();
      setFacultyData(result.data.faculty || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching faculty:', err);
      setError(err.message);
      // Set empty data if API fails
      setFacultyData([]);
    } finally {
      setLoading(false);
    }
  };
  const filteredData = facultyData.filter(faculty => {
    const name = faculty.personalInfo?.fullName || '';
    const empId = faculty.employeeId || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           empId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getEligibilityStatus = (faculty) => {
    if (faculty.gratuityInfo?.isEligible) {
      return { status: 'eligible', color: 'text-green-600 bg-green-100', text: 'Eligible' };
    } else {
      const remaining = Math.max(0, 5 - (faculty.yearsOfService || 0));
      return { 
        status: 'not-eligible', 
        color: 'text-orange-600 bg-orange-100', 
        text: `${remaining.toFixed(1)} years remaining` 
      };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="w-48 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-red-600 text-xl mb-2">⚠️ Error Loading Faculty Data</div>
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={fetchFacultyData}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

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

      {filteredData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">👥</div>
          <div className="text-xl">No faculty found</div>
          <div className="text-sm">Try adjusting your search or filter criteria</div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredData.map((faculty) => {
            const eligibility = getEligibilityStatus(faculty);
            const calculation = faculty.calculatedGratuity;
            
            return (
              <div 
                key={faculty._id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedFaculty(faculty)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {faculty.personalInfo?.fullName || 'Unknown Name'}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${eligibility.color}`}>
                        {eligibility.text}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Employee ID:</span> {faculty.employeeId}
                      </div>
                      <div>
                        <span className="font-medium">Department:</span> {faculty.employmentInfo?.department || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Service:</span> {faculty.yearsOfService?.toFixed(1) || 0} years
                      </div>
                      <div>
                        <span className="font-medium">Basic Salary:</span> ₹{faculty.salaryInfo?.basicSalary?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>
                  
                  {faculty.gratuityInfo?.isEligible && calculation && (
                    <div className="mt-4 lg:mt-0 lg:ml-6 text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ₹{calculation.gratuityAmount?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-500">Estimated Gratuity</div>
                      <div className="text-sm text-red-600">
                        Tax: ₹{calculation.taxLiability?.toLocaleString() || 0}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Faculty Detail Modal */}
      {selectedFaculty && (
        <FacultyDetailModal 
          faculty={selectedFaculty} 
          onClose={() => setSelectedFaculty(null)} 
        />
      )}
    </div>
  );
};

// Faculty Detail Modal Component
const FacultyDetailModal = ({ faculty, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
            <h2 className="text-2xl font-bold text-gray-800">Faculty Details</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            title="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Name:</span> {faculty.personalInfo?.fullName}</div>
              <div><span className="font-medium">Employee ID:</span> {faculty.employeeId}</div>
              <div><span className="font-medium">Department:</span> {faculty.employmentInfo?.department}</div>
              <div><span className="font-medium">Designation:</span> {faculty.employmentInfo?.designation}</div>
              <div><span className="font-medium">Years of Service:</span> {faculty.yearsOfService?.toFixed(1)} years</div>
              <div><span className="font-medium">Email:</span> {faculty.personalInfo?.email || 'N/A'}</div>
            </div>
          </div>

          {/* Salary Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3">Salary Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">Basic Salary:</span> ₹{faculty.salaryInfo?.basicSalary?.toLocaleString()}</div>
              <div><span className="font-medium">Current Salary:</span> ₹{faculty.salaryInfo?.currentSalary?.toLocaleString()}</div>
            </div>
          </div>

          {/* Gratuity Info */}
          {faculty.gratuityInfo?.isEligible && faculty.calculatedGratuity && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">Gratuity Calculation</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Gratuity Amount:</span> ₹{faculty.calculatedGratuity.gratuityAmount?.toLocaleString()}</div>
                <div><span className="font-medium">Exempt Amount:</span> ₹{faculty.calculatedGratuity.exemptAmount?.toLocaleString()}</div>
                <div><span className="font-medium">Taxable Amount:</span> ₹{faculty.calculatedGratuity.taxableAmount?.toLocaleString()}</div>
                <div><span className="font-medium">Tax Liability:</span> ₹{faculty.calculatedGratuity.taxLiability?.toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function GratuityTaxWithBackend() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCalculator, setShowCalculator] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/gratuity/analytics`);
      if (response.ok) {
        const result = await response.json();
        setAnalytics(result.data);
      } else {
        // Set empty analytics if API fails
        setAnalytics({ summary: {} });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics({ summary: {} });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-orange-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-orange-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <div className="text-2xl font-bold text-gray-700 mb-2">Loading Gratuity System</div>
          <div className="text-gray-500">Connecting to backend services...</div>
        </div>
      </div>
    );
  }

  const stats = analytics?.summary || {};

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
                  Advanced Faculty Gratuity Calculation & Tax Management System
                </p>
                <div className="mt-2 flex items-center gap-2 text-orange-200">
                  <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-sm">Connected to Backend API</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setShowCalculator(true)}
                  className="bg-white text-orange-600 px-6 py-3 rounded-xl font-semibold hover:bg-orange-50 transition-colors flex items-center gap-2"
                >
                  <span>🧮</span> Gratuity Calculator
                </button>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2">
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
            value={`${stats.eligibleFaculty || 0}/${stats.totalFaculty || 0}`}
            icon="👥"
            color="from-green-500 to-emerald-600"
            trend={`${stats.eligibilityPercentage || 0}% eligible`}
            loading={!analytics}
          />
          <StatCard
            title="Total Calculations"
            value={stats.totalGratuityRecords || 0}
            icon="🧮"
            color="from-blue-500 to-indigo-600"
            trend="Current FY"
            loading={!analytics}
          />
          <StatCard
            title="Total Gratuity"
            value={`₹${(stats.totalGratuityAmount || 0).toLocaleString()}`}
            icon="💰"
            color="from-orange-500 to-red-600"
            trend="+15% from last year"
            loading={!analytics}
          />
          <StatCard
            title="Tax Liability"
            value={`₹${(stats.totalTaxLiability || 0).toLocaleString()}`}
            icon="📋"
            color="from-purple-500 to-violet-600"
            trend={`${stats.avgTaxRate || 0}% avg rate`}
            loading={!analytics}
          />
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Faculty Overview', icon: '👥' },
                { id: 'calculations', label: 'Gratuity Records', icon: '🧮' },
                { id: 'tax-planning', label: 'Tax Planning', icon: '📊' },
                { id: 'reports', label: 'Reports & Analytics', icon: '📋' }
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
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
              />
            )}
            
            {activeTab === 'calculations' && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🧮</div>
                <div className="text-xl mb-2">Gratuity Records</div>
                <div className="text-sm">This section will show detailed gratuity calculation records</div>
                <div className="text-sm text-orange-600 mt-2">Backend integration in progress...</div>
              </div>
            )}
            
            {activeTab === 'tax-planning' && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📊</div>
                <div className="text-xl mb-2">Tax Planning</div>
                <div className="text-sm">Advanced tax planning tools and strategies</div>
                <div className="text-sm text-orange-600 mt-2">Coming soon...</div>
              </div>
            )}
            
            {activeTab === 'reports' && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📋</div>
                <div className="text-xl mb-2">Reports & Analytics</div>
                <div className="text-sm">Comprehensive reporting and analytics dashboard</div>
                <div className="text-sm text-orange-600 mt-2">Integration with backend analytics API...</div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Simple Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Quick Gratuity Calculator</h2>
              <button 
                onClick={() => setShowCalculator(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🧮</div>
              <div className="text-xl mb-2">Calculator Integration</div>
              <div className="text-sm">This will integrate with the backend calculation API</div>
              <div className="text-sm text-orange-600 mt-2">Coming soon...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
