import API from './api';

// Get all drivers (for admin)
export const getAllDrivers = async () => {
  try {
    const response = await API.get('/drivers');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get driver profile (for individual driver)
export const getDriverProfile = async (driverId) => {
  try {
    // If no driverId provided, get current user's profile using the profile endpoint
    const endpoint = driverId ? `/drivers/${driverId}` : '/drivers/profile';
    const response = await API.get(endpoint);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new driver
export const createDriver = async (formData) => {
  try {
    const response = await API.post('/drivers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update driver
export const updateDriver = async (driverId, formData) => {
  try {
    const response = await API.patch(`/drivers/${driverId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete driver
export const deleteDriver = async (driverId) => {
  try {
    const response = await API.delete(`/drivers/${driverId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get driver by employee ID
export const getDriverByEmployeeId = async (employeeId) => {
  try {
    const response = await API.get(`/drivers/employee/${employeeId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update driver status
export const updateDriverStatus = async (driverId, status) => {
  try {
    const response = await API.patch(`/drivers/${driverId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get driver's assigned bus
export const getDriverBus = async (driverId) => {
  try {
    const response = await API.get(`/drivers/${driverId}/bus`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
