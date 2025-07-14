
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Sun, Moon } from "lucide-react";

const ActionSection = () => {
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Theme classes based on AdmissionForm
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

  const [students, setStudents] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [streams, setStreams] = useState([]);
  const [selectedStream, setSelectedStream] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

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
    setLoading(true);
    try {
      const studentRes = await fetchWithRetry("http://localhost:5000/api/students", {
        headers: { Authorization: `Bearer ${localStorage.getItem("facultyToken")}` },
      });
      const scholarshipRes = await fetchWithRetry("http://localhost:5000/api/scholarships", {
        headers: { Authorization: `Bearer ${localStorage.getItem("facultyToken")}` },
      });
      console.log("Fetched scholarships:", scholarshipRes.data); // Debug log
      setStudents(studentRes.data);
      setScholarships(scholarshipRes.data);

      // Extract unique streams
      const uniqueStreams = [...new Set(studentRes.data.map((student) => student.stream?.name).filter(Boolean))];
      setStreams(uniqueStreams);
      setFetchError(null);
    } catch (err) {
      setFetchError(err.response?.data?.error || "Failed to fetch data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStreamChange = (e) => {
    setSelectedStream(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Merge student and scholarship data, filter by scholarshipStatus: "Yes"
  const mergedStudents = students
    .map((student) => {
      const scholarship = scholarships.find((s) => s.studentId === student.studentId);
      return {
        ...student,
        scholarshipStatus: scholarship ? scholarship.scholarshipStatus : null,
        pdfs: scholarship ? scholarship.pdfs.filter((pdf) => pdf.remark === "") : [], // Only include PDFs with empty remarks
      };
    })
    .filter((student) => student.scholarshipStatus === "Yes" && student.pdfs.length > 0); // Only students with approved PDFs

  // Filter by selected stream and search term
  const filteredStudents = mergedStudents.filter((student) => {
    const matchesStream = selectedStream ? student.stream?.name === selectedStream : true;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm
      ? student.studentId?.toLowerCase().includes(searchLower)
      : true;
    return matchesStream && matchesSearch;
  });

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.textPrimary} transition-colors duration-500`} role="main">
      {/* Header with theme toggle */}
      <div className={`${currentTheme.headerBg} py-6 px-4 md:px-8 shadow-xl ${currentTheme.headerBorder}`}>
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1
            className={`text-3xl md:text-4xl font-extrabold tracking-tight ${
              theme === 'dark'
                ? 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]'
                : 'text-indigo-900 drop-shadow-[0_2px_8px_rgba(99,102,241,0.12)]'
            } transition-all duration-500`}
          >
            Action Section
          </h1>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${theme === 'dark' ? 'bg-indigo-700' : 'bg-indigo-200'} shadow-lg hover:scale-110 transition-transform`}
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

          <div className="mb-6 animate-fade-in-up">
            <label htmlFor="streamSelect" className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>
              Filter by Stream
            </label>
            <div className="relative">
              <select
                id="streamSelect"
                value={selectedStream}
                onChange={handleStreamChange}
                className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl appearance-none focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${
                  theme === 'dark' ? 'bg-white/5 text-white' : 'bg-white text-gray-800'
                }`}
                aria-label="Filter students by stream"
              >
                <option value="">All Streams</option>
                {streams.map((stream, index) => (
                  <option key={index} value={stream}>
                    {stream}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <label htmlFor="searchInput" className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>
              Search by Student ID
            </label>
            <input
              id="searchInput"
              type="text"
              placeholder="Search by Student ID"
              value={searchTerm}
              onChange={handleSearchChange}
              className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${
                theme === 'dark' ? 'bg-white/5 text-white' : 'bg-white text-gray-800'
              }`}
              aria-label="Search students by student ID"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40 animate-fade-in">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading actions...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className={`text-center py-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} animate-fade-in`}>
              No approved actions found.
            </div>
          ) : (
            <div className="overflow-x-auto animate-fade-in-up">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Name</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Stream</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Department</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Student ID</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Year</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Action</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) =>
                    student.pdfs.map((pdf, pdfIndex) => (
                      <tr
                        key={`${student.studentId}_${pdf.year}`}
                        className={`border-t hover:bg-opacity-10 ${
                          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-50'
                        } animate-fade-in-up`}
                        style={{ animationDelay: `${(index * student.pdfs.length + pdfIndex) * 0.05}s` }}
                      >
                        <td className={`px-4 py-2 ${currentTheme.textPrimary}`}>
                          {student.firstName} {student.lastName || ""}
                        </td>
                        <td className={`px-4 py-2 ${currentTheme.textPrimary}`}>{student.stream?.name || "N/A"}</td>
                        <td className={`px-4 py-2 ${currentTheme.textPrimary}`}>{student.department?.name || "N/A"}</td>
                        <td className={`px-4 py-2 ${currentTheme.textPrimary}`}>{student.studentId || "N/A"}</td>
                        <td className={`px-4 py-2 ${currentTheme.textPrimary}`}>Year {pdf.year}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-xl ${
                              theme === 'dark' ? 'bg-green-600/30 text-green-100' : 'bg-green-100 text-green-800'
                            }`}
                          >
                            Approved
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <a
                            href={pdf.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${theme === 'dark' ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-500'} hover:underline`}
                            aria-label={`View PDF for ${student.firstName} Year ${pdf.year}`}
                          >
                            View PDF
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Custom styles for animations */}
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
        `}
      </style>
    </div>
  );
};

export default ActionSection;