import { useState, useEffect } from "react";
import { ArrowDown, User, Calendar, Info, Check, X } from "lucide-react";
import axios from "axios";

export default function ChargeHandoverApp() {
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
  const token = userData?.token || localStorage.getItem("authToken");

  // Fetch both received and sent requests
  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:5000/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allTasks = response.data.data || response.data || [];
      console.log("Fetched tasks:", allTasks);
      console.log("User role:", userRole);
      console.log("User department:", userData?.department);

      // Filter requests based on user role and workflow
      if (userRole.toLowerCase() === "hod") {
        // HOD should see ALL requests from their department to track full workflow
        const receivedData = allTasks.filter(
          (task) => task.department === userData?.department
        );
        console.log("HOD received requests:", receivedData);
        setReceivedRequests(receivedData);
      } else if (userRole.toLowerCase() === "teaching") {
        // Faculty should see ALL requests where they are the receiver to track full workflow
        const receivedData = allTasks.filter(
          (task) => task.receiverId === currentUserId
        );
        console.log("Faculty received requests:", receivedData);
        setReceivedRequests(receivedData);
      }

      // Sent requests - requests sent by current user
      const sentData = allTasks.filter(
        (task) => task.senderId === currentUserId
      );
      setSentRequests(sentData);
    } catch (err) {
      console.error("Fetch error:", err.response?.data, err.message);
      setError(
        err.response?.data?.error || err.message || "Failed to fetch requests"
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
      
      const endpoint =
        userRole.toLowerCase() === "hod" ? `/approve-hod` : `/approve-faculty`;

      // For HOD: use employeeId, for Faculty: use currentUserId (since they are the receiver)
      const approverId = userRole.toLowerCase() === "hod" ? employeeId : currentUserId;

      console.log("Approving request:", {
        taskId: id,
        endpoint,
        approverId,
        userRole
      });

      await axios.put(
        `http://localhost:5000/api/tasks/${id}${endpoint}`,
        {
          decision: "approved",
          approverId: approverId,
          remarks: "Approved", // Optional for faculty
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const actionText = userRole.toLowerCase() === "hod" ? "approved" : "accepted";
      setSuccessMessage(`Request successfully ${actionText}!`);
      fetchRequests(); // Refresh the data
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Approval error:", err.response?.data, err.message);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to approve request"
      );
    }
  };

  const handleReject = async (id) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      const endpoint =
        userRole.toLowerCase() === "hod" ? `/approve-hod` : `/approve-faculty`;

      // For HOD: use employeeId, for Faculty: use currentUserId (since they are the receiver)
      const approverId = userRole.toLowerCase() === "hod" ? employeeId : currentUserId;

      console.log("Rejecting request:", {
        taskId: id,
        endpoint,
        approverId,
        userRole
      });

      await axios.put(
        `http://localhost:5000/api/tasks/${id}${endpoint}`,
        {
          decision: "rejected",
          approverId: approverId,
          remarks: "Rejected", // Optional for faculty
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage("Request successfully rejected!");
      fetchRequests(); // Refresh the data
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Rejection error:", err.response?.data, err.message);
      setError(
        err.response?.data?.message || 
        err.response?.data?.error ||
        err.message || 
        "Failed to reject request"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Charge Handover Dashboard
            </h1>
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Role:</span> {userRole === "hod" ? "HOD" : "Faculty"} 
              {userData?.department && (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-medium">Department:</span> {userData.department}
                </>
              )}
            </div>
            <div className="mt-4">
              <div className="relative inline-block">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  All Requests
                  <ArrowDown className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 1: Requests to Approve (Received) */}
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">
              {userRole.toLowerCase() === "hod" 
                ? `Department Requests & Status Tracking (${userData?.department || 'Your Department'})` 
                : "Charge Handover Requests for You"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {userRole.toLowerCase() === "hod" 
                ? "All charge handover requests from your department - track full workflow from approval to faculty acceptance" 
                : "All charge handover requests where you are the designated receiver - track full workflow"}
            </p>
            
            {/* Statistics for HOD */}
            {userRole.toLowerCase() === "hod" && receivedRequests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Pending Your Approval: {receivedRequests.filter(r => r.status === "pending_hod").length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Waiting for Faculty: {receivedRequests.filter(r => r.status === "pending_faculty").length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Completed: {receivedRequests.filter(r => r.status === "approved").length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Rejected: {receivedRequests.filter(r => r.status === "rejected").length}
                  </span>
                </div>
              </div>
            )}
            
            {/* Statistics for Faculty */}
            {userRole.toLowerCase() === "teaching" && receivedRequests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Waiting for HOD: {receivedRequests.filter(r => r.status === "pending_hod").length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Pending Your Acceptance: {receivedRequests.filter(r => r.status === "pending_faculty").length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Accepted: {receivedRequests.filter(r => r.status === "approved").length}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                  <span className="text-gray-600">
                    Rejected: {receivedRequests.filter(r => r.status === "rejected").length}
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
                    ? "No requests from your department." 
                    : "No charge handover requests where you are the receiver."}
                </div>
              ) : (
                receivedRequests.map((request) => (
                  <div key={request._id} className={`p-6 ${
                    // Highlight requests that need action
                    (request.status === "pending_hod" && userRole.toLowerCase() === "hod") ||
                    (request.status === "pending_faculty" && userRole.toLowerCase() === "teaching")
                      ? "bg-blue-50 border-l-4 border-blue-400" 
                      : ""
                  }`}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div className="flex items-center mb-4 md:mb-0">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded mr-3">
                          {request.department}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          Request #{request._id}
                        </span>
                        {/* Action Required Indicator */}
                        {((request.status === "pending_hod" && userRole.toLowerCase() === "hod") ||
                          (request.status === "pending_faculty" && userRole.toLowerCase() === "teaching")) && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Action Required
                          </span>
                        )}
                      </div>
                      {/* Show approve/reject buttons based on role and status */}
                      {request.status === "pending_hod" &&
                        userRole.toLowerCase() === "hod" && (
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
                      {request.status === "pending_faculty" &&
                        userRole.toLowerCase() === "teaching" && (
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
                              Accept
                            </button>
                          </div>
                        )}
                      {/* HOD can see status badge for already processed requests */}
                      {userRole.toLowerCase() === "hod" && request.status !== "pending_hod" && (
                        <div className="flex items-center space-x-2">
                          {request.status === "pending_faculty" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Waiting for Faculty
                            </span>
                          )}
                          {request.status === "approved" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ Completed
                            </span>
                          )}
                          {request.status === "rejected" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              ❌ Rejected
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Faculty can see status badge for requests not requiring action */}
                      {userRole.toLowerCase() === "teaching" && request.status !== "pending_faculty" && (
                        <div className="flex items-center space-x-2">
                          {request.status === "pending_hod" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Waiting for HOD
                            </span>
                          )}
                          {request.status === "approved" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ Accepted
                            </span>
                          )}
                          {request.status === "rejected" && (
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
                              Charge From:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {request.reportingManager}
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
                            {new Date(
                              request.handoverStartDate
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(
                              request.handoverEndDate
                            ).toLocaleDateString()}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center mb-2">
                            <Info className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Reason:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {request.reason}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="mb-6">
                          <div className="flex items-center mb-2">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Charge To:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {request.receiverName}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center mb-2">
                            <Info className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Documents / Assets / Pending Tasks:
                            </span>
                          </div>
                          <div className="ml-6">
                            <div className="text-sm text-gray-900 mb-1">
                              <span className="font-medium">Documents:</span>{" "}
                              {request.documents?.join(", ") || "None"}
                            </div>
                            <div className="text-sm text-gray-900 mb-1">
                              <span className="font-medium">Assets:</span>{" "}
                              {request.assets?.join(", ") || "None"}
                            </div>
                            <div className="text-sm text-gray-900 mb-1">
                              <span className="font-medium">
                                Pending Tasks:
                              </span>{" "}
                              {request.pendingTasks?.join(", ") || "None"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      {/* Workflow Status Indicator */}
                      <div className="flex items-center space-x-2 text-xs mb-2">
                        <span className="font-medium text-gray-500">Workflow Status:</span>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${request.status === "pending_hod" ? "bg-yellow-400" : "bg-green-400"}`}></div>
                          <span className={request.status === "pending_hod" ? "text-yellow-600" : "text-green-600"}>
                            HOD Approval
                          </span>
                        </div>
                        <span className="text-gray-300">→</span>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            request.status === "pending_faculty" ? "bg-yellow-400" : 
                            request.status === "approved" ? "bg-green-400" : 
                            request.status === "rejected" ? "bg-red-400" : "bg-gray-300"
                          }`}></div>
                          <span className={
                            request.status === "pending_faculty" ? "text-yellow-600" : 
                            request.status === "approved" ? "text-green-600" : 
                            request.status === "rejected" ? "text-red-600" : "text-gray-400"
                          }>
                            Faculty Acceptance
                          </span>
                        </div>
                      </div>
                      
                      {/* Current Status */}
                      <div className="text-xs font-medium">
                        {request.status === "pending_hod" ? (
                          <span className="text-amber-600">
                            ⏳ Pending HOD Approval
                          </span>
                        ) : request.status === "pending_faculty" ? (
                          <span className="text-yellow-600">
                            ⏳ Pending Faculty Acceptance
                          </span>
                        ) : request.status === "approved" ? (
                          <span className="text-green-600">
                            ✅ Fully Approved & Accepted
                          </span>
                        ) : request.status === "rejected" ? (
                          <span className="text-red-600">
                            ❌ Rejected
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

          {/* Section 2: Requests You Sent */}
          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50 mt-8">
            <h2 className="text-lg font-medium text-gray-900">
              Requests You Sent
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
                  No sent requests found.
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
                          Request #{request._id}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="mb-6">
                          <div className="flex items-center mb-2">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Charge To:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {request.receiverName}
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
                            {new Date(
                              request.handoverStartDate
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(
                              request.handoverEndDate
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center mb-2">
                            <Info className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Reason:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {request.reason}
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
                              <div className="flex items-center space-x-1">
                                <div className={`w-2 h-2 rounded-full ${request.status !== "pending_hod" ? "bg-green-400" : "bg-yellow-400"}`}></div>
                                <span className={request.status !== "pending_hod" ? "text-green-600" : "text-yellow-600"}>
                                  HOD Approval
                                </span>
                              </div>
                              <span className="text-gray-300">→</span>
                              <div className="flex items-center space-x-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  request.status === "approved" ? "bg-green-400" : 
                                  request.status === "pending_faculty" ? "bg-yellow-400" :
                                  request.status === "rejected" ? "bg-red-400" : "bg-gray-300"
                                }`}></div>
                                <span className={
                                  request.status === "approved" ? "text-green-600" : 
                                  request.status === "pending_faculty" ? "text-yellow-600" :
                                  request.status === "rejected" ? "text-red-600" : "text-gray-400"
                                }>
                                  Faculty Acceptance
                                </span>
                              </div>
                            </div>
                            
                            {request.status === "pending_hod" ? (
                              <span className="text-amber-600 font-medium">
                                ⏳ Waiting for HOD Approval
                              </span>
                            ) : request.status === "pending_faculty" ? (
                              <span className="text-yellow-600 font-medium">
                                ⏳ Waiting for Faculty Acceptance
                              </span>
                            ) : request.status === "approved" ? (
                              <span className="text-green-600 font-medium">
                                ✅ Fully Approved & Accepted
                              </span>
                            ) : request.status === "rejected" ? (
                              <span className="text-red-600 font-medium">
                                ❌ Request Rejected
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
                            <Info className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-500">
                              Documents / Assets / Pending Tasks:
                            </span>
                          </div>
                          <div className="ml-6">
                            <div className="text-sm text-gray-900 mb-1">
                              <span className="font-medium">Documents:</span>{" "}
                              {request.documents?.join(", ") || "None"}
                            </div>
                            <div className="text-sm text-gray-900 mb-1">
                              <span className="font-medium">Assets:</span>{" "}
                              {request.assets?.join(", ") || "None"}
                            </div>
                            <div className="text-sm text-gray-900 mb-1">
                              <span className="font-medium">
                                Pending Tasks:
                              </span>{" "}
                              {request.pendingTasks?.join(", ") || "None"}
                            </div>
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
