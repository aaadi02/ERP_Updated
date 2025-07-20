import React, { useState, useEffect } from 'react';
import { FaUser, FaIdCard, FaBriefcase, FaPhone, FaHeart, FaFileImage, FaDownload, FaBus, FaRoute, FaMapMarkerAlt, FaHistory } from 'react-icons/fa';
import { getConductorProfile, getConductorLocationHistory, getConductorDailyReports } from '../../services/conductorService';
import './ConductorProfile.css';

const ConductorProfile = () => {
  const [conductor, setConductor] = useState(null);
  const [bus, setBus] = useState(null);
  const [route, setRoute] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [dailyReports, setDailyReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchConductorProfile();
  }, []);

  const fetchConductorProfile = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching conductor profile...');
      
      const response = await getConductorProfile();
      console.log('✅ Profile response:', response);
      
      if (response.success) {
        setConductor(response.data);
        setBus(response.bus);
        setRoute(response.route);
        
        // If conductor has an ID, fetch additional data
        if (response.data._id) {
          await fetchAdditionalData(response.data._id);
        }
      } else {
        setError('Failed to fetch conductor profile');
      }
    } catch (error) {
      console.error('❌ Error fetching conductor profile:', error);
      setError('Failed to fetch profile information');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdditionalData = async (conductorId) => {
    try {
      // Fetch location history and daily reports
      const [historyResponse, reportsResponse] = await Promise.all([
        getConductorLocationHistory(conductorId, null, 10),
        getConductorDailyReports(conductorId)
      ]);
      
      if (historyResponse.success) {
        setLocationHistory(historyResponse.data);
      }
      
      if (reportsResponse.success) {
        setDailyReports(reportsResponse.data);
      }
    } catch (error) {
      console.error('❌ Error fetching additional data:', error);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const downloadDocument = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <span className="text-gray-600 font-medium ml-2">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <h3 className="font-semibold mb-2">Error Loading Profile</h3>
          <p className="text-sm">{error}</p>
          <button 
            onClick={fetchConductorProfile}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {conductor?.documents?.photo ? (
                <img 
                  src={conductor.documents.photo} 
                  alt={`${conductor.personalInfo?.firstName || 'Conductor'}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <span className="text-gray-500 text-2xl font-semibold">
                  {conductor?.personalInfo?.firstName?.charAt(0) || 'C'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {`${conductor?.personalInfo?.firstName || ''} ${conductor?.personalInfo?.middleName || ''} ${conductor?.personalInfo?.lastName || ''}`.trim() || 'Conductor Profile'}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <FaIdCard className="text-blue-500" />
                  Employee ID: {conductor?.employment?.employeeId || conductor?.employeeId || 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <FaPhone className="text-green-500" />
                  Contact: {conductor?.personalInfo?.contactNumber || 'N/A'}
                </span>
                {bus && (
                  <span className="flex items-center gap-1">
                    <FaBus className="text-purple-500" />
                    Bus: {bus.number || 'N/A'}
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  (conductor?.employment?.status || conductor?.status) === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {conductor?.employment?.status || conductor?.status || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaUser className="inline mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('bus')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bus'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaBus className="inline mr-2" />
                Bus & Route
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaHistory className="inline mr-2" />
                Location History
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaMapMarkerAlt className="inline mr-2" />
                Daily Reports
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaUser className="text-blue-500" />
                Personal Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">First Name</label>
                    <p className="text-gray-900">{conductor?.personalInfo?.firstName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Name</label>
                    <p className="text-gray-900">{conductor?.personalInfo?.lastName || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-gray-900">{formatDate(conductor?.personalInfo?.dateOfBirth)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Gender</label>
                    <p className="text-gray-900">{conductor?.personalInfo?.gender || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Number</label>
                    <p className="text-gray-900">{conductor?.personalInfo?.contactNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{conductor?.personalInfo?.email || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">
                    {conductor?.personalInfo?.address ? 
                      `${conductor.personalInfo.address.street || ''} ${conductor.personalInfo.address.city || ''} ${conductor.personalInfo.address.state || ''} ${conductor.personalInfo.address.zipCode || ''}`.trim() || 'N/A'
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaBriefcase className="text-green-500" />
                Employment Details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee ID</label>
                    <p className="text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                      {conductor?.employment?.employeeId || conductor?.employeeId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Joining</label>
                    <p className="text-gray-900">{formatDate(conductor?.employment?.dateOfJoining || conductor?.dateOfJoining)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      (conductor?.employment?.status || conductor?.status) === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {conductor?.employment?.status || conductor?.status || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaPhone className="text-red-500" />
                Emergency Contact
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">{conductor?.emergencyContact?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Relation</label>
                    <p className="text-gray-900">{conductor?.emergencyContact?.relation || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Number</label>
                  <p className="text-gray-900">{conductor?.emergencyContact?.contactNumber || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Government ID Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaIdCard className="text-purple-500" />
                Government ID Details
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Aadhar Number</label>
                    <p className="text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                      {conductor?.govtId?.aadharNumber || conductor?.govtId?.number || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Issuing Authority</label>
                    <p className="text-gray-900">{conductor?.govtId?.issuingAuthority || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaHeart className="text-red-500" />
                Health Information
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Blood Group</label>
                    <p className="text-gray-900 font-semibold text-red-600">
                      {conductor?.health?.bloodGroup || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Medical Conditions</label>
                    <p className="text-gray-900">{conductor?.health?.medicalConditions || 'None reported'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaFileImage className="text-indigo-500" />
                Documents
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Aadhar Card</label>
                    {conductor?.documents?.aadharCard ? (
                      <div className="flex items-center gap-2">
                        <a 
                          href={conductor.documents.aadharCard} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <FaFileImage />
                          View Document
                        </a>
                        <button
                          onClick={() => downloadDocument(conductor.documents.aadharCard, 'aadhar_card.pdf')}
                          className="text-green-600 hover:text-green-800 flex items-center gap-1"
                          title="Download Document"
                        >
                          <FaDownload />
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Not uploaded</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Photo</label>
                    {conductor?.documents?.photo ? (
                      <div className="flex items-center gap-2">
                        <a 
                          href={conductor.documents.photo} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <FaFileImage />
                          View Photo
                        </a>
                        <button
                          onClick={() => downloadDocument(conductor.documents.photo, 'conductor_photo.jpg')}
                          className="text-green-600 hover:text-green-800 flex items-center gap-1"
                          title="Download Photo"
                        >
                          <FaDownload />
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">Not uploaded</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bus' && (
          <div className="space-y-6">
            {/* Bus Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaBus className="text-purple-500" />
                Assigned Bus
              </h2>
              {bus ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bus Number</label>
                    <p className="text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                      {bus.number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Registration Number</label>
                    <p className="text-gray-900">{bus.registrationNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Seating Capacity</label>
                    <p className="text-gray-900">{bus.seatingCapacity} passengers</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Location</label>
                    <p className="text-gray-900">{bus.currentLocation || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Next Stop</label>
                    <p className="text-gray-900">{bus.nextStop || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      bus.status === 'on-time' ? 'bg-green-100 text-green-800' : 
                      bus.status === 'delayed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bus.status}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No bus assigned</p>
              )}
            </div>

            {/* Route Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaRoute className="text-blue-500" />
                Assigned Route
              </h2>
              {route ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Route Name</label>
                      <p className="text-gray-900 font-semibold">{route.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Distance</label>
                      <p className="text-gray-900">{route.distance ? `${route.distance} km` : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Point</label>
                      <p className="text-gray-900">{route.startPoint}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Point</label>
                      <p className="text-gray-900">{route.endPoint}</p>
                    </div>
                  </div>
                  {route.stops && route.stops.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Stops</label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {route.stops.map((stop, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            {stop.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No route assigned</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaHistory className="text-green-500" />
              Recent Location History
            </h2>
            {locationHistory.length > 0 ? (
              <div className="space-y-3">
                {locationHistory.map((record, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{record.location}</p>
                        <p className="text-sm text-gray-600">Next: {record.nextStop || 'N/A'}</p>
                        <p className="text-sm text-gray-600">
                          Direction: {record.direction || 'N/A'} | Students: {record.count || 0}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          record.status === 'on-time' ? 'bg-green-100 text-green-800' : 
                          record.status === 'delayed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(record.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No location history available</p>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-orange-500" />
              Today's Summary
            </h2>
            {dailyReports ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{dailyReports.totalTrips}</div>
                  <div className="text-sm text-blue-600">Total Trips</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{dailyReports.totalStudents}</div>
                  <div className="text-sm text-green-600">Students Transported</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{dailyReports.locations?.length || 0}</div>
                  <div className="text-sm text-purple-600">Location Updates</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No daily reports available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConductorProfile;
