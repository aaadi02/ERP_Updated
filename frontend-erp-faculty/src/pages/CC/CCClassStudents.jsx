import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  TrendingUp,
  UserCheck,
  ChevronLeft,
  RefreshCw,
  User,
  School,
  GraduationCap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const CCClassStudents = ({ userData }) => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    activeStudents: 0,
    maleStudents: 0,
    femaleStudents: 0,
  });

  useEffect(() => {
    fetchCCClassStudents();
  }, [userData]);

  const fetchCCClassStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.error("No auth token found");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/faculty/get-cc-class-students",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch class students: ${response.status}`);
      }

      const data = await response.json();
      console.log("CC Class Students Data:", data);

      if (data.success && data.data) {
        const studentsData = data.data.students || [];
        setStudents(studentsData);
        setStats({
          totalStudents: studentsData.length,
          averageAttendance: data.data.averageAttendance || 0,
          activeStudents: studentsData.filter((s) => s.status === "active")
            .length,
          maleStudents:
            studentsData.filter((s) => s.gender === "Male").length || 0,
          femaleStudents:
            studentsData.filter((s) => s.gender === "Female").length || 0,
        });

        if (studentsData.length === 0) {
          console.log("No students found for CC assignment");
        }
      } else {
        console.error("API returned success=false:", data);
      }
    } catch (error) {
      console.error("Error fetching CC class students:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.enrollmentNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesYear = !filterYear || student.year?.toString() === filterYear;
    const matchesSection =
      !filterSection ||
      student.section?.toUpperCase() === filterSection.toUpperCase();
    const matchesStatus = !filterStatus || student.status === filterStatus;

    return matchesSearch && matchesYear && matchesSection && matchesStatus;
  });

  const exportToCSV = () => {
    const headers = [
      "Enrollment Number",
      "Name",
      "Email",
      "Phone",
      "Year",
      "Section",
      "Department",
      "Gender",
      "Status",
      "Attendance %",
      "Address",
    ];

    const csvData = filteredStudents.map((student) => [
      student.enrollmentNumber || "",
      student.name || "",
      student.email || "",
      student.phone || "",
      student.year || "",
      student.section || "",
      student.department || "",
      student.gender || "",
      student.status || "",
      student.attendancePercentage || "0",
      student.address || "",
    ]);

    const csvContent = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CC_Class_Students_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return "text-green-600 bg-green-50";
    if (percentage >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <div
      className={`${color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {description && (
            <p className="text-white/70 text-xs mt-1">{description}</p>
          )}
        </div>
        <div className="bg-white/20 p-3 rounded-lg">
          <Icon size={24} />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center">
          <RefreshCw className="animate-spin text-indigo-600 mb-4" size={48} />
          <p className="text-gray-600 text-lg">Loading Class Students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/cc-dashboard")}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  🎓 My Class Students
                </h1>
                <p className="text-gray-600 text-lg">
                  Students from your assigned class - {userData?.department}{" "}
                  Department
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button
                onClick={fetchCCClassStudents}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={Users}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
            description="In your class"
          />
          <StatCard
            title="Active Students"
            value={stats.activeStudents}
            icon={UserCheck}
            color="bg-gradient-to-r from-green-500 to-green-600"
            description="Currently enrolled"
          />
          <StatCard
            title="Avg Attendance"
            value={`${stats.averageAttendance}%`}
            icon={TrendingUp}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
            description="Class average"
          />
          <StatCard
            title="Male Students"
            value={stats.maleStudents}
            icon={User}
            color="bg-gradient-to-r from-cyan-500 to-cyan-600"
            description="Gender distribution"
          />
          <StatCard
            title="Female Students"
            value={stats.femaleStudents}
            icon={User}
            color="bg-gradient-to-r from-pink-500 to-pink-600"
            description="Gender distribution"
          />
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Years</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
            </select>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterYear("");
                setFilterSection("");
                setFilterStatus("");
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <School className="h-6 w-6 text-indigo-600" />
                Class Students ({filteredStudents.length})
              </h2>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap size={64} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                No students found matching your criteria
              </p>
              <p className="text-gray-400 text-sm">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Info
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Academic Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student, index) => (
                    <tr
                      key={student._id || index}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                            {student.name?.charAt(0)?.toUpperCase() || "S"}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.enrollmentNumber || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen size={14} className="text-indigo-600" />
                            Year {student.year || "N/A"} - Section{" "}
                            {student.section || "N/A"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {student.department || "N/A"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-2 mb-1">
                            <Mail size={14} className="text-gray-400" />
                            <span className="truncate">
                              {student.email || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-gray-400" />
                            <span>{student.phone || "N/A"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAttendanceColor(
                            student.attendancePercentage || 0
                          )}`}
                        >
                          {student.attendancePercentage || 0}%
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            student.status === "active"
                              ? "text-green-700 bg-green-100"
                              : student.status === "inactive"
                              ? "text-red-700 bg-red-100"
                              : "text-gray-700 bg-gray-100"
                          }`}
                        >
                          {student.status || "unknown"}
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
  );
};

export default CCClassStudents;
