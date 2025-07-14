import { useState, useEffect } from "react";
import axios from "axios";
import SentLeaveRequests from "./SentLeaveRequests";

const ApplyLeave = ({ userData }) => {
  const [formData, setFormData] = useState({
    employeeId: userData?.employeeId || "",
    firstName: userData?.firstName || "",
    leaveType: "Sick Leave",
    type:
      userData?.role === "HOD"
        ? "HOD"
        : userData?.role === "principal"
        ? "Principal"
        : userData?.role === "nonteaching"
        ? "Staff"
        : "Faculty",
    department: userData?.department || "",
    startDate: "",
    endDate: "",
    reason: "",
    leaveDuration: "Full Day", // NEW FIELD
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userData?.employeeId) {
      setFormData((prev) => ({
        ...prev,
        employeeId: userData.employeeId,
        firstName: userData.firstName || prev.firstName,
        type:
          userData.role === "HOD"
            ? "HOD"
            : userData.role === "principal"
            ? "Principal"
            : userData.role === "nonteaching"
            ? "Staff"
            : "Faculty",
        department: userData.department || prev.department,
      }));
    }
  }, [userData]);

  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    } else {
      const startDate = new Date(formData.startDate);
      if (startDate < today) {
        newErrors.startDate = "Start date cannot be in the past";
      }
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    } else if (formData.startDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (endDate < startDate) {
        newErrors.endDate = "End date cannot be before start date";
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "Reason is required";
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = "Reason must be at least 10 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage("");

    try {
      const response = await axios.post("http://localhost:5000/api/leave/apply", {
        ...formData,
        employeeId: userData?.employeeId,
        firstName: userData?.firstName,
        department: userData?.department,
      });

      if (response.status === 201) {
        setMessage("✅ Leave application submitted successfully!");
        setFormData((prev) => ({
          ...prev,
          startDate: "",
          endDate: "",
          reason: "",
          leaveType: "Sick Leave",
          leaveDuration: "Full Day",
        }));
        setErrors({});
      }
    } catch (error) {
      console.error("Error submitting leave:", error);
      setMessage(
        error.response?.data?.message ||
          "❌ Error submitting leave application. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
              📝 Leave Application
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Submit your leave request with ease and track your application status
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-3xl hover:bg-white/90">
            <div className="flex flex-col lg:flex-row">
              {/* Left Side - Form */}
              <div className="lg:w-1/2 w-full p-8">
                {/* Header Card */}
                <div className="mb-8 p-6 bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl shadow-lg border border-white/10">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-6 shadow-inner">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">
                        Leave Application
                      </h2>
                      <p className="text-white/80 text-lg font-medium">
                        Submit Your Leave Request
                      </p>
                    </div>
                  </div>
                </div>

                {/* Employee Details Card */}
                <div className="mb-8 p-6 bg-gradient-to-r from-white/60 to-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-sm">👤</span>
                    </span>
                    Employee Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/50 rounded-xl border border-gray-100">
                      <span className="font-semibold text-gray-700 block mb-1">
                        Employee ID
                      </span>
                      <p className="text-gray-800 font-medium">
                        {userData?.employeeId || "Loading..."}
                      </p>
                    </div>
                    <div className="p-4 bg-white/50 rounded-xl border border-gray-100">
                      <span className="font-semibold text-gray-700 block mb-1">Name</span>
                      <p className="text-gray-800 font-medium">
                        {userData?.firstName || "Loading..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Section */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                        📋 Leave Type
                      </label>
                      <select
                        value={formData.leaveType}
                        onChange={(e) =>
                          setFormData({ ...formData, leaveType: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm"
                      >
                        <option value="Sick Leave">🤒 Sick Leave</option>
                        <option value="Casual Leave">🏖️ Casual Leave</option>
                        <option value="Earned Leave">💼 Earned Leave</option>
                        <option value="CompOff Leave">⏰ CompOff Leave</option>
                      </select>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                        ⏱️ Leave Duration
                      </label>
                      <select
                        value={formData.leaveDuration}
                        onChange={(e) =>
                          setFormData({ ...formData, leaveDuration: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm"
                      >
                        <option value="Full Day">🌅 Full Day</option>
                        <option value="Half Day">🌗 Half Day</option>
                      </select>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                      👤 Employee Type
                    </label>
                    <input
                      type="text"
                      value={formData.type}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100/70 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm cursor-not-allowed text-gray-600 font-medium"
                    />
                    {errors.type && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.type}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                        📅 Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({ ...formData, startDate: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm"
                      />
                      {errors.startDate && (
                        <p className="text-sm text-red-500 mt-1 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {errors.startDate}
                        </p>
                      )}
                    </div>
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                        📅 End Date
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm"
                      />
                      {errors.endDate && (
                        <p className="text-sm text-red-500 mt-1 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {errors.endDate}
                        </p>
                      )}
                    </div>
                  </div>
                  {errors.date && (
                    <p className="text-sm text-red-500 mt-1 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.date}
                    </p>
                  )}

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                      📝 Reason
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm resize-none"
                      rows="4"
                      placeholder="Please provide a detailed reason for your leave request..."
                    />
                    {errors.reason && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.reason}
                      </p>
                    )}
                  </div>

                  {/* Hidden department field for backend */}
                  <input
                    type="hidden"
                    value={formData.department}
                    name="department"
                  />

                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      '📤 Submit Application'
                    )}
                  </button>

                  {message && (
                    <div
                      className={`p-4 rounded-xl text-center font-medium backdrop-blur-sm border transition-all duration-500 ${
                        message.includes("Error")
                          ? "bg-red-50/80 border-red-200 text-red-800"
                          : "bg-green-50/80 border-green-200 text-green-800"
                      } animate-pulse`}
                    >
                      <span className="mr-2">
                        {message.includes("Error") ? "❌" : "✅"}
                      </span>
                      {message}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - View Sent Requests */}
              <div className="lg:w-1/2 w-full bg-gradient-to-br from-indigo-50/50 to-purple-100/50 backdrop-blur-sm p-8 overflow-hidden">
                <div className="h-full">
                  {/* Header */}
                  <div className="mb-6 p-6 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg border border-white/10">
                    <div className="flex items-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-6 shadow-inner">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                          📋 Your Leave Requests
                        </h2>
                        <p className="text-white/80 text-lg font-medium">
                          Track Application Status
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sent Requests Component */}
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6 h-[calc(100%-140px)] overflow-auto">
                    <SentLeaveRequests employeeId={userData?.employeeId} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;
