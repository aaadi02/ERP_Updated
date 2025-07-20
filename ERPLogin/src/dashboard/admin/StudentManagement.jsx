import React, { useState, useEffect } from 'react';
import { FaUser, FaEdit, FaTrash, FaEye, FaCheck, FaTimes, FaUserCheck, FaUserTimes } from 'react-icons/fa';
import './StudentManagement.css';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First test if the API is accessible
      console.log('Testing API connection...');
      const testResponse = await fetch('http://localhost:5000/api/superadmin/students/test', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!testResponse.ok) {
        console.error('Test endpoint failed:', testResponse.status, testResponse.statusText);
        if (testResponse.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (testResponse.status === 403) {
          throw new Error('Access denied. You do not have permission to view students.');
        } else {
          throw new Error(`API connection failed: ${testResponse.status}`);
        }
      }
      
      const testData = await testResponse.json();
      console.log('Test endpoint response:', testData);
      
      // Now fetch the actual students
      console.log('Fetching students...');
      const response = await fetch('http://localhost:5000/api/superadmin/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Students fetch failed:', response.status, response.statusText);
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view students.');
        } else {
          throw new Error(`Failed to fetch students: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log('Students API Response:', data); // Debug log
      
      // Handle different response structures
      let studentsData;
      if (Array.isArray(data)) {
        // Direct array response
        studentsData = data;
      } else if (data.students) {
        // Wrapped in students property
        studentsData = data.students;
      } else if (data.data) {
        // Wrapped in data property
        studentsData = data.data;
      } else {
        // Fallback
        studentsData = [];
      }
      
      console.log('Processed Students Data:', studentsData); // Debug log
      console.log('Number of students:', studentsData.length);
      
      setStudents(studentsData);
      setFilteredStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError(error.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  // Search functionality
  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
    if (!searchValue.trim()) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student => {
      const searchLower = searchValue.toLowerCase();
      const fullName = `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.toLowerCase();
      const studentId = (student.studentId || '').toLowerCase();
      const enrollmentNumber = (student.enrollmentNumber || '').toLowerCase();
      const email = (student.email || '').toLowerCase();
      const mobileNumber = (student.mobileNumber || '').toLowerCase();

      return fullName.includes(searchLower) ||
             studentId.includes(searchLower) ||
             enrollmentNumber.includes(searchLower) ||
             email.includes(searchLower) ||
             mobileNumber.includes(searchLower);
    });

    setFilteredStudents(filtered);
  };

  // View student details
  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  // Toggle student access
  const toggleStudentAccess = async (studentId, currentStatus) => {
    try {
      const action = currentStatus ? 'disable' : 'enable';
      const response = await fetch(`http://localhost:5000/api/superadmin/students/${studentId}/toggle-access`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ loginEnabled: !currentStatus })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} student access`);
      }

      // Update local state
      const updatedStudents = students.map(student => 
        student._id === studentId 
          ? { ...student, loginEnabled: !currentStatus }
          : student
      );
      setStudents(updatedStudents);
      
      // Update filtered students if search is active
      if (searchTerm) {
        handleSearch(searchTerm);
      } else {
        setFilteredStudents(updatedStudents);
      }

      alert(`Student access ${action}d successfully!`);
    } catch (error) {
      console.error('Error toggling student access:', error);
      alert(`Failed to ${currentStatus ? 'disable' : 'enable'} student access`);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 text-lg mb-2">{error}</div>
            <button 
              onClick={fetchStudents}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
            <div className="text-sm text-gray-600">
              Total: {students.length} | Active: {students.filter(s => s.loginEnabled !== false).length}
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search students by name, ID, enrollment, email, mobile..."
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
              {filteredStudents.length} of {students.length} students
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(student => (
            <div 
              key={student._id} 
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {student.photo && student.photo.startsWith('http') ? (
                    <img 
                      src={student.photo} 
                      alt={`${student.firstName || 'Student'}`}
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
                  <span className="text-gray-500 text-lg font-semibold flex items-center justify-center w-full h-full" style={{ display: (student.photo && student.photo.startsWith('http')) ? 'none' : 'flex' }}>
                    {student.firstName?.charAt(0) || 'S'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {`${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim() || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-600">ID: {student.studentId || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Enrollment: {student.enrollmentNumber || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Mobile: {student.mobileNumber || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Email: {student.email || 'N/A'}</p>
                  
                  {/* Login Status */}
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      student.loginEnabled !== false 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.loginEnabled !== false ? 'Login Enabled' : 'Login Disabled'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => handleViewStudent(student)}
                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="View student details"
                >
                  <FaEye />
                </button>
                
                {/* Login Access Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Login Access:</span>
                  <button
                    onClick={() => toggleStudentAccess(student._id, student.loginEnabled !== false)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200 ${
                      student.loginEnabled !== false
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                    title={student.loginEnabled !== false ? 'Disable login access' : 'Enable login access'}
                  >
                    {student.loginEnabled !== false ? (
                      <>
                        <FaUserCheck className="text-xs" />
                        Yes
                      </>
                    ) : (
                      <>
                        <FaUserTimes className="text-xs" />
                        No
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredStudents.length === 0 && students.length > 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No students found</div>
            <div className="text-gray-500 text-sm">
              Try adjusting your search criteria
            </div>
          </div>
        )}

        {/* Empty State */}
        {students.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No students available</div>
            <div className="text-gray-500 text-sm">
              Students will appear here once they are added to the system
            </div>
          </div>
        )}

        {/* View Student Modal */}
        {isViewModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Student Details</h3>
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
                      {selectedStudent.photo && selectedStudent.photo.startsWith('http') ? (
                        <img
                          src={selectedStudent.photo}
                          alt="Student Photo"
                          className="w-32 h-32 mx-auto rounded-full object-cover border-4 border-white shadow-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-32 h-32 mx-auto rounded-full bg-gray-300 flex items-center justify-center border-4 border-white shadow-lg ${(selectedStudent.photo && selectedStudent.photo.startsWith('http')) ? 'hidden' : 'flex'}`}>
                        <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="mt-4 text-lg font-semibold text-gray-900">
                        {selectedStudent.firstName} {selectedStudent.middleName} {selectedStudent.lastName}
                      </h4>
                      <p className="text-blue-600 font-medium">{selectedStudent.studentId}</p>
                      <div className="mt-4 flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedStudent.loginEnabled !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedStudent.loginEnabled !== false ? 'Login Enabled' : 'Login Disabled'}
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
                            <p className="text-gray-900">{formatDate(selectedStudent.dateOfBirth)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Gender</label>
                            <p className="text-gray-900">{selectedStudent.gender || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Father's Name</label>
                            <p className="text-gray-900">{selectedStudent.fatherName || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Mother's Name</label>
                            <p className="text-gray-900">{selectedStudent.motherName || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Mobile Number</label>
                            <p className="text-gray-900">{selectedStudent.mobileNumber}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Guardian Number</label>
                            <p className="text-gray-900">{selectedStudent.guardianNumber || 'Not provided'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-500">Address</label>
                            <p className="text-gray-900">{selectedStudent.address || 'Not provided'}</p>
                          </div>
                        </div>
                      </section>

                      {/* Academic Information */}
                      <section className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Academic Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Enrollment Number</label>
                            <p className="text-gray-900">{selectedStudent.enrollmentNumber || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Section</label>
                            <p className="text-gray-900">{selectedStudent.section || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Admission Date</label>
                            <p className="text-gray-900">{formatDate(selectedStudent.admissionDate)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Admission Type</label>
                            <p className="text-gray-900">{selectedStudent.admissionType || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Caste Category</label>
                            <p className="text-gray-900">{selectedStudent.casteCategory || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">ABC ID</label>
                            <p className="text-gray-900">{selectedStudent.abcId || 'Not provided'}</p>
                          </div>
                        </div>
                      </section>

                      {/* Additional Information */}
                      <section className="bg-white border border-gray-200 rounded-lg p-4">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Additional Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Nationality</label>
                            <p className="text-gray-900">{selectedStudent.nationality || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Place of Birth</label>
                            <p className="text-gray-900">{selectedStudent.placeOfBirth || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">School Attended</label>
                            <p className="text-gray-900">{selectedStudent.schoolAttended || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Moral Character</label>
                            <p className="text-gray-900">{selectedStudent.moralCharacter || 'Not provided'}</p>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-500">Remarks</label>
                            <p className="text-gray-900">{selectedStudent.remark || 'None'}</p>
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

export default StudentManagement;
