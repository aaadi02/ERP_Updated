import React, { useState, useEffect } from 'react';
import { FaUser, FaIdCard, FaBriefcase, FaPhone, FaHeart, FaFileImage, FaDownload } from 'react-icons/fa';
import { getDriverProfile } from '../../services/driverService';
import './DriverProfile.css';

const DriverProfile = () => {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDriverProfile();
  }, []);

  const fetchDriverProfile = async () => {
    try {
      setLoading(true);
      // Don't pass any ID to use the /me endpoint
      const response = await getDriverProfile();
      setDriver(response.data.driver);
    } catch (error) {
      console.error('Error fetching driver profile:', error);
      setError('Failed to fetch profile information');
    } finally {
      setLoading(false);
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
          <span className="text-gray-800 font-medium ml-2">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
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
              {driver?.documents?.photo ? (
                <img 
                  src={driver.documents.photo} 
                  alt={`${driver.personalInfo?.firstName || 'Driver'}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <span className="text-gray-700 text-2xl font-semibold">
                  {driver?.personalInfo?.firstName?.charAt(0) || 'D'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {`${driver?.personalInfo?.firstName || ''} ${driver?.personalInfo?.middleName || ''} ${driver?.personalInfo?.lastName || ''}`.trim() || 'Driver Profile'}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-800">
                <span className="flex items-center gap-1">
                  <FaIdCard className="text-blue-500" />
                  Employee ID: {driver?.employment?.employeeId || 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <FaBriefcase className="text-green-500" />
                  License: {driver?.license?.number || 'N/A'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  driver?.employment?.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {driver?.employment?.status || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

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
                  <p className="text-gray-900">{driver?.personalInfo?.firstName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-gray-900">{driver?.personalInfo?.lastName || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-gray-900">{formatDate(driver?.personalInfo?.dateOfBirth)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-gray-900">{driver?.personalInfo?.gender || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Number</label>
                  <p className="text-gray-900 flex items-center gap-1">
                    <FaPhone className="text-green-500 text-sm" />
                    {driver?.personalInfo?.contactNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{driver?.personalInfo?.email || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">
                  {[
                    driver?.personalInfo?.address?.street,
                    driver?.personalInfo?.address?.city,
                    driver?.personalInfo?.address?.state,
                    driver?.personalInfo?.address?.zipCode
                  ].filter(Boolean).join(', ') || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* License Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaIdCard className="text-green-500" />
              License Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">License Number</label>
                <p className="text-gray-900 font-mono text-lg">{driver?.license?.number || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                  <p className="text-gray-900">{formatDate(driver?.license?.expiryDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Issuing Authority</label>
                  <p className="text-gray-900">{driver?.license?.issuingAuthority || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Aadhar Number</label>
                <p className="text-gray-900 font-mono">{driver?.license?.aadharNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaBriefcase className="text-purple-500" />
              Employment Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Employee ID</label>
                <p className="text-gray-900 font-mono text-lg font-semibold text-blue-600">
                  {driver?.employment?.employeeId || 'N/A'}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Joining</label>
                  <p className="text-gray-900">{formatDate(driver?.employment?.dateOfJoining)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Employment Status</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    driver?.employment?.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {driver?.employment?.status || 'N/A'}
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
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Name</label>
                <p className="text-gray-900">{driver?.emergencyContact?.name || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Number</label>
                  <p className="text-gray-900 flex items-center gap-1">
                    <FaPhone className="text-red-500 text-sm" />
                    {driver?.emergencyContact?.contactNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Relation</label>
                  <p className="text-gray-900">{driver?.emergencyContact?.relation || 'N/A'}</p>
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
              <div>
                <label className="text-sm font-medium text-gray-500">Blood Group</label>
                <p className="text-gray-900">
                  {driver?.health?.bloodGroup ? (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      {driver.health.bloodGroup}
                    </span>
                  ) : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Medical Conditions</label>
                <p className="text-gray-900">{driver?.health?.medicalConditions || 'None reported'}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FaFileImage className="text-orange-500" />
              Documents
            </h2>
            <div className="space-y-4">
              {driver?.documents?.licenseImage && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">License Image</p>
                    <p className="text-sm text-blue-600">Driving License Document</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(driver.documents.licenseImage, '_blank')}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => downloadDocument(driver.documents.licenseImage, 'license-image')}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1"
                    >
                      <FaDownload className="text-xs" />
                      Download
                    </button>
                  </div>
                </div>
              )}
              
              {driver?.documents?.idProof && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium text-green-900">ID Proof</p>
                    <p className="text-sm text-green-600">Identity Verification Document</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(driver.documents.idProof, '_blank')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => downloadDocument(driver.documents.idProof, 'id-proof')}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1"
                    >
                      <FaDownload className="text-xs" />
                      Download
                    </button>
                  </div>
                </div>
              )}
              
              {driver?.documents?.photo && (
                <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div>
                    <p className="font-medium text-purple-900">Profile Photo</p>
                    <p className="text-sm text-purple-600">Driver Profile Picture</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(driver.documents.photo, '_blank')}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => downloadDocument(driver.documents.photo, 'profile-photo')}
                      className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors flex items-center gap-1"
                    >
                      <FaDownload className="text-xs" />
                      Download
                    </button>
                  </div>
                </div>
              )}
              
              {!driver?.documents?.licenseImage && !driver?.documents?.idProof && !driver?.documents?.photo && (
                <div className="text-center py-8 text-gray-500">
                  <FaFileImage className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No documents uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;
