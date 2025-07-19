import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Users,
  GraduationCap,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  FileText,
  Award,
  Bell,
  BarChart3,
  Plus,
  X,
  Edit2,
  Trash2,
  Save,
  Filter,
  ListTodo,
  Book,
} from "lucide-react";

// Sample data for enhanced dashboard
const facultyAttendanceData = [
  {
    section: "Section A",
    attendance: 92,
    faculty: "Dr. Smith",
    subject: "Mathematics",
  },
  {
    section: "Section B",
    attendance: 88,
    faculty: "Prof. Johnson",
    subject: "Physics",
  },
  {
    section: "Section C",
    attendance: 95,
    faculty: "Dr. Williams",
    subject: "Chemistry",
  },
  {
    section: "Section D",
    attendance: 85,
    faculty: "Prof. Brown",
    subject: "Biology",
  },
];

const studentAttendanceData = [
  { section: "Section A", attendance: 90, strength: 45, present: 41 },
  { section: "Section B", attendance: 82, strength: 48, present: 39 },
  { section: "Section C", attendance: 93, strength: 43, present: 40 },
  { section: "Section D", attendance: 80, strength: 50, present: 40 },
];

const leaveData = [
  { name: "Approved", value: 15, color: "#10B981" },
  { name: "Pending", value: 8, color: "#F59E0B" },
  { name: "Rejected", value: 3, color: "#EF4444" },
];

const weeklyTrends = [
  { day: "Mon", attendance: 88, submissions: 12 },
  { day: "Tue", attendance: 92, submissions: 15 },
  { day: "Wed", attendance: 85, submissions: 18 },
  { day: "Thu", attendance: 90, submissions: 14 },
  { day: "Fri", attendance: 87, submissions: 16 },
];

