import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { getAllConductors, createConductor, updateConductor, deleteConductor } from '../../services/conductorService';
import './ConductorManagement.css';

const ConductorManagement = () => {
  const [conductors, setConductors] = useState([]);
  const [filteredConductors, setFilteredConductors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentConductor, setCurrentConductor] = useState(null);
  const [selectedConductor, setSelectedConductor] = useState(null);
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
    employment: {
      employeeId: '',
      dateOfJoining: '',
      status: 'Active'
    },
    emergencyContact: {
      name: '',
      contactNumber: '',
      relation: ''
    },
    govtId: {
      aadharNumber: '',
      issuingAuthority: ''
    },
    health: {
      bloodGroup: '',
      medicalConditions: ''
    }
  });
  const [files, setFiles] = useState({
    aadharCard: null,
    photo: null
  });

  useEffect(() => {
    fetchConductors();
  }, []);

  // Generate next employee ID
  const generateEmployeeId = async () => {
    try {
      const response = await getAllConductors();
      const conductors = response.data.conductors;
      const maxId = conductors.reduce((max, conductor) => {
        const empId = conductor.employment?.employeeId || conductor.employeeId || '';
        const num = parseInt(empId.replace('CON', '')) || 0;
        return Math.max(max, num);
      }, 0);
      return `CON${String(maxId + 1).padStart(4, '0')}`;
    } catch (error) {
      return 'CON0001'; // Default if no conductors exist
    }
  };

  const fetchConductors = async () => {
    try {
      const response = await getAllConductors();
      // Handle different response structures
      const conductorsData = response.data?.conductors || response.data?.data || response.data || [];
      setConductors(conductorsData);
      setFilteredConductors(conductorsData);
    } catch (error) {
      console.error('Error fetching conductors:', error);
      alert('Failed to fetch conductors');
      // Set empty arrays as fallback
      setConductors([]);
      setFilteredConductors([]);
    }
  };

  // Search functionality
  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    if (!searchValue.trim()) {
      setFilteredConductors(conductors || []);
      return;
    }

    const filtered = (conductors || []).filter(conductor => {
      const searchLower = searchValue.toLowerCase();
      const fullName = `${conductor.personalInfo?.firstName || ''} ${conductor.personalInfo?.lastName || ''}`.toLowerCase();
      const employeeId = (conductor.employment?.employeeId || conductor.employeeId || '').toLowerCase();
      const contactNumber = (conductor.personalInfo?.contactNumber || '').toLowerCase();
      const email = (conductor.personalInfo?.email || '').toLowerCase();

      return fullName.includes(searchLower) ||
             employeeId.includes(searchLower) ||
             contactNumber.includes(searchLower) ||
             email.includes(searchLower);
    });

    setFilteredConductors(filtered);
  };

  // View conductor details
  const handleViewConductor = (conductor) => {
    setSelectedConductor(conductor);
    setIsViewModalOpen(true);
  };

  const handleEdit = (conductor) => {
    setCurrentConductor(conductor);
    setFormData({
      personalInfo: {
        firstName: conductor.personalInfo?.firstName || '',
        middleName: conductor.personalInfo?.middleName || '',
        lastName: conductor.personalInfo?.lastName || '',
        dateOfBirth: conductor.personalInfo?.dateOfBirth ? 
          new Date(conductor.personalInfo.dateOfBirth).toISOString().split('T')[0] : '',
        gender: conductor.personalInfo?.gender || '',
        contactNumber: conductor.personalInfo?.contactNumber || '',
        email: conductor.personalInfo?.email || '',
        address: {
          street: conductor.personalInfo?.address?.street || '',
          city: conductor.personalInfo?.address?.city || '',
          state: conductor.personalInfo?.address?.state || '',
          zipCode: conductor.personalInfo?.address?.zipCode || ''
        }
      },
      employment: {
        employeeId: conductor.employment?.employeeId || conductor.employeeId || '',
        dateOfJoining: conductor.employment?.dateOfJoining || conductor.dateOfJoining ? 
          new Date(conductor.employment?.dateOfJoining || conductor.dateOfJoining).toISOString().split('T')[0] : '',
        status: conductor.employment?.status || conductor.status || 'Active'
      },
      emergencyContact: {
        name: conductor.emergencyContact?.name || '',
        contactNumber: conductor.emergencyContact?.contactNumber || '',
        relation: conductor.emergencyContact?.relation || ''
      },
      govtId: {
        aadharNumber: formatAadharNumber(conductor.govtId?.aadharNumber || conductor.govtId?.number || ''),
        issuingAuthority: conductor.govtId?.issuingAuthority || ''
      },
      health: {
        bloodGroup: conductor.health?.bloodGroup || '',
        medicalConditions: conductor.health?.medicalConditions || ''
      }
    });
    
    // Reset files for editing
    setFiles({
      aadharCard: null,
      photo: null
    });
    
    setIsModalOpen(true);
  };

  const handleDelete = async (conductorId) => {
    if (window.confirm('Are you sure you want to delete this conductor?')) {
      try {
        await deleteConductor(conductorId);
        fetchConductors();
        
        // Update filtered conductors if search is active
        if (searchTerm) {
          setTimeout(() => handleSearch(searchTerm), 100);
        }
        alert('Conductor deleted successfully');
      } catch (error) {
        console.error('Error deleting conductor:', error);
        alert('Failed to delete conductor');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required documents for new conductors
      if (!currentConductor) {
        const missingDocuments = [];
        if (!files.aadharCard) missingDocuments.push('Aadhar Card');
        if (!files.photo) missingDocuments.push('Photo');
        
        if (missingDocuments.length > 0) {
          alert(`Please upload all required documents: ${missingDocuments.join(', ')}`);
          return;
        }
      }

      // Generate employee ID for new conductors - let backend handle this
      // if (!currentConductor) {
      //   const employeeId = await generateEmployeeId();
      //   formData.employment.employeeId = employeeId;
      // }

      const formDataToSend = new FormData();
      
      // Add files if they exist
      Object.keys(files).forEach(key => {
        if (files[key]) {
          formDataToSend.append(key, files[key]);
        }
      });
      
      // Add form data
      formDataToSend.append('data', JSON.stringify(formData));

      if (currentConductor) {
        await updateConductor(currentConductor._id, formDataToSend);
      } else {
        await createConductor(formDataToSend);
      }
      
      fetchConductors();
      setIsModalOpen(false);
      resetForm();
      alert(`Conductor ${currentConductor ? 'updated' : 'created'} successfully!`);
      
      // Update filtered conductors if search is active
      if (searchTerm) {
        setTimeout(() => handleSearch(searchTerm), 100);
      }
    } catch (error) {
      console.error('Error saving conductor:', error);
      alert(`Failed to ${currentConductor ? 'update' : 'create'} conductor: ${error.message || error}`);
    }
  };

  // Format Aadhar number with spaces (1234 5678 9012)
  const formatAadharNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 12 digits
    const limited = digits.slice(0, 12);
    
    // Add spaces every 4 digits
    const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    return formatted;
  };

  const handleInputChange = (e, section, subsection = null) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Format Aadhar number
    if (name === 'aadharNumber') {
      processedValue = formatAadharNumber(value);
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
        aadharCard: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
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
    setCurrentConductor(null);
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
      employment: {
        employeeId: '',
        dateOfJoining: '',
        status: 'Active'
      },
      emergencyContact: {
        name: '',
        contactNumber: '',
        relation: ''
      },
      govtId: {
        aadharNumber: '',
        issuingAuthority: ''
      },
      health: {
        bloodGroup: '',
        medicalConditions: ''
      }
    });
    setFiles({
      aadharCard: null,
      photo: null
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Conductor Management</h2>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
            >
              <FaUserPlus /> Add Conductor
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search conductors by name, ID, contact, email..."
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
              {(filteredConductors || []).length} of {(conductors || []).length} conductors
            </div>
          </div>
        </div>

        {/* Conductor List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(filteredConductors || []).map(conductor => (
            <div 
              key={conductor._id} 
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => handleViewConductor(conductor)}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {conductor.documents?.photo && conductor.documents.photo.startsWith('http') && !conductor.documents.photo.includes('test-url.com') ? (
                    <img 
                      src={conductor.documents.photo} 
                      alt={`${conductor.personalInfo?.firstName || 'Conductor'}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.parentElement?.querySelector('span');
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <span className="text-gray-500 text-lg font-semibold flex items-center justify-center w-full h-full" style={{ display: (conductor.documents?.photo && conductor.documents.photo.startsWith('http') && !conductor.documents.photo.includes('test-url.com')) ? 'none' : 'flex' }}>
                    {conductor.personalInfo?.firstName?.charAt(0) || 'C'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {`${conductor.personalInfo?.firstName || ''} ${conductor.personalInfo?.lastName || ''}`.trim() || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-800">ID: {conductor.employment?.employeeId || conductor.employeeId || 'N/A'}</p>
                  <p className="text-sm text-gray-800">Contact: {conductor.personalInfo?.contactNumber || 'N/A'}</p>
                  <p className="text-sm text-gray-800">Email: {conductor.personalInfo?.email || 'N/A'}</p>
                  <p className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      (conductor.employment?.status || conductor.status) === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {conductor.employment?.status || conductor.status || 'Active'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(conductor);
                  }}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit conductor"
                >
                  <FaEdit />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(conductor._id);
                  }}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete conductor"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredConductors.length === 0 && conductors.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No conductors found</div>
            <div className="text-gray-500 text-sm">
              Try adjusting your search criteria
            </div>
          </div>
        )}

        {/* Empty State */}
        {conductors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No conductors available</div>
            <div className="text-gray-500 text-sm">
              Click "Add Conductor" to create your first conductor
            </div>
          </div>
        )}
        {/* Conductor Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  {currentConductor ? 'Edit Conductor' : 'Add New Conductor'}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.personalInfo.dateOfBirth}
                          onChange={(e) => handleInputChange(e, 'personalInfo')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                        <select
                          name="gender"
                          value={formData.personalInfo.gender}
                          onChange={(e) => handleInputChange(e, 'personalInfo')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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

                  {/* Employment Details */}
                  <section className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Employment Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {currentConductor && (
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.emergencyContact.name}
                          onChange={(e) => handleInputChange(e, 'emergencyContact')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                        <input
                          type="tel"
                          name="contactNumber"
                          value={formData.emergencyContact.contactNumber}
                          onChange={(e) => handleInputChange(e, 'emergencyContact')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                        <input
                          type="text"
                          name="relation"
                          value={formData.emergencyContact.relation}
                          onChange={(e) => handleInputChange(e, 'emergencyContact')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Government ID */}
                  <section className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">Government ID Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Aadhar Number</label>
                        <input
                          type="text"
                          name="aadharNumber"
                          value={formData.govtId.aadharNumber}
                          onChange={(e) => handleInputChange(e, 'govtId')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          placeholder="1234 5678 9012"
                          maxLength="14"
                        />
                        <p className="text-xs text-gray-500 mt-1">12-digit Aadhar number with spaces</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Issuing Authority</label>
                        <input
                          type="text"
                          name="issuingAuthority"
                          value={formData.govtId.issuingAuthority}
                          onChange={(e) => handleInputChange(e, 'govtId')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                      Both documents are required when creating a new conductor
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Aadhar Card <span className="text-red-500">*</span>
                        </label>
                        {currentConductor?.documents?.aadharCard && (
                          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-xs text-green-700">Current: Aadhar Card</p>
                            <a 
                              href={currentConductor.documents.aadharCard} 
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
                          onChange={(e) => handleFileChange(e, 'aadharCard')}
                          accept="image/*,.pdf"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        />
                        <p className="text-xs text-gray-500 mt-1">Max 5MB, JPG/PNG/PDF</p>
                        {files.aadharCard && (
                          <p className="text-xs text-green-600 mt-1">✓ {files.aadharCard.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Photo <span className="text-red-500">*</span>
                        </label>
                        {currentConductor?.documents?.photo && (
                          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded">
                            <p className="text-xs text-green-700">Current: Photo</p>
                            <a 
                              href={currentConductor.documents.photo} 
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
                      {currentConductor ? 'Update Conductor' : 'Save Conductor'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Conductor Modal */}
        {isViewModalOpen && selectedConductor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Conductor Details</h3>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Profile Section */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      {selectedConductor.documents?.photo && selectedConductor.documents.photo.startsWith('http') && !selectedConductor.documents.photo.includes('test-url.com') ? (
                        <img
                          src={selectedConductor.documents.photo}
                          alt="Conductor Photo"
                          className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-white shadow-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-32 h-32 mx-auto rounded-full bg-gray-300 flex items-center justify-center border-4 border-white shadow-lg ${(selectedConductor.documents?.photo && selectedConductor.documents.photo.startsWith('http') && !selectedConductor.documents.photo.includes('test-url.com')) ? 'hidden' : 'flex'}`}>
                        <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="mt-4 text-lg font-semibold text-gray-900">
                        {selectedConductor.personalInfo?.firstName} {selectedConductor.personalInfo?.middleName} {selectedConductor.personalInfo?.lastName}
                      </h4>
                      <p className="text-blue-600 font-medium">{selectedConductor.employment?.employeeId}</p>
                      <div className="mt-4 flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedConductor.employment?.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedConductor.employment?.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="lg:col-span-2">
                    <div className="space-y-6">
                      {/* Personal Information */}
                      <section className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Personal Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                            <p className="text-gray-900">{selectedConductor.personalInfo?.dateOfBirth || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Gender</label>
                            <p className="text-gray-900">{selectedConductor.personalInfo?.gender || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Contact Number</label>
                            <p className="text-gray-900">{selectedConductor.personalInfo?.contactNumber}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Email</label>
                            <p className="text-gray-900">{selectedConductor.personalInfo?.email || 'Not provided'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-500">Address</label>
                            <p className="text-gray-900">
                              {selectedConductor.personalInfo?.address ? 
                                `${selectedConductor.personalInfo.address.street || ''} ${selectedConductor.personalInfo.address.city || ''} ${selectedConductor.personalInfo.address.state || ''} ${selectedConductor.personalInfo.address.zipCode || ''}`.trim() || 'Not provided'
                                : 'Not provided'
                              }
                            </p>
                          </div>
                        </div>
                      </section>

                      {/* Employment Details */}
                      <section className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Employment Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Date of Joining</label>
                            <p className="text-gray-900">{selectedConductor.employment?.dateOfJoining || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Status</label>
                            <p className="text-gray-900">{selectedConductor.employment?.status}</p>
                          </div>
                        </div>
                      </section>

                      {/* Emergency Contact */}
                      <section className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Emergency Contact</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Name</label>
                            <p className="text-gray-900">{selectedConductor.emergencyContact?.name || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Contact Number</label>
                            <p className="text-gray-900">{selectedConductor.emergencyContact?.contactNumber || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Relation</label>
                            <p className="text-gray-900">{selectedConductor.emergencyContact?.relation || 'Not provided'}</p>
                          </div>
                        </div>
                      </section>

                      {/* Government ID */}
                      <section className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Government ID Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Aadhar Number</label>
                            <p className="text-gray-900">{selectedConductor.govtId?.aadharNumber || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Issuing Authority</label>
                            <p className="text-gray-900">{selectedConductor.govtId?.issuingAuthority || 'Not provided'}</p>
                          </div>
                        </div>
                      </section>

                      {/* Health Information */}
                      <section className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Health Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Blood Group</label>
                            <p className="text-gray-900">{selectedConductor.health?.bloodGroup || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Medical Conditions</label>
                            <p className="text-gray-900">{selectedConductor.health?.medicalConditions || 'None reported'}</p>
                          </div>
                        </div>
                      </section>

                      {/* Documents */}
                      <section className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Documents</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Aadhar Card</label>
                            {selectedConductor.documents?.aadharCard ? (
                              <a 
                                href={selectedConductor.documents.aadharCard} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                View Document
                              </a>
                            ) : (
                              <p className="text-gray-900">Not uploaded</p>
                            )}
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Photo</label>
                            {selectedConductor.documents?.photo ? (
                              <a 
                                href={selectedConductor.documents.photo} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                View Photo
                              </a>
                            ) : (
                              <p className="text-gray-900">Not uploaded</p>
                            )}
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConductorManagement;