import React, { useState, useEffect, useCallback } from "react";
import { Download as DownloadIcon, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";

// Theme classes
const themeClasses = {
  dark: {
    bg: "bg-gradient-to-br from-slate-900 via-gray-800 to-slate-950",
    cardBg: "bg-white/10 backdrop-blur-lg border border-indigo-500/20",
    textPrimary: "text-gray-100",
    textSecondary: "text-indigo-300",
    textAccent: "text-white",
    buttonBg: "bg-gradient-to-r from-indigo-700 to-purple-700",
    buttonHover: "hover:bg-indigo-800",
    inputBg: "bg-white/5",
    errorBg: "bg-red-900/80 text-red-100",
    shadow: "shadow-xl shadow-indigo-900/30",
    glow: "shadow-[0_0_20px_rgba(99,102,241,0.3)]",
    headerBg: "bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950",
    tableHeader: "bg-indigo-900/30 text-indigo-200",
    tableRow: "hover:bg-indigo-900/20",
    loader: "border-indigo-500"
  },
  light: {
    bg: "bg-gradient-to-br from-indigo-50 via-purple-50 to-gray-100",
    cardBg: "bg-white/80 backdrop-blur-lg border border-indigo-200",
    textPrimary: "text-gray-800",
    textSecondary: "text-indigo-700",
    textAccent: "text-indigo-900",
    buttonBg: "bg-gradient-to-r from-indigo-500 to-purple-500",
    buttonHover: "hover:bg-indigo-600",
    inputBg: "bg-white",
    errorBg: "bg-red-50 text-red-700",
    shadow: "shadow-xl shadow-indigo-300/30",
    glow: "shadow-[0_0_20px_rgba(165,180,252,0.3)]",
    headerBg: "bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-500",
    tableHeader: "bg-indigo-200 text-indigo-800",
    tableRow: "hover:bg-indigo-100",
    loader: "border-indigo-500"
  }
};

const Download = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState("light");
  const currentTheme = themeClasses[theme];
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [dateFilter, setDateFilter] = useState("full");
  const [streamFilter, setStreamFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [placeFilter, setPlaceFilter] = useState("all");
  const [streams, setStreams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [places, setPlaces] = useState([]);

  // Authentication helper function
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios(url, options);
        return response;
      } catch (err) {
        // Don't retry on authentication errors
        if (err.response?.status === 401) {
          throw err;
        }
        if (i === retries - 1) throw err;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithRetry("http://localhost:5000/api/superadmin/students", {
        headers: getAuthHeaders(),
      });
      const data = res.data;
      setStudents(data);
      // Extract unique streams, departments, and places
      const uniqueStreams = [...new Set(data.map((s) => s.stream?.name).filter(Boolean))].sort();
      const uniqueDepartments = [...new Set(data.map((s) => s.department?.name).filter(Boolean))].sort();
      const uniquePlaces = [...new Set(data.map((s) => s.placeOfBirth).filter(Boolean))].sort();
      setStreams(uniqueStreams);
      setDepartments(uniqueDepartments);
      setPlaces(uniquePlaces);
      setFetchError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }
      setFetchError(err.response?.data?.error || "Failed to fetch students. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    // Filter students based on all filters
    const today = new Date(); // Use actual current date
    const filtered = students.filter((student) => {
      // Date filter
      let dateMatch = true;
      if (dateFilter !== "full") {
        const createdAt = student.createdAt ? new Date(student.createdAt) : null;
        if (!createdAt) return false;
        
        // Set time to end of day for today comparison
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);
        
        if (dateFilter === "today") {
          const todayStart = new Date(today);
          todayStart.setHours(0, 0, 0, 0);
          dateMatch = createdAt >= todayStart && createdAt <= todayEnd;
        } else if (dateFilter === "weekly") {
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          weekAgo.setHours(0, 0, 0, 0);
          dateMatch = createdAt >= weekAgo && createdAt <= todayEnd;
        } else if (dateFilter === "monthly") {
          const monthAgo = new Date(today);
          monthAgo.setDate(today.getDate() - 30);
          monthAgo.setHours(0, 0, 0, 0);
          dateMatch = createdAt >= monthAgo && createdAt <= todayEnd;
        }
      }
      // Stream filter
      const streamMatch = streamFilter === "all" || student.stream?.name === streamFilter;
      // Department filter
      const deptMatch = departmentFilter === "all" || student.department?.name === departmentFilter;
      // Place of birth filter
      const placeMatch = placeFilter === "all" || student.placeOfBirth === placeFilter;

      return dateMatch && streamMatch && deptMatch && placeMatch;
    });
    setFilteredStudents(filtered);
  }, [students, dateFilter, streamFilter, departmentFilter, placeFilter]);

  const handleDownloadExcel = () => {
    // Prepare data for Excel
    const worksheetData = filteredStudents.map((student) => ({
      "First Name": student.firstName || "N/A",
      "Middle Name": student.middleName || "N/A",
      "Last Name": student.lastName || "N/A",
      "Enrollment Number": student.enrollmentNumber || "N/A",
      "Gender": student.gender || "N/A",
      "Mobile Number": student.mobileNumber || "N/A",
      "Caste Category": student.casteCategory || "N/A",
      "Stream": student.stream?.name || "N/A",
      "Department": student.department?.name || "N/A",
      "Semester": student.semester?.number || "N/A",
      "Student ID": student.studentId || "N/A",
      "Place of Birth": student.placeOfBirth || "N/A",
      "Date of Admission": student.createdAt
        ? new Date(student.createdAt).toLocaleDateString("en-GB")
        : "N/A",
      "ABC ID": student.abcId || "N/A",
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    // Auto-size columns
    const colWidths = Object.keys(worksheetData[0] || {}).map((key) => ({
      wch: Math.max(
        key.length,
        ...(worksheetData.map((row) => (row[key] ? row[key].toString().length : 0)))
      ),
    }));
    worksheet["!cols"] = colWidths;

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    const fileName = `student_list_${dateFilter}_${streamFilter}_${departmentFilter}_${placeFilter}_${new Date().toISOString().split("T")[0]}.xlsx`;
    saveAs(data, fileName);
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.textPrimary} p-4 md:p-8 transition-colors duration-500`}>
      <style>
        {`
          ${theme === 'dark' ? `
            select option {
              color: white !important;
              background-color: #1e293b;
            }
            select::-ms-expand {
              background-color: #1e293b;
              color: white;
            }
          ` : `
            select option {
              color: black;
              background-color: white;
            }
            select::-ms-expand {
              background-color: white;
              color: black;
            }
          `}
        `}
      </style>

      {/* Theme Toggle */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`p-3 rounded-full ${theme === 'dark' ? 'bg-indigo-700' : 'bg-indigo-200'} shadow-lg hover:scale-110 transition-transform`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-yellow-300" />
          ) : (
            <Moon className="h-5 w-5 text-indigo-700" />
          )}
        </button>
      </div>

      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`${currentTheme.headerBg} rounded-2xl p-6 mb-8 ${currentTheme.shadow} ${currentTheme.glow}`}
      >
        <div className="flex items-center">
          <DownloadIcon size={32} className="text-white mr-4" />
          <div>
            <h1 className="text-3xl font-bold text-white">Student Data Download</h1>
            <p className="text-indigo-200 mt-2">Export filtered student records to Excel</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <div className={`${currentTheme.cardBg} ${currentTheme.shadow} rounded-2xl p-5`}>
          <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-2`}>
            Date Range
          </label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`w-full p-3 ${currentTheme.inputBg} ${currentTheme.cardBg} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            aria-label="Select date range"
          >
            <option value="today">Today ({new Date().toLocaleDateString('en-GB')})</option>
            <option value="weekly">Last 7 Days</option>
            <option value="monthly">Last 30 Days</option>
            <option value="full">Full Data</option>
          </select>
        </div>
        
        <div className={`${currentTheme.cardBg} ${currentTheme.shadow} rounded-2xl p-5`}>
          <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-2`}>
            Stream
          </label>
          <select
            value={streamFilter}
            onChange={(e) => setStreamFilter(e.target.value)}
            className={`w-full p-3 ${currentTheme.inputBg} ${currentTheme.cardBg} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            aria-label="Select stream"
          >
            <option value="all">All Streams</option>
            {streams.map((stream) => (
              <option key={stream} value={stream}>{stream}</option>
            ))}
          </select>
        </div>
        
        <div className={`${currentTheme.cardBg} ${currentTheme.shadow} rounded-2xl p-5`}>
          <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-2`}>
            Department
          </label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className={`w-full p-3 ${currentTheme.inputBg} ${currentTheme.cardBg} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            aria-label="Select department"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        
        <div className={`${currentTheme.cardBg} ${currentTheme.shadow} rounded-2xl p-5`}>
          <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-2`}>
            Place of Birth
          </label>
          <select
            value={placeFilter}
            onChange={(e) => setPlaceFilter(e.target.value)}
            className={`w-full p-3 ${currentTheme.inputBg} ${currentTheme.cardBg} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}
            aria-label="Select place of birth"
          >
            <option value="all">All Places</option>
            {places.map((place) => (
              <option key={place} value={place}>{place}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Download Button */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mb-8"
      >
        <button
          onClick={handleDownloadExcel}
          disabled={loading || filteredStudents.length === 0}
          className={`px-8 py-4 rounded-2xl text-white font-bold ${currentTheme.buttonBg} ${currentTheme.shadow} transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ${
            loading || filteredStudents.length === 0
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-indigo-700"
          }`}
          aria-label="Download student list as Excel"
        >
          <div className="flex items-center justify-center gap-3">
            <DownloadIcon size={20} />
            <span>Download Excel ({filteredStudents.length} Students)</span>
          </div>
        </button>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {fetchError && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`mb-6 p-4 rounded-xl flex justify-between items-center ${currentTheme.errorBg} ${currentTheme.shadow}`}
          >
            <span>{fetchError}</span>
            <button
              onClick={fetchStudents}
              className="px-3 py-1 bg-white/20 text-white rounded-lg transition-colors"
              aria-label="Retry fetching students"
            >
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="relative">
            <div className={`w-16 h-16 rounded-full border-t-4 ${currentTheme.loader} animate-spin`}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className={`w-8 h-8 rounded-full border-b-4 ${currentTheme.loader} animate-spin`}></div>
            </div>
          </div>
          <p className={`mt-6 ${currentTheme.textSecondary} font-medium`}>Loading student data...</p>
        </motion.div>
      ) : filteredStudents.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${currentTheme.cardBg} ${currentTheme.shadow} rounded-2xl p-10 text-center`}
        >
          <div className="text-5xl mb-4">📭</div>
          <h3 className={`text-xl font-bold ${currentTheme.textSecondary} mb-2`}>
            No students found
          </h3>
          <p className={currentTheme.textPrimary}>
            Try adjusting your filters to find matching records
          </p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className={`${currentTheme.cardBg} ${currentTheme.shadow} rounded-2xl overflow-hidden`}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className={currentTheme.tableHeader}>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Enrollment</th>
                  <th className="px-4 py-3 text-left">Gender</th>
                  <th className="px-4 py-3 text-left">Mobile</th>
                  <th className="px-4 py-3 text-left">Stream</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Semester</th>
                  <th className="px-4 py-3 text-left">Place of Birth</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <motion.tr 
                    key={student._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-t border-indigo-500/20 ${currentTheme.tableRow} transition-colors duration-200`}
                  >
                    <td className="px-4 py-3">
                      {student.firstName} {student.middleName || ""} {student.lastName || ""}
                    </td>
                    <td className="px-4 py-3">{student.enrollmentNumber || "N/A"}</td>
                    <td className="px-4 py-3">{student.gender || "N/A"}</td>
                    <td className="px-4 py-3">{student.mobileNumber || "N/A"}</td>
                    <td className="px-4 py-3">{student.stream?.name || "N/A"}</td>
                    <td className="px-4 py-3">{student.department?.name || "N/A"}</td>
                    <td className="px-4 py-3">{student.semester?.number || "N/A"}</td>
                    <td className="px-4 py-3">{student.placeOfBirth || "N/A"}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Download;