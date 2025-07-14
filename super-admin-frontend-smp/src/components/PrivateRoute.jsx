import { Navigate, useLocation } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const location = useLocation();

  // If no token exists, redirect to appropriate login page
  if (!token) {
    // If current path is a super admin route, redirect to super admin login
    if (location.pathname.startsWith("/super-admin")) {
      return <Navigate to="/super-admin-ved/login" />;
    }
    // Otherwise redirect to faculty login
    return <Navigate to="/" />;
  }

  // If token exists, render the children (dashboard or other routes)
  return children;
};

export default PrivateRoute;
