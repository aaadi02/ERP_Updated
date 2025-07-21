import React from "react";
import { Navigate, Link, useLocation } from "react-router-dom";
import { rolePermissionsAndRoutes } from "./rolePermissionsAndRoutes";

const ProtectedRoute = ({ children, isAuthenticated, userRole, routeName }) => {
  const location = useLocation();
  const rolePermissions = rolePermissionsAndRoutes.reduce((acc, role) => {
    acc[role.role] = role.permissions;
    return acc;
  }, {});

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} />;
  }
  if (routeName && !rolePermissions[userRole]?.includes(routeName)) {
    const dashboardUrl =
      userRole === "principal"
        ? "/principal-dashboard"
        : userRole === "HOD" || userRole === "hod"
        ? "/hod-dashboard"
        : userRole === "cc"
        ? "/cc-dashboard"
        : "/dashboard";

    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-4">
            You do not have permission to access this page.
          </p>
          <Link
            to={dashboardUrl}
            className="mt-6 inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  return children;
};

export default ProtectedRoute;
