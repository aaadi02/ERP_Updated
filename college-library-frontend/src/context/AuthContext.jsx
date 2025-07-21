// // src/context/AuthContext.js
// import React, { createContext, useState, useEffect } from 'react';

// export const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

//   const login = (token) => {
//     localStorage.setItem('token', token);
//     setIsAuthenticated(true);
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     setIsAuthenticated(false);
//   };

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     setIsAuthenticated(!!token);
//   }, []);

//   return (
//     <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };



import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to check if token contains library-related information
  const isLibraryToken = (token) => {
    try {
      const decoded = jwtDecode(token);
      console.log('Decoded token:', decoded);
      
      // Check if the token contains library-related information
      // Based on the AuthFaculty model, "Library Management" is a valid type
      const hasLibraryAccess = (
        decoded.type === 'Library Management' ||
        decoded.role === 'Library Management' ||
        decoded.designation === 'Library Management' ||
        // Also check for variations and related terms
        (decoded.type && decoded.type.toLowerCase().includes('library')) ||
        (decoded.role && decoded.role.toLowerCase().includes('library')) ||
        (decoded.designation && decoded.designation.toLowerCase().includes('library')) ||
        // Check for librarian role
        decoded.role === 'librarian' ||
        decoded.type === 'librarian' ||
        decoded.designation === 'librarian' ||
        // Additional safety check - you can customize this based on your needs
        false
      );
      
      console.log('Token has library access:', hasLibraryAccess);
      console.log('Token type:', decoded.type);
      console.log('Token role:', decoded.role);
      console.log('Token designation:', decoded.designation);
      
      return hasLibraryAccess;
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  };

  const login = (token, faculty) => {
    console.log('Login attempt with token:', token);
    console.log('Login attempt with faculty:', faculty);
    
    // First check if token has library access
    let hasAccess = false;
    
    if (token && isLibraryToken(token)) {
      hasAccess = true;
      console.log('Access granted via token');
    } else if (faculty) {
      // Fallback: check faculty data for library management role
      const facultyHasLibraryAccess = (
        faculty.type === 'Library Management' ||
        faculty.role === 'Library Management' ||
        faculty.designation === 'Library Management' ||
        (faculty.type && faculty.type.toLowerCase().includes('library')) ||
        (faculty.role && faculty.role.toLowerCase().includes('library')) ||
        (faculty.designation && faculty.designation.toLowerCase().includes('library'))
      );
      
      if (facultyHasLibraryAccess) {
        hasAccess = true;
        console.log('Access granted via faculty data');
      }
    }
    
    if (hasAccess) {
      localStorage.setItem('token', token);
      localStorage.setItem('faculty', JSON.stringify(faculty));
      setIsAuthenticated(true);
      console.log('Login successful - library access granted');
    } else {
      console.log('Login failed - no library access found');
      setIsAuthenticated(false);
      // Clear any existing auth data
      localStorage.removeItem('token');
      localStorage.removeItem('faculty');
      // Show error message to user
      alert('Access denied: You need Library Management permissions to access this system.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('faculty');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const facultyData = localStorage.getItem('faculty');
    console.log('Checking stored token:', token);
    console.log('Checking stored faculty:', facultyData);
    
    if (token) {
      // First try to verify token
      if (isLibraryToken(token)) {
        setIsAuthenticated(true);
        console.log('Authentication verified via token');
        return;
      }
      
      // Fallback: check faculty data if token verification fails
      if (facultyData) {
        try {
          const faculty = JSON.parse(facultyData);
          const facultyHasLibraryAccess = (
            faculty.type === 'Library Management' ||
            faculty.role === 'Library Management' ||
            faculty.designation === 'Library Management' ||
            (faculty.type && faculty.type.toLowerCase().includes('library')) ||
            (faculty.role && faculty.role.toLowerCase().includes('library')) ||
            (faculty.designation && faculty.designation.toLowerCase().includes('library'))
          );
          
          if (facultyHasLibraryAccess) {
            setIsAuthenticated(true);
            console.log('Authentication verified via faculty data');
            return;
          }
        } catch (parseError) {
          console.error('Error parsing faculty data:', parseError);
        }
      }
      
      // No library access found, clear storage
      localStorage.removeItem('token');
      localStorage.removeItem('faculty');
      setIsAuthenticated(false);
      console.log('No library access found - cleared storage');
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};