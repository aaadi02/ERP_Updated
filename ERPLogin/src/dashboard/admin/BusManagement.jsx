import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBus, FaUsers, FaRoute, FaUser, FaCog } from 'react-icons/fa';
import { getAllBuses, createBus, updateBus, deleteBus } from '../../services/busServices';
import { getRoutes } from '../../services/routeService';
import { getAllDrivers } from '../../services/driverService';

const BusManagement = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBus, setCurrentBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    number: '',
    registrationNumber: '',
    chassisNumber: '',
    engineNumber: '',
    manufacturingYear: '',
    vehicleType: '',
    seatingCapacity: '',
    standingCapacity: '',
    route: '',
    driver: '',
    status: 'on-time'
  });

  // Fetch buses, available routes, and available drivers
  const fetchData = async () => {
    try {
      setLoading(true);
      const [busesResponse, routesResponse, driversResponse] = await Promise.all([
        getAllBuses(),
        getRoutes(),
        getAllDrivers()
      ]);
      
      // Handle different response structures
      const busesData = busesResponse.data?.buses || busesResponse.data?.data?.buses || busesResponse.data || [];
      const routesData = routesResponse.data?.routes || routesResponse.data?.data || routesResponse.data || [];
      const driversData = driversResponse.data?.drivers || driversResponse.data?.data || driversResponse.data || [];
      console.log('Fetched buses:', busesData);
      console.log('Fetched routes:', routesData);
      console.log('Fetched drivers:', driversData);
      setBuses(busesData);

      // Filter out routes that are already assigned to buses
      const assignedRouteIds = busesData.map(bus => bus.route?._id);
      const availableRoutes = routesData.filter(
        route => !assignedRouteIds.includes(route._id)
      );

      // Filter out drivers that are already assigned to buses
      const assignedDriverIds = busesData.map(bus => bus.driver?._id);
      const availableDrivers = driversData.filter(
        driver => !assignedDriverIds.includes(driver._id) &&
          driver.employment?.status === 'Active'
      );

      setRoutes(availableRoutes);
      setDrivers(availableDrivers);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      setLoading(false);
      // Set empty arrays as fallback
      setBuses([]);
      setRoutes([]);
      setDrivers([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Edit handler: populate form and open modal
  const handleEdit = (bus) => {
    setCurrentBus(bus);
    setFormData({
      number: bus.number || '',
      registrationNumber: bus.registrationNumber || '',
      chassisNumber: bus.chassisNumber || '',
      engineNumber: bus.engineNumber || '',
      manufacturingYear: bus.manufacturingYear || '',
      vehicleType: bus.vehicleType || '',
      seatingCapacity: bus.seatingCapacity || '',
      standingCapacity: bus.standingCapacity || '',
      route: bus.route?._id || '',
      driver: bus.driver?._id || '',
      status: bus.status || 'maintenance'
    });
    setIsModalOpen(true);
  };

  // Form input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      if (currentBus) {
        // Update
        const response = await updateBus(currentBus._id, formData);
        console.log('Update response:', response);
        const updatedBus = response.data?.bus || response.data;
        setBuses(buses.map(bus =>
          bus._id === currentBus._id ? updatedBus : bus
        ));
      } else {
        // Create
        const response = await createBus(formData);
        console.log('Create response:', response);
        const newBus = response.data?.bus || response.data;
        setBuses([...buses, newBus]);
      }
      setIsModalOpen(false);
      setCurrentBus(null);
      setFormData({
        number: '',
        registrationNumber: '',
        chassisNumber: '',
        engineNumber: '',
        manufacturingYear: '',
        vehicleType: '',
        seatingCapacity: '',
        standingCapacity: '',
        route: '',
        driver: '',
        status: 'maintenance'
      });
      
      // Refresh data to ensure consistency
      fetchData();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  // Delete handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) return;

    try {
      await deleteBus(id);
      setBuses(buses.filter(bus => bus._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete bus');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                <FaBus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Bus Management
                </h2>
                <p className="text-gray-700 mt-1">Manage your fleet efficiently</p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              onClick={() => {
                setCurrentBus(null);
                setFormData({
                  number: '',
                  registrationNumber: '',
                  chassisNumber: '',
                  engineNumber: '',
                  manufacturingYear: '',
                  vehicleType: '',
                  seatingCapacity: '',
                  standingCapacity: '',
                  route: '',
                  driver: '',
                  status: 'on-time'
                });
                setIsModalOpen(true);
              }}
            >
              <FaPlus className="w-4 h-4" />
              Add New Bus
            </button>
          </div>
        </div>

        {/* Error Message */}
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
                <span className="text-gray-700 font-medium">Loading buses...</span>
              </div>
            </div>
          ) : (buses || []).length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-300 mb-6">
                <FaBus className="w-20 h-20 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No buses available</h3>
              <p className="text-gray-700 mb-6">Get started by adding your first bus to the fleet.</p>
              <button
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg"
                onClick={() => {
                  setCurrentBus(null);
                  setFormData({
                    number: '',
                    registrationNumber: '',
                    chassisNumber: '',
                    engineNumber: '',
                    manufacturingYear: '',
                    vehicleType: '',
                    seatingCapacity: '',
                    standingCapacity: '',
                    route: '',
                    driver: '',
                    status: 'on-time'
                  });
                  setIsModalOpen(true);
                }}
              >
                <FaPlus className="w-4 h-4" />
                Add First Bus
              </button>
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
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">Registration</th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">Type</th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-green-600" />
                        Capacity
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
                        <FaCog className="text-gray-600" />
                        Status
                      </div>
                    </th>
                    <th className="text-left py-5 px-6 text-sm font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {buses.map((bus, index) => (
                    <tr key={bus._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                          <span className="text-sm font-semibold text-gray-900">{bus.number}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-sm font-medium text-gray-800">{bus.registrationNumber}</td>
                      <td className="py-5 px-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {bus.vehicleType}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {bus.seatingCapacity}
                          </span>
                          <span className="text-gray-500">+</span>
                          <span className="text-sm font-medium text-gray-700">
                            {bus.standingCapacity}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-sm font-medium text-gray-800">
                          {bus.route?.name || 'Not Assigned'}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-sm font-medium text-gray-800">
                          {bus.driver ?
                            `${bus.driver.personalInfo?.firstName} ${bus.driver.personalInfo?.lastName}`
                            : 'Not Assigned'}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          bus.status === 'on-time' ? 'bg-green-100 text-green-800' :
                          bus.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {bus.status}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex space-x-2">
                          <button
                            className="p-3 text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 rounded-xl transition-all duration-200 group-hover:shadow-md transform hover:scale-105"
                            onClick={() => handleEdit(bus)}
                            title="Edit bus"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-3 text-red-600 hover:text-white hover:bg-red-600 bg-red-50 rounded-xl transition-all duration-200 group-hover:shadow-md transform hover:scale-105"
                            onClick={() => handleDelete(bus._id)}
                            title="Delete bus"
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

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                      <FaBus className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {currentBus ? 'Edit Bus' : 'Add New Bus'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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
                      <p className="text-red-800 font-medium">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <FaBus className="text-blue-600" />
                          Bus Number *
                        </div>
                      </label>
                      <input
                        type="text"
                        name="number"
                        value={formData.number}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                        placeholder="e.g., BUS-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Registration Number *</label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                        placeholder="e.g., ABC-1234"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Chassis Number *</label>
                      <input
                        type="text"
                        name="chassisNumber"
                        value={formData.chassisNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                        placeholder="Enter chassis number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Engine Number *</label>
                      <input
                        type="text"
                        name="engineNumber"
                        value={formData.engineNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                        placeholder="Enter engine number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Manufacturing Year *</label>
                      <input
                        type="number"
                        name="manufacturingYear"
                        value={formData.manufacturingYear}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                        min="2000"
                        max={new Date().getFullYear()}
                        placeholder="e.g., 2023"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Vehicle Type *</label>
                      <select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="mini">Mini Bus</option>
                        <option value="standard">Standard Bus</option>
                        <option value="luxury">Luxury Bus</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <FaUsers className="text-green-600" />
                          Seating Capacity *
                        </div>
                      </label>
                      <input
                        type="number"
                        name="seatingCapacity"
                        value={formData.seatingCapacity}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        required
                        min="1"
                        placeholder="e.g., 50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Standing Capacity</label>
                      <input
                        type="number"
                        name="standingCapacity"
                        value={formData.standingCapacity}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200"
                        min="0"
                        placeholder="e.g., 20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        <div className="flex items-center gap-2">
                          <FaCog className="text-gray-600" />
                          Status
                        </div>
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200"
                      >
                        <option value="on-time">On Time</option>
                        <option value="delayed">Delayed</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-medium border border-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                    >
                      {loading ? 'Saving...' : (currentBus ? 'Update Bus' : 'Create Bus')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusManagement;