import { useState, useEffect } from "react";
import { Calendar, ArrowRight, Upload, X } from "lucide-react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export default function ApplyODLeave({ userData }) {
  const navigate = useNavigate();
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contact, setContact] = useState("");
  const [reason, setReason] = useState("");
  const [eventName, setEventName] = useState("");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [approvalLetter, setApprovalLetter] = useState(null);
  const [approvalLetterName, setApprovalLetterName] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const odLeaveTypes = [
    { value: "Conference", label: "🎓 Conference" },
    { value: "Workshop", label: "🔧 Workshop" },
    { value: "Seminar", label: "📚 Seminar" },
    { value: "Training", label: "💼 Training Program" },
    { value: "Official Duty", label: "🏛️ Official Duty" },
    { value: "Research Work", label: "🔬 Research Work" },
    { value: "Academic Visit", label: "🎯 Academic Visit" },
  ];

  useEffect(() => {
    if (!userData?.token) {
      setMessage("Please log in to apply for OD leave.");
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [userData, navigate]);

  const validateForm = () => {
    const newErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!leaveType) newErrors.leaveType = "OD leave type is required";
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!endDate) newErrors.endDate = "End date is required";
    if (!contact) newErrors.contact = "Contact information is required";
    if (!reason) newErrors.reason = "Detailed reason is required";
    if (!eventName) newErrors.eventName = "Event/purpose name is required";
    if (!location) newErrors.location = "Location is required";

    if (startDate) {
      const start = new Date(startDate);
      if (start < today) {
        newErrors.startDate = "Start date cannot be in the past";
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start >= end) {
        newErrors.date = "Start date must be before end date";
      }
    }

    if (file && file.size > 5 * 1024 * 1024) {
      newErrors.file = "Attachment size must be less than 5MB";
    }
    if (approvalLetter && approvalLetter.size > 5 * 1024 * 1024) {
      newErrors.approvalLetter = "Approval letter size must be less than 5MB";
    }

    return newErrors;
  };

  const handleFileChange = (e, type) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (type === "attachment") {
        setFile(selectedFile);
        setFileName(selectedFile.name);
      } else {
        setApprovalLetter(selectedFile);
        setApprovalLetterName(selectedFile.name);
      }
    }
  };

  const clearFile = (type) => {
    if (type === "attachment") {
      setFile(null);
      setFileName("");
    } else {
      setApprovalLetter(null);
      setApprovalLetterName("");
    }
  };

  const handleCancel = () => {
    setLeaveType("");
    setStartDate("");
    setEndDate("");
    setContact("");
    setReason("");
    setEventName("");
    setLocation("");
    setFile(null);
    setFileName("");
    setApprovalLetter(null);
    setApprovalLetterName("");
    setErrors({});
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setErrors({});
    setMessage("");
    setLoading(true);

    try {
      const decoded = userData?.token ? jwtDecode(userData.token) : {};
      const employeeId = decoded.employeeId || userData?.employeeId;
      const role = (userData.role || decoded.role || "").toLowerCase();
      if (!employeeId) {
        throw new Error("Employee ID missing");
      }

      // Map role to type
      let type = "Faculty";
      if (role === "hod") type = "HOD";
      else if (role === "principal") type = "Principal";
      else if (role === "staff") type = "Staff";

      const formData = new FormData();
      formData.append("employeeId", employeeId);
      formData.append("firstName", userData?.firstName || "");
      formData.append("leaveType", leaveType);
      formData.append("type", type);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("reason", reason);
      formData.append("contact", contact);
      formData.append("eventName", eventName);
      formData.append("location", location);
      if (file) formData.append("attachment", file);
      if (approvalLetter) formData.append("approvalLetter", approvalLetter);

      const response = await axios.post(
        "http://localhost:5000/api/leave/odleave/apply",
        formData,
        {
          headers: {
            Authorization: `Bearer ${userData.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(
        response.data.message || "OD Leave application submitted successfully!"
      );
      handleCancel();
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Error submitting OD leave application";
      setMessage(errorMsg);
      console.error("Submit error:", {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
              � OD Leave Application
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Apply for On-Duty leave for conferences, workshops, training, and official duties
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-3xl hover:bg-white/90">
            <div className="p-8">
              {/* Header Card */}
              <div className="mb-8 p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg border border-white/10">
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
                      OD Leave Application
                    </h2>
                    <p className="text-white/80 text-lg font-medium">
                      On-Duty Leave Request Form
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Section */}
              {message && (
                <div
                  className={`mb-8 p-6 rounded-2xl text-center font-medium backdrop-blur-sm border transition-all duration-500 ${
                    message.toLowerCase().includes("error")
                      ? "bg-red-50/80 border-red-200 text-red-800"
                      : "bg-green-50/80 border-green-200 text-green-800"
                  } animate-pulse`}
                >
                  <span className="text-2xl mr-3">
                    {message.toLowerCase().includes("error") ? "❌" : "✅"}
                  </span>
                  {message}
                </div>
              )}

              {/* Form Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* OD Leave Type */}
                <div className="group lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 transition-colors group-focus-within:text-blue-600">
                    🎯 Type of OD Leave
                  </label>
                  <div className="relative">
                    <select
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value)}
                      className={`w-full px-4 py-4 bg-white/70 backdrop-blur-sm border ${
                        errors.leaveType ? "border-red-400" : "border-gray-200"
                      } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm appearance-none text-gray-700 font-medium`}
                      disabled={loading}
                    >
                      <option value="">Select the purpose of your OD leave</option>
                      {odLeaveTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <ArrowRight className="h-5 w-5 rotate-90" />
                    </div>
                  </div>
                  {errors.leaveType && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.leaveType}
                    </p>
                  )}
                </div>

                {/* Event/Purpose Name */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 transition-colors group-focus-within:text-blue-600">
                    🎯 Event/Purpose Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., International Conference on Technology"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className={`w-full px-4 py-4 bg-white/70 backdrop-blur-sm border ${
                      errors.eventName ? "border-red-400" : "border-gray-200"
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium`}
                    disabled={loading}
                  />
                  {errors.eventName && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.eventName}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 transition-colors group-focus-within:text-blue-600">
                    📍 Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Mumbai, Maharashtra"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`w-full px-4 py-4 bg-white/70 backdrop-blur-sm border ${
                      errors.location ? "border-red-400" : "border-gray-200"
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium`}
                    disabled={loading}
                  />
                  {errors.location && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.location}
                    </p>
                  )}
                </div>

                {/* Start Date */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 transition-colors group-focus-within:text-blue-600">
                    📅 Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`w-full px-4 py-4 bg-white/70 backdrop-blur-sm border ${
                        errors.startDate || errors.date
                          ? "border-red-400"
                          : "border-gray-200"
                      } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium`}
                      disabled={loading}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                  {errors.startDate && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.startDate}
                    </p>
                  )}
                  {errors.date && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.date}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 transition-colors group-focus-within:text-blue-600">
                    📅 End Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`w-full px-4 py-4 bg-white/70 backdrop-blur-sm border ${
                        errors.endDate || errors.date
                          ? "border-red-400"
                          : "border-gray-200"
                      } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium`}
                      disabled={loading}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                  {errors.endDate && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.endDate}
                    </p>
                  )}
                </div>

                {/* Contact During Leave */}
                <div className="group lg:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 transition-colors group-focus-within:text-blue-600">
                    📞 Contact During Leave
                  </label>
                  <input
                    type="text"
                    placeholder="Phone number or email address"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className={`w-full px-4 py-4 bg-white/70 backdrop-blur-sm border ${
                      errors.contact ? "border-red-400" : "border-gray-200"
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium`}
                    disabled={loading}
                  />
                  {errors.contact && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {errors.contact}
                    </p>
                  )}
                </div>


              </div>

              {/* Reason for OD Leave */}
              <div className="mt-8 group">
                <label className="block text-sm font-semibold text-gray-700 mb-3 transition-colors group-focus-within:text-blue-600">
                  📝 Detailed Purpose & Justification
                </label>
                <textarea
                  rows={5}
                  placeholder="Please provide comprehensive details about your OD leave request including:
• Purpose and objectives of the event/duty
• Expected benefits and learning outcomes
• How it aligns with institutional goals
• Any additional relevant information..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`w-full px-4 py-4 bg-white/70 backdrop-blur-sm border ${
                    errors.reason ? "border-red-400" : "border-gray-200"
                  } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm resize-none text-gray-700 font-medium leading-relaxed`}
                  disabled={loading}
                />
                {errors.reason && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.reason}
                  </p>
                )}
              </div>

              {/* File Attachment */}
              <div className="mt-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📎 Attachment (Optional)
                </label>
                {fileName ? (
                  <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl py-4 px-5 shadow-sm">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📄</span>
                      <div>
                        <span className="text-sm font-medium text-blue-700">{fileName}</span>
                        <p className="text-xs text-blue-600">File uploaded successfully</p>
                      </div>
                    </div>
                    <button
                      onClick={() => clearFile("attachment")}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                      disabled={loading}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative group">
                    <input
                      type="file"
                      id="attachment-upload"
                      onChange={(e) => handleFileChange(e, "attachment")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={loading}
                    />
                    <div className="border-2 border-dashed border-gray-300 group-hover:border-blue-400 rounded-xl py-8 px-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-white/50 group-hover:bg-blue-50/50">
                      <Upload className="h-8 w-8 text-gray-400 group-hover:text-blue-500 mb-3 transition-colors duration-200" />
                      <span className="text-gray-600 font-medium mb-1">Choose file to upload</span>
                      <span className="text-sm text-gray-500">or drag and drop here</span>
                    </div>
                  </div>
                )}
                {errors.file && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.file}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <span className="mr-1">💡</span>
                  Upload supporting documents if required (max 5MB)
                </p>
              </div>

              {/* Approval Letter for OD Leave */}
              <div className="mt-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  📋 Event Approval/Invitation Letter (Recommended)
                </label>
                {approvalLetterName ? (
                  <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl py-4 px-5 shadow-sm">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">📃</span>
                      <div>
                        <span className="text-sm font-medium text-green-700">{approvalLetterName}</span>
                        <p className="text-xs text-green-600">Approval letter uploaded</p>
                      </div>
                    </div>
                    <button
                      onClick={() => clearFile("approvalLetter")}
                      className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors duration-200"
                      disabled={loading}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative group">
                    <input
                      type="file"
                      id="approval-letter-upload"
                      onChange={(e) => handleFileChange(e, "approvalLetter")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      disabled={loading}
                    />
                    <div className="border-2 border-dashed border-gray-300 group-hover:border-green-400 rounded-xl py-8 px-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 bg-white/50 group-hover:bg-green-50/50">
                      <Upload className="h-8 w-8 text-gray-400 group-hover:text-green-500 mb-3 transition-colors duration-200" />
                      <span className="text-gray-600 font-medium mb-1">Upload approval/invitation letter</span>
                      <span className="text-sm text-gray-500">if available</span>
                    </div>
                  </div>
                )}
                {errors.approvalLetter && (
                  <p className="mt-2 text-sm text-red-500 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {errors.approvalLetter}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <span className="mr-1">💡</span>
                  Upload invitation letter, approval document, or event brochure (max 5MB)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-between">
                <button
                  onClick={handleCancel}
                  className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  🔄 Cancel & Reset
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    <>
                      <span className="mr-2">�</span>
                      Submit OD Leave Application
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
