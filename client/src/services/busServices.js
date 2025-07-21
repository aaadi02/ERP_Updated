import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Set up axios interceptors for authentication
const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('studentData');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const getAllBuses = () => {
  console.log('busServices: Making request to /buses');
  const token = localStorage.getItem('token');
  console.log('busServices: Using token:', !!token);
  return api.get('/buses');
};

export const getBusById = (id) => {
  return api.get(`/buses/${id}`);
};

export const getBusRoute = (busId) => {
  return api.get(`/routes/${busId}`); // Updated to use routes endpoint
};

export const getBusSchedule = (busId) => {
  return api.get(`/schedules/bus/${busId}`); // Updated to use schedules endpoint
};

export const getAllRoutes = () => {
  return api.get('/routes');
};

export const getAllSchedules = () => {
  return api.get('/schedules');
};

export const updateBusLocation = (busId, locationData) => {
  return api.put(`/buses/${busId}/location`, locationData);
};

export const createBus = (busData) => {
  return api.post('/buses', busData);
};

export const updateBus = (busId, busData) => {
  return api.put(`/buses/${busId}`, busData);
};

export const deleteBus = (busId) => {
  return api.delete(`/buses/${busId}`);
};

export default api;
