import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BookDetails = () => {
  const { id: accno } = useParams(); // Rename id to accno to be clear
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        setLoading(true);
        // Get stored book data first
        const storedData = JSON.parse(localStorage.getItem('viewBookDetails') || '{}');
        console.log('Stored book data:', storedData);

        if (!accno) {
          throw new Error('No book identifier provided');
        }

        // Try to fetch book details with multiple endpoints
        let bookData = null;
        
        try {
          // First try by ACCNO
          const response = await axios.get(`http://localhost:5000/api/books/by-accno/${accno}`);
          bookData = response.data;
          console.log('Book found via by-accno endpoint:', bookData);
        } catch (err) {
          console.log('by-accno endpoint failed, trying alternatives...');
          try {
            // Try by ID endpoint
            const response = await axios.get(`http://localhost:5000/api/books/${accno}`);
            bookData = response.data;
            console.log('Book found via by-id endpoint:', bookData);
          } catch (err2) {
            console.log('by-id endpoint failed, trying search...');
            try {
              // Try search endpoint
              const response = await axios.get(`http://localhost:5000/api/books?search=${encodeURIComponent(accno)}`);
              const books = response.data.data || response.data.books || response.data;
              if (Array.isArray(books) && books.length > 0) {
                // Find exact match
                bookData = books.find(book => 
                  book.ACCNO === accno || 
                  book.accno === accno || 
                  book.id === accno ||
                  book._id === accno
                ) || books[0];
                console.log('Book found via search endpoint:', bookData);
              }
            } catch (err3) {
              console.log('search endpoint failed, trying all books...');
              try {
                // Last attempt - get all books and filter
                const response = await axios.get(`http://localhost:5000/api/books`);
                const allBooks = response.data.data || response.data.books || response.data;
                if (Array.isArray(allBooks)) {
                  bookData = allBooks.find(book => 
                    book.ACCNO === accno || 
                    book.accno === accno || 
                    book.id === accno ||
                    book._id === accno ||
                    book.ISBN === accno ||
                    book.isbn === accno
                  );
                  if (bookData) {
                    console.log('Book found via all books endpoint:', bookData);
                  }
                }
              } catch (err4) {
                console.log('All endpoints failed');
              }
            }
          }
        }
        
        if (bookData) {
          // Preserve all original data fields
          setBook({
            ...bookData,
            // Map fields while keeping originals, preferring standard names
            title: bookData.TITLENAME || bookData.title || bookData.bookTitle,
            author: bookData.AUTHOR || bookData.author,
            publisher: bookData['PUBLISHER NAME'] || bookData.publisher || bookData.PUBLISHER,
            publication_year: bookData['PUB.YEAR'] || bookData.publication_year || bookData.PUBYEAR,
            series_code: bookData.SERIESCODE || bookData.series_code || bookData['SERIES CODE'],
            call_number: bookData.CLASSNO || bookData.call_number || bookData.CLASS_NO,
            pages: bookData.PAGES || bookData.pages || bookData.PAGE_COUNT,
            subject: bookData['SUBJECT NAME'] || bookData['SUB SUBJECT NAME'] || bookData.subject || bookData.SUBJECT,
            status: bookData.STATUS || bookData.status,
            quantity: bookData.QUANTITY || bookData.quantity,
            available: bookData.AVAILABLE || bookData.available,
            issued: bookData.ISSUED || bookData.issued,
            invoice_number: bookData.INVOICENO || bookData.invoice_number,
            invoice_date: bookData.INVOICE_DATE || bookData.invoice_date,
            print_price: bookData.PRINTPRICE || bookData.print_price,
            purchase_price: bookData.PURPRICE || bookData.purchase_price,
            shelf: bookData.shelf || bookData.SHELF,
            section: bookData.section || bookData.SECTION,
            category: bookData.category || bookData.CATEGORY,
            city: bookData.CITY || bookData.city || bookData.PUBLICATION_CITY,
            vendor_city: bookData['VENDER CITY'] || bookData.vendor_city || bookData.vendorCity,
            acc_date: bookData.ACCDATE || bookData.acc_date || bookData.accessionDate,
            ref_cir: bookData.REFCIR || bookData.ref_cir,
            // Keep the borrower info from localStorage if it exists
            borrower: storedData.borrower,
            issueDate: storedData.issueDate,
            dueDate: storedData.dueDate,
            returnDate: storedData.returnDate
          });
        } else {
          // If backend fetch fails, fall back to localStorage data
          if (storedData && storedData.ACCNO === accno) {
            setBook(storedData);
          } else {
            setError('Book not found');
          }
        }
      } catch (error) {
        console.error('Error fetching book details:', error);
        // If API fails, try to show localStorage data
        const storedData = JSON.parse(localStorage.getItem('viewBookDetails') || '{}');
        console.log('Falling back to stored data:', storedData);
        
        if (storedData && (storedData.ACCNO === accno || storedData.bookId === accno || storedData._id === accno)) {
          setBook({
            ...storedData,
            // Map fields while keeping originals, using same logic as above
            title: storedData.TITLENAME || storedData.title || storedData.bookTitle,
            author: storedData.AUTHOR || storedData.author,
            publisher: storedData['PUBLISHER NAME'] || storedData.publisher || storedData.PUBLISHER,
            publication_year: storedData['PUB.YEAR'] || storedData.publication_year || storedData.PUBYEAR,
            series_code: storedData.SERIESCODE || storedData.series_code || storedData['SERIES CODE'],
            call_number: storedData.CLASSNO || storedData.call_number || storedData.CLASS_NO,
            pages: storedData.PAGES || storedData.pages || storedData.PAGE_COUNT,
            subject: storedData['SUB SUBJECT NAME'] || storedData.subject || storedData.SUBJECT,
            status: storedData.STATUS || storedData.status,
            quantity: storedData.QUANTITY || storedData.quantity,
            available: storedData.AVAILABLE || storedData.available,
            issued: storedData.ISSUED || storedData.issued,
            invoice_number: storedData.INVOICENO || storedData.invoice_number,
            invoice_date: storedData.INVOICE_DATE || storedData.invoice_date,
            print_price: storedData.PRINTPRICE || storedData.print_price,
            purchase_price: storedData.PURPRICE || storedData.purchase_price,
            shelf: storedData.shelf || storedData.SHELF,
            section: storedData.section || storedData.SECTION,
            category: storedData.category || storedData.CATEGORY,
            city: storedData.CITY || storedData.city || storedData.PUBLICATION_CITY
          });
        } else {
          setError('Could not load book details from server or local storage');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [accno]);

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

  if (!book) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md">
          <h2 className="text-2xl font-bold text-red-700 mb-2">Book Not Found</h2>
          <p className="text-gray-600 mb-4">The requested book could not be found.</p>
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
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{book.title || book.bookTitle}</h1>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Book Information
              </h2>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Title:</span>
                  <span className="ml-2 text-gray-600">{book.title || book.TITLENAME || book.bookTitle || 'Unknown Title'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Author:</span>
                  <span className="ml-2 text-gray-600">{book.author || book.AUTHOR || 'Unknown Author'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Accession Number:</span>
                  <span className="ml-2 text-gray-600">{book.ACCNO || book.accessionNumber || accno}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Publisher:</span>
                  <span className="ml-2 text-gray-600">{book.publisher || book['PUBLISHER NAME'] || book.PUBLISHER || 'Unknown Publisher'}</span>
                </div>
                {(book.city || book.CITY || book.PUBLICATION_CITY) && (
                  <div>
                    <span className="font-medium text-gray-700">Publication City:</span>
                    <span className="ml-2 text-gray-600">{book.city || book.CITY || book.PUBLICATION_CITY}</span>
                  </div>
                )}
                {(book.publication_year || book['PUB.YEAR'] || book.PUBYEAR) && (
                  <div>
                    <span className="font-medium text-gray-700">Publication Year:</span>
                    <span className="ml-2 text-gray-600">{book.publication_year || book['PUB.YEAR'] || book.PUBYEAR}</span>
                  </div>
                )}
                {(book.series_code || book.SERIESCODE || book['SERIES CODE']) && (
                  <div>
                    <span className="font-medium text-gray-700">Series Code:</span>
                    <span className="ml-2 text-gray-600">{book.series_code || book.SERIESCODE || book['SERIES CODE']}</span>
                  </div>
                )}
                {(book.call_number || book.CLASSNO || book.CLASS_NO) && (
                  <div>
                    <span className="font-medium text-gray-700">Class Number:</span>
                    <span className="ml-2 text-gray-600">{book.call_number || book.CLASSNO || book.CLASS_NO}</span>
                  </div>
                )}
                {(book.pages || book.PAGES || book.PAGE_COUNT) && (
                  <div>
                    <span className="font-medium text-gray-700">Pages:</span>
                    <span className="ml-2 text-gray-600">{book.pages || book.PAGES || book.PAGE_COUNT}</span>
                  </div>
                )}
                {(book.subject || book['SUBJECT NAME'] || book['SUB SUBJECT NAME'] || book.SUBJECT) && (
                  <div>
                    <span className="font-medium text-gray-700">Subject:</span>
                    <span className="ml-2 text-gray-600">{book.subject || book['SUBJECT NAME'] || book['SUB SUBJECT NAME'] || book.SUBJECT}</span>
                  </div>
                )}
                {(book.vendor_city || book['VENDER CITY'] || book.vendorCity) && (
                  <div>
                    <span className="font-medium text-gray-700">Vendor City:</span>
                    <span className="ml-2 text-gray-600">{book.vendor_city || book['VENDER CITY'] || book.vendorCity}</span>
                  </div>
                )}
                {(book.acc_date || book.ACCDATE || book.accessionDate) && (
                  <div>
                    <span className="font-medium text-gray-700">Accession Date:</span>
                    <span className="ml-2 text-gray-600">{
                      book.acc_date || book.ACCDATE || book.accessionDate ? 
                      new Date(book.acc_date || book.ACCDATE || book.accessionDate).toLocaleDateString() : 
                      ''
                    }</span>
                  </div>
                )}
                {(book.ref_cir || book.REFCIR) && (
                  <div>
                    <span className="font-medium text-gray-700">Reference Circulation:</span>
                    <span className="ml-2 text-gray-600">{book.ref_cir || book.REFCIR}</span>
                  </div>
                )}
                <div>
                  <span className="font-medium text-gray-700">Book Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                    book.status === 'PRESENT' || book.STATUS === 'PRESENT' ? 'bg-green-100 text-green-800' :
                    book.status === 'ISSUE' || book.STATUS === 'ISSUE' ? 'bg-blue-100 text-blue-800' :
                    book.status === 'LOST' || book.STATUS === 'LOST' ? 'bg-red-100 text-red-800' :
                    book.status === 'DAMAGED' || book.STATUS === 'DAMAGED' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>{book.status || book.STATUS || 'Available'}</span>
                </div>
                {(book.quantity || book.QUANTITY) && (
                  <div>
                    <span className="font-medium text-gray-700">Quantity:</span>
                    <span className="ml-2 text-gray-600">{book.quantity || book.QUANTITY}</span>
                  </div>
                )}
                {(book.available || book.AVAILABLE) && (
                  <div>
                    <span className="font-medium text-gray-700">Available:</span>
                    <span className="ml-2 text-gray-600">{book.available || book.AVAILABLE}</span>
                  </div>
                )}
                {(book.issued || book.ISSUED) && (
                  <div>
                    <span className="font-medium text-gray-700">Issued:</span>
                    <span className="ml-2 text-gray-600">{book.issued || book.ISSUED}</span>
                  </div>
                )}
                {(book.invoice_number || book.INVOICENO) && (
                  <div>
                    <span className="font-medium text-gray-700">Invoice Number:</span>
                    <span className="ml-2 text-gray-600">{book.invoice_number || book.INVOICENO}</span>
                  </div>
                )}
                {(book.invoice_date || book.INVOICE_DATE) && (
                  <div>
                    <span className="font-medium text-gray-700">Invoice Date:</span>
                    <span className="ml-2 text-gray-600">{
                      book.invoice_date || book.INVOICE_DATE ? 
                      new Date(book.invoice_date || book.INVOICE_DATE).toLocaleDateString() : 
                      ''
                    }</span>
                  </div>
                )}
                {(book.print_price || book.PRINTPRICE) && (
                  <div>
                    <span className="font-medium text-gray-700">Print Price:</span>
                    <span className="ml-2 text-gray-600">₹{book.print_price || book.PRINTPRICE}</span>
                  </div>
                )}
                {(book.purchase_price || book.PURPRICE) && (
                  <div>
                    <span className="font-medium text-gray-700">Purchase Price:</span>
                    <span className="ml-2 text-gray-600">₹{book.purchase_price || book.PURPRICE}</span>
                  </div>
                )}
                {(book.shelf || book.SHELF) && (
                  <div>
                    <span className="font-medium text-gray-700">Shelf:</span>
                    <span className="ml-2 text-gray-600">{book.shelf || book.SHELF}</span>
                  </div>
                )}
                {(book.section || book.SECTION) && (
                  <div>
                    <span className="font-medium text-gray-700">Section:</span>
                    <span className="ml-2 text-gray-600">{book.section || book.SECTION}</span>
                  </div>
                )}
                {(book.category || book.CATEGORY) && (
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">{book.category || book.CATEGORY}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Borrowing Details
              </h2>
              {book.borrower && (
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Borrower Name:</span>
                    <span className="ml-2 text-gray-600">{book.borrower.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Department:</span>
                    <span className="ml-2 text-gray-600">{book.borrower.department}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Semester:</span>
                    <span className="ml-2 text-gray-600">{book.borrower.semester}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Issue Date:</span>
                    <span className="ml-2 text-gray-600">
                      {book.issueDate ? new Date(book.issueDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Due Date:</span>
                    <span className="ml-2 text-gray-600">
                      {book.dueDate ? new Date(book.dueDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {book.returnDate && (
                    <div>
                      <span className="font-medium text-gray-700">Return Date:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(book.returnDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-sm ${
                      new Date(book.dueDate) < new Date() && !book.returnDate
                        ? 'bg-red-100 text-red-800'
                        : book.returnDate
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {new Date(book.dueDate) < new Date() && !book.returnDate
                        ? 'Overdue'
                        : book.returnDate
                          ? 'Returned'
                          : 'Active'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
