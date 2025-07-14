import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Calendar,
  Clock,
  UserCheck,
  UserX,
  Users,
  BarChart2,
  ChevronDown,
  Filter,
  Search,
  X,
  Check,
} from "lucide-react";

export default function AttendanceDashboard() {
  const [activeTab, setActiveTab] = useState("students");
  const [dateRange, setDateRange] = useState("monthly");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [attendanceFilter, setAttendanceFilter] = useState("All");
  const [allStudentAttendanceData, setAllStudentAttendanceData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    yearly: [],
  });
  const [allFacultyAttendanceData, setAllFacultyAttendanceData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    yearly: [],
  });
  const [allStudentsList, setAllStudentsList] = useState([]);
  const [allFacultyList, setAllFacultyList] = useState([]);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Replace with your actual data fetching logic
        const studentAttendanceResponse = await fetch(
          "/api/attendance/students"
        );
        const facultyAttendanceResponse = await fetch(
          "/api/attendance/faculty"
        );
        const studentsListResponse = await fetch("/api/students");
        const facultyListResponse = await fetch("/api/faculty");

        const studentAttendanceData = await studentAttendanceResponse.json();
        const facultyAttendanceData = await facultyAttendanceResponse.json();
        const studentsListData = await studentsListResponse.json();
        const facultyListData = await facultyListResponse.json();

        setAllStudentAttendanceData(studentAttendanceData);
        setAllFacultyAttendanceData(facultyAttendanceData);
        setAllStudentsList(studentsListData);
        setAllFacultyList(facultyListData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Reset to first page when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery("");
    setSelectedDepartment("All");
    setAttendanceFilter("All");
  }, [activeTab]);

  // Dynamic data based on date range
  const attendanceData =
    activeTab === "students"
      ? allStudentAttendanceData[dateRange]
      : allFacultyAttendanceData[dateRange];

  // Get current list data with filters and search
  const filteredList = useMemo(() => {
    const originalList =
      activeTab === "students" ? allStudentsList : allFacultyList;

    return originalList.filter((item) => {
      // Search filter
      const searchFields =
        activeTab === "students"
          ? [item.name, item.rollNo]
          : [item.name, item.empId, item.department];

      const matchesSearch =
        searchQuery === "" ||
        searchFields.some((field) =>
          field.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Department filter
      const matchesDepartment =
        selectedDepartment === "All" || item.department === selectedDepartment;

      // Attendance filter
      let matchesAttendance = true;
      if (attendanceFilter === "Above 90") {
        matchesAttendance = item.attendance >= 90;
      } else if (attendanceFilter === "75-90") {
        matchesAttendance = item.attendance >= 75 && item.attendance < 90;
      } else if (attendanceFilter === "Below 75") {
        matchesAttendance = item.attendance < 75;
      }

      return matchesSearch && matchesDepartment && matchesAttendance;
    });
  }, [activeTab, searchQuery, selectedDepartment, attendanceFilter]);

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <header className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-800">
            Attendance Dashboard
          </h1>
          <div className="flex items-center mt-4 md:mt-0 space-x-4">
            <div className="bg-gray-100 rounded-md p-2 flex items-center">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-700">May 06, 2025</span>
            </div>
            <div className="bg-blue-100 rounded-md p-2 flex items-center">
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
              <select
                className="text-sm bg-transparent border-none focus:outline-none text-blue-700"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6 p-1">
        <div className="flex">
          <button
            className={`flex-1 py-3 text-center font-medium rounded-md transition-colors ${
              activeTab === "students"
                ? "bg-blue-100 text-blue-800"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("students")}
          >
            Student Attendance
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium rounded-md transition-colors ${
              activeTab === "faculty"
                ? "bg-blue-100 text-blue-800"
                : "text-gray-500 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("faculty")}
          >
            Faculty Attendance
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total"
            value={activeTab === "students" ? "450 Students" : "50 Faculty"}
            icon={<Users className="h-8 w-8 text-blue-500" />}
            color="blue"
          />
          <SummaryCard
            title="Present Today"
            value={activeTab === "students" ? "418 (93%)" : "47 (94%)"}
            icon={<UserCheck className="h-8 w-8 text-green-500" />}
            color="green"
          />
          <SummaryCard
            title="Absent Today"
            value={activeTab === "students" ? "32 (7%)" : "3 (6%)"}
            icon={<UserX className="h-8 w-8 text-red-500" />}
            color="red"
          />
          <SummaryCard
            title="Average Attendance"
            value={activeTab === "students" ? "85%" : "92%"}
            icon={<BarChart2 className="h-8 w-8 text-purple-500" />}
            color="purple"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Trend */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">
              Attendance Trend (
              {dateRange === "daily"
                ? "Last 7 Days"
                : dateRange === "weekly"
                ? "Last 4 Weeks"
                : dateRange === "monthly"
                ? "Last 6 Months"
                : "Last 4 Years"}
              )
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={attendanceData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Attendance */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Daily Attendance</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={
                    activeTab === "students"
                      ? studentDailyAttendance
                      : facultyDailyAttendance
                  }
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="present" name="Present" fill="#4ade80" />
                  <Bar dataKey="absent" name="Absent" fill="#f87171" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Attendance by Subject/Department and Attendance List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie Chart */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">
              {activeTab === "students"
                ? "Attendance by Subject"
                : "Attendance by Department"}
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      activeTab === "students"
                        ? studentAttendanceBySubject
                        : facultyAttendanceByDepartment
                    }
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {(activeTab === "students"
                      ? studentAttendanceBySubject
                      : facultyAttendanceByDepartment
                    ).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attendance List */}
          <div className="bg-white p-4 rounded-lg shadow-md lg:col-span-2">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <h2 className="text-lg font-semibold">
                {activeTab === "students"
                  ? "Student Attendance List"
                  : "Faculty Attendance List"}
              </h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8 pr-4 py-1 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <Search className="absolute left-2 top-1.5 h-4 w-4 text-gray-400" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  className="flex items-center text-sm text-gray-600 border rounded-md px-2 py-1 hover:bg-gray-50"
                  onClick={() => setFilterModalOpen(true)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                  <ChevronDown className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>

            {/* Active filters display */}
            {(selectedDepartment !== "All" || attendanceFilter !== "All") && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedDepartment !== "All" && (
                  <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md flex items-center">
                    Department: {selectedDepartment}
                    <button
                      onClick={() => setSelectedDepartment("All")}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {attendanceFilter !== "All" && (
                  <div className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md flex items-center">
                    Attendance: {attendanceFilter}
                    <button
                      onClick={() => setAttendanceFilter("All")}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelectedDepartment("All");
                    setAttendanceFilter("All");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Filter Modal */}
            {filterModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Filter Options</h3>
                    <button
                      onClick={() => setFilterModalOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attendance Range
                    </label>
                    <select
                      value={attendanceFilter}
                      onChange={(e) => setAttendanceFilter(e.target.value)}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="All">All</option>
                      <option value="Above 90">Above 90%</option>
                      <option value="75-90">75% - 90%</option>
                      <option value="Below 75">Below 75%</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setSelectedDepartment("All");
                        setAttendanceFilter("All");
                      }}
                      className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => {
                        setFilterModalOpen(false);
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {activeTab === "students" ? (
                      <>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Roll No
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Present
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Absent
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance %
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Emp ID
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Present
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Absent
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attendance %
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length > 0 ? (
                    currentItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {activeTab === "students" ? item.rollNo : item.empId}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                          {item.department}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600">
                          {item.present}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600">
                          {item.absent}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm mr-2">
                              {item.attendance}%
                            </span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  item.attendance >= 90
                                    ? "bg-green-500"
                                    : item.attendance >= 75
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }`}
                                style={{ width: `${item.attendance}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-4 text-center text-sm text-gray-500"
                      >
                        No records found. Try changing your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredList.length > 0 && (
              <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                <div>
                  Showing {indexOfFirstItem + 1}-
                  {Math.min(indexOfLastItem, filteredList.length)} of{" "}
                  {filteredList.length}{" "}
                  {activeTab === "students" ? "students" : "faculty"}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => paginate(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`border rounded px-3 py-1 ${
                      currentPage === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  {[...Array(totalPages).keys()].map((number) => {
                    // Show limited page numbers with ellipsis
                    if (
                      totalPages <= 5 ||
                      number === 0 ||
                      number === totalPages - 1 ||
                      (currentPage - 2 <= number && number <= currentPage + 0)
                    ) {
                      return (
                        <button
                          key={number + 1}
                          onClick={() => paginate(number + 1)}
                          className={`border rounded px-3 py-1 ${
                            currentPage === number + 1
                              ? "bg-blue-50 text-blue-600"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {number + 1}
                        </button>
                      );
                    }

                    // Add ellipsis
                    if (
                      (number === 1 && currentPage > 3) ||
                      (number === totalPages - 2 &&
                        currentPage < totalPages - 2)
                    ) {
                      return (
                        <span key={number} className="px-1">
                          ...
                        </span>
                      );
                    }

                    return null;
                  })}

                  <button
                    onClick={() =>
                      paginate(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`border rounded px-3 py-1 ${
                      currentPage === totalPages
                        ? "text-gray-300 cursor-not-allowed"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton
              title="Export Report"
              description="Download attendance as Excel/CSV"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              }
            />
            <QuickActionButton
              title="Print Report"
              description="Generate printable report"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
              }
            />
            <QuickActionButton
              title="Mark Attendance"
              description="Record today's attendance"
              icon={<Check className="h-5 w-5" />}
            />
            <QuickActionButton
              title="Send Notifications"
              description="Alert for low attendance"
              icon={
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
    purple: "bg-purple-50 border-purple-200",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} shadow-sm`}>
      <div className="flex justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
        <div>{icon}</div>
      </div>
    </div>
  );
}

// Quick Action Button Component
function QuickActionButton({ title, description, icon }) {
  return (
    <button className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-colors group">
      <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-200">
        {icon}
      </div>
      <div className="ml-3 text-left">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </button>
  );
}
