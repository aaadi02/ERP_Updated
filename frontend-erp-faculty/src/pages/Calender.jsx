import React, { useState, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  BookOpen,
} from "lucide-react";

// Sample faculty data
const facultyData = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    department: "Computer Science",
    availability: [
      { day: "Monday", slots: ["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM"] },
      { day: "Wednesday", slots: ["9:00 AM - 11:00 AM", "1:00 PM - 3:00 PM"] },
      { day: "Friday", slots: ["11:00 AM - 1:00 PM", "3:00 PM - 5:00 PM"] },
    ],
    classes: [
      {
        day: "Monday",
        time: "9:00 AM - 10:00 AM",
        course: "Introduction to Programming",
        room: "CS-101",
      },
      {
        day: "Wednesday",
        time: "11:30 AM - 1:00 PM",
        course: "Data Structures",
        room: "CS-205",
      },
      {
        day: "Thursday",
        time: "2:00 PM - 3:30 PM",
        course: "Algorithms",
        room: "CS-302",
      },
    ],
  },
  {
    id: 2,
    name: "Prof. Michael Chen",
    department: "Electrical Engineering",
    availability: [
      { day: "Tuesday", slots: ["9:00 AM - 11:00 AM", "3:00 PM - 5:00 PM"] },
      { day: "Thursday", slots: ["10:00 AM - 12:00 PM", "4:00 PM - 6:00 PM"] },
    ],
    classes: [
      {
        day: "Monday",
        time: "2:00 PM - 3:30 PM",
        course: "Circuit Theory",
        room: "EE-105",
      },
      {
        day: "Tuesday",
        time: "11:30 AM - 1:00 PM",
        course: "Digital Electronics",
        room: "EE-201",
      },
      {
        day: "Friday",
        time: "9:00 AM - 10:30 AM",
        course: "Embedded Systems",
        room: "EE-304",
      },
    ],
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    department: "Mathematics",
    availability: [
      { day: "Monday", slots: ["1:00 PM - 3:00 PM"] },
      { day: "Wednesday", slots: ["10:00 AM - 12:00 PM", "2:00 PM - 4:00 PM"] },
      { day: "Friday", slots: ["9:00 AM - 11:00 AM"] },
    ],
    classes: [
      {
        day: "Tuesday",
        time: "9:00 AM - 10:30 AM",
        course: "Calculus I",
        room: "M-101",
      },
      {
        day: "Thursday",
        time: "11:00 AM - 12:30 PM",
        course: "Linear Algebra",
        room: "M-203",
      },
      {
        day: "Friday",
        time: "1:00 PM - 2:30 PM",
        course: "Discrete Mathematics",
        room: "M-105",
      },
    ],
  },
];

// Days of the week array for our calendar
const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Time slots for the day view
const timeSlots = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

