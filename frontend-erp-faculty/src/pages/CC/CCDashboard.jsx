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
  AreaChart,
  Area,
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
  BookOpen,
  ClipboardList,
  Target,
  Star,
  Activity,
  Filter,
  Download,
  Eye,
  Plus,
  Settings,
  RefreshCw,
  Trash2,
  Edit,
  Save,
  X,
  ListTodo,
} from "lucide-react";

// Sample data for CC Dashboard
const courseData = [
  { course: "CS101", enrolled: 45, attendance: 92, assignments: 15, completed: 12 },
  { course: "CS201", enrolled: 38, attendance: 88, assignments: 18, completed: 16 },
  { course: "CS301", enrolled: 42, attendance: 95, assignments: 12, completed: 11 },
  { course: "CS401", enrolled: 35, attendance: 85, assignments: 20, completed: 17 },
];

const attendanceTrends = [
  { week: 'Week 1', CS101: 88, CS201: 92, CS301: 85, CS401: 90 },
  { week: 'Week 2', CS101: 92, CS201: 88, CS301: 93, CS401: 87 },
  { week: 'Week 3', CS101: 85, CS301: 90, CS201: 94, CS401: 89 },
  { week: 'Week 4', CS101: 95, CS201: 89, CS301: 88, CS401: 92 },
];

const assignmentStats = [
  { name: 'Submitted', value: 68, color: '#10B981' },
  { name: 'Pending', value: 15, color: '#F59E0B' },
  { name: 'Late', value: 8, color: '#EF4444' },
  { name: 'Missing', value: 9, color: '#6B7280' },
];

