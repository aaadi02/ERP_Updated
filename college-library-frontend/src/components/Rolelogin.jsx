import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const RoleLogin = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const roleRedirectMap = {
    "Student Management": "/dashboard/summary",
    "Account Section Management": "/faculty/account-section",
    "Document Section Management": "/faculty/document-section",
    "Notification System Management": "/faculty/notification-system",
    "Library Management": "/analytics",
    "Bus Management": "/faculty/bus",
    "Hostel Management": "/faculty/hostel",
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/faculty/rolelogin",
        {
          employeeId,
          password,
        }
      );

      const faculty = res.data.faculty;
      const redirectPath = roleRedirectMap[faculty.designation.trim()];

      if (!redirectPath) {
        setError(
          "Access denied: You are not assigned a valid management role."
        );
        setLoading(false);
        return;
      }

      login(localStorage.setItem("token", res.data.token));
      localStorage.setItem("faculty", JSON.stringify(faculty));
      navigate(redirectPath);
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative">
      {/* Full-screen background image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-purple-900/80 to-blue-900/80"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center"></div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-indigo-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Floating Books Animation */}
      <div className="absolute top-10 left-10 w-12 h-16 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-md shadow-lg transform rotate-12 animate-float z-20">
        <div className="absolute inset-0 border-t-4 border-b-4 border-yellow-500 border-opacity-50"></div>
      </div>
      <div className="absolute top-20 right-20 w-14 h-18 bg-gradient-to-r from-red-400 to-red-300 rounded-md shadow-lg transform -rotate-6 animate-float animation-delay-2000 z-20">
        <div className="absolute inset-0 border-t-4 border-b-4 border-red-500 border-opacity-50"></div>
      </div>
      <div className="absolute bottom-10 left-1/4 w-10 h-14 bg-gradient-to-r from-green-400 to-green-300 rounded-md shadow-lg transform rotate-3 animate-float animation-delay-3000 z-20">
        <div className="absolute inset-0 border-t-4 border-b-4 border-green-500 border-opacity-50"></div>
      </div>
      <div className="absolute bottom-20 right-1/4 w-16 h-20 bg-gradient-to-r from-blue-400 to-blue-300 rounded-md shadow-lg transform -rotate-12 animate-float animation-delay-4000 z-20">
        <div className="absolute inset-0 border-t-4 border-b-4 border-blue-500 border-opacity-50"></div>
      </div>
      
      {/* Main Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 space-y-6 transform transition-all duration-500 hover:shadow-2xl relative z-30 border border-white/20">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center transform transition-transform duration-300 hover:scale-110 hover:shadow-lg shadow-indigo-500/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-4xl font-bold text-white tracking-tight bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
            Library Management
          </h2>
          <p className="mt-2 text-sm text-indigo-100 font-medium">
            Secure access to your management dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-5">
            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-indigo-300 group-hover:text-white transition-colors duration-200"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  autoComplete="username"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 pl-10 border border-white/20 rounded-xl bg-white/10 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300 sm:text-sm backdrop-blur-sm"
                  placeholder="Employee ID"
                />
              </div>
            </div>

            <div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-indigo-300 group-hover:text-white transition-colors duration-200"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 pl-10 border border-white/20 rounded-xl bg-white/10 text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-300 sm:text-sm backdrop-blur-sm"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          {error && (
            <div
              className="bg-red-900/40 border-l-4 border-red-400 rounded-lg p-4 flex items-start text-red-100 text-sm animate-pulse backdrop-blur-sm"
              role="alert"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg shadow-indigo-500/30 hover:scale-[1.02]"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Authenticating...
                </>
              ) : (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Sign In
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/book-list"
            className="text-sm font-semibold text-indigo-200 hover:text-white hover:underline transition-all duration-200 inline-flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            View Book List Without Login
          </Link>
        </div>

        <div className="mt-4 text-center text-xs text-indigo-200">
          <p>Exclusive access for library management</p>
        </div>
      </div>
      
      <style jsx="true">{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default RoleLogin;