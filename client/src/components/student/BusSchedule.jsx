import React, { useEffect, useState } from 'react';
import { getAllBuses } from '../../services/busServices';
import { getAllSchedules, getSchedulesByBus } from '../../services/scheduleService';
import { getCurrentUser } from '../../services/authService';
import { FaClock, FaBus, FaRoute, FaMapMarkerAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './ScheduleView.css';

const BusSchedule = () => {
  const [buses, setBuses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(getCurrentDay());
  const [selectedBus, setSelectedBus] = useState(null);
  const [expandedSchedule, setExpandedSchedule] = useState(null);
  const user = getCurrentUser();

  function getCurrentDay() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all buses
        const busesResponse = await getAllBuses();
        const allBuses = busesResponse.data?.data?.buses;
        setBuses(allBuses);
        console.log('Available buses:', allBuses);

        // If a bus is selected, fetch its schedules
        if (selectedBus) {
          const scheduleResponse = await getSchedulesByBus(selectedBus);
          const busSchedules = scheduleResponse.data.schedules;
          
          // Filter schedules for selected day
          const filteredSchedules = busSchedules
            .filter(schedule => schedule.dayOfWeek.includes(selectedDay))
            .map(schedule => ({
              ...schedule,
              departureTime: formatTime(schedule.departureTime),
              returnTime: formatTime(schedule.returnTime),
              stopTimings: schedule.stopTimings ? {
                outbound: schedule.stopTimings.outbound?.map(stop => ({
                  ...stop,
                  arrivalTime: formatTime(stop.arrivalTime),
                  departureTime: formatTime(stop.departureTime)
                })) || [],
                inbound: schedule.stopTimings.inbound?.map(stop => ({
                  ...stop,
                  arrivalTime: formatTime(stop.arrivalTime),
                  departureTime: formatTime(stop.departureTime)
                })) || []
              } : { outbound: [], inbound: [] }
            }));

          setSchedules(filteredSchedules);
        } else {
          // Fetch all schedules if no bus is selected
          const allSchedulesResponse = await getAllSchedules();
          const allSchedules = allSchedulesResponse.data.schedules;
          
          // Filter schedules for selected day
          const filteredSchedules = allSchedules
            .filter(schedule => schedule.dayOfWeek.includes(selectedDay))
            .map(schedule => ({
              ...schedule,
              departureTime: formatTime(schedule.departureTime),
              returnTime: formatTime(schedule.returnTime),
              stopTimings: schedule.stopTimings ? {
                outbound: schedule.stopTimings.outbound?.map(stop => ({
                  ...stop,
                  arrivalTime: formatTime(stop.arrivalTime),
                  departureTime: formatTime(stop.departureTime)
                })) || [],
                inbound: schedule.stopTimings.inbound?.map(stop => ({
                  ...stop,
                  arrivalTime: formatTime(stop.arrivalTime),
                  departureTime: formatTime(stop.departureTime)
                })) || []
              } : { outbound: [], inbound: [] }
            }));

          setSchedules(filteredSchedules);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to fetch schedule information');
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [selectedDay, selectedBus]);

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

  const toggleScheduleExpansion = (scheduleId) => {
    setExpandedSchedule(expandedSchedule === scheduleId ? null : scheduleId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2 text-white">
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <span className="text-gray-800 font-medium ml-2">Loading schedules...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-400 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <FaBus className="text-white text-xl" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Bus Schedules</h1>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <select 
                value={selectedBus || ''}
                onChange={(e) => setSelectedBus(e.target.value || null)}
                className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
              >
                <option value="" className="bg-gray-800 text-white">All Buses</option>
                {console.log('Available buses:', buses)}
                {buses?.map(bus => (
                  <option key={bus._id} value={bus._id} className="bg-gray-800 text-white">
                    Bus {bus.number}
                  </option>
                ))}
              </select>
              
              <select 
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                  <option key={day} value={day} className="bg-gray-800 text-white">{day}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Schedules */}
        {schedules.length > 0 ? (
          <div className="space-y-4">
            {schedules.map((schedule, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                {/* Schedule Header */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <FaBus className="text-blue-400 text-sm" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Bus</p>
                          <p className="text-white font-semibold">Bus {schedule.bus?.number || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <FaRoute className="text-green-400 text-sm" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Route</p>
                          <p className="text-white font-semibold">{schedule.route?.name || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <FaClock className="text-purple-400 text-sm" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Departure</p>
                          <p className="text-white font-semibold">{schedule.departureTime}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <FaClock className="text-orange-400 text-sm" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Return</p>
                          <p className="text-white font-semibold">{schedule.returnTime}</p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleScheduleExpansion(schedule._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition-colors duration-200"
                    >
                      <span className="text-sm">Stop Timings</span>
                      {expandedSchedule === schedule._id ? 
                        <FaChevronUp className="text-xs" /> : 
                        <FaChevronDown className="text-xs" />
                      }
                    </button>
                  </div>
                  
                  {/* Route Stops Overview */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <FaMapMarkerAlt className="text-red-400 text-sm" />
                      <p className="text-sm text-gray-300">Route Stops</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {schedule.route?.stops?.map((stop, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-gray-300"
                        >
                          {typeof stop === 'object' ? stop.name : stop}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Expandable Stop Timings */}
                {expandedSchedule === schedule._id && (
                  <div className="border-t border-white/10 bg-black/20">
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Outbound Timings */}
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            Outbound Journey (To College)
                          </h4>
                          {schedule.stopTimings?.outbound?.length > 0 ? (
                            <div className="space-y-3">
                              {schedule.stopTimings.outbound.map((stop, idx) => (
                                <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-white font-medium">{stop.stopName}</p>
                                      <p className="text-xs text-gray-400 mt-1">Stop {idx + 1}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-green-400 font-semibold text-sm">
                                        Arr: {stop.arrivalTime}
                                      </p>
                                      <p className="text-blue-400 font-semibold text-sm">
                                        Dep: {stop.departureTime}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-white/5 rounded-lg p-6 text-center">
                              <p className="text-gray-400">No detailed timings available for outbound journey</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Inbound Timings */}
                        <div>
                          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            Inbound Journey (To Home)
                          </h4>
                          {schedule.stopTimings?.inbound?.length > 0 ? (
                            <div className="space-y-3">
                              {schedule.stopTimings.inbound.map((stop, idx) => (
                                <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-white font-medium">{stop.stopName}</p>
                                      <p className="text-xs text-gray-400 mt-1">Stop {idx + 1}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-green-400 font-semibold text-sm">
                                        Arr: {stop.arrivalTime}
                                      </p>
                                      <p className="text-blue-400 font-semibold text-sm">
                                        Dep: {stop.departureTime}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-white/5 rounded-lg p-6 text-center">
                              <p className="text-gray-400">No detailed timings available for inbound journey</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBus className="text-gray-400 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Schedules Available</h3>
              <p className="text-gray-400">
                No schedules found for {selectedDay}
                {selectedBus ? ' for the selected bus' : ''}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusSchedule; 