import React, { useEffect, useState } from "react";
import { UserX, UserCheck, Save, Trash2, RefreshCw, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RoleAssignmentManager = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const employmentStatuses = ["Probation Period", "Permanent Employee"];
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError("Please log in to access this page.");
      navigate("/faculty/rolelogin");
      return;
    }
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "http://localhost:5000/api/faculty?type=Non-Teaching",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please log in again.");
        }
        throw new Error(`Failed to fetch faculty data: ${response.statusText}`);
      }

      const data = await response.json();

      // Log response for debugging
      console.log("API Response:", data);

      // Handle different response structures
      let facultyArray = Array.isArray(data) ? data : data.data || [];

      if (!Array.isArray(facultyArray)) {
        throw new Error(
          "Expected an array of faculty, but received a non-array response"
        );
      }

      // Add editable status field
      const withEditable = facultyArray.map((faculty) => ({
        ...faculty,
        updatedStatus: faculty.employmentStatus || "Probation Period",
        isEditing: false,
      }));

      setFacultyList(withEditable);
    } catch (err) {
      console.error("Error fetching faculty:", err);
      setError(err.message || "Failed to load faculty data. Please try again.");
      if (err.message.includes("Unauthorized")) {
        localStorage.removeItem("token");
        localStorage.removeItem("faculty");
        navigate("/faculty/rolelogin");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (id, value) => {
    setFacultyList((prev) =>
      prev.map((faculty) =>
        faculty._id === id
          ? { ...faculty, updatedStatus: value, isEditing: true }
          : faculty
      )
    );
  };

  const handleSave = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: "save" }));
    setError(null);
    setSuccess(null);
    const faculty = facultyList.find((f) => f._id === id);
    try {
      const response = await fetch(
        `http://localhost:5000/api/faculty/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employmentStatus: faculty.updatedStatus,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please log in again.");
        }
        throw new Error("Failed to update status");
      }

      setFacultyList((prev) =>
        prev.map((f) =>
          f._id === id
            ? { ...f, employmentStatus: f.updatedStatus, isEditing: false }
            : f
        )
      );
      setSuccess(`Status updated for ${faculty.firstName}.`);
    } catch (err) {
      console.error("Error updating status:", err);
      setError(err.message);
      if (err.message.includes("Unauthorized")) {
        localStorage.removeItem("token");
        localStorage.removeItem("faculty");
        navigate("/faculty/rolelogin");
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this faculty member?"))
      return;
    setActionLoading((prev) => ({ ...prev, [id]: "delete" }));
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(
        `http://localhost:5000/api/faculty/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please log in again.");
        }
        throw new Error("Failed to delete faculty");
      }

      setFacultyList(facultyList.filter((f) => f._id !== id));
      setSuccess("Faculty member deleted successfully.");
    } catch (err) {
      console.error("Error deleting faculty:", err);
      setError(err.message);
      if (err.message.includes("Unauthorized")) {
        localStorage.removeItem("token");
        localStorage.removeItem("faculty");
        navigate("/faculty/rolelogin");
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const getStatusBadgeColor = (status) => {
    return status === "Permanent Employee"
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-500 mb-4" />
          <p className="text-gray-600">Loading faculty data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Users className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-semibold text-gray-800">
            Non-Teaching Faculty Management
          </h2>
        </div>
        <button
          onClick={fetchFaculty}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-200 text-green-700 rounded-md">
          {success}
        </div>
      )}

      {facultyList.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No non-teaching faculty members found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {facultyList.map((faculty) => (
                <tr
                  key={faculty._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                                            {/* {faculty.firstname} */}

                      {faculty.firstName + " "}
                      {faculty.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-700">{faculty.employeeId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-700">{faculty.designation}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-700">
                      {faculty.department || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <select
                        value={faculty.updatedStatus}
                        onChange={(e) =>
                          handleStatusChange(faculty._id, e.target.value)
                        }
                        className={`form-select rounded border ${
                          faculty.isEditing
                            ? "border-blue-300 ring-1 ring-blue-200"
                            : "border-gray-300"
                        } focus:border-blue-500 focus:ring-blue-500 p-2 w-full`}
                        disabled={actionLoading[faculty._id]}
                      >
                        {employmentStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      {!faculty.isEditing && (
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            faculty.employmentStatus
                          )} border`}
                        >
                          {faculty.employmentStatus === "Permanent Employee" ? (
                            <UserCheck className="w-3 h-3 mr-1" />
                          ) : (
                            <UserX className="w-3 h-3 mr-1" />
                          )}
                          {faculty.employmentStatus || "Probation Period"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSave(faculty._id)}
                        disabled={
                          !faculty.isEditing || actionLoading[faculty._id]
                        }
                        className={`inline-flex items-center px-3 py-1.5 rounded-md ${
                          faculty.isEditing && !actionLoading[faculty._id]
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        } transition-colors`}
                      >
                        {actionLoading[faculty._id] === "save" ? (
                          <RefreshCw className="animate-spin h-4 w-4 mr-1" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={() => handleDelete(faculty._id)}
                        disabled={actionLoading[faculty._id]}
                        className={`inline-flex items-center px-3 py-1.5 rounded-md ${
                          !actionLoading[faculty._id]
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        } transition-colors`}
                      >
                        {actionLoading[faculty._id] === "delete" ? (
                          <RefreshCw className="animate-spin h-4 w-4 mr-1" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RoleAssignmentManager;
