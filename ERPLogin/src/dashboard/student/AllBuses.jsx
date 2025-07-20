import React, { useEffect, useState } from 'react';
import { getAllBuses } from '../../services/busServices';
import { FaPlus, FaCheck } from 'react-icons/fa';

const AllBuses = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myBuses, setMyBuses] = useState([]);
  const [addedBuses, setAddedBuses] = useState(new Set());
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [successTimeout, setSuccessTimeout] = useState(null);

  useEffect(() => {
    // Load existing saved buses when component mounts
    const savedBuses = localStorage.getItem('myBuses');
    if (savedBuses) {
      try {
        const parsedBuses = JSON.parse(savedBuses);
        setMyBuses(parsedBuses);
        // Create a Set of bus IDs that are already added
        const addedIds = new Set(parsedBuses.map(bus => bus._id));
        setAddedBuses(addedIds);
      } catch (error) {
        console.error('Error parsing saved buses:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true);
        setError(''); // Clear any previous errors
        console.log('Fetching buses from API...');
        
        // Test if the API is reachable
        const token = localStorage.getItem('token');
        console.log('Using token for API call:', !!token);
        
        const response = await getAllBuses();
        console.log('AllBuses full response:', response);
        console.log('AllBuses response.data:', response.data);
        console.log('Response status:', response.status);
        
        // Handle different response structures based on backend controller
        if (response.data) {
          if (response.data.success && response.data.data && response.data.data.buses && Array.isArray(response.data.data.buses)) {
            console.log('Found buses in response.data.data.buses:', response.data.data.buses.length);
            setBuses(response.data.data.buses);
          } else if (response.data.data && response.data.data.buses && Array.isArray(response.data.data.buses)) {
            console.log('Found buses in response.data.data.buses:', response.data.data.buses.length);
            setBuses(response.data.data.buses);
          } else if (response.data.buses && Array.isArray(response.data.buses)) {
            console.log('Found buses in response.data.buses:', response.data.buses.length);
            setBuses(response.data.buses);
          } else if (Array.isArray(response.data)) {
            console.log('Found buses in response.data as array:', response.data.length);
            setBuses(response.data);
          } else {
            console.log('No buses found in response, setting empty array');
            console.log('Response structure:', Object.keys(response.data));
            setBuses([]);
          }
        } else {
          console.log('No response.data found');
          setBuses([]);
        }
      } catch (err) {
        console.error('Error fetching buses:', err);
        console.error('Error response:', err.response);
        console.error('Error message:', err.message);
        
        // Provide more specific error messages
        if (err.response) {
          if (err.response.status === 401) {
            setError('Authentication failed. Please login again.');
          } else if (err.response.status === 404) {
            setError('Bus API endpoint not found. Make sure the backend server is running.');
          } else if (err.response.status >= 500) {
            setError('Server error. Please try again later.');
          } else {
            setError(`API Error: ${err.response.status} - ${err.response.data?.message || err.message}`);
          }
        } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
          setError('Cannot connect to server. Please check if the backend is running on http://localhost:5000');
        } else {
          setError(`Failed to fetch bus information: ${err.message}`);
        }
        setBuses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchBuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const addBusToMyList = (bus) => {
    // Check if bus is already added
    if (addedBuses.has(bus._id)) {
      return;
    }

    // Add current date to the bus object
    const busWithDate = {
      ...bus,
      addedDate: new Date().toISOString()
    };

    // Update state
    const updatedMyBuses = [...myBuses, busWithDate];
    setMyBuses(updatedMyBuses);
    setAddedBuses(new Set([...addedBuses, bus._id]));

    // Save to localStorage
    localStorage.setItem('myBuses', JSON.stringify(updatedMyBuses));

    // Show success message
    setShowSuccessMessage(`Bus ${bus.number} added to My Buses!`);
    
    // Clear any existing timeout
    if (successTimeout) {
      clearTimeout(successTimeout);
    }
    
    // Set new timeout to clear message
    const newTimeout = setTimeout(() => {
      setShowSuccessMessage('');
    }, 3000);
    setSuccessTimeout(newTimeout);

    console.log(`Bus ${bus.number} added to My Buses!`);
  };

  const isBusAdded = (busId) => {
    return addedBuses.has(busId);
  };

  if (loading) {
    return (
      <div className="text-white text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        Loading buses...
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-400 text-center py-8 bg-red-900/20 rounded-lg">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold mb-2">Error Loading Buses</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🚌</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Buses Available</h3>
        <p className="text-gray-300">No bus information is currently available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-600/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <FaCheck className="mr-2" />
            {showSuccessMessage}
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white mb-6">All Buses</h2>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>
      
    
      
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buses.map((bus) => (
          <div key={bus._id} className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-6 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-white">Bus {bus.number}</h3>
              <button
                onClick={() => addBusToMyList(bus)}
                disabled={isBusAdded(bus._id)}
                className={`flex items-center px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  isBusAdded(bus._id)
                    ? 'bg-green-600 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title={isBusAdded(bus._id) ? 'Already added to My Buses' : 'Add to My Buses'}
              >
                {isBusAdded(bus._id) ? (
                  <>
                    <FaCheck className="mr-1" size={12} />
                    Added
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-1" size={12} />
                    Add to My Bus
                  </>
                )}
              </button>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-200">
                <span className="font-semibold text-indigo-300">Route: </span> {bus.route?.name || 'Not Assigned'}
              </p>
              <p className="text-gray-200">
                <span className="font-semibold text-indigo-300">Driver: </span> {bus.driver ? `${bus.driver.personalInfo?.firstName || ''} ${bus.driver.personalInfo?.lastName || ''}`.trim() : 'Not Assigned'}
              </p>
              <p className="text-gray-200">
                <span className="font-semibold text-indigo-300">Conductor: </span>
                {bus.conductor
                  ? `${bus.conductor.personalInfo?.firstName || ''} ${bus.conductor.personalInfo?.lastName || ''}`.trim()
                  : 'Not Assigned'}
              </p>
              
              {/* Contact Information */}
              {(bus.driver?.personalInfo?.contactNumber || bus.conductor?.personalInfo?.contactNumber) && (
                <div className="pt-2 border-t border-gray-600">
                  <h5 className="text-sm font-semibold text-white mb-2">Contact Info:</h5>
                  {bus.driver?.personalInfo?.contactNumber && (
                    <p className="text-xs text-gray-300">
                      Driver: {bus.driver.personalInfo.contactNumber}
                    </p>
                  )}
                  {bus.conductor?.personalInfo?.contactNumber && (
                    <p className="text-xs text-gray-300">
                      Conductor: {bus.conductor.personalInfo.contactNumber}
                    </p>
                  )}
                </div>
              )}
              
              {bus.route?.stops && (
                <div className="mt-4">
                  <h4 className="text-lg font-semibold text-white mb-2">Stops:</h4>
                  <ul className="space-y-2 max-h-32 overflow-y-auto">
                    {bus.route.stops.map((stop, index) => (
                      <li key={index} className="text-gray-200 flex items-center">
                        <span className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center mr-2 text-xs">
                          {index + 1}
                        </span>
                        {typeof stop === 'object' ? stop.name : stop}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllBuses; 