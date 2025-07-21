import API from './api';

// Get all conductors
export const getAllConductors = async () => {
  try {
    const response = await API.get('/conductors');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch conductors';
  }
};

// Get conductor profile (current user)
export const getConductorProfile = async () => {
  try {
    const response = await API.get('/conductors/me');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch conductor profile';
  }
};

// Get conductor's assigned bus
export const getConductorBus = async () => {
  try {
    const response = await API.get('/conductors/me/bus');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch assigned bus';
  }
};

// Get conductor location history
export const getConductorLocationHistory = async (conductorId, options = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Handle different parameter formats
    if (typeof options === 'string') {
      // If second parameter is a string, treat it as date
      params.append('date', options);
    } else if (options && typeof options === 'object') {
      // If it's an object, extract parameters
      if (options.date) params.append('date', options.date);
      if (options.limit) params.append('limit', options.limit);
      if (options.direction) params.append('direction', options.direction);
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
    }
    
    // Default limit if not specified
    if (!params.has('limit')) {
      params.append('limit', '50');
    }
    
    const response = await API.get(`/conductors/${conductorId}/location-history?${params}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch location history';
  }
};

// Get conductor daily reports
export const getConductorDailyReports = async (conductorId, date) => {
  try {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    
    const response = await API.get(`/conductors/${conductorId}/daily-reports?${params}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch daily reports';
  }
};

// Update conductor location
export const updateConductorLocation = async (conductorId, locationData) => {
  try {
    const response = await API.put(`/conductors/${conductorId}/location`, locationData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update location';
  }
};

// Get available buses for assignment
export const getAvailableBuses = async () => {
  try {
    const response = await API.get('/conductors/available-buses');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch available buses';
  }
};

// Get available routes for assignment
export const getAvailableRoutes = async () => {
  try {
    const response = await API.get('/conductors/available-routes');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch available routes';
  }
};

// Get a single conductor by ID
export const getConductorById = async (id) => {
  try {
    const response = await API.get(`/conductors/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch conductor';
  }
};

// Assign bus to conductor
export const assignBusToConductor = async (conductorId, busId) => {
  try {
    const response = await API.post('/conductors/assign-bus', {
      conductorId,
      busId
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to assign bus to conductor';
  }
};

// Create a new conductor (with document uploads)
export const createConductor = async (formData) => {
  try {
    const response = await API.post('/conductors', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create conductor';
  }
};

// Update an existing conductor (with document uploads)
export const updateConductor = async (id, formData) => {
  try {
    const response = await API.patch(`/conductors/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update conductor';
  }
};

// Delete a conductor
export const deleteConductor = async (id) => {
  try {
    const response = await API.delete(`/conductors/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete conductor';
  }
};

// Get date range reports for conductor
export const getConductorDateRangeReports = async (conductorId, startDate, endDate) => {
  try {
    const response = await API.get(`/conductors/${conductorId}/reports?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch date range reports';
  }
};