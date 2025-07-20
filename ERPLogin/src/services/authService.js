// Authentication service for handling user auth
export const getToken = () => {
  return localStorage.getItem('token');
};

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const getStudentData = () => {
  try {
    const studentData = localStorage.getItem('studentData');
    return studentData ? JSON.parse(studentData) : null;
  } catch (error) {
    console.error('Error parsing student data:', error);
    return null;
  }
};

export const isAuthenticated = () => {
  const token = getToken();
  const user = getCurrentUser();
  const studentData = getStudentData();
  
  // Check if we have a valid token and either user or student data
  return !!(token && (user || studentData));
};

export const isStudent = () => {
  const studentData = getStudentData();
  const user = getCurrentUser();
  
  // Check if we have student data or user with student role
  return !!(studentData || (user && user.role === 'student'));
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('studentData');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
};

export const setAuthData = (token, userData, userRole = null) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  
  if (userRole === 'student') {
    localStorage.setItem('studentData', JSON.stringify(userData));
  }
};
