import { useState, useEffect } from 'react';
import { Calendar, Clock, Filter, Search, ChevronLeft, ChevronRight, AlertCircle, Plus, X, Save } from 'lucide-react';

export default function FacultySchedule() {
  // State for schedule data
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
  
  const [selectedDay, setSelectedDay] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  
  // Add Class Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClass, setNewClass] = useState({
    course: "",
    room: "",
    day: "Monday",
    startTime: "09:00",
    endTime: "10:30",
    color: "#4f46e5"
  });
  const [addSuccess, setAddSuccess] = useState(false);
  
  // Available colors for classes
  const classColors = [
    "#4f46e5", "#0ea5e9", "#f59e0b", "#10b981", 
    "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e"
  ];
  
  // Calculate the current week dates
  const getCurrentWeekDates = (weekOffset = 0) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
    
    // Adjust to get Monday of current week
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + (weekOffset * 7));
    
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    
    const formatDate = (date) => {
      return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
    };
    
    return `${formatDate(monday)} - ${formatDate(saturday)}, ${monday.getFullYear()}`;
  };
  
  const [currentWeek, setCurrentWeek] = useState(getCurrentWeekDates(currentWeekIndex));
  
  // Update week when week index changes
  useEffect(() => {
    setCurrentWeek(getCurrentWeekDates(currentWeekIndex));
  }, [currentWeekIndex]);

  // Fetch schedule data
  useEffect(() => {
    const fetchScheduleData = async () => {
      setLoading(true);
      try {
        // In a real application, this would be an API call
        // For demo purposes, we'll simulate an API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data - in a real app, this would come from your backend
        const data = [
          { id: 1, course: "Computer Science 101", room: "A-201", day: "Monday", startTime: "09:00", endTime: "10:30", color: "#4f46e5" },
          { id: 2, course: "Data Structures", room: "B-101", day: "Monday", startTime: "13:00", endTime: "14:30", color: "#0ea5e9" },
          { id: 3, course: "Algorithms", room: "C-305", day: "Tuesday", startTime: "11:00", endTime: "12:30", color: "#f59e0b" },
          { id: 4, course: "Database Systems", room: "A-201", day: "Wednesday", startTime: "09:00", endTime: "10:30", color: "#10b981" },
          { id: 5, course: "Computer Networks", room: "D-102", day: "Thursday", startTime: "15:00", endTime: "16:30", color: "#ec4899" },
          { id: 6, course: "Software Engineering", room: "B-201", day: "Friday", startTime: "10:00", endTime: "11:30", color: "#8b5cf6" },
          { id: 7, course: "Machine Learning", room: "A-305", day: "Wednesday", startTime: "13:00", endTime: "15:00", color: "#14b8a6" },
          { id: 8, course: "Web Development", room: "C-101", day: "Thursday", startTime: "09:00", endTime: "11:00", color: "#f43f5e" },
        ];
        
        setScheduleData(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching schedule data:", err);
        setError("Failed to load schedule data. Please try again later.");
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, [currentWeekIndex]); // Refetch when changing weeks

  // Filter schedule based on selected day and search query
  const filteredSchedule = scheduleData.filter(item => {
    const matchesDay = selectedDay === "all" || item.day === selectedDay;
    const matchesSearch = item.course.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.room.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDay && matchesSearch;
  });

  // Calculate total teaching hours
  const calculateTotalHours = (schedule) => {
    return schedule.reduce((total, item) => {
      const startHour = parseInt(item.startTime.split(':')[0]);
      const endHour = parseInt(item.endTime.split(':')[0]);
      const startMinutes = parseInt(item.startTime.split(':')[1]) || 0;
      const endMinutes = parseInt(item.endTime.split(':')[1]) || 0;
      
      const duration = (endHour + endMinutes/60) - (startHour + startMinutes/60);
      return total + duration;
    }, 0).toFixed(1);
  };

  // Function to check if a class is scheduled at a specific day and time
  const getClassAtTime = (day, time) => {
    return scheduleData.find(item => 
      item.day === day && 
      item.startTime <= time && 
      item.endTime > time
    );
  };

  // Function to calculate cell span based on class duration
  const getClassDuration = (startTime, endTime) => {
    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    return end - start + (endTime.includes('30') ? 0.5 : 0);
  };

  // Navigation between weeks
  const previousWeek = () => {
    setCurrentWeekIndex(prev => prev - 1);
  };

  const nextWeek = () => {
    setCurrentWeekIndex(prev => prev + 1);
  };

  // Handle class click - in a real app, this could open details
  const handleClassClick = (classItem) => {
    alert(`Class Details:\n${classItem.course}\nRoom: ${classItem.room}\nTime: ${classItem.startTime} - ${classItem.endTime}`);
  };

  // Handle input change for new class form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClass(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate times to ensure end time is after start time
  const validateTimes = () => {
    const start = newClass.startTime;
    const end = newClass.endTime;
    
    if (start >= end) {
      return false;
    }
    return true;
  };

  // Check for schedule conflicts
  const checkForConflicts = () => {
    const { day, startTime, endTime } = newClass;
    
    return scheduleData.some(item => {
      if (item.day !== day) return false;
      
      const existingStart = item.startTime;
      const existingEnd = item.endTime;
      
      // Check if new class overlaps with existing class
      return (startTime < existingEnd && endTime > existingStart);
    });
  };

  // Handle form submission for adding a new class
  const handleAddClass = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newClass.course || !newClass.room) {
      alert("Please fill in all required fields");
      return;
    }
    
    // Validate times
    if (!validateTimes()) {
      alert("End time must be after start time");
      return;
    }
    
    // Check for conflicts
    if (checkForConflicts()) {
      alert("This time slot conflicts with an existing class");
      return;
    }
    
    // In a real app, this would be an API call
    const newId = scheduleData.length > 0 ? Math.max(...scheduleData.map(item => item.id)) + 1 : 1;
    
    const classToAdd = {
      ...newClass,
      id: newId
    };
    
    // Add the new class
    setScheduleData(prev => [...prev, classToAdd]);
    
    // Show success message and reset form
    setAddSuccess(true);
    setTimeout(() => {
      setAddSuccess(false);
      setShowAddModal(false);
      setNewClass({
        course: "",
        room: "",
        day: "Monday",
        startTime: "09:00",
        endTime: "10:30",
        color: "#4f46e5"
      });
    }, 1500);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <Calendar className="mr-2" />
          Faculty Class Schedule
        </h1>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={previousWeek}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="text-sm font-medium text-gray-700 flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            {currentWeek}
          </div>
          
          <button 
            onClick={nextWeek}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Next week"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 flex-1">
          <Search className="text-gray-500 mr-2 h-5 w-5" />
          <input
            type="text"
            placeholder="Search courses or rooms..."
            className="bg-transparent border-none outline-none w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <Filter className="text-gray-500 h-5 w-5" />
          <select
            className="bg-gray-100 rounded-md px-3 py-2 outline-none border-none"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value="all">All Days</option>
            {days.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
        
        {/* Add Class Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Class
        </button>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center mb-6">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* List View (for mobile) */}
      {!loading && !error && (
        <div className="block md:hidden">
          <h2 className="text-lg font-semibold mb-4">
            {selectedDay === "all" ? "All Classes" : `${selectedDay} Classes`}
          </h2>
          {filteredSchedule.length > 0 ? (
            <div className="space-y-3">
              {filteredSchedule.map(item => (
                <div 
                  key={item.id} 
                  className="border-l-4 rounded shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow"
                  style={{ borderLeftColor: item.color }}
                  onClick={() => handleClassClick(item)}
                >
                  <h3 className="font-medium">{item.course}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    <div>{item.day}, {item.startTime} - {item.endTime}</div>
                    <div>Room: {item.room}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">No classes found</div>
          )}
        </div>
      )}

      {/* Calendar View (for desktop) */}
      {!loading && !error && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-gray-50 w-20"></th>
                {days.map(day => (
                  <th key={day} className={`border p-2 ${selectedDay === "all" || selectedDay === day ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, index) => (
                <tr key={time}>
                  <td className="border p-2 text-center text-sm font-medium text-gray-500">
                    {time}
                  </td>
                  {days.map(day => {
                    const classItem = getClassAtTime(day, time);
                    
                    // If this is the start time for a class
                    if (classItem && classItem.startTime === time) {
                      const duration = getClassDuration(classItem.startTime, classItem.endTime);
                      return (
                        <td 
                          key={`${day}-${time}`} 
                          className="border p-2 relative" 
                          rowSpan={duration}
                        >
                          <div 
                            className="h-full rounded p-2 text-white absolute inset-1 flex flex-col justify-between overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: classItem.color }}
                            onClick={() => handleClassClick(classItem)}
                          >
                            <div className="font-medium">{classItem.course}</div>
                            <div className="text-xs mt-1">
                              <div>{classItem.startTime} - {classItem.endTime}</div>
                              <div>Room: {classItem.room}</div>
                            </div>
                          </div>
                        </td>
                      );
                    }
                    
                    // If this slot is part of an ongoing class, skip rendering
                    if (classItem) return null;
                    
                    // Empty slot
                    return <td key={`${day}-${time}`} className="border p-2"></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Summary Stats */}
      {!loading && !error && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-600 text-sm font-medium">Total Classes</div>
            <div className="text-2xl font-bold">{filteredSchedule.length}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-600 text-sm font-medium">Total Hours</div>
            <div className="text-2xl font-bold">{calculateTotalHours(filteredSchedule)}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-purple-600 text-sm font-medium">Courses</div>
            <div className="text-2xl font-bold">{new Set(filteredSchedule.map(item => item.course)).size}</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="text-amber-600 text-sm font-medium">Rooms Used</div>
            <div className="text-2xl font-bold">{new Set(filteredSchedule.map(item => item.room)).size}</div>
          </div>
        </div>
      )}
      
      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Class</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {addSuccess ? (
              <div className="bg-green-50 text-green-700 p-4 rounded-md flex items-center mb-4">
                <div className="mr-2">✓</div>
                Class added successfully!
              </div>
            ) : (
              <form onSubmit={handleAddClass}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Course Name*
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={newClass.course}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Room*
                  </label>
                  <input
                    type="text"
                    name="room"
                    value={newClass.room}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Day
                  </label>
                  <select
                    name="day"
                    value={newClass.day}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      Start Time
                    </label>
                    <select
                      name="startTime"
                      value={newClass.startTime}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {timeSlots.map(time => (
                        <option key={`start-${time}`} value={time}>{time}</option>
                      ))}
                      {timeSlots.map(time => (
                        <option key={`start-half-${time}`} value={`${time.split(':')[0]}:30`}>
                          {`${time.split(':')[0]}:30`}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      End Time
                    </label>
                    <select
                      name="endTime"
                      value={newClass.endTime}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      {timeSlots.map(time => (
                        <option key={`end-${time}`} value={time}>{time}</option>
                      ))}
                      {timeSlots.map(time => (
                        <option key={`end-half-${time}`} value={`${time.split(':')[0]}:30`}>
                          {`${time.split(':')[0]}:30`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {classColors.map(color => (
                      <div 
                        key={color}
                        className={`w-8 h-8 rounded-full cursor-pointer ${newClass.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewClass(prev => ({ ...prev, color }))}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Class
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}