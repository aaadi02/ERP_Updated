import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [borrowedBooks, setBorrowedBooks] = useState({});
  const navigate = useNavigate();

  // Function to fetch borrowed books count for a student/faculty member
  const fetchBorrowedBooks = async (borrowerId, borrowerType = 'student') => {
    try {
      console.log(`🔍 Fetching borrowed books for ${borrowerType} ID: ${borrowerId}`);
      
      // First try the main API with includeRenewed parameter
      const response = await axios.get(`http://localhost:5000/api/issues/borrowed-books`, {
        params: {
          borrowerId: borrowerId,
          borrowerType: borrowerType,
          includeRenewed: true,
          status: 'all'
        }
      });

      let books = [];
      if (response.data.success && response.data.data) {
        books = response.data.data;
        console.log(`📖 Found ${books.length} books via main API for ${borrowerId}:`, books.map(b => b.title || b.bookTitle));
        
        // 🔍 ENHANCED DEBUG: Log the complete API response for troubleshooting
        console.log(`🚨 DEBUG: Complete API response for ${borrowerId}:`, {
          success: response.data.success,
          dataType: typeof response.data.data,
          dataLength: Array.isArray(response.data.data) ? response.data.data.length : 'not array',
          fullData: response.data.data,
          completeResponse: response.data
        });
      }

      // Also try alternative parameter names if no books found
      if (books.length === 0) {
        console.log(`🔄 No books found with borrowerId, trying with ${borrowerType}Id parameter...`);
        try {
          const altResponse = await axios.get(`http://localhost:5000/api/issues/borrowed-books`, {
            params: {
              [`${borrowerType}Id`]: borrowerId,
              includeRenewed: true,
              status: 'all'
            }
          });
          
          if (altResponse.data.success && altResponse.data.data) {
            books = altResponse.data.data;
            console.log(`📖 Found ${books.length} books via alternative API for ${borrowerId}:`, books.map(b => b.title || b.bookTitle));
          }
        } catch (altError) {
          console.warn(`Alternative API call failed for ${borrowerId}:`, altError.message);
        }
      }

      // If we still got fewer books than expected, try to get from history API as well
      // 🚧 TEMPORARILY DISABLED to debug cross-contamination issue
      if (false && books.length < 2) {
        console.log(`🔄 Only found ${books.length} books for ${borrowerId}, checking history for more...`);
        try {
          // 🔧 FIX: Use proper student-specific parameters for history API
          const historyParams = {
            status: 'active',
            limit: 10,
            borrowerType: borrowerType
          };
          
          // Add student-specific parameter
          if (borrowerType === 'student') {
            historyParams.studentId = borrowerId;
          } else {
            historyParams.employeeId = borrowerId;
          }
          
          console.log(`📚 Fetching history for ${borrowerId} with params:`, historyParams);
          
          const historyResponse = await axios.get(`http://localhost:5000/api/issues/history`, {
            params: historyParams
          });

          console.log(`📚 History API response for ${borrowerId}:`, historyResponse.data);

          if (historyResponse.data.success && historyResponse.data.data.records) {
            // 🔧 FIX: Double-check that records belong to this specific student
            const historyBooks = historyResponse.data.data.records.filter(record => {
              const recordMatches = (
                (record.status === 'issued' || record.status === 'renewed' || record.transactionType === 'renew') &&
                (
                  (borrowerType === 'student' && record.studentId === borrowerId) ||
                  (borrowerType === 'faculty' && record.employeeId === borrowerId)
                )
              );
              
              if (!recordMatches && record.studentId) {
                console.log(`� Filtering out record for different student: ${record.studentId} (looking for ${borrowerId})`);
              }
              
              return recordMatches;
            });
            
            console.log(`�📚 Found ${historyBooks.length} additional books from history for ${borrowerId} (after filtering)`);
            
            // Merge with existing books, avoiding duplicates
            historyBooks.forEach(historyBook => {
              const existingBook = books.find(book => 
                book.ACCNO === historyBook.bookId || 
                book.ACCNO === historyBook.ACCNO ||
                book.bookId === historyBook.bookId ||
                book.bookTitle === historyBook.bookTitle ||
                book.title === historyBook.bookTitle
              );
              if (!existingBook) {
                console.log(`➕ Adding book from history: ${historyBook.bookTitle || historyBook.title} for student ${borrowerId}`);
                books.push({
                  ...historyBook,
                  ACCNO: historyBook.bookId || historyBook.ACCNO,
                  bookTitle: historyBook.bookTitle,
                  author: historyBook.author,
                  publisher: historyBook.publisher
                });
              } else {
                console.log(`⚠️ Duplicate book found, skipping: ${historyBook.bookTitle || historyBook.title}`);
              }
            });
          }
        } catch (historyError) {
          console.warn(`Could not fetch history for ${borrowerId}:`, historyError);
          
          // Try alternative history API call
          try {
            const altHistoryResponse = await axios.get(`http://localhost:5000/api/issues/history`, {
              params: {
                [`${borrowerType}Id`]: borrowerId,
                status: 'active',
                limit: 10
              }
            });
            
            console.log(`📚 Alternative history API response for ${borrowerId}:`, altHistoryResponse.data);
            
            if (altHistoryResponse.data.success && altHistoryResponse.data.data.records) {
              // 🔧 FIX: Double-check that records belong to this specific student in alternative call too
              const historyBooks = altHistoryResponse.data.data.records.filter(record => {
                const recordMatches = (
                  (record.status === 'issued' || record.status === 'renewed' || record.transactionType === 'renew') &&
                  (
                    (borrowerType === 'student' && record.studentId === borrowerId) ||
                    (borrowerType === 'faculty' && record.employeeId === borrowerId)
                  )
                );
                
                if (!recordMatches && record.studentId) {
                  console.log(`� Filtering out alt record for different student: ${record.studentId} (looking for ${borrowerId})`);
                }
                
                return recordMatches;
              });
              
              console.log(`�📚 Found ${historyBooks.length} books from alternative history for ${borrowerId} (after filtering)`);
              
              historyBooks.forEach(historyBook => {
                const existingBook = books.find(book => 
                  book.ACCNO === historyBook.bookId || 
                  book.ACCNO === historyBook.ACCNO ||
                  book.bookId === historyBook.bookId ||
                  book.bookTitle === historyBook.bookTitle ||
                  book.title === historyBook.bookTitle
                );
                if (!existingBook) {
                  console.log(`➕ Adding book from alt history: ${historyBook.bookTitle || historyBook.title} for student ${borrowerId}`);
                  books.push({
                    ...historyBook,
                    ACCNO: historyBook.bookId || historyBook.ACCNO,
                    bookTitle: historyBook.bookTitle,
                    author: historyBook.author,
                    publisher: historyBook.publisher
                  });
                } else {
                  console.log(`⚠️ Duplicate book found in alt history, skipping: ${historyBook.bookTitle || historyBook.title}`);
                }
              });
            }
          } catch (altHistoryError) {
            console.warn(`Alternative history API also failed for ${borrowerId}:`, altHistoryError.message);
          }
        }
      }

      console.log(`✅ Total issued books for ${borrowerId}: ${books.length}`);
      
      // Update state with real borrowed books - ALWAYS set the state for this specific student
      setBorrowedBooks(prev => {
        const newState = {
          ...prev,
          [borrowerId]: books // This will be an empty array if no books found
        };
        console.log(`📝 Updated borrowedBooks state for ${borrowerId}:`, {
          studentId: borrowerId,
          bookCount: books.length,
          books: books,
          oldState: prev[borrowerId] || [],
          newState: newState[borrowerId],
          fullState: newState,
          timestamp: new Date().toISOString()
        });
        return newState;
      });
      
    } catch (err) {
      console.error(`❌ Error checking books for ${borrowerType} ${borrowerId}:`, err);
      // Only log 404 errors as info since no books issued is expected
      if (err.response?.status === 404) {
        console.log(`No books currently issued to ${borrowerType} ${borrowerId}`);
      } else {
        console.error("Detailed error:", err.response?.data);
      }
      // ALWAYS set state even on error - set empty array for this specific student
      setBorrowedBooks(prev => {
        const newState = {
          ...prev,
          [borrowerId]: []
        };
        console.log(`📝 Updated borrowedBooks state (ERROR) for ${borrowerId}:`, {
          studentId: borrowerId,
          bookCount: 0,
          error: err.message,
          fullState: newState
        });
        return newState;
      });
    }
  };

  // Helper function to extract semester
  const extractSemester = (semesterData) => {
    if (!semesterData) return '';
    
    // If it's a direct number/string
    if (typeof semesterData === 'number' || typeof semesterData === 'string') {
      return semesterData.toString();
    }
    
    // If it's an object, try different properties
    if (typeof semesterData === 'object') {
      return semesterData.number || 
             semesterData.sem || 
             semesterData.semester || 
             semesterData.value || 
             '';
    }
    
    return '';
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('http://localhost:5000/api/students', {
        params: {
          page: 1,
          limit: 100
        }
      });

      console.log('API Response:', response.data);

      let studentsData;
      if (response.data.data && Array.isArray(response.data.data)) {
        studentsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        studentsData = response.data;
      } else if (response.data.students && Array.isArray(response.data.students)) {
        studentsData = response.data.students;
      } else {
        studentsData = [response.data];
      }

      // Debug: Log first student to see semester structure
      if (studentsData.length > 0) {
        console.log('Sample student data:', studentsData[0]);
        console.log('Semester field:', studentsData[0].semester);
      }

      if (!studentsData || studentsData.length === 0) {
        setError('No students found');
        setStudents([]);
        setLoading(false);
        return;
      }

      const formattedStudents = studentsData.map(student => {
        const extractValue = (obj, key) => {
          if (!obj) return '';
          
          // If obj is a string, return it directly
          if (typeof obj === 'string') return obj;
          
          const value = obj[key];
          if (typeof value === 'object' && value !== null) {
            return value.name || value.title || value.description || value.streamName || '';
          }
          return String(value || '');
        };

        const fullName = [
          student.firstName,
          student.middleName,
          student.lastName
        ].filter(Boolean).join(' ');

        // Enhanced semester extraction logic using helper function
        const semesterNumber = extractSemester(student.semester) || 
                              extractSemester(student.currentSemester) || 
                              extractSemester(student.sem) || 
                              '';
        
        const subjectCount = student.subjects?.length || 0;
        const backlogCount = student.backlogs?.length || 0;
        const semesterRecordsCount = student.semesterRecords?.length || 0;

        return {
          _id: student.id || student._id || '',
          studentId: student.studentId || '',
          name: fullName || 'Unknown Student',
          unicodeName: student.unicodeName || '',
          enrollmentNumber: student.enrollmentNumber || '',
          btNumber: student.enrollmentNumber || '',
          rollNo: student.enrollmentNumber || '',
          fatherName: student.fatherName || '',
          unicodeFatherName: student.unicodeFatherName || '',
          motherName: student.motherName || '',
          unicodeMotherName: student.unicodeMotherName || '',
          gender: student.gender || '',
          mobileNumber: student.mobileNumber || '',
          casteCategory: student.casteCategory || '',
          subCaste: student.subCaste || '',
          email: student.email || '',
          section: student.section || '',
          admissionType: student.admissionType || '',
          admissionThrough: student.admissionThrough || '',
          remark: student.remark || '',
          department: typeof student.department === 'string'
            ? student.department
            : extractValue(student.department, 'name') || 'Unknown Department',
          stream: typeof student.stream === 'string'
            ? student.stream
            : extractValue(student.stream, 'name') || 
              extractValue(student.stream, 'title') ||
              extractValue(student.stream, 'streamName') ||
              student.course ||
              student.branch ||
              'Unknown Stream',
          semester: semesterNumber,
          subjects: subjectCount,
          backlogs: backlogCount,
          semesterRecords: semesterRecordsCount,
          admissionDate: student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : '',
          createdAt: student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '',
          updatedAt: student.updatedAt ? new Date(student.updatedAt).toLocaleDateString() : ''
        };
      });

      setStudents(formattedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      if (error.response) {
        setError(`Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        setError('No response from server. Please check your internet connection.');
      } else {
        setError('Failed to fetch students. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Fetch students initially
  useEffect(() => {
    fetchStudents();
  }, []);

  // 🔁 After students are fetched, get books for each student
  useEffect(() => {
    const fetchAllBorrowedBooks = async () => {
      if (students.length > 0) {
        console.log('📚 Fetching borrowed books for', students.length, 'students');
        
        // DON'T clear the borrowedBooks state - let it accumulate per student
        // setBorrowedBooks({});
        
        // Fetch books for each student
        for (const student of students) {
          const studentId = student.studentId || student._id;
          if (studentId) {
            console.log('🔍 Fetching books for student:', {
              studentId: studentId, 
              name: student.name,
              enrollmentNumber: student.enrollmentNumber,
              rawStudent: student
            });
            try {
              await fetchBorrowedBooks(studentId, 'student');
              // Add a small delay between requests to prevent overwhelming the server
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`Error fetching books for student ${studentId}:`, error);
            }
          } else {
            console.warn('⚠️ Student has no valid ID:', student);
          }
        }
        
        console.log('✅ Finished fetching books for all students');
      }
    };

    fetchAllBorrowedBooks();
  }, [students]);

  // 🔄 Listen for book renewal and issue events to update specific student data
  useEffect(() => {
    const handleBookRenewal = (event) => {
      const { borrowerId, borrowerType, bookId, timestamp } = event.detail;
      console.log('📚 Book renewal event received in StudentList:', { borrowerId, borrowerType, bookId, timestamp });
      console.log('🔍 Current borrowedBooks state before refresh:', borrowedBooks);
      
      // Only update if it's a student renewal
      if (borrowerType === 'student') {
        // Re-fetch books for the specific student who renewed the book
        console.log(`🔄 About to refresh books for student ${borrowerId} after renewal`);
        fetchBorrowedBooks(borrowerId, 'student');
        console.log(`🔄 Refreshed books for student ${borrowerId} after renewal`);
      } else {
        console.log(`⚠️ Skipping refresh - borrowerType is ${borrowerType}, not student`);
      }
    };

    const handleBookIssue = (event) => {
      const { borrowerId, borrowerType, bookId, timestamp } = event.detail;
      console.log('📚 Book issue event received:', { borrowerId, borrowerType, bookId, timestamp });
      
      // Only update if it's a student issue
      if (borrowerType === 'student') {
        // Re-fetch books for the specific student who got the book
        fetchBorrowedBooks(borrowerId, 'student');
        console.log(`🔄 Refreshed books for student ${borrowerId} after issue`);
      }
    };

    const handleBookReturn = (event) => {
      const { borrowerId, borrowerType, bookId, timestamp } = event.detail;
      console.log('📚 Book return event received:', { borrowerId, borrowerType, bookId, timestamp });
      
      // Only update if it's a student return
      if (borrowerType === 'student') {
        // Re-fetch books for the specific student who returned the book
        fetchBorrowedBooks(borrowerId, 'student');
        console.log(`🔄 Refreshed books for student ${borrowerId} after return`);
      }
    };

    // Add event listeners for book renewals, issues, and returns
    window.addEventListener('bookRenewed', handleBookRenewal);
    window.addEventListener('bookIssued', handleBookIssue);
    window.addEventListener('bookReturned', handleBookReturn);

    // 🔍 DEBUG: Add test listener to verify events are working
    const testEventListener = (event) => {
      console.log('🚨 TEST: Any custom event received:', event.type, event.detail);
    };
    window.addEventListener('bookRenewed', testEventListener);
    window.addEventListener('bookIssued', testEventListener);
    window.addEventListener('bookReturned', testEventListener);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('bookRenewed', handleBookRenewal);
      window.removeEventListener('bookIssued', handleBookIssue);
      window.removeEventListener('bookReturned', handleBookReturn);
      window.removeEventListener('bookRenewed', testEventListener);
      window.removeEventListener('bookIssued', testEventListener);
      window.removeEventListener('bookReturned', testEventListener);
    };
  }, []); // Empty dependency array since we only want to set up the listener once

  const getStudentStats = () => {
    // 🔍 DEBUG: Log the complete borrowedBooks state to see what's being counted
    console.log('🚨 DEBUG: Complete borrowedBooks state:', borrowedBooks);
    
    let totalBorrowedBooks = 0;
    Object.entries(borrowedBooks).forEach(([studentId, books]) => {
      if (Array.isArray(books)) {
        console.log(`📊 Student ${studentId} has ${books.length} books:`, books.map(b => b.title || b.bookTitle || 'No title'));
        totalBorrowedBooks += books.length;
      }
    });
    
    console.log(`📊 Total calculated active books: ${totalBorrowedBooks}`);
    
    return {
      total: students.length,
      withBooks: Object.keys(borrowedBooks).filter(
        studentId => borrowedBooks[studentId] && borrowedBooks[studentId].length > 0
      ).length,
      byDepartment: students.reduce((acc, student) => {
        const dept = student.department || 'Unknown';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {}),
      totalBorrowedBooks
    };
  };

  const filteredStudents = students.filter(student => {
    if (!student) return false;
    const searchTermLower = searchTerm.toLowerCase();
    const studentName = String(student.name || '').toLowerCase();
    const studentBtNumber = String(student.studentId || '').toLowerCase();
    const studentRollNo = String(student.rollNo || '').toLowerCase();

    const matchesSearch =
      studentName.includes(searchTermLower) ||
      studentBtNumber.includes(searchTermLower) ||
      studentRollNo.includes(searchTermLower);

    const matchesDepartment = filterDepartment === 'all' || student.department === filterDepartment;

    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center justify-center w-full">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-indigo-400 mb-4"></div>
          <div className="h-8 w-64 bg-indigo-300 rounded mb-3"></div>
          <div className="h-4 w-40 bg-indigo-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md flex flex-col items-center">
          <h2 className="text-2xl font-bold text-red-700 mb-2">Error Loading Students</h2>
          <p className="text-gray-600 text-center">{error}</p>
          <button
            onClick={fetchStudents}
            className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 flex flex-col py-12 px-2 md:px-8 z-0 md:ml-72 overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
            Student Directory
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage and view all enrolled students and their details.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700">Total Students</h3>
            <p className="text-3xl font-bold text-indigo-600">{getStudentStats().total}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700">With Books</h3>
            <p className="text-3xl font-bold text-indigo-600">{getStudentStats().withBooks}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700">Departments</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {Object.keys(getStudentStats().byDepartment).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700">Active Books</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {getStudentStats().totalBorrowedBooks}
            </p>
          </div>
        </div>

        {/* Search and filter */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, BT number, or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Departments</option>
                {Object.keys(getStudentStats().byDepartment).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 text-gray-600">
          Showing {filteredStudents.length} of {students.length} students
        </div>

        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-purple-100 p-12 text-center">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Students Found</h3>
            <p className="text-gray-500">There are currently no students in the database.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-2 md:px-4 border text-xs md:text-base">Name</th>
                  <th className="py-2 px-2 md:px-4 border text-xs md:text-base">Student ID & Sem</th>
                  <th className="py-2 px-2 md:px-4 border text-xs md:text-base">Department</th>
                  <th className="py-2 px-2 md:px-4 border text-xs md:text-base">Contact</th>
                  <th className="py-2 px-2 md:px-4 border text-xs md:text-base">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="py-2 px-2 md:px-4 border max-w-xs">
                      <div className="font-medium truncate">{student.name || 'N/A'}</div>
                      <div className="text-xs md:text-sm text-gray-500">
                        {student.gender || 'N/A'} • {student.admissionType || 'N/A'}
                      </div>
                    </td>
                    <td className="py-2 px-2 md:px-4 border max-w-xs">
                      <div className="font-medium truncate">{student.studentId || student._id || 'N/A'}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <div className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full inline-block">
                          Sem {student.semester || 'N/A'}
                        </div>
                        <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full inline-block">
                          Enrollment: {student.enrollmentNumber || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 md:px-4 border max-w-xs">
                      <div className="font-medium truncate">{student.department || 'N/A'}</div>
                      <div className="text-xs md:text-sm text-gray-500">
                        {student.stream && student.stream !== 'Unknown Stream' 
                          ? student.stream 
                          : student.course || student.branch || 'N/A'}
                      </div>
                    </td>
                    <td className="py-2 px-2 md:px-4 border max-w-xs">
                      <div className="text-xs md:text-sm text-gray-600">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate">{student.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{student.mobileNumber || 'N/A'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2 md:px-4 border">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const studentInfo = {
                              type: 'student',
                              studentId: student.studentId || student._id,
                              name: student.name,
                              enrollmentNumber: student.enrollmentNumber,
                              semester: student.semester,
                              department: student.department,
                              stream: student.stream,
                              course: student.stream || student.course || 'General',
                              branch: student.branch,
                              email: student.email,
                              phone: student.mobileNumber
                            };
                            localStorage.setItem('viewStudentBooks', JSON.stringify({
                              student: studentInfo,
                              books: borrowedBooks[student.studentId || student._id] || []
                            }));
                            navigate('/student-books/' + (student.studentId || student._id));
                          }}
                          className="px-3 py-2 bg-indigo-100 text-indigo-700 text-sm rounded hover:bg-indigo-200 transition-colors flex items-center gap-2"
                          title="View Books"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Books ({(borrowedBooks[student.studentId || student._id] || []).length})
                        </button>
                        <button
                          onClick={() => {
                            const studentInfo = {
                              type: 'student',
                              studentId: student.studentId || student._id,
                              name: student.name,
                              enrollmentNumber: student.enrollmentNumber,
                              semester: student.semester,
                              department: student.department,
                              stream: student.stream,
                              course: student.stream || student.course || 'General',
                              branch: student.branch,
                              email: student.email,
                              phone: student.mobileNumber
                            };
                            // Store in localStorage as a fallback
                            localStorage.setItem('selectedBorrower', JSON.stringify(studentInfo));
                            // Use React Router's state for better state management
                            navigate('/book-actions', { 
                              state: { 
                                borrower: studentInfo
                              }
                            });
                          }}
                          className="px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors flex items-center gap-2"
                          title="Issue New Book"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Issue
                        </button>
                        <button
                          onClick={() => navigate('/student-details?id=' + student._id)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 rounded hover:bg-indigo-50"
                          title="View Student Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7.865-9.542 7.865-4.478 0-8.268-2.943-9.542-7z" />
                          </svg>
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
    </div>
  );
};

export default StudentList;
