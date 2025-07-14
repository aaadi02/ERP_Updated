import React, { useEffect, useState } from "react";
import axios from "axios";

const TeachingAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/announcements/non_teaching_staff`
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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 font-sans">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
          }
          .card-hover {
            transition: all 0.3s ease;
          }
          .card-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
          }
        `}
      </style>

      <div className=" mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <svg
              className="w-6 h-6 text-blue-700"
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
            Teaching Staff Announcements
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Official notices from administrative authorities
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-t-3 border-blue-700"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 text-center animate-fade-in">
            <p className="text-gray-600 text-base">
              No announcements available for teaching staff.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement, index) => (
              <div
                key={announcement._id}
                className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 card-hover animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {announcement.title}
                  </h2>
                  <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                    {announcement.tag}
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">
                  {announcement.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200 pt-2">
                  <span>
                    Posted:{" "}
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </span>
                  <span>
                    Deadline:{" "}
                    {new Date(announcement.endDate).toLocaleDateString()}
                  </span>
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
