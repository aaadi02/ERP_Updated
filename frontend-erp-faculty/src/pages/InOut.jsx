import { useState } from "react";
import { Clock, Calendar, LogIn, ChevronRight } from "lucide-react";

export default function AttendanceTracker() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [checkedIn, setCheckedIn] = useState(false);
  const [inTime, setInTime] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([
    {
      date: "May 4",
      inTime: "08:45",
      outTime: "04:30",
      workingHours: "7h 45m",
      status: "Present",
    },
    {
      date: "May 3",
      inTime: "09:00",
      outTime: "05:00",
      workingHours: "8h 00m",
      status: "Present",
    },
    {
      date: "May 2",
      inTime: "08:30",
      outTime: "02:30",
      workingHours: "6h 00m",
      status: "Half Day",
    },
    {
      date: "May 1",
      inTime: "-",
      outTime: "-",
      workingHours: "-",
      status: "Holiday",
    },
  ]);
  
  // Show or hide attendance details on mobile
  const [expandedRow, setExpandedRow] = useState(null);

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = currentDate
    .toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace("24:", "00:");

  const to12HourFormat = (time24) => {
    if (!time24 || time24 === "-") return "-";

    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    return `${displayHour}:${minutes} ${suffix}`;
  };

  const handleCheckIn = () => {
    const now = new Date();
    const inTimeStr = now
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace("24:", "00:");

    setCheckedIn(true);
    setInTime(inTimeStr);

    const todayStr = now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const todayRecord = {
      date: todayStr,
      inTime: inTimeStr,
      outTime: "-",
      workingHours: "-",
      status: "Present",
    };

    setAttendanceHistory([todayRecord, ...attendanceHistory]);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800";
      case "Half Day":
        return "bg-yellow-100 text-yellow-800";
      case "Holiday":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleRow = (index) => {
    if (expandedRow === index) {
      setExpandedRow(null);
    } else {
      setExpandedRow(index);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 md:mb-0">IN/OUT Attendance</h1>
        <p className="text-sm sm:text-base text-gray-500">{formattedDate}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Today's Status Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-medium text-gray-800 mb-4 sm:mb-8">
            Today's Status
          </h2>

          <div className="flex flex-col items-center justify-center mb-6">
            <div className="bg-gray-100 rounded-full p-4 sm:p-6 mb-4">
              <Clock className="h-8 w-8 sm:h-12 sm:w-12 text-indigo-500" />
            </div>

            <p className="text-xs sm:text-sm text-gray-500">{formattedDate}</p>
            <p className="text-xl sm:text-3xl font-bold text-gray-900">
              {checkedIn ? to12HourFormat(inTime) : "Not Checked In"}
            </p>
          </div>

          <button
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center justify-center transition duration-200"
            onClick={handleCheckIn}
            disabled={checkedIn}
          >
            <LogIn className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {checkedIn ? "Checked In" : "Check In"}
          </button>
        </div>

        {/* Recent Attendance History Card */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-medium text-gray-800">
              Recent Attendance History
            </h2>
            <button className="flex items-center text-xs sm:text-sm text-gray-600 hover:text-gray-900">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">View Full History</span>
              <span className="inline sm:hidden">View All</span>
            </button>
          </div>

          {/* Desktop View Table (hidden on small screens) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">In Time</th>
                  <th className="pb-3">Out Time</th>
                  <th className="pb-3">Working Hours</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendanceHistory.map((record, index) => (
                  <tr key={index} className="text-gray-800">
                    <td className="py-3 text-sm">{record.date}</td>
                    <td className="py-3 text-sm">
                      {record.inTime === "-"
                        ? "-"
                        : to12HourFormat(record.inTime)}
                    </td>
                    <td className="py-3 text-sm">
                      {record.outTime === "-"
                        ? "-"
                        : to12HourFormat(record.outTime)}
                    </td>
                    <td className="py-3 text-sm">{record.workingHours}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View - Accordion style (shown only on small screens) */}
          <div className="block sm:hidden">
            <ul className="divide-y divide-gray-200">
              {attendanceHistory.map((record, index) => (
                <li key={index} className="py-2">
                  <div 
                    className="flex justify-between items-center cursor-pointer" 
                    onClick={() => toggleRow(index)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{record.date}</span>
                      <span
                        className={`text-xs px-2 py-0.5 mt-1 rounded-full inline-block ${getStatusBadgeColor(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>
                    </div>
                    <ChevronRight 
                      className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                        expandedRow === index ? "transform rotate-90" : ""
                      }`} 
                    />
                  </div>
                  
                  {expandedRow === index && (
                    <div className="mt-2 pl-2 pt-2 border-t border-gray-100 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">In Time:</span>
                        <span className="font-medium">
                          {record.inTime === "-" ? "-" : to12HourFormat(record.inTime)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Out Time:</span>
                        <span className="font-medium">
                          {record.outTime === "-" ? "-" : to12HourFormat(record.outTime)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Working Hours:</span>
                        <span className="font-medium">{record.workingHours}</span>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}