import { useState, useEffect } from "react";
import { GraduationCap, Users, Calendar, Search, Filter, ChevronDown, Download, Eye } from "lucide-react";
import axios from "axios";

const DepartmentStudents = ({ userData }) => {
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    graduatedStudents: 0,
    yearWiseData: {},
    sectionWiseData: {}
  });

  // Available years for current students (1st to 4th year typically)
  const academicYears = [
    "1", "2", "3", "4", "5" // Year levels instead of academic years
  ];

  useEffect(() => {
    fetchDepartmentStudents();
  }, [userData?.department]);

  const fetchDepartmentStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = userData?.token || localStorage.getItem("authToken");
      
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        return;
      }

      if (!userData?.department) {
        setError("Department information not found. Please contact administrator.");
        return;
      }

      console.log("Fetching students for department:", userData.department);
      
      const response = await axios.get(
        `http://localhost:5000/api/faculty/students/department/${encodeURIComponent(userData.department)}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const students = response.data.data.students || [];
        const apiStats = response.data.data.stats || {};
        
        // Transform the data to match our frontend format
        const transformedStudents = students.map(student => ({
          id: student._id,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber || `${student.department}${student.year}${student.section}${student._id?.slice(-3)}`,
          year: student.year,
          department: student.department,
          section: student.section,
          batch: student.batch,
          academicYear: calculateAcademicYear(student.year),
          status: "active", // All current students are active
          admissionDate: student.dob || "N/A",
          contactNumber: student.contactNumber,
          gender: student.gender,
          fatherName: student.fatherName,
          motherName: student.motherName
        }));

        setStudentsData(transformedStudents);
        calculateStats(transformedStudents, apiStats);
      } else {
        setError(response.data.message || "Failed to fetch students data");
      }

    } catch (err) {
      console.error("Error fetching students:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        // Optionally redirect to login
      } else if (err.response?.status === 404) {
        setError("No students found for this department.");
        setStudentsData([]);
        setStats({
          totalStudents: 0,
          activeStudents: 0,
          graduatedStudents: 0,
          yearWiseData: {},
          sectionWiseData: {}
        });
      } else {
        setError(err.response?.data?.message || "Failed to load students data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate academic year based on student year
  const calculateAcademicYear = (year) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Academic year starts in August (month 7)
    const academicStartYear = currentMonth >= 7 ? currentYear : currentYear - 1;
    const academicEndYear = academicStartYear + 1;
    
    return `${academicStartYear}-${academicEndYear.toString().slice(-2)}`;
  };

  const calculateStats = (students, apiStats = {}) => {
    const yearWiseStats = students.reduce((acc, student) => {
      const year = student.year || "Unknown";
      if (!acc[year]) {
        acc[year] = { total: 0, active: 0, graduated: 0 };
      }
      acc[year].total++;
      if (student.status === "active") acc[year].active++;
      if (student.status === "graduated") acc[year].graduated++;
      return acc;
    }, {});

    const sectionWiseStats = students.reduce((acc, student) => {
      const section = student.section || "Unknown";
      if (!acc[section]) {
        acc[section] = { total: 0, active: 0 };
      }
      acc[section].total++;
      if (student.status === "active") acc[section].active++;
      return acc;
    }, {});

    setStats({
      totalStudents: students.length,
      activeStudents: students.filter(s => s.status === "active").length,
      graduatedStudents: students.filter(s => s.status === "graduated").length,
      yearWiseData: yearWiseStats,
      sectionWiseData: sectionWiseStats,
      apiStats // Include any additional stats from the backend
    });
  };

  const filteredStudents = studentsData.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = !selectedYear || student.year?.toString() === selectedYear;
    
    const matchesFilter = filterBy === "all" || student.status === filterBy;
    
    return matchesSearch && matchesYear && matchesFilter;
  });

  const exportData = () => {
    const csvContent = [
      ["Name", "Roll Number", "Email", "Year", "Section", "Department", "Contact", "Gender", "Father Name"],
      ...filteredStudents.map(student => [
        student.name || "",
        student.rollNumber || "",
        student.email || "",
        student.year || "",
        student.section || "",
        student.department || "",
        student.contactNumber || "",
        student.gender || "",
        student.fatherName || ""
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${userData?.department}_students_year_${selectedYear || 'all'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <span className="text-gray-700 font-medium">Loading department students...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
              🎓 Department Students
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              View and manage current students data for {userData?.department} department
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-6 rounded-2xl text-center font-medium backdrop-blur-sm border bg-red-50/80 border-red-200 text-red-800">
              <span className="text-2xl mr-3">❌</span>
              {error}
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold">{stats.totalStudents}</p>
                </div>
                <GraduationCap className="h-12 w-12 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Students</p>
                  <p className="text-3xl font-bold">{stats.activeStudents}</p>
                </div>
                <Users className="h-12 w-12 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Year Wise</p>
                  <p className="text-3xl font-bold">{Object.keys(stats.yearWiseData || {}).length}</p>
                </div>
                <Calendar className="h-12 w-12 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Sections</p>
                  <p className="text-3xl font-bold">{Object.keys(stats.sectionWiseData || {}).length}</p>
                </div>
                <Filter className="h-12 w-12 text-orange-200" />
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Search */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  🔍 Search Students
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, roll number, or email..."
                    className="w-full pl-10 pr-4 py-4 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium"
                  />
                </div>
              </div>

              {/* Year Filter */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📅 Filter by Year
                </label>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-4 py-4 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium appearance-none"
                  >
                    <option value="">All Years</option>
                    {academicYears.map(year => (
                      <option key={year} value={year}>Year {year}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                </div>
              </div>

              {/* Status Filter */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📊 Filter by Status
                </label>
                <div className="relative">
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="w-full px-4 py-4 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium appearance-none"
                  >
                    <option value="all">All Students</option>
                    <option value="active">Active</option>
                    <option value="graduated">Graduated</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                </div>
              </div>

              {/* Export Button */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📤 Export Data
                </label>
                <button
                  onClick={exportData}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  👥 Current Students List
                </h3>
                <span className="text-sm bg-blue-100 px-4 py-2 rounded-full font-medium text-blue-700">
                  {filteredStudents.length} students found
                </span>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No Students Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || selectedYear || filterBy !== "all" 
                      ? "Try adjusting your search criteria"
                      : "No current students are enrolled in this department"
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">👤 Name</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">🆔 Roll Number</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">📧 Email</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">📅 Year</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">📝 Section</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">📞 Contact</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">👥 Gender</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700">📋 Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, index) => (
                        <tr 
                          key={student.id}
                          className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors duration-200"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                                {student.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{student.name}</div>
                                <div className="text-sm text-gray-500">{student.fatherName ? `Father: ${student.fatherName}` : ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-medium text-gray-700">
                            {student.rollNumber}
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            {student.email}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              Year {student.year}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                              {student.section}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            {student.contactNumber || 'N/A'}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              student.gender === 'Male' ? 'bg-blue-100 text-blue-800' : 
                              student.gender === 'Female' ? 'bg-pink-100 text-pink-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {student.gender || 'N/A'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {student.status === 'active' ? '✅ Active' : '⏸️ Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentStudents;
