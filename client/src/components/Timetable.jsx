import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Timetable = ({ department, semester, section }) => {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Color schemes for different subjects
  const subjectColors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-green-500 to-green-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
    'from-red-500 to-red-600'
  ];

  const getSubjectColor = (subject) => {
    if (!subject) return 'from-gray-400 to-gray-500';
    const hash = subject.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return subjectColors[hash % subjectColors.length];
  };

  const getCurrentTimeSlot = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    if (!timetable) return -1;
    
    return timetable.timeSlots.findIndex(slot => {
      const [start] = slot.split('-');
      return currentTimeString >= start;
    });
  };

  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        const studentData = localStorage.getItem('studentData');
        
        if (!token || !studentData) {
          setError('Please login to view your timetable');
          setLoading(false);
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`
        };

        console.log('Fetching timetable for logged-in student');
        const response = await axios.get(`${API_URL}/api/timetable`, {
          headers
        });

        console.log('Timetable response:', response.data);
        setTimetable(response.data);
      } catch (err) {
        console.error('Error fetching timetable:', err);
        if (err.response?.status === 401) {
          setError('Please login as a student to view your timetable');
        } else if (err.response?.status === 404) {
          setError('No timetable found for your department');
        } else if (err.response?.data?.error) {
          setError(err.response.data.error);
        } else {
          setError('Unable to load timetable. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, []); // Remove dependency on props since we only use logged-in student data

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <span className="ml-4 text-lg text-gray-600 animate-pulse">Loading your timetable...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Oops! Something went wrong</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!timetable) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Timetable Available</h3>
          <p className="text-gray-500">Please check back later or contact your administrator.</p>
        </div>
      </div>
    );
  }

  const currentDay = getCurrentDay();
  const currentTimeSlot = getCurrentTimeSlot();

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent animate-slide-in-left">
              Weekly Timetable
            </h1>
            <p className="text-gray-600 mt-2 animate-slide-in-left" style={{animationDelay: '0.1s'}}>
              {(() => {
                const studentData = localStorage.getItem('studentData');
                if (studentData) {
                  const student = JSON.parse(studentData);
                  return `${student.department?.name || 'N/A'} • Semester ${student.semester?.number || 'N/A'} • ${student.section || 'N/A'}`;
                }
                return `${department || 'N/A'} • Semester ${semester || 'N/A'} • Section ${section || 'N/A'}`;
              })()}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-in-right">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-3 rounded-xl shadow-soft">
              <div className="text-sm opacity-90">Current Time</div>
              <div className="text-lg font-bold">
                {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
            <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white px-6 py-3 rounded-xl shadow-soft">
              <div className="text-sm opacity-90">Today</div>
              <div className="text-lg font-bold">{currentDay}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="lg:hidden space-y-4">
        {timetable.timetableData.map((dayObj, dayIndex) => (
          <div 
            key={dayIndex} 
            className={`bg-white rounded-2xl shadow-card border-2 transition-all duration-300 animate-slide-in-up ${
              dayObj.day === currentDay ? 'border-primary-300 shadow-glow' : 'border-gray-100 hover:border-primary-200'
            }`}
            style={{animationDelay: `${dayIndex * 0.1}s`}}
          >
            <div className={`p-4 rounded-t-2xl ${
              dayObj.day === currentDay 
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white' 
                : 'bg-gray-50'
            }`}>
              <h3 className="text-lg font-bold flex items-center">
                {dayObj.day}
                {dayObj.day === currentDay && (
                  <span className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse"></span>
                )}
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              {timetable.timeSlots.map((timeSlot, slotIndex) => {
                const classObj = dayObj.classes[slotIndex];
                const isCurrentSlot = dayObj.day === currentDay && slotIndex === currentTimeSlot;
                
                return (
                  <div 
                    key={slotIndex}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      isCurrentSlot 
                        ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-300 shadow-soft' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-600">{timeSlot}</span>
                      {isCurrentSlot && (
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                          Now
                        </span>
                      )}
                    </div>
                    
                    {classObj ? (
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${getSubjectColor(classObj.subject)} text-white shadow-soft`}>
                        <div className="font-semibold text-sm mb-1">{classObj.subject}</div>
                        {classObj.type && (
                          <div className="text-xs opacity-90 mb-1">{classObj.type}</div>
                        )}
                        {classObj.faculty && (
                          <div className="text-xs opacity-80 italic">{classObj.faculty}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-400 py-2 text-sm">Free Period</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View - Enhanced Table */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden animate-slide-in-up">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-gray-200">
            <div className="grid grid-cols-8 gap-0">
              <div className="p-4 font-bold text-gray-700 bg-gradient-to-r from-primary-100 to-primary-200">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Day
                </div>
              </div>
              {timetable.timeSlots.map((slot, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 text-center font-semibold text-sm transition-all duration-300 ${
                    idx === currentTimeSlot 
                      ? 'bg-gradient-to-r from-yellow-200 to-yellow-300 text-yellow-800' 
                      : 'text-gray-700 hover:bg-primary-100'
                  }`}
                >
                  {slot}
                  {idx === currentTimeSlot && (
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mt-1 animate-pulse"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {timetable.timetableData.map((dayObj, dayIndex) => (
              <div 
                key={dayIndex}
                className={`grid grid-cols-8 gap-0 transition-all duration-300 hover:bg-gray-50 ${
                  dayObj.day === currentDay ? 'bg-gradient-to-r from-primary-25 to-secondary-25' : ''
                }`}
              >
                <div className={`p-4 font-bold flex items-center transition-all duration-300 ${
                  dayObj.day === currentDay 
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white' 
                    : 'bg-gray-50 text-gray-700 hover:bg-primary-100'
                }`}>
                  {dayObj.day}
                  {dayObj.day === currentDay && (
                    <span className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  )}
                </div>
                
                {timetable.timeSlots.map((_, slotIndex) => {
                  const classObj = dayObj.classes[slotIndex];
                  const isCurrentSlot = dayObj.day === currentDay && slotIndex === currentTimeSlot;
                  
                  return (
                    <div 
                      key={slotIndex}
                      className={`p-2 transition-all duration-300 ${
                        isCurrentSlot 
                          ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-l-4 border-yellow-400' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {classObj ? (
                        <div 
                          className={`p-3 rounded-lg bg-gradient-to-r ${getSubjectColor(classObj.subject)} text-white shadow-soft transform transition-all duration-300 hover:scale-105 hover:shadow-hover cursor-pointer`}
                          onClick={() => setSelectedDay(selectedDay === `${dayIndex}-${slotIndex}` ? null : `${dayIndex}-${slotIndex}`)}
                        >
                          <div className="font-semibold text-sm mb-1 truncate">{classObj.subject}</div>
                          {classObj.type && (
                            <div className="text-xs opacity-90 mb-1">{classObj.type}</div>
                          )}
                          {classObj.faculty && (
                            <div className="text-xs opacity-80 italic truncate">{classObj.faculty}</div>
                          )}
                          {isCurrentSlot && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center text-gray-300 py-6 text-sm">
                          <svg className="w-6 h-6 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Free
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 bg-white rounded-xl shadow-soft p-6 animate-slide-in-up" style={{animationDelay: '0.3s'}}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Legend
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gradient-to-r from-yellow-200 to-yellow-300 rounded mr-3"></div>
            <span className="text-sm text-gray-600">Current Time Slot</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded mr-3"></div>
            <span className="text-sm text-gray-600">Today</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 rounded mr-3"></div>
            <span className="text-sm text-gray-600">Free Period</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded mr-3"></div>
            <span className="text-sm text-gray-600">Class Period</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timetable;
