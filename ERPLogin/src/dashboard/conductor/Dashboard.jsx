import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../../services/authService';
import { getAllBuses } from '../../services/busServices';
import { getConductorLocationHistory } from '../../services/conductorService';
import { FaBus, FaRoute, FaMapMarkerAlt, FaUsers, FaArrowRight, FaClock, FaInfoCircle, FaChartLine } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nextStop, setNextStop] = useState(null);
  const [todayHistory, setTodayHistory] = useState([]);

  useEffect(() => {
    const fetchBusAndHistory = async () => {
      try {
        const user = getCurrentUser();
        if (!user) {
          setError('User not authenticated');
          return;
        }

        // Get all buses
        const response = await getAllBuses();
        console.log('Fetched buses:', response);
        if (!response.data || !response.data?.data?.buses) {
          throw new Error('Invalid response format');
        }

        // Find the bus assigned to this conductor
        const assignedBus = response.data?.data?.buses.find(b => 
          b.conductor && b.conductor._id === user._id
        );

        if (assignedBus) {
          setBus(assignedBus);
          localStorage.setItem('bus', JSON.stringify(assignedBus));
          
          // Calculate next stop
          calculateNextStop(assignedBus);
          
          // Fetch today's location history
          try {
            const today = new Date().toISOString().split('T')[0];
            const historyResponse = await getConductorLocationHistory(user._id, { date: today });
            setTodayHistory(historyResponse.locationHistory || []);
          } catch (historyError) {
            console.error('Error fetching history:', historyError);
          }
        } else {
          setError('No bus assigned to you');
        }
      } catch (err) {
        console.error('Error fetching bus:', err);
        setError(err.message || 'Failed to fetch bus details');
      } finally {
        setLoading(false);
      }
    };

    fetchBusAndHistory();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchBusAndHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const calculateNextStop = (busData) => {
    if (!busData.route || !busData.route.stops || !busData.currentLocation) {
      setNextStop(null);
      return;
    }

    const { route, currentLocation, currentDirection } = busData;
    const stops = route.stops || [];
    
    // Create full journey path
    let fullPath = [];
    if (currentDirection === 'departure') {
      if (route.startPoint) fullPath.push(route.startPoint);
      fullPath = fullPath.concat(stops.map(stop => stop.name));
      if (route.endPoint) fullPath.push(route.endPoint);
    } else {
      if (route.endPoint) fullPath.push(route.endPoint);
      fullPath = fullPath.concat([...stops].reverse().map(stop => stop.name));
      if (route.startPoint) fullPath.push(route.startPoint);
    }

    // Find current position and next stop
    const currentIndex = fullPath.findIndex(stop => stop === currentLocation);
    if (currentIndex !== -1 && currentIndex < fullPath.length - 1) {
      setNextStop(fullPath[currentIndex + 1]);
    } else {
      setNextStop(null);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTodayStats = () => {
    if (!todayHistory.length) return { locations: 0, lastUpdate: null, totalStudents: 0 };
    
    const totalStudents = todayHistory.reduce((sum, entry) => sum + (entry.studentCount || 0), 0);
    const uniqueLocations = new Set(todayHistory.map(entry => entry.location)).size;
    const lastUpdate = todayHistory[todayHistory.length - 1]?.timestamp;
    
    return { 
      locations: uniqueLocations, 
      lastUpdate, 
      totalStudents: Math.floor(totalStudents / Math.max(todayHistory.length, 1)) 
    };
  };

  const getDriverInfo = (driver) => {
    if (!driver) return 'Not assigned';
    const firstName = driver.personalInfo?.firstName || '';
    const lastName = driver.personalInfo?.lastName || '';
    const contactNumber = driver.personalInfo?.contactNumber || '';
    return `${firstName} ${lastName}${contactNumber ? ` (${contactNumber})` : ''}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <FaInfoCircle className="text-red-500 text-2xl mx-auto mb-2" />
        <p className="text-red-700 font-medium">Error</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <FaInfoCircle className="text-yellow-500 text-2xl mx-auto mb-2" />
        <p className="text-yellow-700 font-medium">No Bus Assigned</p>
        <p className="text-yellow-600 text-sm mt-1">Please contact admin to assign a bus.</p>
      </div>
    );
  }

  const todayStats = getTodayStats();

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FaBus className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Bus {bus.number}</h1>
              <p className="text-blue-100 text-sm lg:text-base">{bus.route?.name || 'No route assigned'}</p>
            </div>
          </div>
          
          <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-blue-100 text-sm">Current Students</p>
              <p className="text-3xl font-bold">{bus.attendanceData?.count || 0}</p>
              <p className="text-blue-100 text-xs">On Board</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <FaMapMarkerAlt className="text-green-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Current Location</p>
              <p className="font-semibold text-gray-900 truncate">{bus.currentLocation || 'Not set'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FaArrowRight className="text-blue-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Next Stop</p>
              <p className="font-semibold text-gray-900 truncate">{nextStop || 'End of route'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <FaChartLine className="text-purple-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Today's Locations</p>
              <p className="font-semibold text-gray-900">{todayStats.locations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <FaClock className="text-orange-600" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Last Update</p>
              <p className="font-semibold text-gray-900 text-sm">
                {todayStats.lastUpdate ? formatTime(todayStats.lastUpdate) : 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bus Details */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <FaBus className="text-blue-600 text-xl" />
            <h2 className="text-xl font-bold text-gray-900">Bus Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Driver</p>
                <p className="font-semibold text-gray-900">{getDriverInfo(bus.driver)}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Route</p>
                <p className="font-semibold text-gray-900">{bus.route?.name || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Current Direction</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {bus.currentDirection || bus.attendanceData?.direction || 'Not set'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Status</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  bus.status === 'active' ? 'bg-green-100 text-green-800' :
                  bus.status === 'inactive' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {bus.status || 'Unknown'}
                </span>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Capacity</p>
                <p className="font-semibold text-gray-900">{bus.capacity || 'Not specified'} students</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Registration</p>
                <p className="font-semibold text-gray-900">{bus.registrationNumber || 'Not available'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center space-x-3 mb-6">
            <FaChartLine className="text-green-600 text-xl" />
            <h2 className="text-xl font-bold text-gray-900">Today's Activity</h2>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 text-sm">Locations Visited</span>
                <span className="font-bold text-2xl text-blue-600">{todayStats.locations}</span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 text-sm">Updates Made</span>
                <span className="font-bold text-2xl text-green-600">{todayHistory.length}</span>
              </div>
            </div>
            
            {todayHistory.length > 0 && (
              <div>
                <p className="text-gray-600 text-sm mb-2">Recent Activity</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {todayHistory.slice(-3).reverse().map((entry, index) => (
                    <div key={index} className="text-xs bg-gray-50 rounded p-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{entry.location}</span>
                        <span className="text-gray-500">{formatTime(entry.timestamp)}</span>
                      </div>
                      <div className="text-gray-600">
                        Students: {entry.studentCount || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;