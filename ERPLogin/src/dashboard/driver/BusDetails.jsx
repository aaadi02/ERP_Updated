import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../../services/authService';
import API from '../../services/api';

const BusDetails = () => {
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getCurrentUser();

  useEffect(() => {
    const fetchBus = async () => {
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
        console.log('Fetched buses:', buses);
        
        // Find bus assigned to current driver
        const assignedBus = buses.find(bus => 
          bus.driver && bus.driver._id === user._id
        );
        
        setBus(assignedBus || null);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch bus details');
        setLoading(false);
      }
    };
    fetchBus();
  }, [user?._id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900">
      <div className="text-white">Loading bus details...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900">
      <div className="text-red-400">{error}</div>
    </div>
  );

  if (!bus) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900">
      <div className="text-gray-300">No bus assigned.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 text-center drop-shadow-md">
          Bus Details
        </h2>

        {/* Bus Details Card */}
        <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-4 sm:p-6 mb-6 border border-white/20 transition-all duration-300 hover:shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <p className="text-base font-semibold text-white">
                <span className="text-indigo-300">Bus Number:</span> {bus.number || 'N/A'}
              </p>
              <p className="text-base font-semibold text-white">
                <span className="text-indigo-300">Driver:</span> {bus.driver ? `${bus.driver.personalInfo?.firstName || ''} ${bus.driver.personalInfo?.lastName || ''}`.trim() : 'N/A'}
              </p>
              <p className="text-base font-semibold text-white">
                <span className="text-indigo-300">Driver Contact:</span>
                <a
                  href={`tel:${bus.driver?.personalInfo?.contactNumber}`}
                  className="text-cyan-300 hover:underline ml-1"
                >
                  {bus.driver?.personalInfo?.contactNumber || 'N/A'}
                </a>
              </p>
              <p className="text-base font-semibold text-white">
                <span className="text-indigo-300">Capacity:</span> {bus.seatingCapacity || 0} seats, {bus.standingCapacity || 0} standing
              </p>
              <p className="text-base font-semibold text-white">
                <span className="text-indigo-300">Status:</span>
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    bus.status === 'on-time'
                      ? 'bg-green-500/20 text-green-300'
                      : bus.status === 'delayed'
                      ? 'bg-yellow-500/20 text-yellow-300'
                      : bus.status === 'maintenance'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-gray-500/20 text-gray-300'
                  }`}
                >
                  {bus.status ? bus.status.charAt(0).toUpperCase() + bus.status.slice(1) : 'Unknown'}
                </span>
              </p>
              <p className="text-base font-semibold text-white">
                <span className="text-indigo-300">Current Location:</span> {bus.currentLocation || 'N/A'}
              </p>
              <p className="text-base font-semibold text-white">
                <span className="text-indigo-300">Next Stop:</span> {bus.nextStop || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Route Information Card */}
        {bus.route && (
          <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-4 sm:p-6 mb-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Route Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <p className="text-base text-gray-200">
                <span className="font-semibold text-indigo-300">Route:</span>{' '}
                {bus.route?.name || 'N/A'}
              </p>
              <br />
              <p className="text-base text-gray-200">
                <span className="font-semibold text-indigo-300">Start Point:</span>{' '}
                {bus.route?.startPoint || 'N/A'}
              </p>
              <br />
              <p className="text-base text-gray-200">
                <span className="font-semibold text-indigo-300">End Point:</span>{' '}
                {bus.route?.endPoint || 'N/A'}
              </p>
            </div>
            {/* Route Timeline */}
            <h4 className="text-base font-semibold text-white mt-4 mb-2">Route Timeline</h4>
            <div className="relative flex items-center justify-between py-2">
              {[
                { name: bus.route?.startPoint || 'Start' },
                ...(bus.route?.stops || []),
                { name: bus.route?.endPoint || 'End' },
              ].map((point, index, arr) => {
                const isCurrent = point.name === bus.currentLocation;
                return (
                  <div
                    key={index}
                    className="flex flex-col items-center relative group z-10"
                    style={{ flex: 1 }}
                  >
                    {/* Node */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-300 group-hover:scale-125 ${
                        isCurrent ? 'bg-cyan-400' : 'bg-indigo-500 group-hover:bg-indigo-400'
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute w-4 h-4 rounded-full bg-cyan-400/50 animate-ping"></div>
                      )}
                    </div>
                    {/* Label */}
                    <span className="mt-2 text-xs text-white text-center truncate w-full">
                      {point.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Link */}
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

export default BusDetails;