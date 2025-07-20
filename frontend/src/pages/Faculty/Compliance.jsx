import React, { useState, useEffect } from 'react';

export default function Compliance() {
  const [activeTab, setActiveTab] = useState('overview');
  const [complianceData, setComplianceData] = useState([]);
  const [filters, setFilters] = useState({
    faculty: 'all',
    status: 'all',
    category: 'all',
    dateRange: '30'
  });
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  useEffect(() => {
    fetchComplianceData();
    fetchStatistics();
    fetchDepartmentStats();
    fetchUpcomingDeadlines();
  }, [filters]);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== 'all') {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await fetch(`/api/compliance?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setComplianceData(data.data);
      } else {
        console.error('Error fetching compliance data:', data.message);
        setComplianceData([]);
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      setComplianceData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/compliance/statistics');
      const data = await response.json();
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchDepartmentStats = async () => {
    try {
      const response = await fetch('/api/compliance/department-stats');
      const data = await response.json();
      if (data.success) {
        setDepartmentStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  const fetchUpcomingDeadlines = async () => {
    try {
      const response = await fetch('/api/compliance/upcoming-deadlines');
      const data = await response.json();
      if (data.success) {
        setUpcomingDeadlines(data.data);
      }
    } catch (error) {
      console.error('Error fetching upcoming deadlines:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-600';
      case 'High': return 'text-orange-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getComplianceStats = () => {
    if (statistics) {
      return statistics;
    }
    
    // Fallback to calculating from complianceData if API stats not available
    const total = complianceData.length;
    const completed = complianceData.filter(item => item.status === 'Completed').length;
    const pending = complianceData.filter(item => item.status === 'Pending').length;
    const overdue = complianceData.filter(item => item.status === 'Overdue').length;
    const inProgress = complianceData.filter(item => item.status === 'In Progress').length;

    return { total, completed, pending, overdue, inProgress };
  };

  const handleExport = async (format = 'csv') => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] !== 'all') {
          queryParams.append(key, filters[key]);
        }
      });
      queryParams.append('format', format);

      const response = await fetch(`/api/compliance/export/data?${queryParams}`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'compliance-export.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        if (data.success) {
          const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'compliance-export.json';
          a.click();
          window.URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const sendReminders = async () => {
    try {
      const overdueItems = complianceData.filter(item => 
        item.status !== 'Completed' && new Date(item.dueDate) < new Date()
      );
      
      const facultyIds = [...new Set(overdueItems.map(item => item.facultyId))];
      
      const response = await fetch('/api/compliance/bulk/remind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facultyIds,
          message: 'Reminder: You have overdue compliance requirements',
          type: 'email'
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Reminders sent to ${data.count} compliance requirements`);
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Failed to send reminders');
    }
  };

  const stats = getComplianceStats();

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'requirements', name: 'Requirements', icon: '📋' },
    { id: 'tracking', name: 'Tracking', icon: '📈' },
    { id: 'reports', name: 'Reports', icon: '📄' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requirements</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Rate Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Rate</h3>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-green-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% compliance rate
        </p>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
        <div className="space-y-4">
          {complianceData.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">{item.facultyName}</p>
                  <p className="text-sm text-gray-600">{item.requirement}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRequirements = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="all">All Categories</option>
              <option value="Mandatory Training">Mandatory Training</option>
              <option value="License Renewal">License Renewal</option>
              <option value="Health & Safety">Health & Safety</option>
              <option value="Research Ethics">Research Ethics</option>
              <option value="Professional Development">Professional Development</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
            >
              <option value="all">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Faculty</label>
            <select 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.faculty}
              onChange={(e) => setFilters({...filters, faculty: e.target.value})}
            >
              <option value="all">All Faculty</option>
              <option value="FAC001">Dr. John Smith</option>
              <option value="FAC002">Prof. Sarah Johnson</option>
              <option value="FAC003">Dr. Michael Brown</option>
              <option value="FAC004">Prof. Emily Davis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Add Requirement
            </button>
          </div>
        </div>
      </div>

      {/* Requirements Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Compliance Requirements</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complianceData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.facultyName}</div>
                      <div className="text-sm text-gray-500">{item.department}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.requirement}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button className="text-green-600 hover:text-green-900">View</button>
                      {item.certificateUrl && (
                        <button className="text-purple-600 hover:text-purple-900">Certificate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTracking = () => (
    <div className="space-y-6">
      {/* Department-wise Compliance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department-wise Compliance</h3>
        <div className="space-y-4">
          {departmentStats.length > 0 ? departmentStats.map((dept) => (
            <div key={dept.department} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{dept.department}</span>
                  <span className="text-sm text-gray-500">{dept.completed}/{dept.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${dept.complianceRate || 0}%` }}
                  ></div>
                </div>
              </div>
              <span className="ml-4 text-sm font-medium text-gray-900">
                {Math.round(dept.complianceRate || 0)}%
              </span>
            </div>
          )) : (
            // Fallback to calculated data
            ['Computer Science', 'Mathematics', 'Physics', 'Chemistry'].map((dept) => {
              const deptData = complianceData.filter(item => item.department === dept);
              const completed = deptData.filter(item => item.status === 'Completed').length;
              const total = deptData.length;
              const percentage = total > 0 ? (completed / total) * 100 : 0;

              return (
                <div key={dept} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{dept}</span>
                      <span className="text-sm text-gray-500">{completed}/{total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="ml-4 text-sm font-medium text-gray-900">
                    {Math.round(percentage)}%
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
        <div className="space-y-3">
          {(upcomingDeadlines.length > 0 ? upcomingDeadlines : 
            complianceData
              .filter(item => item.status !== 'Completed')
              .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
              .slice(0, 5)
          ).map((item) => {
            const daysUntilDue = Math.ceil((new Date(item.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
            const isOverdue = daysUntilDue < 0;
            const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

            return (
              <div key={item._id || item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${isOverdue ? 'bg-red-500' : isDueSoon ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{item.facultyName}</p>
                    <p className="text-sm text-gray-600">{item.requirement}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-gray-900'}`}>
                    {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : 
                     isDueSoon ? `${daysUntilDue} days left` : 
                     new Date(item.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Report Generation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="text-2xl mb-2">📊</div>
            <h4 className="font-medium text-gray-900">Compliance Summary</h4>
            <p className="text-sm text-gray-600">Overall compliance status report</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="text-2xl mb-2">📅</div>
            <h4 className="font-medium text-gray-900">Deadline Report</h4>
            <p className="text-sm text-gray-600">Upcoming and overdue requirements</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <div className="text-2xl mb-2">👥</div>
            <h4 className="font-medium text-gray-900">Faculty Report</h4>
            <p className="text-sm text-gray-600">Individual faculty compliance status</p>
          </button>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
        <div className="flex space-x-4">
          <button 
            onClick={() => handleExport('json')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Export to Excel
          </button>
          <button 
            onClick={() => handleExport('json')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Export to PDF
          </button>
          <button 
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Export to CSV
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Compliance Management</h1>
          <p className="text-gray-600">Monitor and manage faculty compliance requirements</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={sendReminders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send Reminders
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Add New Requirement
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'requirements' && renderRequirements()}
          {activeTab === 'tracking' && renderTracking()}
          {activeTab === 'reports' && renderReports()}
        </>
      )}
    </div>
  );
}
