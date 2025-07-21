import React, { useEffect, useState } from 'react';
import { getAllBuses } from '../../services/busServices';
import { getCurrentUser } from '../../services/authService';
import { FaBus, FaUser, FaPhone, FaRoute, FaMapMarkerAlt, FaClock, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import './BusRoutes.css';

const BusMonitor = () => {
  const [busInfo, setBusInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user data - prioritize studentData for student logins
        const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        const currentUser = getCurrentUser();
        const user = studentData || currentUser;
        
        if (!user) {
          setError('User data not found');
          setLoading(false);
          return;
        }

        console.log('BusMonitor: User data:', user);
        
        // Try to get student data by ID
        const userId = user._id || user.id;
        if (!userId) {
          setError('User ID not found');
          setLoading(false);
          return;
        }

        const studentResponse = await axios.get(`http://localhost:5000/api/students/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const student = studentResponse.data;

        if (!student.routes) {
          setError('No route assigned to this student');
          setLoading(false);
          return;
        }

        const busesResponse = await getAllBuses();
        console.log('BusMonitor buses response:', busesResponse.data);
        
        // Handle the correct response structure
        let buses = [];
        if (busesResponse.data && busesResponse.data.data && busesResponse.data.data.buses) {
          buses = busesResponse.data.data.buses;
        } else if (busesResponse.data && busesResponse.data.buses) {
          buses = busesResponse.data.buses;
        } else if (Array.isArray(busesResponse.data)) {
          buses = busesResponse.data;
        }
        
        console.log('BusMonitor: Found buses:', buses.length);
        
        const assignedBus = buses.find(bus => 
          bus.route && bus.route.name === student.routes
        );

        if (assignedBus) {
          console.log('Full Bus Data:', JSON.stringify(assignedBus, null, 2));
          setBusInfo(assignedBus);
        } else {
          setError('No bus found for your assigned route');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to fetch information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 10 seconds for real-time updates
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Function to get route points based on current direction
  const getRoutePoints = () => {
    if (!busInfo?.route) return [];
    
    const basePoints = [
      { name: busInfo.route.startPoint || 'Start' },
      ...(busInfo.route.stops || []),
      { name: busInfo.route.endPoint || 'End' }
    ];

    // If current direction is 'return', reverse the route
    return busInfo.currentDirection === 'return' ? basePoints.reverse() : basePoints;
  };

  // Function to check if a stop is covered (passed)
  const isStopCovered = (stopName, index) => {
    if (!busInfo?.currentLocation) return false;
    
    const routePoints = getRoutePoints();
    const currentIndex = routePoints.findIndex(point => point.name === busInfo.currentLocation);
    
    // If current location is found, all previous stops are covered
    return currentIndex > index;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <span className="text-gray-800 font-medium ml-2">Loading your bus information...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 max-w-md mx-auto text-center">
          <FaInfoCircle className="text-red-400 text-3xl mx-auto mb-4" />
          <h3 className="text-red-400 text-lg font-semibold mb-2">Unable to Load Bus Information</h3>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Alert Message Display */}
        {busInfo?.alertMessage && busInfo?.alertType && busInfo?.alertType !== 'normal' && (
          <div className={`alert-message ${busInfo.alertType} bg-white/10 backdrop-blur-md rounded-xl border p-4 ${
            busInfo.alertType === 'delayed' ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-green-500/30 bg-green-500/10'
          }`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {busInfo.alertType === 'delayed' ? '⚠️' : '🚀'}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">
                  {busInfo.alertType === 'delayed' ? 'Service Delayed' : 'Service Early'}
                </h4>
                <p className="text-gray-200">{busInfo.alertMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bus Information Card */}
        <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl border border-white/20">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <FaBus className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Your Bus Information</h3>
                <p className="text-gray-300">Real-time updates every 10 seconds</p>
              </div>
            </div>
            
            {busInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Bus Details */}
                <div className="space-y-4">
                  <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <FaBus className="text-blue-400" />
                      <span className="text-sm font-medium text-blue-300">Bus Details</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-white">
                        <span className="text-gray-300">Number:</span> <span className="font-semibold">{busInfo.number}</span>
                      </p>
                      <p className="text-white">
                        <span className="text-gray-300">Direction:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          busInfo.currentDirection === 'departure' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {busInfo.currentDirection === 'departure' ? 'To College' : 'To Home'}
                        </span>
                      </p>
                      <p className="text-white">
                        <span className="text-gray-300">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          busInfo.status === 'on-time' ? 'bg-green-500/20 text-green-300' :
                          busInfo.status === 'delayed' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {busInfo.status ? busInfo.status.charAt(0).toUpperCase() + busInfo.status.slice(1) : 'Unknown'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Driver Information */}
                <div className="space-y-4">
                  <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <FaUser className="text-green-400" />
                      <span className="text-sm font-medium text-green-300">Driver Information</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-white">
                        <span className="text-gray-300">Name:</span> 
                        <span className="font-semibold ml-1">
                          {busInfo.driver 
                            ? `${busInfo.driver.personalInfo?.firstName || ''} ${busInfo.driver.personalInfo?.lastName || ''}`.trim() 
                            : 'Not Assigned'}
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        <FaPhone className="text-green-400 text-sm" />
                        <span className="text-white font-semibold">
                          {busInfo.driver?.personalInfo?.contactNumber || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conductor Information - Enhanced */}
                <div className="space-y-4">
                  <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/30">
                    <div className="flex items-center gap-3 mb-2">
                      <FaUser className="text-purple-400" />
                      <span className="text-sm font-medium text-purple-300">Conductor Information</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-white">
                        <span className="text-gray-300">Name:</span> 
                        <span className="font-semibold ml-1">
                          {busInfo.conductor 
                            ? `${busInfo.conductor.personalInfo?.firstName || ''} ${busInfo.conductor.personalInfo?.lastName || ''}`.trim() 
                            : 'Not Assigned'}
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        <FaPhone className="text-purple-400 text-sm" />
                        <span className="text-white font-semibold text-lg">
                          {busInfo.conductor?.personalInfo?.contactNumber || 'N/A'}
                        </span>
                      </div>
                      {busInfo.conductor?.personalInfo?.contactNumber && (
                        <a 
                          href={`tel:${busInfo.conductor.personalInfo.contactNumber}`}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/30 hover:bg-purple-500/50 rounded-lg text-purple-200 hover:text-white transition-colors duration-200 text-sm"
                        >
                          <FaPhone className="text-xs" />
                          Call Conductor
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaInfoCircle className="text-gray-400 text-3xl mx-auto mb-4" />
                <p className="text-gray-400">No bus information available.</p>
              </div>
            )}
          </div>
        </div>

        {/* Route Information Card */}
        <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl border border-white/20">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                <FaRoute className="text-white text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Route Information
                </h3>
                <p className="text-gray-300">
                  {busInfo?.currentDirection === 'departure' ? 'Journey to College' : 'Journey to Home'}
                </p>
              </div>
            </div>
            
            {busInfo?.route ? (
              <div className="space-y-6">
                {/* Route Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <FaRoute className="text-blue-400 text-sm" />
                      <span className="text-blue-300 font-medium text-sm">Route Name</span>
                    </div>
                    <p className="text-white font-semibold text-lg">{busInfo.route.name}</p>
                  </div>
                  
                  <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <FaMapMarkerAlt className="text-green-400 text-sm" />
                      <span className="text-green-300 font-medium text-sm">
                        {busInfo.currentDirection === 'departure' ? 'From' : 'To'}
                      </span>
                    </div>
                    <p className="text-white font-semibold">
                      {busInfo.currentDirection === 'departure' ? 
                        (busInfo.route.startPoint || 'N/A') : 
                        (busInfo.route.endPoint || 'N/A')
                      }
                    </p>
                  </div>
                  
                  <div className="bg-orange-500/20 rounded-lg p-4 border border-orange-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <FaMapMarkerAlt className="text-orange-400 text-sm" />
                      <span className="text-orange-300 font-medium text-sm">
                        {busInfo.currentDirection === 'departure' ? 'To' : 'From'}
                      </span>
                    </div>
                    <p className="text-white font-semibold">
                      {busInfo.currentDirection === 'departure' ? 
                        (busInfo.route.endPoint || 'N/A') : 
                        (busInfo.route.startPoint || 'N/A')
                      }
                    </p>
                  </div>
                </div>

                {/* Route Timeline */}
                <div className="route-timeline bg-black/20 rounded-lg p-6 border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FaClock className="text-blue-400" />
                    Live Journey Progress
                  </h4>
                  <div className="timeline-line"></div>
                  <div className="timeline-progress" style={{ width: '0%' }}></div>
                  <div className="flex justify-between">
                    {getRoutePoints().map((point, index) => (
                      <div key={index} className="timeline-point">
                        <div className={`timeline-node ${
                          busInfo.currentLocation === point.name ? 'current' :
                          isStopCovered(point.name, index) ? 'covered' : ''
                        }`}>
                          {busInfo.currentLocation === point.name && (
                            <div className="absolute w-4 h-4 rounded-full bg-green-500/50 animate-ping" />
                          )}
                        </div>
                        <span className="timeline-label">{point.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stops List */}
                <div className="bg-black/20 rounded-lg p-6 border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FaMapMarkerAlt className="text-green-400" />
                    Bus Stops ({busInfo.currentDirection === 'departure' ? 'College Route' : 'Home Route'})
                  </h4>
                  {busInfo.route.stops?.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(busInfo.currentDirection === 'return' ? 
                        [...busInfo.route.stops].reverse() : 
                        busInfo.route.stops
                      ).map((stop, index) => (
                        <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                              <span className="text-blue-400 font-semibold text-sm">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{stop.name}</p>
                              {stop.students && (
                                <p className="text-gray-400 text-sm">{stop.students} students</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FaInfoCircle className="text-gray-400 text-2xl mx-auto mb-2" />
                      <p className="text-gray-400">No stops information available</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FaRoute className="text-gray-400 text-3xl mx-auto mb-4" />
                <p className="text-gray-400">No route information available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusMonitor;