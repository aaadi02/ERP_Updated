import { useState, useEffect } from "react";
import { Calendar, MapPin, ChevronDown, User } from "lucide-react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export default function ApproveOnDutyLeave({ userData }) {
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All Requests");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState({});
  const filterOptions = ["All Requests", "Pending", "Approved", "Rejected"];

  useEffect(() => {
    if (!userData?.token) {
      setError("Please log in to view leave requests.");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    const fetchLeaves = async () => {
      try {
        setLoading(true);
        setError("");
        const decoded = jwtDecode(userData.token);
        const employeeId = decoded.employeeId || userData.employeeId;
        const role = (userData.role || decoded.role || "").toLowerCase();
        const department = decoded.department || userData.department || "all";

        if (!employeeId) {
          throw new Error("Employee ID missing from token");
        }

        if (!["hod", "principal"].includes(role)) {
          throw new Error(`Unauthorized role: ${role || "none"}`);
        }

        const endpoint =
          role === "hod"
            ? `http://localhost:5000/api/leave/hod/${encodeURIComponent(
                department
              )}`
            : `http://localhost:5000/api/leave/principal/${encodeURIComponent(
                department
              )}`;

        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${userData.token}` },
        });

        const leaves = response.data
          .filter((leave) => leave.leaveCategory === "OD")
          .map((leave) => ({
            id: leave._id,
            employee: leave.firstName,
            department: leave.department,
            startDate: new Date(leave.startDate).toLocaleDateString("en-US"),
            endDate: new Date(leave.endDate).toLocaleDateString("en-US"),
            days: `${leave.leaveDays} day${leave.leaveDays > 1 ? "s" : ""}`,
            leaveType: leave.leaveType,
            location: `${leave.eventName}, ${leave.location}`,
            status: leave.status,
            hodDecision: leave.hodDecision?.decision || "N/A",
            principalDecision: leave.principalDecision?.decision || "Pending",
          }));

        setLeaveRequests(leaves);
      } catch (err) {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Error fetching leave requests";
        setError(errorMsg);
        console.error("Fetch error:", {
          message: errorMsg,
          status: err.response?.status,
          data: err.response?.data,
        });
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError(`${errorMsg}. Redirecting to login...`);
          setTimeout(() => navigate("/login"), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [userData, navigate]);

  const handleAction = async (leaveId, decision) => {
    if (!userData?.token) {
      setError("Please log in to perform this action.");
      return;
    }

    const commentText = comment[leaveId] || "";
    if (!commentText.trim()) {
      setError("Comment is required for this action.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const decoded = jwtDecode(userData.token);
      const employeeId = decoded.employeeId || userData.employeeId;
      const role = (userData.role || decoded.role || "").toLowerCase();
      const department = decoded.department || userData.department || "all";

      if (!employeeId) {
        throw new Error("Employee ID missing from token");
      }

      const endpoint =
        role === "hod"
          ? `http://localhost:5000/api/leave/hod/${leaveId}`
          : `http://localhost:5000/api/leave/principal/${leaveId}`;

      await axios.put(
        endpoint,
        {
          decision,
          comment: commentText,
          [role === "hod" ? "hodEmployeeId" : "principalEmployeeId"]:
            employeeId,
        },
        { headers: { Authorization: `Bearer ${userData.token}` } }
      );

      // Refresh leaves
      const refreshEndpoint =
        role === "hod"
          ? `http://localhost:5000/api/leave/hod/${encodeURIComponent(
              department
            )}`
          : `http://localhost:5000/api/leave/principal/${encodeURIComponent(
              department
            )}`;
      const response = await axios.get(refreshEndpoint, {
        headers: { Authorization: `Bearer ${userData.token}` },
      });

      const leaves = response.data
        .filter((leave) => leave.leaveCategory === "OD")
        .map((leave) => ({
          id: leave._id,
          employee: leave.firstName,
          department: leave.department,
          startDate: new Date(leave.startDate).toLocaleDateString("en-US"),
          endDate: new Date(leave.endDate).toLocaleDateString("en-US"),
          days: `${leave.leaveDays} day${leave.leaveDays > 1 ? "s" : ""}`,
          leaveType: leave.leaveType,
          location: `${leave.eventName}, ${leave.location}`,
          status: leave.status,
          hodDecision: leave.hodDecision?.decision || "N/A",
          principalDecision: leave.principalDecision?.decision || "Pending",
        }));

      setLeaveRequests(leaves);
      setComment((prev) => ({ ...prev, [leaveId]: "" }));
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        (err.response?.status === 403
          ? `Not authorized to ${decision.toLowerCase()} this leave. ${
              err.response?.data?.details || ""
            }`
          : `Error ${decision.toLowerCase()}ing leave: ${err.message}`);
      setError(errorMsg);
      console.error("Action error:", {
        message: err.message,
        status: err.response?.status,
        data: JSON.stringify(err.response?.data, null, 2),
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaves = leaveRequests.filter((leave) => {
    if (selectedFilter === "All Requests") return true;
    if (selectedFilter === "Pending")
      return leave.status === "Pending" || leave.status === "HOD Approved";
    if (selectedFilter === "Approved")
      return leave.status === "Principal Approved";
    if (selectedFilter === "Rejected")
      return (
        leave.status === "HOD Rejected" || leave.status === "Principal Rejected"
      );
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900 py-4">
          Approve On-Duty Leave Requests
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-md text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded-md text-sm">
            Loading leave requests...
          </div>
        )}

        {/* User Info */}
        {userData?.token && (
          <div className="mb-4 text-sm text-gray-600">
            Logged in as:{" "}
            {jwtDecode(userData.token).employeeId || userData.employeeId} (
            {userData.role || jwtDecode(userData.token).role || "unknown"})
          </div>
        )}

        {/* Filter Dropdown */}
        <div className="relative mb-4">
          <button
            className="w-full sm:w-48 flex items-center justify-between border border-gray-300 rounded-md px-4 py-2 bg-white text-left text-sm"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={loading}
          >
            {selectedFilter}
            <ChevronDown size={16} />
          </button>

          {showDropdown && (
            <div className="absolute z-10 mt-1 w-full sm:w-48 bg-white border border-gray-300 rounded-md shadow-lg">
              {filterOptions.map((option) => (
                <button
                  key={option}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => {
                    setSelectedFilter(option);
                    setShowDropdown(false);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section Title */}
        <div className="bg-white p-4 border-b border-gray-200 mb-4">
          <h2 className="text-lg font-medium text-gray-700">
            OD Leave Requests ({filteredLeaves.length})
          </h2>
        </div>

        {/* Leave Requests List */}
        <div className="space-y-4">
          {filteredLeaves.length === 0 && !loading ? (
            <div className="text-center p-4 text-gray-500">
              No OD leave requests found.
            </div>
          ) : (
            filteredLeaves.map((request) => (
              <div
                key={request.id}
                className="bg-white border border-gray-200 rounded-sm p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <div className="space-y-4">
                    {/* Employee Info */}
                    <div className="flex items-center">
                      <div className="w-5 h-5 mr-2 text-blue-600">
                        <User size={20} />
                      </div>
                      <span className="font-medium text-gray-900">
                        {request.employee}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {request.department}
                      </span>
                    </div>

                    {/* Date Info */}
                    <div className="flex items-center">
                      <div className="w-5 h-5 mr-2 text-gray-500">
                        <Calendar size={20} />
                      </div>
                      <span className="text-sm text-gray-600">
                        {request.startDate} - {request.endDate}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {request.days}
                      </span>
                    </div>

                    {/* Leave Type */}
                    <div>
                      <span className="inline-block text-sm text-blue-600">
                        {request.leaveType}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center">
                      <div className="w-5 h-5 mr-2 text-gray-500">
                        <MapPin size={20} />
                      </div>
                      <span className="text-sm text-gray-600">
                        {request.location}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status.includes("Approved")
                            ? "bg-green-100 text-green-800"
                            : request.status.includes("Rejected")
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {request.status}
                      </span>
                      <span className="ml-2 text-xs text-gray-600">
                        HOD: {request.hodDecision}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {((userData.role?.toLowerCase() === "hod" &&
                    request.hodDecision === "Pending") ||
                    (userData.role?.toLowerCase() === "principal" &&
                      request.principalDecision === "Pending" &&
                      (request.status === "HOD Approved" ||
                        request.hodDecision === "N/A"))) && (
                    <div className="flex flex-col mt-4 sm:mt-0 space-y-2">
                      <input
                        type="text"
                        placeholder="Enter comment"
                        value={comment[request.id] || ""}
                        onChange={(e) =>
                          setComment((prev) => ({
                            ...prev,
                            [request.id]: e.target.value,
                          }))
                        }
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                        disabled={loading}
                      />
                      <div className="flex space-x-2">
                        <button
                          className="px-4 py-2 border border-red-200 rounded-md text-red-600 hover:bg-red-50 flex items-center justify-center"
                          onClick={() => handleAction(request.id, "Rejected")}
                          disabled={loading}
                        >
                          <span className="mr-1">•</span> Reject
                        </button>
                        <button
                          className="px-4 py-2 bg-green-600 rounded-md text-white hover:bg-green-700 flex items-center justify-center"
                          onClick={() => handleAction(request.id, "Approved")}
                          disabled={loading}
                        >
                          <span className="mr-1">✓</span> Approve
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
