import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBus, 
  FaArrowLeft, 
  FaTrash, 
  FaInfoCircle, 
  FaUser, 
  FaPhone, 
  FaRoute, 
  FaMapMarkerAlt,
  FaClock,
  FaIdCard,
  FaCalendarAlt,
  FaPlay,
  FaPause,
  FaLocationArrow
} from 'react-icons/fa';

const MyBus = () => {
  const [myBuses, setMyBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animatingBus, setAnimatingBus] = useState(null);
  const [currentStopIndex, setCurrentStopIndex] = useState({});
  const [busLocationData, setBusLocationData] = useState({});
  const [locationLoading, setLocationLoading] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Load saved buses from localStorage
    const savedBuses = localStorage.getItem('myBuses');
    if (savedBuses) {
      try {
        const parsedBuses = JSON.parse(savedBuses);
        setMyBuses(parsedBuses);
        
        // Initialize current stop index for each bus (simulate random current location)
        const initialStops = {};
        parsedBuses.forEach(bus => {
          if (bus.route?.stops && bus.route.stops.length > 0) {
            initialStops[bus._id] = Math.floor(Math.random() * bus.route.stops.length);
          }
        });
        setCurrentStopIndex(initialStops);
      } catch (error) {
        console.error('Error parsing saved buses:', error);
        setMyBuses([]);
      }
    }
    setLoading(false);
  }, []);

  const removeBus = (busId) => {
    const updatedBuses = myBuses.filter(bus => bus._id !== busId);
    setMyBuses(updatedBuses);
    localStorage.setItem('myBuses', JSON.stringify(updatedBuses));
  };

  const clearAllBuses = () => {
    if (window.confirm('Are you sure you want to remove all buses from your list?')) {
      setMyBuses([]);
      localStorage.removeItem('myBuses');
    }
  };

  const goBackToAllBuses = () => {
    navigate('/dashboard/student');
  };

  const toggleBusAnimation = (busId) => {
    if (animatingBus === busId) {
      setAnimatingBus(null);
    } else {
      setAnimatingBus(busId);
      // Start fetching real-time location data
      fetchBusLocationData(busId);
    }
  };

  const fetchBusLocationData = async (busId) => {
    setLocationLoading(prev => ({ ...prev, [busId]: true }));
    
    try {
      // Fetch current bus location from /api/buses
      const busResponse = await fetch(`http://localhost:5000/api/buses/${busId}`);
      
      // Fetch bus schedule data from /api/schedules  
      const scheduleResponse = await fetch(`http://localhost:5000/api/schedules/bus/${busId}`);
      
      if (busResponse.ok) {
        const busData = await busResponse.json();
        let scheduleData = null;
        
        // Get schedule data if available
        if (scheduleResponse.ok) {
          scheduleData = await scheduleResponse.json();
        }
        
        // Update bus location data with real API data
        setBusLocationData(prev => ({
          ...prev,
          [busId]: {
            currentLocation: busData.currentLocation || 0,
            currentTime: new Date().toLocaleTimeString(),
            delayMinutes: busData.delayMinutes || 0,
            alertMessage: busData.alertMessage || null,
            lastUpdated: new Date(),
            status: 'active',
            scheduleData: scheduleData || null,
            nextArrivalTime: scheduleData?.nextArrivalTime || null,
            estimatedDelay: busData.estimatedDelay || 0
          }
        }));

        // Update current stop index based on real API data
        if (busData.currentLocation !== undefined) {
          setCurrentStopIndex(prev => ({
            ...prev,
            [busId]: busData.currentLocation
          }));
        }
      } else {
        // Fallback when API is not available
        console.warn('Bus API not available, using fallback data');
        setBusLocationData(prev => ({
          ...prev,
          [busId]: {
            currentLocation: currentStopIndex[busId] || 0,
            currentTime: new Date().toLocaleTimeString(),
            delayMinutes: Math.floor(Math.random() * 10),
            alertMessage: 'API connection unavailable - showing demo data',
            lastUpdated: new Date(),
            status: 'offline',
            scheduleData: null,
            nextArrivalTime: null,
            estimatedDelay: 0
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching bus data:', error);
      
      // Fallback to demo data
      setBusLocationData(prev => ({
        ...prev,
        [busId]: {
          currentLocation: currentStopIndex[busId] || 0,
          currentTime: new Date().toLocaleTimeString(),
          delayMinutes: Math.floor(Math.random() * 10),
          alertMessage: 'Unable to connect to bus tracking system',
          lastUpdated: new Date(),
          status: 'offline',
          scheduleData: null,
          nextArrivalTime: null,
          estimatedDelay: 0
        }
      }));
    } finally {
      setLocationLoading(prev => ({ ...prev, [busId]: false }));
    }
  };

  const simulateNextStop = (busId, totalStops) => {
    setCurrentStopIndex(prev => ({
      ...prev,
      [busId]: (prev[busId] + 1) % totalStops
    }));
  };

  // Auto-update real-time bus location data when animation is enabled
  useEffect(() => {
    if (animatingBus) {
      const bus = myBuses.find(b => b._id === animatingBus);
      if (bus?.route?.stops?.length > 0) {
        // Fetch initial data
        fetchBusLocationData(animatingBus);
        
        // Set up interval to fetch real-time data every 30 seconds
        const interval = setInterval(() => {
          fetchBusLocationData(animatingBus);
        }, 30000); // Fetch real data every 30 seconds instead of simulating every 2 seconds

        return () => clearInterval(interval);
      }
    }
  }, [animatingBus, myBuses]);

  if (loading) {
    return (
      <div className="text-white text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        Loading your buses...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <button
            onClick={goBackToAllBuses}
            className="flex items-center justify-center sm:justify-start px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to All Buses
          </button>
          <h2 className="text-2xl font-bold text-white text-center sm:text-left">My Buses ({myBuses.length})</h2>
        </div>
        
        {myBuses.length > 0 && (
          <button
            onClick={clearAllBuses}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Quick Stats */}
      {myBuses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 text-center">
            <FaBus className="text-blue-400 text-2xl mx-auto mb-2" />
            <p className="text-blue-300 text-sm">Total Buses</p>
            <p className="text-white text-xl font-bold">{myBuses.length}</p>
          </div>
          <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 text-center">
            <FaRoute className="text-green-400 text-2xl mx-auto mb-2" />
            <p className="text-green-300 text-sm">Active Routes</p>
            <p className="text-white text-xl font-bold">
              {myBuses.filter(bus => bus.route?.name).length}
            </p>
          </div>
          <div className="bg-purple-600/20 border border-purple-500/30 rounded-lg p-4 text-center">
            <FaCalendarAlt className="text-purple-400 text-2xl mx-auto mb-2" />
            <p className="text-purple-300 text-sm">Recently Added</p>
            <p className="text-white text-xl font-bold">
              {myBuses.filter(bus => {
                if (!bus.addedDate) return false;
                const addedDate = new Date(bus.addedDate);
                const today = new Date();
                const diffTime = Math.abs(today - addedDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays <= 7;
              }).length}
            </p>
          </div>
        </div>
      )}

      {/* Buses Grid */}
      {myBuses.length === 0 ? (
        <div className="text-center py-12">
          <FaBus className="text-6xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Buses Added Yet</h3>
          <p className="text-gray-300 mb-6">
            You haven't added any buses to your list. Go to All Buses to add some!
          </p>
          <button
            onClick={goBackToAllBuses}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Buses
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {myBuses.map((bus) => (
            <div key={bus._id} className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl border border-white/20 overflow-hidden">
              
              {/* Bus Header */}
              <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-4 sm:p-6 border-b border-white/10">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                      <FaBus className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">Bus {bus.number}</h3>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-indigo-300">Route:</span>
                        <span className="text-white bg-indigo-600/30 px-2 py-1 rounded-lg text-sm">
                          {bus.route?.name || 'Not Assigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Bus Status */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      bus.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 
                      bus.status === 'inactive' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 
                      'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                    }`}>
                      {bus.status || 'Unknown'}
                    </span>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeBus(bus._id)}
                      className="p-2 bg-red-600/80 text-white rounded-full hover:bg-red-700 transition-colors"
                      title="Remove from my buses"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bus Details */}
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Personnel Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
                      <FaUser className="inline mr-2" />
                      Personnel Information
                    </h4>
                    
                    {/* Driver Info */}
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FaUser className="text-green-400" />
                        <span className="font-semibold text-green-300">Driver</span>
                      </div>
                      {bus.driver ? (
                        <div className="space-y-2">
                          <p className="text-white">
                            <FaIdCard className="inline mr-2 text-green-400" />
                            {`${bus.driver.personalInfo?.firstName || ''} ${bus.driver.personalInfo?.lastName || ''}`.trim()}
                          </p>
                          {bus.driver.personalInfo?.contactNumber && (
                            <div className="flex items-center gap-2">
                              <FaPhone className="text-green-400" />
                              <a 
                                href={`tel:${bus.driver.personalInfo.contactNumber}`}
                                className="text-green-400 hover:text-green-300 underline font-medium"
                              >
                                {bus.driver.personalInfo.contactNumber}
                              </a>
                            </div>
                          )}
                          {bus.driver.employment?.employeeId && (
                            <p className="text-gray-300 text-sm">
                              Employee ID: {bus.driver.employment.employeeId}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400">Not Assigned</p>
                      )}
                    </div>

                    {/* Conductor Info */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FaUser className="text-blue-400" />
                        <span className="font-semibold text-blue-300">Conductor</span>
                      </div>
                      {bus.conductor ? (
                        <div className="space-y-2">
                          <p className="text-white">
                            <FaIdCard className="inline mr-2 text-blue-400" />
                            {`${bus.conductor.personalInfo?.firstName || ''} ${bus.conductor.personalInfo?.lastName || ''}`.trim()}
                          </p>
                          {bus.conductor.personalInfo?.contactNumber && (
                            <div className="flex items-center gap-2">
                              <FaPhone className="text-blue-400" />
                              <a 
                                href={`tel:${bus.conductor.personalInfo.contactNumber}`}
                                className="text-blue-400 hover:text-blue-300 underline font-medium"
                              >
                                {bus.conductor.personalInfo.contactNumber}
                              </a>
                            </div>
                          )}
                          {bus.conductor.employment?.employeeId && (
                            <p className="text-gray-300 text-sm">
                              Employee ID: {bus.conductor.employment.employeeId}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400">Not Assigned</p>
                      )}
                    </div>
                  </div>

                  {/* Route Information */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white border-b border-gray-600 pb-2">
                      <FaRoute className="inline mr-2" />
                      Route Information
                    </h4>
                    
                    {bus.route ? (
                      <div className="space-y-4">
                        {/* Route Details */}
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                          <h5 className="font-semibold text-purple-300 mb-3">Route Details</h5>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt className="text-purple-400" />
                              <span className="text-white font-medium">{bus.route.name}</span>
                            </div>
                            {bus.route.startLocation && (
                              <p className="text-gray-300 text-sm">
                                Start: {bus.route.startLocation}
                              </p>
                            )}
                            {bus.route.endLocation && (
                              <p className="text-gray-300 text-sm">
                                End: {bus.route.endLocation}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Basic Route Stops List */}
                        {bus.route.stops && bus.route.stops.length > 0 && (
                          <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-300 mb-3">
                              All Stops ({bus.route.stops.length})
                            </h5>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                              {bus.route.stops.map((stop, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <span className="w-5 h-5 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs">
                                    {index + 1}
                                  </span>
                                  <span className="text-gray-300">
                                    {typeof stop === 'object' ? stop.name : stop}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4 text-center">
                        <FaRoute className="text-gray-400 text-2xl mx-auto mb-2" />
                        <p className="text-gray-400">No route information available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Bus Route Animation Section */}
                {bus.route?.stops && bus.route.stops.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-600">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <FaBus className="text-white text-lg" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-gray-800">Live Bus Location Tracking</h4>
                            <p className="text-gray-600 text-sm">Real-time position monitoring</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleBusAnimation(bus._id)}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                            animatingBus === bus._id 
                              ? 'bg-red-600 text-white hover:bg-red-700 shadow-md' 
                              : 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                          }`}
                          disabled={locationLoading[bus._id]}
                        >
                          {locationLoading[bus._id] ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Loading...
                            </>
                          ) : animatingBus === bus._id ? (
                            <>
                              <FaPause size={14} />
                              Stop Tracking
                            </>
                          ) : (
                            <>
                              <FaPlay size={14} />
                              Start Tracking
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* Current Location Status */}
                      {animatingBus === bus._id && busLocationData[bus._id] && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                busLocationData[bus._id]?.status === 'active' ? 'bg-green-500' :
                                busLocationData[bus._id]?.status === 'simulated' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}></div>
                              <span className="text-gray-700 font-medium">
                                {busLocationData[bus._id]?.status === 'active' ? 'Live GPS Tracking' :
                                 busLocationData[bus._id]?.status === 'simulated' ? 'Demo Mode' :
                                 'Connection Lost'}
                              </span>
                            </div>
                            <span className="text-gray-500 text-sm">
                              Updated: {busLocationData[bus._id].lastUpdated?.toLocaleTimeString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-3 rounded-lg border">
                              <div className="flex items-center gap-2 mb-1">
                                <FaLocationArrow className="text-blue-600" />
                                <span className="text-gray-600 text-sm font-medium">Current Location</span>
                              </div>
                              <p className="text-gray-800 font-semibold">
                                {bus.route.stops[busLocationData[bus._id].currentLocation]?.name || 
                                 bus.route.stops[busLocationData[bus._id].currentLocation] || 
                                 'Unknown Stop'}
                              </p>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border">
                              <div className="flex items-center gap-2 mb-1">
                                <FaClock className="text-green-600" />
                                <span className="text-gray-600 text-sm font-medium">Current Time</span>
                              </div>
                              <p className="text-gray-800 font-semibold">
                                {busLocationData[bus._id].currentTime}
                              </p>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border">
                              <div className="flex items-center gap-2 mb-1">
                                <FaRoute className="text-purple-600" />
                                <span className="text-gray-600 text-sm font-medium">Next Arrival</span>
                              </div>
                              <p className="text-gray-800 font-semibold">
                                {busLocationData[bus._id].nextArrivalTime || 
                                 `${Math.floor(Math.random() * 15) + 5} min`}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Route Visualization */}
                      <div className="relative bg-gray-50 rounded-lg p-6 border">
                        <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <FaRoute className="text-blue-600" />
                          Route Progress
                        </h5>
                        
                        {/* Route Line */}
                        <div className="absolute left-10 top-20 bottom-6 w-1 bg-gray-300 rounded-full"></div>
                        
                        {/* Animated Progress Line */}
                        {animatingBus === bus._id && busLocationData[bus._id] && (
                          <div 
                            className="absolute left-10 top-20 w-1 bg-gradient-to-b from-blue-500 to-green-500 rounded-full transition-all duration-1000 ease-in-out"
                            style={{ 
                              height: `${((busLocationData[bus._id].currentLocation || 0) / (bus.route.stops.length - 1)) * (bus.route.stops.length * 80)}px`
                            }}
                          ></div>
                        )}

                        {/* Bus Stops */}
                        <div className="space-y-4 relative">
                          {bus.route.stops.map((stop, index) => {
                            const currentLocationIndex = busLocationData[bus._id]?.currentLocation || currentStopIndex[bus._id] || 0;
                            const isCurrent = currentLocationIndex === index;
                            const isPassed = currentLocationIndex > index;
                            const isNext = currentLocationIndex + 1 === index;
                            
                            return (
                              <div 
                                key={index} 
                                className={`relative flex items-center gap-4 p-4 rounded-lg border transition-all duration-500 ${
                                  isCurrent 
                                    ? 'bg-orange-100 border-orange-300 shadow-md transform scale-105' 
                                    : isPassed 
                                    ? 'bg-green-100 border-green-300'
                                    : isNext
                                    ? 'bg-blue-100 border-blue-300'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                {/* Stop Icon */}
                                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-500 ${
                                  isCurrent 
                                    ? 'bg-orange-500 text-white border-orange-600 shadow-lg' 
                                    : isPassed
                                    ? 'bg-green-500 text-white border-green-600'
                                    : isNext
                                    ? 'bg-blue-500 text-white border-blue-600'
                                    : 'bg-gray-100 text-gray-600 border-gray-300'
                                }`}>
                                  {isCurrent ? (
                                    <FaBus className="text-white" />
                                  ) : isPassed ? (
                                    <span>✓</span>
                                  ) : (
                                    <span>{index + 1}</span>
                                  )}
                                  
                                  {/* Live Location Indicator */}
                                  {isCurrent && animatingBus === bus._id && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                                    </div>
                                  )}
                                </div>

                                {/* Stop Information */}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <h6 className={`font-semibold ${
                                      isCurrent 
                                        ? 'text-orange-800' 
                                        : isPassed 
                                        ? 'text-green-800'
                                        : isNext
                                        ? 'text-blue-800'
                                        : 'text-gray-700'
                                    }`}>
                                      {typeof stop === 'object' ? stop.name : stop}
                                    </h6>
                                    
                                    {/* Status Badge */}
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      isCurrent 
                                        ? 'bg-orange-200 text-orange-800' 
                                        : isPassed
                                        ? 'bg-green-200 text-green-800'
                                        : isNext
                                        ? 'bg-blue-200 text-blue-800'
                                        : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {isCurrent ? 'Current Location' : isPassed ? 'Completed' : isNext ? 'Next Stop' : 'Upcoming'}
                                    </span>
                                  </div>
                                  
                                  {/* Timing Information */}
                                  {(isCurrent || isNext) && (
                                    <div className="flex items-center gap-4 text-sm">
                                      <div className="flex items-center gap-1">
                                        <FaClock className={`text-xs ${isCurrent ? 'text-orange-600' : 'text-blue-600'}`} />
                                        <span className={`${isCurrent ? 'text-orange-700' : 'text-blue-700'}`}>
                                          {isCurrent ? (
                                            'Currently Here'
                                          ) : (
                                            busLocationData[bus._id]?.scheduleData?.stops?.[index]?.arrivalTime ||
                                            busLocationData[bus._id]?.nextArrivalTime ||
                                            `ETA: ${Math.floor(Math.random() * 15) + 5} min`
                                          )}
                                        </span>
                                      </div>
                                      
                                      {/* Real delay indicator from API */}
                                      {isCurrent && busLocationData[bus._id]?.delayMinutes > 0 && (
                                        <div className="flex items-center gap-1">
                                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                          <span className="text-yellow-700 text-xs font-medium">
                                            {busLocationData[bus._id].delayMinutes}m behind schedule
                                          </span>
                                        </div>
                                      )}
                                      
                                      {/* Estimated delay for next stops */}
                                      {isNext && busLocationData[bus._id]?.estimatedDelay > 0 && (
                                        <div className="flex items-center gap-1">
                                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                          <span className="text-orange-700 text-xs font-medium">
                                            +{busLocationData[bus._id].estimatedDelay}m estimated
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Alert Messages */}
                      {animatingBus === bus._id && busLocationData[bus._id] && (
                        <div className="mt-4 space-y-3">
                          {/* Real-time delay alert from bus API */}
                          {busLocationData[bus._id]?.delayMinutes > 0 && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <FaClock className="text-yellow-600" />
                                <span className="text-yellow-800 font-semibold">Schedule Delay</span>
                              </div>
                              <p className="text-yellow-700">
                                Bus is currently running {busLocationData[bus._id].delayMinutes} minutes behind the scheduled time.
                                {busLocationData[bus._id].estimatedDelay > 0 && (
                                  <span className="block mt-1 text-sm">
                                    Estimated impact on next stops: +{busLocationData[bus._id].estimatedDelay} minutes
                                  </span>
                                )}
                              </p>
                            </div>
                          )}

                          {/* Service alert from bus API */}
                          {busLocationData[bus._id]?.alertMessage && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <FaInfoCircle className="text-red-600" />
                                <span className="text-red-800 font-semibold">Service Alert</span>
                              </div>
                              <p className="text-red-700">
                                {busLocationData[bus._id].alertMessage}
                              </p>
                            </div>
                          )}

                          {/* Schedule information */}
                          {busLocationData[bus._id]?.scheduleData && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <FaCalendarAlt className="text-blue-600" />
                                <span className="text-blue-800 font-semibold">Schedule Information</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                {busLocationData[bus._id].scheduleData.departureTime && (
                                  <div>
                                    <span className="text-blue-600 font-medium">Departure: </span>
                                    <span className="text-blue-700">
                                      {busLocationData[bus._id].scheduleData.departureTime}
                                    </span>
                                  </div>
                                )}
                                {busLocationData[bus._id].scheduleData.arrivalTime && (
                                  <div>
                                    <span className="text-blue-600 font-medium">Final Arrival: </span>
                                    <span className="text-blue-700">
                                      {busLocationData[bus._id].scheduleData.arrivalTime}
                                    </span>
                                  </div>
                                )}
                                {busLocationData[bus._id].nextArrivalTime && (
                                  <div className="md:col-span-2">
                                    <span className="text-blue-600 font-medium">Next Stop Arrival: </span>
                                    <span className="text-blue-700 font-semibold">
                                      {busLocationData[bus._id].nextArrivalTime}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Data Source Footer */}
                      {animatingBus === bus._id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>
                              {busLocationData[bus._id]?.status === 'active' ? 
                                '🟢 Live data from bus management system' :
                                '🔴 Offline - Using cached data'
                              }
                            </span>
                            <span>
                              {busLocationData[bus._id]?.status === 'active' ? 
                                'Updates every 30 seconds' : 
                                'Reconnecting...'
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="mt-6 pt-4 border-t border-gray-600">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="text-sm text-gray-400">
                      <FaCalendarAlt className="inline mr-1" />
                      Added: {bus.addedDate ? new Date(bus.addedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'Unknown'}
                    </div>
                    
                    <div className="flex gap-2">
                      {bus.driver?.personalInfo?.contactNumber && (
                        <a
                          href={`tel:${bus.driver.personalInfo.contactNumber}`}
                          className="px-3 py-1 bg-green-600/20 text-green-300 rounded-lg text-sm hover:bg-green-600/30 transition-colors"
                        >
                          Call Driver
                        </a>
                      )}
                      {bus.conductor?.personalInfo?.contactNumber && (
                        <a
                          href={`tel:${bus.conductor.personalInfo.contactNumber}`}
                          className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-lg text-sm hover:bg-blue-600/30 transition-colors"
                        >
                          Call Conductor
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Message */}
      {myBuses.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FaInfoCircle className="text-blue-400 mt-1" />
            <div>
              <h4 className="text-blue-300 font-semibold mb-1">Quick Tip</h4>
              <p className="text-blue-200 text-sm">
                These are your saved buses for quick access. You can call the driver or conductor directly 
                using the contact numbers provided. Remove buses you no longer need to keep your list organized.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBus;
