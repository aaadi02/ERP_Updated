import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../../services/authService';
import { updateRoute } from '../../services/routeService';
import API from '../../services/api';

const EditRoutes = () => {
  const [route, setRoute] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getCurrentUser();

  useEffect(() => {
    const fetchAssignedRoute = async () => {
      try {
        setLoading(true);
        setError('');
        if (!user?._id) {
          setError('User not found');
          setLoading(false);
          return;
        }

        // Get all buses and find the one assigned to current driver
        const response = await API.get('/buses');
        const buses = response.data.data.buses;
        
        // Find bus assigned to current driver
        const assignedBus = buses.find(bus => 
          bus.driver && bus.driver._id === user._id
        );

        if (assignedBus && assignedBus.route) {
          setRoute(assignedBus.route);
        } else {
          setRoute(null);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch assigned route');
        setLoading(false);
      }
    };
    fetchAssignedRoute();
  }, [user?._id]);

  // Start editing
  const handleEdit = () => {
    setEditing(true);
    // Ensure all stops have sequence numbers
    const stopsWithSequence = (route.stops || []).map((stop, index) => ({
      ...stop,
      sequence: stop.sequence || index + 1,
      students: stop.students || 0
    }));
    setFormData({ ...route, stops: stopsWithSequence });
  };

  // Update form data
  const handleInputChange = (e, field, stopIndex = null) => {
    if (stopIndex !== null) {
      const updatedStops = [...formData.stops];
      updatedStops[stopIndex] = {
        ...updatedStops[stopIndex],
        [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value,
      };
      setFormData({ ...formData, stops: updatedStops });
    } else {
      setFormData({
        ...formData,
        [field]: e.target.type === 'number' ? Number(e.target.value) : e.target.value,
      });
    }
  };

  // Add a new stop
  const handleAddStop = () => {
    const newSequence = formData.stops.length + 1;
    setFormData({
      ...formData,
      stops: [...formData.stops, { name: '', students: 0, sequence: newSequence }],
    });
  };

  // Remove a stop
  const handleRemoveStop = (stopIndex) => {
    const updatedStops = formData.stops
      .filter((_, i) => i !== stopIndex)
      .map((stop, index) => ({ ...stop, sequence: index + 1 }));
    setFormData({
      ...formData,
      stops: updatedStops,
    });
  };

  // Save changes and persist to backend
  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Saving route data:', formData);
      
      // Update the route in the backend
      const updatedRoute = await updateRoute(formData._id, formData);
      console.log('Route updated successfully:', updatedRoute);
      
      // Update local state with the response from backend
      setRoute(updatedRoute.data || formData);
      setEditing(false);
      setFormData(null);
      setLoading(false);
      
      // Refresh the route data from backend to ensure consistency
      const response = await API.get('/buses');
      const buses = response.data.data.buses;
      const assignedBus = buses.find(bus => 
        bus.driver && bus.driver._id === user._id
      );
      
      if (assignedBus && assignedBus.route) {
        setRoute(assignedBus.route);
        console.log('Route refreshed from backend:', assignedBus.route);
      }
      
    } catch (err) {
      console.error('Error saving route:', err);
      setError(err.message || 'Failed to update route');
      setLoading(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditing(false);
    setFormData(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900">
      <div className="text-white">{editing ? 'Saving...' : 'Loading assigned route...'}</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900">
      <div className="text-red-400">{error}</div>
    </div>
  );

  if (!route) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900">
      <div className="text-gray-300">No route assigned to your bus.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 text-center drop-shadow-md">
          Edit Assigned Route
        </h2>
        <div className="space-y-6">
          <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-4 transition-all duration-300 hover:shadow-2xl border border-white/20">
            {editing ? (
              <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div>
                    <label className="text-sm font-medium text-gray-200">Route Name</label>
                          <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => handleInputChange(e, 'name')}
                            className="mt-1 w-full px-3 py-2 bg-white/5 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter route name"
                          />
                        </div>
                        <div>
                    <label className="text-sm font-medium text-gray-200">Start Point</label>
                          <input
                            type="text"
                            value={formData.startPoint || ''}
                            onChange={(e) => handleInputChange(e, 'startPoint')}
                            className="mt-1 w-full px-3 py-2 bg-white/5 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter start point"
                          />
                        </div>
                        <div>
                    <label className="text-sm font-medium text-gray-200">End Point</label>
                          <input
                            type="text"
                            value={formData.endPoint || ''}
                            onChange={(e) => handleInputChange(e, 'endPoint')}
                            className="mt-1 w-full px-3 py-2 bg-white/5 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter end point"
                          />
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-2">Edit Stops</h4>
                      {formData.stops?.map((stop, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={stop.name || ''}
                            onChange={(e) => handleInputChange(e, 'name', index)}
                            className="flex-1 px-3 py-2 bg-white/5 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Stop name"
                          />
                          <input
                            type="number"
                            value={stop.students || 0}
                            onChange={(e) => handleInputChange(e, 'students', index)}
                            className="w-20 px-3 py-2 bg-white/5 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Students"
                            min="0"
                          />
                          <button
                            onClick={() => handleRemoveStop(index)}
                            className="px-2 py-1 bg-red-500/20 text-red-300 rounded-lg text-xs hover:bg-red-500/30"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={handleAddStop}
                        className="mt-2 px-3 py-1 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600"
                      >
                        Add Stop
                      </button>
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-2">
                          <p className="text-base font-semibold text-white">
                            <span className="text-indigo-300">Route:</span> {route.name || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-200">
                      <span className="text-indigo-300 font-medium">Start:</span> {route.startPoint || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-200">
                      <span className="text-indigo-300 font-medium">End:</span> {route.endPoint || 'N/A'}
                    </p>
                  </div>
                </div>
                      <h4 className="text-sm font-semibold text-white mt-4">Stops:</h4>
                {route.stops?.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                    {route.stops.map((stop, index) => (
                            <li
                        key={index}
                              className="flex items-center p-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-200"
                            >
                              <span className="w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center mr-2 text-xs">
                                {index + 1}
                              </span>
                              <span className="text-sm text-gray-200">
                                {stop.name} ({stop.students || 0} students)
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-400 text-sm mt-2">No stops available</p>
                      )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600"
                  >
                    Edit Route
                  </button>
                </div>
                    </>
                  )}
                </div>
        </div>
        <div className="mt-6 text-center">
          <a
            href="https://tarstech.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 font-semibold text-sm hover:text-indigo-100 transition-colors"
          >
            A TARS TECH PRODUCT
          </a>
        </div>
      </div>
    </div>
  );
};

export default EditRoutes;