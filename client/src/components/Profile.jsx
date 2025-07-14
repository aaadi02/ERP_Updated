import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);
  
  // Password change modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token');
    
    console.log('Profile component mounting...');
    console.log('API_URL:', API_URL);
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.error('No token found in localStorage');
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Fetch student profile using the authenticated endpoint
    console.log('Making request to:', `${API_URL}/api/student/auth/profile`);
    axios.get(`${API_URL}/api/student/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        console.log('Profile response:', res.data);
        if (res.data.success) {
          setProfile(res.data.student);
          
          // Enhanced logging for better debugging of subject data
          console.log('Student profile data:', res.data.student);
          console.log('Type of profile data:', typeof res.data.student);
          
          if (res.data.student.subjects) {
            console.log('Subjects array exists. Length:', res.data.student.subjects.length);
            console.log('Subjects array type:', Array.isArray(res.data.student.subjects) ? 'Array' : typeof res.data.student.subjects);
            console.log('Full subjects data:', JSON.stringify(res.data.student.subjects, null, 2));
            
            res.data.student.subjects.forEach((subject, index) => {
              console.log(`\nSubject ${index} details:`);
              console.log(`  Type:`, typeof subject);
              console.log(`  Is object?`, typeof subject === 'object' && subject !== null);
              console.log(`  Has _id?`, subject && subject._id ? 'Yes: ' + subject._id : 'No');
              console.log(`  Has name?`, subject && subject.name ? 'Yes: ' + subject.name : 'No');
              console.log(`  Has subjectCode?`, subject && subject.subjectCode ? 'Yes: ' + subject.subjectCode : 'No');
              console.log(`  Has code?`, subject && subject.code ? 'Yes: ' + subject.code : 'No');
              
              // Print all properties of the subject object
              if (subject && typeof subject === 'object') {
                console.log(`  All properties:`, Object.keys(subject));
                Object.entries(subject).forEach(([key, value]) => {
                  console.log(`    ${key}:`, value);
                });
              }
            });
          }
          if (res.data.student.semesterRecords) {
            console.log('Semester records:', res.data.student.semesterRecords);
            if (res.data.student.semesterRecords.length > 0) {
              const firstRecord = res.data.student.semesterRecords[0];
              console.log('First semester record subjects:', firstRecord.subjects);
              firstRecord.subjects.forEach((subjectRecord, index) => {
                console.log(`Subject Record ${index}:`, subjectRecord);
                if (subjectRecord.subject) {
                  if (typeof subjectRecord.subject === 'object') {
                    console.log(`  Subject Data:`, subjectRecord.subject);
                    console.log(`  Subject Name: ${subjectRecord.subject.name || 'not available'}`);
                  } else {
                    console.log(`  Subject Reference ID: ${subjectRecord.subject}`);
                  }
                }
              });
            }
          }
        } else {
          setError(res.data.message || 'Failed to load profile data');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Profile fetch error:', err);
        if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('studentData');
          // Redirect to login
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          setError('Failed to load profile data');
        }
        setLoading(false);
      });
  }, []);

  // Password validation functions
  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return errors;
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    
    // Clear errors for the field being changed
    setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    
    // Validate new password in real-time
    if (field === 'newPassword') {
      const errors = validatePassword(value);
      if (errors.length > 0) {
        setPasswordErrors(prev => ({ ...prev, newPassword: errors }));
      }
    }
    
    // Validate confirm password
    if (field === 'confirmPassword' || (field === 'newPassword' && passwordForm.confirmPassword)) {
      const newPass = field === 'newPassword' ? value : passwordForm.newPassword;
      const confirmPass = field === 'confirmPassword' ? value : passwordForm.confirmPassword;
      
      if (confirmPass && newPass !== confirmPass) {
        setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const errors = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      const passwordValidationErrors = validatePassword(passwordForm.newPassword);
      if (passwordValidationErrors.length > 0) {
        errors.newPassword = passwordValidationErrors;
      }
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/api/student/auth/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        alert('Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordErrors({});
      } else {
        setPasswordErrors({ general: response.data.message || 'Failed to change password' });
      }
    } catch (error) {
      console.error('Password change error:', error);
      if (error.response?.status === 401) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect' });
      } else {
        setPasswordErrors({ general: error.response?.data?.message || 'Failed to change password' });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadMessage('Please select a valid image file.');
      setTimeout(() => setUploadMessage(''), 5000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage('File size must be less than 5MB.');
      setTimeout(() => setUploadMessage(''), 5000);
      return;
    }

    setUploading(true);
    setUploadMessage('');

    try {
      const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('photo', file);

      console.log('Uploading profile photo...');

      const response = await axios.post(`${API_URL}/api/student/auth/upload-photo`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });

      if (response.data.success) {
        // Update profile with new photo URL
        setProfile(prev => ({
          ...prev,
          photo: response.data.photoUrl
        }));
        
        console.log('Photo uploaded successfully:', response.data.photoUrl);
        setUploadMessage('Profile photo updated successfully!');
        setTimeout(() => setUploadMessage(''), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      
      if (error.response?.status === 401) {
        setUploadMessage('Session expired. Please log in again.');
      } else if (error.response?.status === 413) {
        setUploadMessage('File too large. Please choose a smaller image.');
      } else {
        setUploadMessage(error.response?.data?.message || 'Failed to upload photo. Please try again.');
      }
      setTimeout(() => setUploadMessage(''), 5000);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 animate-fade-in">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <p className="mt-4 text-primary-600 font-medium animate-pulse-slow">Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-soft animate-fade-in">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
            <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-red-800">Error</h3>
            <p className="mt-1 text-red-700">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-soft animate-fade-in">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-yellow-100 rounded-full p-2">
            <svg className="h-6 w-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-yellow-800">No Profile Data</h3>
            <p className="mt-1 text-yellow-700">No profile data is available for this student ID.</p>
          </div>
        </div>
      </div>
    );
  }

  // Helper function to extract subject data from different formats
  const extractSubjectData = (subject) => {
    console.log('Processing subject:', subject);
    
    // Case 1: If subject is null or undefined
    if (!subject) {
      return {
        code: 'N/A',
        name: 'Unknown Subject',
        grade: 'N/A'
      };
    }
    
    // Case 2: If subject is already fully populated with name and code
    if (subject && typeof subject === 'object' && subject.name) {
      return {
        code: subject.subjectCode || subject.code || subject._id || 'N/A',
        name: subject.name,
        grade: 'N/A'
      };
    }
    
    // Case 3: If subject is a reference object with populated data inside subject field
    if (subject && typeof subject === 'object' && subject.subject) {
      const subjectData = subject.subject;
      if (typeof subjectData === 'object' && subjectData !== null) {
        return {
          code: subjectData.subjectCode || subjectData.code || subjectData._id || 'N/A',
          name: subjectData.name || 'Unnamed Subject',
          grade: subject.status || subject.grade || 'N/A'
        };
      } else if (subjectData) {
        // Handle case where subject.subject is an ID
        return {
          code: subjectData.toString() || 'N/A',
          name: 'Subject',
          grade: subject.status || subject.grade || 'N/A'
        };
      }
    }
    
    // Case 4: If we just have an ID or unknown format
    return {
      code: subject._id || subject.toString() || 'N/A',
      name: 'Unnamed Subject',
      grade: 'N/A'
    };
  };

  // Academic Tab - use real data if available
  let courses = [];
  
  if (profile) {
    console.log('Building courses data from profile:', profile);
    
    // Try to get subjects from direct subjects array (primary source)
    if (profile.subjects && Array.isArray(profile.subjects) && profile.subjects.length > 0) {
      console.log('Using profile.subjects array, length:', profile.subjects.length);
      
      try {
        // Direct approach - try to extract name and code directly from each subject
        courses = profile.subjects.map(subject => {
          console.log('Processing subject for courses:', subject);
          
          // If the subject is a properly populated object
          if (subject && typeof subject === 'object') {
            return {
              code: subject.subjectCode || subject.code || (subject._id ? subject._id.toString() : 'N/A'),
              name: subject.name || 'Unnamed Subject',
              grade: 'N/A' // Grade info would typically come from semester records
            };
          } 
          // If the subject is just an ID (not populated)
          else if (subject) {
            return {
              code: typeof subject === 'string' ? subject : subject.toString(),
              name: 'Subject ID: ' + (typeof subject === 'string' ? subject : subject.toString()),
              grade: 'N/A'
            };
          }
          // Fallback for null/undefined
          else {
            return {
              code: 'N/A',
              name: 'Unknown Subject',
              grade: 'N/A'
            };
          }
        });
      } catch (error) {
        console.error('Error processing subjects:', error);
        courses = [];
      }
    } 
    // Try semesterRecords if available and subjects is empty or failed
    else if (profile.semesterRecords && Array.isArray(profile.semesterRecords) && profile.semesterRecords.length > 0) {
      console.log('Using semesterRecords, found records:', profile.semesterRecords.length);
      
      try {
        // Find current semester record
        const currentSemRecord = profile.semesterRecords.find(rec => 
          rec.semester && profile.semester && 
          (rec.semester._id === profile.semester._id || 
           rec.semester === profile.semester._id)
        );
        
        if (currentSemRecord && currentSemRecord.subjects && Array.isArray(currentSemRecord.subjects)) {
          console.log('Found current semester subjects:', currentSemRecord.subjects.length);
          
          // Extract subject data with better error handling
          courses = currentSemRecord.subjects.map(subjectRecord => {
            try {
              // If subject is properly populated as an object
              if (subjectRecord.subject && typeof subjectRecord.subject === 'object') {
                return {
                  code: subjectRecord.subject.subjectCode || subjectRecord.subject.code || 
                        (subjectRecord.subject._id ? subjectRecord.subject._id.toString() : 'N/A'),
                  name: subjectRecord.subject.name || 'Unnamed Subject',
                  grade: subjectRecord.status || subjectRecord.grade || 'N/A'
                };
              }
              // If subject is just an ID (not populated)
              else if (subjectRecord.subject) {
                return {
                  code: typeof subjectRecord.subject === 'string' ? subjectRecord.subject : subjectRecord.subject.toString(),
                  name: 'Subject ID: ' + (typeof subjectRecord.subject === 'string' ? subjectRecord.subject : subjectRecord.subject.toString()),
                  grade: subjectRecord.status || subjectRecord.grade || 'N/A'
                };
              }
              // Fall back to extracting what we can from the record itself
              return {
                code: subjectRecord._id ? subjectRecord._id.toString() : 'N/A',
                name: 'Unknown Subject',
                grade: subjectRecord.status || subjectRecord.grade || 'N/A'
              };
            } catch (error) {
              console.error('Error processing subject record:', error, subjectRecord);
              return { code: 'Error', name: 'Error processing subject', grade: 'N/A' };
            }
          });
        }
      } catch (error) {
        console.error('Error processing semester records:', error);
      }
    }
  }
  
  console.log('Final courses data:', courses);
  
  // Ensure courses array is valid and filter out any invalid entries
  const validCourses = Array.isArray(courses) 
    ? courses.filter(course => course && (course.name || course.code))
    : [];
  
  console.log('Valid courses after filtering:', validCourses);
  
  const academicData = {
    cgpa: profile?.cgpa || 'N/A',
    currentSemester: profile?.semester?.number || (typeof profile?.semester === 'string' ? profile.semester : 'N/A'),
    enrollmentYear: profile?.admissionDate ? new Date(profile.admissionDate).getFullYear() : 'N/A',
    expectedGraduation: profile?.expectedGraduation || 'N/A',
    courses: validCourses
  };

  // Attendance Tab - use real data if available
  const attendanceData = {
    overall: profile.attendance?.overall || 'N/A',
    thisMonth: profile.attendance?.thisMonth || 'N/A',
    lastUpdated: profile.attendance?.lastUpdated || 'N/A',
    subjects: profile.attendance?.subjects || []
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
          My Profile
        </h2>
        <div className="ml-4 h-1 flex-grow bg-gradient-to-r from-primary-600 to-secondary-500 rounded-full"></div>
      </div>
      
      <div className="bg-white shadow-card rounded-xl overflow-hidden border border-gray-100">
        {/* Profile Header */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-primary-600 to-secondary-500"></div>
          <div className="absolute top-16 left-6 flex items-end">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden relative group">
                {uploading ? (
                  <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <p className="text-xs text-primary-600 mt-1">Uploading...</p>
                    </div>
                  </div>
                ) : profile.photo ? (
                  <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-4xl font-bold text-gray-700">
                    {profile.firstName ? profile.firstName.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                
                {/* Image upload overlay */}
                {!uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}>
                    <div className="text-center">
                      <svg className="h-8 w-8 text-white mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-xs text-white font-medium">Change Photo</p>
                    </div>
                  </div>
                )}
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            <div className="ml-4 mb-4 text-white">
              <h3 className="text-2xl font-bold">
                {profile.firstName} {profile.middleName} {profile.lastName}
              </h3>
              <p className="opacity-90">Enrollment No: {profile.enrollmentNumber}</p>
              <p className="opacity-90 text-sm">Student ID: {profile.studentId}</p>
            </div>
          </div>
        </div>
        
        {/* Upload message */}
        {uploadMessage && (
          <div className={`mx-6 mt-4 p-3 rounded-lg text-sm font-medium ${
            uploadMessage.includes('successfully') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {uploadMessage}
          </div>
        )}
        
        {/* Tabs */}
        <div className="mt-20 px-6 border-b">
          <nav className="flex space-x-8">
            {['personal', 'academic', 'attendance'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Information
              </button>
            ))}
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="animate-slide-in-right">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4 hover:shadow-soft transition-shadow duration-300">
                  <div className="flex items-center mb-3">
                    <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 018 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    <h4 className="text-sm font-medium text-gray-500">Email Address</h4>
                  </div>
                  <p className="text-gray-800 font-medium">{profile.email}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 hover:shadow-soft transition-shadow duration-300">
                  <div className="flex items-center mb-3">
                    <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <h4 className="text-sm font-medium text-gray-500">Phone Number</h4>
                  </div>
                  <p className="text-gray-800 font-medium">{profile.mobileNumber || 'Not provided'}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 hover:shadow-soft transition-shadow duration-300">
                  <div className="flex items-center mb-3">
                    <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h4 className="text-sm font-medium text-gray-500">Department</h4>
                  </div>
                  <p className="text-gray-800 font-medium">{profile.department?.name || 'N/A'}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 hover:shadow-soft transition-shadow duration-300">
                  <div className="flex items-center mb-3">
                    <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h4 className="text-sm font-medium text-gray-500">Current Semester</h4>
                  </div>
                  <p className="text-gray-800 font-medium">{profile.semester?.number || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 hover:shadow-soft transition-shadow duration-300">
                  <div className="flex items-center mb-3">
                    <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="text-sm font-medium text-gray-500">Stream</h4>
                  </div>
                  <p className="text-gray-800 font-medium">{profile.stream?.name || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 hover:shadow-soft transition-shadow duration-300">
                  <div className="flex items-center mb-3">
                    <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <h4 className="text-sm font-medium text-gray-500">Gender</h4>
                  </div>
                  <p className="text-gray-800 font-medium">{profile.gender || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 hover:shadow-soft transition-shadow duration-300">
                  <div className="flex items-center mb-3">
                    <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h4 className="text-sm font-medium text-gray-500">Date of Birth</h4>
                  </div>
                  <p className="text-gray-800 font-medium">
                    {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 hover:shadow-soft transition-shadow duration-300">
                  <div className="flex items-center mb-3">
                    <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h4 className="text-sm font-medium text-gray-500">Password Status</h4>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-800 font-medium">
                      {profile.passwordLastChanged ? 'Custom Password Set' : 'Using Date of Birth'}
                    </p>
                    {profile.passwordLastChanged && (
                      <p className="text-xs text-gray-500">
                        Last changed: {new Date(profile.passwordLastChanged).toLocaleDateString()}
                      </p>
                    )}
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 transition-colors duration-300"
                    >
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Change Password
                    </button>
                  </div>
                </div>
                
                {profile.address && (
                  <div className="bg-gray-50 rounded-lg p-4 col-span-2 hover:shadow-soft transition-shadow duration-300">
                    <div className="flex items-center mb-3">
                      <svg className="h-5 w-5 text-primary-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <h4 className="text-sm font-medium text-gray-500">Address</h4>
                    </div>
                    <p className="text-gray-800 font-medium">{profile.address}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100 transition-colors duration-200 flex items-center"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Change Password
                </button>
              </div>
            </div>
          )}
          
          {/* Academic Information Tab */}
          {activeTab === 'academic' && (
            <div className="animate-slide-in-right">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-lg p-4 shadow-soft">
                  <p className="text-xs font-medium text-primary-100">CGPA</p>
                  <p className="text-3xl font-bold mt-1">{academicData.cgpa}</p>
                </div>
                
                <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white rounded-lg p-4 shadow-soft">
                  <p className="text-xs font-medium text-secondary-100">Current Semester</p>
                  <p className="text-3xl font-bold mt-1">{academicData.currentSemester}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow-soft">
                  <p className="text-xs font-medium text-green-100">Enrollment Year</p>
                  <p className="text-3xl font-bold mt-1">{academicData.enrollmentYear}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow-soft">
                  <p className="text-xs font-medium text-purple-100">Expected Graduation</p>
                  <p className="text-3xl font-bold mt-1">{academicData.expectedGraduation}</p>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-800 mb-4">Current Courses</h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Code</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {academicData.courses && academicData.courses.length > 0 ? (
                      academicData.courses.map((course, index) => {
                        // Extra validation before rendering
                        const courseCode = course?.code || 'N/A';
                        const courseName = course?.name || 'Unnamed Subject';
                        const courseGrade = course?.grade || 'N/A';
                        
                        // Debug info
                        console.log(`Rendering course ${index}:`, { code: courseCode, name: courseName, grade: courseGrade });
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{courseCode}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{courseName}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                courseGrade && typeof courseGrade === 'string' && courseGrade.startsWith('A') ? 'bg-green-100 text-green-800' :
                                courseGrade && typeof courseGrade === 'string' && courseGrade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                courseGrade && typeof courseGrade === 'string' && courseGrade.startsWith('C') ? 'bg-yellow-100 text-yellow-800' :
                                courseGrade && typeof courseGrade === 'string' && courseGrade.startsWith('F') ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {courseGrade}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">No courses found for current semester</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Attendance Information Tab */}
          {activeTab === 'attendance' && (
            <div className="animate-slide-in-right">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Overall Attendance</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{attendanceData.overall}</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-primary-50 flex items-center justify-center">
                      <svg className="h-8 w-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">This Month</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{attendanceData.thisMonth}</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-secondary-50 flex items-center justify-center">
                      <svg className="h-8 w-8 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Last Updated</p>
                      <p className="text-2xl font-bold text-gray-800 mt-1">{attendanceData.lastUpdated}</p>
                    </div>
                    <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
                      <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-gray-800 mb-4">Subject-wise Attendance</h3>
              <div className="space-y-4">
                {attendanceData.subjects.map((subject, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-soft transition-shadow duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-800">{subject.name}</h4>
                      <span className="text-sm text-gray-500">{subject.classes} classes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-gradient-to-r from-primary-500 to-secondary-500 h-2.5 rounded-full" 
                        style={{ width: subject.percentage }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">0%</span>
                      <span className="text-xs font-medium text-primary-600">{subject.percentage}</span>
                      <span className="text-xs text-gray-500">100%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 animate-slide-in-bottom">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Change Password</h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordErrors({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {passwordErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{passwordErrors.general}</p>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              {/* Current Password */}
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.current ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.new ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <div className="mt-1">
                    {Array.isArray(passwordErrors.newPassword) ? (
                      <ul className="text-sm text-red-600">
                        {passwordErrors.newPassword.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-red-600">{passwordErrors.newPassword}</p>
                    )}
                  </div>
                )}

                {/* Password Requirements */}
                <div className="mt-2 text-xs text-gray-500">
                  <p className="font-medium">Password must contain:</p>
                  <ul className="mt-1 space-y-1">
                    <li className={`flex items-center ${passwordForm.newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                      <svg className={`h-3 w-3 mr-1 ${passwordForm.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      At least 8 characters
                    </li>
                    <li className={`flex items-center ${/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600' : ''}`}>
                      <svg className={`h-3 w-3 mr-1 ${/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      One uppercase letter
                    </li>
                    <li className={`flex items-center ${/[a-z]/.test(passwordForm.newPassword) ? 'text-green-600' : ''}`}>
                      <svg className={`h-3 w-3 mr-1 ${/[a-z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      One lowercase letter
                    </li>
                    <li className={`flex items-center ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.newPassword) ? 'text-green-600' : ''}`}>
                      <svg className={`h-3 w-3 mr-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      One special character
                    </li>
                  </ul>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.confirm ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordErrors({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading || Object.values(passwordErrors).some(error => error && error.length > 0)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
                >
                  {passwordLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;