import API from './api';

export const getAllSchedules = async () => {
  try {
    const response = await API.get('/schedules');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch schedules';
  }
};

export const getScheduleById = async (id) => {
  try {
    const response = await API.get(`/schedules/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch schedule';
  }
};

export const getSchedulesByBus = async (busId) => {
  try {
    const response = await API.get(`/schedules/bus/${busId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch bus schedules';
  }
};

export const getSchedulesByRoute = async (routeId) => {
  try {
    const response = await API.get(`/schedules/route/${routeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch route schedules';
  }
}; 