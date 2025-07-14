import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Sun, Moon } from "lucide-react";

const StudentScholarship = () => {
  const [theme, setTheme] = useState("light");
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Theme classes based on StudentPage
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

  const [studentData, setStudentData] = useState(null);
  const [scholarshipData, setScholarshipData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");
  const [resolvingRemark, setResolvingRemark] = useState(null);

  const courseDurations = {
    mba: 2,
    mtech: 2,
    bca: 3,
    btech: 4,
  };

  // Get student data from localStorage
  useEffect(() => {
    const savedStudentData = localStorage.getItem('studentData');
    if (savedStudentData) {
      try {
        const parsedData = JSON.parse(savedStudentData);
        setStudentData({
          _id: parsedData._id,
          name: `${parsedData.firstName} ${parsedData.middleName || ''} ${parsedData.lastName}`.trim(),
          department: parsedData.department || 'Unknown Department',
          email: parsedData.email || '',
          semester: parsedData.semester || 'I',
          section: parsedData.section || 'A',
          studentId: parsedData.studentId,
          enrollmentNumber: parsedData.enrollmentNumber,
          stream: parsedData.stream,
          casteCategory: parsedData.casteCategory,
          subCaste: parsedData.subCaste,
          mobileNumber: parsedData.mobileNumber
        });
      } catch (error) {
        console.error('Error parsing student data:', error);
        setFetchError("Unable to load student data. Please log in again.");
      }
    } else {
      setFetchError("No student data found. Please log in again.");
    }
  }, []);

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

  const fetchScholarshipData = useCallback(async () => {
    if (!studentData || (!studentData.enrollmentNumber && !studentData.studentId)) return;

    setLoading(true);
    try {
      // Try to fetch scholarship data using enrollmentNumber first, then studentId as fallback
      const identifier = studentData.enrollmentNumber || studentData.studentId;
      
      // First try the existing scholarships endpoint to get all scholarships
      const scholarshipRes = await fetchWithRetry("http://localhost:5000/api/scholarships", {
        headers: { Authorization: `Bearer ${localStorage.getItem("studentToken")}` },
      });
      
      console.log("All scholarships data:", scholarshipRes.data);
      
      // Find scholarship for this specific student
      let studentScholarship = null;
      if (scholarshipRes.data && Array.isArray(scholarshipRes.data)) {
        studentScholarship = scholarshipRes.data.find(scholarship => 
          scholarship.studentId === identifier || 
          scholarship.enrollmentNumber === identifier
        );
      }
      
      console.log("Found student scholarship:", studentScholarship);
      
      if (studentScholarship && studentScholarship.scholarshipStatus === "Yes") {
        setScholarshipData(studentScholarship);
      } else {
        setScholarshipData(null);
      }
      setFetchError(null);
    } catch (err) {
      console.error("Error fetching scholarship data:", err);
      
      // If the specific endpoint doesn't exist, try alternative approach
      try {
        const studentRes = await fetchWithRetry("http://localhost:5000/api/students", {
          headers: { Authorization: `Bearer ${localStorage.getItem("studentToken")}` },
        });
        
        const scholarshipRes = await fetchWithRetry("http://localhost:5000/api/scholarships", {
          headers: { Authorization: `Bearer ${localStorage.getItem("studentToken")}` },
        });
        
        // Merge and filter data
        const students = studentRes.data || [];
        const scholarships = scholarshipRes.data || [];
        
        const currentStudent = students.find(student => 
          student.studentId === studentData.studentId || 
          student.enrollmentNumber === studentData.enrollmentNumber
        );
        
        if (currentStudent) {
          const scholarship = scholarships.find(s => s.studentId === currentStudent.studentId);
          if (scholarship && scholarship.scholarshipStatus === "Yes") {
            setScholarshipData({
              ...scholarship,
              ...currentStudent
            });
          } else {
            setScholarshipData(null);
          }
        } else {
          setScholarshipData(null);
        }
        setFetchError(null);
      } catch (fallbackErr) {
        console.error("Fallback fetch also failed:", fallbackErr);
        setFetchError(fallbackErr.response?.data?.error || "Failed to fetch scholarship data. Please check your connection.");
        setScholarshipData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [studentData]);

  useEffect(() => {
    if (studentData) {
      fetchScholarshipData();
    }
  }, [studentData, fetchScholarshipData]);

  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please select a valid PDF file.");
      return;
    }
    if (!selectedYear) {
      alert("Please select a year.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", file);
      formData.append("studentId", studentData.studentId);
      formData.append("year", selectedYear);
      console.log(`Uploading PDF for studentId: ${studentData.studentId}, year: ${selectedYear}`);

      await fetchWithRetry("http://localhost:5000/api/scholarships/upload-pdf", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("studentToken")}`,
        },
        data: formData,
      });

      alert(`PDF for year ${selectedYear} uploaded successfully!`);
      fetchScholarshipData();
    } catch (err) {
      console.error("Error uploading PDF:", err);
      alert("Error uploading PDF: " + (err.response?.data?.error || err.message));
    } finally {
      setUploading(null);
    }
  };

  const handleResolveRemark = async (year) => {
    setResolvingRemark(year);
    try {
      await fetchWithRetry("http://localhost:5000/api/scholarships/add-remark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("studentToken")}`,
        },
        data: { studentId: studentData.studentId, year, remark: "" },
      });
      alert(`Remark for year ${year} cleared successfully!`);
      fetchScholarshipData();
    } catch (err) {
      console.error("Error clearing remark:", err);
      alert("Error clearing remark: " + (err.response?.data?.error || err.message));
    } finally {
      setResolvingRemark(null);
    }
  };

  if (!studentData) {
    return (
      <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.textPrimary} transition-colors duration-500`}>
        <div className="flex items-center justify-center h-40">
          <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading student data...</span>
        </div>
      </div>
    );
  }

  // Determine available years based on stream
  const stream = studentData.stream?.name?.toLowerCase() || studentData.stream?.toLowerCase() || 'btech';
  const years = Array.from({ length: courseDurations[stream] || 4 }, (_, i) => i + 1);
  const selectedPDF = scholarshipData?.pdfs?.find((pdf) => pdf.year === parseInt(selectedYear));

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
            My Scholarship
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
                onClick={fetchScholarshipData}
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
              <span className={`ml-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading scholarship data...</span>
            </div>
          ) : !scholarshipData || scholarshipData.scholarshipStatus !== "Yes" ? (
            <div className={`text-center py-10 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} animate-fade-in`}>
              <div className="text-6xl mb-4">🎓</div>
              <h3 className="text-xl font-semibold mb-2">No Scholarship Approved</h3>
              <p>You don't have an approved scholarship at this time.</p>
              <p className="text-sm mt-2">Contact the scholarship office if you believe this is an error.</p>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              {/* Student Information Card */}
              <div className={`${currentTheme.cardBg} rounded-xl p-6 mb-6 ${currentTheme.cardBorder}`}>
                <h2 className={`text-2xl font-bold ${currentTheme.textAccent} mb-4`}>Student Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>Name</label>
                    <p className={`${currentTheme.textPrimary}`}>{studentData.name}</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>Student ID</label>
                    <p className={`${currentTheme.textPrimary}`}>{studentData.studentId}</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>Enrollment Number</label>
                    <p className={`${currentTheme.textPrimary}`}>{studentData.enrollmentNumber}</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>Department</label>
                    <p className={`${currentTheme.textPrimary}`}>{studentData.department}</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>Stream</label>
                    <p className={`${currentTheme.textPrimary}`}>{studentData.stream?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-1`}>Scholarship Status</label>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-xl ${theme === 'dark' ? 'bg-green-600/30 text-green-100' : 'bg-green-100 text-green-800'}`}>
                      Approved
                    </span>
                  </div>
                </div>
              </div>

              {/* PDF Upload Section */}
              <div className={`${currentTheme.cardBg} rounded-xl p-6 mb-6 ${currentTheme.cardBorder}`}>
                <h3 className={`text-xl font-bold ${currentTheme.textAccent} mb-4`}>Upload Documents</h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-2`}>Select Year</label>
                    <div className="relative">
                      <select
                        value={selectedYear}
                        onChange={(e) => handleYearChange(e.target.value)}
                        className={`w-full p-3 ${currentTheme.cardBorder} rounded-xl appearance-none focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all text-sm ${
                          theme === 'dark' ? 'bg-white/5 text-white' : 'bg-white text-gray-800'
                        }`}
                      >
                        <option value="">Select Year</option>
                        {years.map((year) => (
                          <option key={year} value={year}>
                            Year {year}
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
                  
                  <div className="flex-1">
                    <label className={`block text-sm font-medium ${currentTheme.textSecondary} mb-2`}>Upload PDF</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePDFUpload}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        disabled={uploading || !selectedYear}
                      />
                      <div
                        className={`p-3 ${currentTheme.cardBorder} rounded-xl group-hover:bg-indigo-500/10 transition-all ${
                          theme === 'dark' ? 'bg-white/5' : 'bg-white'
                        } ${
                          uploading || !selectedYear
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-700'}`}>
                            Choose PDF
                          </span>
                          <span
                            className={`px-2 py-1 ${
                              theme === 'dark' ? 'bg-indigo-500/30 text-indigo-200' : 'bg-indigo-500/20 text-indigo-700'
                            } rounded-md text-xs`}
                          >
                            Browse
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {uploading && (
                    <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Uploading...</span>
                  )}
                </div>
              </div>

              {/* Remarks Section */}
              {selectedYear && (
                <div className={`${currentTheme.cardBg} rounded-xl p-6 ${currentTheme.cardBorder}`}>
                  <h3 className={`text-xl font-bold ${currentTheme.textAccent} mb-4`}>Document Status for Year {selectedYear}</h3>
                  {selectedPDF ? (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <label className={`text-sm font-medium ${currentTheme.textSecondary}`}>Remarks:</label>
                        <p className={`${currentTheme.textPrimary} p-3 ${currentTheme.cardBorder} rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                          {selectedPDF.remark || "No remarks"}
                        </p>
                        {selectedPDF.remark && (
                          <button
                            onClick={() => handleResolveRemark(selectedYear)}
                            className={`self-start px-4 py-2 ${theme === 'dark' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-600 text-white hover:bg-green-700'} rounded-xl hover:scale-105 transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                            disabled={resolvingRemark === selectedYear}
                          >
                            {resolvingRemark === selectedYear ? "Resolving..." : "Mark as Resolved"}
                          </button>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        <p>Document uploaded on: {selectedPDF.uploadedAt ? new Date(selectedPDF.uploadedAt).toLocaleDateString() : scholarshipData.updatedAt ? new Date(scholarshipData.updatedAt).toLocaleDateString() : "Date not available"}</p>
                      </div>
                    </div>
                  ) : (
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      No document uploaded for this year yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom styles for animations */}
      <style>
        {`
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

export default StudentScholarship;
