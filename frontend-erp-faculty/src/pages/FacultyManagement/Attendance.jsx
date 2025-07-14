import { useState, useEffect } from 'react';
import { Download, Filter, Calendar, Search, UserCheck, Clock, PlusCircle, Edit, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import _ from 'lodash';

// Custom CSV generator function (no dependency needed)
const generateCSV = (data) => {
  if (!data || !data.length) return '';
  
  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = headers.join(',');
  
  // Create data rows
  const rows = data.map(row => {
    return headers.map(header => {
      // Handle commas and quotes in data to follow CSV format
      const cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join('\n');
};

// Generate date range for the current month
const generateDateRange = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    return date.toISOString().split('T')[0];
  });
};

// Generate random attendance data
const generateAttendanceData = (daysInMonth) => {
  const attendance = {};
  daysInMonth.forEach(date => {
    // 85% chance of present, 15% chance of absent (weekends always present in this demo)
    const dayOfWeek = new Date(date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // For demo purposes, make weekends always "present" and weekdays have a chance of absence
    attendance[date] = isWeekend ? "present" : Math.random() < 0.85 ? "present" : "absent";
  });
  return attendance;
};

// Date range for the current month
const dateRange = generateDateRange();

// Mock data - replace with your API call in a real application
const initialFaculty = [
  { 
    id: 1, 
    name: "Dr. Jane Smith", 
    department: "Computer Science", 
    totalPresent: 22, 
    totalAbsent: 3, 
    leaves: [
      { id: 101, type: "Sick", startDate: "2025-04-25", endDate: "2025-04-26", status: "Approved" },
      { id: 102, type: "Personal", startDate: "2025-05-01", endDate: "2025-05-01", status: "Pending" }
    ],
    attendance: generateAttendanceData(dateRange)
  },
  { 
    id: 2, 
    name: "Prof. John Davis", 
    department: "Mathematics", 
    totalPresent: 24, 
    totalAbsent: 1, 
    leaves: [
      { id: 103, type: "Conference", startDate: "2025-05-10", endDate: "2025-05-15", status: "Approved" }
    ],
    attendance: generateAttendanceData(dateRange)
  },
  { 
    id: 3, 
    name: "Dr. Maria Rodriguez", 
    department: "Physics", 
    totalPresent: 20, 
    totalAbsent: 5, 
    leaves: [
      { id: 104, type: "Sick", startDate: "2025-04-15", endDate: "2025-04-17", status: "Approved" },
      { id: 105, type: "Family", startDate: "2025-04-28", endDate: "2025-04-29", status: "Approved" }
    ],
    attendance: generateAttendanceData(dateRange)
  },
  { 
    id: 4, 
    name: "Prof. David Chen", 
    department: "Chemistry", 
    totalPresent: 25, 
    totalAbsent: 0, 
    leaves: [],
    attendance: generateAttendanceData(dateRange)
  },
  { 
    id: 5, 
    name: "Dr. Sarah Johnson", 
    department: "Biology", 
    totalPresent: 23, 
    totalAbsent: 2, 
    leaves: [
      { id: 106, type: "Personal", startDate: "2025-04-20", endDate: "2025-04-21", status: "Approved" }
    ],
    attendance: generateAttendanceData(dateRange)
  }
];

const leaveTypes = ["Sick", "Personal", "Family", "Conference", "Study", "Other"];

export default function FacultyAttendanceSystem() {
  const [faculty, setFaculty] = useState(initialFaculty);
  const [filteredFaculty, setFilteredFaculty] = useState(faculty);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [leaveFilter, setLeaveFilter] = useState('');
  const [showAddLeaveModal, setShowAddLeaveModal] = useState(false);
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [newLeave, setNewLeave] = useState({
    type: "Sick",
    startDate: "",
    endDate: "",
    reason: ""
  });

  const departments = _.uniq(faculty.map(f => f.department));

  useEffect(() => {
    // Filter faculty based on search and filters
    let result = faculty;
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.name.toLowerCase().includes(lowerSearchTerm) || 
        f.department.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    if (departmentFilter) {
      result = result.filter(f => f.department === departmentFilter);
    }
    
    if (leaveFilter) {
      result = result.filter(f => f.leaves.some(l => l.type === leaveFilter));
    }
    
    setFilteredFaculty(result);
  }, [faculty, searchTerm, departmentFilter, leaveFilter]);

  const handleAddLeave = () => {
    if (!selectedFaculty || !newLeave.startDate || !newLeave.endDate) return;
    
    const updatedFaculty = faculty.map(f => {
      if (f.id === selectedFaculty.id) {
        return {
          ...f,
          leaves: [
            ...f.leaves,
            { 
              id: Date.now(), 
              ...newLeave,
              status: "Pending" 
            }
          ]
        };
      }
      return f;
    });
    
    setFaculty(updatedFaculty);
    resetLeaveForm();
    setShowAddLeaveModal(false);
  };

  const resetLeaveForm = () => {
    setNewLeave({
      type: "Sick",
      startDate: "",
      endDate: "",
      reason: ""
    });
  };

  const downloadCSV = () => {
    // Prepare data for CSV
    const csvData = filteredFaculty.map(f => {
      // Calculate present/absent count from attendance data
      const presentCount = Object.values(f.attendance).filter(status => status === "present").length;
      const absentCount = Object.values(f.attendance).filter(status => status === "absent").length;
      
      return {
        ID: f.id,
        Name: f.name,
        Department: f.department,
        'Total Present': presentCount,
        'Total Absent': absentCount,
        'Attendance Rate': `${Math.round((presentCount / (presentCount + absentCount)) * 100)}%`,
        'Leaves Count': f.leaves.length,
        'Pending Leaves': f.leaves.filter(l => l.status === "Pending").length,
        'Approved Leaves': f.leaves.filter(l => l.status === "Approved").length
      };
    });
    
    // Use our custom CSV generator function
    const csv = generateCSV(csvData);
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `faculty_attendance_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadLeaveDetails = (facultyId) => {
    const faculty = filteredFaculty.find(f => f.id === facultyId);
    if (!faculty) return;
    
    // Prepare leave data for CSV
    const csvData = faculty.leaves.map(leave => ({
      'Faculty Name': faculty.name,
      'Department': faculty.department,
      'Leave Type': leave.type,
      'Start Date': leave.startDate,
      'End Date': leave.endDate,
      'Status': leave.status,
      'Reason': leave.reason || 'Not specified'
    }));
    
    const csv = generateCSV(csvData);
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${faculty.name.replace(/\s+/g, '_')}_leaves.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Faculty Attendance System</h1>
          <p className="text-sm opacity-80">Track attendance, manage leaves, and generate reports</p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto p-4 flex-grow">
        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <UserCheck className="mr-2" size={20} /> 
              Faculty Attendance Dashboard
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={downloadCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
              >
                <Download size={16} className="mr-1" /> Download Report
              </button>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-500" />
              <input
                type="text"
                placeholder="Search faculty..."
                className="pl-10 p-2 w-full border rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <Filter size={18} className="absolute left-3 top-3 text-gray-500" />
              <select
                className="pl-10 p-2 w-full border rounded"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-3 text-gray-500" />
              <select
                className="pl-10 p-2 w-full border rounded"
                value={leaveFilter}
                onChange={(e) => setLeaveFilter(e.target.value)}
              >
                <option value="">All Leave Types</option>
                {leaveTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="text-right">
              <span className="block text-sm text-gray-600">
                Showing {filteredFaculty.length} of {faculty.length} faculty members
              </span>
            </div>
          </div>
        </div>
        
        {/* Faculty Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faculty Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Absent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leaves
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFaculty.map(faculty => (
                  <tr key={faculty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{faculty.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{faculty.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-green-600 font-medium">{faculty.totalPresent}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-red-600 font-medium">{faculty.totalAbsent}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">{faculty.leaves.length} leaves</span>
                        {faculty.leaves.some(l => l.status === "Pending") && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded">
                            {faculty.leaves.filter(l => l.status === "Pending").length} pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedFaculty(faculty);
                            setShowViewDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFaculty(faculty);
                            setShowAddLeaveModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Add Leave"
                        >
                          <PlusCircle size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFaculty(faculty);
                            setShowAttendanceModal(true);
                          }}
                          className="text-orange-600 hover:text-orange-900"
                          title="View Attendance"
                        >
                          <Calendar size={18} />
                        </button>
                        <button
                          onClick={() => downloadLeaveDetails(faculty.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Download Leaves"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredFaculty.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No faculty members found matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Add Leave Modal */}
      {showAddLeaveModal && selectedFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Add Leave for {selectedFaculty.name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                <select
                  className="w-full p-2 border rounded"
                  value={newLeave.type}
                  onChange={(e) => setNewLeave({...newLeave, type: e.target.value})}
                >
                  {leaveTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={newLeave.startDate}
                    onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full p-2 border rounded"
                    value={newLeave.endDate}
                    onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Provide a reason for this leave request"
                  value={newLeave.reason || ''}
                  onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => {
                  resetLeaveForm();
                  setShowAddLeaveModal(false);
                }}
              >
                Cancel
              </button>
              
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleAddLeave}
              >
                Submit Leave Request
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* View Details Modal */}
      {showViewDetailsModal && selectedFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Faculty Details: {selectedFaculty.name}</h3>
              <button 
                onClick={() => setShowViewDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">Personal Information</h4>
                <p className="text-sm mb-1"><span className="font-medium">Name:</span> {selectedFaculty.name}</p>
                <p className="text-sm mb-1"><span className="font-medium">Department:</span> {selectedFaculty.department}</p>
                <p className="text-sm mb-1"><span className="font-medium">ID:</span> {selectedFaculty.id}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">Attendance Summary</h4>
                <p className="text-sm mb-1">
                  <span className="font-medium">Present:</span> 
                  <span className="text-green-600"> {selectedFaculty.totalPresent} days</span>
                </p>
                <p className="text-sm mb-1">
                  <span className="font-medium">Absent:</span> 
                  <span className="text-red-600"> {selectedFaculty.totalAbsent} days</span>
                </p>
                <p className="text-sm mb-1">
                  <span className="font-medium">Attendance Rate:</span> 
                  {selectedFaculty.totalPresent + selectedFaculty.totalAbsent > 0 ? 
                    ` ${Math.round((selectedFaculty.totalPresent / (selectedFaculty.totalPresent + selectedFaculty.totalAbsent)) * 100)}%` : 
                    ' N/A'}
                </p>
              </div>
            </div>
            
            <h4 className="font-medium mb-2">Leave History</h4>
            {selectedFaculty.leaves.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedFaculty.leaves.map(leave => (
                      <tr key={leave.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{leave.type}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{leave.startDate}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{leave.endDate}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            leave.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                            leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{leave.reason || 'Not specified'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No leave records found for this faculty member.</p>
            )}
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => downloadLeaveDetails(selectedFaculty.id)}
              >
                <Download size={16} className="inline mr-1" /> Download Leave History
              </button>
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowViewDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Attendance Modal */}
      {showAttendanceModal && selectedFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Attendance Record: {selectedFaculty.name}</h3>
              <button 
                onClick={() => setShowAttendanceModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-6 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select 
                  className="p-2 border rounded"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select 
                  className="p-2 border rounded"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={i} value={new Date().getFullYear() - 2 + i}>
                      {new Date().getFullYear() - 2 + i}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="ml-auto flex items-center gap-6">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Present</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Absent</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">On Leave</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Day
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dateRange.map((date) => {
                        // Check if there's a leave for this date
                        const isOnLeave = selectedFaculty.leaves.some(leave => {
                          const start = new Date(leave.startDate);
                          const end = new Date(leave.endDate);
                          const current = new Date(date);
                          return current >= start && current <= end && leave.status === "Approved";
                        });
                        
                        // Get the leave details if on leave
                        const leaveDetails = isOnLeave ? 
                          selectedFaculty.leaves.find(leave => {
                            const start = new Date(leave.startDate);
                            const end = new Date(leave.endDate);
                            const current = new Date(date);
                            return current >= start && current <= end && leave.status === "Approved";
                          }) : null;
                        
                        // Determine status - leave takes precedence over attendance record
                        let status = '';
                        let statusClass = '';
                        let statusIcon = null;
                        
                        if (isOnLeave) {
                          status = "On Leave";
                          statusClass = "bg-blue-100 text-blue-800";
                          statusIcon = <Calendar size={16} className="inline mr-1" />;
                        } else if (selectedFaculty.attendance[date] === "present") {
                          status = "Present";
                          statusClass = "bg-green-100 text-green-800";
                          statusIcon = <CheckCircle size={16} className="inline mr-1" />;
                        } else {
                          status = "Absent";
                          statusClass = "bg-red-100 text-red-800";
                          statusIcon = <XCircle size={16} className="inline mr-1" />;
                        }
                        
                        const currentDate = new Date(date);
                        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
                        
                        return (
                          <tr key={date} className="hover:bg-gray-50">
                            <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                              {date}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                              {dayName}
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                                {statusIcon}{status}
                              </span>
                            </td>
                            <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                              {isOnLeave ? `${leaveDetails.type} leave` : ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  // Generate CSV of attendance
                  const csvData = dateRange.map(date => {
                    // Check if there's a leave for this date
                    const isOnLeave = selectedFaculty.leaves.some(leave => {
                      const start = new Date(leave.startDate);
                      const end = new Date(leave.endDate);
                      const current = new Date(date);
                      return current >= start && current <= end && leave.status === "Approved";
                    });
                    
                    // Get the leave details if on leave
                    const leaveDetails = isOnLeave ? 
                      selectedFaculty.leaves.find(leave => {
                        const start = new Date(leave.startDate);
                        const end = new Date(leave.endDate);
                        const current = new Date(date);
                        return current >= start && current <= end && leave.status === "Approved";
                      }) : null;
                    
                    // Determine status
                    let status = '';
                    if (isOnLeave) {
                      status = "On Leave";
                    } else {
                      status = selectedFaculty.attendance[date] === "present" ? "Present" : "Absent";
                    }
                    
                    const currentDate = new Date(date);
                    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
                    
                    return {
                      'Faculty Name': selectedFaculty.name,
                      'Department': selectedFaculty.department,
                      'Date': date,
                      'Day': dayName,
                      'Status': status,
                      'Notes': isOnLeave ? `${leaveDetails.type} leave` : ''
                    };
                  });
                  
                  const csv = generateCSV(csvData);
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', `${selectedFaculty.name.replace(/\s+/g, '_')}_attendance.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download size={16} className="inline mr-1" /> Download Attendance
              </button>
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowAttendanceModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 mt-6">
        <div className="container mx-auto text-center text-sm">
          <p>© {new Date().getFullYear()} Faculty Attendance System | All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
}