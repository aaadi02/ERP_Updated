import API from './api';

export const getToken = () => {
  return localStorage.getItem('token');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  return JSON.parse(userStr);
};

export const login = async (email, password, role) => {
  try {
    const response = await API.post('/auth/login', { email, password, role });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Login failed. Please try again.';
  }
};

// export const getCurrentUser = () => {
//   const user = localStorage.getItem('user');
//   return user ? JSON.parse(user) : null;
// };

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};