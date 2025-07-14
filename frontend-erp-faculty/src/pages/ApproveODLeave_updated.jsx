import { useState, useEffect } from "react";
import { ArrowDown, User, Calendar, Info, Check, X, FileText, MapPin } from "lucide-react";
import axios from "axios";

export default function ApproveODLeave() {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Get current user info
  const userData = JSON.parse(localStorage.getItem("user"));
  const userRole = userData?.role || "";
  const currentUserId = userData?._id || userData?.id || "";
  const employeeId = userData?.employeeId || "";
  const userDepartment = userData?.department || "";
  const token = userData?.token || localStorage.getItem("authToken");

  // Fetch both received and sent requests
  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:5000/api/leave/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allLeaves = response.data || [];
      console.log("Fetched leaves:", allLeaves);
      console.log("User role:", userRole);
      console.log("User department:", userDepartment);

      // Filter OD leave requests based on user role and workflow
      if (userRole.toLowerCase() === "hod") {
        // HOD should see ALL OD requests from their department to track full workflow
        const receivedData = allLeaves.filter(
          (leave) => 
            leave.department === userDepartment &&
            leave.leaveCategory === "OD" // Only OD leaves for this component
        );
        console.log("HOD received OD requests:", receivedData);
        setReceivedRequests(receivedData);
      } else if (userRole.toLowerCase() === "principal") {
        // Principal should see OD requests that need principal approval or are completed
        const receivedData = allLeaves.filter(
          (leave) => 
            leave.leaveCategory === "OD" && (
              leave.status === "HOD Approved" || // Teaching staff after HOD approval
              leave.status === "Principal Approved" ||
              leave.status === "Principal Rejected" ||
              (leave.status === "Pending" && leave.type !== "Faculty") // Non-teaching staff direct to principal
            )
        );
        console.log("Principal received OD requests:", receivedData);
        setReceivedRequests(receivedData);
      }

      // Sent requests - OD requests sent by current user
      const sentData = allLeaves.filter(
        (leave) => leave.employeeId === employeeId && leave.leaveCategory === "OD"
      );
      setSentRequests(sentData);
    } catch (err) {
      console.error("Fetch error:", err.response?.data, err.message);
      setError(
        err.response?.data?.error || err.message || "Failed to fetch OD requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, []);

  const handleApprove = async (id) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      const endpoint = userRole.toLowerCase() === "hod" 
        ? `http://localhost:5000/api/leave/hod/${id}`
        : `http://localhost:5000/api/leave/principal/${id}`;

      const payload = userRole.toLowerCase() === "hod" 
        ? {
            hodEmployeeId: employeeId,
            decision: "Approved",
            comment: "Approved"
          }
        : {
            principalEmployeeId: employeeId,
            decision: "Approved", 
            comment: "Approved"
          };

      console.log("Approving OD request:", {
        leaveId: id,
        endpoint,
        payload,
        userRole
      });

      await axios.put(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const actionText = userRole.toLowerCase() === "hod" ? "approved" : "approved";
      setSuccessMessage(`OD leave request successfully ${actionText}!`);
      fetchRequests(); // Refresh the data
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Approval error:", err.response?.data, err.message);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to approve OD request"
      );
    }
  };

  const handleReject = async (id) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      const endpoint = userRole.toLowerCase() === "hod" 
        ? `http://localhost:5000/api/leave/hod/${id}`
        : `http://localhost:5000/api/leave/principal/${id}`;

      const payload = userRole.toLowerCase() === "hod" 
        ? {
            hodEmployeeId: employeeId,
            decision: "Rejected",
            comment: "Rejected"
          }
        : {
            principalEmployeeId: employeeId,
            decision: "Rejected",
            comment: "Rejected"
          };

      console.log("Rejecting OD request:", {
        leaveId: id,
        endpoint,
        payload,
        userRole
      });

      await axios.put(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage("OD leave request successfully rejected!");
      fetchRequests(); // Refresh the data
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Rejection error:", err.response?.data, err.message);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error ||
        err.message || 
        "Failed to reject OD request"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              OD Leave Approval Dashboard
            </h1>
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Role:</span> {userRole === "hod" ? "HOD" : userRole === "principal" ? "Principal" : "Faculty"} 
              {userDepartment && (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-medium">Department:</span> {userDepartment}
                </>
              )}
            </div>
          </div>

          {/* Section 1: Requests to Approve (Received) */}
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">
              {userRole.toLowerCase() === "hod" 
                ? `Department OD Leave Requests & Status Tracking (${userDepartment || 'Your Department'})` 
                : userRole.toLowerCase() === "principal"
                ? "OD Leave Requests for Principal Approval"
                : "OD Leave Requests for Your Review"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {userRole.toLowerCase() === "hod" 
                ? "All OD leave requests from your department - track full workflow from approval to principal approval" 
                : userRole.toLowerCase() === "principal"
                ? "OD leave requests requiring principal approval - from HOD approved teaching staff and direct non-teaching staff"
                : "OD leave requests requiring your approval"}
            </p>
            
            {/* Statistics for HOD */}
            {userRole.toLowerCase() === "hod" && receivedRequests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Pending Your Approval: {receivedRequests.filter(r => r.status === "Pending").length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Waiting for Principal: {receivedRequests.filter(r => r.status === "HOD Approved").length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Completed: {receivedRequests.filter(r => r.status === "Principal Approved").length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Rejected: {receivedRequests.filter(r => r.status === "HOD Rejected" || r.status === "Principal Rejected").length}
                  </span>
                </div>
              </div>
            )}
            
            {/* Statistics for Principal */}
            {userRole.toLowerCase() === "principal" && receivedRequests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Pending Your Approval: {receivedRequests.filter(r => r.status === "HOD Approved" || (r.status === "Pending" && r.type !== "Faculty")).length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Approved: {receivedRequests.filter(r => r.status === "Principal Approved").length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Rejected: {receivedRequests.filter(r => r.status === "Principal Rejected").length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          ) : successMessage ? (
            <div className="p-6 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-600">{successMessage}</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {receivedRequests.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {userRole.toLowerCase() === "hod" 
                    ? "No OD leave requests from your department." 
                    : userRole.toLowerCase() === "principal"
                    ? "No OD leave requests requiring principal approval."
                    : "No OD leave requests to review."}
                </div>
              ) : (
                receivedRequests.map((request) => (
                  <div key={request._id} className={`p-6 ${
                    // Highlight requests that need action
                    (request.status === "Pending" && userRole.toLowerCase() === "hod") ||
                    ((request.status === "HOD Approved" || (request.status === "Pending" && request.type !== "Faculty")) && userRole.toLowerCase() === "principal")
                      ? "bg-blue-50 border-l-4 border-blue-400" 
                      : ""
                  }`}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div className="flex items-center mb-4 md:mb-0">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded mr-3">
                          {request.department}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          OD Leave #{request._id}
                        </span>
                        {/* Action Required Indicator */}
                        {(((request.status === "Pending" && userRole.toLowerCase() === "hod") ||
                          ((request.status === "HOD Approved" || (request.status === "Pending" && request.type !== "Faculty")) && userRole.toLowerCase() === "principal"))) && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Action Required
                          </span>
                        )}
                      </div>
                      
                      {/* Show approve/reject buttons based on role and status */}
                      {request.status === "Pending" && userRole.toLowerCase() === "hod" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleReject(request._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(request._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-green-300 text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                        </div>
                      )}
                      
                      {((request.status === "HOD Approved" || (request.status === "Pending" && request.type !== "Faculty")) && userRole.toLowerCase() === "principal") && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleReject(request._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(request._id)}
                            className="inline-flex items-center px-3 py-1.5 border border-green-300 text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                        </div>
                      )}
                      
                      {/* Status badges for tracking */}
                      {userRole.toLowerCase() === "hod" && request.status !== "Pending" && (
                        <div className="flex items-center space-x-2">
                          {request.status === "HOD Approved" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Waiting for Principal
                            </span>
                          )}
                          {request.status === "Principal Approved" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ Fully Approved
                            </span>
                          )}
                          {(request.status === "HOD Rejected" || request.status === "Principal Rejected") && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ❌ Rejected
                            </span>
                          )}
                        </div>
                      )}
                      
                      {userRole.toLowerCase() === "principal" && !((request.status === "HOD Approved" || (request.status === "Pending" && request.type !== "Faculty"))) && (
                        <div className="flex items-center space-x-2">
                          {request.status === "Principal Approved" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ Approved by Me
                            </span>
                          )}
                          {request.status === "Principal Rejected" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ❌ Rejected by Me
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="mb-6">
                          <div className="flex items-center mb-2">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Employee:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {request.firstName} ({request.employeeId})
                          </div>
                        </div>

                        <div className="mb-6">
                          <div className="flex items-center mb-2">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Duration:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()} ({request.leaveDays} days)
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center mb-2">
                            <Info className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              OD Type:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {request.leaveType}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="mb-6">
                          <div className="flex items-center mb-2">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Event Details:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            <div><strong>Event:</strong> {request.eventName || "N/A"}</div>
                            <div><strong>Location:</strong> {request.location || "N/A"}</div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center mb-2">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Reason:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {request.reason}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      {/* Workflow Status Indicator */}
                      <div className="flex items-center space-x-2 text-xs mb-2">
                        <span className="font-medium text-gray-500">Workflow Status:</span>
                        
                        {/* For Teaching Staff (Faculty) */}
                        {request.type === "Faculty" && (
                          <>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${request.status === "Pending" ? "bg-yellow-400" : "bg-green-400"}`}></div>
                              <span className={request.status === "Pending" ? "text-yellow-600" : "text-green-600"}>
                                HOD Approval
                              </span>
                            </div>
                            <span className="text-gray-300">→</span>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${
                                request.status === "HOD Approved" ? "bg-yellow-400" : 
                                request.status === "Principal Approved" ? "bg-green-400" : 
                                request.status === "Principal Rejected" ? "bg-red-400" : "bg-gray-300"
                              }`}></div>
                              <span className={
                                request.status === "HOD Approved" ? "text-yellow-600" : 
                                request.status === "Principal Approved" ? "text-green-600" : 
                                request.status === "Principal Rejected" ? "text-red-600" : "text-gray-400"
                              }>
                                Principal Approval
                              </span>
                            </div>
                          </>
                        )}
                        
                        {/* For Non-Teaching Staff (Direct to Principal) */}
                        {request.type !== "Faculty" && (
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${
                              request.status === "Principal Approved" ? "bg-green-400" : 
                              request.status === "Principal Rejected" ? "bg-red-400" : "bg-yellow-400"
                            }`}></div>
                            <span className={
                              request.status === "Principal Approved" ? "text-green-600" : 
                              request.status === "Principal Rejected" ? "text-red-600" : "text-yellow-600"
                            }>
                              Principal Approval (Direct)
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Current Status */}
                      <div className="text-xs font-medium">
                        {request.status === "Pending" && request.type === "Faculty" ? (
                          <span className="text-amber-600">
                            ⏳ Pending HOD Approval
                          </span>
                        ) : request.status === "Pending" && request.type !== "Faculty" ? (
                          <span className="text-amber-600">
                            ⏳ Pending Principal Approval
                          </span>
                        ) : request.status === "HOD Approved" ? (
                          <span className="text-yellow-600">
                            ⏳ Pending Principal Approval
                          </span>
                        ) : request.status === "Principal Approved" ? (
                          <span className="text-green-600">
                            ✅ Fully Approved
                          </span>
                        ) : request.status === "HOD Rejected" ? (
                          <span className="text-red-600">
                            ❌ Rejected by HOD
                          </span>
                        ) : request.status === "Principal Rejected" ? (
                          <span className="text-red-600">
                            ❌ Rejected by Principal
                          </span>
                        ) : (
                          <span className="text-gray-600">Unknown Status</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Section 2: OD Requests You Sent */}
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 mt-8">
            <h2 className="text-lg font-medium text-gray-900">
              OD Leave Requests You Sent
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sentRequests.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No sent OD leave requests found.
                </div>
              ) : (
                sentRequests.map((request) => (
                  <div key={request._id} className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div className="flex items-center mb-4 md:mb-0">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded mr-3">
                          {request.department}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          OD Leave #{request._id}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="mb-6">
                          <div className="flex items-center mb-2">
                            <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Duration:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()} ({request.leaveDays} days)
                          </div>
                        </div>
                        <div className="mb-6">
                          <div className="flex items-center mb-2">
                            <Info className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              OD Type:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {request.leaveType}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center mb-2">
                            <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Event Details:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            <div><strong>Event:</strong> {request.eventName || "N/A"}</div>
                            <div><strong>Location:</strong> {request.location || "N/A"}</div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="mb-6">
                          <div className="flex items-center mb-2">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Current Status:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {/* Workflow Status Indicator for Sent Requests */}
                            <div className="flex items-center space-x-2 mb-2">
                              {request.type === "Faculty" ? (
                                <>
                                  <div className="flex items-center space-x-1">
                                    <div className={`w-2 h-2 rounded-full ${request.status !== "Pending" ? "bg-green-400" : "bg-yellow-400"}`}></div>
                                    <span className={request.status !== "Pending" ? "text-green-600" : "text-yellow-600"}>
                                      HOD Approval
                                    </span>
                                  </div>
                                  <span className="text-gray-300">→</span>
                                  <div className="flex items-center space-x-1">
                                    <div className={`w-2 h-2 rounded-full ${
                                      request.status === "Principal Approved" ? "bg-green-400" : 
                                      request.status === "HOD Approved" ? "bg-yellow-400" :
                                      request.status === "Principal Rejected" ? "bg-red-400" : "bg-gray-300"
                                    }`}></div>
                                    <span className={
                                      request.status === "Principal Approved" ? "text-green-600" : 
                                      request.status === "HOD Approved" ? "text-yellow-600" :
                                      request.status === "Principal Rejected" ? "text-red-600" : "text-gray-400"
                                    }>
                                      Principal Approval
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center space-x-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    request.status === "Principal Approved" ? "bg-green-400" : 
                                    request.status === "Principal Rejected" ? "bg-red-400" : "bg-yellow-400"
                                  }`}></div>
                                  <span className={
                                    request.status === "Principal Approved" ? "text-green-600" : 
                                    request.status === "Principal Rejected" ? "text-red-600" : "text-yellow-600"
                                  }>
                                    Principal Approval
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {request.status === "Pending" && request.type === "Faculty" ? (
                              <span className="text-amber-600 font-medium">
                                ⏳ Waiting for HOD Approval
                              </span>
                            ) : request.status === "Pending" && request.type !== "Faculty" ? (
                              <span className="text-amber-600 font-medium">
                                ⏳ Waiting for Principal Approval
                              </span>
                            ) : request.status === "HOD Approved" ? (
                              <span className="text-yellow-600 font-medium">
                                ⏳ Waiting for Principal Approval
                              </span>
                            ) : request.status === "Principal Approved" ? (
                              <span className="text-green-600 font-medium">
                                ✅ Fully Approved
                              </span>
                            ) : request.status === "HOD Rejected" ? (
                              <span className="text-red-600 font-medium">
                                ❌ Rejected by HOD
                              </span>
                            ) : request.status === "Principal Rejected" ? (
                              <span className="text-red-600 font-medium">
                                ❌ Rejected by Principal
                              </span>
                            ) : (
                              <span className="text-gray-600 font-medium">
                                Unknown Status
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center mb-2">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Reason:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {request.reason}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
