import { useState, useEffect } from "react";
import axios from "axios";
import { User, Calendar, Info } from "lucide-react";

export default function SentChargeHandover() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current user employeeId
  const userData = JSON.parse(localStorage.getItem("user"));
  const employeeId = userData?.employeeId || "";

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = userData?.token || localStorage.getItem("authToken");
      const res = await axios.get(
        `http://localhost:5000/api/tasks/sent/${employeeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch requests"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Sent Charge Handover Requests
            </h1>
          </div>

          <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Your Requests</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {requests.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No requests found.
                </div>
              ) : (
                requests.map((request) => (
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
                              Status:
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 ml-6">
                            {request.status === "pending" ? (
                              <span className="text-amber-600">Pending</span>
                            ) : request.status === "approved" ? (
                              <span className="text-green-600">Approved</span>
                            ) : (
                              <span className="text-red-600">Rejected</span>
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
