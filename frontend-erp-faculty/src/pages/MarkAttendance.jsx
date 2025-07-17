import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Clock,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  Search,
} from "lucide-react";
import axios from "axios";
import AttendanceBarChart from "../components/AttendanceBarChart";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include JWT token
api.interceptors?.request?.use?.(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default function MarkAttendance() {
  // Suppress Canvas2D warnings globally
  React.useEffect(() => {
    // Override the native getContext method to set willReadFrequently by default
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(contextType, options = {}) {
      if (contextType === '2d') {
        options.willReadFrequently = true;
      }
      return originalGetContext.call(this, contextType, options);
    };
    
    return () => {
      // Restore original method on cleanup
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    };
  }, []);

  const [subjects, setSubjects] = useState([]);
  const [expandedSubject, setExpandedSubject] = useState("");
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [studentNotes, setStudentNotes] = useState({});
  const [subjectDetails, setSubjectDetails] = useState(null);
  const [loadingSubjectDetails, setLoadingSubjectDetails] = useState(false);

  // Filter states
  const [queryType, setQueryType] = useState("day");
  const [queryDate, setQueryDate] = useState(new Date().toISOString().split("T")[0]);
  const [queryFrom, setQueryFrom] = useState("");
  const [queryTo, setQueryTo] = useState("");
  const [queryMonth, setQueryMonth] = useState(new Date().getMonth() + 1);
  const [queryYear, setQueryYear] = useState(new Date().getFullYear());
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filteredPage, setFilteredPage] = useState(1);
  const [filteredTotalPages, setFilteredTotalPages] = useState(1);
  const [entriesPerPage] = useState(10);
  const [attendanceMarkedToday, setAttendanceMarkedToday] = useState(false);
  const [checkingTodayAttendance, setCheckingTodayAttendance] = useState(false);
  const [todayClassAttendance, setTodayClassAttendance] = useState(null);
  const [monthlyClassAttendance, setMonthlyClassAttendance] = useState(null);
  const [monthlyAttendanceLoading, setMonthlyAttendanceLoading] = useState(false);

  const logsRef = useRef(null);

  // Load subjects on mount
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Load students and stats when subject is expanded
  useEffect(() => {
    if (expandedSubject) {
      fetchSubjectDetails(expandedSubject);
      fetchStudents(expandedSubject);
      checkTodayAttendance(expandedSubject);
      calculateMonthlyClassAttendance(expandedSubject);
    }
  }, [expandedSubject]);

  // Function to fetch subject details automatically
  const fetchSubjectDetails = async (subjectId) => {
    try {
      setLoadingSubjectDetails(true);
      const token = localStorage.getItem("authToken");
      
      const response = await api.get(`/faculty/markattendance/subject-details/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSubjectDetails(response.data.data);
      } else {
        console.error("Failed to load subject details:", response.data.message);
        setSubjectDetails(null);
      }
    } catch (err) {
      console.error("Error fetching subject details:", err);
      setSubjectDetails(null);
    } finally {
      setLoadingSubjectDetails(false);
    }
  };

  // Function to check if attendance is already marked for today
  const checkTodayAttendance = async (subjectId) => {
    try {
      setCheckingTodayAttendance(true);
      const userDataStr = localStorage.getItem("user");
      const userData = JSON.parse(userDataStr);
      const employeeId = userData.employeeId;
      
      const today = new Date().toISOString().split("T")[0];
      
      const params = {
        facultyId: employeeId,
        subjectId: subjectId,
        type: 'day',
        date: today,
        page: 1,
        limit: 1,
      };
      
      const response = await api.get("/faculty/attendance/query", { params });
      
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        setAttendanceMarkedToday(true);
        
        // Calculate today's class attendance percentage
        const todayRecords = response.data.data;
        const presentCount = todayRecords.filter(record => record.status === 'present').length;
        const totalCount = todayRecords.length;
        const classPercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
        setTodayClassAttendance(classPercentage);
      } else {
        setAttendanceMarkedToday(false);
        setTodayClassAttendance(null);
      }
    } catch (error) {
      console.error("Error checking today's attendance:", error);
      setAttendanceMarkedToday(false);
      setTodayClassAttendance(null);
    } finally {
      setCheckingTodayAttendance(false);
    }
  };

  const calculateMonthlyClassAttendance = async (subjectId) => {
    try {
      setMonthlyAttendanceLoading(true);
      const userDataStr = localStorage.getItem("user");
      const userData = JSON.parse(userDataStr);
      const employeeId = userData.employeeId;
      
      // Get current month's date range
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = firstDayOfMonth.toISOString().split("T")[0];
      const endDate = lastDayOfMonth.toISOString().split("T")[0];
      
      const params = {
        facultyId: employeeId,
        subjectId: subjectId,
        type: 'range',
        from: startDate,
        to: endDate,
        page: 1,
        limit: 1000, // Get all records for the month
      };
      
      const response = await api.get("/faculty/attendance/query", { params });
      
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        // Calculate monthly class attendance percentage
        const monthlyRecords = response.data.data;
        const presentCount = monthlyRecords.filter(record => record.status === 'present').length;
        const totalCount = monthlyRecords.length;
        const monthlyPercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
        setMonthlyClassAttendance(monthlyPercentage);
      } else {
        setMonthlyClassAttendance(null);
      }
    } catch (error) {
      console.error("Error calculating monthly attendance:", error);
      setMonthlyClassAttendance(null);
    } finally {
      setMonthlyAttendanceLoading(false);
    }
  };

  const handleFilterClick = async () => {
    setFilterLoading(true);
    setFilteredPage(1);
    
    // Get user data to get employeeId
    const userDataStr = localStorage.getItem("user");
    const userData = JSON.parse(userDataStr);
    const employeeId = userData.employeeId;
    
    let params = {
      facultyId: employeeId,
      subjectId: expandedSubject,
      type: queryType,
      page: 1,
      limit: entriesPerPage,
    };
    if (queryType === "day") params.date = queryDate;
    if (queryType === "week") params.from = queryFrom;
    if (queryType === "month") {
      params.month = queryMonth;
      params.year = queryYear;
    }
    if (queryType === "range") {
      params.from = queryFrom;
      params.to = queryTo;
    }
    
    try {
      console.log('Sending attendance query with params:', params); // Debug log
      const res = await api.get("/faculty/attendance/query", { params });
      console.log('Attendance query response:', res.data); // Debug log
      
      if (res.data.success) {
        setFilteredAttendance(res.data.data || []);
        setFilteredTotalPages(res.data.pages || 1);
        
        if (res.data.data && res.data.data.length === 0) {
          console.log("No attendance records found for the selected filters.");
        }
      } else {
        setFilteredAttendance([]);
        setFilteredTotalPages(1);
        console.log("API returned success: false -", res.data.message);
      }
    } catch (e) {
      console.error("Error fetching filtered attendance:", e);
      setFilteredAttendance([]);
      setFilteredTotalPages(1);
      
      if (e.response?.status === 404) {
        console.log("Faculty or subject not found");
      } else if (e.response?.status === 500) {
        console.log("Server error occurred:", e.response?.data?.message || e.message);
      } else {
        console.log("Network or other error:", e.message);
      }
    } finally {
      setFilterLoading(false);
    }
  };

  const handlePreviousPage = async () => {
    if (filteredPage > 1 && !filterLoading) {
      setFilterLoading(true);
      
      // Get user data to get employeeId
      const userDataStr = localStorage.getItem("user");
      const userData = JSON.parse(userDataStr);
      const employeeId = userData.employeeId;
      
      let params = {
        facultyId: employeeId,
        subjectId: expandedSubject,
        type: queryType,
        page: filteredPage - 1,
        limit: entriesPerPage,
      };
      if (queryType === "day") params.date = queryDate;
      if (queryType === "week") params.from = queryFrom;
      if (queryType === "month") {
        params.month = queryMonth;
        params.year = queryYear;
      }
      if (queryType === "range") {
        params.from = queryFrom;
        params.to = queryTo;
      }
      
      try {
        const res = await api.get("/faculty/attendance/query", { params });
        if (res.data.success) {
          setFilteredAttendance(res.data.data || []);
          setFilteredPage(filteredPage - 1);
        }
      } catch (e) {
        console.error("Error fetching previous page:", e);
      } finally {
        setFilterLoading(false);
      }
    }
  };

  const handleNextPage = async () => {
    if (filteredPage < filteredTotalPages && !filterLoading) {
      setFilterLoading(true);
      
      // Get user data to get employeeId
      const userDataStr = localStorage.getItem("user");
      const userData = JSON.parse(userDataStr);
      const employeeId = userData.employeeId;
      
      let params = {
        facultyId: employeeId,
        subjectId: expandedSubject,
        type: queryType,
        page: filteredPage + 1,
        limit: entriesPerPage,
      };
      if (queryType === "day") params.date = queryDate;
      if (queryType === "week") params.from = queryFrom;
      if (queryType === "month") {
        params.month = queryMonth;
        params.year = queryYear;
      }
      if (queryType === "range") {
        params.from = queryFrom;
        params.to = queryTo;
      }
      
      try {
        const res = await api.get("/faculty/attendance/query", { params });
        if (res.data.success) {
          setFilteredAttendance(res.data.data || []);
          setFilteredPage(filteredPage + 1);
        }
      } catch (e) {
        console.error("Error fetching next page:", e);
      } finally {
        setFilterLoading(false);
      }
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      
      // Get user data to get employeeId
      const userDataStr = localStorage.getItem("user");
      if (!userDataStr) {
        setError("User data not found. Please log in again.");
        return;
      }
      
      const userData = JSON.parse(userDataStr);
      const employeeId = userData.employeeId;
      
      if (!employeeId) {
        setError("Employee ID not found. Please log in again.");
        return;
      }

      const response = await api.get(`/faculty/subjects/${employeeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSubjects(response.data.data || []);
      } else {
        setError("Failed to load subjects");
      }
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setError("Failed to load subjects. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (subjectId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      
      // Use the new enhanced endpoint that filters students by subject criteria
      const response = await api.get(`/faculty/markattendance/students/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const studentsData = response.data.data || [];
        setStudents(studentsData);
        
        // Fetch attendance stats for each student
        fetchAttendanceStats(studentsData, subjectId);
      } else {
        setError("Failed to load students for this subject");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async (studentsData, subjectId) => {
    try {
      const token = localStorage.getItem("authToken");
      const statsPromises = studentsData.map(async (student) => {
        try {
          // Get current month and year for monthly stats
          const now = new Date();
          const month = now.getMonth() + 1;
          const year = now.getFullYear();

          // Fetch both monthly and overall stats
          const [monthlyResponse, overallResponse] = await Promise.all([
            api.get(`/student-attendance/${student._id}/${subjectId}/monthly?month=${month}&year=${year}`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            api.get(`/student-attendance/${student._id}/${subjectId}/overall`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);

          return {
            studentId: student._id,
            monthly: monthlyResponse.data,
            overall: overallResponse.data,
          };
        } catch (error) {
          console.error(`Error fetching stats for student ${student._id}:`, error);
          return {
            studentId: student._id,
            monthly: { percentage: 0, total: 0, present: 0, absent: 0 },
            overall: { percentage: 0, total: 0, present: 0, absent: 0 },
            error: true,
          };
        }
      });

      const results = await Promise.all(statsPromises);
      
      // Convert to object with studentId as key
      const statsObject = {};
      results.forEach((result) => {
        statsObject[result.studentId] = {
          monthly: result.monthly,
          overall: result.overall,
          error: result.error,
        };
      });

      setAttendanceStats(statsObject);
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      setAttendanceStats({});
    }
  };

  const markAttendance = async (status) => {
    if (selectedStudents.length === 0) {
      alert("Please select at least one student");
      return;
    }

    try {
      setIsUpdating(true);
      const token = localStorage.getItem("authToken");
      
      // Get user data to get employeeId
      const userDataStr = localStorage.getItem("user");
      const userData = JSON.parse(userDataStr);
      const facultyId = userData.employeeId;

      // For the backend API, if status is "present", we send the selected students
      // If status is "absent", we need to send all other students as selected (inverse logic)
      let studentsToMarkPresent = [];
      
      if (status === "present") {
        studentsToMarkPresent = selectedStudents;
      } else {
        // For absent, mark all non-selected students as present (backend marks others as absent)
        studentsToMarkPresent = students
          .filter(student => !selectedStudents.includes(student._id))
          .map(student => student._id);
      }

      // Calculate overall class attendance percentage
      const totalStudents = students.length;
      const presentCount = status === "present" ? selectedStudents.length : totalStudents - selectedStudents.length;
      const classAttendancePercent = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

      // Optionally, you can send notes to backend by including them in attendanceData
      // const notesForMarked = studentsToMarkPresent.reduce((acc, id) => { acc[id] = studentNotes[id] || ""; return acc; }, {});

      const attendanceData = {
        subjectId: expandedSubject,
        facultyId: facultyId,
        selectedStudents: studentsToMarkPresent,
        date: new Date().toISOString().split("T")[0],
        // notes: notesForMarked, // Uncomment if backend supports notes
      };

      const response = await api.post("/faculty/markattendance", attendanceData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        alert(`Attendance marked successfully! Today's Class Attendance: ${classAttendancePercent}%`);
        setSelectedStudents([]);
        setAttendanceMarkedToday(true);
        setTodayClassAttendance(classAttendancePercent);
        fetchAttendanceStats(students, expandedSubject);
        // Recalculate monthly attendance after marking today's attendance
        calculateMonthlyClassAttendance(expandedSubject);
      } else {
        // Check if attendance was already marked
        if (response.data.alreadyMarked) {
          alert("Attendance has already been marked for today for this subject!");
          setAttendanceMarkedToday(true);
        } else {
          alert(response.data.message || "Failed to mark attendance");
        }
      }
    } catch (err) {
      console.error("Error marking attendance:", err);
      
      // Check if the error is due to attendance already marked
      if (err.response?.status === 400 && err.response?.data?.alreadyMarked) {
        alert("Attendance has already been marked for today for this subject!");
        setAttendanceMarkedToday(true);
      } else {
        alert("Failed to mark attendance. Please try again.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s._id));
    }
  };

  const handleDownloadReport = async () => {
    if (!logsRef.current) return;
    
    try {
      logsRef.current.classList.add("report-export");
      
      const canvas = await html2canvas(logsRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: false,
        backgroundColor: '#ffffff',
        windowWidth: logsRef.current.scrollWidth,
        windowHeight: logsRef.current.scrollHeight,
      });
      
      const link = document.createElement("a");
      link.download = `Attendance_Report_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL();
      link.click();
      logsRef.current.classList.remove("report-export");
    } catch (err) {
      alert("Image export failed: " + err);
      logsRef.current.classList.remove("report-export");
    }
  };

  const handleDownloadPDF = async () => {
    if (!logsRef.current) return;
    
    try {
      logsRef.current.classList.add("report-export");
      
      const canvas = await html2canvas(logsRef.current, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        allowTaint: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Attendance_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
      logsRef.current.classList.remove("report-export");
    } catch (err) {
      alert("PDF export failed: " + err);
      logsRef.current.classList.remove("report-export");
    }
  };

  const handleDownloadStudentData = async (studentId, studentName) => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/files/student-attendance/${studentId}/${expandedSubject}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${studentName}_attendance_report.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Failed to download student data");
      }
    } catch (error) {
      console.error("Error downloading student data:", error);
      alert("Error downloading student data");
    }
  };

  // Add this handler for note changes
  const handleNoteChange = (studentId, value) => {
    setStudentNotes((prev) => ({ ...prev, [studentId]: value }));
  };

  if (loading && !subjects.length && !students.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Attendance Management
              </h1>
              <p className="text-gray-600">
                Mark attendance, view analytics, and manage student records
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>{new Date().toLocaleDateString()}</span>
              <Clock className="h-4 w-4 ml-2" />
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            Select Subject
          </h2>
          
          {subjects.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Subjects Found</h3>
              <p className="text-gray-500">You are not assigned to teach any subjects.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => (
                <div
                  key={subject._id}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                    expandedSubject === subject._id
                      ? "border-blue-500 bg-blue-50 shadow-lg"
                      : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                  onClick={() => {
                    setExpandedSubject(expandedSubject === subject._id ? "" : subject._id);
                    setSelectedStudents([]);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-1">{subject.name}</h3>
                      <p className="text-sm text-gray-600">
                        {subject.department?.name || "Department N/A"} | Year {subject.year} | Section {subject.section}
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${
                      expandedSubject === subject._id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
                    }`}>
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student List and Attendance Marking */}
        {expandedSubject && (
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="h-6 w-6 text-green-600" />
                  Students & Attendance
                </h2>
                
                {/* Subject Details */}
                {loadingSubjectDetails ? (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-gray-600">Loading subject details...</span>
                  </div>
                ) : subjectDetails ? (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Department:</span> {subjectDetails.department} | 
                    <span className="font-medium"> Year:</span> {subjectDetails.year} | 
                    <span className="font-medium"> Section:</span> {subjectDetails.section}
                    {subjectDetails.totalStudents > 0 && (
                      <> | <span className="font-medium">Total Students:</span> {subjectDetails.totalStudents}</>
                    )}
                  </div>
                ) : null}
              </div>
              
              {/* Today's Attendance Status */}
              {checkingTodayAttendance ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-blue-700 text-sm">Checking today's attendance...</span>
                </div>
              ) : attendanceMarkedToday ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-medium">Attendance already marked for today</span>
                  </div>
                  {todayClassAttendance !== null && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-700 font-medium">
                        Today's Class Attendance: {todayClassAttendance}%
                      </span>
                    </div>
                  )}
                  {monthlyAttendanceLoading ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                      <span className="text-gray-700 text-sm">Calculating monthly attendance...</span>
                    </div>
                  ) : monthlyClassAttendance !== null && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <span className="text-purple-700 font-medium">
                        This Month's Class Attendance: {monthlyClassAttendance}%
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-yellow-700 font-medium">Attendance not marked for today</span>
                </div>
              )}
              
              {/* Batch Actions */}
              {students.length > 0 && !attendanceMarkedToday && (
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={selectAllStudents}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    {selectedStudents.length === students.length ? "Deselect All" : "Select All"}
                  </button>
                  {selectedStudents.length > 0 && (
                    <>
                      <button
                        onClick={() => markAttendance("present")}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Present ({selectedStudents.length})
                      </button>
                      <button
                        onClick={() => markAttendance("absent")}
                        disabled={isUpdating}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Mark Absent ({selectedStudents.length})
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStudents.length === students.length && students.length > 0}
                        onChange={selectAllStudents}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year/Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monthly %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overall %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason/Note
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => {
                    const stats = attendanceStats[student._id] || {};
                    return (
                      <tr key={student._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => toggleStudentSelection(student._id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDownloadStudentData(
                              student._id,
                              `${student.firstName} ${student.lastName}`
                            )}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                            title="Click to download attendance data"
                          >
                            {student.firstName} {student.lastName}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {student.department?.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {student.year} / {student.section}
                        </td>
                        <td className="px-6 py-4">
                          {stats.monthly ? (
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${
                                stats.monthly.percentage >= 75 ? "text-green-600" : "text-red-600"
                              }`}>
                                {stats.monthly.percentage}%
                              </span>
                              <div className={`h-2 w-16 rounded-full ${
                                stats.monthly.percentage >= 75 ? "bg-green-200" : "bg-red-200"
                              }`}>
                                <div
                                  className={`h-full rounded-full ${
                                    stats.monthly.percentage >= 75 ? "bg-green-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${Math.min(stats.monthly.percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : stats.error ? (
                            <span className="text-red-400 text-sm">Error</span>
                          ) : (
                            <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {stats.overall ? (
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${
                                stats.overall.percentage >= 75 ? "text-green-600" : "text-red-600"
                              }`}>
                                {stats.overall.percentage}%
                              </span>
                              <div className={`h-2 w-16 rounded-full ${
                                stats.overall.percentage >= 75 ? "bg-green-200" : "bg-red-200"
                              }`}>
                                <div
                                  className={`h-full rounded-full ${
                                    stats.overall.percentage >= 75 ? "bg-green-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${Math.min(stats.overall.percentage, 100)}%` }}
                                />
                              </div>
                            </div>
                          ) : stats.error ? (
                            <span className="text-red-400 text-sm">Error</span>
                          ) : (
                            <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Optional reason/note"
                            value={studentNotes[student._id] || ""}
                            onChange={e => handleNoteChange(student._id, e.target.value)}
                            disabled={attendanceMarkedToday}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (!attendanceMarkedToday) {
                                  setSelectedStudents([student._id]);
                                  markAttendance("present");
                                }
                              }}
                              disabled={isUpdating || attendanceMarkedToday}
                              className={`p-2 rounded-lg transition-colors ${
                                attendanceMarkedToday 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-green-100 hover:bg-green-200 text-green-700'
                              } disabled:opacity-50`}
                              title={attendanceMarkedToday ? "Attendance already marked" : "Mark Present"}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (!attendanceMarkedToday) {
                                  setSelectedStudents([student._id]);
                                  markAttendance("absent");
                                }
                              }}
                              disabled={isUpdating || attendanceMarkedToday}
                              className={`p-2 rounded-lg transition-colors ${
                                attendanceMarkedToday 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-red-100 hover:bg-red-200 text-red-700'
                              } disabled:opacity-50`}
                              title={attendanceMarkedToday ? "Attendance already marked" : "Mark Absent"}
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {students.length === 0 && !loading && (
              <div className="p-8 text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Students Found</h3>
                {subjectDetails ? (
                  <p className="text-gray-500">
                    No students found for {subjectDetails.department} - Year {subjectDetails.year}, Section {subjectDetails.section}
                  </p>
                ) : (
                  <p className="text-gray-500">No students are enrolled in this subject.</p>
                )}
              </div>
            )}
            
            {loading && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading students...</p>
              </div>
            )}
          </div>
        )}

        {/* Attendance Analytics */}
        {expandedSubject && students.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-purple-600" />
              Attendance Analytics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-green-800">High Attendance</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {students.filter(s => {
                        const stats = attendanceStats[s._id];
                        return stats?.overall?.percentage >= 75;
                      }).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-orange-800">Low Attendance</h3>
                    <p className="text-2xl font-bold text-orange-600">
                      {students.filter(s => {
                        const stats = attendanceStats[s._id];
                        return stats?.overall?.percentage < 75 && stats?.overall?.percentage >= 0;
                      }).length}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Total Students</h3>
                    <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Analytics Chart */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6">
              <AttendanceBarChart
                data={students.map(student => 
                  attendanceStats[student._id]?.overall?.percentage || 0
                )}
                labels={students.map(student => 
                  `${student.firstName} ${student.lastName}`.trim()
                )}
                title="Overall Attendance % by Student"
              />
            </div>
          </div>
        )}

        {/* Attendance Logs & Reports Section */}
        {expandedSubject && (
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Search className="h-6 w-6 text-purple-600" />
              Attendance Logs & Reports
            </h2>
            
            {/* Filters */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                <label className="text-gray-700 font-medium">Filter by:</label>
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={queryType}
                  onChange={(e) => setQueryType(e.target.value)}
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="range">Custom Range</option>
                </select>
                
                {queryType === "day" && (
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={queryDate}
                    onChange={(e) => setQueryDate(e.target.value)}
                  />
                )}
                
                {queryType === "week" && (
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={queryFrom}
                    onChange={(e) => setQueryFrom(e.target.value)}
                    placeholder="Week Start"
                  />
                )}
                
                {queryType === "month" && (
                  <div className="flex gap-2">
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={queryMonth}
                      onChange={(e) => setQueryMonth(Number(e.target.value))}
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(0, i).toLocaleString("default", { month: "long" })}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-24"
                      value={queryYear}
                      onChange={(e) => setQueryYear(Number(e.target.value))}
                      min="2000"
                      max="2100"
                    />
                  </div>
                )}
                
                {queryType === "range" && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={queryFrom}
                      onChange={(e) => setQueryFrom(e.target.value)}
                      placeholder="From"
                    />
                    <input
                      type="date"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={queryTo}
                      onChange={(e) => setQueryTo(e.target.value)}
                      placeholder="To"
                    />
                  </div>
                )}
                
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                  onClick={handleFilterClick}
                  disabled={
                    filterLoading ||
                    !expandedSubject ||
                    (queryType === "day" && !queryDate) ||
                    (queryType === "week" && !queryFrom) ||
                    (queryType === "month" && (!queryMonth || !queryYear)) ||
                    (queryType === "range" && (!queryFrom || !queryTo))
                  }
                >
                  <Filter className="h-4 w-4" />
                  {filterLoading ? "Filtering..." : "Filter"}
                </button>
              </div>
            </div>
                  {/* Results Table */}
        <div className="overflow-x-auto" ref={logsRef}>
          {filteredAttendance.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendance.map((log, index) => (
                  <tr key={`${log._id || index}-${log.date}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.student?.firstName && log.student?.lastName ? 
                        `${log.student.firstName} ${log.student.middleName || ''} ${log.student.lastName}`.trim() :
                        log.student?.name || 
                        log.studentId || 
                        'Unknown Student'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.date ? new Date(log.date).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : 
                       log.markedAt ? new Date(log.markedAt).toLocaleTimeString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        log.status === "present"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Attendance Records Found</h3>
              <div className="text-gray-500 mb-4">
                {filterLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    <span>Loading attendance records...</span>
                  </div>
                ) : (
                  <span>No attendance has been marked for the selected criteria. Try marking attendance first or adjusting your filters.</span>
                )}
              </div>
              {!filterLoading && (
                <button
                  onClick={() => {
                    console.log('Current filter params:', { queryType, queryDate, queryMonth, queryYear, queryFrom, queryTo });
                  }}
                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                >
                  Debug Filter Parameters
                </button>
              )}
            </div>
          )}
        </div>
            
            {/* Pagination */}
            {filteredAttendance.length > 0 && filteredTotalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing page {filteredPage} of {filteredTotalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={filteredPage === 1 || filterLoading}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={filteredPage === filteredTotalPages || filterLoading}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Download Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                onClick={handleDownloadReport}
              >
                <Download className="h-4 w-4" />
                Download Report
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                onClick={handleDownloadPDF}
              >
                <FileText className="h-4 w-4" />
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
