import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [faculty, setFaculty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem("token");
      const storedFaculty = localStorage.getItem("faculty");
      const storedUser = localStorage.getItem("user");

      if (token && storedFaculty) {
        const facultyData = JSON.parse(storedFaculty);
        setFaculty(facultyData);
        setIsAuthenticated(true);

        // If user data exists (for bus management), set it
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (employeeId, password) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/faculty/rolelogin",
        {
          employeeId,
          password,
        }
      );

      const facultyData = res.data.faculty;
      const token = res.data.token;

      // Check if user is a permanent employee
      if (facultyData.employmentStatus !== "Permanent Employee") {
        throw new Error("Access denied: Only Permanent Employees can log in.");
      }

      // Role-based access control - Only Account Management users allowed
      const allowedRoles = [
        "Account Section Management"
      ];

      if (!allowedRoles.includes(facultyData.designation?.trim())) {
        throw new Error("Access denied: Only Account Management users can access this system.");
      }

      // Store auth data
      localStorage.setItem("token", token);
      localStorage.setItem("faculty", JSON.stringify(facultyData));
      
      // For Bus Management, also store user data
      if (facultyData.designation?.trim() === "Bus Management") {
        const userData = {
          id: facultyData._id,
          name: facultyData.name,
          email: facultyData.email,
          role: "admin",
          employeeId: facultyData.employeeId
        };
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      }

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setFaculty(facultyData);
      setIsAuthenticated(true);

      return { success: true, faculty: facultyData };
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "An error occurred during login.";
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("faculty");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setFaculty(null);
    setIsAuthenticated(false);
  };

  // Get user role for routing
  const getUserRole = () => {
    if (!faculty) return null;
    return faculty.designation?.trim();
  };

  // Check if user has specific permission
  const hasPermission = (requiredRole) => {
    const userRole = getUserRole();
    if (!userRole) return false;
    
    // Define role permissions
    const rolePermissions = {
      "Student Management": ["students", "dashboard"],
      "Account Section Management": ["accounting", "payments", "receipts", "dashboard"],
      "Document Section Management": ["documents", "dashboard"],
      "Scholarship Management": ["students", "scholarship", "dashboard"],
      "Notification System Management": ["notifications", "dashboard"],
      "Library Management": ["library", "dashboard"],
      "Bus Management": ["admin", "bus", "dashboard"],
      "Hostel Management": ["hostel", "dashboard"],
    };

    const permissions = rolePermissions[userRole] || [];
    return permissions.includes(requiredRole) || requiredRole === "dashboard";
  };

  // Get redirect path based on role
  const getRedirectPath = () => {
    const roleRedirectMap = {
      "Student Management": "/dashboard",
      "Account Section Management": "/accounting/expenses",
      "Document Section Management": "/dashboard",
      "Scholarship Management": "/students/scholarship",
      "Notification System Management": "/dashboard",
      "Library Management": "/dashboard",
      "Bus Management": "/dashboard",
      "Hostel Management": "/dashboard",
    };

    const userRole = getUserRole();
    return roleRedirectMap[userRole] || "/dashboard";
  };

  const value = {
    user,
    faculty,
    loading,
    isAuthenticated,
    login,
    logout,
    getUserRole,
    hasPermission,
    getRedirectPath,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
