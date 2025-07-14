import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
} from "lucide-react";

const Attendance = () => {
  // Sample faculty data - in a real app, you would fetch this from an API
  const [facultyList, setFacultyList] = useState([
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      department: "Computer Science",
      status: null,
      time: null,
    },
    {
      id: 2,
      name: "Prof. Michael Chen",
      department: "Mathematics",
      status: null,
      time: null,
    },
    {
      id: 3,
      name: "Dr. Emily Rodriguez",
      department: "Physics",
      status: null,
      time: null,
    },
    {
      id: 4,
      name: "Prof. David Williams",
      department: "Biology",
      status: null,
      time: null,
    },
    {
      id: 5,
      name: "Dr. Lisa Taylor",
      department: "Chemistry",
      status: null,
      time: null,
    },
    {
      id: 6,
      name: "Prof. James Brown",
      department: "English",
      status: null,
      time: null,
    },
    {
      id: 7,
      name: "Dr. Robert Miller",
      department: "History",
      status: null,
      time: null,
    },
    {
      id: 8,
      name: "Prof. Jennifer Davis",
      department: "Psychology",
      status: null,
      time: null,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  // Filter departments for dropdown
  const departments = [
    ...new Set(facultyList.map((faculty) => faculty.department)),
  ];

  // Update current date and time
  useEffect(() => {
    const today = new Date();
    setCurrentDate(
      today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter faculty based on search and department filter
  const filteredFaculty = facultyList.filter((faculty) => {
    const matchesSearch = faculty.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesDepartment =
      filterDepartment === "" || faculty.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Handle marking attendance
  const markAttendance = (id, status) => {
    setFacultyList((prev) =>
      prev.map((faculty) =>
        faculty.id === id
          ? {
              ...faculty,
              status,
              time: new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : faculty
      )
    );
  };

  // Export attendance data
  const exportAttendance = () => {
    console.log("Exporting attendance data:", facultyList);
    alert("Attendance data exported successfully!");
  };

  return (
    <div className="p-7 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Faculty Attendance
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4">
          <div className="flex items-center text-gray-600 mb-3 sm:mb-0">
            <Calendar size={18} className="mr-2" />
            <span>{currentDate}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock size={18} className="mr-2" />
            <span>{currentTime}</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search Faculty..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <Filter
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <select
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={exportAttendance}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Download size={18} className="mr-2" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Table and Cards */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Table for medium and larger screens */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Faculty Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFaculty.length > 0 ? (
                filteredFaculty.map((faculty) => (
                  <tr key={faculty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {faculty.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{faculty.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {faculty.status === "present" && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Present
                        </span>
                      )}
                      {faculty.status === "absent" && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Absent
                        </span>
                      )}
                      {faculty.status === null && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Not Marked
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{faculty.time || "—"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => markAttendance(faculty.id, "present")}
                          className={`p-1 rounded-full ${
                            faculty.status === "present"
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600"
                          }`}
                          title="Mark Present"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button
                          onClick={() => markAttendance(faculty.id, "absent")}
                          className={`p-1 rounded-full ${
                            faculty.status === "absent"
                              ? "bg-red-100 text-red-600"
                              : "bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                          }`}
                          title="Mark Absent"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No faculty members found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cards for smaller screens */}
        <div className="block md:hidden divide-y divide-gray-200">
          {filteredFaculty.length > 0 ? (
            filteredFaculty.map((faculty) => (
              <div key={faculty.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-gray-900">
                      {faculty.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {faculty.department}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => markAttendance(faculty.id, "present")}
                      className={`p-1 rounded-full ${
                        faculty.status === "present"
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600"
                      }`}
                      title="Mark Present"
                    >
                      <CheckCircle size={20} />
                    </button>
                    <button
                      onClick={() => markAttendance(faculty.id, "absent")}
                      className={`p-1 rounded-full ${
                        faculty.status === "absent"
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600"
                      }`}
                      title="Mark Absent"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    {faculty.status === "present" && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Present
                      </span>
                    )}
                    {faculty.status === "absent" && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Absent
                      </span>
                    )}
                    {faculty.status === null && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Not Marked
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {faculty.time || "—"}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No faculty members found matching your criteria
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-500">Total Faculty</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {facultyList.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-500">Present</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {facultyList.filter((f) => f.status === "present").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-500">Absent</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {facultyList.filter((f) => f.status === "absent").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-sm font-medium text-gray-500">Not Marked</div>
          <div className="mt-1 text-2xl font-semibold text-gray-600">
            {facultyList.filter((f) => f.status === null).length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
