import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaClock, FaRoute, FaBus, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import API from '../../services/api';

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState([]);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    routeId: '',
    busId: '',
    direction: 'outbound',
    dayOfWeek: [],
    departureTime: '',
    returnTime: '',
    stopTimings: {
      outbound: [],
      inbound: []
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedulesRes, busesRes, routesRes] = await Promise.all([
        API.get('/schedules'),
        API.get('/buses'),
        API.get('/routes')
      ]);

      // Handle different response structures with better fallback
      const schedulesData = schedulesRes.data?.data?.schedules || schedulesRes.data?.data || schedulesRes.data || [];
      const busesData = busesRes.data?.data?.buses || busesRes.data?.buses || busesRes.data?.data || busesRes.data || [];
      const routesData = routesRes.data?.routes || routesRes.data?.data || routesRes.data || [];
      console.log(schedulesData)
      // Ensure all data are arrays
      const safeSchedulesData = Array.isArray(schedulesData) ? schedulesData : [];
      const safeBusesData = Array.isArray(busesData) ? busesData : [];
      const safeRoutesData = Array.isArray(routesData) ? routesData : [];

      console.log('Fetched data:', { 
        schedules: safeSchedulesData.length, 
        buses: safeBusesData.length, 
        routes: safeRoutesData.length 
      });

      setSchedules(safeSchedulesData);
      setBuses(safeBusesData);
      setRoutes(safeRoutesData);
    } catch (err) {
      console.error('Fetch data error:', err);
      setError('Failed to fetch data');
      // Set empty arrays as fallback
      setSchedules([]);
      setBuses([]);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeDifference = (startTime, endTime) => {
    const start = new Date(`1970/01/01 ${startTime}`);
    const end = new Date(`1970/01/01 ${endTime}`);
    return (end - start) / (1000 * 60); // Return difference in minutes
  };

  const addMinutesToTime = (time, minutes) => {
    const date = new Date(`1970/01/01 ${time}`);
    date.setMinutes(date.getMinutes() + minutes);
    return date.toTimeString().slice(0, 5);
  };

  // Convert 24-hour to 12-hour format
  const convertTo12Hour = (time24) => {
    if (!time24) return { time: '', period: 'AM' };
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return { time: `${hour12.toString().padStart(2, '0')}:${minutes}`, period };
  };

  // Convert 12-hour to 24-hour format
  const convertTo24Hour = (time12, period) => {
    if (!time12) return '';
    const [hours, minutes] = time12.split(':');
    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  // Get selected route details
  const getSelectedRoute = () => {
    return routes.find(r => r._id === formData.routeId);
  };

  // Auto-fill inbound timings based on outbound intervals (reverse order)
  const autoFillInboundTimings = () => {
    if (!formData.returnTime || formData.stopTimings.outbound.length === 0) return;

    const outboundStops = formData.stopTimings.outbound.filter(stop => stop.arrivalTime && stop.departureTime);
    
    if (outboundStops.length === 0) return;

    // Calculate intervals between consecutive outbound stops
    const intervals = [];
    for (let i = 1; i < outboundStops.length; i++) {
      const prevDeparture = outboundStops[i-1].departureTime;
      const currentArrival = outboundStops[i].arrivalTime;
      const interval = calculateTimeDifference(prevDeparture, currentArrival);
      intervals.push(interval);
    }

    // Reverse the outbound stops for inbound journey
    const reversedStops = [...formData.stopTimings.inbound];
    let currentTime = formData.returnTime;

    // Reverse the intervals as well
    const reversedIntervals = [...intervals].reverse();

    const updatedInbound = reversedStops.map((stop, index) => {
      const timing = {
        ...stop,
        arrivalTime: currentTime,
        departureTime: addMinutesToTime(currentTime, 2) // 2 minutes stop time
      };
      
      // Move to next stop using the reversed interval
      if (index < reversedIntervals.length) {
        currentTime = addMinutesToTime(currentTime, reversedIntervals[index] || 5);
      }
      
      return timing;
    });

    setFormData(prev => ({
      ...prev,
      stopTimings: {
        ...prev.stopTimings,
        inbound: updatedInbound
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      console.log('🚀 Starting schedule submission...');
      console.log('📋 Form data:', formData);

      if (!formData.dayOfWeek.length) {
        setError('Please select at least one operating day');
        return;
      }

      const scheduleData = {
        ...formData,
        stopTimings: {
          outbound: formData.stopTimings.outbound.map(stop => ({
            ...stop,
            arrivalTime: stop.arrivalTime || formData.departureTime,
            departureTime: stop.departureTime || stop.arrivalTime
          })),
          inbound: formData.stopTimings.inbound.map(stop => ({
            ...stop,
            arrivalTime: stop.arrivalTime || formData.returnTime,
            departureTime: stop.departureTime || stop.arrivalTime
          }))
        }
      };

      console.log('📤 Sending schedule data:', scheduleData);

      if (currentSchedule) {
        console.log('🔄 Updating existing schedule...');
        const response = await API.patch(`/schedules/${currentSchedule._id}`, scheduleData);
        console.log('✅ Update response:', response.data);
        setSuccess('Schedule updated successfully');
      } else {
        console.log('➕ Creating new schedule...');
        const response = await API.post('/schedules', scheduleData);
        console.log('✅ Create response:', response.data);
        setSuccess('Schedule created successfully');
      }
      
      console.log('🔄 Refreshing data...');
      fetchData();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('❌ Schedule submission error:', err);
      console.error('📋 Error response:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'Failed to save schedule');
    }
  };

  const handleDaySelect = (day) => {
    setFormData(prev => ({
      ...prev,
      dayOfWeek: prev.dayOfWeek.includes(day)
        ? prev.dayOfWeek.filter(d => d !== day)
        : [...prev.dayOfWeek, day]
    }));
  };

  const handleRouteSelect = (e) => {
    const route = routes.find(r => r._id === e.target.value);
    console.log('🛣️ Selected route:', route);
    
    if (route) {
      // Create complete stop list including start and end points
      const allStops = [
        { name: route.startPoint, sequence: 0 },
        ...(route.stops || []),
        { name: route.endPoint, sequence: (route.stops?.length || 0) + 1 }
      ];

      console.log('📍 All stops for route:', allStops);

      const newFormData = {
        ...formData,
        routeId: e.target.value,
        stopTimings: {
          outbound: allStops.map(stop => ({
            stopName: stop.name,
            arrivalTime: '',
            departureTime: ''
          })),
          inbound: [...allStops].reverse().map(stop => ({
            stopName: stop.name,
            arrivalTime: '',
            departureTime: ''
          }))
        }
      };

      console.log('📋 Updated form data with stop timings:', newFormData);
      setFormData(newFormData);
    }
  };

  const handleStopTimingChange = (direction, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      stopTimings: {
        ...prev.stopTimings,
        [direction]: prev.stopTimings[direction].map((stop, i) => 
          i === index 
            ? { ...stop, [field]: value }
            : stop
        )
      }
    }));
  };

  const resetForm = () => {
    setFormData({
      routeId: '',
      busId: '',
      direction: 'outbound',
      dayOfWeek: [],
      departureTime: '',
      returnTime: '',
      stopTimings: {
        outbound: [],
        inbound: []
      }
    });
    setCurrentSchedule(null);
    setError('');
    setSuccess('');
  };

  const handleEdit = (schedule) => {
    setCurrentSchedule(schedule);
    setFormData({
      routeId: schedule.route?._id || '',
      busId: schedule.bus?._id || '',
      direction: schedule.direction || 'outbound',
      dayOfWeek: schedule.dayOfWeek || [],
      departureTime: schedule.departureTime || '',
      returnTime: schedule.returnTime || '',
      stopTimings: schedule.stopTimings || {
        outbound: [],
        inbound: []
      }
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await API.delete(`/schedules/${id}`);
      setSchedules(schedules.filter(schedule => schedule._id !== id));
      setSuccess('Schedule deleted successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete schedule');
    }
  };

  const formatTime = (time) => {
    try {
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (err) {
      return time;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-5 h-5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-5 h-5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-gray-700 font-medium">Loading schedules...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                <FaClock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Schedule Management
                </h2>
                <p className="text-gray-700 mt-1">Manage bus schedules and timings</p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
            >
              <FaPlus className="w-4 h-4" />
              Add New Schedule
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="text-green-400 mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {(schedules || []).length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-300 mb-6">
                <FaClock className="w-20 h-20 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No schedules available</h3>
              <p className="text-gray-700 mb-6">Get started by creating your first bus schedule.</p>
              <button
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
              >
                <FaPlus className="w-4 h-4" />
                Create First Schedule
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaRoute className="text-purple-600" />
                        Route
                      </div>
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaBus className="text-blue-600" />
                        Bus
                      </div>
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaClock className="text-green-600" />
                        Departure
                      </div>
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaClock className="text-orange-600" />
                        Return
                      </div>
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-indigo-600" />
                        Days
                      </div>
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(schedules || []).map((schedule, index) => (
                    <tr key={schedule._id || index} className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 group">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full"></div>
                          <span className="text-sm font-semibold text-gray-900">
                            {schedule.route?.name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Bus {schedule.bus?.number || 'N/A'}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {formatTime(schedule.departureTime)}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {formatTime(schedule.returnTime)}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-wrap gap-1">
                          {schedule.dayOfWeek?.map((day, dayIndex) => (
                            <span key={dayIndex} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                              {day.substring(0, 3)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex space-x-2">
                          <button
                            className="p-3 text-purple-600 hover:text-white hover:bg-purple-600 bg-purple-50 rounded-xl transition-all duration-200 group-hover:shadow-md transform hover:scale-105"
                            onClick={() => handleEdit(schedule)}
                            title="Edit schedule"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-3 text-red-600 hover:text-white hover:bg-red-600 bg-red-50 rounded-xl transition-all duration-200 group-hover:shadow-md transform hover:scale-105"
                            onClick={() => handleDelete(schedule._id)}
                            title="Delete schedule"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal - Simplified for now */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                      <FaClock className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {currentSchedule ? 'Edit Schedule' : 'Add New Schedule'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {error && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-red-400 mr-3">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-red-800 font-medium">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Route Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <FaRoute className="text-purple-600" />
                          Route *
                        </div>
                      </label>
                      <select
                        value={formData.routeId}
                        onChange={handleRouteSelect}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                      >
                        <option value="">Select Route</option>
                        {(routes || []).map(route => (
                          <option key={route._id} value={route._id}>
                            {route.name} ({route.startPoint} → {route.endPoint})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bus Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <FaBus className="text-blue-600" />
                          Bus *
                        </div>
                      </label>
                      <select
                        value={formData.busId}
                        onChange={(e) => setFormData({...formData, busId: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                      >
                        <option value="">Select Bus</option>
                        {(buses || []).map(bus => (
                          <option key={bus._id} value={bus._id}>
                            Bus {bus.number} - {bus.registrationNumber}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Departure Time */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <FaClock className="text-green-600" />
                          Departure Time *
                        </div>
                      </label>
                      <input
                        type="time"
                        value={formData.departureTime}
                        onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                      />
                    </div>

                    {/* Return Time */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <FaClock className="text-orange-600" />
                          Return Time *
                        </div>
                      </label>
                      <input
                        type="time"
                        value={formData.returnTime}
                        onChange={(e) => setFormData({...formData, returnTime: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>

                  {/* Days of Week */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-indigo-600" />
                        Operating Days *
                      </div>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDaySelect(day)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            formData.dayOfWeek.includes(day)
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stop Timings Section */}
                  {formData.routeId && formData.stopTimings.outbound.length > 0 && (
                    <div className="space-y-6">
                      {/* Outbound Stop Timings */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-semibold text-gray-700">
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt className="text-green-600" />
                              Outbound Stop Timings
                            </div>
                          </label>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          {formData.stopTimings.outbound.map((stop, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                              <div className="font-medium text-gray-900 flex items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                {stop.stopName}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Arrival Time</label>
                                <input
                                  type="time"
                                  value={stop.arrivalTime}
                                  onChange={(e) => handleStopTimingChange('outbound', index, 'arrivalTime', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Departure Time</label>
                                <input
                                  type="time"
                                  value={stop.departureTime}
                                  onChange={(e) => handleStopTimingChange('outbound', index, 'departureTime', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Inbound Stop Timings */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <label className="block text-sm font-semibold text-gray-700">
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt className="text-orange-600" />
                              Inbound Stop Timings
                            </div>
                          </label>
                          <button
                            type="button"
                            onClick={autoFillInboundTimings}
                            className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition-colors"
                          >
                            Auto-fill from Return Time
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          {formData.stopTimings.inbound.map((stop, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                              <div className="font-medium text-gray-900 flex items-center">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                                {stop.stopName}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Arrival Time</label>
                                <input
                                  type="time"
                                  value={stop.arrivalTime}
                                  onChange={(e) => handleStopTimingChange('inbound', index, 'arrivalTime', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Departure Time</label>
                                <input
                                  type="time"
                                  value={stop.departureTime}
                                  onChange={(e) => handleStopTimingChange('inbound', index, 'departureTime', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-medium border border-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {currentSchedule ? 'Update Schedule' : 'Create Schedule'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleManagement;
