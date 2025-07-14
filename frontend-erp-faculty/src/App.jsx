import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Menu, X } from "lucide-react";
import StaffSidebar from "./components/layout/StaffSidebar";
import FacultySidebar from "./components/layout/FacultySidebar";
import Login from "./Login";
import { rolePermissionsAndRoutes } from "./components/layout/rolePermissionsAndRoutes";
import FilesPage from "./pages/FilesPage";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("authToken");

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const validRoles = rolePermissionsAndRoutes.map((r) => r.role);
        const userRole = validRoles.includes(parsedUser.role)
          ? parsedUser.role
          : "teaching";

        setUserData({ ...parsedUser, role: userRole, token: savedToken });
        setIsAuthenticated(true);

        if (location.pathname === "/login" || location.pathname === "/") {
          if (userRole === "principal") {
            navigate("/principal-dashboard");
          } else if (userRole === "HOD") {
            navigate("/hod-dashboard");
          } else if (userRole === "cc") {
            navigate("/cc-dashboard");
          } else {
            navigate("/dashboard");
          }
        } else if (userRole === "cc" && location.pathname === "/dashboard") {
          // Redirect CC users from generic /dashboard to /cc-dashboard to avoid conflicts
          navigate("/cc-dashboard");
        }
      } catch (error) {
        localStorage.clear();
        setIsAuthenticated(false);
        setUserData(null);
        navigate("/login");
      }
    } else {
      if (!["/login"].includes(location.pathname)) {
        navigate("/login");
      }
    }
  }, [location.pathname, navigate]);

  const handleMenuClick = (item) => {
    if (item?.action === "logout") {
      localStorage.clear();
      setIsAuthenticated(false);
      setUserData(null);
      navigate("/login");
    }
    setIsSidebarOpen(false);
  };

  const handleLogin = (user) => {
    const validRoles = rolePermissionsAndRoutes.map((r) => r.role);
    const role = validRoles.includes(user.role) ? user.role : "teaching";
    const validatedUser = { ...user, role };
    localStorage.setItem("user", JSON.stringify(validatedUser));
    localStorage.setItem("authToken", user.token);
    setUserData(validatedUser);
    setIsAuthenticated(true);

    if (role === "principal") {
      navigate("/principal-dashboard");
    } else if (role === "HOD") {
      navigate("/hod-dashboard");
    } else if (role === "cc") {
      navigate("/cc-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex h-screen w-full">
      {isAuthenticated && userData && (
        <>
          {/* Mobile Overlay */}
          {isSidebarOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          {userData.role === "facultymanagement" ? (
            <FacultySidebar
              isOpen={isSidebarOpen}
              handleMenuClick={handleMenuClick}
              userData={userData}
            />
          ) : (
            <StaffSidebar
              isOpen={isSidebarOpen}
              handleMenuClick={handleMenuClick}
              userData={userData}
            />
          )}
          <button
            className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-700 transition-colors duration-200"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </>
      )}
      <div className="flex-grow p-0 overflow-auto w-full">
        <Routes>
          <Route
            path="/"
            element={
              <Navigate
                to={
                  isAuthenticated
                    ? userData?.role === "principal"
                      ? "/principal-dashboard"
                      : userData?.role === "HOD"
                      ? "/hod-dashboard"
                      : "/dashboard"
                    : "/login"
                }
              />
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate
                  to={
                    userData?.role === "principal"
                      ? "/principal-dashboard"
                      : userData?.role === "HOD"
                      ? "/hod-dashboard"
                      : userData?.role === "cc"
                      ? "/cc-dashboard"
                      : "/dashboard"
                  }
                />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          {rolePermissionsAndRoutes.map((role) =>
            role.routes.map((route, index) => (
              <Route
                key={`${role.role}-${index}`}
                path={route.path}
                element={route.element(
                  isAuthenticated,
                  userData?.role,
                  userData
                )}
              />
            ))
          )}
          <Route path="/dashboard/files" element={<FilesPage />} />
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center h-full">
                <h1 className="text-2xl font-bold text-gray-800">
                  Page Not Found
                </h1>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

export default App;
