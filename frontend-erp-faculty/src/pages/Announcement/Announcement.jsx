import React, { useEffect, useState } from "react";
import axios from "axios";

const TeachingAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/announcements/teaching_staff`
      );
      setAnnouncements(res.data.reverse()); // latest first
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    } finally {
      setLoading(false);
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

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-30px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
            50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5); }
          }
          .animate-fade-in {
            animation: fadeIn 0.6s ease-out forwards;
          }
          .animate-slide-in-left {
            animation: slideInLeft 0.8s ease-out forwards;
          }
          .card-hover {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .card-hover:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          }
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}
      </style>

      <div className="max-w-6xl mx-auto relative z-0">
        <header className="text-center mb-12 animate-slide-in-left">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
            📢 Teaching Staff Announcements
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay updated with official notices and important communications from administrative authorities
          </p>
        </header>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 absolute top-0 left-0"></div>
            </div>
            <p className="text-gray-600 font-medium text-lg">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl shadow-2xl p-12 text-center animate-fade-in">
            <div className="w-32 h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-6xl">📭</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-4">No Announcements</h3>
            <p className="text-gray-500 text-lg max-w-md mx-auto">
              No announcements are currently available for teaching staff. Check back later for updates!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 max-w-4xl mx-auto">
            {announcements.map((announcement, index) => (
              <div
                key={announcement._id}
                className="group backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl shadow-2xl p-8 card-hover animate-fade-in transition-all duration-500 hover:bg-white/90"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1 mr-4">
                    {announcement.title}
                  </h2>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-bold rounded-full shadow-sm">
                      🏷️ {announcement.tag}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-700 text-base leading-relaxed mb-6 line-clamp-3">
                  {announcement.description}
                </p>
                
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/80 to-blue-50/80 rounded-xl border border-gray-200/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-600">
                      📅 Posted: {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-600">
                      ⏰ Deadline: {new Date(announcement.endDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachingAnnouncements;
