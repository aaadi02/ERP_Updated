import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaSignOutAlt, FaInfoCircle } from 'react-icons/fa';
import { getCurrentUser, getToken } from '../services/authService';
import { getAllBuses } from '../services/busServices';
import axios from 'axios';

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [busInfo, setBusInfo] = useState(null);
  const [allBuses, setAllBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch all buses
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const token = getToken();
        if (!token) {
          return;
        }

        console.log('Fetching buses from API...');
        const response = await getAllBuses();
        console.log('Buses response:', response.data);
        
        if (response.data && response.data.data && response.data.data.buses) {
          setAllBuses(response.data.data.buses);
        } else if (response.data && response.data.buses) {
          setAllBuses(response.data.buses);
        } else if (Array.isArray(response.data)) {
          setAllBuses(response.data);
        } else {
          console.log('No buses found in response');
          setAllBuses([]);
        }
      } catch (err) {
        console.error('Error fetching buses:', err);
        // Don't redirect on bus fetch error, just log it
        setError('Failed to fetch bus information (API might not be available)');
        setAllBuses([]);
      }
    };

    if (user) {
      fetchBuses();
      // Refresh buses every 30 seconds
      const interval = setInterval(fetchBuses, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
    const token = getToken();
    
    console.log('Auth check:', { currentUser, studentData, token: !!token });
    
    // Check for authentication - token is required
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/');
      return;
    }
    
    // For student login, prioritize studentData
    if (studentData) {
      console.log('Setting user data from studentData:', studentData);
      setUser(studentData);
      setLoading(false); // Set loading to false when user is found
      return;
    }
    
    // Check for regular user with student role
    if (currentUser && currentUser.role === 'student') {
      console.log('Setting user data from currentUser:', currentUser);
      setUser(currentUser);
      setLoading(false); // Set loading to false when user is found
      return;
    }
    
    // If we reach here, no valid user data found
    console.log('No valid user data found, redirecting to login');
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log('User data available:', user);
        
        // Try to fetch additional student data if we have an ID
        if (user._id || user.id) {
          try {
            const studentId = user._id || user.id;
            const studentResponse = await axios.get(`http://localhost:5000/api/students/${studentId}`, {
              headers: {
                'Authorization': `Bearer ${getToken()}`
              }
            });
            
            if (studentResponse.data) {
              console.log('Additional student data:', studentResponse.data);
              setStudentData(studentResponse.data);
              
              // Check for assigned route
              if (studentResponse.data.routes || studentResponse.data.route) {
                const assignedRoute = studentResponse.data.routes || studentResponse.data.route;
                console.log('Student assigned route:', assignedRoute);
                
                // Find bus for this route
                const assignedBus = allBuses.find(bus => {
                  return bus.route && (bus.route.name === assignedRoute || bus.route === assignedRoute);
                });
                
                if (assignedBus) {
                  setBusInfo(assignedBus);
                  console.log('Found assigned bus:', assignedBus);
                } else {
                  console.log('No bus found for route:', assignedRoute);
                }
              }
            }
          } catch (err) {
            console.log('Could not fetch additional student data:', err.message);
            // This is okay, we can still use the basic user data
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('Failed to fetch student information');
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, allBuses]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('studentData');
    navigate('/');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!user) {
    console.log('No user data, showing loading...');
    return <div className="flex justify-center items-center h-screen text-white">Loading...</div>;
  }
  
  console.log('Student Dashboard rendering with user:', user);
  // Temporarily commented out to allow all students access
  // if (!user.busService) return <div className="flex justify-center items-center h-screen text-red-400">You are not eligible for bus service.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Top Navigation Bar */}
      <div className="bg-white/10 backdrop-blur-md shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="text-white hover:text-indigo-300 lg:hidden mr-4"
              >
                <FaBars size={20} />
              </button>
              <h1 className="text-white text-xl font-bold">
                College Bus Management
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <NavLink
                to="/dashboard/student"
                end
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-200 hover:bg-white/20'
                  }`
                }
              >
                All Buses
              </NavLink>
              <NavLink
                to="/dashboard/student/my-bus"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-200 hover:bg-white/20'
                  }`
                }
              >
                My Buses
              </NavLink>
              <NavLink
                to="/dashboard/student/schedule"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-200 hover:bg-white/20'
                  }`
                }
              >
                Schedule
              </NavLink>
              
              <div className="flex items-center space-x-4">
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Student
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                >
                  <FaSignOutAlt className="mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/10 backdrop-blur-md shadow-lg transform transition-transform duration-200 ease-in-out lg:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/20">
          <h3 className="text-white text-lg font-bold">Student Menu</h3>
          <button
            onClick={toggleSidebar}
            className="text-white"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            <NavLink
              to="/dashboard/student"
              end
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-200 hover:bg-white/20'
                }`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              All Buses
            </NavLink>
            
            <NavLink
              to="/dashboard/student/my-bus"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-200 hover:bg-white/20'
                }`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              My Buses
            </NavLink>
            
            <NavLink
              to="/dashboard/student/bus-monitor"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-200 hover:bg-white/20'
                }`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              Bus Monitor
            </NavLink>
            
            <NavLink
              to="/dashboard/student/schedule"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-200 hover:bg-white/20'
                }`
              }
              onClick={() => setIsSidebarOpen(false)}
            >
              Schedule
            </NavLink>
          </div>
        </nav>
        
        {/* Mobile Logout Button */}
        <div className="absolute bottom-0 w-full p-4">
          <div className="mb-4">
            <span className="block bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-medium text-center">
              Student
            </span>
          </div>
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
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 text-center drop-shadow-md">
            Welcome, {user?.name || user?.firstName || 'Student'}
          </h2>

          {/* Page Content */}
          <div className="mt-6">
            {loading ? (
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
                <p>Loading student information...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-400 bg-red-900/20 p-6 rounded-lg">
                <FaInfoCircle className="mx-auto mb-4" size={48} />
                <p>{error}</p>
              </div>
            ) : (
              <>
                {/* Student Info Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-bold text-white mb-4">Student Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white">
                    <div>
                      <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
                      <p><strong>Student ID:</strong> {user?.studentId}</p>
                    </div>
                    <div>
                      <p><strong>Email:</strong> {user?.email}</p>
                      <p><strong>Department:</strong> {user?.department?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <Outlet />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;