import { useState, useEffect } from "react";
import { 
  User, 
  Calendar, 
  Info, 
  Check, 
  X, 
  FileText, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  RefreshCw,
  MessageSquare,
  TrendingUp,
  Users,
  Eye
} from "lucide-react";
import axios from "axios";

export default function ApproveLeave() {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionComment, setActionComment] = useState("");

  // Get current user info
  const userData = JSON.parse(localStorage.getItem("user"));
  const userRole = userData?.role || "";
  const currentUserId = userData?._id || userData?.id || "";
  const employeeId = userData?.employeeId || "";
  const userDepartment = userData?.department || "";
  const token = userData?.token || localStorage.getItem("authToken");

  // Fetch both received and sent requests
  const fetchRequests = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      let allLeaves = [];
      
      // Use role-specific endpoints to ensure we get all relevant data
      if (userRole.toLowerCase() === "hod") {
        // For HOD, get all leaves from their department
        const response = await axios.get(`http://localhost:5000/api/leave/hod/${encodeURIComponent(userDepartment)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        allLeaves = response.data || [];
      } else if (userRole.toLowerCase() === "principal") {
        // For Principal, get all leaves that require principal approval
        const response = await axios.get(`http://localhost:5000/api/leave/principal/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        allLeaves = response.data || [];
        
        console.log("Principal - Raw data from /api/leave/principal/all:", allLeaves.length);
        console.log("Principal - Sample of principal leaves:", allLeaves.slice(0, 3));
      } else {
        // For regular faculty, get all leaves to see their own
        const response = await axios.get("http://localhost:5000/api/leave/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        allLeaves = response.data || [];
      }
      
      console.log("Fetched leaves:", allLeaves);
      console.log("User role:", userRole);
      console.log("User department:", userDepartment);

      // Filter requests based on user role and workflow
      if (userRole.toLowerCase() === "hod") {
        // HOD should see ALL regular leave requests from their department (all statuses)
        const receivedData = allLeaves.filter(
          (leave) => {
            const matchesDepartment = leave.department === userDepartment;
            const isRegularLeave = leave.leaveCategory === "Regular" || !leave.leaveCategory;
            
            return matchesDepartment && isRegularLeave;
          }
        );
        setReceivedRequests(receivedData);
      } else if (userRole.toLowerCase() === "principal") {
        // Principal endpoint already filters for relevant requests, just ensure regular leaves
        const receivedData = allLeaves.filter(
          (leave) => leave.leaveCategory === "Regular" || !leave.leaveCategory
        );
        
        console.log("Principal received requests (from principal/all endpoint):", receivedData);
        console.log("Principal filtering breakdown:", {
          totalLeaves: allLeaves.length,
          regularLeaves: receivedData.length,
          hodApproved: receivedData.filter(l => l.status === "HOD Approved").length,
          principalApproved: receivedData.filter(l => l.status === "Principal Approved").length,
          principalRejected: receivedData.filter(l => l.status === "Principal Rejected").length,
          pendingNonFaculty: receivedData.filter(l => l.status === "Pending" && l.type !== "Faculty").length
        });
        
        setReceivedRequests(receivedData);
      } else {
        // Regular faculty - only see requests they need to act on
        const receivedData = allLeaves.filter(
          (leave) => 
            leave.status === "Pending" && 
            (leave.leaveCategory === "Regular" || !leave.leaveCategory) &&
            leave.employeeId !== employeeId
        );
        setReceivedRequests(receivedData);
      }

      // Sent requests - requests sent by current user
      const sentData = allLeaves.filter(
        (leave) => leave.employeeId === employeeId && (leave.leaveCategory === "Regular" || !leave.leaveCategory)
      );
      setSentRequests(sentData);
    } catch (err) {
      console.error("Fetch error:", err.response?.data, err.message);
      setError(
        err.response?.data?.error || err.message || "Failed to fetch requests"
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    // Add keyboard shortcuts
    const handleKeyPress = (e) => {
      if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        fetchRequests(true);
      }
      if (e.key === 'Escape' && showConfirmModal) {
        setShowConfirmModal(false);
        setConfirmAction(null);
        setActionComment("");
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line
  }, [showConfirmModal]);

  // Utility functions
  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "HOD Approved":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "Principal Approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "HOD Rejected":
      case "Principal Rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (request) => {
    if (request.status === "Pending" && request.type === "Faculty") {
      return "Pending HOD Approval";
    } else if (request.status === "Pending" && request.type !== "Faculty") {
      return "Pending Principal Approval";
    } else if (request.status === "HOD Approved") {
      return "Pending Principal Approval";
    } else if (request.status === "Principal Approved") {
      return "Fully Approved";
    } else if (request.status === "HOD Rejected") {
      return "Rejected by HOD";
    } else if (request.status === "Principal Rejected") {
      return "Rejected by Principal";
    }
    return "Unknown Status";
  };

  const getStatusColor = (request) => {
    if (request.status === "Pending") return "text-yellow-600 bg-yellow-50";
    if (request.status === "HOD Approved") return "text-blue-600 bg-blue-50";
    if (request.status === "Principal Approved") return "text-green-600 bg-green-50";
    if (request.status.includes("Rejected")) return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  const canApproveReject = (request) => {
    if (userRole.toLowerCase() === "hod") {
      return request.status === "Pending";
    } else if (userRole.toLowerCase() === "principal") {
      return request.status === "HOD Approved" || (request.status === "Pending" && request.type !== "Faculty");
    }
    return false;
  };

  // Filter and sort requests based on search and filter
  const filteredReceivedRequests = receivedRequests
    .filter(request => {
      const matchesSearch = searchTerm === "" || 
        request.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.leaveType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterStatus === "all" || 
        (filterStatus === "pending" && request.status === "Pending") ||
        (filterStatus === "approved" && (request.status === "HOD Approved" || request.status === "Principal Approved")) ||
        (filterStatus === "rejected" && (request.status === "HOD Rejected" || request.status === "Principal Rejected"));
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // Sort by priority: pending actions first, then by application date
      const aActionNeeded = canApproveReject(a) ? 1 : 0;
      const bActionNeeded = canApproveReject(b) ? 1 : 0;
      
      if (aActionNeeded !== bActionNeeded) {
        return bActionNeeded - aActionNeeded; // Action needed first
      }
      
      // Then sort by application date (newest first)
      const aDate = new Date(a.applicationDate || a.createdAt);
      const bDate = new Date(b.applicationDate || b.createdAt);
      return bDate - aDate;
    });

  const handleApprove = async (id, requestData) => {
    setConfirmAction({
      type: 'approve',
      id,
      requestData,
      title: 'Approve Leave Request',
      message: `Are you sure you want to approve the leave request for ${requestData.firstName} (${requestData.employeeId})?`,
      confirmText: 'Approve',
      confirmClass: 'bg-green-600 hover:bg-green-700'
    });
    setShowConfirmModal(true);
  };

  const handleReject = async (id, requestData) => {
    setConfirmAction({
      type: 'reject',
      id,
      requestData,
      title: 'Reject Leave Request',
      message: `Are you sure you want to reject the leave request for ${requestData.firstName} (${requestData.employeeId})?`,
      confirmText: 'Reject',
      confirmClass: 'bg-red-600 hover:bg-red-700'
    });
    setActionComment(""); // Reset comment
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    if (!confirmAction) return;

    try {
      setError(null);
      setSuccessMessage(null);
      setShowConfirmModal(false);
      
      const { type, id, requestData } = confirmAction;
      const endpoint = userRole.toLowerCase() === "hod" 
        ? `http://localhost:5000/api/leave/hod/${id}`
        : `http://localhost:5000/api/leave/principal/${id}`;

      const decision = type === 'approve' ? 'Approved' : 'Rejected';
      const defaultComment = type === 'approve' 
        ? `Approved by ${userRole}` 
        : `Rejected by ${userRole}`;
      
      const comment = actionComment.trim() || defaultComment;

      const payload = userRole.toLowerCase() === "hod" 
        ? {
            hodEmployeeId: employeeId,
            decision,
            comment
          }
        : {
            principalEmployeeId: employeeId,
            decision,
            comment
          };

      console.log(`${type === 'approve' ? 'Approving' : 'Rejecting'} request:`, {
        leaveId: id,
        endpoint,
        payload,
        userRole,
        requestData
      });

      await axios.put(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const actionText = userRole.toLowerCase() === "hod" 
        ? `${decision.toLowerCase()} by HOD` 
        : `${decision.toLowerCase()} by Principal`;
      
      setSuccessMessage(`Leave request for ${requestData.firstName} (${requestData.employeeId}) successfully ${actionText}!`);
      await fetchRequests(true); // Refresh with loading indicator
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error(`${confirmAction.type} error:`, err.response?.data, err.message);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        `Failed to ${confirmAction.type} request`
      );
    } finally {
      setConfirmAction(null);
      setActionComment("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Leave Management Dashboard
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    <span className="font-medium">Role:</span> 
                    <span className="ml-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {userRole === "hod" ? "HOD" : userRole === "principal" ? "Principal" : "Faculty"}
                    </span>
                  </div>
                  {userDepartment && (
                    <div className="flex items-center">
                      <span className="font-medium">Department:</span>
                      <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {userDepartment}
                      </span>
                    </div>
                  )}
                  <div className="hidden sm:flex items-center text-xs text-gray-400">
                    <span>💡 Tip: Press Ctrl+R to refresh</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                {/* Quick Action Counter */}
                {receivedRequests.filter(r => canApproveReject(r)).length > 0 && (
                  <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium border border-orange-200">
                    <TrendingUp className="h-4 w-4 inline mr-1" />
                    {receivedRequests.filter(r => canApproveReject(r)).length} pending action{receivedRequests.filter(r => canApproveReject(r)).length !== 1 ? 's' : ''}
                  </div>
                )}
                
                <button
                  onClick={() => fetchRequests(true)}
                  disabled={isRefreshing}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Global Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-green-700 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Received Requests Section */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Section Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      {userRole.toLowerCase() === "hod" 
                        ? `Department Leave Requests (${userDepartment})`
                        : userRole.toLowerCase() === "principal"
                        ? "Leave Requests - Principal Dashboard"
                        : "Leave Requests for Your Review"}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {userRole.toLowerCase() === "hod" 
                        ? "Track and approve leave requests from your department"
                        : userRole.toLowerCase() === "principal"
                        ? "View all requests requiring principal approval and track your previous decisions"
                        : "Review leave requests requiring your approval"}
                    </p>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name, employee ID, or leave type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Statistics */}
                {userRole.toLowerCase() === "hod" && receivedRequests.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-yellow-50 p-3 rounded-lg text-center border border-yellow-200">
                      <div className="text-sm font-medium text-yellow-800 mb-1">Pending</div>
                      <div className="text-xl font-bold text-yellow-900">
                        {receivedRequests.filter(r => r.status === "Pending").length}
                      </div>
                      <div className="text-xs text-yellow-600">Need Action</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
                      <div className="text-sm font-medium text-blue-800 mb-1">Approved by You</div>
                      <div className="text-xl font-bold text-blue-900">
                        {receivedRequests.filter(r => r.status === "HOD Approved").length}
                      </div>
                      <div className="text-xs text-blue-600">With Principal</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-200">
                      <div className="text-sm font-medium text-purple-800 mb-1">At Principal</div>
                      <div className="text-xl font-bold text-purple-900">
                        {receivedRequests.filter(r => r.status === "HOD Approved").length}
                      </div>
                      <div className="text-xs text-purple-600">Awaiting Final</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
                      <div className="text-sm font-medium text-green-800 mb-1">Completed</div>
                      <div className="text-xl font-bold text-green-900">
                        {receivedRequests.filter(r => r.status === "Principal Approved").length}
                      </div>
                      <div className="text-xs text-green-600">Fully Approved</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center border border-red-200">
                      <div className="text-sm font-medium text-red-800 mb-1">Rejected</div>
                      <div className="text-xl font-bold text-red-900">
                        {receivedRequests.filter(r => r.status === "HOD Rejected" || r.status === "Principal Rejected").length}
                      </div>
                      <div className="text-xs text-red-600">All Levels</div>
                    </div>
                  </div>
                )}

                {userRole.toLowerCase() === "principal" && receivedRequests.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <div className="bg-yellow-50 p-3 rounded-lg text-center border border-yellow-200">
                      <div className="text-sm font-medium text-yellow-800 mb-1">Pending Review</div>
                      <div className="text-xl font-bold text-yellow-900">
                        {receivedRequests.filter(r => r.status === "HOD Approved" || (r.status === "Pending" && r.type !== "Faculty")).length}
                      </div>
                      <div className="text-xs text-yellow-600">Need Action</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
                      <div className="text-sm font-medium text-green-800 mb-1">Approved</div>
                      <div className="text-xl font-bold text-green-900">
                        {receivedRequests.filter(r => r.status === "Principal Approved").length}
                      </div>
                      <div className="text-xs text-green-600">By You</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center border border-red-200">
                      <div className="text-sm font-medium text-red-800 mb-1">Rejected</div>
                      <div className="text-xl font-bold text-red-900">
                        {receivedRequests.filter(r => r.status === "Principal Rejected").length}
                      </div>
                      <div className="text-xs text-red-600">By You</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
                      <div className="text-sm font-medium text-blue-800 mb-1">Total Handled</div>
                      <div className="text-xl font-bold text-blue-900">
                        {receivedRequests.filter(r => r.status === "Principal Approved" || r.status === "Principal Rejected").length}
                      </div>
                      <div className="text-xs text-blue-600">All Decisions</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
                      <div className="text-sm font-medium text-gray-800 mb-1">Total Visible</div>
                      <div className="text-xl font-bold text-gray-900">
                        {receivedRequests.length}
                      </div>
                      <div className="text-xs text-gray-600">All Requests</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading requests...</span>
                  </div>
                ) : filteredReceivedRequests.length === 0 ? (
                  <div className="text-center py-12">
                    {searchTerm || filterStatus !== "all" ? (
                      <>
                        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No matching requests found</h3>
                        <p className="text-gray-600 mb-4">
                          Try adjusting your search criteria or filters to find what you're looking for.
                        </p>
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setFilterStatus("all");
                          }}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                        >
                          Clear Filters
                        </button>
                      </>
                    ) : (
                      <>
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests found</h3>
                        <p className="text-gray-600">
                          {userRole.toLowerCase() === "hod" 
                            ? "No leave requests from your department yet. Requests will appear here when faculty submit them."
                            : userRole.toLowerCase() === "principal"
                            ? "No leave requests found. This dashboard shows all requests that require or have required principal approval, including your past decisions."
                            : "No leave requests requiring your review at this time."}
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReceivedRequests.map((request) => (
                      <RequestCard
                        key={request._id}
                        request={request}
                        userRole={userRole}
                        canApproveReject={canApproveReject}
                        getStatusIcon={getStatusIcon}
                        getStatusText={getStatusText}
                        getStatusColor={getStatusColor}
                        handleApprove={handleApprove}
                        handleReject={handleReject}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sent Requests Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-8">
              <div className="border-b border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Leave Requests</h3>
                <p className="text-sm text-gray-600">Track your submitted requests</p>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {sentRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No requests submitted</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentRequests.map((request) => (
                      <SentRequestCard
                        key={request._id}
                        request={request}
                        getStatusIcon={getStatusIcon}
                        getStatusText={getStatusText}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && confirmAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" role="dialog" aria-modal="true">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {confirmAction.type === 'approve' ? (
                    <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600 mr-3" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900" id="modal-title">
                    {confirmAction.title}
                  </h3>
                </div>
                
                <p className="text-gray-600 mb-4">{confirmAction.message}</p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {confirmAction.type === 'reject' ? 'Reason for rejection (optional):' : 'Comment (optional):'}
                  </label>
                  <textarea
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    placeholder={confirmAction.type === 'reject' 
                      ? "Please provide a reason for rejection..." 
                      : "Add any additional comments..."}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="3"
                    maxLength="500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        executeAction();
                      }
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {actionComment.length}/500 characters
                    {confirmAction.type === 'reject' && " • Providing a reason helps the applicant understand the decision"}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmAction(null);
                      setActionComment("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeAction}
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmAction.confirmClass} ${
                      confirmAction.type === 'approve' ? 'focus:ring-green-500' : 'focus:ring-red-500'
                    }`}
                  >
                    {confirmAction.confirmText}
                  </button>
                </div>
                
                <div className="mt-3 text-xs text-gray-500 text-center">
                  Press Ctrl+Enter to {confirmAction.type} • ESC to cancel
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Request Card Component
const RequestCard = ({ 
  request, 
  userRole, 
  canApproveReject, 
  getStatusIcon, 
  getStatusText, 
  getStatusColor, 
  handleApprove, 
  handleReject 
}) => {
  const needsAction = canApproveReject(request);
  
  return (
    <div className={`border rounded-lg p-6 transition-all duration-200 hover:shadow-md ${
      needsAction ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <div className="flex-shrink-0">
            {getStatusIcon(request.status)}
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">
              {request.firstName} ({request.employeeId})
            </h4>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-gray-100 rounded-full">{request.department}</span>
              <span className="px-2 py-1 bg-gray-100 rounded-full">{request.type}</span>
            </div>
          </div>
          {needsAction && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Action Required
            </span>
          )}
        </div>
        
        {/* Action Buttons */}
        {needsAction && (
          <div className="flex space-x-2">
            <button
              onClick={() => handleReject(request._id, request)}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
              aria-label={`Reject leave request for ${request.firstName}`}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </button>
            <button
              onClick={() => handleApprove(request._id, request)}
              className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200"
              aria-label={`Approve leave request for ${request.firstName}`}
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </button>
          </div>
        )}
        
        {/* Status Badge */}
        {!needsAction && (
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request)}`}>
            {getStatusIcon(request.status)}
            <span className="ml-2">{getStatusText(request)}</span>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Duration</span>
            </div>
            <p className="text-sm text-gray-900 ml-6">
              {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
              <span className="text-gray-600 ml-2">({request.leaveDays} days)</span>
            </p>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <Info className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Leave Type</span>
            </div>
            <p className="text-sm text-gray-900 ml-6">{request.leaveType}</p>
          </div>
          
          <div>
            <div className="flex items-center mb-2">
              <Clock className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Duration</span>
            </div>
            <p className="text-sm text-gray-900 ml-6">
              {request.leaveDuration || "Full Day"}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center mb-2">
              <FileText className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm font-medium text-gray-700">Reason</span>
            </div>
            <p className="text-sm text-gray-900 ml-6 bg-gray-50 p-3 rounded-lg">
              {request.reason || "No reason provided"}
            </p>
          </div>
          
          {request.applicationDate && (
            <div>
              <div className="flex items-center mb-2">
                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">Applied On</span>
              </div>
              <p className="text-sm text-gray-900 ml-6">
                {new Date(request.applicationDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
          
          {(request.hodComment || request.principalComment) && (
            <div>
              <div className="flex items-center mb-2">
                <MessageSquare className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700">Comments</span>
              </div>
              <div className="ml-6 space-y-2">
                {request.hodComment && (
                  <div className="bg-blue-50 p-2 rounded text-xs">
                    <strong>HOD:</strong> {request.hodComment}
                  </div>
                )}
                {request.principalComment && (
                  <div className="bg-purple-50 p-2 rounded text-xs">
                    <strong>Principal:</strong> {request.principalComment}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Workflow Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-4 text-xs">
          <span className="font-medium text-gray-500">Workflow:</span>
          
          {request.type === "Faculty" ? (
            <>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  request.status === "Pending" ? "bg-yellow-400" : "bg-green-400"
                }`}></div>
                <span className={request.status === "Pending" ? "text-yellow-600" : "text-green-600"}>
                  HOD Review
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
                  Principal Review
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
                Principal Review (Direct)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sent Request Card Component
const SentRequestCard = ({ request, getStatusIcon, getStatusText, getStatusColor }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStatusIcon(request.status)}
          <span className="text-sm font-medium text-gray-900">
            {request.leaveType}
          </span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request)}`}>
          {getStatusText(request)}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 space-y-1">
        <div className="flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          <span>{request.leaveDays} days</span>
        </div>
      </div>
      
      {/* Mini Workflow */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-2 text-xs">
          {request.type === "Faculty" ? (
            <>
              <div className={`w-1.5 h-1.5 rounded-full ${
                request.status !== "Pending" ? "bg-green-400" : "bg-yellow-400"
              }`}></div>
              <span className="text-gray-500">HOD</span>
              <span className="text-gray-300">→</span>
              <div className={`w-1.5 h-1.5 rounded-full ${
                request.status === "Principal Approved" ? "bg-green-400" : 
                request.status === "HOD Approved" ? "bg-yellow-400" :
                request.status === "Principal Rejected" ? "bg-red-400" : "bg-gray-300"
              }`}></div>
              <span className="text-gray-500">Principal</span>
            </>
          ) : (
            <>
              <div className={`w-1.5 h-1.5 rounded-full ${
                request.status === "Principal Approved" ? "bg-green-400" : 
                request.status === "Principal Rejected" ? "bg-red-400" : "bg-yellow-400"
              }`}></div>
              <span className="text-gray-500">Principal (Direct)</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
