// frontend/src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  // If no token exists, redirect to login page
  if (!token) {
    return <Navigate to="/faculty/rolelogin" />;
  }

  // If token exists, render the children (dashboard or other routes)
  return children;
};

export default PrivateRoute;
