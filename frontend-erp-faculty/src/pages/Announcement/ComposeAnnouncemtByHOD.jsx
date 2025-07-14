import React, { useState, useEffect } from "react";
import axios from "axios";

const AnnouncementForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    tag: "",
    endDate: "",
    visibleTo: [],
  });

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // HOD can create announcements for their department
  const roles = ["student", "teaching_staff", "non_teaching_staff", "cc"]; // All department members
  const currentDashboard = "hod";

  // Add custom styles for animations
  const addCustomStyles = () => {
    if (!document.getElementById('announcement-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'announcement-styles';
      styleSheet.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .scrollbar-thin {
          scrollbar-width: thin;
        }
        
        .scrollbar-thumb-purple-200::-webkit-scrollbar-thumb {
          background-color: rgb(196 181 253);
          border-radius: 0.375rem;
        }
        
        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }
        
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `;
      document.head.appendChild(styleSheet);
    }
  };

  useEffect(() => {
    addCustomStyles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      visibleTo: checked
        ? [...prev.visibleTo, value]
        : prev.visibleTo.filter((role) => role !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await axios.post("http://localhost:5000/api/announcements", formData);
      setMessage({ 
        type: 'success', 
        text: '✅ Announcement created successfully!' 
      });
      setFormData({
        title: "",
        description: "",
        tag: "",
        endDate: "",
        visibleTo: [],
      });
      fetchAnnouncements();
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (err) {
      console.error(err);
      setMessage({ 
        type: 'error', 
        text: '❌ Failed to create announcement. Please try again.' 
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } finally {
      setSubmitLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/announcements/${currentDashboard}`
      );
      setAnnouncements(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-0">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
            🏢 Department Announcement Dashboard
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create and manage department announcements for all department members
          </p>
        </div>
        
        <div className="flex flex-col xl:flex-row gap-8">
          {/* Create Announcement Form */}
          <div className="xl:w-1/2">
            <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl shadow-2xl p-8 transition-all duration-500 hover:shadow-3xl hover:bg-white/90 hover:scale-[1.02]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">🏢</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Create Department Announcement
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    For all department members - students, faculty and staff
                  </p>
                </div>
              </div>
              
              {/* Success/Error Message */}
              {message.text && (
                <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm border transition-all duration-500 ${
                  message.type === 'success' 
                    ? 'bg-green-50/80 border-green-200 text-green-800' 
                    : 'bg-red-50/80 border-red-200 text-red-800'
                } animate-pulse`}>
                  <p className="font-medium">{message.text}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                      📝 Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter department announcement title..."
                      required
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                      📄 Description
                    </label>
                    <textarea
                      name="description"
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm resize-none"
                      rows="5"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Write your department-specific announcement..."
                      required
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                      🏷️ Tag
                    </label>
                    <input
                      type="text"
                      name="tag"
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm"
                      value={formData.tag}
                      onChange={handleChange}
                      placeholder="e.g., meeting, exam, academic, departmental..."
                      required
                    />
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 transition-colors group-focus-within:text-blue-600">
                      📅 End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:bg-white/90 focus:bg-white shadow-sm"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      🏢 Visible To (Department)
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {roles.map((role) => (
                        <label
                          key={role}
                          className="flex items-center gap-3 p-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white/80 transition-all duration-300 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            value={role}
                            checked={formData.visibleTo.includes(role)}
                            onChange={handleCheckboxChange}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all duration-200"
                          />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                            {role === "student" && "🎓 "}
                            {role === "teaching_staff" && "👨‍🏫 "}
                            {role === "non_teaching_staff" && "👨‍💼 "}
                            {role === "cc" && "🎯 "}
                            {role === "cc" ? "COURSE COORDINATOR" : role.replace("_", " ").toUpperCase()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {submitLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Creating...</span>
                    </div>
                  ) : (
                    '🏢 Create Department Announcement'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="xl:w-1/2">
            <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl shadow-2xl p-8 h-full transition-all duration-500 hover:shadow-3xl hover:bg-white/90">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl">📋</span>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Department Announcements
                </h2>
              </div>
              
              {loading ? (
                <div className="flex flex-col justify-center items-center h-64 space-y-4">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 absolute top-0 left-0"></div>
                  </div>
                  <p className="text-gray-600 font-medium">Loading announcements...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-64 space-y-4">
                  <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-4xl">📭</span>
                  </div>
                  <p className="text-gray-500 text-center text-lg font-medium">
                    No department announcements found.
                  </p>
                  <p className="text-gray-400 text-sm text-center max-w-md">
                    Create your first department announcement for all department members!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
                  {announcements.map((announcement, index) => (
                    <div
                      key={announcement._id}
                      className="group p-6 bg-gradient-to-r from-white/60 to-white/80 backdrop-blur-sm border border-white/30 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:from-white/80 hover:to-white/90"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards'
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors line-clamp-2">
                          {announcement.title}
                        </h3>
                        <div className="flex-shrink-0 ml-4">
                          <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                        {announcement.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs font-semibold rounded-full">
                          🏷️ {announcement.tag}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs font-semibold rounded-full">
                          👥 {announcement.visibleTo.length} roles
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 text-xs">
                        {announcement.visibleTo.map((role) => (
                          <span
                            key={role}
                            className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg font-medium"
                          >
                            {role === "student" && "🎓"}
                            {role === "teaching_staff" && "👨‍🏫"}
                            {role === "non_teaching_staff" && "👨‍💼"}
                            {role === "cc" && "🎯"}
                            {" "}{role === "cc" ? "CC" : role.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-200/50">
                        <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-red-100 to-orange-100 text-red-700 text-xs font-semibold rounded-full">
                          ⏰ Expires: {new Date(announcement.endDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementForm;
