import { useState } from "react";
import { Calendar, Clock, Filter, Download, ChevronLeft, ChevronRight, Search, FileText, CheckCircle, XCircle } from "lucide-react";

export default function AttendanceLogSystem() {
  // Sample data for attendance logs
  const [attendanceLogs, setAttendanceLogs] = useState([
    { id: 1, employeeId: "EMP001", name: "Dr. John Smith", role: "Professor", department: "Computer Science", date: "2025-05-01", checkIn: "08:45", checkOut: "17:15", status: "present", workHours: "8:30", notes: "" },
    { id: 2, employeeId: "EMP002", name: "Dr. Emily Johnson", role: "Associate Professor", department: "Mathematics", date: "2025-05-01", checkIn: "09:05", checkOut: "17:30", status: "present", workHours: "8:25", notes: "" },
    { id: 3, employeeId: "EMP003", name: "Michael Brown", role: "Lab Technician", department: "Physics", date: "2025-05-01", checkIn: "08:30", checkOut: "16:45", status: "present", workHours: "8:15", notes: "" },
    { id: 4, employeeId: "EMP001", name: "Dr. John Smith", role: "Professor", department: "Computer Science", date: "2025-05-02", checkIn: "08:50", checkOut: "17:20", status: "present", workHours: "8:30", notes: "" },
    { id: 5, employeeId: "EMP002", name: "Dr. Emily Johnson", role: "Associate Professor", department: "Mathematics", date: "2025-05-02", checkIn: "", checkOut: "", status: "absent", workHours: "0:00", notes: "Sick leave" },
    { id: 6, employeeId: "EMP003", name: "Michael Brown", role: "Lab Technician", department: "Physics", date: "2025-05-02", checkIn: "08:45", checkOut: "15:30", status: "half-day", workHours: "6:45", notes: "Early leave - family emergency" },
    { id: 7, employeeId: "EMP004", name: "Sarah Williams", role: "Administrative Assistant", department: "Dean's Office", date: "2025-05-01", checkIn: "09:00", checkOut: "17:00", status: "present", workHours: "8:00", notes: "" },
    { id: 8, employeeId: "EMP004", name: "Sarah Williams", role: "Administrative Assistant", department: "Dean's Office", date: "2025-05-02", checkIn: "09:15", checkOut: "17:15", status: "present", workHours: "8:00", notes: "Arrived late - approved" },
    { id: 9, employeeId: "EMP005", name: "Dr. David Lee", role: "Assistant Professor", department: "Engineering", date: "2025-05-01", checkIn: "08:30", checkOut: "16:30", status: "present", workHours: "8:00", notes: "" },
    { id: 10, employeeId: "EMP005", name: "Dr. David Lee", role: "Assistant Professor", department: "Engineering", date: "2025-05-02", checkIn: "", checkOut: "", status: "absent", workHours: "0:00", notes: "Conference attendance" }
  ]);

  // State for current date range
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  // State for filters
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(""); // YYYY-MM-DD format
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  // Calculate the date range for display
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Generate all days in the selected month for the calendar view
  const generateDaysArray = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };
  
  // Format date as YYYY-MM-DD
  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };
  
  // Unique departments for filter
  const departments = [...new Set(attendanceLogs.map(log => log.department))];
  
  // Unique employees for filter
  const employees = [...new Set(attendanceLogs.map(log => log.name))];
  
  // Apply filters to logs
  const filteredLogs = attendanceLogs.filter(log => {
    const matchesEmployee = !employeeFilter || log.name === employeeFilter;
    const matchesDepartment = !departmentFilter || log.department === departmentFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesDate = !dateFilter || log.date === dateFilter;
    
    return matchesEmployee && matchesDepartment && matchesStatus && matchesDate;
  });
  
  // Get current logs for pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstEntry, indexOfLastEntry);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Navigate to previous or next month
  const navigateMonth = (direction) => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;
    
    if (direction === "prev") {
      if (selectedMonth === 0) {
        newMonth = 11;
        newYear = selectedYear - 1;
      } else {
        newMonth = selectedMonth - 1;
      }
    } else {
      if (selectedMonth === 11) {
        newMonth = 0;
        newYear = selectedYear + 1;
      } else {
        newMonth = selectedMonth + 1;
      }
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };
  
  // Format month and year for display
  const formatMonthYear = (month, year) => {
    const monthNames = [
      "January", "February", "March", "April", 
      "May", "June", "July", "August", 
      "September", "October", "November", "December"
    ];
    return `${monthNames[month]} ${year}`;
  };
  
  // Get status color for calendar view
  const getStatusColor = (date) => {
    const formattedDate = formatDate(selectedYear, selectedMonth, date);
    const logsForDate = attendanceLogs.filter(log => log.date === formattedDate);
    
    if (logsForDate.length === 0) return "bg-gray-100";
    
    const statuses = logsForDate.map(log => log.status);
    if (statuses.includes("absent")) return "bg-red-100";
    if (statuses.includes("half-day")) return "bg-yellow-100";
    return "bg-green-100";
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Attendance Log System</h1>
        
        {/* Dashboard Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-xl font-semibold">
                {attendanceLogs.filter(log => log.status === "present").length}
              </p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Half-day</p>
              <p className="text-xl font-semibold">
                {attendanceLogs.filter(log => log.status === "half-day").length}
              </p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow flex items-center">
            <div className="rounded-full bg-red-100 p-3 mr-4">
              <XCircle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Absent</p>
              <p className="text-xl font-semibold">
                {attendanceLogs.filter(log => log.status === "absent").length}
              </p>
            </div>
          </div>
        </div>
        
        {/* Calendar View */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-medium">Monthly Overview</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigateMonth("prev")}
                className="p-1 rounded hover:bg-gray-100" 
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-md font-medium">
                {formatMonthYear(selectedMonth, selectedYear)}
              </span>
              <button 
                onClick={() => navigateMonth("next")}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="p-4 overflow-x-auto">
            <div className="grid grid-cols-7 gap-2 min-w-md">
              {/* Day headings */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                  {day}
                </div>
              ))}
              
              {/* Empty slots for correct day alignment */}
              {Array.from({ length: new Date(selectedYear, selectedMonth, 1).getDay() }).map((_, index) => (
                <div key={`empty-${index}`} className="h-10 rounded-md"></div>
              ))}
              
              {/* Calendar days */}
              {generateDaysArray().map(day => {
                const formattedDate = formatDate(selectedYear, selectedMonth, day);
                return (
                  <div 
                    key={day} 
                    className={`h-10 rounded-md ${getStatusColor(day)} flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors ${dateFilter === formattedDate ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setDateFilter(dateFilter === formattedDate ? '' : formattedDate)}
                  >
                    <span className="text-sm">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Filters Section */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center mb-4">
            <Filter size={20} className="text-gray-500 mr-2" />
            <h2 className="text-lg font-medium">Filters</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select
                className="w-full p-2 border rounded-md"
                value={employeeFilter}
                onChange={(e) => {
                  setEmployeeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Employees</option>
                {employees.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                className="w-full p-2 border rounded-md"
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full p-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half-day">Half-day</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-grow p-2 border rounded-md"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {dateFilter && (
                  <button 
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
                    onClick={() => setDateFilter("")}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Attendance Log Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-lg font-medium flex items-center">
              <FileText size={20} className="mr-2" />
              Attendance Records
            </h2>
            
            <div className="flex items-center gap-2">
              <select
                className="p-2 border rounded-md"
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
              
              <button className="p-2 bg-green-600 text-white rounded-md flex items-center">
                <Download size={18} className="mr-1" />
                Export
              </button>
            </div>
          </div>
          
          {/* Desktop view */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentLogs.length > 0 ? (
                  currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.name}</div>
                        <div className="text-sm text-gray-500">{log.employeeId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.checkIn || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.checkOut || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${log.status === "present" ? "bg-green-100 text-green-800" : 
                            log.status === "absent" ? "bg-red-100 text-red-800" : 
                            "bg-yellow-100 text-yellow-800"}`}>
                          {log.status === "present" ? "Present" : 
                           log.status === "absent" ? "Absent" : "Half-day"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.workHours}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.notes || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile view */}
          <div className="md:hidden">
            {currentLogs.length > 0 ? (
              currentLogs.map((log) => (
                <div key={log.id} className="p-4 border-b">
                  <div className="flex justify-between mb-2">
                    <div className="font-medium">{log.name}</div>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${log.status === "present" ? "bg-green-100 text-green-800" : 
                        log.status === "absent" ? "bg-red-100 text-red-800" : 
                        "bg-yellow-100 text-yellow-800"}`}>
                      {log.status === "present" ? "Present" : 
                       log.status === "absent" ? "Absent" : "Half-day"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">ID: {log.employeeId}</div>
                  <div className="text-sm text-gray-500">{log.department}</div>
                  <div className="text-sm text-gray-500">Date: {log.date}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-sm text-gray-500">Check In: {log.checkIn || "-"}</div>
                    <div className="text-sm text-gray-500">Check Out: {log.checkOut || "-"}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Hours: {log.workHours}</div>
                  {log.notes && <div className="text-sm text-gray-600 mt-1">Note: {log.notes}</div>}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                No attendance records found
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {filteredLogs.length > entriesPerPage && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstEntry + 1}</span> to{" "}
                    <span className="font-medium">
                      {indexOfLastEntry > filteredLogs.length ? filteredLogs.length : indexOfLastEntry}
                    </span>{" "}
                    of <span className="font-medium">{filteredLogs.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 ? "text-gray-300" : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.ceil(filteredLogs.length / entriesPerPage) }).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => paginate(index + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          currentPage === index + 1
                            ? "bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        } text-sm font-medium`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => paginate(currentPage < Math.ceil(filteredLogs.length / entriesPerPage) ? currentPage + 1 : currentPage)}
                      disabled={currentPage === Math.ceil(filteredLogs.length / entriesPerPage)}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === Math.ceil(filteredLogs.length / entriesPerPage)
                          ? "text-gray-300"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </nav>
                </div>
              </div>
              
              {/* Mobile pagination */}
              <div className="flex items-center justify-between w-full sm:hidden">
                <button
                  onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 ? "text-gray-300 bg-gray-50" : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {Math.ceil(filteredLogs.length / entriesPerPage)}
                </span>
                <button
                  onClick={() => paginate(currentPage < Math.ceil(filteredLogs.length / entriesPerPage) ? currentPage + 1 : currentPage)}
                  disabled={currentPage === Math.ceil(filteredLogs.length / entriesPerPage)}
                  className={`relative inline-flex items-center px-4 py-2 ml-3 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === Math.ceil(filteredLogs.length / entriesPerPage)
                      ? "text-gray-300 bg-gray-50"
                      : "text-gray-700 bg-white hover:bg-gray-50"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}