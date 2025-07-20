import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaRoute, FaMapMarkerAlt, FaFlag, FaFlagCheckered } from 'react-icons/fa';
import {
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute
} from '../../services/routeService';
import ErrorBoundary from './ErrorBoundary';

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    stops: [],
    startPoint: '',
    endPoint: ''
  });
  const [newStopInput, setNewStopInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Safe stop extraction function
  const getStopNames = (route) => {
    if (!route?.stops) return [];

    try {
      return Array.isArray(route.stops)
        ? route.stops.map(stop => {
          if (typeof stop === 'string') return stop;
          return stop?.name || '';
        }).filter(Boolean)
        : [];
    } catch (error) {
      console.error('Error parsing stops:', error);
      return [];
    }
  };

  // Fetch routes on component mount
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await getRoutes();
        // Handle different response structures
        const routesData = response?.data?.routes || response?.data?.data || response?.data || [];
        setRoutes(Array.isArray(routesData) ? routesData : []);
      } catch (err) {
        setError(err.message || 'Failed to load routes');
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddStop = () => {
    if (newStopInput.trim()) {
      setFormData({
        ...formData,
        stops: [...formData.stops, newStopInput.trim()]
      });
      setNewStopInput('');
    }
  };

  const handleRemoveStop = (indexToRemove) => {
    setFormData({
      ...formData,
      stops: formData.stops.filter((_, index) => index !== indexToRemove)
    });
  };

  const handleStopInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddStop();
    }
  };

  const validateForm = (data) => {
    const errors = [];
    if (!data.name) errors.push('Route name is required');
    if (!data.stops || data.stops.length === 0) errors.push('At least one stop is required');
    if (!data.startPoint) errors.push('Start point is required');
    if (!data.endPoint) errors.push('End point is required');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');

      // Validate inputs
      const validationErrors = validateForm(formData);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      // Create stops array with proper structure
      const stopsArray = formData.stops.map((stop, index) => ({
        name: stop,
        sequence: index + 1
      }));

      const routeData = {
        name: formData.name,
        startPoint: formData.startPoint,
        endPoint: formData.endPoint,
        stops: stopsArray
      };

      let result;
      if (currentRoute) {
        result = await updateRoute(currentRoute._id, routeData);
        // Handle different response structures for update
        const updatedRoute = result.data?.route || result.data?.data || result.data || { ...routeData, _id: currentRoute._id };
        setRoutes(routes.map(route =>
          route._id === currentRoute._id ? updatedRoute : route
        ));
      } else {
        result = await createRoute(routeData);
        // Handle different response structures for create
        const newRoute = result.data?.route || result.data?.data || result.data || { ...routeData, _id: Date.now().toString() };
        setRoutes(prev => [...prev, newRoute]);
      }

      setIsModalOpen(false);
      setCurrentRoute(null);
      resetForm();
    } catch (err) {
      console.error('Route submission error:', err);
      setError(err.response?.data?.message || 'Failed to save route');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      stops: [],
      startPoint: '',
      endPoint: ''
    });
    setNewStopInput('');
  };

  const handleEdit = (route) => {
    if (!route) return;

    setCurrentRoute(route);
    // Extract stop names for editing
    const stopNames = getStopNames(route);

    setFormData({
      name: route.name || '',
      stops: stopNames,
      startPoint: route.startPoint || '',
      endPoint: route.endPoint || ''
    });
    setNewStopInput('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;

    try {
      await deleteRoute(id);
      setRoutes(routes.filter(route => route._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete route');
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                  <FaRoute className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Route Management
                  </h2>
                  <p className="text-gray-600 mt-1">Manage bus routes and stops efficiently</p>
                </div>
              </div>
              <button
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                onClick={() => {
                  setCurrentRoute(null);
                  resetForm();
                  setIsModalOpen(true);
                }}
              >
                <FaPlus className="w-4 h-4" />
                Add New Route
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-5 h-5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-5 h-5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-gray-600 font-medium">Loading routes...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-8">
                <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-red-400 mr-3">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-red-800 font-medium">Error Loading Routes</h3>
                      <p className="text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (routes || []).length === 0 ? (
              <div className="text-center py-20">
                <div className="text-gray-300 mb-6">
                  <FaRoute className="w-20 h-20 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No routes available</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first bus route.</p>
                <button
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
                  onClick={() => {
                    setCurrentRoute(null);
                    resetForm();
                    setIsModalOpen(true);
                  }}
                >
                  <FaPlus className="w-4 h-4" />
                  Create First Route
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaRoute className="text-blue-600" />
                          Route Name
                        </div>
                      </th>
                      <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-green-600" />
                          Stops
                        </div>
                      </th>
                      <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaFlag className="text-green-500" />
                          Start Point
                        </div>
                      </th>
                      <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaFlagCheckered className="text-red-500" />
                          End Point
                        </div>
                      </th>
                      <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {routes.map((route, index) => (
                      <tr key={route?._id || Math.random()} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group">
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                            <span className="text-sm font-semibold text-gray-900">{route?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-sm text-gray-700 max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                              {getStopNames(route).length} stops
                            </span>
                            <div className="truncate" title={getStopNames(route).join(' → ')}>
                              {getStopNames(route).join(' → ') || 'No stops'}
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">{route?.startPoint || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-900">{route?.endPoint || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex space-x-2">
                            <button
                              className="p-3 text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 rounded-xl transition-all duration-200 group-hover:shadow-md transform hover:scale-105"
                              onClick={() => handleEdit(route)}
                              title="Edit route"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              className="p-3 text-red-600 hover:text-white hover:bg-red-600 bg-red-50 rounded-xl transition-all duration-200 group-hover:shadow-md transform hover:scale-105"
                              onClick={() => handleDelete(route?._id)}
                              disabled={!route?._id}
                              title="Delete route"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                      <FaRoute className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {currentRoute ? 'Edit Route' : 'Add New Route'}
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setError('');
                      resetForm();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FaTimes className="w-5 h-5" />
                  </button>
                </div>

                {error && (
                  <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="text-red-400 mr-3">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <FaRoute className="text-blue-600" />
                          Route Name *
                        </div>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                        placeholder="Enter route name (e.g., Downtown Express)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <FaFlag className="text-green-500" />
                          Start Point *
                        </div>
                      </label>
                      <input
                        type="text"
                        name="startPoint"
                        value={formData.startPoint}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                        placeholder="Enter start point"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <FaFlagCheckered className="text-red-500" />
                          End Point *
                        </div>
                      </label>
                      <input
                        type="text"
                        name="endPoint"
                        value={formData.endPoint}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                        placeholder="Enter end point"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="text-green-600" />
                        Stops * <span className="text-xs font-normal text-gray-500">(Add stops in sequence)</span>
                      </div>
                    </label>

                    {/* Live Preview of Added Stops */}
                    {formData.stops.length > 0 && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="text-sm text-blue-900 mb-3 font-semibold flex items-center gap-2">
                          <FaMapMarkerAlt className="text-blue-600" />
                          Route Preview ({formData.stops.length} stops):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.stops.map((stop, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 bg-white border border-blue-200 px-3 py-2 rounded-lg text-sm shadow-sm hover:shadow-md transition-shadow"
                            >
                              <span className="text-xs bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold">
                                {index + 1}
                              </span>
                              <span className="font-medium text-gray-800">{stop}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveStop(index)}
                                className="ml-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                                title="Remove stop"
                              >
                                <FaTimes size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add New Stop Input */}
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newStopInput}
                        onChange={(e) => setNewStopInput(e.target.value)}
                        onKeyPress={handleStopInputKeyPress}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        placeholder="Enter stop name (e.g., Main Street Junction)"
                      />
                      <button
                        type="button"
                        onClick={handleAddStop}
                        disabled={!newStopInput.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                      >
                        <FaPlus size={14} />
                        Add Stop
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 flex items-center gap-1">
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Enter stop name and click "Add Stop" or press Enter
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setError('');
                        resetForm();
                      }}
                      className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-medium border border-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formData.stops.length === 0}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                    >
                      {currentRoute ? 'Update Route' : 'Create Route'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default RouteManagement;