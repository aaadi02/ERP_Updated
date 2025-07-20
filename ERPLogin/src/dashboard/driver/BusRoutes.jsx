import React, { useState, useEffect } from 'react';
import { getRoutes } from '../../services/routeService';
import { getCurrentUser } from '../../services/authService';
import API from '../../services/api';
import './BusRoutes.css';

const BusRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [currentBus, setCurrentBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getCurrentUser();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        if (!user?._id) {
          setError('User not found');
          setLoading(false);
          return;
        }

        // Get all buses and find the one assigned to current driver
        const busResponse = await API.get('/buses');
        const buses = busResponse.data.data.buses;
        
        // Find bus assigned to current driver
        const assignedBus = buses.find(bus => 
          bus.driver && bus.driver._id === user._id
        );
        
        setCurrentBus(assignedBus);

        // Only set the assigned route (if any)
        setRoutes(assignedBus && assignedBus.route ? [assignedBus.route] : []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching routes:', err);
        setError(err.message || 'Failed to load routes and bus data');
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [user?._id]);

  const isCurrentStop = (stopName) => {
    return currentBus?.currentLocation === stopName;
  };

  const getProgressPercentage = (route) => {
    if (!route.isCurrentRoute || !currentBus?.currentLocation) return 0;
    
    const allStops = [
      route.startPoint,
      ...route.stops.map(s => s.name),
      route.endPoint
    ];
    
    const currentIndex = allStops.findIndex(stop => stop === currentBus.currentLocation);
    return currentIndex === -1 ? 0 : (currentIndex / (allStops.length - 1)) * 100;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900">
      <div className="text-white">Loading routes...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900">
      <div className="text-red-400">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 text-center drop-shadow-md">
          Bus Routes
        </h2>

        {/* Bus Status */}
        {currentBus && (
          <div className="flex justify-center mb-6">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md 
              ${currentBus.status === 'on-time' ? 'bg-green-500/20 text-green-300' : ''}
              ${currentBus.status === 'delayed' ? 'bg-yellow-500/20 text-yellow-300' : ''}
              ${currentBus.status === 'maintenance' ? 'bg-red-500/20 text-red-300' : ''}
            `}>
              Status: {currentBus.status ? currentBus.status.charAt(0).toUpperCase() + currentBus.status.slice(1) : 'Unknown'}
            </span>
          </div>
        )}

        {/* Routes List */}
        <div className="space-y-6">
          {routes?.length > 0 ? (
            routes.map((route) => {
              const routePoints = [
                { name: route.startPoint || 'Start', students: 0 },
                ...(route.stops || []),
                { name: route.endPoint || 'End', students: 0 },
              ];
              
              const progress = getProgressPercentage(route);

              return (
                <div
                  key={route._id}
                  className={`bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-4 transition-all duration-300 hover:shadow-2xl border ${
                    route.isCurrentRoute ? 'border-indigo-500' : 'border-white/20'
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-2">
                      <p className="text-base font-semibold text-white">
                        <span className="text-indigo-300">Route:</span> {route.name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-200">
                        <span className="text-indigo-300 font-medium">Start:</span>{' '}
                        {route.startPoint || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-200">
                        <span className="text-indigo-300 font-medium">End:</span>{' '}
                        {route.endPoint || 'N/A'}
                      </p>
                      {/* <p className="text-sm text-gray-200">
                        <span className="text-indigo-300 font-medium">Status:</span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                            route.status === 'Active'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {route.status || 'Unknown'}
                        </span>
                      </p> */}
                      <p className="text-sm text-gray-200">
                        <span className="text-indigo-300 font-medium">Students:</span>{' '}
                        {route.totalStudents || 0}
                      </p>
                    </div>
                  </div>

                  {/* Route Timeline with Animation */}
                  <div className="mt-4 relative">
                    <h4 className="text-sm font-semibold text-white mb-2">Route Timeline</h4>
                    <div className="relative flex items-center justify-between py-2">
                      <div 
                        className="absolute h-1 bg-indigo-500 transition-all duration-1000"
                        style={{ 
                          width: `${progress}%`,
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 0
                        }}
                      />
                      
                      {routePoints.map((point, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center relative group z-10"
                          style={{ flex: 1 }}
                        >
                          {/* Node with Animation */}
                          <div
                            className={`w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-300 group-hover:scale-125 ${
                              isCurrentStop(point.name)
                                ? 'bg-green-500'
                                : index * (100 / (routePoints.length - 1)) <= progress
                                ? 'bg-indigo-500'
                                : 'bg-gray-500'
                            }`}
                          >
                            {isCurrentStop(point.name) && (
                              <div className="absolute w-4 h-4 rounded-full bg-green-500/50 animate-ping" />
                            )}
                          </div>

                          {/* Stop Label */}
                          <span className="mt-2 text-xs text-white text-center truncate w-full">
                            {point.name}
                          </span>
                          
                          {/* Student Count */}
                          {/* <span className="text-xs text-indigo-300">
                            {point.students || 0} students
                          </span> */}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stops List */}
                  <h4 className="text-sm font-semibold text-white mt-4">Stops:</h4>
                  {route.stops?.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {route.stops.map((stop, index) => (
                        <li
                          key={index}
                          className="flex items-center p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200"
                        >
                          <span className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center mr-2 text-xs">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-200">
                            {stop.name} ({stop.students || 0} students)
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 text-sm mt-2">No stops available</p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-gray-400 text-sm text-center">No routes available</p>
          )}
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <a
            href="https://tarstech.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 font-semibold text-sm hover:text-indigo-100 transition-colors"
          >
            A TARS TECH PRODUCT
          </a>
        </div>
      </div>
    </div>
  );
};

export default BusRoutes;