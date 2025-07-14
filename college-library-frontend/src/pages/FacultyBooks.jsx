import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const FacultyBooks = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [facultyData, setFacultyData] = useState(null);

  useEffect(() => {
    // Get faculty and books data from localStorage
    const storedData = localStorage.getItem('viewFacultyBooks');
    if (storedData) {
      setFacultyData(JSON.parse(storedData));
    }
  }, [employeeId]);

  if (!facultyData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              No faculty data found
            </h2>
          </div>
        </div>
      </div>
    );
  }

  const { faculty, books } = facultyData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8 md:ml-72">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Faculty Header */}
          <div className="bg-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Faculty Book Details</h2>
              <button
                onClick={() => navigate(-1)}
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Back
              </button>
            </div>
          </div>

          {/* Faculty Info */}
          <div className="px-6 py-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{faculty.name}</h3>
                <p className="text-gray-600">Employee ID: {faculty.employeeId}</p>
                <p className="text-gray-600">{faculty.designation}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600">{faculty.department}</p>
                <p className="text-gray-600">{faculty.email}</p>
                <p className="text-gray-600">{faculty.phone}</p>
              </div>
            </div>
          </div>

          {/* Books List */}
          <div className="px-6 py-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Borrowed Books ({books.length})
            </h3>
            <div className="grid gap-4">
              {books.map((book, index) => (
                <div
                  key={book.ACCNO || index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-medium text-indigo-600">
                        {book.bookTitle || book.TITLENAME}
                      </h4>
                      <p className="text-gray-600">ACCNO: {book.ACCNO}</p>
                      {book.author && (
                        <p className="text-gray-600">Author: {book.author}</p>
                      )}
                      {book.publisher && (
                        <p className="text-gray-600">Publisher: {book.publisher}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Issued: {new Date(book.issueDate).toLocaleDateString()}
                      </p>
                      {book.dueDate && (
                        <p className="text-sm text-red-600">
                          Due: {new Date(book.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        localStorage.setItem('viewBookDetails', JSON.stringify({
                          ...book,
                          borrower: faculty
                        }));
                        navigate('/book-details/' + book.ACCNO);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Book Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyBooks;
