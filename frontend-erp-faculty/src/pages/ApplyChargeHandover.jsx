import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, User, FileText, Package, CheckCircle, Plus, Trash2 } from "lucide-react";
import axios from "axios";

// Custom CSS for scrollbar
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

export default function ApplyChargeHandoverForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    designation: "",
    department: "",
    handoverStartDate: "",
    handoverEndDate: "",
    handoverReason: "",
    receiverName: "",
    receiverDesignation: "",
    documents: [],
    assets: [],
    pendingTasks: [],
    remarks: "",
    status: "pending_hod",
  });
  const [tempItem, setTempItem] = useState("");
  const [itemType, setItemType] = useState("documents");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [receiverId, setReceiverId] = useState(""); // store selected faculty id
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  useEffect(() => {
    // ...existing code...
    // Fetch faculty list for receiver selection
    const fetchFacultyList = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/faculty/faculties?limit=1000"
        );
        const data = await res.json();
        setFacultyList(
          Array.isArray(data.data?.faculties) ? data.data.faculties : []
        );
      } catch (err) {
        // handle error if needed
      }
    };
    fetchFacultyList();
  }, [navigate]);
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const userData = JSON.parse(localStorage.getItem("user"));
        const token = userData?.token || localStorage.getItem("authToken");

        if (!token) {
          setError("Please log in to continue");
          navigate("/login");
          return;
        }

        const response = await fetch("http://localhost:5000/api/auth/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          // Support both name and firstName/lastName from backend
          setFormData((prev) => ({
            ...prev,
            employeeName:
              userData.name ||
              (userData.firstName || "") +
                (userData.lastName ? " " + userData.lastName : ""),
            employeeId: userData.employeeId || "",
            designation: userData.designation || "",
            department: userData.department || "",
          }));
        } else {
          const errorData = await response.json();
          setError(errorData.message || "Failed to fetch user profile");

          if (response.status === 401) {
            setError("Session expired. Please log in again.");
            localStorage.removeItem("user");
            localStorage.removeItem("authToken");
            navigate("/login");
          }
        }
      } catch (err) {
        setError("Failed to connect to the server");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleAddItem = () => {
    if (tempItem.trim()) {
      setFormData((prev) => ({
        ...prev,
        [itemType]: [...prev[itemType], tempItem.trim()],
      }));
      setTempItem("");
    }
  };

  const handleRemoveItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      [itemType]: prev[itemType].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (
        !formData.employeeName ||
        !formData.employeeId ||
        !formData.designation ||
        !formData.department ||
        !formData.handoverStartDate ||
        !formData.handoverEndDate ||
        !formData.handoverReason ||
        !formData.receiverDesignation
      ) {
        throw new Error("Please fill all required fields");
      }
      const startDate = new Date(formData.handoverStartDate);
      const endDate = new Date(formData.handoverEndDate);
      if (startDate > endDate) {
        throw new Error("End date must be after start date");
      }
      const receiverName =
        (selectedReceiver &&
          selectedReceiver.name &&
          selectedReceiver.name.trim()) ||
        (selectedReceiver &&
          [selectedReceiver.firstName, selectedReceiver.lastName]
            .filter(Boolean)
            .join(" ")) ||
        formData.receiverName;
      const userData = JSON.parse(localStorage.getItem("user"));
      const senderId = userData?._id || userData?.id; // Get senderId
      const token = userData?.token || localStorage.getItem("authToken");
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      const payload = {
        ...formData,
        senderId, // Add senderId to payload
        receiverName,
        receiverId: receiverId,
        reason: formData.handoverReason,
        handoverStartDate: startDate,
        handoverEndDate: endDate,
        reportingManager: formData.employeeName,
      };
      delete payload.handoverReason;
      console.log("Payload being submitted:", payload);

      await axios.post("http://localhost:5000/api/tasks", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(true);
      setTimeout(() => navigate("/dashboard/approveChargeHandover"), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Submission failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{customScrollbarStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <span className="text-gray-700 font-medium">Loading your profile...</span>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
              🔄 Charge Handover Application
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Submit your charge handover request for approval and proper transition of responsibilities
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-3xl hover:bg-white/90">
            <div className="p-8">
              {/* Header Card */}
              <div className="mb-8 p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg border border-white/10">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-6 shadow-inner">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                      Charge Handover Form
                    </h2>
                    <p className="text-white/80 text-lg font-medium">
                      Transfer of Duties and Responsibilities
                    </p>
                  </div>
                </div>
              </div>

              {/* Message Section */}
              {error && (
                <div className="mb-8 p-6 rounded-2xl text-center font-medium backdrop-blur-sm border bg-red-50/80 border-red-200 text-red-800 animate-pulse">
                  <span className="text-2xl mr-3">❌</span>
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-8 p-6 rounded-2xl text-center font-medium backdrop-blur-sm border bg-green-50/80 border-green-200 text-green-800 animate-pulse">
                  <span className="text-2xl mr-3">✅</span>
                  Form submitted successfully! Redirecting...
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Basic Details */}
                <section className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 backdrop-blur-sm border border-blue-200/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      👤 Basic Details
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {["employeeName", "employeeId", "designation", "department"].map(
                      (field) => (
                        <div key={field} className="group">
                          <label className="block text-sm font-semibold text-gray-700 mb-3 transition-colors group-focus-within:text-blue-600">
                            {field === "employeeName" && "👤"} 
                            {field === "employeeId" && "🆔"} 
                            {field === "designation" && "💼"} 
                            {field === "department" && "🏢"} 
                            {" "}
                            {field.replace(/([A-Z])/g, " $1").trim()}
                          </label>
                          <input
                            type="text"
                            name={field}
                            value={formData[field]}
                            onChange={handleChange}
                            className="w-full px-4 py-4 bg-gray-100/70 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700 font-medium cursor-not-allowed transition-all duration-300 shadow-sm"
                            readOnly
                          />
                        </div>
                      )
                    )}
                  </div>
                </section>

                {/* Handover Details */}
                <section className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 backdrop-blur-sm border border-purple-200/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      📋 Handover Details
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="lg:col-span-2 group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 transition-colors group-focus-within:text-purple-600">
                        📅 Handover Period
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs font-medium text-gray-600 mb-2 block">Start Date</span>
                          <input
                            type="date"
                            name="handoverStartDate"
                            value={formData.handoverStartDate}
                            onChange={handleChange}
                            className="w-full px-4 py-4 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-600 mb-2 block">End Date</span>
                          <input
                            type="date"
                            name="handoverEndDate"
                            value={formData.handoverEndDate}
                            onChange={handleChange}
                            className="w-full px-4 py-4 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 transition-colors group-focus-within:text-purple-600">
                        🔄 Reason for Handover
                      </label>
                      <select
                        name="handoverReason"
                        value={formData.handoverReason}
                        onChange={handleChange}
                        className="w-full px-4 py-4 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium appearance-none"
                        required
                      >
                        <option value="">Select reason for handover</option>
                        <option value="Transfer">🔄 Transfer</option>
                        <option value="Resignation">📤 Resignation</option>
                        <option value="Leave">🏖️ Leave</option>
                        <option value="Promotion">⬆️ Promotion</option>
                        <option value="Other">➕ Other</option>
                      </select>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 mb-3 transition-colors group-focus-within:text-purple-600">
                        👤 Select Receiver
                      </label>
                      <select
                        value={receiverId}
                        onChange={async (e) => {
                          const id = e.target.value;
                          setReceiverId(id);
                          if (id) {
                            const res = await fetch(
                              `http://localhost:5000/api/faculty/faculties?facultyId=${id}`
                            );
                            const data = await res.json();
                            const faculty = Array.isArray(data.data?.faculties)
                              ? data.data.faculties[0]
                              : null;
                            if (faculty) {
                              setSelectedReceiver(faculty);
                              setFormData((prev) => ({
                                ...prev,
                                receiverName:
                                  (faculty.name && faculty.name.trim()) ||
                                  [faculty.firstName, faculty.lastName]
                                    .filter(Boolean)
                                    .join(" ") ||
                                  "",
                                receiverDesignation: faculty.designation || "",
                                receiverDepartment: faculty.department || "",
                                receiverEmployeeId: faculty.employeeId || "",
                              }));
                            }
                          } else {
                            setSelectedReceiver(null);
                            setFormData((prev) => ({
                              ...prev,
                              receiverName: "",
                              receiverDesignation: "",
                              receiverDepartment: "",
                              receiverEmployeeId: "",
                            }));
                          }
                        }}
                        className="w-full px-4 py-4 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium appearance-none"
                      >
                        <option value="">Choose who will receive the charge</option>
                        {facultyList.map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.name || `${f.firstName || ""} ${f.lastName || ""}`} - {f.designation}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Receiver Details */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          👤 Receiver's Name
                        </label>
                        <input
                          type="text"
                          name="receiverName"
                          value={formData.receiverName}
                          readOnly
                          className="w-full px-4 py-4 bg-gray-100/70 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700 font-medium cursor-not-allowed transition-all duration-300 shadow-sm"
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          💼 Receiver's Designation
                        </label>
                        <input
                          type="text"
                          name="receiverDesignation"
                          value={formData.receiverDesignation}
                          readOnly
                          className="w-full px-4 py-4 bg-gray-100/70 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700 font-medium cursor-not-allowed transition-all duration-300 shadow-sm"
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          🏢 Receiver's Department
                        </label>
                        <input
                          type="text"
                          name="receiverDepartment"
                          value={formData.receiverDepartment || ""}
                          readOnly
                          className="w-full px-4 py-4 bg-gray-100/70 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700 font-medium cursor-not-allowed transition-all duration-300 shadow-sm"
                        />
                      </div>

                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          🆔 Receiver's Employee ID
                        </label>
                        <input
                          type="text"
                          name="receiverEmployeeId"
                          value={formData.receiverEmployeeId || ""}
                          readOnly
                          className="w-full px-4 py-4 bg-gray-100/70 backdrop-blur-sm border border-gray-200 rounded-xl text-gray-700 font-medium cursor-not-allowed transition-all duration-300 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Assets / Responsibilities */}
                <section className="bg-gradient-to-br from-green-50/50 to-emerald-50/50 backdrop-blur-sm border border-green-200/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      📦 Assets & Responsibilities
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Add Items Section */}
                    <div className="space-y-4">
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          📝 Category
                        </label>
                        <select
                          value={itemType}
                          onChange={(e) => setItemType(e.target.value)}
                          className="w-full px-4 py-4 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium appearance-none"
                        >
                          <option value="documents">📄 Documents</option>
                          <option value="assets">💎 Assets</option>
                          <option value="pendingTasks">⏰ Pending Tasks</option>
                        </select>
                      </div>
                      
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          ✍️ Add Item
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={tempItem}
                            onChange={(e) => setTempItem(e.target.value)}
                            placeholder={`Enter ${itemType.replace(/([A-Z])/g, " $1").toLowerCase()}...`}
                            className="flex-1 px-4 py-4 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm text-gray-700 font-medium"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                          />
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Items List Section */}
                    <div className="bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 shadow-inner">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-700 flex items-center">
                          {itemType === "documents" && "📄"}
                          {itemType === "assets" && "💎"}
                          {itemType === "pendingTasks" && "⏰"}
                          <span className="ml-2 capitalize">
                            {itemType.replace(/([A-Z])/g, " $1")}
                          </span>
                        </h4>
                        <span className="text-sm bg-gray-100 px-3 py-1 rounded-full font-medium text-gray-600">
                          {formData[itemType].length} items
                        </span>
                      </div>
                      
                      {formData[itemType].length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                          {formData[itemType].map((item, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200/50 group hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
                            >
                              <span className="text-sm font-medium text-gray-700 flex-1 mr-3 truncate">
                                {item}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                          <Package className="h-12 w-12 mb-3 opacity-50" />
                          <p className="text-sm italic">
                            No {itemType.replace(/([A-Z])/g, " $1").toLowerCase()} added yet
                          </p>
                          <p className="text-xs mt-1">
                            Add items using the form on the left
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Remarks */}
                <section className="bg-gradient-to-br from-orange-50/50 to-yellow-50/50 backdrop-blur-sm border border-orange-200/30 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      💬 Additional Remarks
                    </h2>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 transition-colors group-focus-within:text-orange-600">
                      📝 Comments & Special Instructions
                    </label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Please provide any additional information, special instructions, or important notes regarding the handover process..."
                      className="w-full px-4 py-4 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm resize-none text-gray-700 font-medium leading-relaxed"
                    />
                    <p className="mt-2 text-sm text-gray-500 flex items-center">
                      <span className="mr-1">💡</span>
                      Include any special considerations or instructions for the handover process
                    </p>
                  </div>
                </section>

                {/* Submit Button */}
                <div className="flex justify-center pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-12 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        <span>Submitting Request...</span>
                      </div>
                    ) : (
                      <>
                        <CheckCircle className="h-6 w-6 mr-3" />
                        Submit Handover Request
                      </>
                    )}
                  </button>
                </div>
        </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
