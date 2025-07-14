import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Note: Uses real student data from StudentManagement.js when available
// Falls back to fetching individual student data if not passed via localStorage

const StudentBooks = () => {
  const { id: studentId } = useParams();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentBooks = async () => {
      try {
        setLoading(true);
        setError(null);

        // First try to get data from localStorage (passed from StudentList)
        const storedData = JSON.parse(localStorage.getItem('viewStudentBooks') || '{}');
        
        if (storedData.student && storedData.books) {
          console.log('Using stored student data:', storedData.student);
          setStudentData(storedData);
        } else {
          // If not in localStorage, try to fetch student data from API
          console.log('Fetching student data for ID:', studentId);
          
          try {
            const response = await axios.get(`http://localhost:5000/api/students`);
            const students = Array.isArray(response.data) ? response.data : [];
            
            // Find the specific student
            const student = students.find(s => s.studentId === studentId || s._id === studentId);
            
            if (student) {
              // Format student data
              const formattedStudent = {
                studentId: student.studentId || studentId,
                name: [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' '),
                department: typeof student.department === 'string' ? student.department : student.department?.name || 'Unknown Department',
                stream: typeof student.stream === 'string' ? student.stream : student.stream?.name || 'Unknown Stream',
                semester: student.semester?.name || student.semester || 'Unknown',
                email: student.email || 'N/A',
                phone: student.mobileNumber || 'N/A',
                enrollmentNumber: student.enrollmentNumber,
                gender: student.gender,
                admissionType: student.admissionType
              };
              
              // Generate mock books for this student (since book system isn't implemented yet)
              const mockBooks = generateMockBooks(student.studentId || studentId);
              
              setStudentData({
                student: formattedStudent,
                books: mockBooks
              });
              
              console.log('Found student:', formattedStudent);
            } else {
              throw new Error('Student not found');
            }
          } catch (apiError) {
            console.error('Error fetching from API:', apiError);
            
            // Fallback to basic mock data
            const fallbackStudent = {
              studentId: studentId,
              name: 'Student ' + studentId,
              department: 'Unknown Department',
              stream: 'Unknown Stream', 
              semester: 'Unknown',
              email: 'N/A',
              phone: 'N/A'
            };
            
            setStudentData({
              student: fallbackStudent,
              books: generateMockBooks(studentId)
            });
            
            console.log('Using fallback student data');
          }
        }
      } catch (error) {
        console.error('Error in fetchStudentBooks:', error);
        setError('Failed to load student books. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    // Helper function to generate mock books
    const generateMockBooks = (studentId) => {
      const bookTitles = [
        'Introduction to Computer Science',
        'Data Structures and Algorithms',
        'Database Management Systems',
        'Operating Systems Concepts',
        'Software Engineering',
        'Digital Electronics',
        'Engineering Mechanics',
        'Thermodynamics'
      ];
      
      const randomCount = Math.floor(Math.random() * 3); // 0-2 books
      const books = [];
      
      for (let i = 0; i < randomCount; i++) {
        books.push({
          _id: `book_${i}_${studentId}`,
          ACCNO: `BB/${Math.floor(Math.random() * 9000) + 1000}`,
          TITLENAME: bookTitles[Math.floor(Math.random() * bookTitles.length)],
          bookTitle: bookTitles[Math.floor(Math.random() * bookTitles.length)],
          title: bookTitles[Math.floor(Math.random() * bookTitles.length)],
          issueDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'active',
          author: 'Academic Author',
          publisher: 'Academic Press'
        });
      }
      
      return books;
    };

    fetchStudentBooks();
  }, [studentId]);

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
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md">
          <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!studentData || !studentData.student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md">
          <h2 className="text-2xl font-bold text-red-700 mb-2">Student Not Found</h2>
          <p className="text-gray-600 mb-4">Could not find the student's information.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 flex flex-col py-12 px-2 md:px-8 z-0 md:ml-72 overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{studentData.student.name}</h1>
              <div className="text-gray-600">
                <p>Department: {studentData.student.department}</p>
                <p>Semester: {studentData.student.semester}</p>
                <p>Email: {studentData.student.email}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Borrowed Books</h2>
            {studentData.books.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No books currently borrowed</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {studentData.books.map((book) => {
                  const status = new Date(book.dueDate) < new Date() && !book.returnDate
                    ? 'Overdue'
                    : book.returnDate
                      ? 'Returned'
                      : 'Active';
                      
                  const statusClass = status === 'Overdue'
                    ? 'bg-red-100 text-red-800'
                    : status === 'Returned'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800';

                  return (
                    <div key={book._id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-800">{book.title || book.TITLENAME || book.bookTitle}</h3>
                          <p className="text-sm text-gray-600">ACCNO: {book.ACCNO || 'N/A'}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-sm ${statusClass}`}>
                          {status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Issue Date:</span>{' '}
                          {book.issueDate ? new Date(book.issueDate).toLocaleDateString() : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Due Date:</span>{' '}
                          {book.dueDate ? new Date(book.dueDate).toLocaleDateString() : 'N/A'}
                        </div>
                        {book.returnDate && (
                          <div>
                            <span className="font-medium">Return Date:</span>{' '}
                            {new Date(book.returnDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <button
                          onClick={() => {
                            localStorage.setItem('viewBookDetails', JSON.stringify({
                              ...book,
                              borrower: studentData.student
                            }));
                            navigate('/book-details/' + (book.ACCNO || book.bookId || book._id));
                          }}
                          className="w-full px-3 py-2 bg-indigo-100 text-indigo-700 text-sm rounded-lg hover:bg-indigo-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Book Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentBooks;
