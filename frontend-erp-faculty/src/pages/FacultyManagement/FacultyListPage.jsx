import { useState, useEffect } from "react";
import {
  Search,
  Clock,
  Briefcase,
  UserCheck,
  User,
  X,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Award,
  Users,
  BookOpenCheck,
  Building,
  ArrowLeft,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { fetchDepartments } from "../../utils/departmentUtils";

export default function FacultyDashboard() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [expandedFaculty, setExpandedFaculty] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [assignMode, setAssignMode] = useState("none");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    createdDate: new Date().toISOString().split("T")[0],
    notes: "",
    facultyId: "",
    role: "",
  });
  const [hodHistory, setHodHistory] = useState({});
  const [principalHistory, setPrincipalHistory] = useState([]);
  const [viewMode, setViewMode] = useState("dashboard");
  const [isAssignDropdownOpen, setIsAssignDropdownOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState(null);
  const [academicDepartments, setAcademicDepartments] = useState([]);

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
        const facultyData = Array.isArray(data.data?.faculties)
          ? data.data.faculties
          : [];
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

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const hodResponse = await fetch(
          "http://localhost:5000/api/faculty/hod-history"
        );
        const principalResponse = await fetch(
          "http://localhost:5000/api/faculty/principal-history"
        );
        if (hodResponse.ok) {
          const hodData = await hodResponse.json();
          setHodHistory(hodData.data || {});
        } else {
          console.warn("Failed to fetch HOD history:", hodResponse.status);
        }
        if (principalResponse.ok) {
          const principalData = await principalResponse.json();
          setPrincipalHistory(principalData.data || []);
        } else {
          console.warn(
            "Failed to fetch Principal history:",
            principalResponse.status
          );
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };

    fetchHistory();
  }, []);

  // Fetch academic departments for HOD assignment dropdown
  useEffect(() => {
    const loadAcademicDepartments = async () => {
      try {
        const result = await fetchDepartments();
        if (result.success) {
          console.log('Academic departments fetched for HOD assignment:', result.departments);
          setAcademicDepartments(result.departments);
        } else {
          console.error('Failed to fetch academic departments:', result.error);
          setAcademicDepartments([]);
        }
      } catch (error) {
        console.error('Error fetching academic departments:', error);
        setAcademicDepartments([]);
      }
    };
    
    loadAcademicDepartments();
  }, []);

  const departments = [
    ...new Set(faculties.map((faculty) => faculty.department)),
  ].filter(Boolean);

  const filteredFaculties = faculties.filter((faculty) => {
    const matchesSearch =
      faculty.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === "all" ||
      faculty.type === filterType ||
      (filterType === "teaching" && faculty.type === "hod") ||
      (filterType === "non-teaching" && faculty.type === "principal");
    const matchesDepartment =
      filterDepartment === "all" || faculty.department === filterDepartment;

    return matchesSearch && matchesType && matchesDepartment;
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
    setViewMode("details");
  };

  const closeView = () => {
    setViewMode("dashboard");
    setSelectedFaculty(null);
    setShowAssignForm(false);
    setAssignMode("none");
    setShowDeleteModal(false);
    setFacultyToDelete(null);
  };

  const handleOpenHodPrincipalView = () => {
    setViewMode("hodPrincipal");
  };

  const handleDeleteFaculty = async (facultyId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/faculty/delete/${facultyId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      const result = await response.json();
      if (!response.ok) {
        alert(result.message || "Failed to delete faculty");
        return;
      }
      setFaculties((prev) => prev.filter((f) => f._id !== facultyId));
      setShowDeleteModal(false);
      setFacultyToDelete(null);
      if (selectedFaculty && selectedFaculty._id === facultyId) {
        closeView();
      }
      alert("Faculty deleted successfully");
    } catch (err) {
      console.error("Delete faculty error:", err);
      alert(`Error deleting faculty: ${err.message}`);
    }
  };

  const handleAssignFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.facultyId) {
      alert("Please select a faculty member.");
      return;
    }

    const selectedFacultyForAssignment = faculties.find(
      (f) => f._id === formData.facultyId
    );

    if (!selectedFacultyForAssignment) {
      alert("Selected faculty not found.");
      return;
    }

    // Validate that only teaching faculty can be assigned
    if (selectedFacultyForAssignment.type !== "teaching") {
      alert("Only teaching faculty can be assigned as HOD or Principal.");
      return;
    }

    // Prevent multiple HODs in one department
    if (formData.role === "hod") {
      const alreadyHod = faculties.find(
        (f) => f.department === selectedDepartment && f.role === "hod" && f._id !== formData.facultyId
      );
      if (alreadyHod) {
        alert(
          `There is already a HOD assigned for ${selectedDepartment}: ${alreadyHod.firstName}. Please remove or reassign the current HOD before assigning a new one.`
        );
        return;
      }
    }

    // Principal assignment validation - only one principal allowed
    if (formData.role === "principal") {
      const currentPrincipal = faculties.find(
        (f) => f.role === "principal" && f._id !== formData.facultyId
      );
      if (currentPrincipal) {
        alert(
          `There is already a Principal assigned: ${currentPrincipal.firstName}. Please remove the current Principal before assigning a new one.`
        );
        return;
      }

      // Additional validation for Principal - should not already be HOD
      if (selectedFacultyForAssignment.role === "hod") {
        alert("This faculty member is already assigned as HOD. A person cannot be both HOD and Principal.");
        return;
      }

      if (!formData.reason || !formData.createdDate) {
        alert("Reason and Created Date are required for Principal assignment.");
        return;
      }
    }
    try {
      setFormLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/faculty/assign-${formData.role}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            department:
              formData.role === "hod" ? selectedDepartment : undefined,
          }),
        }
      );
      if (!response.ok) {
        throw new Error(
          `Failed to assign ${formData.role}: ${response.statusText}`
        );
      }
      const data = await response.json();
      setFaculties((prev) =>
        prev.map((f) => {
          // Assign the new HOD
          if (f._id === formData.facultyId) {
            return { ...f, role: formData.role, type: formData.role };
          }
          // Remove HOD role only from the same department
          if (
            formData.role === "hod" &&
            f.department === selectedDepartment &&
            f.role === "hod"
          ) {
            return { ...f, role: null, type: "teaching" };
          }
          // Remove Principal role globally (since only one principal exists)
          if (formData.role === "principal" && f.role === "principal") {
            return { ...f, role: null, type: "teaching" };
          }
          // No changes for other faculties
          return f;
        })
      );
      const assignedFaculty = faculties.find(
        (f) => f._id === formData.facultyId
      );
      const assignedName = assignedFaculty
        ? assignedFaculty.firstName
        : "Unknown";
      if (formData.role === "hod") {
        setHodHistory((prev) => ({
          ...prev,
          [selectedDepartment]: [
            ...(prev[selectedDepartment] || []),
            {
              facultyId: formData.facultyId,
              name: assignedName,
              startDate: formData.createdDate,
              reason: formData.reason,
              notes: formData.notes,
            },
          ],
        }));
      } else if (formData.role === "principal") {
        setPrincipalHistory((prev) => [
          ...prev,
          {
            facultyId: formData.facultyId,
            name: assignedName,
            startDate: formData.createdDate,
            reason: formData.reason,
            notes: formData.notes,
          },
        ]);
      }
      setShowAssignForm(false);
      setAssignMode("none");
      setFormData({
        reason: "",
        createdDate: new Date().toISOString().split("T")[0],
        notes: "",
        facultyId: "",
        role: "",
      });
      alert(
        `${
          formData.role === "hod" ? "HOD" : "Principal"
        } assigned successfully!`
      );
    } catch (err) {
      console.error("Assignment error:", err);
      alert(`Assignment error: ${err}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveHod = async (facultyId, department) => {
    try {
      // Optionally, you can call a backend endpoint to remove HOD role
      const response = await fetch(
        `http://localhost:5000/api/faculty/remove-hod/${facultyId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department }),
        }
      );
      const result = await response.json();
      if (!response.ok) {
        alert(result.message || "Failed to remove HOD");
        return;
      }
      setFaculties((prev) =>
        prev.map((f) =>
          f._id === facultyId ? { ...f, role: null, type: "teaching" } : f
        )
      );
      // Optionally update HOD history here
      alert("HOD removed successfully");
    } catch (err) {
      console.error("Remove HOD error:", err);
      alert(`Error removing HOD: ${err.message}`);
    }
  };

  const handleRemovePrincipal = async (facultyId) => {
    try {
      const confirmRemoval = window.confirm("Are you sure you want to remove this Principal?");
      if (!confirmRemoval) return;

      const response = await fetch(
        `http://localhost:5000/api/faculty/remove-principal/${facultyId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
        }
      );
      const result = await response.json();
      if (!response.ok) {
        alert(result.message || "Failed to remove Principal");
        return;
      }

      setFaculties((prev) =>
        prev.map((f) =>
          f._id === facultyId ? { ...f, role: null, type: "teaching" } : f
        )
      );
      
      // Update principal history if needed
      setPrincipalHistory((prev) => [
        ...prev,
        {
          facultyId: facultyId,
          endDate: new Date().toISOString().split("T")[0],
          reason: "Removed from Principal role",
        },
      ]);
      
      alert("Principal removed successfully");
    } catch (err) {
      console.error("Remove Principal error:", err);
      alert(`Error removing Principal: ${err.message}`);
    }
  };

  const clearHistory = () => {
    setHodHistory({});
    setPrincipalHistory([]);
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-gradient-to-br from-purple-500 to-indigo-600",
      "bg-gradient-to-br from-blue-500 to-cyan-600",
      "bg-gradient-to-br from-emerald-500 to-teal-600",
      "bg-gradient-to-br from-orange-500 to-amber-600",
      "bg-gradient-to-br from-pink-500 to-rose-600",
    ];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
  };

  const getInitials = (name) => {
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-base font-semibold text-slate-700">
            Loading faculty data...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100 max-w-sm">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 text-red-500">
            <X className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-center text-red-600 mb-2">
            Error
          </h2>
          <div className="text-slate-600 text-sm text-center">{error}</div>
          <button
            className="mt-4 w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
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
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg mb-6 border border-purple-100 shadow-sm">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            Faculty Dashboard
          </h1>
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center border border-indigo-50">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 text-indigo-500 mb-4">
              <Users className="h-8 w-8" />
            </div>
            <div className="text-slate-800 text-xl font-semibold mb-2">
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

  const FacultyCard = ({ faculty, buttons }) => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-indigo-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-4 flex justify-between items-start gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex-shrink-0 w-10 h-10 ${getAvatarColor(
              faculty.firstName
            )} rounded-lg flex items-center justify-center text-white font-bold text-base shadow-md`}
          >
            {getInitials(faculty.firstName)}
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">
              {faculty.firstName}
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-1 text-xs">
              <span className="inline-flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                {faculty.employeeId || "N/A"}
              </span>
              {faculty.designation && (
                <span className="inline-flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {faculty.designation}
                </span>
              )}
              {faculty.department && (
                <span className="inline-flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {faculty.department}
                </span>
              )}
              {faculty.role && (
                <span className="inline-flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  {faculty.role.charAt(0).toUpperCase() + faculty.role.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="flex flex-col gap-2">{buttons}</div>
        </div>
      </div>
    </div>
  );

  const AssignmentForm = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-indigo-600">
          Assign {formData.role === "hod" ? "HOD" : "Principal"}
        </h2>
        <button
          onClick={closeView}
          className="p-1 rounded-full hover:bg-indigo-100 transition-colors"
          disabled={formLoading}
        >
          <X className="h-5 w-5 text-indigo-600" />
        </button>
      </div>
      <form onSubmit={handleAssignFormSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Select Faculty <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={formData.facultyId}
            onChange={(e) =>
              setFormData({ ...formData, facultyId: e.target.value })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            disabled={formLoading}
          >
            <option value="">
              Select {formData.role === "hod" ? "HOD" : "Principal"}
            </option>
            {faculties
              .filter((faculty) => {
                // Only show teaching faculty
                if (faculty.type !== "teaching") return false;
                
                // For HOD assignment, filter by department and exclude current HODs of that department
                if (formData.role === "hod") {
                  if (faculty.department !== selectedDepartment) return false;
                  if (faculty.role === "hod") return false;
                }
                
                // For Principal assignment, exclude current principals and HODs
                if (formData.role === "principal") {
                  if (faculty.role === "principal" || faculty.role === "hod") return false;
                }
                
                return true;
              })
              .map((faculty) => (
                <option key={faculty._id} value={faculty._id}>
                  {faculty.firstName} ({faculty.employeeId}) - {faculty.department}
                </option>
              ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {formData.role === "hod" 
              ? `Only teaching faculty from ${selectedDepartment} department are shown`
              : "Only teaching faculty (excluding current HODs) are shown"}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Reason for Assignment <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            rows="3"
            disabled={formLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Created Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.createdDate}
            onChange={(e) =>
              setFormData({ ...formData, createdDate: e.target.value })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            disabled={formLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            rows="2"
            disabled={formLoading}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={closeView}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm"
            disabled={formLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm"
            disabled={formLoading}
          >
            {formLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            Submit
          </button>
        </div>
      </form>
    </div>
  );

  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-red-100 shadow-lg">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 text-red-500">
          <Trash2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-center text-red-600 mb-2">
          Confirm Deletion
        </h2>
        <p className="text-sm text-slate-600 text-center mb-4">
          Are you sure you want to delete {facultyToDelete?.firstName}'s record?
          This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDeleteFaculty(facultyToDelete._id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  const FacultyDetails = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`flex-shrink-0 w-8 h-8 ${getAvatarColor(
              selectedFaculty.firstName
            )} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md`}
          >
            {getInitials(selectedFaculty.firstName)}
          </div>
          <h2 className="text-lg font-semibold text-indigo-600">
            {selectedFaculty.firstName}
          </h2>
        </div>
        <button
          onClick={closeView}
          className="p-1 rounded-full hover:bg-indigo-100 transition-colors"
        >
          <X className="h-5 w-5 text-indigo-600" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
          <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <Mail className="h-4 w-4 text-indigo-500" />
            Contact Information
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-indigo-500" />
              <span>{selectedFaculty.email || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3 text-indigo-500" />
              <span>{selectedFaculty.mobile || "N/A"}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-3 w-3 text-indigo-500" />
              <span>{selectedFaculty.address || "N/A"}</span>
            </div>
          </div>
          <h4 className="text-sm font-semibold text-slate-800 mt-4 mb-2 flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-500" />
            Personal Details
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-indigo-500" />
              <span>{selectedFaculty.gender || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-indigo-500" />
              <span>{selectedFaculty.dateOfBirth || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-3 w-3 text-indigo-500" />
              <span>{selectedFaculty.aadhaar || "N/A"}</span>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
          <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-indigo-500" />
            Employment Details
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-indigo-500" />
              <span>{selectedFaculty.dateOfJoining || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-3 w-3 text-indigo-500" />
              <span>{selectedFaculty.employmentStatus || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-indigo-500" />
              <span>{selectedFaculty.teachingExperience || "0"} years</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-3 w-3 text-indigo-500" />
              <span>{selectedFaculty.reportingOfficer || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-indigo-500" />
              <span>{selectedFaculty.shiftTiming || "N/A"}</span>
            </div>
          </div>
          {(selectedFaculty.type === "teaching" ||
            selectedFaculty.type === "hod") && (
            <>
              <h4 className="text-sm font-semibold text-slate-800 mt-4 mb-2 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-indigo-500" />
                Teaching Details
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <Users className="h-3 w-3 text-indigo-500" />
                  <span>{selectedFaculty.classIncharge || "N/A"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <BookOpenCheck className="h-3 w-3 text-indigo-500" />
                  <div>
                    {selectedFaculty.subjectsTaught &&
                    selectedFaculty.subjectsTaught.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedFaculty.subjectsTaught.map((subject, idx) => (
                          <span
                            key={idx}
                            className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-xs"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="mt-4 bg-slate-50 rounded-lg p-4 border border-slate-100">
        <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
          <Award className="h-4 w-4 text-indigo-500" />
          Skills & Publications
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <h5 className="text-xs font-medium text-slate-700 mb-2">
              Technical Skills
            </h5>
            <div className="flex flex-wrap gap-1">
              {selectedFaculty.technicalSkills &&
              selectedFaculty.technicalSkills.length > 0 ? (
                selectedFaculty.technicalSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-white text-slate-800 px-2 py-0.5 rounded-md shadow-sm border border-slate-200"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-slate-500 italic">No skills listed</span>
              )}
            </div>
          </div>
          <div>
            <h5 className="text-xs font-medium text-slate-700 mb-2">
              Research Publications
            </h5>
            {selectedFaculty.researchPublications &&
            selectedFaculty.researchPublications.length > 0 ? (
              <ul className="space-y-1">
                {selectedFaculty.researchPublications.map((pub, index) => (
                  <li
                    key={index}
                    className="bg-white p-2 rounded-md shadow-sm border border-slate-200 text-xs"
                  >
                    {pub}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">No publications listed</p>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={() => {
            setFacultyToDelete(selectedFaculty);
            setShowDeleteModal(true);
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Delete Faculty
        </button>
        <button
          onClick={closeView}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          Back
        </button>
      </div>
    </div>
  );

  const HODsAndPrincipalView = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-indigo-50 p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-indigo-600">
          Principal & HODs
        </h2>
        <button
          onClick={closeView}
          className="p-1 rounded-full hover:bg-indigo-100 transition-colors"
        >
          <X className="h-5 w-5 text-indigo-600" />
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-2 text-slate-800 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-indigo-500" />
            Current Principal
          </h3>
          {(() => {
            const principal = faculties.find((f) => f.role === "principal");
            return principal ? (
              <FacultyCard
                faculty={principal}
                buttons={
                  <>
                    <button
                      onClick={() => handleViewDetails(principal)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs w-full"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleRemovePrincipal(principal._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs w-full mt-1"
                    >
                      Remove Principal
                    </button>
                  </>
                }
              />
            ) : (
              <p className="text-slate-500 text-xs">No Principal assigned</p>
            );
          })()}
        </div>
        <div>
          <h3 className="text-sm font-semibold mb-2 text-slate-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            Current HODs
          </h3>
          {departments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((dept) => {
                const hod = faculties.find(
                  (f) => f.department === dept && f.role === "hod"
                );
                return hod ? (
                  <FacultyCard
                    key={dept}
                    faculty={hod}
                    buttons={
                      <button
                        onClick={() => handleViewDetails(hod)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs w-full"
                      >
                        View Details
                      </button>
                    }
                  />
                ) : (
                  <div
                    key={dept}
                    className="bg-slate-50 p-3 rounded-lg border border-slate-100"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 ${getAvatarColor(
                          dept
                        )} rounded-lg flex items-center justify-center text-white font-bold text-xs`}
                      >
                        {dept[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-slate-800">
                          {dept}
                        </p>
                        <p className="text-xs text-slate-600">
                          No HOD assigned
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-xs">No departments available</p>
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={closeView}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg mb-6 border border-purple-100 shadow-sm">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            Faculty Dashboard
          </h1>
          <button
            onClick={clearHistory}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-semibold border border-red-200"
            style={{ marginLeft: "auto" }}
          >
            Clear HOD/Principal History
          </button>
        </div>
        {viewMode === "dashboard" && (
          <>
            <div className="flex items-center gap-2 text-xs mb-4">
              <div className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                Total: {faculties.length}
              </div>
              <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                Teaching:{" "}
                {
                  faculties.filter(
                    (f) => f.type === "teaching" || f.type === "hod"
                  ).length
                }
              </div>
              <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                Non-Teaching:{" "}
                {
                  faculties.filter(
                    (f) => f.type === "non-teaching" || f.type === "principal"
                  ).length
                }
              </div>
            </div>
            <div className="mb-6 bg-white p-4 rounded-2xl shadow-lg border border-indigo-50">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-indigo-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, email or ID..."
                    className="w-full max-w-md pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-700">
                        Staff Type & Department
                      </label>
                      <div className="flex gap-2 items-center">
                        <select
                          className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                        >
                          <option value="all">All Types</option>
                          <option value="teaching">Teaching</option>
                          <option value="non-teaching">Non-Teaching</option>
                        </select>
                        <select
                          className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
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
                  <div className="ml-auto flex gap-2 items-center flex-wrap">
                    <button
                      onClick={() => handleOpenHodPrincipalView()}
                      className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs flex items-center gap-2"
                    >
                      <UserCheck className="h-4 w-4" />
                      View HODs & Principal
                    </button>
                    <div className="relative">
                      <button
                        onClick={() =>
                          setIsAssignDropdownOpen(!isAssignDropdownOpen)
                        }
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs flex items-center gap-2"
                      >
                        <Users className="h-4 w-4" />
                        Assign
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      {isAssignDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-indigo-50 z-10">
                          <button
                            onClick={() => {
                              setAssignMode("hod");
                              setViewMode("assign");
                              setIsAssignDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          >
                            Assign HOD
                          </button>
                          <button
                            onClick={() => {
                              setAssignMode("principal");
                              setViewMode("assign");
                              setIsAssignDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          >
                            Assign Principal
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-4 flex justify-between items-center">
              <p className="text-slate-600 font-medium text-xs">
                Showing{" "}
                <span className="text-indigo-600">
                  {filteredFaculties.length}
                </span>{" "}
                of <span className="text-indigo-600">{faculties.length}</span>{" "}
                faculty members
              </p>
            </div>
            {filteredFaculties.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl shadow-lg text-center border border-indigo-50">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-amber-500 mb-4">
                  <Search className="h-8 w-8" />
                </div>
                <p className="text-slate-700 text-base font-medium mb-2">
                  No faculty members found
                </p>
                <p className="text-slate-500 text-xs">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFaculties.map((faculty) => (
                  <FacultyCard
                    key={faculty._id}
                    faculty={faculty}
                    buttons={
                      <>
                        <button
                          onClick={() => handleViewDetails(faculty)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs w-full"
                        >
                          View Details
                        </button>
                        {(faculty.type === "teaching" ||
                          faculty.type === "hod") && (
                          <button className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs w-full">
                            Teaching
                          </button>
                        )}
                        {(faculty.type === "non-teaching" ||
                          faculty.type === "principal") && (
                          <button className="px-3 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-xs w-full">
                            Non-Teaching
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setFacultyToDelete(faculty);
                            setShowDeleteModal(true);
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs w-full"
                        >
                          Delete
                        </button>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
        {viewMode === "assign" && assignMode === "hod" && (
          <div className="mb-6 bg-white p-4 rounded-2xl shadow-lg border border-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                HOD Assignment
              </h2>
              <button
                onClick={closeView}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Dashboard
              </button>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-xs font-medium text-slate-700">
                Select Department:
              </label>
              <select
                className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="all">Select Department</option>
                {academicDepartments.length > 0 ? (
                  academicDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading departments...</option>
                )}
              </select>
            </div>
            {selectedDepartment !== "all" && (
              <>
                {showAssignForm && <AssignmentForm />}
                {!showAssignForm && (
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <h3 className="text-base font-semibold mb-3 text-slate-800">
                        Teaching Faculty in {selectedDepartment}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* UX improvement: Disable Assign HOD if department already has a HOD */}
                        {(() => {
                          const currentHod = faculties.find(
                            (f) =>
                              f.department === selectedDepartment &&
                              f.role === "hod"
                          );
                          if (currentHod) {
                            return (
                              <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm font-medium flex items-center gap-2">
                                <Award className="h-5 w-5 text-yellow-500" />
                                <span>
                                  {selectedDepartment} already has a HOD
                                  assigned (
                                  <b>
                                    {currentHod.firstName} {currentHod.lastName}
                                  </b>
                                  ). Remove the current HOD before assigning a
                                  new one.
                                </span>
                              </div>
                            );
                          }
                          return filteredFaculties
                            .filter(
                              (f) =>
                                f.department === selectedDepartment &&
                                f.type === "teaching" &&
                                f.role !== "hod" &&
                                f.role !== "principal"
                            )
                            .map((faculty) => (
                              <FacultyCard
                                key={faculty._id}
                                faculty={faculty}
                                buttons={
                                  <button
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        facultyId: faculty._id,
                                        role: "hod",
                                      });
                                      setShowAssignForm(true);
                                    }}
                                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs w-full"
                                  >
                                    Assign HOD
                                  </button>
                                }
                              />
                            ));
                        })()}
                        {filteredFaculties.filter(
                          (f) =>
                            f.department === selectedDepartment &&
                            (f.type === "teaching" || f.type === "hod")
                        ).length === 0 && (
                          <p className="text-slate-500 text-xs">
                            No teaching faculty available in{" "}
                            {selectedDepartment}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold mb-3 text-slate-800">
                        Current HOD
                      </h3>
                      {(() => {
                        const currentHod = faculties.find(
                          (f) =>
                            f.department === selectedDepartment &&
                            f.role === "hod"
                        );
                        return currentHod ? (
                          <FacultyCard
                            faculty={currentHod}
                            buttons={
                              <>
                                <button
                                  onClick={() => handleViewDetails(currentHod)}
                                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs w-full"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() =>
                                    handleRemoveHod(
                                      currentHod._id,
                                      selectedDepartment
                                    )
                                  }
                                  className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs w-full mt-1"
                                >
                                  Remove HOD
                                </button>
                              </>
                            }
                          />
                        ) : (
                          <p className="text-slate-500 text-xs">
                            No current HOD assigned
                          </p>
                        );
                      })()}
                      <h3 className="text-base font-semibold mb-3 text-slate-800 mt-6">
                        HOD History
                      </h3>
                      {hodHistory[selectedDepartment]?.length > 0 ? (
                        <ul className="space-y-2">
                          {hodHistory[selectedDepartment].map(
                            (entry, index) => (
                              <li
                                key={index}
                                className="bg-slate-50 p-3 rounded-lg border border-slate-100"
                              >
                                <p className="font-medium text-sm text-slate-800">
                                  {entry.name}
                                </p>
                                <p className="text-xs text-slate-600">
                                  Period: {entry.startDate} -{" "}
                                  {entry.endDate || "Present"}
                                </p>
                                <p className="text-xs text-slate-600">
                                  Reason: {entry.reason}
                                </p>
                                {entry.notes && (
                                  <p className="text-xs text-slate-600">
                                    Notes: {entry.notes}
                                  </p>
                                )}
                              </li>
                            )
                          )}
                        </ul>
                      ) : (
                        <p className="text-slate-500 text-xs">
                          No HOD history available
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {viewMode === "assign" && assignMode === "principal" && (
          <div className="mb-6 bg-white p-4 rounded-2xl shadow-lg border border-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                Principal Assignment
              </h2>
              <button
                onClick={closeView}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Dashboard
              </button>
            </div>
            {showAssignForm && <AssignmentForm />}
            {!showAssignForm && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h3 className="text-base font-semibold mb-3 text-slate-800">
                    Teaching Faculty
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFaculties
                      .filter(
                        (f) =>
                          (f.type === "teaching" || f.type === "hod") &&
                          f.designation &&
                          f.designation.trim().toLowerCase() === "professor"
                      )
                      .map((faculty) => (
                        <FacultyCard
                          key={faculty._id}
                          faculty={faculty}
                          buttons={
                            <>
                              <button
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    facultyId: faculty._id,
                                    role: "principal",
                                  });
                                  setShowAssignForm(true);
                                }}
                                className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs w-full"
                              >
                                Assign Principal
                              </button>
                              {faculty.role === "principal" && (
                                <button
                                  onClick={() => handleViewDetails(faculty)}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs w-full"
                                >
                                  View Principal
                                </button>
                              )}
                            </>
                          }
                        />
                      ))}
                    {filteredFaculties.filter(
                      (f) =>
                        (f.type === "teaching" || f.type === "hod") &&
                        f.designation &&
                        f.designation.trim().toLowerCase() === "professor"
                    ).length === 0 && (
                      <p className="text-slate-500 text-xs">
                        No professor available
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-3 text-slate-800">
                    Current Principal
                  </h3>
                  {faculties.find((f) => f.role === "principal") ? (
                    <FacultyCard
                      faculty={faculties.find((f) => f.role === "principal")}
                      buttons={
                        <button
                          onClick={() =>
                            handleViewDetails(
                              faculties.find((f) => f.role === "principal")
                            )
                          }
                          className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs w-full"
                        >
                          View Details
                        </button>
                      }
                    />
                  ) : (
                    <p className="text-slate-500 text-xs">
                      No current Principal assigned
                    </p>
                  )}
                  <h3 className="text-base font-semibold mb-3 text-slate-800 mt-6">
                    Principal History
                  </h3>
                  {principalHistory.length > 0 ? (
                    <ul className="space-y-2">
                      {principalHistory.map((entry, index) => (
                        <li
                          key={index}
                          className="bg-slate-50 p-3 rounded-lg border border-slate-100"
                        >
                          <p className="font-medium text-sm text-slate-800">
                            {entry.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            Period: {entry.startDate} -{" "}
                            {entry.endDate || "Present"}
                          </p>
                          <p className="text-xs text-slate-600">
                            Reason: {entry.reason}
                          </p>
                          {entry.notes && (
                            <p className="text-xs text-slate-600">
                              Notes: {entry.notes}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 text-xs">
                      No Principal history available
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {viewMode === "details" && selectedFaculty && <FacultyDetails />}
        {viewMode === "hodPrincipal" && <HODsAndPrincipalView />}
        {showDeleteModal && <DeleteConfirmationModal />}
      </div>
    </div>
  );
}
