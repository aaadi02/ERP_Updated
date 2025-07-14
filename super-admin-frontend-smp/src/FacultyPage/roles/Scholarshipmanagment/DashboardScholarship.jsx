
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Sun, Moon, Users, FileText, CheckSquare, MessageSquare, X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const DashboardScholarship = () => {
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const [useDummyData, setUseDummyData] = useState(false);

  const themeClasses = {
    dark: {
      bg: "bg-gradient-to-br from-neutral-900 via-gray-800 to-neutral-950",
      headerBg: "bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-900",
      headerBorder: "border-b-4 border-indigo-400/30",
      cardBg: "bg-white/10 backdrop-blur-lg",
      cardBorder: "border border-indigo-400/20",
      textPrimary: "text-gray-50",
      textSecondary: "text-indigo-200",
      textAccent: "text-white",
      buttonBg: "bg-gradient-to-r from-indigo-700 to-purple-700",
      buttonHover: "hover:bg-indigo-800",
      chartBg: "bg-white/10 backdrop-blur-xl",
      glow: "bg-indigo-400/30",
      doughnutGlow: "bg-purple-400/20",
      errorBg: "bg-red-900/80 text-red-100",
      dropdownBg: "bg-gray-800",
      dropdownText: "text-gray-100",
      checkboxText: "text-gray-200",
    },
    light: {
      bg: "bg-gradient-to-br from-indigo-50 via-purple-50 to-gray-100",
      headerBg: "bg-gradient-to-r from-indigo-300 via-purple-300 to-indigo-400",
      headerBorder: "border-b-4 border-indigo-200",
      cardBg: "bg-white/80 backdrop-blur-lg",
      cardBorder: "border border-indigo-200",
      textPrimary: "text-gray-800",
      textSecondary: "text-indigo-700",
      textAccent: "text-indigo-900",
      buttonBg: "bg-gradient-to-r from-indigo-500 to-purple-500",
      buttonHover: "hover:bg-indigo-600",
      chartBg: "bg-white/80 backdrop-blur-xl",
      glow: "bg-indigo-300/30",
      doughnutGlow: "bg-purple-300/20",
      errorBg: "bg-red-50 text-red-700",
      dropdownBg: "bg-gray-50",
      dropdownText: "text-gray-700",
      checkboxText: "text-gray-700",
    },
  };

  const currentTheme = themeClasses[theme];

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalApprovedScholarships: 0,
    totalRemarks: 0,
    totalApprovals: 0,
    studentsByCaste: [],
    studentsByStream: [],
    approvedScholarshipsByCaste: [],
    approvedScholarshipsByStream: [],
    remarksByCaste: [],
    remarksByStream: [],
    approvalsByCaste: [],
    approvalsByStream: [],
  });
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [activeStat, setActiveStat] = useState("");
  const [filterSelections, setFilterSelections] = useState({
    totalStudents: "Caste",
    approvedScholarships: "Caste",
    totalRemarks: "Caste",
    totalApprovals: "Caste",
  });
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenStat, setFullScreenStat] = useState(null);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

  const dummyStats = {
    totalStudents: 100,
    totalApprovedScholarships: 50,
    totalRemarks: 20,
    totalApprovals: 30,
    studentsByCaste: [
      { name: "General", count: 40 },
      { name: "OBC", count: 30 },
      { name: "SC", count: 20 },
      { name: "ST", count: 10 },
    ],
    studentsByStream: [
      { name: "Engineering", count: 50 },
      { name: "Medical", count: 30 },
      { name: "Arts", count: 20 },
    ],
    approvedScholarshipsByCaste: [
      { name: "General", count: 20 },
      { name: "OBC", count: 15 },
      { name: "SC", count: 10 },
      { name: "ST", count: 5 },
    ],
    approvedScholarshipsByStream: [
      { name: "Engineering", count: 25 },
      { name: "Medical", count: 15 },
      { name: "Arts", count: 10 },
    ],
    remarksByCaste: [
      { name: "General", count: 8 },
      { name: "OBC", count: 6 },
      { name: "SC", count: 4 },
      { name: "ST", count: 2 },
    ],
    remarksByStream: [
      { name: "Engineering", count: 10 },
      { name: "Medical", count: 6 },
      { name: "Arts", count: 4 },
    ],
    approvalsByCaste: [
      { name: "General", count: 12 },
      { name: "OBC", count: 9 },
      { name: "SC", count: 6 },
      { name: "ST", count: 3 },
    ],
    approvalsByStream: [
      { name: "Engineering", count: 15 },
      { name: "Medical", count: 9 },
      { name: "Arts", count: 6 },
    ],
  };

  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios(url, options);
        return response;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const fetchData = useCallback(async () => {
    if (useDummyData) {
      console.log("Using dummy data:", dummyStats);
      setStats(dummyStats);
      setFetchError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const studentRes = await fetchWithRetry("http://localhost:5000/api/students", {
        headers: { Authorization: `Bearer ${localStorage.getItem("facultyToken")}` },
      });
      const scholarshipRes = await fetchWithRetry("http://localhost:5000/api/scholarships", {
        headers: { Authorization: `Bearer ${localStorage.getItem("facultyToken")}` },
      });
      console.log("Fetched students:", studentRes.data);
      console.log("Fetched scholarships:", scholarshipRes.data);

      if (!Array.isArray(studentRes.data)) {
        throw new Error("Students data is not an array");
      }
      if (!Array.isArray(scholarshipRes.data)) {
        throw new Error("Scholarships data is not an array");
      }

      const totalStudents = studentRes.data.length || 0;
      const totalApprovedScholarships = scholarshipRes.data.filter(
        (s) => s.scholarshipStatus === "Yes"
      ).length || 0;
      const totalRemarks = scholarshipRes.data.reduce(
        (acc, s) => acc + (Array.isArray(s.pdfs) ? s.pdfs.filter((pdf) => pdf.remark).length : 0),
        0
      );
      const totalApprovals = scholarshipRes.data.reduce(
        (acc, s) => acc + (Array.isArray(s.pdfs) ? s.pdfs.filter((pdf) => pdf.remark === "").length : 0),
        0
      );

      const studentsByCasteMap = new Map();
      studentRes.data.forEach((student) => {
        if (student.casteCategory) {
          studentsByCasteMap.set(
            student.casteCategory,
            (studentsByCasteMap.get(student.casteCategory) || 0) + 1
          );
        }
      });
      const studentsByCaste = Array.from(studentsByCasteMap, ([name, value]) => ({
        name,
        count: value,
      }));

      const studentsByStreamMap = new Map();
      studentRes.data.forEach((student) => {
        if (student.stream?.name) {
          studentsByStreamMap.set(
            student.stream.name,
            (studentsByStreamMap.get(student.stream.name) || 0) + 1
          );
        }
      });
      const studentsByStream = Array.from(studentsByStreamMap, ([name, value]) => ({
        name,
        count: value,
      }));

      const approvedScholarshipsByCasteMap = new Map();
      scholarshipRes.data.forEach((scholarship) => {
        if (scholarship.scholarshipStatus === "Yes") {
          const student = studentRes.data.find((s) => s.studentId === scholarship.studentId);
          if (student && student.casteCategory) {
            approvedScholarshipsByCasteMap.set(
              student.casteCategory,
              (approvedScholarshipsByCasteMap.get(student.casteCategory) || 0) + 1
            );
          }
        }
      });
      const approvedScholarshipsByCaste = Array.from(approvedScholarshipsByCasteMap, ([name, value]) => ({
        name,
        count: value,
      }));

      const approvedScholarshipsByStreamMap = new Map();
      scholarshipRes.data.forEach((scholarship) => {
        if (scholarship.scholarshipStatus === "Yes") {
          const student = studentRes.data.find((s) => s.studentId === scholarship.studentId);
          if (student && student.stream?.name) {
            approvedScholarshipsByStreamMap.set(
              student.stream.name,
              (approvedScholarshipsByStreamMap.get(student.stream.name) || 0) + 1
            );
          }
        }
      });
      const approvedScholarshipsByStream = Array.from(approvedScholarshipsByStreamMap, ([name, value]) => ({
        name,
        count: value,
      }));

      const remarksByCasteMap = new Map();
      scholarshipRes.data.forEach((scholarship) => {
        if (scholarship.scholarshipStatus === "Yes") {
          const student = studentRes.data.find((s) => s.studentId === scholarship.studentId);
          if (student && student.casteCategory) {
            const remarks = Array.isArray(scholarship.pdfs) ? scholarship.pdfs.filter((pdf) => pdf.remark).length : 0;
            if (remarks > 0) {
              remarksByCasteMap.set(
                student.casteCategory,
                (remarksByCasteMap.get(student.casteCategory) || 0) + remarks
              );
            }
          }
        }
      });
      const remarksByCaste = Array.from(remarksByCasteMap, ([name, value]) => ({
        name,
        count: value,
      }));

      const remarksByStreamMap = new Map();
      scholarshipRes.data.forEach((scholarship) => {
        if (scholarship.scholarshipStatus === "Yes") {
          const student = studentRes.data.find((s) => s.studentId === scholarship.studentId);
          if (student && student.stream?.name) {
            const remarks = Array.isArray(scholarship.pdfs) ? scholarship.pdfs.filter((pdf) => pdf.remark).length : 0;
            if (remarks > 0) {
              remarksByStreamMap.set(
                student.stream.name,
                (remarksByStreamMap.get(student.stream.name) || 0) + remarks
              );
            }
          }
        }
      });
      const remarksByStream = Array.from(remarksByStreamMap, ([name, value]) => ({
        name,
        count: value,
      }));

      const approvalsByCasteMap = new Map();
      scholarshipRes.data.forEach((scholarship) => {
        if (scholarship.scholarshipStatus === "Yes") {
          const student = studentRes.data.find((s) => s.studentId === scholarship.studentId);
          if (student && student.casteCategory) {
            const approvals = Array.isArray(scholarship.pdfs) ? scholarship.pdfs.filter((pdf) => pdf.remark === "").length : 0;
            if (approvals > 0) {
              approvalsByCasteMap.set(
                student.casteCategory,
                (approvalsByCasteMap.get(student.casteCategory) || 0) + approvals
              );
            }
          }
        }
      });
      const approvalsByCaste = Array.from(approvalsByCasteMap, ([name, value]) => ({
        name,
        count: value,
      }));

      const approvalsByStreamMap = new Map();
      scholarshipRes.data.forEach((scholarship) => {
        if (scholarship.scholarshipStatus === "Yes") {
          const student = studentRes.data.find((s) => s.studentId === scholarship.studentId);
          if (student && student.stream?.name) {
            const approvals = Array.isArray(scholarship.pdfs) ? scholarship.pdfs.filter((pdf) => pdf.remark === "").length : 0;
            if (approvals > 0) {
              approvalsByStreamMap.set(
                student.stream.name,
                (approvalsByStreamMap.get(student.stream.name) || 0) + approvals
              );
            }
          }
        }
      });
      const approvalsByStream = Array.from(approvalsByStreamMap, ([name, value]) => ({
        name,
        count: value,
      }));

      const newStats = {
        totalStudents,
        totalApprovedScholarships,
        totalRemarks,
        totalApprovals,
        studentsByCaste,
        studentsByStream,
        approvedScholarshipsByCaste,
        approvedScholarshipsByStream,
        remarksByCaste,
        remarksByStream,
        approvalsByCaste,
        approvalsByStream,
      };
      console.log("Computed stats:", newStats);
      setStats(newStats);
      setFetchError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Failed to fetch data. Please check your connection.";
      setFetchError(errorMsg);
      console.error("Fetch error:", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [useDummyData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCardClick = (stat) => {
    console.log("Clicked stat:", stat, "Current activeStat:", activeStat, "isFullScreen:", isFullScreen);
    if (activeStat === stat && !isFullScreen) {
      setIsFullScreen(true);
      setFullScreenStat(stat);
    } else if (isFullScreen && stat === fullScreenStat) {
      setIsFullScreen(false);
      setFullScreenStat(null);
      setActiveStat("");
    } else {
      setActiveStat(stat);
      setIsFullScreen(false);
      setFullScreenStat(null);
    }
  };

  const handleCloseFullScreen = () => {
    console.log("Closing full-screen, current stat:", fullScreenStat);
    setIsFullScreen(false);
    setFullScreenStat(null);
    setActiveStat("");
  };

  const handleFilterChange = (stat, value) => {
    console.log("Filter changed for", stat, "to", value);
    setFilterSelections((prev) => ({ ...prev, [stat]: value }));
  };

  const renderChart = (data, title, dataKey, fill) => {
    console.log(`Rendering chart for ${title}:`, data);
    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <div className={`text-center py-4 ${currentTheme.textSecondary} bg-red-100/50 rounded-lg`}>
          No data available for {title}. {useDummyData ? "Using dummy data." : "Check API data or try dummy data."}
        </div>
      );
    }
    // Validate data structure
    const isValidData = data.every((item) => item.name && typeof item.count === "number");
    if (!isValidData) {
      console.error(`Invalid data format for ${title}:`, data);
      return (
        <div className={`text-center py-4 ${currentTheme.textSecondary} bg-red-100/50 rounded-lg`}>
          Invalid data format for {title}. Expected array of {`{ name: string, count: number }`}.
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={isFullScreen ? "80%" : 300} minHeight={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#4B5EAA" : "#D1D5DB"} />
          <XAxis dataKey="name" stroke={theme === "dark" ? "#E5E7EB" : "#374151"} />
          <YAxis stroke={theme === "dark" ? "#E5E7EB" : "#374151"} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme === "dark" ? "#1F2937" : "#FFFFFF",
              border: `1px solid ${theme === "dark" ? "#4B5EAA" : "#D1D5DB"}`,
              borderRadius: "8px",
              color: theme === "dark" ? "#E5E7EB" : "#374151",
            }}
          />
          <Legend wrapperStyle={{ color: theme === "dark" ? "#E5E7EB" : "#374151" }} />
          <Bar dataKey={dataKey} fill={fill} name={title} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderFullScreenChart = () => {
    if (!fullScreenStat) return null;
    let data, title, dataKey, fill;
    switch (fullScreenStat) {
      case "totalStudents":
        data = filterSelections.totalStudents === "Caste" ? stats.studentsByCaste : stats.studentsByStream;
        title = "Students";
        dataKey = "count";
        fill = "#0088FE";
        break;
      case "approvedScholarships":
        data = filterSelections.approvedScholarships === "Caste" ? stats.approvedScholarshipsByCaste : stats.approvedScholarshipsByStream;
        title = "Approved Scholarships";
        dataKey = "count";
        fill = "#00C49F";
        break;
      case "totalRemarks":
        data = filterSelections.totalRemarks === "Caste" ? stats.remarksByCaste : stats.remarksByStream;
        title = "Remarks";
        dataKey = "count";
        fill = "#FF8042";
        break;
      case "totalApprovals":
        data = filterSelections.totalApprovals === "Caste" ? stats.approvalsByCaste : stats.approvalsByStream;
        title = "Approvals";
        dataKey = "count";
        fill = "#8884D8";
        break;
      default:
        return null;
    }
    console.log(`Full-screen chart data for ${title}:`, data);
    return (
      <div className={`fixed inset-0 ${currentTheme.bg} flex items-center justify-center z-50 animate-fade-in`}>
        <div className={`w-full h-full max-w-7xl p-4 md:p-8 ${currentTheme.cardBg} ${currentTheme.cardBorder} rounded-2xl shadow-2xl`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-semibold ${currentTheme.textSecondary}`}>{title}</h2>
            <button
              onClick={handleCloseFullScreen}
              className={`p-2 rounded-full ${theme === "dark" ? "bg-indigo-700" : "bg-indigo-200"} ${currentTheme.buttonHover} shadow-lg`}
              aria-label="Close full-screen chart"
            >
              <X className={`h-5 w-5 ${theme === "dark" ? "text-yellow-300" : "text-indigo-700"}`} />
            </button>
          </div>
          <div className="relative mb-4">
            <select
              value={filterSelections[fullScreenStat]}
              onChange={(e) => handleFilterChange(fullScreenStat, e.target.value)}
              className={`w-full md:w-1/4 p-3 ${currentTheme.cardBorder} rounded-xl appearance-none focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all text-sm ${
                theme === "dark" ? "bg-white/5 text-white" : "bg-white text-gray-800"
              }`}
              aria-label={`Select filter for ${title}`}
            >
              <option value="Caste">Caste</option>
              <option value="Stream">Stream</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
              <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
          <div className={`p-4 rounded-xl ${currentTheme.chartBg} min-h-[400px]`}>
            {renderChart(data, title, dataKey, fill)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.textPrimary} transition-colors duration-500`} role="main">
      <div className={`${currentTheme.headerBg} py-6 px-4 md:px-8 shadow-xl ${currentTheme.headerBorder}`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1
            className={`text-3xl md:text-4xl font-extrabold tracking-tight ${
              theme === "dark"
                ? "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]"
                : "text-indigo-900 drop-shadow-[0_2px_8px_rgba(99,102,241,0.12)]"
            } transition-all duration-500`}
          >
            Scholarship Dashboard
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setUseDummyData(!useDummyData)}
              className={`p-2 rounded-full ${theme === "dark" ? "bg-indigo-700" : "bg-indigo-200"} ${currentTheme.buttonHover} shadow-lg hover:scale-110 transition-transform`}
              aria-label={useDummyData ? "Use API Data" : "Use Dummy Data"}
            >
              {useDummyData ? (
                <span className="h-5 w-5 text-yellow-300">API</span>
              ) : (
                <span className="h-5 w-5 text-indigo-700">Dummy</span>
              )}
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${theme === "dark" ? "bg-indigo-700" : "bg-indigo-200"} shadow-lg hover:scale-110 transition-transform`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-300" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isFullScreen ? (
        renderFullScreenChart()
      ) : (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <div className={`${currentTheme.cardBg} rounded-2xl shadow-2xl p-6 md:p-8 ${currentTheme.cardBorder} transition-all duration-300 animate-fade-in`}>
            {fetchError && (
              <div className={`mb-6 p-4 rounded-lg flex justify-between items-center animate-fade-in ${currentTheme.errorBg}`}>
                <span>{fetchError}</span>
                <button
                  onClick={fetchData}
                  className="px-3 py-1 bg-white/20 text-white rounded-lg transition-colors"
                  aria-label="Retry fetching data"
                >
                  Retry
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-40 animate-fade-in">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className={`ml-2 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Loading dashboard...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div
                  className={`${currentTheme.cardBg} rounded-xl p-6 shadow-lg hover:scale-105 transition-all duration-300 animate-fade-in-up cursor-pointer`}
                  style={{ animationDelay: "0s" }}
                  onClick={() => handleCardClick("totalStudents")}
                >
                  <div className="flex items-center">
                    <Users size={48} className={`${theme === "dark" ? "text-blue-400" : "text-blue-500"} mr-4`} />
                    <div>
                      <h2 className={`text-lg font-semibold ${currentTheme.textSecondary}`}>Total Students</h2>
                      <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>{stats.totalStudents}</p>
                    </div>
                  </div>
                  {activeStat === "totalStudents" && (
                    <div className="mt-4">
                      <div className="relative">
                        <select
                          value={filterSelections.totalStudents}
                          onChange={(e) => handleFilterChange("totalStudents", e.target.value)}
                          className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl appearance-none focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all text-sm ${
                            theme === "dark" ? "bg-white/5 text-white" : "bg-white text-gray-800"
                          }`}
                          aria-label="Select filter for Total Students"
                        >
                          <option value="Caste">Caste</option>
                          <option value="Stream">Stream</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                          <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                      <div className={`mt-4 p-4 rounded-xl ${currentTheme.chartBg} min-h-[300px]`}>
                        {filterSelections.totalStudents === "Caste"
                          ? renderChart(stats.studentsByCaste, "Students", "count", "#0088FE")
                          : renderChart(stats.studentsByStream, "Students", "count", "#0088FE")}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`${currentTheme.cardBg} rounded-xl p-6 shadow-lg hover:scale-105 transition-all duration-300 animate-fade-in-up cursor-pointer`}
                  style={{ animationDelay: "0.1s" }}
                  onClick={() => handleCardClick("approvedScholarships")}
                >
                  <div className="flex items-center">
                    <FileText size={48} className={`${theme === "dark" ? "text-green-400" : "text-green-500"} mr-4`} />
                    <div>
                      <h2 className={`text-lg font-semibold ${currentTheme.textSecondary}`}>Approved Scholarships</h2>
                      <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>{stats.totalApprovedScholarships}</p>
                    </div>
                  </div>
                  {activeStat === "approvedScholarships" && (
                    <div className="mt-4">
                      <div className="relative">
                        <select
                          value={filterSelections.approvedScholarships}
                          onChange={(e) => handleFilterChange("approvedScholarships", e.target.value)}
                          className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl appearance-none focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all text-sm ${
                            theme === "dark" ? "bg-white/5 text-white" : "bg-white text-gray-800"
                          }`}
                          aria-label="Select filter for Approved Scholarships"
                        >
                          <option value="Caste">Caste</option>
                          <option value="Stream">Stream</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                          <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                      <div className={`mt-4 p-4 rounded-xl ${currentTheme.chartBg} min-h-[300px]`}>
                        {filterSelections.approvedScholarships === "Caste"
                          ? renderChart(stats.approvedScholarshipsByCaste, "Approved Scholarships", "count", "#00C49F")
                          : renderChart(stats.approvedScholarshipsByStream, "Approved Scholarships", "count", "#00C49F")}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`${currentTheme.cardBg} rounded-xl p-6 shadow-lg hover:scale-105 transition-all duration-300 animate-fade-in-up cursor-pointer`}
                  style={{ animationDelay: "0.2s" }}
                  onClick={() => handleCardClick("totalRemarks")}
                >
                  <div className="flex items-center">
                    <MessageSquare size={48} className={`${theme === "dark" ? "text-red-400" : "text-red-500"} mr-4`} />
                    <div>
                      <h2 className={`text-lg font-semibold ${currentTheme.textSecondary}`}>Total Remarks</h2>
                      <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>{stats.totalRemarks}</p>
                    </div>
                  </div>
                  {activeStat === "totalRemarks" && (
                    <div className="mt-4">
                      <div className="relative">
                        <select
                          value={filterSelections.totalRemarks}
                          onChange={(e) => handleFilterChange("totalRemarks", e.target.value)}
                          className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl appearance-none focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all text-sm ${
                            theme === "dark" ? "bg-white/5 text-white" : "bg-white text-gray-800"
                          }`}
                          aria-label="Select filter for Total Remarks"
                        >
                          <option value="Caste">Caste</option>
                          <option value="Stream">Stream</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                          <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" stroke-linejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                      <div className={`mt-4 p-4 rounded-xl ${currentTheme.chartBg} min-h-[300px]`}>
                        {filterSelections.totalRemarks === "Caste"
                          ? renderChart(stats.remarksByCaste, "Remarks", "count", "#FF8042")
                          : renderChart(stats.remarksByStream, "Remarks", "count", "#FF8042")}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`${currentTheme.cardBg} rounded-xl p-6 shadow-lg hover:scale-105 transition-all duration-300 animate-fade-in-up cursor-pointer`}
                  style={{ animationDelay: "0.3s" }}
                  onClick={() => handleCardClick("totalApprovals")}
                >
                  <div className="flex items-center">
                    <CheckSquare size={48} className={`${theme === "dark" ? "text-purple-400" : "text-purple-500"} mr-4`} />
                    <div>
                      <h2 className={`text-lg font-semibold ${currentTheme.textSecondary}`}>Total Approvals</h2>
                      <p className={`text-2xl font-bold ${currentTheme.textPrimary}`}>{stats.totalApprovals}</p>
                    </div>
                  </div>
                  {activeStat === "totalApprovals" && (
                    <div className="mt-4">
                      <div className="relative">
                        <select
                          value={filterSelections.totalApprovals}
                          onChange={(e) => handleFilterChange("totalApprovals", e.target.value)}
                          className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl appearance-none focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all text-sm ${
                            theme === "dark" ? "bg-white/5 text-white" : "bg-white text-gray-800"
                          }`}
                          aria-label="Select filter for Total Approvals"
                        >
                          <option value="Caste">Caste</option>
                          <option value="Stream">Stream</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                          <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" stroke-linejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                      <div className={`mt-4 p-4 rounded-xl ${currentTheme.chartBg} min-h-[300px]`}>
                        {filterSelections.totalApprovals === "Caste"
                          ? renderChart(stats.approvalsByCaste, "Approvals", "count", "#8884D8")
                          : renderChart(stats.approvalsByStream, "Approvals", "count", "#8884D8")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>
        {`
          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 6s ease infinite;
          }
          @keyframes gradient-x {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeInUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 1;
              transform: translateY(0);
            }
          }
          .recharts-responsive-container {
            position: relative;
            overflow: visible !important;
          }
        `}
      </style>
    </div>
  );
};

export default DashboardScholarship;