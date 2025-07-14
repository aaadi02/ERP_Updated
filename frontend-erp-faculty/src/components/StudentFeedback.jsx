import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

const StudentFeedback = ({ userData }) => {
  const [allow, setAllow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get auth token helper
  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.token || localStorage.getItem("authToken");
  };

  // Fetch current allow setting from backend
  useEffect(() => {
    const fetchAllowSetting = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(
          "http://localhost:5000/api/feedback/settings",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setAllow(data.allow || false);
        }
      } catch (err) {
        console.error("Error fetching allow setting:", err);
      }
    };

    fetchAllowSetting();
  }, []);

  // Handle toggle change and save to backend
  const handleToggleChange = async (newValue) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        "http://localhost:5000/api/feedback/settings",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ allow: newValue }),
        }
      );

      if (response.ok) {
        setAllow(newValue);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update setting");
      }
    } catch (err) {
      console.error("Error updating allow setting:", err);
      setError(err.message || "Failed to update setting");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <MessageCircle className="w-6 h-6 text-blue-500 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">
            Student Feedback
          </h3>
        </div>
        
        {/* Allow Toggle Button */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Allow Feedback:</span>
          <button
            onClick={() => handleToggleChange(!allow)}
            disabled={loading}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              allow ? 'bg-blue-600' : 'bg-gray-300'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block w-4 h-4 rounded-full bg-white shadow-lg transform transition-transform ${
                allow ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${allow ? 'text-green-600' : 'text-gray-500'}`}>
            {allow ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          View and analyze feedback submitted by students about courses, teaching methods, and overall learning experience.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">24</p>
            <p className="text-sm text-gray-600">New Feedback</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600">4.2</p>
            <p className="text-sm text-gray-600">Average Rating</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">78%</p>
            <p className="text-sm text-gray-600">Positive Feedback</p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold mb-4">Recent Feedback</h4>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <div>
                  <span className="font-medium">Mathematics 101</span>
                  <span className="ml-2 text-sm text-gray-500">Prof. Johnson</span>
                </div>
                <div className="flex items-center">
                  <span className="text-amber-500 mr-1">★★★★</span>
                  <span className="text-gray-600 text-sm">4.0</span>
                </div>
              </div>
              <p className="text-gray-700 mb-2">"The course materials were well organized and the teaching methodology was effective. I would recommend this class to others."</p>
              <div className="text-sm text-gray-500">Submitted by Student ID: ST12345 • July 8, 2025</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <div>
                  <span className="font-medium">Data Structures</span>
                  <span className="ml-2 text-sm text-gray-500">Dr. Smith</span>
                </div>
                <div className="flex items-center">
                  <span className="text-amber-500 mr-1">★★★★★</span>
                  <span className="text-gray-600 text-sm">5.0</span>
                </div>
              </div>
              <p className="text-gray-700 mb-2">"Excellent course! The practical examples and coding exercises really helped me understand complex concepts."</p>
              <div className="text-sm text-gray-500">Submitted by Student ID: ST67890 • July 5, 2025</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <div>
                  <span className="font-medium">Physics Lab</span>
                  <span className="ml-2 text-sm text-gray-500">Prof. Williams</span>
                </div>
                <div className="flex items-center">
                  <span className="text-amber-500 mr-1">★★★</span>
                  <span className="text-gray-600 text-sm">3.0</span>
                </div>
              </div>
              <p className="text-gray-700 mb-2">"The lab equipment needs updating, and more time should be allocated for experiments. Otherwise, the instructor was knowledgeable and helpful."</p>
              <div className="text-sm text-gray-500">Submitted by Student ID: ST24680 • July 3, 2025</div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <button className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium transition-colors">
              View All Feedback
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentFeedback;
