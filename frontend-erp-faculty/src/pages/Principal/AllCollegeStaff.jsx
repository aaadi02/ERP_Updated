import { useState, useEffect } from "react";
import { Search, User, X, Building, Users, ChevronDown } from "lucide-react";

export default function FacultyDataInPrincipal() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          "http://localhost:5000/api/faculty/faculties?limit=1000",
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch faculty data: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        // Handle backend response structure
        let facultyData = [];
        if (Array.isArray(data)) {
          facultyData = data;
        } else if (Array.isArray(data.data)) {
          facultyData = data.data;
        } else if (data.data && Array.isArray(data.data.faculties)) {
          facultyData = data.data.faculties;
        } else if (Array.isArray(data.faculties)) {
          facultyData = data.faculties;
        }
        if (!Array.isArray(facultyData)) {
          throw new Error(
            "Invalid data format: Expected an array of faculties"
          );
        }
        setFaculties(facultyData);
        setLoading(false);
      } catch (err) {
        console.error("Fetch faculties error:", err);
        setError(
          `Error fetching faculty data: ${err.message}. Please check if the backend server is running at http://localhost:5000.`
        );
        setLoading(false);
      }
    };

    fetchFaculties();
  }, []);

  const departments = [
    ...new Set(faculties.map((faculty) => faculty.department)),
  ].filter(Boolean);

  const filteredFaculties = faculties.filter((faculty) => {
    const fullName = faculty.firstName || faculty.name || "";
    const matchesSearch =
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || faculty.type === filterType;
    const matchesDepartment =
      filterDepartment === "all" || faculty.department === filterDepartment;

    return matchesSearch && matchesType && matchesDepartment;
  });

  const getAvatarColor = (faculty) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-emerald-500",
      "bg-orange-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-amber-500",
    ];
    const name = faculty?.firstName || faculty?.name || "Unknown";
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
  };

  const getInitials = (faculty) => {
    const name = faculty?.firstName || faculty?.name || "Unknown";
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-sm font-medium text-slate-600">
            Loading faculty data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="bg-white p-6 rounded-lg shadow-lg border border-red-100 max-w-sm">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-50 text-red-500">
            <X className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-center text-red-600 mb-2">
            Error
          </h2>
          <div className="text-slate-600 text-sm text-center">{error}</div>
          <button
            className="mt-4 w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md transition-colors text-sm"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!faculties || faculties.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-slate-800">
            Faculty Dashboard
          </h1>
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4">
              <Users className="h-8 w-8" />
            </div>
            <div className="text-slate-800 text-lg font-semibold mb-2">
              No faculties data present
            </div>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              There are currently no faculty members in the system. Please check
              the backend data source.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-6">
        {!selectedFaculty ? (
          <>
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">
                  Faculty Dashboard
                </h1>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    Total: {faculties.length}
                  </div>
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                    Teaching:{" "}
                    {faculties.filter((f) => f.type === "teaching").length}
                  </div>
                  <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                    Non-Teaching:{" "}
                    {faculties.filter((f) => f.type === "non-teaching").length}
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by name, email or ID..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full md:w-auto">
                    <select
                      className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="teaching">Teaching</option>
                      <option value="non-teaching">Non-Teaching</option>
                    </select>
                    <select
                      className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm"
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

              {/* Results Count */}
              <div className="text-slate-600 text-sm">
                Showing{" "}
                <span className="font-medium text-blue-600">
                  {filteredFaculties.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-blue-600">
                  {faculties.length}
                </span>{" "}
                faculty members
              </div>

              {/* Faculty Cards */}
              {filteredFaculties.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-500 mb-4">
                    <Search className="h-6 w-6" />
                  </div>
                  <p className="text-slate-700 text-base font-medium mb-2">
                    No faculty members found
                  </p>
                  <p className="text-slate-500 text-sm">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredFaculties.map((faculty) => (
                    <div
                      key={faculty._id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                      onClick={() => setSelectedFaculty(faculty)}
                    >
                      <div className="p-4">
                        <div className="flex gap-3">
                          <div
                            className={`flex-shrink-0 w-12 h-12 ${getAvatarColor(
                              faculty
                            )} rounded-md flex items-center justify-center text-white font-medium text-base`}
                          >
                            {getInitials(faculty)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800">
                              {faculty.firstName || faculty.name || "Unknown"}
                            </h3>
                            <div className="text-sm text-slate-500">
                              {faculty.designation || "Faculty"}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {faculty.department && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full text-xs text-slate-600">
                                  <Building className="h-3 w-3" />
                                  {faculty.department}
                                </span>
                              )}
                              {faculty.type && (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                                    faculty.type === "teaching"
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {faculty.type === "teaching"
                                    ? "Teaching"
                                    : "Non-Teaching"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          // Faculty Details View
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    className="p-1 rounded-full hover:bg-blue-600 transition-colors"
                    onClick={() => setSelectedFaculty(null)}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h2 className="text-lg font-semibold">Faculty Details</h2>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`flex-shrink-0 w-16 h-16 ${getAvatarColor(
                    selectedFaculty
                  )} rounded-lg flex items-center justify-center text-white font-bold text-xl`}
                >
                  {getInitials(selectedFaculty)}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    {selectedFaculty.firstName || selectedFaculty.name || "Unknown"}
                  </h1>
                  <p className="text-slate-500">
                    {selectedFaculty.employeeId || "ID not available"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-lg p-5">
                  <h3 className="text-base font-semibold text-slate-700 mb-4">
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Email</div>
                      <div className="text-sm text-slate-800">
                        {selectedFaculty.email || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Mobile</div>
                      <div className="text-sm text-slate-800">
                        {selectedFaculty.mobile || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Address</div>
                      <div className="text-sm text-slate-800">
                        {selectedFaculty.address || "Not provided"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-5">
                  <h3 className="text-base font-semibold text-slate-700 mb-4">
                    Employment Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        Department
                      </div>
                      <div className="text-sm text-slate-800">
                        {selectedFaculty.department || "Not assigned"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        Designation
                      </div>
                      <div className="text-sm text-slate-800">
                        {selectedFaculty.designation || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        Faculty Type
                      </div>
                      <div className="text-sm text-slate-800 capitalize">
                        {selectedFaculty.type || "Not specified"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        Date of Joining
                      </div>
                      <div className="text-sm text-slate-800">
                        {selectedFaculty.dateOfJoining || "Not provided"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">
                        Employment Type
                      </div>
                      <div className="text-sm text-slate-800">
                        {selectedFaculty.employmentStatus || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedFaculty(null)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