export default function FacultyCalendar() {
  const [selectedView, setSelectedView] = useState("week"); // week, day, list
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDayInWeekView, setActiveDayInWeekView] = useState("Monday");

  const filteredFaculty = facultyData.filter(
    (faculty) =>
      faculty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faculty.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const changeWeek = (increment) => {
    const newDate = new Date(viewDate);
    newDate.setDate(newDate.getDate() + increment * 7);
    setViewDate(newDate);
  };

  const changeDay = (increment) => {
    const newDate = new Date(viewDate);
    newDate.setDate(newDate.getDate() + increment);
    setViewDate(newDate);
  };

  const renderDayView = () => {
    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => changeDay(-1)}
            className="flex items-center text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
          >
            <ChevronLeft size={16} className="mr-1" /> Previous Day
          </button>
          <h3 className="text-xl font-semibold">
            {selectedDay} ({viewDate.toLocaleDateString()})
          </h3>
          <button
            onClick={() => changeDay(1)}
            className="flex items-center text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
          >
            Next Day <ChevronRight size={16} className="ml-1" />
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-200">
            <div className="col-span-2 p-2 font-medium text-gray-700 border-r border-gray-200">
              Time
            </div>
            <div className="col-span-10 p-2 font-medium text-gray-700">
              Faculty Schedule
            </div>
          </div>

          {timeSlots.map((timeSlot, index) => (
            <div
              key={index}
              className="grid grid-cols-12 border-b border-gray-200 hover:bg-gray-50"
            >
              <div className="col-span-2 p-2 border-r border-gray-200 font-medium text-gray-600">
                {timeSlot}
              </div>
              <div className="col-span-10 p-2 min-h-16">
                {filteredFaculty.map((faculty) => {
                  // Find classes for this faculty at this time slot
                  const classesAtTime = faculty.classes.filter(
                    (cls) =>
                      cls.day === selectedDay && cls.time.includes(timeSlot)
                  );

                  return classesAtTime.map((cls, cIndex) => (
                    <div
                      key={`${faculty.id}-${cIndex}`}
                      className="mb-2 p-2 bg-blue-100 border-l-4 border-blue-500 rounded"
                    >
                      <p className="font-medium">{faculty.name}</p>
                      <p className="text-sm text-gray-700">
                        {cls.course} | Room: {cls.room}
                      </p>
                      <p className="text-xs text-gray-600">{cls.time}</p>
                    </div>
                  ));
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    // Desktop version (similar to original but with some improvements)
    const desktopWeekView = (
      <div className="hidden md:block">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-8 bg-gray-100 border-b border-gray-200">
            <div className="p-3 font-medium text-gray-700 border-r border-gray-200">
              Time
            </div>
            {weekdays.map((day, index) => (
              <div
                key={index}
                className="p-3 font-medium text-gray-700 text-center"
              >
                {day}
              </div>
            ))}
          </div>

          {timeSlots.map((timeSlot, index) => (
            <div
              key={index}
              className="grid grid-cols-8 border-b border-gray-200"
            >
              <div className="p-3 border-r border-gray-200 font-medium text-gray-600">
                {timeSlot}
              </div>

              {weekdays.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className="p-1 border-r border-gray-100 min-h-16 overflow-hidden"
                >
                  {filteredFaculty.map((faculty) => {
                    // Find classes for this faculty on this day at this time
                    const classesAtTime = faculty.classes.filter(
                      (cls) => cls.day === day && cls.time.includes(timeSlot)
                    );

                    return classesAtTime.map((cls, cIndex) => (
                      <div
                        key={`${faculty.id}-${cIndex}`}
                        className="mb-1 p-1 bg-blue-100 border-l-4 border-blue-500 rounded text-xs"
                        title={`${faculty.name} - ${cls.course} (${cls.time})`}
                      >
                        <p className="font-medium truncate">{faculty.name}</p>
                        <p className="truncate">{cls.course}</p>
                      </div>
                    ));
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );

    // Mobile version (new tabbed-day approach)
    const mobileWeekView = (
      <div className="block md:hidden">
        <div className="mb-4">
          {/* Day selector tabs */}
          <div className="flex overflow-x-auto pb-2 border-b border-gray-200">
            {weekdays.map((day, index) => (
              <button
                key={index}
                className={`px-4 py-2 whitespace-nowrap ${
                  activeDayInWeekView === day
                    ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveDayInWeekView(day)}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Day content */}
          <div className="mt-3">
            <h3 className="text-lg font-medium mb-2">{activeDayInWeekView}</h3>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {timeSlots.map((timeSlot, index) => {
                const allClassesAtTime = [];

                filteredFaculty.forEach((faculty) => {
                  // Find classes for this faculty on this day at this time
                  const classesAtTime = faculty.classes.filter(
                    (cls) =>
                      cls.day === activeDayInWeekView &&
                      cls.time.includes(timeSlot)
                  );

                  if (classesAtTime.length > 0) {
                    classesAtTime.forEach((cls) => {
                      allClassesAtTime.push({
                        faculty,
                        class: cls,
                      });
                    });
                  }
                });

                if (allClassesAtTime.length === 0) return null;

                return (
                  <div
                    key={index}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <div className="bg-gray-50 p-2 font-medium text-gray-700 border-b border-gray-200">
                      {timeSlot}
                    </div>

                    <div className="p-2">
                      {allClassesAtTime.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="mb-2 last:mb-0 p-2 bg-blue-100 border-l-4 border-blue-500 rounded"
                        >
                          <p className="font-medium">{item.faculty.name}</p>
                          <p className="text-sm text-gray-700">
                            {item.class.course}
                          </p>
                          <p className="text-xs text-gray-600">
                            Room: {item.class.room} | {item.class.time}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );

    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => changeWeek(-1)}
            className="flex items-center text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
          >
            <ChevronLeft size={16} className="mr-1" /> Previous Week
          </button>
          <h3 className="text-xl font-semibold">
            Week of {viewDate.toLocaleDateString()}
          </h3>
          <button
            onClick={() => changeWeek(1)}
            className="flex items-center text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
          >
            Next Week <ChevronRight size={16} className="ml-1" />
          </button>
        </div>

        {desktopWeekView}
        {mobileWeekView}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-4">Faculty List</h3>

        <div className="grid grid-cols-1 gap-4">
          {filteredFaculty.map((faculty) => (
            <div
              key={faculty.id}
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md cursor-pointer"
              onClick={() => setSelectedFaculty(faculty)}
            >
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">{faculty.name}</h3>
                <p className="text-gray-600">{faculty.department}</p>
              </div>

              <div className="p-4">
                <div className="mb-4">
                  <h4 className="flex items-center text-md font-medium mb-2">
                    <Clock size={16} className="mr-2 text-blue-600" />{" "}
                    Availability
                  </h4>
                  <ul className="pl-6 list-disc">
                    {faculty.availability.map((avail, index) => (
                      <li key={index} className="mb-1">
                        <span className="font-medium">{avail.day}:</span>{" "}
                        {avail.slots.join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="flex items-center text-md font-medium mb-2">
                    <BookOpen size={16} className="mr-2 text-blue-600" />{" "}
                    Classes
                  </h4>
                  <ul className="pl-6 list-disc">
                    {faculty.classes.map((cls, index) => (
                      <li key={index} className="mb-1">
                        <span className="font-medium">
                          {cls.day} ({cls.time}):
                        </span>{" "}
                        {cls.course} in Room {cls.room}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFacultyDetail = () => {
    if (!selectedFaculty) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Faculty Details</h2>
            <button
              onClick={() => setSelectedFaculty(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-start mb-6">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <User size={32} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {selectedFaculty.name}
                </h3>
                <p className="text-gray-600">{selectedFaculty.department}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-medium mb-2 border-b border-gray-200 pb-2">
                Availability
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedFaculty.availability.map((avail, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <h5 className="font-medium text-gray-800">{avail.day}</h5>
                    <ul className="mt-1">
                      {avail.slots.map((slot, slotIndex) => (
                        <li key={slotIndex} className="text-gray-600">
                          {slot}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium mb-2 border-b border-gray-200 pb-2">
                Class Schedule
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-4 text-left">Day</th>
                      <th className="py-2 px-4 text-left">Time</th>
                      <th className="py-2 px-4 text-left">Course</th>
                      <th className="py-2 px-4 text-left">Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFaculty.classes.map((cls, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-gray-50" : ""}
                      >
                        <td className="py-2 px-4">{cls.day}</td>
                        <td className="py-2 px-4">{cls.time}</td>
                        <td className="py-2 px-4">{cls.course}</td>
                        <td className="py-2 px-4">{cls.room}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setSelectedFaculty(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center mb-6">
        <Calendar size={32} className="text-blue-600 mr-3" />
        <h1 className="text-2xl font-bold">Faculty Calendar</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex mb-4 md:mb-0">
              <button
                onClick={() => setSelectedView("day")}
                className={`px-4 py-2 rounded-l ${
                  selectedView === "day"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setSelectedView("week")}
                className={`px-4 py-2 ${
                  selectedView === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setSelectedView("list")}
                className={`px-4 py-2 rounded-r ${
                  selectedView === "list"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                List
              </button>
            </div>

            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search faculty or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 w-full"
              />
            </div>
          </div>

          {selectedView === "day" && (
            <div className="mt-4">
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {weekdays.map((day, index) => (
                  <option key={index} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="p-4">
          {selectedView === "day" && renderDayView()}
          {selectedView === "week" && renderWeekView()}
          {selectedView === "list" && renderListView()}
        </div>
      </div>

      {selectedFaculty && renderFacultyDetail()}
    </div>
  );
}
