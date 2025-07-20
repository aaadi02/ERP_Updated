import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBus, FaRoute, FaUser, FaCog, FaHistory, FaMapMarkerAlt, FaSync } from 'react-icons/fa';
import { getAllBuses } from '../../services/busServices';
import { getAllDrivers } from '../../services/driverService';
import API from '../../services/api';

const BusAssignment = () => {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState({
    busId: '',
    driverId: '',
    conductorId: '',
    routeId: ''
  });
  const [history, setHistory] = useState([]);
  const [busId, setBusId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Add this useEffect for debugging
  useEffect(() => {
    // console.log('Conductors:', conductors);
  }, [conductors]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [busesRes, driversRes, conductorsRes, routesRes] = await Promise.all([
        getAllBuses(),
        getAllDrivers(),
        API.get('/conductors'),
        API.get('/routes')
      ]);

      // Handle different response structures
      const busesData = busesRes.data?.data?.buses || busesRes.data?.buses || busesRes.data?.data || busesRes.data || [];
      const driversData = driversRes.data?.drivers || driversRes.data?.data || driversRes.data || [];
      
      // Debug conductors response
      console.log('Conductors response:', conductorsRes);
      console.log('Conductors data structure:', conductorsRes.data);
      
      // Fix conductor data extraction - it's nested deeper
      const conductorsData = conductorsRes.data?.data?.conductors || conductorsRes.data?.conductors || conductorsRes.data?.data || conductorsRes.data || [];
      const routesData = routesRes.data?.routes || routesRes.data?.data || routesRes.data || [];
      
      // Ensure all data are arrays
      const safeBusesData = Array.isArray(busesData) ? busesData : [];
      const safeDriversData = Array.isArray(driversData) ? driversData : [];
      const safeConductorsData = Array.isArray(conductorsData) ? conductorsData : [];
      const safeRoutesData = Array.isArray(routesData) ? routesData : [];
      
      console.log('Processed conductors data:', safeConductorsData);

      setBuses(safeBusesData);
      setRoutes(safeRoutesData);

      // Filter active drivers
      setDrivers(safeDriversData.filter(d =>
        d.employment?.status === 'Active' &&
        (!d.employment?.assignedBus || d._id === selectedAssignment.driverId)
      ));

      // Filter available conductors
      const availableConductors = safeConductorsData.filter(c =>
        (!c.assignedBus || c._id === selectedAssignment.conductorId)
      );

      setConductors(availableConductors);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
      setLoading(false);
      // Set empty arrays as fallback
      setBuses([]);
      setRoutes([]);
      setDrivers([]);
      setConductors([]);
    }
  };

  const handleAssignment = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      if (!selectedAssignment.busId) {
        throw new Error('Please select a bus');
      }

      const assignmentData = {
        busId: selectedAssignment.busId,
        driverId: selectedAssignment.driverId || null,
        conductorId: selectedAssignment.conductorId || null,
        routeId: selectedAssignment.routeId || null
      };
      
      console.log('🚀 Sending assignment data:', assignmentData);

      const response = await API.post('/buses/assign', assignmentData);

      if (response.data.status === 'success') {
        setSuccess('Assignment updated successfully');
        await fetchData(); // Refetch data
        setSelectedAssignment({
          busId: '',
          driverId: '',
          conductorId: '',
          routeId: ''
        });
      }
    } catch (err) {
      console.error('Assignment error:', err);
      setError(err.response?.data?.message || 'Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bus) => {
    setSelectedAssignment({
      busId: bus._id,
      driverId: bus.driver?._id || '',
      conductorId: bus.conductor?._id || '',
      routeId: bus.route?._id || ''
    });

    document.querySelector('.assignment-form')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  const handleDeleteAssignment = async (busId) => {
    if (!window.confirm('Are you sure you want to remove all assignments from this bus?')) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      // Remove assignments by setting them to null
      await API.post('/buses/assign', {
        busId,
        driverId: null,
        conductorId: null,
        routeId: null
      });
      setSuccess('All assignments removed successfully');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    const fetchHistory = async () => {
      if (!busId) return;
      setLoading(true);
      try {
        const res = await API.get(`/buses/${busId}/location-history`);
        setHistory(res.data.data.history || []);
        setError('');
      } catch (err) {
        setHistory([]);
        setError('Failed to fetch daily reports');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
    interval = setInterval(fetchHistory, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [busId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl text-white">
              <FaCog className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Bus Assignment Management
              </h2>
              <p className="text-gray-700 mt-1">Assign drivers, conductors, and routes to buses</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="text-green-400 mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Assignment Form */}
        <div className="assignment-form bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg text-white">
              <FaPlus className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Assign Bus</h3>
          </div>

          <form onSubmit={handleAssignment} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Bus Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <div className="flex items-center gap-2">
                    <FaBus className="text-blue-600" />
                    Select Bus *
                  </div>
                </label>
                <select
                  value={selectedAssignment.busId}
                  onChange={(e) => setSelectedAssignment({
                    ...selectedAssignment,
                    busId: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200"
                  required
                >
                  <option value="">Select a bus</option>
                  {(buses || []).map(bus => (
                    <option key={bus._id} value={bus._id}>
                      Bus {bus.number}
                    </option>
                  ))}
                </select>
              </div>

              {/* Route Assignment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <div className="flex items-center gap-2">
                    <FaRoute className="text-purple-600" />
                    Assign Route
                  </div>
                </label>
                <select
                  value={selectedAssignment.routeId}
                  onChange={(e) => setSelectedAssignment({
                    ...selectedAssignment,
                    routeId: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200"
                >
                  <option value="">Select a route</option>
                  {(routes || []).map(route => (
                    <option key={route._id} value={route._id}>
                      {route.name} ({route.startPoint} → {route.endPoint})
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver Assignment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-orange-600" />
                    Assign Driver
                  </div>
                </label>
                <select
                  value={selectedAssignment.driverId}
                  onChange={(e) => setSelectedAssignment({
                    ...selectedAssignment,
                    driverId: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200"
                >
                  <option value="">Select a driver</option>
                  {(drivers || [])
                    .filter(driver => !driver.employment?.assignedBus)
                    .map(driver => (
                      <option key={driver._id} value={driver._id}>
                        {driver.personalInfo?.firstName} {driver.personalInfo?.lastName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Conductor Assignment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-indigo-600" />
                    Assign Conductor
                  </div>
                </label>
                <select
                  value={selectedAssignment.conductorId}
                  onChange={(e) => setSelectedAssignment({
                    ...selectedAssignment,
                    conductorId: e.target.value
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200"
                >
                  <option value="">Select a conductor</option>
                  {(conductors || []).map(conductor => (
                    <option
                      key={conductor._id}
                      value={conductor._id}
                      disabled={conductor.assignedBus && conductor.assignedBus !== selectedAssignment.busId}
                    >
                      {conductor.personalInfo.firstName} {conductor.personalInfo.lastName}
                      {conductor.assignedBus && conductor.assignedBus !== selectedAssignment.busId ? ' (Already Assigned)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {loading ? 'Updating...' : 'Update Assignment'}
              </button>
            </div>
          </form>
        </div>

        {/* Current Assignments */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg text-white">
                <FaBus className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Current Assignments</h3>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-green-600 rounded-full animate-bounce"></div>
                  <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-5 h-5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-gray-700 font-medium">Loading assignments...</span>
              </div>
            </div>
          ) : (buses || []).length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-300 mb-6">
                <FaBus className="w-20 h-20 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No buses available</h3>
              <p className="text-gray-700">Please add buses to start making assignments.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaBus className="text-blue-600" />
                        Bus Number
                      </div>
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaRoute className="text-purple-600" />
                        Route
                      </div>
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-orange-600" />
                        Driver
                      </div>
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-indigo-600" />
                        Conductor
                      </div>
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaCog className="text-gray-600" />
                        Status
                      </div>
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(buses || []).map(bus => (
                    <tr key={bus._id} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 transition-all duration-200 group">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-blue-600 rounded-full"></div>
                          <span className="text-sm font-semibold text-gray-900">Bus {bus.number}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-sm font-medium text-gray-800">
                          {bus.route ?
                            `${bus.route.name} (${bus.route.startPoint} → ${bus.route.endPoint})`
                            : 'Not Assigned'}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-sm font-medium text-gray-800">
                          {bus.driver ?
                            `${bus.driver.personalInfo?.firstName || ''} ${bus.driver.personalInfo?.lastName || ''}`.trim() || 'Name not available'
                            : 'Not Assigned'}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-sm font-medium text-gray-800">
                          {bus.conductor
                            ? `${bus.conductor.personalInfo?.firstName || ''} ${bus.conductor.personalInfo?.lastName || ''}`.trim() || 'Name not available'
                            : 'Not Assigned'}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          bus.status === 'on-time' ? 'bg-green-100 text-green-800' :
                          bus.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
                          bus.status === 'maintenance' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {bus.status || 'Inactive'}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(bus)}
                            disabled={loading}
                            className="p-3 text-green-600 hover:text-white hover:bg-green-600 bg-green-50 rounded-xl transition-all duration-200 group-hover:shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit assignment"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(bus._id)}
                            disabled={loading || (!bus.driver && !bus.conductor && !bus.route)}
                            className="p-3 text-red-600 hover:text-white hover:bg-red-600 bg-red-50 rounded-xl transition-all duration-200 group-hover:shadow-md transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove all assignments"
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

        {/* Location History */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg text-white">
                <FaHistory className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Bus Location History</h3>
            </div>
          </div>

          <div className="p-6">
            {/* History Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <div className="flex items-center gap-2">
                    <FaBus className="text-blue-600" />
                    Select Bus
                  </div>
                </label>
                <select
                  value={busId}
                  onChange={(e) => setBusId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 transition-all duration-200"
                >
                  <option value="">Select a bus to view history</option>
                  {(buses || []).map(bus => (
                    <option key={bus._id} value={bus._id}>
                      Bus {bus.number}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setLoading(true);
                    API.get(`/buses/${busId}/location-history`).then(res => {
                      setHistory(res.data.data.history || []);
                      setLoading(false);
                    });
                  }}
                  disabled={!busId}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none flex items-center gap-2"
                >
                  <FaSync className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {/* History Table */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-green-600 rounded-full animate-bounce"></div>
                    <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-5 h-5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-gray-700 font-medium">Loading history...</span>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            ) : !busId ? (
              <div className="text-center py-12">
                <div className="text-gray-300 mb-4">
                  <FaMapMarkerAlt className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-700">Select a bus to view its location history</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <th className="text-left py-4 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">Date</th>
                      <th className="text-left py-4 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">Time</th>
                      <th className="text-left py-4 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-red-500" />
                          Location
                        </div>
                      </th>
                      <th className="text-left py-4 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">Bus Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {history.length > 0 ? history.map((entry, index) => (
                      <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                        <td className="py-4 px-6 text-sm font-medium text-gray-900">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-800">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            {entry.location}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            entry.status === 'on-time' ? 'bg-green-100 text-green-800' :
                            entry.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="py-12 text-center">
                          <div className="text-gray-300 mb-4">
                            <FaHistory className="w-12 h-12 mx-auto" />
                          </div>
                          <p className="text-gray-700">No history available for this bus</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusAssignment;
