// import API from './api';

// export const getAllRoutes = async () => {
//   const response = await API.get('/routes');
//   return response.data;
// };

// export const getRoute = async (id) => {
//   const response = await API.get(`/routes/${id}`);
//   return response.data;
// };

// export const createRoute = async (routeData) => {
//   const response = await API.post('/routes', routeData);
//   return response.data;
// };

// export const updateRoute = async (id, routeData) => {
//   const response = await API.patch(`/routes/${id}`, routeData);
//   return response.data;
// };

// export const deleteRoute = async (id) => {
//   const response = await API.delete(`/routes/${id}`);
//   return response.data;
// };

import API from './api';

export const getRoutes = async () => {
  try {
    const response = await API.get('/routes');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch routes';
  }
};

export const createRoute = async (routeData) => {
  try {
    const response = await API.post('/routes', routeData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create route';
  }
};

export const updateRoute = async (id, routeData) => {
  try {
    const response = await API.patch(`/routes/${id}`, routeData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update route';
  }
};

export const deleteRoute = async (id) => {
  try {
    const response = await API.delete(`/routes/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete route';
  }
};

export const createSpecialTrip = async (tripData) => {
  const response = await API.post('/trips', tripData);
  return response.data;
};