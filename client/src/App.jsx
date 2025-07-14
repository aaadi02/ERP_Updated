import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import HODDashboard from './pages/HODDashboard';//add new section
import StudentLogin from './components/StudentLogin';//add new section

// Student Login component
// Now using dedicated StudentLogin component from components/StudentLogin.jsx

// Mock NotFound component
const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 text-center">
    <div className="animate-bounce-in">
      <h1 className="text-9xl font-bold text-gray-300">404</h1>
      <h2 className="text-3xl font-bold text-gray-800 mt-4">Page Not Found</h2>
      <p className="text-gray-600 mt-2 mb-6">The page you're looking for doesn't exist or has been moved.</p>
      <a 
        href="/" 
        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300"
      >
        Go to Dashboard
      </a>
    </div>
  </div>
);

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const studentData = localStorage.getItem('studentData');
  
  // Check if user is authenticated with valid token and student data
  if (!token || !studentData) {
    return <Navigate to="/login" />;
  }
  
  try {
    // Basic token validation (check if it's not expired)
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (tokenPayload.exp < currentTime) {
      // Token is expired, clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('studentData');
      return <Navigate to="/login" />;
    }
    
    return children;
  } catch (error) {
    // Invalid token format, clear storage and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('studentData');
    return <Navigate to="/login" />;
  }
};

const App = () => {
  // Add smooth scrolling to the whole app
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Protected dashboard route */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Login route */}
        <Route path="/login" element={<StudentLogin />} />

        {/* HOD Dashboard route */}
        <Route path="/hod" element={<HODDashboard />} />
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
