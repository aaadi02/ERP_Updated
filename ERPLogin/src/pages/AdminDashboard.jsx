import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import Navbar from '../dashboard/common/Navbar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('bus-monitor');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Sync activeTab with current route
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'admin' || path === '') {
      setActiveTab('bus-monitor');
    } else {
      setActiveTab(path);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin-bus/login');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <h3 className="text-white text-lg font-bold">Admin Panel</h3>
          <button
            onClick={toggleSidebar}
            className="text-white lg:hidden"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            <Link
              to="bus-monitor"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'bus-monitor' 
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
              onClick={() => {
                setActiveTab('bus-monitor');
                setIsSidebarOpen(false);
              }}
            >
              Bus Monitor
            </Link>
            
            <Link
              to="routes"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'routes' 
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
              onClick={() => {
                setActiveTab('routes');
                setIsSidebarOpen(false);
              }}
            >
              Route Management
            </Link>
            
            <Link
              to="driver-management"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'driver-management' 
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
              onClick={() => {
                setActiveTab('driver-management');
                setIsSidebarOpen(false);
              }}
            >
              Driver Management
            </Link>
            
            <Link
              to="conductor-management"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'conductor-management' 
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
              onClick={() => {
                setActiveTab('conductor-management');
                setIsSidebarOpen(false);
              }}
            >
              Conductor Management
            </Link>
            
            <Link
              to="student-management"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'student-management' 
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
              onClick={() => {
                setActiveTab('student-management');
                setIsSidebarOpen(false);
              }}
            >
              Student Management
            </Link>
            
            <Link
              to="buses"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'buses' 
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
              onClick={() => {
                setActiveTab('buses');
                setIsSidebarOpen(false);
              }}
            >
              Bus Management
            </Link>
            
            <Link
              to="bus-assignments"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'bus-assignments' 
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
              onClick={() => {
                setActiveTab('bus-assignments');
                setIsSidebarOpen(false);
              }}
            >
              Bus Assignments
            </Link>
            
            {/* <Link
              to="users"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'users' 
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
              onClick={() => {
                setActiveTab('users');
                setIsSidebarOpen(false);
              }}
            >
              User Management
            </Link> */}
            
            <Link
              to="schedules"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'schedules' 
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
              onClick={() => {
                setActiveTab('schedules');
                setIsSidebarOpen(false);
              }}
            >
              Schedule Management
            </Link>
            
            <Link
              to="problem-reports"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'problem-reports' 
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
              }`}
              onClick={() => {
                setActiveTab('problem-reports');
                setIsSidebarOpen(false);
              }}
            >
              Problem Reports
            </Link>
          </div>
        </nav>
        
        {/* Logout Button */}
        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <FaBars size={20} />
              </button>
              <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-900">
                College Bus Management - Admin
              </h1>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Admin
              </span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6 bg-gray-50">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;