import React, { useEffect, useState } from "react";
import axios from "axios";

const SentLeaveRequests = ({ employeeId }) => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    axios
      .get(`http://localhost:5000/api/leave/my-leaves/${employeeId}`)
      .then((res) => {
        console.log("Leave API response:", res.data);
        setLeaves(res.data.leaves || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch leave requests");
        setLoading(false);
      });
  }, [employeeId]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        bg: "bg-yellow-100", 
        text: "text-yellow-800", 
        icon: "⏳",
        border: "border-yellow-200"
      },
      approved: { 
        bg: "bg-green-100", 
        text: "text-green-800", 
        icon: "✅",
        border: "border-green-200"
      },
      rejected: { 
        bg: "bg-red-100", 
        text: "text-red-800", 
        icon: "❌",
        border: "border-red-200"
      },
      default: { 
        bg: "bg-gray-100", 
        text: "text-gray-800", 
        icon: "📄",
        border: "border-gray-200"
      }
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.default;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <span className="mr-1">{config.icon}</span>
        {status || "Unknown"}
      </span>
    );
  };

  const getDecisionBadge = (decision) => {
    if (!decision || decision === "-") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
          ⏳ Pending
        </span>
      );
    }

    const config = decision.toLowerCase() === "approved" 
      ? { bg: "bg-green-100", text: "text-green-700", icon: "✅", border: "border-green-200" }
      : { bg: "bg-red-100", text: "text-red-700", icon: "❌", border: "border-red-200" };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
        <span className="mr-1">{config.icon}</span>
        {decision}
      </span>
    );
  };

  const getLeaveTypeIcon = (type) => {
    const icons = {
      "Sick Leave": "🤒",
      "Casual Leave": "🏖️", 
      "Earned Leave": "💼",
      "CompOff Leave": "⏰"
    };
    return icons[type] || "📋";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your leave requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-700 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (leaves.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center p-6">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Leave Requests</h3>
          <p className="text-gray-500">You haven't submitted any leave requests yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <span className="mr-2">📋</span>
          Leave History ({leaves.length})
        </h3>
      </div>
      
      <div className="space-y-4 h-[calc(100%-60px)] overflow-y-auto pr-2">
        {leaves.map((leave, index) => (
          <div 
            key={leave._id || index} 
            className="bg-white/70 backdrop-blur-sm rounded-xl p-5 shadow-md border border-white/50 hover:shadow-lg transition-all duration-300 hover:bg-white/80"
          >
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getLeaveTypeIcon(leave.leaveType)}</span>
                <div>
                  <h4 className="font-bold text-gray-800">{leave.leaveType}</h4>
                  <p className="text-sm text-gray-600">{leave.leaveDuration || "Full Day"}</p>
                </div>
              </div>
              {getStatusBadge(leave.status)}
            </div>
            
            {/* Date Range */}
            <div className="mb-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="flex items-center text-sm">
                <span className="font-medium text-gray-700 mr-2">📅 Duration:</span>
                <span className="text-gray-800">
                  {leave.startDate?.slice(0, 10)} → {leave.endDate?.slice(0, 10)}
                </span>
              </div>
            </div>
            
            {/* Reason */}
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-700 mb-1">📝 Reason:</div>
              <p className="text-gray-800 text-sm leading-relaxed bg-gray-50/50 p-2 rounded-lg">
                {leave.reason}
              </p>
            </div>
            
            {/* Approval Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-purple-50/50 rounded-lg border border-purple-100">
                <div className="text-xs font-medium text-gray-600 mb-1">👨‍💼 HOD</div>
                {getDecisionBadge(
                  leave.hodDecision && typeof leave.hodDecision === "object"
                    ? leave.hodDecision.decision
                    : leave.hodDecision
                )}
              </div>
              <div className="text-center p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                <div className="text-xs font-medium text-gray-600 mb-1">🏛️ Principal</div>
                {getDecisionBadge(
                  leave.principalDecision && typeof leave.principalDecision === "object"
                    ? leave.principalDecision.decision
                    : leave.principalDecision
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SentLeaveRequests;
