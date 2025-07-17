import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FacultyList = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [borrowedBooks, setBorrowedBooks] = useState({});
  const navigate = useNavigate();

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/faculty');
      console.log('Faculty API Response:', response.data);

      let facultyData = [];
      
      // Handle different response formats
      if (response.data.success && response.data.data) {
        facultyData = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      } else if (Array.isArray(response.data)) {
        facultyData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        facultyData = [response.data];
      } else {
        console.error('Unexpected faculty data format:', response.data);
        setFaculties([]);
        setLoading(false);
        return;
      }

      console.log('Sample faculty data:', facultyData[0]);
      console.log('Total faculty members:', facultyData.length);
      
      // Debug department data
      console.log('Sample faculty object keys:', Object.keys(facultyData[0]));
      const departments = facultyData.map(f => f.department);
      console.log('All departments:', departments);
      console.log('Unique departments:', [...new Set(departments)]);
      
      // Check if department data might be in a different field
      const possibleDeptFields = ['department', 'Department', 'dept', 'facultyDepartment', 'stream', 'branch', 'designation'];
      possibleDeptFields.forEach(field => {
        const values = facultyData.map(f => f[field]).filter(v => v !== undefined);
        if (values.length > 0) {
          console.log(`Found data in field '${field}':`, [...new Set(values)]);
        }
      });

      // Check specific designation values to see if they contain department info
      const designations = facultyData.map(f => f.designation).filter(d => d);
      console.log('All designations:', designations);
      console.log('Unique designations:', [...new Set(designations)]);

      const formattedFaculties = facultyData.map(faculty => {
        // Parse the joining date safely
        let joiningDate = faculty.joiningDate || faculty.dateOfJoining || new Date().toISOString().split('T')[0];
        let formattedDate;
        try {
          formattedDate = new Date(joiningDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } catch (e) {
          console.error('Error formatting date:', joiningDate);
          formattedDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
        
        return {
          _id: faculty._id || '',
          employeeId: faculty.employeeId || '',
          firstName: faculty.firstName || '',
          middleName: faculty.middleName || '',
          lastName: faculty.lastName || '',
          name: [faculty.firstName, faculty.middleName, faculty.lastName].filter(Boolean).join(' ') || 'Unknown Faculty',
          department: faculty.department?.name || faculty.department || 'Unknown Department',
          designation: faculty.designation || 'Not Specified',
          email: faculty.email || '',
          mobile: faculty.mobile || '',
          status: faculty.status || 'Not Specified',
          joiningDate,
          formattedJoiningDate: formattedDate
        };
      });

      setFaculties(formattedFaculties);
      
      // Fetch real borrowed books for each faculty from MongoDB
      console.log('📚 Fetching real borrowed books for faculty members from database...');
      await fetchBorrowedBooksForAllFaculty(formattedFaculties);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching faculties:', error);
      setError(error.message);
      setFaculties([]);
      setLoading(false);
    }
  };

  // 📚 Function to fetch real borrowed books for all faculty from database
  const fetchBorrowedBooksForAllFaculty = async (facultyList) => {
    try {
      const newBorrowedBooks = {};
      
      // Fetch borrowed books for each faculty member
      for (const faculty of facultyList) {
        try {
          console.log(`🔍 Fetching books for faculty: ${faculty.employeeId}`);
          
          // First try the borrowed-books endpoint
          let allBooks = [];
          
          try {
            const borrowedResponse = await axios.get(`http://localhost:5000/api/issues/borrowed-books`, {
              params: {
                borrowerId: faculty.employeeId,
                borrowerType: 'faculty'
              }
            });

            if (borrowedResponse.data.success && borrowedResponse.data.data) {
              const borrowedBooks = Array.isArray(borrowedResponse.data.data) ? borrowedResponse.data.data : [];
              allBooks = [...borrowedBooks];
              console.log(`📚 Found ${borrowedBooks.length} books from borrowed-books API for ${faculty.employeeId}`);
            }
          } catch (borrowedError) {
            console.log(`ℹ️ borrowed-books API not available for ${faculty.employeeId}, using history only`);
          }

          // Also check history for additional/more recent transactions
          try {
            const historyResponse = await axios.get(`http://localhost:5000/api/issues/history`, {
              params: {
                employeeId: faculty.employeeId,
                borrowerType: 'faculty',
                page: 1,
                limit: 50
              }
            });

            if (historyResponse.data.success && historyResponse.data.data && historyResponse.data.data.records) {
              const historyTransactions = historyResponse.data.data.records;
              
              // Group transactions by book to find the latest state
              const bookMap = new Map();
              
              // Add existing books to map first
              allBooks.forEach(book => {
                const bookId = book.ACCNO || book.bookId;
                bookMap.set(bookId, {
                  ...book,
                  source: 'borrowed-books'
                });
              });
              
              // Process history transactions
              historyTransactions.forEach((transaction) => {
                const bookId = transaction.bookId || transaction.ACCNO;
                
                // Keep track of the latest transaction for each book
                if (!bookMap.has(bookId) || new Date(transaction.createdAt) > new Date(bookMap.get(bookId).createdAt || 0)) {
                  bookMap.set(bookId, {
                    ...transaction,
                    source: 'history'
                  });
                }
              });
              
              // Filter to only include books that are currently borrowed
              const activeBorrowedBooks = [];
              bookMap.forEach((latestTransaction, bookId) => {
                if (latestTransaction.transactionType !== 'return' && latestTransaction.status === 'active') {
                  activeBorrowedBooks.push({
                    _id: latestTransaction._id,
                    ACCNO: latestTransaction.bookId || latestTransaction.ACCNO,
                    bookTitle: latestTransaction.bookTitle,
                    author: latestTransaction.author || 'Unknown Author',
                    publisher: latestTransaction.publisher || 'Unknown Publisher',
                    issueDate: latestTransaction.issueDate,
                    dueDate: latestTransaction.dueDate,
                    status: latestTransaction.status,
                    employeeId: faculty.employeeId,
                    borrowerId: faculty.employeeId,
                    borrowerType: 'faculty',
                    transactionType: latestTransaction.transactionType,
                    source: latestTransaction.source
                  });
                }
              });
              
              newBorrowedBooks[faculty.employeeId] = activeBorrowedBooks;
              console.log(`📚 Final count: ${activeBorrowedBooks.length} books for faculty ${faculty.employeeId} (using combined approach)`);
              
            } else {
              // Fallback to borrowed-books data only
              newBorrowedBooks[faculty.employeeId] = allBooks.filter(book => book.status === 'active');
              console.log(`📚 Using borrowed-books only: ${newBorrowedBooks[faculty.employeeId].length} books for faculty ${faculty.employeeId}`);
            }
          } catch (historyError) {
            console.error(`❌ Error fetching history for faculty ${faculty.employeeId}:`, historyError);
            newBorrowedBooks[faculty.employeeId] = allBooks.filter(book => book.status === 'active');
          }
          
        } catch (error) {
          console.error(`❌ Error fetching books for faculty ${faculty.employeeId}:`, error);
          newBorrowedBooks[faculty.employeeId] = [];
        }
      }
      
      setBorrowedBooks(newBorrowedBooks);
      console.log('✅ Finished fetching borrowed books for all faculty');
      
    } catch (error) {
      console.error('❌ Error fetching borrowed books for faculty:', error);
    }
  };

  const generateMockBorrowedBooks = (employeeId) => {
    // Generate 0-3 random books for each faculty member
    const bookCount = Math.floor(Math.random() * 4);
    const mockBooks = [];

    const bookTitles = [
      'Introduction to Computer Science',
      'Data Structures and Algorithms',
      'Database Management Systems',
      'Operating Systems Concepts',
      'Software Engineering Principles',
      'Network Security Fundamentals',
      'Machine Learning Basics',
      'Web Development with React',
      'Python Programming Guide',
      'Java Enterprise Edition',
      'Digital Image Processing',
      'Artificial Intelligence',
      'Mobile App Development',
      'Cloud Computing Essentials',
      'Cybersecurity Handbook'
    ];

    const authors = [
      'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis',
      'Robert Wilson', 'Jessica Garcia', 'David Miller', 'Lisa Anderson',
      'James Taylor', 'Mary Martinez', 'Christopher Lee', 'Jennifer White'
    ];

    for (let i = 0; i < bookCount; i++) {
      const randomBook = bookTitles[Math.floor(Math.random() * bookTitles.length)];
      const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
      const issueDate = new Date();
      issueDate.setDate(issueDate.getDate() - Math.floor(Math.random() * 30));
      
      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + 14);

      mockBooks.push({
        ACCNO: `ACC${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        bookTitle: randomBook,
        author: randomAuthor,
        publisher: 'Academic Press',
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString(),
        status: 'active',
        employeeId: employeeId,
        borrowerId: employeeId,
        borrowerType: 'faculty'
      });
    }

    setBorrowedBooks(prev => ({
      ...prev,
      [employeeId]: mockBooks
    }));

    console.log(`� Generated ${mockBooks.length} mock books for faculty ${employeeId}`);
  };

  useEffect(() => {
    fetchFaculties(); // Use the main fetchFaculties function
  }, []);

  // Fetch books for faculty members when the list changes
  useEffect(() => {
    // Books are now generated during faculty fetching, so this effect is simplified
    if (faculties.length > 0) {
      console.log('✅ Faculty list loaded with', faculties.length, 'members');
    }
  }, [faculties]);

  const getFacultyStats = () => {
    const stats = {
      total: faculties.length,
      byDepartment: faculties.reduce((acc, faculty) => {
        const dept = faculty.department || 'Unknown Department';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {})
    };
    
    console.log('📊 Faculty stats:', stats);
    return stats;
  };

  // Add safety check to prevent the error
  const filteredFaculties = (faculties || []).filter(faculty => {
    const matchesSearch = (
      (faculty.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (faculty.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (faculty.designation?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const matchesDepartment = filterDepartment === 'all' || faculty.department === filterDepartment;

    return matchesSearch && matchesDepartment;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex flex-col items-center justify-center ml-72">
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
          <h2 className="text-2xl font-bold text-red-700 mb-2">Error Loading Faculty</h2>
          <p className="text-gray-600 text-center">{error}</p>
          <button
            onClick={fetchFaculties}
            className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 flex flex-col py-12 px-2 md:px-8 z-0 ml-72 overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-7xl">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
            Faculty Directory
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage and view all faculty members and their details.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700">Total Faculty</h3>
            <p className="text-3xl font-bold text-indigo-600">{getFacultyStats().total}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700">Departments</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {Object.keys(getFacultyStats().byDepartment).length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold text-gray-700">Active Faculty</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {faculties.filter(f => f.status === 'active').length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or designation..."
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
                {Object.keys(getFacultyStats().byDepartment).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 text-gray-600">
          Showing {filteredFaculties.length} of {faculties.length} faculty members
        </div>

        {filteredFaculties.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-purple-100 p-12 text-center">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Faculty Found</h3>
            <p className="text-gray-500">There are currently no faculty members in the database.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700">
              <div className="col-span-4">Name & Department</div>
              <div className="col-span-3">Contact</div>
              <div className="col-span-2">Designation</div>
              <div className="col-span-3">Actions</div>
            </div>

            {/* Faculty List */}
            <div className="divide-y divide-gray-200">
              {filteredFaculties.map((faculty) => (
                <div
                  key={faculty._id}
                  className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Name and Department */}
                  <div className="col-span-4">
                    <h3 className="font-medium text-gray-900">{faculty.name}</h3>
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                        {faculty.department}
                      </span>
                      <span className="text-xs text-gray-500">ID: {faculty.employeeId}</span>
                      <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Joined: {faculty.joiningDate ? new Date(faculty.joiningDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Not specified'}
                      </span>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="col-span-3">
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{faculty.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{faculty.mobile}</span>
                      </div>
                    </div>
                  </div>

                  {/* Designation */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm text-gray-600">{faculty.designation}</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex items-center gap-2">
                    <button
                      className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-semibold"
                      onClick={() => {
                        // Store faculty and books info for the books view page
                        localStorage.setItem('viewFacultyBooks', JSON.stringify({
                          faculty: {
                            employeeId: faculty.employeeId,
                            name: faculty.name,
                            department: faculty.department,
                            designation: faculty.designation,
                          },
                          books: borrowedBooks[faculty.employeeId] || []
                        }));
                        navigate('/faculty-books/' + faculty.employeeId);
                      }}
                    >
                      View Books ({(borrowedBooks[faculty.employeeId] || []).length})
                    </button>
                    <button
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold"
                      onClick={() => {
                        const borrowerData = {
                          employeeId: faculty.employeeId,
                          borrowerId: faculty.employeeId,
                          borrowerName: faculty.name,
                          name: faculty.name,
                          department: faculty.department || "",
                          designation: faculty.designation || "",
                          email: faculty.email || "",
                          mobile: faculty.mobile || "",
                          phone: faculty.mobile || "",
                          type: 'faculty',
                          borrowerType: 'faculty',
                          status: 'active'
                        };
                        // Store in localStorage as a fallback
                        localStorage.setItem('selectedFaculty', JSON.stringify(borrowerData));
                        localStorage.setItem('selectedBorrower', JSON.stringify(borrowerData));
                        // Use React Router's state for better state management
                        navigate('/book-actions', { 
                          state: { 
                            borrower: borrowerData
                          }
                        });
                      }}
                    >
                      Issue Book
                    </button>
                  </div>


                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyList;