import { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const ApproveLeaveByPrincipal = ({ userData }) => {
  const navigate = useNavigate();
  const [department, setDepartment] = useState("All Departments");
  const [viewMode, setViewMode] = useState("pending"); // "pending" or "all"
  const [leaves, setLeaves] = useState([]);
  const [decision, setDecision] = useState({
    leaveId: "",
    decision: "Approved",
    comment: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const departments = [
    "All Departments",
    "Computer Science",
    "Mechanical",
    "Electronics",
    "Civil",
    "Data Science",
    "Information Technology",
    "Electrical",
  ];

  useEffect(() => {
    const fetchLeaves = async () => {
      if (!userData?.token) {
        setMessage("Authentication token missing. Please log in.");
        console.error("No token provided in userData");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/leave/principal/all`,
          {
            headers: {
              Authorization: `Bearer ${userData.token}`,
            },
          }
        );
        
        // Filter by selected department and view mode
        const allLeaves = Array.isArray(response.data) ? response.data : [];
        
        let filteredByStatus;
        if (viewMode === "pending") {
          // Only show requests that are actually pending principal approval
          filteredByStatus = allLeaves.filter(leave => 
            leave.status === "HOD Approved" || 
            (leave.status === "Pending" && leave.type !== "Faculty")
          );
        } else {
          // Show all requests (including processed ones)
          filteredByStatus = allLeaves;
        }
        
        const filteredLeaves = department === "All Departments" 
          ? filteredByStatus 
          : filteredByStatus.filter(leave => leave.department === department);
        
        setLeaves(filteredLeaves);
        setMessage(
          filteredLeaves.length === 0
            ? `No ${viewMode === "pending" ? "pending" : ""} leave requests for ${department === "All Departments" ? "any department" : department}.`
            : ""
        );
      } catch (error) {
        const errorMsg =
          error.response?.data?.message || "Error fetching leave requests";
        setMessage(errorMsg);
        console.error("Fetch error:", {
          message: errorMsg,
          status: error.response?.status,
          data: error.response?.data,
        });
        if (error.response?.status === 401 || error.response?.status === 403) {
          setTimeout(() => navigate("/login"), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, [department, viewMode, userData?.token, navigate]);

  const handleDecision = async (e) => {
    e.preventDefault();
    if (!decision.leaveId) {
      setMessage("Please select a leave request to review");
      return;
    }
    if (!/^[0-9a-fA-F]{24}$/.test(decision.leaveId)) {
      setMessage("Invalid leave ID format");
      console.error("Invalid leaveId:", decision.leaveId);
      return;
    }

    try {
      setLoading(true);
      const decoded = userData?.token ? jwtDecode(userData.token) : {};
      const principalEmployeeId = decoded.employeeId || userData?.employeeId;
      console.log("Principal Employee ID:", principalEmployeeId);
      console.log("PUT request payload:", {
        principalEmployeeId,
        decision: decision.decision,
        comment: decision.comment,
      });

      if (!principalEmployeeId) {
        throw new Error("Principal employee ID missing");
      }

      const response = await axios.put(
        `http://localhost:5000/api/leave/principal/${decision.leaveId}`,
        {
          principalEmployeeId,
          decision: decision.decision,
          comment: decision.comment,
        },
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        }
      );
      setMessage(response.data.message || "Decision recorded successfully");
      setDecision({ leaveId: "", decision: "Approved", comment: "" });

      // Refresh leaves
      const leavesResponse = await axios.get(
        `http://localhost:5000/api/leave/principal/all`,
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
          },
        }
      );
      
      // Filter by selected department and view mode
      const allLeaves = Array.isArray(leavesResponse.data) ? leavesResponse.data : [];
      
      let filteredByStatus;
      if (viewMode === "pending") {
        // Only show requests that are actually pending principal approval
        filteredByStatus = allLeaves.filter(leave => 
          leave.status === "HOD Approved" || 
          (leave.status === "Pending" && leave.type !== "Faculty")
        );
      } else {
        // Show all requests (including processed ones)
        filteredByStatus = allLeaves;
      }
      
      const filteredLeaves = department === "All Departments" 
        ? filteredByStatus 
        : filteredByStatus.filter(leave => leave.department === department);
      
      setLeaves(filteredLeaves);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Error processing decision";
      setMessage(errorMsg);
      console.error("Decision error:", {
        message: errorMsg,
        status: error.response?.status,
        data: error.response?.data,
      });
      if (error.response?.status === 401 || error.response?.status === 403) {
        setTimeout(() => navigate("/login"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-7xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Principal's Leave Approval Dashboard
          </h2>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Department Filter */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Filter by Department
          </h3>
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setDepartment(dept)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                  department === dept
                    ? "bg-teal-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={loading}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            View Mode
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("pending")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                viewMode === "pending"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              disabled={loading}
            >
              Pending Actions Only
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                viewMode === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              disabled={loading}
            >
              All Requests & History
            </button>
          </div>
        </div>

        {/* Leave Requests Table */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            {viewMode === "pending" ? "Pending Leave Requests Requiring Principal Approval" : "All Leave Requests"} - {department}
          </h3>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Loading leave requests...</p>
            </div>
          ) : Array.isArray(leaves) && leaves.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Employee ID",
                      "Name",
                      "Department",
                      "Leave Type",
                      "Type",
                      "Start Date",
                      "End Date",
                      "Reason",
                      "Days",
                      "Current Status",
                      "Action",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaves.map((leave) => (
                    <tr key={leave._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.employeeId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.firstName || "N/A"}{" "}
                        {/* Use firstName as per schema */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.leaveType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(leave.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {leave.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {leave.leaveDays}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            leave.status === "HOD Approved"
                              ? "bg-blue-100 text-blue-800"
                              : leave.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : leave.status === "Principal Approved"
                              ? "bg-green-100 text-green-800"
                              : leave.status === "Principal Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {leave.status === "HOD Approved" 
                            ? "Pending Principal Approval" 
                            : leave.status === "Pending"
                            ? "Pending Principal Approval (Direct)"
                            : leave.status === "Principal Approved"
                            ? "Approved by Principal"
                            : leave.status === "Principal Rejected"
                            ? "Rejected by Principal"
                            : leave.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(leave.status === "HOD Approved" || 
                          (leave.status === "Pending" && leave.type !== "Faculty")) ? (
                          <button
                            onClick={() =>
                              setDecision({ ...decision, leaveId: leave._id })
                            }
                            className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition"
                            disabled={loading}
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            {leave.status === "Principal Approved" ? "Already Approved" :
                             leave.status === "Principal Rejected" ? "Already Rejected" : "No Action"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No {viewMode === "pending" ? "pending" : ""} leave requests {viewMode === "pending" ? "requiring principal approval" : ""} for {department}.
            </div>
          )}
        </div>

        {/* Decision Form */}
        {decision.leaveId && (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Make Decision
            </h3>
            <form onSubmit={handleDecision} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Decision
                </label>
                <select
                  value={decision.decision}
                  onChange={(e) =>
                    setDecision({ ...decision, decision: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  disabled={loading}
                >
                  <option value="Approved">Approve</option>
                  <option value="Rejected">Reject</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment
                </label>
                <textarea
                  value={decision.comment}
                  onChange={(e) =>
                    setDecision({ ...decision, comment: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition"
                  rows="4"
                  placeholder="Enter any comments (optional)"
                  disabled={loading}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Submit Decision"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`mt-6 p-4 rounded-lg text-center text-sm font-medium ${
              message.toLowerCase().includes("error")
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApproveLeaveByPrincipal;
