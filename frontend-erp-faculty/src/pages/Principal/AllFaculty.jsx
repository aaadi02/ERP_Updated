import { useState, useEffect } from "react";
import {
  Search,
  Clock,
  BookOpen,
  Briefcase,
  UserCheck,
  Clipboard,
  User,
  X,
} from "lucide-react";

export default function AllFaculty() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [expandedFaculty, setExpandedFaculty] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch all faculties
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        
        const headers = {
          'Content-Type': 'application/json',
        };
        
        // Add authorization header only if token exists
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(
          "http://localhost:5000/api/faculty/faculties?limit=1000", // Get more records
          {
            headers: headers
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          throw new Error(`Failed to fetch faculty data: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        const facultiesData = data.data?.faculties || [];
        setFaculties(facultiesData); // Access the nested faculties array
        setLoading(false);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchFaculties();
  }, []);

  // Get unique departments for filter
  const departments = [
    ...new Set(faculties.map((faculty) => faculty.department)),
  ].filter(Boolean); // Filter out any undefined/null departments

  // Handle filtering and sorting
  const filteredFaculties = faculties.filter((faculty) => {
    const fullName = `${faculty.firstName || ""} ${faculty.lastName || ""}`.trim() || faculty.name || "";
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || faculty.type === filterType;
    const matchesDepartment =
      filterDepartment === "all" || faculty.department === filterDepartment;

    return matchesSearch && matchesType && matchesDepartment;
  });

  // Sort faculties
  const sortedFaculties = [...filteredFaculties].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") {
      const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim() || a.name || "";
      const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim() || b.name || "";
      comparison = nameA.localeCompare(nameB);
    } else if (sortBy === "department") {
      comparison = (a.department || "").localeCompare(b.department || "");
    } else if (sortBy === "dateOfJoining") {
      comparison =
        new Date(a.dateOfJoining || 0) - new Date(b.dateOfJoining || 0);
    } else if (sortBy === "experience") {
      comparison = (a.teachingExperience || 0) - (b.teachingExperience || 0);
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleExpandFaculty = (id) => {
    if (expandedFaculty === id) {
      setExpandedFaculty(null);
    } else {
      setExpandedFaculty(id);
    }
  };

  const handleViewDetails = (faculty) => {
    setSelectedFaculty(faculty);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFaculty(null);
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    if (showModal) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [showModal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg font-semibold">Loading faculty data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-lg font-semibold">Error: {error}</div>
      </div>
    );
  }

  // Check if faculties array is empty
  if (!faculties || faculties.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-blue-800">
          Faculty Dashboard
        </h1>
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="text-gray-600 text-xl font-medium mb-2">
            No faculties data present
          </div>
          <p className="text-gray-500">
            There are currently no faculty members in the system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-blue-800">
        Faculty Dashboard
      </h1>

      {/* Search and Filter Controls */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Staff Type:
              </label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="teaching">Teaching</option>
                <option value="non-teaching">Non-Teaching</option>
                <option value="HOD">HOD</option>
                <option value="principal">Principal</option>
                <option value="cc">Class Coordinator</option>
                <option value="facultymanagement">Faculty Management</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Department:
              </label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Stats */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-gray-600">
          Showing {sortedFaculties.length} of {faculties.length} faculty members
        </p>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <div className="relative">
            <select
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split("-");
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="department-asc">Department (A-Z)</option>
              <option value="department-desc">Department (Z-A)</option>
              <option value="dateOfJoining-asc">
                Date of Joining (Oldest)
              </option>
              <option value="dateOfJoining-desc">
                Date of Joining (Newest)
              </option>
              <option value="experience-asc">Experience (Low to High)</option>
              <option value="experience-desc">Experience (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Faculty List */}
      {sortedFaculties.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500 text-lg">
            No faculty members found matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedFaculties.map((faculty) => (
            <div
              key={faculty._id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <User className="h-10 w-10 text-blue-600 bg-blue-100 p-2 rounded-full" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {`${faculty.firstName || ""} ${faculty.lastName || ""}`.trim() || faculty.name || "Unknown"}
                    </h3>
                    <div className="flex gap-2 text-sm text-gray-600">
                      <span className="inline-flex items-center">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                          {faculty.employeeId || "N/A"}
                        </span>
                      </span>
                      <span>{faculty.designation || "N/A"}</span>
                      <span>•</span>
                      <span>{faculty.department || "N/A"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      faculty.type === "teaching"
                        ? "bg-green-100 text-green-800"
                        : faculty.type === "non-teaching"
                        ? "bg-purple-100 text-purple-800"
                        : faculty.type === "HOD"
                        ? "bg-blue-100 text-blue-800"
                        : faculty.type === "principal"
                        ? "bg-red-100 text-red-800"
                        : faculty.type === "cc"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {faculty.type === "teaching" 
                      ? "Teaching" 
                      : faculty.type === "non-teaching"
                      ? "Non-Teaching"
                      : faculty.type === "HOD"
                      ? "HOD"
                      : faculty.type === "principal"
                      ? "Principal"
                      : faculty.type === "cc"
                      ? "Class Coordinator"
                      : faculty.type === "facultymanagement"
                      ? "Faculty Management"
                      : faculty.type || "Unknown"}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      faculty.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {faculty.status || "Unknown"}
                  </span>
                  <button
                    onClick={() => handleViewDetails(faculty)}
                    className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedFaculty && (
        <div className="fixed inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-xl font-bold text-blue-800">
                {`${selectedFaculty.firstName || ""} ${selectedFaculty.lastName || ""}`.trim() || selectedFaculty.name || "Unknown"} - Faculty Details
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row md:gap-8">
                <div className="md:w-1/2">
                  <h4 className="font-medium text-gray-700 mb-3 text-lg">
                    Contact Information
                  </h4>
                  <ul className="space-y-2 text-sm mb-6">
                    <li className="flex items-center gap-2">
                      <span className="font-medium w-24">Email:</span>
                      <span>{selectedFaculty.email || "N/A"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium w-24">Mobile:</span>
                      <span>{selectedFaculty.mobile || "N/A"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium w-24">Address:</span>
                      <span>{selectedFaculty.address || "N/A"}</span>
                    </li>
                  </ul>

                  <h4 className="font-medium text-gray-700 mb-3 text-lg">
                    Personal Details
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="font-medium w-24">Gender:</span>
                      <span>{selectedFaculty.gender || "N/A"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium w-24">Date of Birth:</span>
                      <span>{selectedFaculty.dateOfBirth || "N/A"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-medium w-24">Aadhaar:</span>
                      <span>{selectedFaculty.aadhaar || "N/A"}</span>
                    </li>
                  </ul>
                </div>

                <div className="md:w-1/2 mt-6 md:mt-0">
                  <h4 className="font-medium text-gray-700 mb-3 text-lg">
                    Employment Details
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Date of Joining:</span>
                      <span>{selectedFaculty.dateOfJoining || "N/A"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Employment Type:</span>
                      <span>{selectedFaculty.employmentStatus || "N/A"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Experience:</span>
                      <span>
                        {selectedFaculty.teachingExperience || "0"} years
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Reporting Officer:</span>
                      <span>{selectedFaculty.reportingOfficer || "N/A"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Shift Timing:</span>
                      <span>{selectedFaculty.shiftTiming || "N/A"}</span>
                    </li>
                  </ul>

                  {selectedFaculty.type === "teaching" && (
                    <>
                      <h4 className="font-medium text-gray-700 mt-6 mb-3 text-lg">
                        Teaching Details
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <Clipboard className="h-4 w-4 text-gray-500 mt-1" />
                          <span className="font-medium">Class Incharge:</span>
                          <span>{selectedFaculty.classIncharge || "N/A"}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <BookOpen className="h-4 w-4 text-gray-500 mt-1" />
                          <span className="font-medium">Subjects Taught:</span>
                          <span className="flex-1">
                            {selectedFaculty.subjectsTaught &&
                            selectedFaculty.subjectsTaught.length > 0
                              ? selectedFaculty.subjectsTaught.join(", ")
                              : "N/A"}
                          </span>
                        </li>
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-8 border-t pt-6">
                <h4 className="font-medium text-gray-700 mb-4 text-lg">
                  Skills & Publications
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">
                      Technical Skills
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedFaculty.technicalSkills &&
                      selectedFaculty.technicalSkills.length > 0 ? (
                        selectedFaculty.technicalSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">No skills listed</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-600 mb-2">
                      Research Publications
                    </h5>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {selectedFaculty.researchPublications &&
                      selectedFaculty.researchPublications.length > 0 ? (
                        selectedFaculty.researchPublications.map(
                          (pub, index) => <li key={index}>{pub}</li>
                        )
                      ) : (
                        <li className="text-gray-500">
                          No publications listed
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t p-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
