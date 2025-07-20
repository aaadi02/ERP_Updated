import API from './api';

export const getAllDrivers = async () => {
  try {
    const response = await API.get('/drivers');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch drivers';
  }
};

export const getDriverBus = async (driverId) => {
  try {
    if (!driverId) {
      throw new Error('Driver ID is required');
    }

    const response = await API.get(`/drivers/${driverId}/bus`);
    return response.data;
  } catch (error) {
    console.error('Error in getDriverBus:', error);
    // Return empty data if no bus is assigned
    if (error.response?.status === 404) {
      return {
        status: 'success',
        data: {
          bus: null
        }
      };
    }
    throw new Error(error.response?.data?.message || 'Failed to fetch driver bus');
  }
};

export const createDriver = async (formData) => {
  try {
    const response = await API.post('/drivers', formData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create driver';
  }
};

export const updateDriver = async (id, formData) => {
  try {
    const response = await API.put(`/drivers/${id}`, formData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update driver';
  }
};

export const deleteDriver = async (id) => {
  try {
    const response = await API.delete(`/drivers/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete driver';
  }
};