import { useState } from "react";
import { Calendar, Clock, AlertCircle, User, X } from "lucide-react";

export default function FacultyLeaveDashboard() {
  // Sample data for faculty members
  const facultyData = [
    {
      id: "EMP001",
      name: "Dr. Sarah Johnson",
      designation: "Professor",
      department: "Computer Science",
      leaveType: "Medical Leave",
      status: "Approved",
      startDate: "2025-05-10",
      endDate: "2025-05-20",
      description: "Surgery recovery",
      contactDuringLeave: "+1-555-0123",
    },
    {
      id: "EMP002",
      name: "Prof. Michael Chen",
      designation: "Associate Professor",
      department: "Mathematics",
      leaveType: "Vacation",
      status: "Approved",
      startDate: "2025-05-15",
      endDate: "2025-05-30",
      description: "Family vacation",
      contactDuringLeave: "+1-555-0124",
    },
    {
      id: "EMP003",
      name: "Dr. Emily Rodriguez",
      designation: "Assistant Professor",
      department: "Physics",
      leaveType: "Conference",
      status: "Approved",
      startDate: "2025-05-08",
      endDate: "2025-05-12",
      description: "Attending International Physics Conference",
      contactDuringLeave: "+1-555-0125",
    },
    {
      id: "EMP004",
      name: "Prof. James Wilson",
      designation: "Professor",
      department: "Literature",
      leaveType: "Sabbatical",
      status: "Approved",
      startDate: "2025-05-01",
      endDate: "2025-08-31",
      description: "Writing research book",
      contactDuringLeave: "+1-555-0126",
    },
    {
      id: "EMP005",
      name: "Dr. Lisa Wong",
      designation: "Associate Professor",
      department: "Chemistry",
      leaveType: "Personal Leave",
      status: "Pending",
      startDate: "2025-05-20",
      endDate: "2025-05-22",
      description: "Family emergency",
      contactDuringLeave: "+1-555-0127",
    },
  ];

  // Filter faculty currently on leave (approved status)
  const facultiesOnLeave = facultyData.filter(
    (faculty) =>
      faculty.status === "Approved" &&
      new Date(faculty.startDate) <= new Date() &&
      new Date(faculty.endDate) >= new Date()
  );

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Function to handle view details button
  const handleViewDetails = (faculty) => {
    setSelectedFaculty(faculty);
    setIsModalOpen(true);
  };

  // Function to calculate leave duration in days
  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    return diffDays;
  };

  // Function to get leave type color
  const getLeaveTypeColor = (leaveType) => {
    switch (leaveType) {
      case "Medical Leave":
        return "bg-red-100 text-red-800";
      case "Vacation":
        return "bg-blue-100 text-blue-800";
      case "Conference":
        return "bg-purple-100 text-purple-800";
      case "Sabbatical":
        return "bg-yellow-100 text-yellow-800";
      case "Personal Leave":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        Faculty Leave Management Dashboard
      </h1>

      {/* Faculty on Leave Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Faculty Currently on Leave
        </h2>

        {facultiesOnLeave.length === 0 ? (
          <p className="text-gray-500">
            No faculty members are currently on leave.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facultiesOnLeave.map((faculty) => (
              <div
                key={faculty.id}
                className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{faculty.name}</h3>
                    <p className="text-gray-600">{faculty.designation}</p>
                    <p className="text-gray-600">{faculty.department}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getLeaveTypeColor(
                      faculty.leaveType
                    )}`}
                  >
                    {faculty.leaveType}
                  </span>
                </div>

                <div className="mt-3 flex items-center text-gray-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>
                    {new Date(faculty.startDate).toLocaleDateString()} -{" "}
                    {new Date(faculty.endDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-2 flex items-center text-gray-700">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>
                    {calculateDuration(faculty.startDate, faculty.endDate)} days
                  </span>
                </div>

                <button
                  onClick={() => handleViewDetails(faculty)}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Faculty List Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Faculty</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EMP ID
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Designation
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Status
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {facultyData.map((faculty) => (
                <tr key={faculty.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap">{faculty.id}</td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium">
                    {faculty.name}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {faculty.designation}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {faculty.department}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        faculty.status === "Approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {faculty.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetails(faculty)}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-sm"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for detailed view */}
      {isModalOpen && selectedFaculty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Faculty Leave Details</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-500 mr-2" />
                <div>
                  <p className="font-medium">{selectedFaculty.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedFaculty.designation} • {selectedFaculty.department}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-500">EMP ID</p>
                <p>{selectedFaculty.id}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Leave Type</p>
                <span
                  className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${getLeaveTypeColor(
                    selectedFaculty.leaveType
                  )}`}
                >
                  {selectedFaculty.leaveType}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <div className="flex items-center mt-1">
                  <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                  <span>
                    {new Date(selectedFaculty.startDate).toLocaleDateString()} -{" "}
                    {new Date(selectedFaculty.endDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  (
                  {calculateDuration(
                    selectedFaculty.startDate,
                    selectedFaculty.endDate
                  )}{" "}
                  days)
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span
                  className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                    selectedFaculty.status === "Approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {selectedFaculty.status}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="mt-1">{selectedFaculty.description}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Contact During Leave
                </p>
                <p className="mt-1">{selectedFaculty.contactDuringLeave}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
