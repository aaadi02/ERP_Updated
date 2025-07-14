import React, { useState, useEffect } from "react";
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
import { Users, BookOpen, GraduationCap } from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  // State for storing API data
  const [students, setStudents] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [streams, setStreams] = useState([]);

  // Derived data states
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalFaculties, setTotalFaculties] = useState(0);
  const [studentsByDept, setStudentsByDept] = useState({});
  const [facultiesByDept, setFacultiesByDept] = useState({});
  const [streamsByDept, setStreamsByDept] = useState({});
  const [studentsByStream, setStudentsByStream] = useState({});

  // New state for faculty role filter
  const [facultyRoleFilter, setFacultyRoleFilter] = useState("All");

  // Toggle states for detailed graphs
  const [showStudentGraph, setShowStudentGraph] = useState(false);
  const [showFacultyGraph, setShowFacultyGraph] = useState(false);
  const [showDeptGraph, setShowDeptGraph] = useState(false);
  const [showStreamGraph, setShowStreamGraph] = useState(false);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [
          studentsResponse,
          facultiesResponse,
          departmentsResponse,
          streamsResponse,
        ] = await Promise.all([
          fetch(
            "/api/superadmin/students"
          ),
          fetch(
            `/api/superadmin/faculties?role=${facultyRoleFilter}`
          ),
          fetch(
            "/api/superadmin/departments"
          ),
          fetch(
            "/api/superadmin/streams"
          ),
        ]);

        if (!studentsResponse.ok)
          throw new Error("Failed to fetch students data");
        if (!facultiesResponse.ok)
          throw new Error("Failed to fetch faculties data");
        if (!departmentsResponse.ok)
          throw new Error("Failed to fetch departments data");
        if (!streamsResponse.ok)
          throw new Error("Failed to fetch streams data");

        const studentsData = await studentsResponse.json();
        const facultiesData = await facultiesResponse.json();
        const departmentsData = await departmentsResponse.json();
        const streamsData = await streamsResponse.json();

        // Store data in state
        setStudents(studentsData);
        setFaculties(facultiesData);
        setDepartments(departmentsData);
        setStreams(streamsData);

        // Calculate derived data
        setTotalStudents(studentsData.length);
        setTotalFaculties(facultiesData.length);

        // Process students by department
        const studentsByDeptData = {};
        studentsData.forEach((student) => {
          const dept = student.department?.name || "Unknown";
          studentsByDeptData[dept] = (studentsByDeptData[dept] || 0) + 1;
        });
        setStudentsByDept(studentsByDeptData);

        // Process faculties by department
        const facultiesByDeptData = {};
        facultiesData.forEach((faculty) => {
          const dept = faculty.department?.name || "Unknown";
          facultiesByDeptData[dept] = (facultiesByDeptData[dept] || 0) + 1;
        });
        setFacultiesByDept(facultiesByDeptData);

        // Process streams by department (actually count departments per stream)
        const streamsByDeptData = {};
        departmentsData.forEach((department) => {
          const streamName = department.stream?.name || "Unknown";
          streamsByDeptData[streamName] = (streamsByDeptData[streamName] || 0) + 1;
        });
        setStreamsByDept(streamsByDeptData);

        // Process students by stream
        const studentsByStreamData = {};
        streamsData.forEach((stream) => {
          studentsByStreamData[stream.name] = 0;
        });
        studentsData.forEach((student) => {
          const streamName = student.stream?.name || "Unknown";
          if (studentsByStreamData.hasOwnProperty(streamName)) {
            studentsByStreamData[streamName] += 1;
          } else {
            studentsByStreamData[streamName] = 1;
          }
        });
        setStudentsByStream(studentsByStreamData);
      } catch (error) {
        console.error("Data fetching error:", error);
        setError("An error occurred while fetching data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [facultyRoleFilter]); // Re-run effect when facultyRoleFilter changes

  // Function to close all graphs except the specified one
  const toggleGraph = (graphToToggle) => {
    setShowStudentGraph(
      graphToToggle === "student" ? !showStudentGraph : false
    );
    setShowFacultyGraph(
      graphToToggle === "faculty" ? !showFacultyGraph : false
    );
    setShowDeptGraph(graphToToggle === "dept" ? !showDeptGraph : false);
    setShowStreamGraph(graphToToggle === "stream" ? !showStreamGraph : false);
  };

  // Stats items
  const statItems = [
    {
      title: "Total Students",
      value: totalStudents,
      icon: <Users className="h-6 w-6 text-indigo-600" />,
      onClick: () => toggleGraph("student"),
    },
    {
      title: "Total Faculties",
      value: totalFaculties,
      icon: <Users className="h-6 w-6 text-indigo-600" />,
      onClick: () => toggleGraph("faculty"),
    },
    {
      title: "Departments",
      value: departments.length,
      icon: <BookOpen className="h-6 w-6 text-indigo-600" />,
      onClick: () => toggleGraph("dept"),
    },
    {
      title: "Streams",
      value: streams.length,
      icon: <GraduationCap className="h-6 w-6 text-indigo-600" />,
      onClick: () => toggleGraph("stream"),
    },
  ];

  // Bar chart for Students by Department
  const studentDeptChartData = {
    labels: Object.keys(studentsByDept),
    datasets: [
      {
        label: "Students",
        data: Object.values(studentsByDept),
        backgroundColor: "#4F46E5",
        borderColor: "#4F46E5",
        borderWidth: 1,
      },
    ],
  };

  const studentDeptChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top", labels: { color: "#1F2937" } },
      title: {
        display: true,
        text: "Students by Department",
        color: "#1F2937",
        font: { size: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#1F2937" },
        grid: { color: "#E5E7EB" },
      },
      x: { ticks: { color: "#1F2937" }, grid: { display: false } },
    },
  };

  // Bar chart for Faculties by Department
  const facultyDeptChartData = {
    labels: Object.keys(facultiesByDept),
    datasets: [
      {
        label: `Faculties (${facultyRoleFilter})`,
        data: Object.values(facultiesByDept),
        backgroundColor: "#7C3AED",
        borderColor: "#7C3AED",
        borderWidth: 1,
      },
    ],
  };

  const facultyDeptChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top", labels: { color: "#1F2937" } },
      title: {
        display: true,
        text: `Faculties by Department (${facultyRoleFilter})`,
        color: "#1F2937",
        font: { size: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#1F2937" },
        grid: { color: "#E5E7EB" },
      },
      x: { ticks: { color: "#1F2937" }, grid: { display: false } },
    },
  };

  // Bar chart for Streams by Department
  const streamsByDeptChartData = {
    labels: Object.keys(streamsByDept),
    datasets: [
      {
        label: "Departments",
        data: Object.values(streamsByDept),
        backgroundColor: "#10B981",
        borderColor: "#10B981",
        borderWidth: 1,
      },
    ],
  };

  const streamsByDeptChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top", labels: { color: "#1F2937" } },
      title: {
        display: true,
        text: "Departments by Stream",
        color: "#1F2937",
        font: { size: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#1F2937" },
        grid: { color: "#E5E7EB" },
      },
      x: { ticks: { color: "#1F2937" }, grid: { display: false } },
    },
  };

  // Bar chart for Students by Stream
  const studentsByStreamChartData = {
    labels: Object.keys(studentsByStream),
    datasets: [
      {
        label: "Students",
        data: Object.values(studentsByStream),
        backgroundColor: "#EC4899",
        borderColor: "#EC4899",
        borderWidth: 1,
      },
    ],
  };

  const studentsByStreamChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top", labels: { color: "#1F2937" } },
      title: {
        display: true,
        text: "Students by Stream",
        color: "#1F2937",
        font: { size: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#1F2937" },
        grid: { color: "#E5E7EB" },
      },
      x: { ticks: { color: "#1F2937" }, grid: { display: false } },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Data
          </h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {statItems.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 flex items-center transform transition-all hover:shadow-lg cursor-pointer"
              onClick={stat.onClick}
            >
              <div className="bg-indigo-50 p-3 rounded-lg mr-4">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Faculty Role Filter Dropdown */}
        {showFacultyGraph && (
          <div className="mb-4">
            <label
              htmlFor="facultyRole"
              className="text-sm font-medium text-gray-700 mr-2"
            >
              Filter by Faculty Role:
            </label>
            <select
              id="facultyRole"
              value={facultyRoleFilter}
              onChange={(e) => setFacultyRoleFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All</option>
              <option value="Teaching">Teaching</option>
              <option value="Non-Teaching">Non-Teaching</option>
              <option value="HOD">HOD</option>
            </select>
          </div>
        )}

        {/* Detailed Graphs */}
        {showStudentGraph && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <Bar
              data={studentDeptChartData}
              options={studentDeptChartOptions}
            />
          </div>
        )}

        {showFacultyGraph && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <Bar
              data={facultyDeptChartData}
              options={facultyDeptChartOptions}
            />
          </div>
        )}

        {showDeptGraph && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <Bar
              data={streamsByDeptChartData}
              options={streamsByDeptChartOptions}
            />
          </div>
        )}

        {showStreamGraph && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <Bar
              data={studentsByStreamChartData}
              options={studentsByStreamChartOptions}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
