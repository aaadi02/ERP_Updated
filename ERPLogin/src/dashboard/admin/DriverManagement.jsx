import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { getAllDrivers, createDriver, updateDriver, deleteDriver } from '../../services/driverService';
import './DriverManagement.css';

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [viewDriver, setViewDriver] = useState(null);
  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      contactNumber: '',
      email: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    },
    license: {
      number: '',
      expiryDate: '',
      issuingAuthority: '',
      aadharNumber: ''
    },
    employment: {
      dateOfJoining: '',
      status: 'Active',
      employeeId: ''
    },
    emergencyContact: {
      name: '',
      contactNumber: '',
      relation: ''
    },
    health: {
      bloodGroup: '',
      medicalConditions: ''
    }
  });
  const [files, setFiles] = useState({
    licenseImage: null,
    idProof: null,
    photo: null
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Generate next employee ID
  const generateEmployeeId = async () => {
    try {
      const response = await getAllDrivers();
      
      // Handle the actual response structure we're getting:
      // { success: true, data: [], count: 0 }
      let driversData = [];
      
      if (Array.isArray(response.data)) {
        // If data is directly an array
        driversData = response.data;
      } else if (response.data?.drivers) {
        // If data contains a drivers property
        driversData = response.data.drivers;
      } else if (response.drivers) {
        // If drivers is at root level
        driversData = response.drivers;
      }
      
      const maxId = driversData.reduce((max, driver) => {
        const empId = driver.employment?.employeeId || '';
        const num = parseInt(empId.replace('DRV', '')) || 0;
        return Math.max(max, num);
      }, 0);
      return `DRV${String(maxId + 1).padStart(3, '0')}`;
    } catch (error) {
      return 'DRV001'; // Default if no drivers exist
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await getAllDrivers();
      console.log('Full API response:', response);
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      
      // Handle the actual response structure we're getting:
      // { success: true, data: [], count: 0 }
      let driversData = [];
      
      if (Array.isArray(response.data)) {
        // If data is directly an array
        driversData = response.data;
      } else if (response.data?.drivers) {
        // If data contains a drivers property
        driversData = response.data.drivers;
      } else if (response.drivers) {
        // If drivers is at root level
        driversData = response.drivers;
      }
      
      console.log('Extracted drivers data:', driversData);
      console.log('Drivers count:', driversData.length);
      
      setDrivers(driversData);
      setFilteredDrivers(driversData);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      alert('Failed to fetch drivers');
      // Set empty arrays as fallback
      setDrivers([]);
      setFilteredDrivers([]);
    }
  };

  // Search functionality
  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    if (!searchValue.trim()) {
      setFilteredDrivers(drivers || []);
      return;
    }

    const filtered = (drivers || []).filter(driver => {
      const searchLower = searchValue.toLowerCase();
      const fullName = `${driver.personalInfo?.firstName || ''} ${driver.personalInfo?.lastName || ''}`.toLowerCase();
      const employeeId = (driver.employment?.employeeId || '').toLowerCase();
      const contactNumber = (driver.personalInfo?.contactNumber || '').toLowerCase();
      const licenseNumber = (driver.license?.number || '').toLowerCase();
      const email = (driver.personalInfo?.email || '').toLowerCase();

      return fullName.includes(searchLower) ||
             employeeId.includes(searchLower) ||
             contactNumber.includes(searchLower) ||
             licenseNumber.includes(searchLower) ||
             email.includes(searchLower);
    });

    setFilteredDrivers(filtered);
  };

  // View driver details
  const handleViewDriver = (driver) => {
    setViewDriver(driver);
    setIsViewModalOpen(true);
  };

  // Format license number - MH12 1234567890
  const formatLicenseNumber = (value) => {
    // Remove all spaces and convert to uppercase
    const cleanValue = value.replace(/\s/g, '').toUpperCase();
    
    // Extract state code (first 2 letters), number part (next 2 digits), and remaining digits
    const stateCode = cleanValue.slice(0, 2).replace(/[^A-Z]/g, '');
    const numberPart = cleanValue.slice(2, 4).replace(/[^0-9]/g, '');
    const remainingDigits = cleanValue.slice(4).replace(/[^0-9]/g, '');
    
    let formatted = stateCode + numberPart;
    
    if (remainingDigits.length > 0) {
      formatted += ' ' + remainingDigits;
    }
    
    return formatted;
  };

  // Format Aadhar number - 1234 5678 9012
  const formatAadharNumber = (value) => {
    // Remove all spaces and non-digits
    const cleanValue = value.replace(/\D/g, '');
    
    // Limit to 12 digits
    const limitedValue = cleanValue.slice(0, 12);
    
    // Add spaces every 4 digits
    return limitedValue.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleEdit = (driver) => {
    setCurrentDriver(driver);
    setFormData({
      personalInfo: {
        firstName: driver.personalInfo?.firstName || '',
        middleName: driver.personalInfo?.middleName || '',
        lastName: driver.personalInfo?.lastName || '',
        dateOfBirth: driver.personalInfo?.dateOfBirth ? 
          new Date(driver.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
        gender: driver.personalInfo?.gender || '',
        contactNumber: driver.personalInfo?.contactNumber || '',
        email: driver.personalInfo?.email || '',
        address: {
          street: driver.personalInfo?.address?.street || '',
          city: driver.personalInfo?.address?.city || '',
          state: driver.personalInfo?.address?.state || '',
          zipCode: driver.personalInfo?.address?.zipCode || ''
        }
      },
      license: {
        number: driver.license?.number || '',
        expiryDate: driver.license?.expiryDate ? 
          new Date(driver.license.expiryDate).toISOString().split('T')[0] : '',
        issuingAuthority: driver.license?.issuingAuthority || '',
        aadharNumber: driver.license?.aadharNumber || ''
      },
      employment: {
        dateOfJoining: driver.employment?.dateOfJoining ? 
          new Date(driver.employment.dateOfJoining).toISOString().split('T')[0] : '',
        status: driver.employment?.status || 'Active',
        employeeId: driver.employment?.employeeId || ''
      },
      emergencyContact: {
        name: driver.emergencyContact?.name || '',
        contactNumber: driver.emergencyContact?.contactNumber || '',
        relation: driver.emergencyContact?.relation || ''
      },
      health: {
        bloodGroup: driver.health?.bloodGroup || '',
        medicalConditions: driver.health?.medicalConditions || ''
      }
    });
    
    // Set existing documents if they exist
    setFiles({
      licenseImage: null, // We'll show existing files separately
      idProof: null,
      photo: null
    });
    
    setIsModalOpen(true);
  };

  const handleDelete = async (driverId) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await deleteDriver(driverId);
        fetchDrivers();
        
        // Update filtered drivers if search is active
        if (searchTerm) {
          setTimeout(() => handleSearch(searchTerm), 100);
        }
      } catch (error) {
        console.error('Error deleting driver:', error);
        alert('Failed to delete driver');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required documents for new drivers
      if (!currentDriver) {
        const missingDocuments = [];
        if (!files.licenseImage) missingDocuments.push('License Image');
        if (!files.idProof) missingDocuments.push('ID Proof');
        if (!files.photo) missingDocuments.push('Photo');
        
        if (missingDocuments.length > 0) {
          alert(`Please upload all required documents: ${missingDocuments.join(', ')}`);
          return;
        }
      }

      // Validate Aadhar number (must be exactly 12 digits)
      const aadharDigits = formData.license.aadharNumber.replace(/\D/g, '');
      if (aadharDigits.length > 0 && aadharDigits.length !== 12) {
        alert('Aadhar number must be exactly 12 digits');
        return;
      }

      // Validate license number format
      const licensePattern = /^[A-Z]{2}\d{2}\s\d+$/;
      if (formData.license.number && !licensePattern.test(formData.license.number)) {
        alert('License number format should be: XX12 1234567890 (e.g., MH12 1234567890)');
        return;
      }

      // Generate employee ID for new drivers
      if (!currentDriver) {
        const employeeId = await generateEmployeeId();
        formData.employment.employeeId = employeeId;
      }

      const formDataToSend = new FormData();
      
      // Add files if they exist
      Object.keys(files).forEach(key => {
        if (files[key]) {
          formDataToSend.append(key, files[key]);
        }
      });
      
      // Add form data
      formDataToSend.append('data', JSON.stringify(formData));

      let response;
      if (currentDriver) {
        response = await updateDriver(currentDriver._id, formDataToSend);
      } else {
        response = await createDriver(formDataToSend);
      }
      
      fetchDrivers();
      setIsModalOpen(false);
      resetForm();
      
      // Show the backend message which includes password info for new drivers
      if (!currentDriver && response.data?.message) {
        alert(response.data.message);
      } else {
        alert(`Driver ${currentDriver ? 'updated' : 'created'} successfully!`);
      }
      
      // Update filtered drivers if search is active
      if (searchTerm) {
        setTimeout(() => handleSearch(searchTerm), 100);
      }
    } catch (error) {
      console.error('Error saving driver:', error);
      alert(`Failed to ${currentDriver ? 'update' : 'create'} driver: ${error.message || error}`);
    }
  };

  const handleInputChange = (e, section, subsection = null) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Special formatting for license number
    if (section === 'license' && name === 'number') {
      processedValue = formatLicenseNumber(value);
    }
    
    // Special formatting for aadhar number
    if (section === 'license' && name === 'aadharNumber') {
      processedValue = formatAadharNumber(value);
    }
    
    // Special formatting for issuing authority (capitalize)
    if (section === 'license' && name === 'issuingAuthority') {
      processedValue = value.toUpperCase();
    }
    
    setFormData(prev => ({
      ...prev,
      [section]: subsection 
        ? { ...prev[section], [subsection]: { ...prev[section][subsection], [name]: processedValue }}
        : { ...prev[section], [name]: processedValue }
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = {
        licenseImage: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
        idProof: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
        photo: ['image/jpeg', 'image/jpg', 'image/png']
      };
      
      if (!allowedTypes[type].includes(file.type)) {
        alert(`Invalid file type for ${type}. Please select a valid file.`);
        return;
      }
      
      setFiles(prev => ({
        ...prev,
        [type]: file
      }));
    }
  };

  const resetForm = () => {
    setCurrentDriver(null);
    setFormData({
      personalInfo: {
        firstName: '',
        middleName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        contactNumber: '',
        email: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        }
      },
      license: {
        number: '',
        expiryDate: '',
        issuingAuthority: '',
        aadharNumber: ''
      },
      employment: {
        dateOfJoining: '',
        status: 'Active',
        employeeId: ''
      },
      emergencyContact: {
        name: '',
        contactNumber: '',
        relation: ''
      },
      health: {
        bloodGroup: '',
        medicalConditions: ''
      }
    });
    setFiles({
      licenseImage: null,
      idProof: null,
      photo: null
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Driver Management</h2>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
            >
              <FaUserPlus /> Add Driver
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search drivers by name, ID, contact, license..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div className="text-sm text-gray-600">
              {(filteredDrivers || []).length} of {(drivers || []).length} drivers
            </div>
          </div>
        </div>

        {/* Driver List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(filteredDrivers || []).map(driver => (
            <div 
              key={driver._id} 
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => handleViewDriver(driver)}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {driver.documents?.photo ? (
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
                    <span className="text-gray-500 text-lg font-semibold">
                      {driver.personalInfo?.firstName?.charAt(0) || 'D'}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {`${driver.personalInfo?.firstName || ''} ${driver.personalInfo?.lastName || ''}`.trim() || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-800">ID: {driver.employment?.employeeId || 'N/A'}</p>
                  <p className="text-sm text-gray-800">Contact: {driver.personalInfo?.contactNumber || 'N/A'}</p>
                  <p className="text-sm text-gray-800">License: {driver.license?.number || 'N/A'}</p>
                  <p className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      driver.employment?.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {driver.employment?.status || 'N/A'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(driver);
                  }}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit driver"
                >
                  <FaEdit />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(driver._id);
                  }}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete driver"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredDrivers.length === 0 && drivers.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No drivers found</div>
            <div className="text-gray-500 text-sm">
              Try adjusting your search criteria
            </div>
          </div>
        )}

        {/* Empty State */}
        {drivers.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No drivers available</div>
            <div className="text-gray-500 text-sm">
              Click "Add Driver" to create your first driver
            </div>
          </div>
        )}

        {/* Driver Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  {currentDriver ? 'Edit Driver' : 'Add New Driver'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <section className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Personal Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.personalInfo.firstName}
                          onChange={(e) => handleInputChange(e, 'personalInfo')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                        <input
                          type="text"
                          name="middleName"
                          value={formData.personalInfo.middleName}
                          onChange={(e) => handleInputChange(e, 'personalInfo')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.personalInfo.lastName}
                          onChange={(e) => handleInputChange(e, 'personalInfo')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.personalInfo.dateOfBirth}
                          onChange={(e) => handleInputChange(e, 'personalInfo')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          required
                        />
                        {!currentDriver && (
                          <p className="text-xs text-blue-600 mt-1">
                            💡 The date of birth will be used as the driver's login password (YYYYMMDD format)
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                        <select
                          name="gender"
                          value={formData.personalInfo.gender}
                          onChange={(e) => handleInputChange(e, 'personalInfo')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
                        <input
                          type="tel"
                          name="contactNumber"
                          value={formData.personalInfo.contactNumber}
                          onChange={(e) => handleInputChange(e, 'personalInfo')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          required
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.personalInfo.email}
                          onChange={(e) => handleInputChange(e, 'personalInfo')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <h5 className="text-sm font-semibold text-gray-700 mt-6 mb-4">Address</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Street</label>
                        <input
                          type="text"
                          name="street"
                          value={formData.personalInfo.address.street}
                          onChange={(e) => handleInputChange(e, 'personalInfo', 'address')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.personalInfo.address.city}
                          onChange={(e) => handleInputChange(e, 'personalInfo', 'address')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.personalInfo.address.state}
                          onChange={(e) => handleInputChange(e, 'personalInfo', 'address')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.personalInfo.address.zipCode}
                          onChange={(e) => handleInputChange(e, 'personalInfo', 'address')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                    </div>
                  </section>

                  {/* License Information */}
                  <section className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">License Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          License Number * 
                          <span className="text-xs text-gray-500">(Format: XX12 1234567890)</span>
                        </label>
                        <input
                          type="text"
                          name="number"
                          value={formData.license.number}
                          onChange={(e) => handleInputChange(e, 'license')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          placeholder="MH12 1234567890"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                        <input
                          type="date"
                          name="expiryDate"
                          value={formData.license.expiryDate}
                          onChange={(e) => handleInputChange(e, 'license')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Issuing Authority *</label>
                        <input
                          type="text"
                          name="issuingAuthority"
                          value={formData.license.issuingAuthority}
                          onChange={(e) => handleInputChange(e, 'license')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Aadhar Number 
                          <span className="text-xs text-gray-500">(12 digits)</span>
                        </label>
                        <input
                          type="text"
                          name="aadharNumber"
                          value={formData.license.aadharNumber}
                          onChange={(e) => handleInputChange(e, 'license')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          placeholder="1234 5678 9012"
                          maxLength="14"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Employment Details */}
                  <section className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Employment Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentDriver && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                          <input
                            type="text"
                            value={formData.employment.employeeId}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Joining *</label>
                        <input
                          type="date"
                          name="dateOfJoining"
                          value={formData.employment.dateOfJoining}
                          onChange={(e) => handleInputChange(e, 'employment')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          name="status"
                          value={formData.employment.status}
                          onChange={(e) => handleInputChange(e, 'employment')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Emergency Contact */}
                  <section className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.emergencyContact.name}
                          onChange={(e) => handleInputChange(e, 'emergencyContact')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number *</label>
                        <input
                          type="tel"
                          name="contactNumber"
                          value={formData.emergencyContact.contactNumber}
                          onChange={(e) => handleInputChange(e, 'emergencyContact')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Relation *</label>
                        <input
                          type="text"
                          name="relation"
                          value={formData.emergencyContact.relation}
                          onChange={(e) => handleInputChange(e, 'emergencyContact')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          required
                        />
                      </div>
                    </div>
                  </section>

                  {/* Document Uploads */}
                  <section className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-800 mb-2">
                      Documents <span className="text-red-500">*</span>
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      All three documents are required when creating a new driver
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          License Image <span className="text-red-500">*</span>
                        </label>
                        {currentDriver?.documents?.licenseImage && (
                          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-xs text-green-700">Current: License Image</p>
                            <a 
                              href={currentDriver.documents.licenseImage} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              View Document
                            </a>
                          </div>
                        )}
                        <input
                          type="file"
                          onChange={(e) => handleFileChange(e, 'licenseImage')}
                          accept="image/*,.pdf"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG/PDF</p>
                        {files.licenseImage && (
                          <p className="text-xs text-green-600 mt-1">✓ {files.licenseImage.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ID Proof <span className="text-red-500">*</span>
                        </label>
                        {currentDriver?.documents?.idProof && (
                          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-xs text-green-700">Current: ID Proof</p>
                            <a 
                              href={currentDriver.documents.idProof} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              View Document
                            </a>
                          </div>
                        )}
                        <input
                          type="file"
                          onChange={(e) => handleFileChange(e, 'idProof')}
                          accept="image/*,.pdf"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG/PDF</p>
                        {files.idProof && (
                          <p className="text-xs text-green-600 mt-1">✓ {files.idProof.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Photo <span className="text-red-500">*</span>
                        </label>
                        {currentDriver?.documents?.photo && (
                          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-xs text-green-700">Current: Photo</p>
                            <a 
                              href={currentDriver.documents.photo} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              View Photo
                            </a>
                          </div>
                        )}
                        <input
                          type="file"
                          onChange={(e) => handleFileChange(e, 'photo')}
                          accept="image/*"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG only</p>
                        {files.photo && (
                          <p className="text-xs text-green-600 mt-1">✓ {files.photo.name}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Health Information */}
                  <section className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Health Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                        <select
                          name="bloodGroup"
                          value={formData.health.bloodGroup}
                          onChange={(e) => handleInputChange(e, 'health')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
                        <textarea
                          name="medicalConditions"
                          value={formData.health.medicalConditions}
                          onChange={(e) => handleInputChange(e, 'health')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          placeholder="Enter any medical conditions..."
                          rows="3"
                        />
                      </div>
                    </div>
                  </section>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-200 font-medium"
                    >
                      {currentDriver ? 'Update Driver' : 'Save Driver'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Driver Details Modal */}
        {isViewModalOpen && viewDriver && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-semibold text-gray-900">Driver Details</h3>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Driver Photo and Basic Info */}
                  <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {viewDriver.documents?.photo ? (
                        <img 
                          src={viewDriver.documents.photo} 
                          alt={`${viewDriver.personalInfo?.firstName || 'Driver'}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-500 text-2xl font-semibold">
                          {viewDriver.personalInfo?.firstName?.charAt(0) || 'D'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-gray-900">
                        {`${viewDriver.personalInfo?.firstName || ''} ${viewDriver.personalInfo?.middleName || ''} ${viewDriver.personalInfo?.lastName || ''}`.trim() || 'N/A'}
                      </h4>
                      <p className="text-lg text-gray-800">Employee ID: {viewDriver.employment?.employeeId || 'N/A'}</p>
                      <p className="text-sm">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          viewDriver.employment?.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {viewDriver.employment?.status || 'N/A'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <p className="text-gray-900">{viewDriver.personalInfo?.dateOfBirth ? new Date(viewDriver.personalInfo.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                        <p className="text-gray-900">{viewDriver.personalInfo?.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                        <p className="text-gray-900">{viewDriver.personalInfo?.contactNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-gray-900">{viewDriver.personalInfo?.email || 'N/A'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <p className="text-gray-900">
                          {[
                            viewDriver.personalInfo?.address?.street,
                            viewDriver.personalInfo?.address?.city,
                            viewDriver.personalInfo?.address?.state,
                            viewDriver.personalInfo?.address?.zipCode
                          ].filter(Boolean).join(', ') || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* License Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4">License Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">License Number</label>
                        <p className="text-gray-900">{viewDriver.license?.number || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                        <p className="text-gray-900">{viewDriver.license?.expiryDate ? new Date(viewDriver.license.expiryDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Issuing Authority</label>
                        <p className="text-gray-900">{viewDriver.license?.issuingAuthority || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Aadhar Number</label>
                        <p className="text-gray-900">{viewDriver.license?.aadharNumber || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Employment Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4">Employment Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Joining</label>
                        <p className="text-gray-900">{viewDriver.employment?.dateOfJoining ? new Date(viewDriver.employment.dateOfJoining).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <p className="text-gray-900">{viewDriver.employment?.status || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Created</label>
                        <p className="text-gray-900">{viewDriver.createdAt ? new Date(viewDriver.createdAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="text-gray-900">{viewDriver.emergencyContact?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                        <p className="text-gray-900">{viewDriver.emergencyContact?.contactNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Relation</label>
                        <p className="text-gray-900">{viewDriver.emergencyContact?.relation || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Health Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4">Health Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                        <p className="text-gray-900">{viewDriver.health?.bloodGroup || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Medical Conditions</label>
                        <p className="text-gray-900">{viewDriver.health?.medicalConditions || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-lg font-semibold text-gray-800 mb-4">Documents</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">License Image</label>
                        {viewDriver.documents?.licenseImage ? (
                          <a 
                            href={viewDriver.documents.licenseImage} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          >
                            View Document
                          </a>
                        ) : (
                          <p className="text-gray-500 text-sm">Not uploaded</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Proof</label>
                        {viewDriver.documents?.idProof ? (
                          <a 
                            href={viewDriver.documents.idProof} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          >
                            View Document
                          </a>
                        ) : (
                          <p className="text-gray-500 text-sm">Not uploaded</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                        {viewDriver.documents?.photo ? (
                          <a 
                            href={viewDriver.documents.photo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                          >
                            View Photo
                          </a>
                        ) : (
                          <p className="text-gray-500 text-sm">Not uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button 
                      onClick={() => setIsViewModalOpen(false)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 font-medium"
                    >
                      Close
                    </button>
                    <button 
                      onClick={() => {
                        setIsViewModalOpen(false);
                        handleEdit(viewDriver);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors duration-200 font-medium"
                    >
                      Edit Driver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverManagement;