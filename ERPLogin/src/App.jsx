import React from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ConductorDashboard from './pages/ConductorDashboard';
import UserDashboard from './pages/UserDashboard';
import BusManagement from './dashboard/admin/BusManagement';
import RouteManagement from './dashboard/admin/RouteManagement';
import ConductorManagement from './dashboard/admin/ConductorManagemet';
import DriverManagement from './dashboard/admin/DriverManagement';
import StudentManagement from './dashboard/admin/StudentManagement';
import UserManagement from './dashboard/admin/UserManagement';
import BusAssignment from './dashboard/admin/BusAssignment';
import BusMonitoring from './dashboard/admin/BusMonitoring';
import ScheduleManagement from './dashboard/admin/ScheduleManagement';
import BusDetails from './dashboard/driver/BusDetails';
import Help from './dashboard/driver/Help';
import EditRoutes from './dashboard/driver/EditRoutes';
import ProblemRise from './dashboard/driver/Problemrise';
import BusRoutes from './dashboard/driver/BusRoutes';
import { getCurrentUser } from './services/authService';
import ProblemReports from './dashboard/admin/ProblemReports';
import StudentDashboard from './pages/StudentDashboard';
import BusMonitor from './dashboard/student/BusMonitor';
import AllBuses from './dashboard/student/AllBuses';
import BusSchedule from './dashboard/student/BusSchedule';
import MyBus from './dashboard/student/MyBus';
import LocationUpdate from './dashboard/conductor/LocationUpdate';
import DailyReports from './dashboard/conductor/DailyReports';
import Dashboard from './dashboard/conductor/Dashboard';
import ConductorProfile from './dashboard/conductor/ConductorProfile';
import './App.css';
import DriverProfile from './dashboard/driver/DriverProfile';
import RoleLogin from './RoleLogin';

const PrivateRoute = ({ children, roles }) => {
  const token = localStorage.getItem('token');
  const user = getCurrentUser();
  const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');

  console.log('PrivateRoute check:', {
    roles,
    hasToken: !!token,
    hasUser: !!user,
    hasStudentData: !!studentData,
    userRole: user?.role,
    isStudentRoute: roles && roles.includes('student')
  });

  const API = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
  });

  API.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('studentData');
        window.location.href = '/';
      }
      return Promise.reject(error);
    }
  );

  // Must have a token
  if (!token) {
    console.log('PrivateRoute: No token, redirecting to login');
    return <Navigate to="/" replace />;
  }

  // For student routes specifically
  if (roles && roles.includes('student')) {
    // Accept if we have either studentData or user with student role
    if (studentData || (user && user.role === 'student')) {
      console.log('PrivateRoute: Student access granted');
      return children;
    }
    console.log('PrivateRoute: Student access denied');
    return <Navigate to="/" replace />;
  }

  // For other roles
  if (!user) {
    console.log('PrivateRoute: No user data for non-student route');
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    console.log('PrivateRoute: Role not authorized');
    return <Navigate to="/" replace />;
  }

  console.log('PrivateRoute: Access granted');
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Login />} />
        <Route path="/admin-bus/login" element={<RoleLogin />} />
        <Route
          path="/admin"
          element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<BusMonitoring />} />
          <Route path="bus-monitor" element={<BusMonitoring />} />
          <Route path="routes" element={<RouteManagement />} />
          <Route path="student-management" element={<StudentManagement />} />
          <Route path="buses" element={<BusManagement />} />
          {/* <Route path="users" element={<UserManagement />} /> */}
          <Route path="conductor-management" element={<ConductorManagement />} />
          <Route path="bus-assignments" element={<BusAssignment />} />
          <Route path="driver-management" element={<DriverManagement />} />
          <Route path="schedules" element={<ScheduleManagement />} />
          <Route path="problem-reports" element={<ProblemReports />} />
        </Route>

        <Route
          path="/dashboard/conductor"
          element={
            <PrivateRoute roles={['conductor']}>
              <ConductorDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="location-update" element={<LocationUpdate />} />
          <Route path="reports" element={<DailyReports />} />
          <Route path="daily-reports" element={<DailyReports />} />
          <Route path="profile" element={<ConductorProfile />} />
          <Route path="help" element={<Help />} />
        </Route>

        <Route
          path="/dashboard/student"
          element={
            <PrivateRoute roles={['student']}>
              <StudentDashboard />
            </PrivateRoute>
          }
        >
          <Route index element={<AllBuses />} />
          <Route path="bus-monitor" element={<BusMonitor />} />
          <Route path="all-buses" element={<AllBuses />} />
          <Route path="my-bus" element={<MyBus />} />
          <Route path="schedule" element={<BusSchedule />} />
        </Route>

        <Route
          path="/dashboard/driver"
          element={
            <PrivateRoute roles={['driver']}>
              <DriverDashboard />
            </PrivateRoute>
          }
        >
           <Route path="bus-details" element={<BusDetails />} />
          <Route path="bus-routes" element={<BusRoutes />} />
          <Route path="edit-routes" element={<EditRoutes />} />
          <Route path="profile" element={<DriverProfile />} />
          <Route path="help" element={<Help />} />
           <Route path="problem-rise" element={<ProblemRise />} />
        </Route>

        <Route
          path="/user"
          element={
            <PrivateRoute roles={['student', 'faculty']}>
              <UserDashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;