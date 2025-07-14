import React, { useState } from "react";

const Login = ({ onLogin = () => {} }) => {
  const [emailOrId, setEmailOrId] = useState(""); // can be email or employeeId
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeField, setActiveField] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Try both keys for compatibility
      const body = emailOrId.includes("@")
        ? { email: emailOrId, password }
        : { employeeId: emailOrId, password };

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Login failed: " + response.statusText
        );
      }

      setTimeout(() => {
        localStorage.setItem("authToken", data.token); // Store JWT token for future requests
        localStorage.setItem("user", JSON.stringify(data.user)); // Store user data
        onLogin({
          token: data.token,
          ...data.user,
        });
      }, 800);
    } catch (err) {
      setError(
        err.message === "Invalid credentials"
          ? "Invalid Employee ID/Email or password. Please try again."
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-200/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-gray-200/50 relative z-10 transition-all duration-500 hover:shadow-purple-300/30 hover:shadow-3xl">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-2xl mb-6 relative group transition-all duration-300 hover:scale-110">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-white relative z-10"
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
          <h2 className="text-center text-4xl font-bold bg-gradient-to-r from-gray-800 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Faculty Portal
          </h2>
          <p className="text-center text-sm text-gray-600 font-medium">
            Welcome back! Please sign in to continue
          </p>
        </div>

        {error && (
          <div className="bg-red-50 backdrop-blur-sm border border-red-200 p-4 rounded-2xl text-red-800 animate-in slide-in-from-top duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-10 space-y-8" onSubmit={handleLogin}>
          <div className="space-y-6">
            <div
              className={`relative transition-all duration-300 ${
                activeField === "emailOrId" ? "transform -translate-y-1 scale-105" : ""
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <div className={`p-1 rounded-lg transition-all duration-200 ${
                  activeField === "emailOrId" ? "bg-indigo-100" : "bg-transparent"
                }`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-colors duration-200 ${
                      activeField === "emailOrId" ? "text-indigo-600" : "text-gray-500"
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-1 1v7a1 1 0 001 1h10a1 1 0 001-1v-7a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm-2 5V6a2 2 0 114 0v1H8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <input
                id="emailOrId"
                name="emailOrId"
                type="text"
                autoComplete="off"
                required
                value={emailOrId}
                onChange={(e) => setEmailOrId(e.target.value)}
                onFocus={() => setActiveField("emailOrId")}
                onBlur={() => setActiveField("")}
                className={`appearance-none block w-full pl-14 pr-4 py-4 border-2 bg-white/70 backdrop-filter backdrop-blur-sm text-gray-800 rounded-2xl placeholder-gray-400 focus:outline-none transition-all duration-300 ${
                  activeField === "emailOrId" 
                    ? "border-indigo-400 shadow-lg shadow-indigo-200/50 bg-white/90" 
                    : "border-gray-300 hover:border-gray-400"
                } ${isLoading ? "opacity-50" : ""}`}
                disabled={isLoading}
              />
              <label
                htmlFor="emailOrId"
                className={`absolute left-14 transition-all duration-300 pointer-events-none font-medium ${
                  activeField === "emailOrId" || emailOrId
                    ? "-top-3 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1 rounded-full text-white shadow-lg"
                    : "top-4 text-gray-500"
                }`}
              >
                Employee ID or Email
              </label>
            </div>

            <div
              className={`relative transition-all duration-300 ${
                activeField === "password" ? "transform -translate-y-1 scale-105" : ""
              }`}
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <div className={`p-1 rounded-lg transition-all duration-200 ${
                  activeField === "password" ? "bg-indigo-100" : "bg-transparent"
                }`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-colors duration-200 ${
                      activeField === "password" ? "text-indigo-600" : "text-gray-500"
                    }`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 116 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setActiveField("password")}
                onBlur={() => setActiveField("")}
                className={`appearance-none block w-full pl-14 pr-14 py-4 border-2 bg-white/70 backdrop-filter backdrop-blur-sm text-gray-800 rounded-2xl placeholder-gray-400 focus:outline-none transition-all duration-300 ${
                  activeField === "password" 
                    ? "border-indigo-400 shadow-lg shadow-indigo-200/50 bg-white/90" 
                    : "border-gray-300 hover:border-gray-400"
                } ${isLoading ? "opacity-50" : ""}`}
                disabled={isLoading}
              />
              <label
                htmlFor="password"
                className={`absolute left-14 transition-all duration-300 pointer-events-none font-medium ${
                  activeField === "password" || password
                    ? "-top-3 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1 rounded-full text-white shadow-lg"
                    : "top-4 text-gray-500"
                }`}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center group"
              >
                <div className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200">
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors duration-200"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500 group-hover:text-gray-700 transition-colors duration-200"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd"
                      />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-semibold rounded-2xl text-white transition-all duration-300 transform hover:scale-105 
              ${
                isLoading
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 opacity-80 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-300/40 hover:shadow-purple-400/50 hover:shadow-xl"
              } 
              focus:outline-none focus:ring-4 focus:ring-purple-300/50 focus:ring-offset-2 focus:ring-offset-white`}
              disabled={isLoading}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                <div className={`transition-all duration-300 ${isLoading ? "animate-spin" : "group-hover:scale-110"}`}>
                  {isLoading ? (
                    <svg
                      className="h-6 w-6 text-white"
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
                  ) : (
                    <svg
                      className="h-6 w-6 text-purple-100 group-hover:text-white transition-colors duration-200"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </span>
              <span className="ml-3 text-lg">
                {isLoading ? "Authenticating..." : "Sign In"}
              </span>
              {!isLoading && (
                <span className="absolute right-0 inset-y-0 flex items-center pr-4">
                  <svg
                    className="h-5 w-5 text-purple-100 group-hover:text-white group-hover:translate-x-1 transition-all duration-200"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </button>
          </div>
        </form>
        
        {/* Additional UI elements */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Secure access to your faculty dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