export default function HodDashboard() {
  const [filter, setFilter] = useState("students"); // Default filter: students
  const [stats, setStats] = useState({
    totalFaculty: 0,
    totalStudents: 0,
    pendingLeaves: 0,
    lowAttendanceSections: 0,
    activeClasses: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  // Todo state management
  const [todos, setTodos] = useState([]);
  const [todoStats, setTodoStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
  });
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [todoFilter, setTodoFilter] = useState("all");
  const [newTodo, setNewTodo] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "Other",
    assignedTo: "",
    assignedToRole: "faculty",
    dueDate: "",
    tags: [],
  });

  // Get user data from localStorage
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      setUserData(JSON.parse(user));
    }
  }, []);

  // Get auth token helper
  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.token || localStorage.getItem("authToken");
  };

  // Fetch todos from backend
  const fetchTodos = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(
        `http://localhost:5000/api/dashboard/hod-todos?status=${
          todoFilter === "all" ? "" : todoFilter
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTodos(data.todos || []);
        setTodoStats(
          data.stats || {
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
            overdue: 0,
          }
        );
      } else {
        console.error("Failed to fetch todos:", response.status);
      }
    } catch (err) {
      console.error("Error fetching todos:", err);
    }
  };

  // Create new todo
  const handleCreateTodo = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      if (!newTodo.title || !newTodo.assignedTo || !newTodo.dueDate) {
        alert("Please fill in all required fields");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/dashboard/hod-todos",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newTodo),
        }
      );

      if (response.ok) {
        setShowTodoModal(false);
        setNewTodo({
          title: "",
          description: "",
          priority: "Medium",
          category: "Other",
          assignedTo: "",
          assignedToRole: "faculty",
          dueDate: "",
          tags: [],
        });
        fetchTodos();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create todo");
      }
    } catch (err) {
      console.error("Error creating todo:", err);
      alert("Failed to create todo");
    }
  };

  // Update todo status
  const handleUpdateTodo = async (todoId, status, progress) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(
        `http://localhost:5000/api/dashboard/hod-todos/${todoId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status, progress }),
        }
      );

      if (response.ok) {
        fetchTodos();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update todo");
      }
    } catch (err) {
      console.error("Error updating todo:", err);
      alert("Failed to update todo");
    }
  };

  // Delete todo
  const handleDeleteTodo = async (todoId) => {
    if (!window.confirm("Are you sure you want to delete this todo?")) return;

    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(
        `http://localhost:5000/api/dashboard/hod-todos/${todoId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        fetchTodos();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete todo");
      }
    } catch (err) {
      console.error("Error deleting todo:", err);
      alert("Failed to delete todo");
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "text-red-600 bg-red-100";
      case "Medium":
        return "text-yellow-600 bg-yellow-100";
      case "Low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "text-green-600 bg-green-100";
      case "In Progress":
        return "text-blue-600 bg-blue-100";
      case "Pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  // Fetch stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get token from userData first, then fallback to authToken
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const token = user?.token || localStorage.getItem("authToken");

        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(
          "http://localhost:5000/api/dashboard/hod-stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }

        const data = await response.json();
        setStats({
          totalFaculty: data.totalFaculty || 0,
          totalStudents: data.totalStudents || 0,
          pendingLeaves: data.pendingLeaves || 0,
          pendingTasks: data.pendingTasks || 0,
          completedTasks: data.completedTasks || 0,
          department: data.department || "Unknown",
          attendanceAverage: data.attendanceAverage || 0,
          departmentPerformance: data.departmentPerformance || 0,
        });
      } catch (err) {
        setError(err.message || "Error fetching dashboard data");
        console.error("Error fetching HOD stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchTodos(); // Also fetch todos when component mounts
  }, []);

  // Fetch todos when filter changes
  useEffect(() => {
    fetchTodos();
  }, [todoFilter]);

  // Select data based on filter
  const chartData =
    filter === "students" ? studentAttendanceData : facultyAttendanceData;

  // Stats cards configuration
  const statsCards = [
    {
      title: "Total Faculty",
      value: loading ? "..." : error ? "Error" : stats.totalFaculty,
      icon: <Users className="w-8 h-8 text-blue-500" />,
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      change: "+2",
      changeType: "positive",
    },
    {
      title: "Total Students",
      value: loading ? "..." : error ? "Error" : stats.totalStudents,
      icon: <GraduationCap className="w-8 h-8 text-green-500" />,
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      change: "+15",
      changeType: "positive",
    },
    {
      title: "Pending Leaves",
      value: loading ? "..." : error ? "Error" : stats.pendingLeaves,
      icon: <Clock className="w-8 h-8 text-yellow-500" />,
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      change: "+3",
      changeType: "neutral",
    },
    {
      title: "Tasks Remaining",
      value: loading ? "..." : error ? "Error" : stats.pendingTasks || 0,
      icon: <ListTodo className="w-8 h-8 text-orange-500" />,
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      change: todoStats.overdue > 0 ? `+${todoStats.overdue}` : "0",
      changeType: todoStats.overdue > 0 ? "negative" : "positive",
    },
    {
      title: "Tasks Completed",
      value: loading ? "..." : error ? "Error" : stats.completedTasks || 0,
      icon: <CheckCircle className="w-8 h-8 text-indigo-500" />,
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      change: "+5",
      changeType: "positive",
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Main Content */}
      <div className="w-full overflow-auto">
        <div className="p-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  HOD Dashboard
                </h1>
                <p className="text-gray-600 text-lg">
                  Welcome back, {userData?.email?.split("@")[0] || "HOD"}!
                  <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {userData?.department || "Department"} Department
                  </span>
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </button>
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <FileText className="w-4 h-4 mr-2" />
                  Reports
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {statsCards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {card.value}
                    </p>
                    <div className="flex items-center mt-2">
                      <span
                        className={`text-sm font-medium ${
                          card.changeType === "positive"
                            ? "text-green-600"
                            : card.changeType === "negative"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {card.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        {card.title === "Tasks Remaining" &&
                        todoStats.overdue > 0
                          ? "overdue"
                          : "this week"}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Attendance Chart */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <BarChart3 className="w-6 h-6 text-blue-500 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {filter === "students"
                      ? "Student Attendance"
                      : "Faculty Attendance"}{" "}
                    by Section
                  </h3>
                </div>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="students">Students</option>
                  <option value="faculty">Faculty</option>
                </select>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="section" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" domain={[0, 100]} fontSize={12} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Attendance"]}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="attendance"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      barSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Leave Status Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <UserCheck className="w-6 h-6 text-green-500 mr-3" />
                Leave Requests
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leaveData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {leaveData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, "Requests"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {leaveData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Trends & Todo Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Weekly Trends */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 text-purple-500 mr-3" />
                Weekly Trends
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="attendance"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                      name="Attendance %"
                    />
                    <Line
                      type="monotone"
                      dataKey="submissions"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      name="Submissions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Todo Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <ListTodo className="w-6 h-6 text-indigo-500 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    Department Todos
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={todoFilter}
                    onChange={(e) => setTodoFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <button
                    onClick={() => setShowTodoModal(true)}
                    className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </button>
                </div>
              </div>

              {/* Todo Stats - Compact */}
              <div className="grid grid-cols-5 gap-2 mb-4">
                <div className="bg-gray-50 rounded p-2 text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {todoStats.total}
                  </p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
                <div className="bg-yellow-50 rounded p-2 text-center">
                  <p className="text-lg font-bold text-yellow-600">
                    {todoStats.pending}
                  </p>
                  <p className="text-xs text-yellow-600">Pending</p>
                </div>
                <div className="bg-blue-50 rounded p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">
                    {todoStats.inProgress}
                  </p>
                  <p className="text-xs text-blue-600">Progress</p>
                </div>
                <div className="bg-green-50 rounded p-2 text-center">
                  <p className="text-lg font-bold text-green-600">
                    {todoStats.completed}
                  </p>
                  <p className="text-xs text-green-600">Done</p>
                </div>
                <div className="bg-red-50 rounded p-2 text-center">
                  <p className="text-lg font-bold text-red-600">
                    {todoStats.overdue}
                  </p>
                  <p className="text-xs text-red-600">Overdue</p>
                </div>
              </div>

              {/* Todo List - Compact */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {todos.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <ListTodo className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No todos found</p>
                  </div>
                ) : (
                  todos.slice(0, 6).map((todo) => (
                    <div
                      key={todo._id}
                      className="border border-gray-200 rounded p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {todo.title}
                            </h4>
                            <span
                              className={`px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(
                                todo.priority
                              )}`}
                            >
                              {todo.priority}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span>To: {todo.assignedTo}</span>
                            <span>
                              Due: {new Date(todo.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {todo.status !== "Completed" && (
                            <select
                              className="text-xs px-1 py-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
                              value={todo.status}
                              onChange={(e) =>
                                handleUpdateTodo(
                                  todo._id,
                                  e.target.value,
                                  e.target.value === "Completed"
                                    ? 100
                                    : todo.progress
                                )
                              }
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          )}
                          {todo.status === "Completed" && (
                            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded">
                              ✓ Done
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteTodo(todo._id)}
                            className="p-0.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {todos.length > 6 && (
                <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                  <button className="text-xs text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
                    View All {todos.length} Todos
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Todo Modal */}
          {showTodoModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Create New Todo
                  </h3>
                  <button
                    onClick={() => setShowTodoModal(false)}
                    className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newTodo.title}
                      onChange={(e) =>
                        setNewTodo({ ...newTodo, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter todo title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newTodo.description}
                      onChange={(e) =>
                        setNewTodo({ ...newTodo, description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows="3"
                      placeholder="Enter description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={newTodo.priority}
                        onChange={(e) =>
                          setNewTodo({ ...newTodo, priority: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={newTodo.category}
                        onChange={(e) =>
                          setNewTodo({ ...newTodo, category: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="Administrative">Administrative</option>
                        <option value="Academic">Academic</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Student">Student</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To *
                    </label>
                    <input
                      type="text"
                      value={newTodo.assignedTo}
                      onChange={(e) =>
                        setNewTodo({ ...newTodo, assignedTo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter employee ID or name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={newTodo.dueDate}
                      onChange={(e) =>
                        setNewTodo({ ...newTodo, dueDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowTodoModal(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTodo}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create Todo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
