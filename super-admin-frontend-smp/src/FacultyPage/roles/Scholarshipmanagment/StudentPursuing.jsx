
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Sun, Moon } from "lucide-react";

const StudentPursuing = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Authentication helper function
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

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
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [scholarshipModal, setScholarshipModal] = useState({
    open: false,
    studentId: null,
    studentName: "",
    status: "",
    studentData: null,
  });

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const studentRes = await fetchWithRetry("http://localhost:5000/api/superadmin/students", {
        headers: getAuthHeaders(),
      });
      const scholarshipRes = await fetchWithRetry("http://localhost:5000/api/scholarships", {
        headers: getAuthHeaders(),
      });
      setStudents(studentRes.data);
      setScholarships(scholarshipRes.data);
      setFetchError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }
      setFetchError(err.response?.data?.error || "Failed to fetch data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Merge student and scholarship data using custom studentId
  const mergedStudents = students.map((student) => {
    const scholarship = scholarships.find((s) => s.studentId === student.studentId);
    return {
      ...student,
      scholarshipStatus: scholarship ? scholarship.scholarshipStatus : null,
    };
  });

  const filteredStudents = mergedStudents.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.enrollmentNumber?.toLowerCase().includes(searchLower) ||
      student.studentId?.toLowerCase().includes(searchLower)
    );
  });

  const openScholarshipModal = (student) => {
    setScholarshipModal({
      open: true,
      studentId: student.studentId,
      studentName: `${student.firstName} ${student.lastName || ""}`,
      status: "",
      studentData: student,
    });
  };

  const closeScholarshipModal = () => {
    setScholarshipModal({
      open: false,
      studentId: null,
      studentName: "",
      status: "",
      studentData: null,
    });
  };

  const handleSelectStatus = (status) => {
    setScholarshipModal((prev) => ({ ...prev, status }));
  };

  const handleUpdateScholarshipStatus = async () => {
    const { studentId, status, studentData, studentName } = scholarshipModal;
    if (!status) {
      alert("Please select a scholarship status.");
      return;
    }
    if (!studentData || !studentId) {
      alert("Student data is missing. Please try again.");
      return;
    }

    try {
      const scholarshipData = {
        studentId: studentData.studentId || "N/A",
        firstName: studentData.firstName || "N/A",
        lastName: studentData.lastName || "",
        stream: studentData.stream?.name || "N/A",
        department: studentData.department?.name || "N/A",
        casteCategory: studentData.casteCategory || "N/A",
        subCaste: studentData.subCaste || "N/A",
        mobileNumber: studentData.mobileNumber || "N/A",
        enrollmentNumber: studentData.enrollmentNumber || "N/A",
        scholarshipStatus: status,
      };

      await fetchWithRetry("http://localhost:5000/api/scholarships", {
        method: "POST",
        headers: getAuthHeaders(),
        data: scholarshipData,
      });
      alert(`Scholarship status updated to ${status} for ${studentName}!`);
      fetchData();
      closeScholarshipModal();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }
      console.error("Error updating scholarship status:", err);
      alert("Error updating scholarship status: " + (err.response?.data?.error || err.message));
    }
  };

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
            Students Pursuing Scholarships
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
            <label htmlFor="searchInput" className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>
              Search by Enrollment Number or Student ID
            </label>
            <input
              id="searchInput"
              type="text"
              placeholder="Search by Enrollment Number or Student ID"
              value={searchTerm}
              onChange={handleSearchChange}
              className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all ${
                theme === 'dark' ? 'bg-white/5 text-white' : 'bg-white text-gray-800'
              }`}
              aria-label="Search students by enrollment number or student ID"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40 animate-fade-in">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading students...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className={`text-center py-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} animate-fade-in`}>No students found.</div>
          ) : (
            <div className="overflow-x-auto animate-fade-in-up">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Name</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Stream</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Department</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Caste Category</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Sub-Caste</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Mobile Number</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Enrollment Number</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Student ID</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Scholarship Status</th>
                    <th className={`px-4 py-2 text-left text-sm font-medium ${currentTheme.textSecondary}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr key={student._id} className={`border-t hover:bg-opacity-10 ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-50'} animate-fade-in-up`} style={{ animationDelay: `${index * 0.05}s` }}>
                      <td className={`px-4 py-2 ${currentTheme.textPrimary}`}>
                        {student.firstName} {student.lastName || ""}
                      </td>
                      <td className={`px-4 py-2 ${currentTheme.textPrimary}`}>{student.stream?.name || "N/A"}</td>
                      <td className={`px-4 py-2 ${currentTheme.textPrimary}`}>{student.department?.name || "N/A"}</td>
                      <td className={`px-4 py-2 ${currentTheme.textPrimary}`}>{student.casteCategory || "N/A"}</td>
                      <td className={`px-4 py-2 ${currentTheme.textPrimary}`}>{student.subCaste || "N/A"}</td>
                      <td className={`px-4 py-2 ${currentTheme.textPrimary}`}>{student.mobileNumber || "N/A"}</td>
                      <td className={`px-4 py-2 ${currentTheme.textPrimary}`}>{student.enrollmentNumber || "N/A"}</td>
                      <td className={`px-4 py-2 ${currentTheme.textPrimary}`}>{student.studentId || "N/A"}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-xl ${
                            student.scholarshipStatus === "Yes"
                              ? `${theme === 'dark' ? 'bg-green-600/30 text-green-100' : 'bg-green-100 text-green-800'}`
                              : student.scholarshipStatus === "No"
                              ? `${theme === 'dark' ? 'bg-red-600/30 text-red-100' : 'bg-red-100 text-red-800'}`
                              : `${theme === 'dark' ? 'bg-gray-600/30 text-gray-100' : 'bg-gray-100 text-gray-800'}`
                          }`}
                        >
                          {student.scholarshipStatus || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <button
                          onClick={() => openScholarshipModal(student)}
                          disabled={student.scholarshipStatus === "Yes" || student.scholarshipStatus === "No"}
                          className={`px-3 py-1 rounded-xl text-sm font-medium ${
                            student.scholarshipStatus === "Yes" || student.scholarshipStatus === "No"
                              ? `${theme === 'dark' ? 'bg-gray-600/30 text-gray-400' : 'bg-gray-200 text-gray-500'} cursor-not-allowed`
                              : `${currentTheme.buttonBg} ${currentTheme.textAccent} ${currentTheme.buttonHover} hover:scale-105 transition-all duration-300`
                          }`}
                          aria-label={`Set scholarship status for ${student.firstName}`}
                        >
                          Set Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {scholarshipModal.open && (
            <div
              className={`fixed inset-0 ${theme === 'dark' ? 'bg-black/70' : 'bg-black/50'} flex items-center justify-center p-4 z-50`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="scholarshipModalTitle"
            >
              <div className={`${currentTheme.cardBg} rounded-2xl shadow-2xl w-full max-w-md p-6 ${currentTheme.cardBorder} animate-fade-in`}>
                <h3 id="scholarshipModalTitle" className={`text-xl font-bold ${currentTheme.textPrimary} mb-4`}>
                  Set Scholarship Status for {scholarshipModal.studentName}
                </h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
                  Select the scholarship status for {scholarshipModal.studentName}:
                </p>
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => handleSelectStatus("Yes")}
                    className={`flex-1 px-4 py-2 rounded-xl font-medium ${
                      scholarshipModal.status === "Yes"
                        ? `${theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-600 text-white'}`
                        : `${theme === 'dark' ? 'bg-green-600/30 text-green-100 hover:bg-green-600/50' : 'bg-green-100 text-green-700 hover:bg-green-200'}`
                    } hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2`}
                    aria-label="Set scholarship status to Yes"
                  >
                    <CheckCircle size={16} className="inline" /> Yes
                  </button>
                  <button
                    onClick={() => handleSelectStatus("No")}
                    className={`flex-1 px-4 py-2 rounded-xl font-medium ${
                      scholarshipModal.status === "No"
                        ? `${theme === 'dark' ? 'bg-red-600 text-white' : 'bg-red-600 text-white'}`
                        : `${theme === 'dark' ? 'bg-red-600/30 text-red-100 hover:bg-red-600/50' : 'bg-red-100 text-red-700 hover:bg-red-200'}`
                    } hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2`}
                    aria-label="Set scholarship status to No"
                  >
                    <XCircle size={16} className="inline" /> No
                  </button>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeScholarshipModal}
                    className={`px-4 py-2 bg-gray-600 text-white rounded-xl font-medium hover:bg-gray-700 hover:scale-105 transition-all duration-300`}
                    aria-label="Cancel scholarship status update"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateScholarshipStatus}
                    disabled={!scholarshipModal.status}
                    className={`px-4 py-2 rounded-xl font-medium text-white ${
                      scholarshipModal.status
                        ? scholarshipModal.status === "Yes"
                          ? "bg-green-600 hover:bg-green-700 hover:scale-105"
                          : "bg-red-600 hover:bg-red-700 hover:scale-105"
                        : `${theme === 'dark' ? 'bg-gray-600/30 text-gray-400' : 'bg-gray-400 text-gray-800'} cursor-not-allowed`
                    } transition-all duration-300`}
                    aria-label="Confirm scholarship status update"
                  >
                    Confirm
                  </button>
                </div>
              </div>
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

export default StudentPursuing;