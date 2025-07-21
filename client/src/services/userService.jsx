import API from './api';

export const createUser = async (userData) => {
  try {
    const response = await API.post('/auth/signup', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Registration failed. Please try again.';
  }
};

export const login = async (email, password) => {
  try {
    const response = await API.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Login failed. Please try again.';
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await API.get('/users/me');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch user data';
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await API.patch(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update user';
  }
};

export const getAllUsers = async () => {
  try {
    const response = await API.get('/users');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch users';
  }
};

export const getUserById = async (userId) => {
  try {
    const response = await API.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch user';
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await API.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete user';
  }
};

export const logout = async () => {
  try {
    const response = await API.post('/auth/logout');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to logout';
  }
};