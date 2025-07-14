import { useEffect, useState } from "react";
import axios from "axios";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
} from "lucide-react";

const EventCalendar = () => {
  // State for current month/year view
  const [currentDate, setCurrentDate] = useState(new Date());
  // Event form state
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [eventType, setEventType] = useState("holiday");
  // Events state
  const [events, setEvents] = useState([]);
  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editedEvent, setEditedEvent] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "holiday",
  });

  const token = localStorage.getItem("token");

  // Utility function to format time to HH:MM
  const formatTime = (timeString) => {
    if (!timeString) return "00:00"; // Return default HH:MM for empty time
    const [hours, minutes] = timeString.split(":");
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  };

  // Set default event date to today in YYYY-MM-DD format
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    setEventDate(`${year}-${month}-${day}`);
  }, []);

  // Fetch events from backend
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/superadmin/events",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const mappedEvents = res.data.map((event) => ({
        id: event._id,
        name: event.title,
        date: event.date.slice(0, 10),
        startTime: event.startTime ? formatTime(event.startTime) : "00:00",
        endTime: event.endTime ? formatTime(event.endTime) : "00:00",
        type: event.type.charAt(0).toUpperCase() + event.type.slice(1),
      }));
      setEvents(mappedEvents);
    } catch (err) {
      console.error(
        "Error fetching events",
        err.response ? err.response.data : err.message
      );
    }
  };

  // Add new event
  const handleAddEvent = async () => {
    if (!eventName.trim() || !eventDate) {
      alert("Event name and date are required");
      return;
    }
    if (startTime && endTime && startTime >= endTime) {
      alert("End time must be after start time");
      return;
    }

    const newEvent = {
      title: eventName,
      date: eventDate,
      startTime: startTime ? formatTime(startTime) : "00:00",
      endTime: endTime ? formatTime(endTime) : "00:00",
      type: eventType,
    };

    try {
      await axios.post(
        "http://localhost:5000/api/superadmin/events",
        newEvent,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEventName("");
      setEventDate(new Date().toISOString().slice(0, 10));
      setStartTime("");
      setEndTime("");
      setEventType("holiday");
      fetchEvents();
    } catch (err) {
      console.error(
        "Error adding event",
        err.response ? err.response.data : err.message
      );
    }
  };

  // Delete event
  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/superadmin/events/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchEvents();
    } catch (err) {
      console.error(
        "Error deleting event",
        err.response ? err.response.data : err.message
      );
    }
  };

  // Update event
  const handleUpdate = async () => {
    if (!editedEvent.title.trim() || !editedEvent.date) {
      alert("Event name and date are required");
      return;
    }
    if (
      editedEvent.startTime &&
      editedEvent.endTime &&
      editedEvent.startTime >= editedEvent.endTime
    ) {
      alert("End time must be after start time");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/superadmin/events/${editingId}`,
        {
          ...editedEvent,
          startTime: editedEvent.startTime
            ? formatTime(editedEvent.startTime)
            : "00:00",
          endTime: editedEvent.endTime
            ? formatTime(editedEvent.endTime)
            : "00:00",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingId(null);
      setEditedEvent({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        type: "holiday",
      });
      fetchEvents();
    } catch (err) {
      console.error(
        "Error updating event",
        err.response ? err.response.data : err.message
      );
    }
  };

  // Generate calendar days
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // Calendar navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
  };

  // Check if a date has events
  const getEventsForDate = (day) => {
    const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    return events.filter((event) => event.date === dateString);
  };

  // Get month name
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Generate calendar grid
  const renderCalendarDays = () => {
    const days = [];
    const monthStart = firstDayOfMonth;

    // Empty cells for days before the first day of month
    for (let i = 0; i < monthStart; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="h-12 xs:h-16 sm:h-20 md:h-24 border bg-gray-50"
        ></div>
      );
    }

    // Cells for days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateEvents = getEventsForDate(day);
      const hasHoliday = dateEvents.some(
        (e) => e.type.toLowerCase() === "holiday"
      );

      days.push(
        <div
          key={day}
          className={`h-12 xs:h-16 sm:h-20 md:h-24 border p-1 relative ${
            hasHoliday ? "bg-red-50" : ""
          }`}
        >
          <div className="font-bold text-[10px] xs:text-xs sm:text-sm">
            {day}
          </div>
          <div className="overflow-y-auto h-8 xs:h-10 sm:h-12 md:h-16">
            {dateEvents.map((event) => (
              <div
                key={event.id}
                className={`text-[10px] xs:text-xs mb-1 p-0.5 xs:p-1 rounded ${
                  event.type.toLowerCase() === "holiday"
                    ? "bg-red-100 text-red-800"
                    : event.type.toLowerCase() === "exam"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {event.name}{" "}
                {event.startTime && event.endTime
                  ? `(${event.startTime}-${event.endTime})`
                  : ""}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-3 xs:p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 xs:mb-4 sm:mb-6">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 text-blue-600 mr-2" />
          <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-800">
            Academic Calendar
          </h1>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex justify-between items-center mb-3 xs:mb-4 sm:mb-6">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Previous Month"
        >
          <ChevronLeft className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 text-gray-600" />
        </button>
        <h2 className="text-base xs:text-lg sm:text-xl font-semibold text-center">
          {monthNames[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Next Month"
        >
          <ChevronRight className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4 xs:mb-6 sm:mb-8">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="h-8 xs:h-9 sm:h-10 bg-blue-500 text-white flex items-center justify-center font-semibold text-[10px] xs:text-xs sm:text-sm"
            >
              {day}
            </div>
          ))}
          {renderCalendarDays()}
        </div>
      </div>

      {/* Event Form */}
      <div className="bg-gray-50 p-3 xs:p-4 sm:p-4 rounded-lg mb-4 xs:mb-6 sm:mb-8">
        <h3 className="text-sm xs:text-base sm:text-lg font-semibold mb-3 xs:mb-4">
          Add New Event
        </h3>
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 xs:gap-4">
          <div>
            <label className="block text-[10px] xs:text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Event Name
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
              placeholder="Enter event name"
              aria-label="Event Name"
            />
          </div>
          <div>
            <label className="block text-[10px] xs:text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Event Date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
              aria-label="Event Date"
            />
          </div>
          <div>
            <label className="block text-[10px] xs:text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
              aria-label="Start Time"
            />
          </div>
          <div>
            <label className="block text-[10px] xs:text-xs sm:text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
              aria-label="End Time"
            />
          </div>
          <div>
            <label className="block text-[10px] xs:text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
              aria-label="Event Type"
            >
              <option value="holiday">Holiday</option>
              <option value="exam">Exam</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleAddEvent}
          className="mt-3 xs:mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors w-full xs:w-auto text-xs xs:text-sm"
          aria-label="Add Event"
        >
          Add Event
        </button>
      </div>

      {/* Events List */}
      <div>
        <h3 className="text-sm xs:text-base sm:text-lg font-semibold mb-3 xs:mb-4">
          Upcoming Events
        </h3>
        <div className="bg-white border rounded-lg overflow-x-auto">
          {/* Table for larger screens */}
          <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 xs:px-4 sm:px-6 py-3 text-left text-[10px] xs:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-2 xs:px-4 sm:px-6 py-3 text-left text-[10px] xs:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-2 xs:px-4 sm:px-6 py-3 text-left text-[10px] xs:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-2 xs:px-4 sm:px-6 py-3 text-left text-[10px] xs:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-2 xs:px-4 sm:px-6 py-3 text-left text-[10px] xs:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-2 xs:px-4 sm:px-6 py-3 text-left text-[10px] xs:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id}>
                  {editingId === event.id ? (
                    <>
                      <td className="px-2 xs:px-4 sm:px-6 py-2 xs:py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={editedEvent.title}
                          onChange={(e) =>
                            setEditedEvent({
                              ...editedEvent,
                              title: e.target.value,
                            })
                          }
                          className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
                          aria-label="Edit Event Name"
                        />
                      </td>
                      <td className="px-2 xs:px-4 sm:px-6 py-2 xs:py-4 whitespace-nowrap">
                        <input
                          type="date"
                          value={editedEvent.date}
                          onChange={(e) =>
                            setEditedEvent({
                              ...editedEvent,
                              date: e.target.value,
                            })
                          }
                          className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
                          aria-label="Edit Event Date"
                        />
                      </td>
                      <td className="px-2 xs:px-4 sm:px-6 py-2 xs:py-4 whitespace-nowrap">
                        <input
                          type="time"
                          value={editedEvent.startTime}
                          onChange={(e) =>
                            setEditedEvent({
                              ...editedEvent,
                              startTime: e.target.value,
                            })
                          }
                          className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
                          aria-label="Edit Start Time"
                        />
                      </td>
                      <td className="px-2 xs:px-4 sm:px-6 py-2 xs:py-4 whitespace-nowrap">
                        <input
                          type="time"
                          value={editedEvent.endTime}
                          onChange={(e) =>
                            setEditedEvent({
                              ...editedEvent,
                              endTime: e.target.value,
                            })
                          }
                          className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
                          aria-label="Edit End Time"
                        />
                      </td>
                      <td className="px-2 xs:px-4 sm:px-6 py-2 xs:py-4 whitespace-nowrap">
                        <select
                          value={editedEvent.type}
                          onChange={(e) =>
                            setEditedEvent({
                              ...editedEvent,
                              type: e.target.value,
                            })
                          }
                          className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
                          aria-label="Edit Event Type"
                        >
                          <option value="holiday">Holiday</option>
                          <option value="exam">Exam</option>
                        </select>
                      </td>
                      <td className="px-2 xs:px-4 sm:px-6 py-2 xs:py-4 whitespace-nowrap text-xs xs:text-sm font-medium">
                        <button
                          onClick={handleUpdate}
                          className="text-green-600 hover:text-green-900 mr-2 xs:mr-3"
                          aria-label="Save Edited Event"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-600 hover:text-gray-900"
                          aria-label="Cancel Editing"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-2 xs:px-4 sm:px-6 py-2 xs:py-4 whitespace-nowrap text-xs xs:text-sm">
                        {event.name}
                      </td>
                      <td className="px-2 xs:px-4 sm:px-6 py-2 xs:py-4 whitespace-nowrap text-xs xs:text-sm">
                        {formatDate(event.date)}
                      </td>
                      <td className="px-2 xs:px-4 sm:px-6 py-2 xs:py-4 whitespace-nowrap text-xs xs:text-sm">
                        {event.startTime}
                      </td>
                      <td className="px-2 xs:px-4 sm:px-6 py-2 xs:py-4 whitespace-nowrap text-xs xs:text-sm">
                        {event.endTime}
                      </td>
                      <td className="px-2 xs:px-4 sm:px-6 py-2 xs:py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] xs:text-xs font-medium ${
                            event.type.toLowerCase() === "holiday"
                              ? "bg-red-100 text-red-800"
                              : event.type.toLowerCase() === "exam"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {event.type}
                        </span>
                      </td>
                      <td className="px-2 xs:px-4 sm:px-6 py-2 xs:py-4 whitespace-nowrap text-xs xs:text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingId(event.id);
                            setEditedEvent({
                              title: event.name,
                              date: event.date,
                              startTime: event.startTime || "",
                              endTime: event.endTime || "",
                              type: event.type.toLowerCase(),
                            });
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-2 xs:mr-3"
                          aria-label={`Edit ${event.name}`}
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="text-red-600 hover:text-red-900"
                          aria-label={`Delete ${event.name}`}
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Card layout for smaller screens */}
          <div className="sm:hidden divide-y divide-gray-200">
            {events.map((event) => (
              <div key={event.id} className="p-3 xs:p-4">
                {editingId === event.id ? (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] xs:text-xs font-medium text-gray-700 mb-1">
                        Event Name
                      </label>
                      <input
                        type="text"
                        value={editedEvent.title}
                        onChange={(e) =>
                          setEditedEvent({
                            ...editedEvent,
                            title: e.target.value,
                          })
                        }
                        className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
                        aria-label="Edit Event Name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] xs:text-xs font-medium text-gray-700 mb-1">
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={editedEvent.date}
                        onChange={(e) =>
                          setEditedEvent({
                            ...editedEvent,
                            date: e.target.value,
                          })
                        }
                        className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
                        aria-label="Edit Event Date"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] xs:text-xs font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={editedEvent.startTime}
                        onChange={(e) =>
                          setEditedEvent({
                            ...editedEvent,
                            startTime: e.target.value,
                          })
                        }
                        className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
                        aria-label="Edit Start Time"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] xs:text-xs font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={editedEvent.endTime}
                        onChange={(e) =>
                          setEditedEvent({
                            ...editedEvent,
                            endTime: e.target.value,
                          })
                        }
                        className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
                        aria-label="Edit End Time"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] xs:text-xs font-medium text-gray-700 mb-1">
                        Event Type
                      </label>
                      <select
                        value={editedEvent.type}
                        onChange={(e) =>
                          setEditedEvent({
                            ...editedEvent,
                            type: e.target.value,
                          })
                        }
                        className="w-full p-1.5 xs:p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs xs:text-sm"
                        aria-label="Edit Event Type"
                      >
                        <option value="holiday">Holiday</option>
                        <option value="exam">Exam</option>
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUpdate}
                        className="flex-1 bg-green-600 text-white px-3 py-1.5 xs:py-2 rounded hover:bg-green-700 text-xs xs:text-sm"
                        aria-label="Save Edited Event"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 bg-gray-600 text-white px-3 py-1.5 xs:py-2 rounded hover:bg-gray-700 text-xs xs:text-sm"
                        aria-label="Cancel Editing"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs xs:text-sm">
                        {event.name}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditedEvent({
                              title: event.name,
                              date: event.date,
                              startTime: event.startTime || "",
                              endTime: event.endTime || "",
                              type: event.type.toLowerCase(),
                            });
                            setEditingId(event.id);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          aria-label={`Edit ${event.name}`}
                        >
                          <Edit2 className="w-4 h-4 xs:w-5 xs:h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="text-red-600 hover:text-red-900"
                          aria-label={`Delete ${event.name}`}
                        >
                          <Trash2 className="w-4 h-4 xs:w-5 xs:h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] xs:text-xs text-gray-600">
                      <span className="font-medium">Date:</span>{" "}
                      {formatDate(event.date)}
                    </div>
                    <div className="text-[10px] xs:text-xs text-gray-600">
                      <span className="font-medium">Time:</span>{" "}
                      {event.startTime} - {event.endTime}
                    </div>
                    <div className="text-[10px] xs:text-xs">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] xs:text-xs font-medium ${
                          event.type.toLowerCase() === "holiday"
                            ? "bg-red-100 text-red-800"
                            : event.type.toLowerCase() === "exam"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {event.type}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 xs:mt-6 text-[10px] xs:text-xs sm:text-sm text-gray-500">
        <div className="flex items-center space-x-3 xs:space-x-4">
          <div className="flex items-center">
            <span className="inline-block w-2.5 h-2.5 xs:w-3 xs:h-3 bg-red-100 border border-red-800 rounded-full mr-1"></span>
            Holiday
          </div>
          <div className="flex items-center">
            <span className="inline-block w-2.5 h-2.5 xs:w-3 xs:h-3 bg-blue-100 border border-blue-800 rounded-full mr-1"></span>
            Exam
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
