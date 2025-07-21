

import API from './api';

export const getAllBuses = async () => {
  try {
    const response = await API.get('/buses');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch buses';
  }
};

export const getBusById = async (busId) => {
  try {
    const response = await API.get(`/buses/${busId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch bus details';
  }
};

export const getBusByConductor = async (conductorId) => {
  try {
    const response = await API.get(`/buses/conductor/${conductorId}`);
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response format');
    }
    return response.data;
  } catch (error) {
    console.error('Error in getBusByConductor:', error);
    throw error.response?.data?.message || 'Failed to fetch bus details';
  }
};

export const createBus = async (busData) => {
  try {
    const response = await API.post('/buses', busData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create bus';
  }
};

export const updateBus = async (id, busData) => {
  try {
    const response = await API.patch(`/buses/${id}`, busData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update bus';
  }
};

export const deleteBus = async (id) => {
  try {
    const response = await API.delete(`/buses/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete bus';
  }
};

export const updateBusLocation = async (busId, locationData) => {
  try {
    const response = await API.patch(`/buses/${busId}/location`, {
      currentLocation: locationData.currentLocation,
      status: locationData.status || 'on-time',
      attendanceData: locationData.attendanceData,
      routeDirection: locationData.routeDirection,
      alertMessage: locationData.alertMessage || null,
      alertType: locationData.alertType || 'normal'
    });

    if (!response.data) {
      throw new Error('No data received from server');
    }

    return response.data;
  } catch (error) {
    console.error('Error in updateBusLocation:', error);
    throw new Error(error.response?.data?.message || 'Failed to update bus location');
  }
};

export const getBusLocationHistory = async (id) => {
  try {
    const response = await API.get(`/buses/${id}/history`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch location history';
  }
};

export const assignDriver = async (busId, driverId) => {
  try {
    const response = await API.patch('/buses/assign-driver', { busId, driverId });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to assign driver';
  }
};

export const incrementPassengerCount = async (busId, type, count = 1) => {
  try {
    const response = await API.patch(`/buses/${busId}/increment-passenger`, { type, count });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to increment passenger count';
  }
};

export const decrementPassengerCount = async (busId, type, count = 1) => {
  try {
    const response = await API.patch(`/buses/${busId}/decrement-passenger`, { type, count });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to decrement passenger count';
  }
};