import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Users,
  BookOpen,
  GraduationCap,
  Filter,
  ChevronDown,
  Calendar,
  Image,
  Hash,
  Sun,
  Moon,
} from "lucide-react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SummaryPage = () => {
  const navigate = useNavigate();
  
  // State variables
  const [students, setStudents] = useState([]);
  const [castes, setCastes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [streams, setStreams] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [admissionTypeData, setAdmissionTypeData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [streamData, setStreamData] = useState([]);
  const [nationalityData, setNationalityData] = useState([]);
  const [guardianStatusData, setGuardianStatusData] = useState([]);
  const [photoStatusData, setPhotoStatusData] = useState([]);
  const [abcIdStatusData, setAbcIdStatusData] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [admissionsByMonth, setAdmissionsByMonth] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("Department");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(null);
  const [isMonthFilterOpen, setIsMonthFilterOpen] = useState(false);
  const [theme, setTheme] = useState("dark"); // 'light' or 'dark'

  // Theme toggle
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      localStorage.removeItem('token');
      navigate('/');
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get authentication headers
        const headers = getAuthHeaders();
        if (!headers) return;

        const [
          studentsResponse,
          castesResponse,
          departmentsResponse,
          streamsResponse,
        ] = await Promise.all([
          fetch("/api/superadmin/students", { headers }),
          fetch("/api/superadmin/castes", { headers }),
          fetch("/api/superadmin/departments", { headers }),
          fetch("/api/superadmin/streams", { headers }),
        ]);

        // Check for authentication errors
        if (studentsResponse.status === 401 || castesResponse.status === 401 || 
            departmentsResponse.status === 401 || streamsResponse.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }

        if (!studentsResponse.ok)
          throw new Error(
            `Failed to fetch students data: ${studentsResponse.statusText}`
          );
        if (!castesResponse.ok)
          throw new Error(
            `Failed to fetch castes data: ${castesResponse.statusText}`
          );
        if (!departmentsResponse.ok)
          throw new Error(
            `Failed to fetch departments data: ${departmentsResponse.statusText}`
          );
        if (!streamsResponse.ok)
          throw new Error(
            `Failed to fetch streams data: ${streamsResponse.statusText}`
          );

        const studentsData = await studentsResponse.json();
        const castesData = await castesResponse.json();
        const departmentsData = await departmentsResponse.json();
        const streamsData = await streamsResponse.json();

        setStudents(studentsData);
        setCastes(castesData);
        setDepartments(departmentsData);
        setStreams(streamsData);

        processData(studentsData, castesData, departmentsData, streamsData);
      } catch (error) {
        console.error("Data fetching error:", error);
        
        // Handle authentication errors
        if (error.message.includes('authentication') || error.message.includes('token')) {
          localStorage.removeItem('token');
          navigate('/');
          return;
        }
        
        setError(error.message || "An error occurred while fetching data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const processData = (
    studentsData,
    castesData,
    departmentsData,
    streamsData
  ) => {
    setTotalStudents(studentsData.length);

    const deptCounts = {};
    departmentsData.forEach((dept) => (deptCounts[dept._id] = 0));
    const admTypes = {
      Regular: 0,
      "Direct Second Year": 0,
      "Lateral Entry": 0,
    };
    const catCounts = {};
    castesData.forEach((caste) => (catCounts[caste._id] = 0));
    const streamCounts = {};
    streamsData.forEach((stream) => (streamCounts[stream._id] = 0));
    const nationalityCounts = {};
    const guardianStatusCounts = { Provided: 0, "Not Provided": 0 };
    const photoStatusCounts = { Provided: 0, "Not Provided": 0 };
    const abcIdStatusCounts = { Provided: 0, "Not Provided": 0 };

    studentsData.forEach((student) => {
      const nationality = student.nationality || "Unknown";
      nationalityCounts[nationality] = (nationalityCounts[nationality] || 0) + 1;
      guardianStatusCounts[student.guardianNumber ? "Provided" : "Not Provided"]++;
      photoStatusCounts[student.photo ? "Provided" : "Not Provided"]++;
      abcIdStatusCounts[student.abcId ? "Provided" : "Not Provided"]++;
    });

    const monthlyData = {};
    studentsData.forEach((student) => {
      if (student.department?._id) deptCounts[student.department._id]++;
      const admissionType = student.admissionType || "Regular";
      if (admTypes.hasOwnProperty(admissionType)) admTypes[admissionType]++;
      else admTypes["Regular"]++;
      if (student.casteCategory) {
        const caste = castesData.find((c) => c.name === student.casteCategory);
        if (caste) catCounts[caste._id]++;
      }
      if (student.stream?._id) streamCounts[student.stream._id]++;
      if (student.createdAt) {
        const date = new Date(student.createdAt);
        const monthYear = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            month: monthYear,
            departments: {},
            admissionTypes: { Regular: 0, "Direct Second Year": 0, "Lateral Entry": 0 },
            categories: {},
            streams: {},
            nationalities: {},
            guardianStatus: { Provided: 0, "Not Provided": 0 },
            photoStatus: { Provided: 0, "Not Provided": 0 },
            abcIdStatus: { Provided: 0, "Not Provided": 0 },
          };
          departmentsData.forEach(
            (dept) => (monthlyData[monthYear].departments[dept._id] = 0)
          );
          castesData.forEach(
            (caste) => (monthlyData[monthYear].categories[caste._id] = 0)
          );
          streamsData.forEach(
            (stream) => (monthlyData[monthYear].streams[stream._id] = 0)
          );
          Object.keys(nationalityCounts).forEach(
            (nationality) =>
              (monthlyData[monthYear].nationalities[nationality] = 0)
          );
        }
        if (student.department?._id)
          monthlyData[monthYear].departments[student.department._id]++;
        if (admTypes.hasOwnProperty(admissionType))
          monthlyData[monthYear].admissionTypes[admissionType]++;
        else monthlyData[monthYear].admissionTypes["Regular"]++;
        if (student.casteCategory) {
          const caste = castesData.find((c) => c.name === student.casteCategory);
          if (caste) monthlyData[monthYear].categories[caste._id]++;
        }
        if (student.stream?._id)
          monthlyData[monthYear].streams[student.stream._id]++;
        const nationality = student.nationality || "Unknown";
        monthlyData[monthYear].nationalities[nationality]++;
        monthlyData[monthYear].guardianStatus[
          student.guardianNumber ? "Provided" : "Not Provided"
        ]++;
        monthlyData[monthYear].photoStatus[
          student.photo ? "Provided" : "Not Provided"
        ]++;
        monthlyData[monthYear].abcIdStatus[
          student.abcId ? "Provided" : "Not Provided"
        ]++;
      }
    });

    const formattedDepartments = departmentsData
      .map((dept) => ({ name: dept.name, count: deptCounts[dept._id] || 0 }))
      .sort((a, b) => b.count - a.count);
    const formattedAdmissionTypes = Object.keys(admTypes)
      .map((type) => ({ name: type, count: admTypes[type] }))
      .sort((a, b) => b.count - a.count);
    const formattedCategories = castesData
      .map((caste) => ({ name: caste.name, count: catCounts[caste._id] || 0 }))
      .sort((a, b) => b.count - a.count);
    const formattedStreams = streamsData
      .map((stream) => ({ name: stream.name, count: streamCounts[stream._id] || 0 }))
      .sort((a, b) => b.count - a.count);
    const formattedNationalities = Object.keys(nationalityCounts)
      .map((nationality) => ({
        name: nationality,
        count: nationalityCounts[nationality],
      }))
      .sort((a, b) => b.count - a.count);
    const formattedGuardianStatus = Object.keys(guardianStatusCounts)
      .map((status) => ({
        name: status,
        count: guardianStatusCounts[status],
      }))
      .sort((a, b) => b.count - a.count);
    const formattedPhotoStatus = Object.keys(photoStatusCounts)
      .map((status) => ({
        name: status,
        count: photoStatusCounts[status],
      }))
      .sort((a, b) => b.count - a.count);
    const formattedAbcIdStatus = Object.keys(abcIdStatusCounts)
      .map((status) => ({
        name: status,
        count: abcIdStatusCounts[status],
      }))
      .sort((a, b) => b.count - a.count);

    const formattedMonthlyData = Object.keys(monthlyData)
      .map((month) => {
        const data = monthlyData[month];
        return {
          month: data.month,
          departments: departmentsData
            .map((dept) => ({
              name: dept.name,
              count: data.departments[dept._id] || 0,
            }))
            .sort((a, b) => b.count - a.count),
          admissionTypes: Object.keys(data.admissionTypes)
            .map((type) => ({
              name: type,
              count: data.admissionTypes[type],
            }))
            .sort((a, b) => b.count - a.count),
          categories: castesData
            .map((caste) => ({
              name: caste.name,
              count: data.categories[caste._id] || 0,
            }))
            .sort((a, b) => b.count - a.count),
          streams: streamsData
            .map((stream) => ({
              name: stream.name,
              count: data.streams[stream._id] || 0,
            }))
            .sort((a, b) => b.count - a.count),
          nationalities: Object.keys(data.nationalities)
            .map((nationality) => ({
              name: nationality,
              count: data.nationalities[nationality],
            }))
            .sort((a, b) => b.count - a.count),
          guardianStatus: Object.keys(data.guardianStatus)
            .map((status) => ({
              name: status,
              count: data.guardianStatus[status],
            }))
            .sort((a, b) => b.count - a.count),
          photoStatus: Object.keys(data.photoStatus)
            .map((status) => ({
              name: status,
              count: data.photoStatus[status],
            }))
            .sort((a, b) => b.count - a.count),
          abcIdStatus: Object.keys(data.abcIdStatus)
            .map((status) => ({
              name: status,
              count: data.abcIdStatus[status],
            }))
            .sort((a, b) => b.count - a.count),
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    setDepartmentData(formattedDepartments);
    setAdmissionTypeData(formattedAdmissionTypes);
    setCategoryData(formattedCategories);
    setStreamData(formattedStreams);
    setNationalityData(formattedNationalities);
    setGuardianStatusData(formattedGuardianStatus);
    setPhotoStatusData(formattedPhotoStatus);
    setAbcIdStatusData(formattedAbcIdStatus);
    setAdmissionsByMonth(formattedMonthlyData);
  };

  const getBarChartData = () => {
    let data, labels, title;
    if (selectedMonthFilter) {
      const monthData = admissionsByMonth.find(
        (item) => item.month === selectedMonthFilter
      );
      if (monthData) {
        switch (filterType) {
          case "Department":
            data = monthData.departments.map((dept) => dept.count);
            labels = monthData.departments.map((dept) => dept.name);
            title = `Student Enrollment by Department (${formatMonthYear(
              selectedMonthFilter
            )})`;
            break;
          case "Admission Type":
            data = monthData.admissionTypes.map((type) => type.count);
            labels = monthData.admissionTypes.map((type) => type.name);
            title = `Student Enrollment by Admission Type (${formatMonthYear(
              selectedMonthFilter
            )})`;
            break;
          case "Category":
            data = monthData.categories.map((cat) => cat.count);
            labels = monthData.categories.map((cat) => cat.name);
            title = `Student Enrollment by Category (${formatMonthYear(
              selectedMonthFilter
            )})`;
            break;
          case "Stream":
            data = monthData.streams.map((stream) => stream.count);
            labels = monthData.streams.map((stream) => stream.name);
            title = `Student Enrollment by Stream (${formatMonthYear(
              selectedMonthFilter
            )})`;
            break;
          case "Nationality":
            data = monthData.nationalities.map((nat) => nat.count);
            labels = monthData.nationalities.map((nat) => nat.name);
            title = `Student Enrollment by Nationality (${formatMonthYear(
              selectedMonthFilter
            )})`;
            break;
          case "Guardian Status":
            data = monthData.guardianStatus.map((status) => status.count);
            labels = monthData.guardianStatus.map((status) => status.name);
            title = `Student Enrollment by Guardian Status (${formatMonthYear(
              selectedMonthFilter
            )})`;
            break;
          case "Photo Status":
            data = monthData.photoStatus.map((status) => status.count);
            labels = monthData.photoStatus.map((status) => status.name);
            title = `Student Enrollment by Photo Status (${formatMonthYear(
              selectedMonthFilter
            )})`;
            break;
          case "ABC ID Status":
            data = monthData.abcIdStatus.map((status) => status.count);
            labels = monthData.abcIdStatus.map((status) => status.name);
            title = `Student Enrollment by ABC ID Status (${formatMonthYear(
              selectedMonthFilter
            )})`;
            break;
          default:
            data = [];
            labels = [];
            title = "";
        }
      } else {
        data = [];
        labels = [];
        title = `No Data for ${formatMonthYear(selectedMonthFilter)}`;
      }
    } else {
      switch (filterType) {
        case "Department":
          data = departmentData.map((dept) => dept.count);
          labels = departmentData.map((dept) => dept.name);
          title = "Student Enrollment by Department";
          break;
        case "Admission Type":
          data = admissionTypeData.map((type) => type.count);
          labels = admissionTypeData.map((type) => type.name);
          title = "Student Enrollment by Admission Type";
          break;
        case "Category":
          data = categoryData.map((cat) => cat.count);
          labels = categoryData.map((cat) => cat.name);
          title = "Student Enrollment by Category";
          break;
        case "Stream":
          data = streamData.map((stream) => stream.count);
          labels = streamData.map((stream) => stream.name);
          title = "Student Enrollment by Stream";
          break;
        case "Nationality":
          data = nationalityData.map((nat) => nat.count);
          labels = nationalityData.map((nat) => nat.name);
          title = "Student Enrollment by Nationality";
          break;
        case "Guardian Status":
          data = guardianStatusData.map((status) => status.count);
          labels = guardianStatusData.map((status) => status.name);
          title = "Student Enrollment by Guardian Status";
          break;
        case "Photo Status":
          data = photoStatusData.map((status) => status.count);
          labels = photoStatusData.map((status) => status.name);
          title = "Student Enrollment by Photo Status";
          break;
        case "ABC ID Status":
          data = abcIdStatusData.map((status) => status.count);
          labels = abcIdStatusData.map((status) => status.name);
          title = "Student Enrollment by ABC ID Status";
          break;
        default:
          data = [];
          labels = [];
          title = "";
      }
    }
    return {
      labels,
      datasets: [
        {
          label: selectedMonthFilter ? "Admissions" : "Students Enrolled",
          data,
          backgroundColor: [
            "rgba(99, 102, 241, 0.8)",
            "rgba(79, 70, 229, 0.8)",
            "rgba(67, 56, 202, 0.8)",
            "rgba(55, 48, 163, 0.8)",
            "rgba(49, 46, 129, 0.8)",
          ],
          borderColor: [
            "rgba(99, 102, 241, 1)",
            "rgba(79, 70, 229, 1)",
            "rgba(67, 56, 202, 1)",
            "rgba(55, 48, 163, 1)",
            "rgba(49, 46, 129, 1)",
          ],
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
      title,
    };
  };

  const getDoughnutData = () => {
    let data, labels;
    if (selectedMonthFilter) {
      const monthData = admissionsByMonth.find(
        (item) => item.month === selectedMonthFilter
      );
      if (monthData) {
        switch (filterType) {
          case "Department":
            data = monthData.departments.map((dept) => dept.count);
            labels = monthData.departments.map((dept) => dept.name);
            break;
          case "Admission Type":
            data = monthData.admissionTypes.map((type) => type.count);
            labels = monthData.admissionTypes.map((type) => type.name);
            break;
          case "Category":
            data = monthData.categories.map((cat) => cat.count);
            labels = monthData.categories.map((cat) => cat.name);
            break;
          case "Stream":
            data = monthData.streams.map((stream) => stream.count);
            labels = monthData.streams.map((stream) => stream.name);
            break;
          case "Nationality":
            data = monthData.nationalities.map((nat) => nat.count);
            labels = monthData.nationalities.map((nat) => nat.name);
            break;
          case "Guardian Status":
            data = monthData.guardianStatus.map((status) => status.count);
            labels = monthData.guardianStatus.map((status) => status.name);
            break;
          case "Photo Status":
            data = monthData.photoStatus.map((status) => status.count);
            labels = monthData.photoStatus.map((status) => status.name);
            break;
          case "ABC ID Status":
            data = monthData.abcIdStatus.map((status) => status.count);
            labels = monthData.abcIdStatus.map((status) => status.name);
            break;
          default:
            data = [];
            labels = [];
        }
      } else {
        data = [];
        labels = [];
      }
    } else {
      switch (filterType) {
        case "Department":
          data = departmentData.map((dept) => dept.count);
          labels = departmentData.map((dept) => dept.name);
          break;
        case "Admission Type":
          data = admissionTypeData.map((type) => type.count);
          labels = admissionTypeData.map((type) => type.name);
          break;
        case "Category":
          data = categoryData.map((cat) => cat.count);
          labels = categoryData.map((cat) => cat.name);
          break;
        case "Stream":
          data = streamData.map((stream) => stream.count);
          labels = streamData.map((stream) => stream.name);
          break;
        case "Nationality":
          data = nationalityData.map((nat) => nat.count);
          labels = nationalityData.map((nat) => nat.name);
          break;
        case "Guardian Status":
          data = guardianStatusData.map((status) => status.count);
          labels = guardianStatusData.map((status) => status.name);
          break;
        case "Photo Status":
          data = photoStatusData.map((status) => status.count);
          labels = photoStatusData.map((status) => status.name);
          break;
        case "ABC ID Status":
          data = abcIdStatusData.map((status) => status.count);
          labels = abcIdStatusData.map((status) => status.name);
          break;
        default:
          data = [];
          labels = [];
      }
    }
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(16, 185, 129, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(139, 92, 246, 0.8)",
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(139, 92, 246, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const formatMonthYear = (monthYearStr) => {
    if (!monthYearStr) return "";
    try {
      const [year, month] = monthYearStr.split("-");
      return new Date(`${year}-${month}-01`).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return monthYearStr;
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "x",
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: getBarChartData().title,
        font: { size: 16, weight: "bold" },
        color: "#1e293b",
        padding: { top: 10, bottom: 20 },
      },
      tooltip: { enabled: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
        ticks: { color: "#64748b", font: { size: 12 } },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: "#64748b",
          font: { size: 12, weight: "bold" },
          callback: function (index) {
            const label = this.getLabelForValue(index);
            const value = this.chart.data.datasets[0].data[index];
            return [`${label}`, `(${value})`];
          },
          padding: 10,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "right",
        labels: { font: { size: 12 }, usePointStyle: true, padding: 20, color: "#64748b" },
      },
      title: {
        display: true,
        text: selectedMonthFilter
          ? `Students by ${filterType} (${formatMonthYear(selectedMonthFilter)})`
          : `Students by ${filterType}`,
        font: { size: 16, weight: "bold" },
        color: "#1e293b",
        padding: { top: 10, bottom: 10 },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        callbacks: {
          label: function (context) {
            const total = context.dataset.data.reduce(
              (sum, value) => sum + value,
              0
            );
            const percentage = Math.round((context.raw / total) * 100);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          },
        },
      },
    },
  };

  const statItems = [
    {
      title: "Total Students",
      value: totalStudents,
      icon: <Users className="h-6 w-6 text-indigo-600" />,
    },
    {
      title: "Departments",
      value: departments.length,
      icon: <BookOpen className="h-6 w-6 text-indigo-600" />,
    },
    {
      title: "Streams",
      value: streams.length,
      icon: <GraduationCap className="h-6 w-6 text-indigo-600" />,
    },
    {
      title: "Photos Provided",
      value: photoStatusData.find((s) => s.name === "Provided")?.count || 0,
      icon: <Image className="h-6 w-6 text-indigo-600" />,
    },
    {
      title: "ABC IDs Provided",
      value: abcIdStatusData.find((a) => a.name === "Provided")?.count || 0,
      icon: <Hash className="h-6 w-6 text-indigo-600" />,
    },
  ];

  // THEME CLASSES
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
    },
  };
  const currentTheme = themeClasses[theme];

  if (isLoading) {
    return (
      <div className={`min-h-screen ${currentTheme.bg} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-2xl"></div>
          <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-indigo-100' : 'text-indigo-700'} tracking-widest animate-pulse`}>
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-red-900 via-indigo-900 to-black' : 'bg-gradient-to-br from-red-100 via-indigo-100 to-gray-100'} flex items-center justify-center`}>
        <div className={`${theme === 'dark' ? 'bg-white/80' : 'bg-white'} backdrop-blur-2xl rounded-3xl shadow-2xl p-10 max-w-md border-2 border-red-300`}>
          <h2 className="text-3xl font-black text-red-700 mb-4 tracking-tight">Error Loading Data</h2>
          <p className={`${theme === 'dark' ? 'text-gray-800' : 'text-gray-700'} mb-6`}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.textPrimary} pb-12 font-sans transition-colors duration-500`}>
      {/* Header */}
      <div className={`${currentTheme.headerBg} py-9 px-4 md:px-16 shadow-2xl ${currentTheme.headerBorder}`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg bg-gradient-to-r ${theme === 'dark' ? 'from-white via-indigo-200 to-purple-300' : 'from-indigo-800 via-purple-700 to-indigo-900'} bg-clip-text text-transparent animate-gradient-x`}>
              Student Enrollment Dashboard
            </h1>
            <p className={`${currentTheme.textSecondary} mt-2 text-lg font-medium tracking-wider animate-fade-in`}>
              Academic Year 2024-2025
            </p>
          </div>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-full ${theme === 'dark' ? 'bg-indigo-700' : 'bg-indigo-200'} shadow-lg hover:scale-110 transition-transform duration-300 animate-pulse-slow`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-6 w-6 text-yellow-300" />
            ) : (
              <Moon className="h-6 w-6 text-indigo-700" />
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-10">
          {statItems.map((stat, index) => (
            <div
              key={index}
              className={`relative ${currentTheme.cardBg} rounded-2xl shadow-2xl p-8 flex items-center gap-6 ${currentTheme.cardBorder} hover:scale-105 hover:shadow-indigo-700/40 transition-all duration-300 group animate-fade-in-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`${currentTheme.statsIcon} p-4 rounded-xl flex-shrink-0 shadow-lg group-hover:scale-110 transition`}>
                {stat.icon}
              </div>
              <div>
                <p className={`text-base font-semibold ${currentTheme.textSecondary} uppercase tracking-wider`}>
                  {stat.title}
                </p>
                <p className={`text-3xl md:text-4xl font-black ${currentTheme.textAccent} drop-shadow-sm tracking-tight animate-count`}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`absolute -top-4 -right-4 w-8 h-8 ${currentTheme.glow} rounded-full blur-lg opacity-60 animate-pulse`}></div>
            </div>
          ))}
        </div>
        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Bar Chart Panel */}
          <div className="lg:col-span-2 animate-fade-in-left">
            <div className={`${currentTheme.chartBg} rounded-2xl shadow-2xl p-8 ${currentTheme.cardBorder} relative overflow-hidden`}>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                {/* Filter Type Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-2 px-6 py-3 text-base font-bold ${theme === 'dark' ? 'text-indigo-100' : 'text-white'} ${currentTheme.buttonBg} border ${theme === 'dark' ? 'border-indigo-400/40' : 'border-indigo-300'} rounded-xl shadow-lg hover:scale-105 ${currentTheme.buttonHover} transition-all`}
                  >
                    <Filter className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-100'}`} />
                    <span>{filterType}</span>
                    <ChevronDown className="w-5 h-5" />
                  </button>
                  {isFilterOpen && (
                    <div className={`absolute z-50 w-56 mt-2 ${theme === 'dark' ? 'bg-white/90' : 'bg-white'} backdrop-blur-xl border ${theme === 'dark' ? 'border-indigo-200' : 'border-indigo-300'} rounded-xl shadow-2xl animate-fade-in`}>
                      <div className="py-2">
                        {[
                          "Department",
                          "Admission Type",
                          "Category",
                          "Stream",
                          "Nationality",
                          "Guardian Status",
                          "Photo Status",
                          "ABC ID Status",
                        ].map((type) => (
                          <button
                            key={type}
                            onClick={() => {
                              setFilterType(type);
                              setIsFilterOpen(false);
                              setSelectedMonthFilter(null);
                            }}
                            className={`block w-full px-5 py-3 text-base text-left font-semibold rounded-md transition ${
                              filterType === type
                                ? `bg-gradient-to-r ${theme === 'dark' ? 'from-indigo-200 via-purple-200 to-indigo-100' : 'from-indigo-100 via-purple-100 to-indigo-50'} text-indigo-800 shadow`
                                : `${theme === 'dark' ? 'text-indigo-800 hover:bg-indigo-50' : 'text-indigo-700 hover:bg-indigo-100'}`
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Month Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsMonthFilterOpen(!isMonthFilterOpen)}
                    className={`flex items-center gap-2 px-6 py-3 text-base font-bold ${theme === 'dark' ? 'text-indigo-100' : 'text-white'} ${currentTheme.buttonBg} border ${theme === 'dark' ? 'border-indigo-400/40' : 'border-indigo-300'} rounded-xl shadow-lg hover:scale-105 ${currentTheme.buttonHover} transition-all`}
                  >
                    <Calendar className={`w-5 h-5 ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-100'}`} />
                    <span>
                      {selectedMonthFilter
                        ? formatMonthYear(selectedMonthFilter)
                        : "Select Month"}
                    </span>
                    <ChevronDown className="w-5 h-5" />
                  </button>
                  {isMonthFilterOpen && (
                    <div className={`absolute z-50 w-56 mt-2 ${theme === 'dark' ? 'bg-white/90' : 'bg-white'} backdrop-blur-xl border ${theme === 'dark' ? 'border-indigo-200' : 'border-indigo-300'} rounded-xl shadow-2xl animate-fade-in max-h-72 overflow-y-auto custom-scrollbar`}>
                      {admissionsByMonth.map((item) => (
                        <button
                          key={item.month}
                          onClick={() => {
                            setSelectedMonthFilter(item.month);
                            setIsMonthFilterOpen(false);
                          }}
                          className={`block w-full px-5 py-3 text-base text-left font-semibold rounded-md transition ${
                            selectedMonthFilter === item.month
                              ? `bg-gradient-to-r ${theme === 'dark' ? 'from-indigo-200 via-purple-200 to-indigo-100' : 'from-indigo-100 via-purple-100 to-indigo-50'} text-indigo-800 shadow`
                              : `${theme === 'dark' ? 'text-indigo-800 hover:bg-indigo-50' : 'text-indigo-700 hover:bg-indigo-100'}`
                          }`}
                        >
                          {formatMonthYear(item.month)}
                        </button>
                      ))}
                      {selectedMonthFilter && (
                        <button
                          onClick={() => {
                            setSelectedMonthFilter(null);
                            setIsMonthFilterOpen(false);
                          }}
                          className="block w-full px-5 py-3 text-base text-left font-bold text-red-600 hover:bg-red-50 rounded-md"
                        >
                          Clear Month
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Bar Chart */}
              <div className="h-80 md:h-96 xl:h-[32rem] relative z-10">
                <Bar data={getBarChartData()} options={barChartOptions} />
              </div>
              <div className={`absolute -bottom-10 -left-10 w-40 h-40 ${currentTheme.glow} rounded-full blur-3xl opacity-60 pointer-events-none`}></div>
            </div>
          </div>
          {/* Doughnut Chart Panel */}
          <div className="animate-fade-in-right">
            <div className={`${currentTheme.chartBg} rounded-2xl shadow-2xl p-8 ${currentTheme.cardBorder} relative overflow-hidden`}>
              <div className="h-64 md:h-80 xl:h-[22rem]">
                <Doughnut data={getDoughnutData()} options={doughnutOptions} />
              </div>
              <div className={`absolute -top-8 -right-8 w-32 h-32 ${currentTheme.doughnutGlow} rounded-full blur-2xl opacity-60 pointer-events-none`}></div>
            </div>
          </div>
        </div>
      </div>
      {/* Custom Scrollbar and Animations */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #818cf8, #a5b4fc, #c4b5fd);
            border-radius: 8px;
          }
          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 4s ease infinite;
          }
          @keyframes gradient-x {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-fade-in {
            animation: fadeIn 0.4s ease;
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out;
          }
          .animate-fade-in-left {
            animation: fadeInLeft 0.7s ease-out;
          }
          .animate-fade-in-right {
            animation: fadeInRight 0.7s ease-out;
          }
          .animate-pulse-slow {
            animation: pulseSlow 2s infinite;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(12px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @keyframes fadeInLeft {
            from { opacity: 0; transform: translateX(-30px);}
            to { opacity: 1; transform: translateX(0);}
          }
          @keyframes fadeInRight {
            from { opacity: 0; transform: translateX(30px);}
            to { opacity: 1; transform: translateX(0);}
          }
          @keyframes pulseSlow {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};

export default SummaryPage;
