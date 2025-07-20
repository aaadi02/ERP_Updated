import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import Dashboard from '../dashboard/conductor/Dashboard';
import DailyReports from '../dashboard/conductor/DailyReports';
import LocationUpdate from '../dashboard/conductor/LocationUpdate';
import ConductorProfile from '../dashboard/conductor/ConductorProfile';
import { getCurrentUser } from '../services/authService';
import { getConductorBus } from '../services/conductorService';
import { getBusById } from '../services/busServices';
import './ConductorDashboard.css';

const ConductorDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Update active tab based on current location
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'conductor' || path === 'dashboard') {
      setActiveTab('dashboard');
    } else {
      setActiveTab(path);
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchBus = async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          setError('User not authenticated');
          return;
        }

        const response = await getConductorBus();
        setBus(response.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch bus details');
      } finally {
        setLoading(false);
      }
    };

    fetchBus();
  }, []);

  // Function to refresh bus data
  const refreshBusData = async () => {
    try {
      // If we already have bus data with an ID, fetch directly from bus API for latest data
      if (bus?._id) {
        const response = await getBusById(bus._id);
        setBus(response.data);
        return response.data;
      } else {
        // Fall back to conductor bus endpoint if no bus ID available
        const response = await getConductorBus();
        setBus(response.data);
        return response.data;
      }
    } catch (err) {
      console.error('Failed to refresh bus data:', err);
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderMainContent = () => {
    // Use React Router Outlet for nested routes, or render default dashboard
    const path = location.pathname.split('/').pop();
    
    if (path === 'conductor' || path === 'dashboard') {
      return <Dashboard bus={bus} refreshBusData={refreshBusData} />;
    }
    
    // Let React Router handle the nested routes
    return <Outlet context={{ bus, refreshBusData }} />;
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
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-green-600 to-green-700">
          <h3 className="text-white text-lg font-bold">Conductor Panel</h3>
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
              to="/dashboard/conductor/dashboard"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'dashboard' 
                  ? 'bg-green-50 text-green-600 border-r-4 border-green-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
              }`}
              onClick={() => {
                setActiveTab('dashboard');
                setIsSidebarOpen(false);
              }}
            >
              Dashboard
            </Link>
            
            <Link
              to="/dashboard/conductor/location-update"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'location-update' 
                  ? 'bg-green-50 text-green-600 border-r-4 border-green-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
              }`}
              onClick={() => {
                setActiveTab('location-update');
                setIsSidebarOpen(false);
              }}
            >
              Update Location
            </Link>
            
            <Link
              to="/dashboard/conductor/daily-reports"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'daily-reports' 
                  ? 'bg-green-50 text-green-600 border-r-4 border-green-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
              }`}
              onClick={() => {
                setActiveTab('daily-reports');
                setIsSidebarOpen(false);
              }}
            >
              Daily Reports
            </Link>
            
            <Link
              to="/dashboard/conductor/profile"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'profile' 
                  ? 'bg-green-50 text-green-600 border-r-4 border-green-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
              }`}
              onClick={() => {
                setActiveTab('profile');
                setIsSidebarOpen(false);
              }}
            >
              Profile
            </Link>
            
            <Link
              to="/dashboard/conductor/help"
              className={`block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                activeTab === 'help' 
                  ? 'bg-green-50 text-green-600 border-r-4 border-green-600' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
              }`}
              onClick={() => {
                setActiveTab('help');
                setIsSidebarOpen(false);
              }}
            >
              Help & Support
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
                College Bus Management - Conductor
              </h1>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Conductor
              </span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-6 bg-gray-50">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

export default ConductorDashboard;