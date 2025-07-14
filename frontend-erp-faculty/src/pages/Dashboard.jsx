import React, { useEffect, useState } from "react";
import { fetchFacultyDistribution, fetchStudentDistribution } from "../utils/departmentUtils";
import {
  LogOut,
  Users,
  BookOpen,
  Calendar,
  Award,
  Activity,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard({ userData, onLogout }) {
  const [isLoading, setIsLoading] = useState(true);
  const [dataType, setDataType] = useState("faculty"); // For admin dashboard
  const [facultyCount, setFacultyCount] = useState(null);
  const [facultyCountLoading, setFacultyCountLoading] = useState(true);
  const [facultyCountError, setFacultyCountError] = useState(null);
  const [facultyByDept, setFacultyByDept] = useState([]);
  const [facultyByDeptLoading, setFacultyByDeptLoading] = useState(true);
  const [facultyByDeptError, setFacultyByDeptError] = useState(null);
  const [studentsByDept, setStudentsByDept] = useState([]);
  const [studentsByDeptLoading, setStudentsByDeptLoading] = useState(true);
  const [studentsByDeptError, setStudentsByDeptError] = useState(null);
  const [studentCount, setStudentCount] = useState(null);
  const [studentCountLoading, setStudentCountLoading] = useState(true);
  const [studentCountError, setStudentCountError] = useState(null);
  const [departmentCount, setDepartmentCount] = useState(null);
  const [departmentCountLoading, setDepartmentCountLoading] = useState(true);
  const [departmentCountError, setDepartmentCountError] = useState(null);

  // Chart data configuration for admin dashboard
  const adminChartData = {
    labels:
      dataType === "faculty" 
        ? facultyByDept.map((item) => item.name) 
        : studentsByDept.map((item) => item.name),
    datasets: [
      {
        label: dataType === "faculty" ? "Faculty Count" : "Student Count",
        data:
          dataType === "faculty" 
            ? facultyByDept.map((item) => item.count) 
            : studentsByDept.map((item) => item.count),
        backgroundColor: "#2563eb",
        borderColor: "#1e3a8a",
        borderWidth: 1,
        hoverBackgroundColor: "#3b82f6",
        borderRadius: 4,
      },
    ],
  };

  // Chart options for admin dashboard
  const adminChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: "#1f2937",
        },
      },
      title: {
        display: true,
        text:
          dataType === "faculty" ? "Faculty by Branch" : "Students by Branch",
        font: {
          size: 18,
          family: "'Inter', sans-serif",
          weight: "bold",
        },
        color: "#1f2937",
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: "#1f2937",
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Branches",
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: "#1f2937",
        },
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#4b5563",
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        title: {
          display: true,
          text: "Total Count",
          font: {
            size: 14,
            family: "'Inter', sans-serif",
          },
          color: "#1f2937",
        },
        beginAtZero: true,
        grid: {
          color: "#e5e7eb",
        },
        ticks: {
          font: {
            size: 12,
          },
          color: "#4b5563",
        },
      },
    },
  };

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Fetch total number of faculties, students, departments and distributions from backend
  useEffect(() => {
    if (userData?.role === "facultymanagement") {
      // Fetch basic stats
      setFacultyCountLoading(true);
      setStudentCountLoading(true);
      setDepartmentCountLoading(true);
      setFacultyCountError(null);
      setStudentCountError(null);
      setDepartmentCountError(null);
      
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard/stats`)
        .then((res) => res.json())
        .then((data) => {
          setFacultyCount(data.totalFaculty || 0);
          setStudentCount(data.totalStudents || 0);
          setDepartmentCount(data.departments || 0);
        })
        .catch((err) => {
          console.error("Error fetching basic stats:", err);
          setFacultyCountError("Failed to fetch faculty count");
          setStudentCountError("Failed to fetch student count");
          setDepartmentCountError("Failed to fetch department count");
        })
        .finally(() => {
          setFacultyCountLoading(false);
          setStudentCountLoading(false);
          setDepartmentCountLoading(false);
        });
      
      // Fetch faculty distribution using academic departments
      const loadFacultyDistribution = async () => {
        setFacultyByDeptLoading(true);
        setFacultyByDeptError(null);
        
        const result = await fetchFacultyDistribution();
        
        if (result.success) {
          setFacultyByDept(result.distribution);
          // Update faculty count if not already set
          if (!facultyCount) {
            setFacultyCount(result.totalFaculties);
          }
        } else {
          setFacultyByDeptError(result.error);
          console.error("Error fetching faculty distribution:", result.error);
        }
        
        setFacultyByDeptLoading(false);
      };
      
      // Fetch student distribution using academic departments
      const loadStudentDistribution = async () => {
        setStudentsByDeptLoading(true);
        setStudentsByDeptError(null);
        
        const result = await fetchStudentDistribution();
        
        if (result.success) {
          setStudentsByDept(result.distribution);
          // Update student count if not already set
          if (!studentCount) {
            setStudentCount(result.totalStudents);
          }
        } else {
          setStudentsByDeptError(result.error);
          console.error("Error fetching student distribution:", result.error);
        }
        
        setStudentsByDeptLoading(false);
      };
      
      loadFacultyDistribution();
      loadStudentDistribution();
    }
  }, [userData]);

  // Determine which dashboard to show based on role
  const showAdminDashboard = userData?.role === "facultymanagement";
  const showTeachingDashboard =
    userData?.role === "teaching" || userData?.role === "HOD";
  const showNonTeachingDashboard = userData?.role === "non-teaching";

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600">
            Loading dashboard...
          </p>
          <div className="mt-4 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="w-full p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {userData?.firstName || userData?.email || "User"}
            </h1>
            <p className="text-gray-600">
              {showAdminDashboard
                ? "Faculty Management Dashboard"
                : showTeachingDashboard
                ? "Teaching Dashboard"
                : showNonTeachingDashboard
                ? "Non-Teaching Dashboard"
                : "Staff Dashboard"}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 px-4 py-2 rounded-md"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

        {/* Show appropriate dashboard based on role */}
        {showAdminDashboard ? (
          <div className="space-y-6">
            {/* Admin Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Total Faculty</p>
                    <p className="text-2xl font-bold">
                      {facultyCountLoading ? (
                        "..."
                      ) : facultyCountError ? (
                        <span className="text-red-500 text-base">Err</span>
                      ) : (
                        facultyCount
                      )}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users size={24} className="text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold">
                      {studentCountLoading ? (
                        "..."
                      ) : studentCountError ? (
                        <span className="text-gray-400 text-base">N/A</span>
                      ) : (
                        studentCount
                      )}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Users size={24} className="text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Total Departments</p>
                    <p className="text-2xl font-bold">
                      {departmentCountLoading ? (
                        "..."
                      ) : departmentCountError ? (
                        <span className="text-red-500 text-base">Err</span>
                      ) : (
                        departmentCount
                      )}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <BookOpen size={24} className="text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Graph Section */}
            <div className="bg-white rounded-lg shadow-md p-6 w-full">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Faculty & Student Distribution
              </h2>
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="font-medium text-gray-700">
                  Select Data:
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  className="w-full sm:w-auto p-2 border border-gray-300 rounded-md bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  <option value="faculty">Faculty</option>
                  <option value="students">Students</option>
                </select>
              </div>
              <div className="h-64 sm:h-80 overflow-x-auto">
                {(dataType === "faculty" && facultyByDeptLoading) || 
                 (dataType === "students" && studentsByDeptLoading) ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p>Loading {dataType} distribution...</p>
                    </div>
                  </div>
                ) : (dataType === "faculty" && facultyByDeptError) || 
                   (dataType === "students" && studentsByDeptError) ? (
                  <div className="flex items-center justify-center h-full text-red-500">
                    <div className="text-center">
                      <p>Error loading {dataType} data</p>
                      <p className="text-sm mt-1">
                        {dataType === "faculty" ? facultyByDeptError : studentsByDeptError}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Bar data={adminChartData} options={adminChartOptions} />
                )}
              </div>
            </div>
          </div>
        ) : showTeachingDashboard ? (
          <div className="space-y-6">
            {/* Teaching Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold">
                      {/* {teachingStats.totalStudents} */}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users size={24} className="text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Total Subjects</p>
                    <p className="text-2xl font-bold">
                      {/* {teachingStats.totalSubjects} */}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <BookOpen size={24} className="text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Graph */}
            <div className="bg-white rounded-lg shadow-md p-6 w-full">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Student Attendance by Subject
              </h2>
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="font-medium text-gray-700">
                  Select Subject:
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  className="w-full sm:w-auto p-2 border border-gray-300 rounded-md bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  {/* {teacherSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))} */}
                </select>
              </div>
              <div className="h-64 sm:h-80 overflow-x-auto">
                {/* <Bar data={teachingChartData} options={teachingChartOptions} /> */}
              </div>
            </div>
          </div>
        ) : showNonTeachingDashboard ? (
          <div className="space-y-6">
            {/* Non-Teaching Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Total Tasks</p>
                    <p className="text-2xl font-bold">
                      {/* {nonTeachingStats.totalTasks} */}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users size={24} className="text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Completed Tasks</p>
                    <p className="text-2xl font-bold">
                      {/* {nonTeachingStats.completedTasks} */}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Activity size={24} className="text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Pending Tasks</p>
                    <p className="text-2xl font-bold">
                      {/* {nonTeachingStats.pendingTasks} */}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Award size={24} className="text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500">Upcoming Meetings</p>
                    <p className="text-2xl font-bold">
                      {/* {nonTeachingStats.upcomingMeetings} */}
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Calendar size={24} className="text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Task Overview */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Task Overview</h2>
              <div className="space-y-2">
                {/* {taskData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-16 sm:w-24 flex-shrink-0 font-medium">
                      {item.name}
                    </div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${(item.completed / item.count) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="w-16 sm:w-20 text-right ml-2 font-medium text-green-600">
                      {item.completed}/{item.count}
                    </div>
                  </div>
                ))} */}
              </div>
            </div>

            {/* Upcoming Meetings */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Upcoming Meetings</h2>
              <div className="space-y-4">
                {/* <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-blue-50 rounded-lg">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Calendar size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Staff Coordination Meeting</p>
                    <p className="text-gray-500 text-sm">
                      Today, 2:00 PM - Conference Room
                    </p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    10 Attendees
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-purple-50 rounded-lg">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Calendar size={20} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Maintenance Review</p>
                    <p className="text-gray-500 text-sm">
                      Tomorrow, 10:00 AM - Admin Office
                    </p>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    5 Attendees
                  </span>
                </div> */}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Staff Dashboard</h2>
            <p className="text-gray-600">
              Welcome to your dashboard. Please use the sidebar to navigate to
              specific features like profile, payslip, or announcements.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