const performanceData = [
  { subject: 'Theory', avg: 85, sections: [88, 82, 87, 84] },
  { subject: 'Lab', avg: 92, sections: [94, 89, 93, 91] },
  { subject: 'Project', avg: 78, sections: [82, 75, 80, 76] },
  { subject: 'Assignments', avg: 88, sections: [90, 86, 89, 87] },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function CCDashboard() {
  const [filter, setFilter] = useState("overview");
  const [timeRange, setTimeRange] = useState("week");
  const [stats, setStats] = useState({
    totalCourses: 4,
    totalStudents: 160,
    averageAttendance: 90,
    pendingAssignments: 32,
    activeProjects: 8,
    completionRate: 85,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [facultySubjects, setFacultySubjects] = useState([]);
  
  // Todo List State
  const [todos, setTodos] = useState([
    { id: 1, text: "Review CS101 assignments", completed: false, priority: "high", dueDate: "2025-07-10", category: "assignments" },
    { id: 2, text: "Update course materials for CS201", completed: false, priority: "medium", dueDate: "2025-07-12", category: "materials" },
    { id: 3, text: "Prepare midterm exam questions", completed: true, priority: "high", dueDate: "2025-07-09", category: "exams" },
    { id: 4, text: "Meet with struggling students", completed: false, priority: "low", dueDate: "2025-07-15", category: "meetings" },
    { id: 5, text: "Submit semester planning report", completed: false, priority: "high", dueDate: "2025-07-11", category: "reports" },
  ]);
  const [newTodo, setNewTodo] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState("medium");
  const [newTodoDueDate, setNewTodoDueDate] = useState("");
  const [newTodoCategory, setNewTodoCategory] = useState("assignments");
  const [editingTodo, setEditingTodo] = useState(null);
  const [editText, setEditText] = useState("");
  const [todoFilter, setTodoFilter] = useState("all");

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    // Fetch user data and faculty subjects
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          console.log("No auth token found, skipping data fetch");
          return;
        }

        // Fetch user profile
        const profileResponse = await fetch("/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          setUserData(data);
          
          // Fetch faculty subjects using employeeId
          if (data.employeeId) {
            await fetchFacultySubjects(data.employeeId, token);
          }
        } else if (profileResponse.status === 401) {
          console.log("Token expired or invalid, user will need to login again");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
        } else {
          console.error("Failed to fetch profile:", profileResponse.status, profileResponse.statusText);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    return () => clearTimeout(timer);
  }, []);

  const fetchFacultySubjects = async (employeeId, token) => {
    try {
      const response = await fetch(`/api/faculty/subjects/${employeeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFacultySubjects(data.data || []);
          // Update stats with actual subject count
          setStats(prevStats => ({
            ...prevStats,
            totalCourses: data.data?.length || 0,
          }));
        }
      } else {
        console.error("Failed to fetch faculty subjects:", response.status);
      }
    } catch (error) {
      console.error("Error fetching faculty subjects:", error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, description }) => (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {description && (
            <p className="text-gray-500 text-xs">{description}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp size={16} className={trend < 0 ? 'rotate-180' : ''} />
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={28} className="text-white" />
        </div>
      </div>
    </div>
  );



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-8 mb-6 border border-gray-200/50">
              <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Todo List Functions
  const addTodo = () => {
    if (newTodo.trim()) {
      const todo = {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        priority: newTodoPriority,
        dueDate: newTodoDueDate,
        category: newTodoCategory,
        createdAt: new Date().toISOString(),
      };
      setTodos([...todos, todo]);
      setNewTodo("");
      setNewTodoPriority("medium");
      setNewTodoDueDate("");
      setNewTodoCategory("assignments");
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const startEditTodo = (todo) => {
    setEditingTodo(todo.id);
    setEditText(todo.text);
  };

  const saveEditTodo = () => {
    setTodos(todos.map(todo => 
      todo.id === editingTodo ? { ...todo, text: editText.trim() } : todo
    ));
    setEditingTodo(null);
    setEditText("");
  };

  const filteredTodos = todos.filter(todo => {
    if (todoFilter === "completed") return todo.completed;
    if (todoFilter === "pending") return !todo.completed;
    if (todoFilter === "high") return todo.priority === "high";
    return true;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Calculate estimated total students (since we don't have exact enrollment data)
  const getTotalStudentsEstimate = () => {
    // Each subject can have different year/section combinations
    // For now, we'll estimate based on unique year-section combinations
    const uniqueYearSections = new Set();
    facultySubjects.forEach(subject => {
      uniqueYearSections.add(`${subject.year}-${subject.section}`);
    });
    // Estimate 40-50 students per unique year-section
    return uniqueYearSections.size * 45;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                🎯 Course Coordinator Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Welcome back, {userData?.name || 'Course Coordinator'}! Manage your courses and track student progress.
              </p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 bg-white/80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="semester">This Semester</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard
            title="Total Courses"
            value={facultySubjects.length}
            icon={BookOpen}
            color="bg-gradient-to-r from-blue-500 to-blue-600"
            trend={5}
            description="Subjects teaching"
          />
          <StatCard
            title="Total Students"
            value={getTotalStudentsEstimate()}
            icon={Users}
            color="bg-gradient-to-r from-green-500 to-green-600"
            trend={8}
            description="Across all subjects"
          />
          <StatCard
            title="Avg Attendance"
            value={`${stats.averageAttendance}%`}
            icon={UserCheck}
            color="bg-gradient-to-r from-purple-500 to-purple-600"
            trend={3}
            description="Across all courses"
          />
          <StatCard
            title="Pending Tasks"
            value={todos.filter(t => !t.completed).length}
            icon={ClipboardList}
            color="bg-gradient-to-r from-orange-500 to-orange-600"
            trend={-12}
            description="Todo items remaining"
          />
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={Target}
            color="bg-gradient-to-r from-cyan-500 to-cyan-600"
            trend={15}
            description="Ongoing projects"
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            icon={Award}
            color="bg-gradient-to-r from-pink-500 to-pink-600"
            trend={7}
            description="Overall progress"
          />
        </div>

        {/* Faculty Todo List Section */}
        <div id="todo-section" className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ListTodo className="h-6 w-6 text-indigo-600" />
              📝 Faculty Todo List
            </h2>
            <div className="flex gap-2">
              <select
                value={todoFilter}
                onChange={(e) => setTodoFilter(e.target.value)}
                className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>

          {/* Add New Todo */}
          <div className="bg-gray-50/50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Enter new task..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newTodoPriority}
                onChange={(e) => setNewTodoPriority(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input
                type="date"
                value={newTodoDueDate}
                onChange={(e) => setNewTodoDueDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={addTodo}
                disabled={!newTodo.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Plus size={16} />
                Add Task
              </button>
            </div>
          </div>

          {/* Todo List */}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ListTodo size={48} className="mx-auto mb-2 opacity-50" />
                <p>No tasks found. Add your first task above!</p>
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 ${
                    todo.completed 
                      ? 'bg-green-50/50 border-green-200 opacity-75' 
                      : 'bg-white border-gray-200 hover:shadow-md'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  
                  <div className="flex-1">
                    {editingTodo === todo.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onKeyPress={(e) => e.key === 'Enter' && saveEditTodo()}
                        />
                        <button
                          onClick={saveEditTodo}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={() => setEditingTodo(null)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {todo.text}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full border ${getPriorityColor(todo.priority)}`}>
                            {todo.priority} priority
                          </span>
                          {todo.dueDate && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(todo.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {editingTodo !== todo.id && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditTodo(todo)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Todo Stats */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-indigo-600">{todos.filter(t => !t.completed).length}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{todos.filter(t => t.completed).length}</p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{todos.filter(t => t.priority === 'high' && !t.completed).length}</p>
                <p className="text-sm text-gray-600">High Priority</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Attendance Trends Chart */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📈 Attendance Trends
              </h2>
              <div className="flex gap-2">
                {['CS101', 'CS201', 'CS301', 'CS401'].map((course, index) => (
                  <div key={course} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index] }}></div>
                    <span className="text-sm text-gray-600">{course}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Data Points: {attendanceTrends?.length || 0} weeks
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 12 }} 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={{ stroke: '#e5e7eb' }}
                  domain={[70, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="CS101" 
                  stroke={COLORS[0]} 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: COLORS[0] }}
                  activeDot={{ r: 6, fill: COLORS[0] }}
                />
                <Line 
                  type="monotone" 
                  dataKey="CS201" 
                  stroke={COLORS[1]} 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: COLORS[1] }}
                  activeDot={{ r: 6, fill: COLORS[1] }}
                />
                <Line 
                  type="monotone" 
                  dataKey="CS301" 
                  stroke={COLORS[2]} 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: COLORS[2] }}
                  activeDot={{ r: 6, fill: COLORS[2] }}
                />
                <Line 
                  type="monotone" 
                  dataKey="CS401" 
                  stroke={COLORS[3]} 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: COLORS[3] }}
                  activeDot={{ r: 6, fill: COLORS[3] }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Assignment Status */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                📝 Assignment Status
              </h2>
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <Eye size={16} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assignmentStats}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {assignmentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
