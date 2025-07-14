import React, { useEffect, useState, useContext } from 'react';
import {
  BookOpen, Search, AlertCircle, Book, Download, Printer, Edit
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AuthContext } from '../context/AuthContext';
import html2canvas from 'html2canvas'; // Static import

// Note: Currently using mock data since backend book endpoints are not implemented
// TODO: Replace with real API calls when backend is ready
const API_URL = 'http://localhost:5000/api/books';

const BookList = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [error, setError] = useState(null);
  const [searchBy, setSearchBy] = useState('Title');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookSeries, setBookSeries] = useState('');
  const [activeTab, setActiveTab] = useState('book');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedBookForPrint, setSelectedBookForPrint] = useState(null);
  const [printCopies, setPrintCopies] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Fetch books when component mounts or filters change
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchBooks();
    }, 300); // Add a small delay to prevent too many requests

    return () => clearTimeout(delaySearch);
  }, [searchBy, bookSeries, activeTab]); // Remove searchTerm to prevent API calls while typing

  const fetchBooks = async () => {
    try {
      // Generate mock data based on the active tab and filters
      const generateMockBooks = (type, count) => {
        const titles = {
          book: [
            'Introduction to Computer Science', 'Data Structures and Algorithms', 'Database Management Systems',
            'Operating Systems Concepts', 'Software Engineering', 'Computer Networks', 'Artificial Intelligence',
            'Machine Learning Fundamentals', 'Web Development', 'Mobile App Development', 'Cybersecurity Basics',
            'Digital Image Processing', 'Computer Graphics', 'Human Computer Interaction', 'Software Testing',
            'Project Management', 'Systems Analysis and Design', 'Programming Languages', 'Compiler Design',
            'Theory of Computation', 'Advanced Mathematics', 'Engineering Physics', 'Engineering Chemistry',
            'Engineering Mechanics', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
            'Electronics and Communication', 'Information Technology', 'Business Management'
          ],
          journal: [
            'IEEE Computer Society', 'ACM Computing Surveys', 'Journal of Systems and Software',
            'Information and Software Technology', 'Computer Networks Journal', 'AI Research Journal',
            'Machine Learning Review', 'Software Engineering Journal', 'Database Systems Journal',
            'Computer Graphics and Applications', 'Cybersecurity Today', 'IT Management Quarterly',
            'Engineering Research Journal', 'Science and Technology Review', 'Academic Computing'
          ],
          ebooksource: [
            'Digital Library Collection', 'Online Programming Tutorials', 'E-Learning Resources',
            'Digital Reference Materials', 'Online Course Materials', 'Digital Archives',
            'Electronic Dissertations', 'Online Research Papers', 'Digital Textbooks',
            'Virtual Laboratory Manuals', 'Online Technical Documentation'
          ]
        };

        const authors = [
          'Dr. John Smith', 'Prof. Mary Johnson', 'Dr. Robert Brown', 'Prof. Sarah Davis',
          'Dr. Michael Wilson', 'Prof. Emily Garcia', 'Dr. David Martinez', 'Prof. Lisa Anderson',
          'Dr. James Taylor', 'Prof. Jennifer Thomas', 'Dr. Christopher Lee', 'Prof. Amanda White',
          'Dr. William Harris', 'Prof. Jessica Clark', 'Dr. Richard Lewis', 'Prof. Ashley Walker'
        ];

        const publishers = [
          'Pearson Education', 'McGraw-Hill', 'Cengage Learning', 'Wiley Publications',
          'Oxford University Press', 'Cambridge University Press', 'Springer', 'Elsevier',
          'Prentice Hall', 'Thomson Reuters', 'Academic Press', 'MIT Press'
        ];

        const cities = ['New York', 'London', 'Boston', 'Chicago', 'Delhi', 'Mumbai', 'Pune', 'Bangalore'];
        
        const seriesCodes = {
          book: ['BB', 'GR', 'LR', 'MBA'],
          journal: ['JOURNAL'],
          ebooksource: ['EB', 'DIGITAL']
        };

        const subjects = [
          'Computer Science', 'Information Technology', 'Software Engineering', 'Data Science',
          'Artificial Intelligence', 'Machine Learning', 'Web Development', 'Mobile Computing',
          'Network Security', 'Database Systems', 'Operating Systems', 'Computer Networks',
          'Mathematics', 'Physics', 'Chemistry', 'Mechanical Engineering', 'Electrical Engineering',
          'Civil Engineering', 'Electronics', 'Management', 'Business Studies'
        ];

        return Array.from({ length: count }, (_, i) => {
          const titleList = titles[type] || titles.book;
          const seriesCodeList = seriesCodes[type] || seriesCodes.book;
          
          return {
            _id: `${type}_${i + 1}`,
            bookId: `${type}_${i + 1}`,
            ACCNO: `${seriesCodeList[i % seriesCodeList.length]}/${(1000 + i).toString()}`,
            TITLENAME: titleList[i % titleList.length],
            AUTHOR: authors[i % authors.length],
            'PUBLISHER NAME': publishers[i % publishers.length],
            CITY: cities[i % cities.length],
            'PUB.YEAR': 2020 + (i % 5),
            PAGES: 200 + (i % 300),
            SERIESCODE: seriesCodeList[i % seriesCodeList.length],
            CLASSNO: `${(500 + (i % 100)).toString()}.${(i % 10)}`,
            'SUBJECT NAME': subjects[i % subjects.length],
            STATUS: i % 10 === 0 ? 'ISSUE' : 'PRESENT',
            PRINTPRICE: 500 + (i % 1000),
            PURPRICE: 450 + (i % 900),
            REFCIR: 'Yes',
            ACCDATE: new Date(2023, i % 12, (i % 28) + 1).toISOString().split('T')[0],
            INVOICENO: `INV${1000 + i}`,
            INVOICE_DATE: new Date(2023, i % 12, (i % 28) + 1).toISOString().split('T')[0],
            'VENDER CITY': cities[i % cities.length],
            QUANTITY: i % 15 === 0 ? 0 : Math.floor(Math.random() * 10) + 1,
            materialType: type
          };
        });
      };

      // Filter the mock data based on search criteria
      let mockBooks = [];
      const counts = { book: 150, journal: 45, ebooksource: 25 };
      
      mockBooks = generateMockBooks(activeTab, counts[activeTab] || 150);

      // Apply search filters
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        mockBooks = mockBooks.filter(book => {
          switch(searchBy) {
            case 'Title':
              return book.TITLENAME?.toLowerCase().includes(searchLower);
            case 'Author':
              return book.AUTHOR?.toLowerCase().includes(searchLower);
            case 'AccessionNo':
              return book.ACCNO?.toLowerCase().includes(searchLower);
            case 'Subject':
              return book['SUBJECT NAME']?.toLowerCase().includes(searchLower);
            default:
              return book.TITLENAME?.toLowerCase().includes(searchLower);
          }
        });
      }

      // Apply series filter
      if (bookSeries) {
        mockBooks = mockBooks.filter(book => book.SERIESCODE === bookSeries);
      }

      setBooks(mockBooks);
      setFilteredBooks(mockBooks);
      console.log(`Loaded ${mockBooks.length} mock ${activeTab} items`);
      
    } catch (err) {
      setError(`Failed to load books: ${err.message}. Using mock data for demonstration.`);
    }
  };

  const filterBooksByTitle = (booksArray, searchValue) => {
    if (!searchValue.trim()) return booksArray;
    
    const searchLower = searchValue.toLowerCase().trim();
    return booksArray.filter(book => 
      book.TITLENAME && book.TITLENAME.toLowerCase().includes(searchLower)
    );
  };

  // Add useEffect for client-side filtering
  useEffect(() => {
    if (books.length > 0 && searchTerm.trim()) {
      const filtered = filterBooksByTitle(books, searchTerm);
      setFilteredBooks(filtered);
    } else {
      setFilteredBooks(books);
    }
  }, [searchTerm, books]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  const getAvailabilityColor = (QUANTITY) => {
    if (QUANTITY === 0) return 'text-red-600 bg-red-100';
    if (QUANTITY < 3) return 'text-yellow-600 bg-yellow-100';
    return 'text-teal-600 bg-teal-100';
  };

  const validateForm = (book) => {
    const errors = {};
    if (!book.TITLENAME?.trim()) errors.TITLENAME = 'Title is required';
    if (!book.AUTHOR?.trim()) errors.AUTHOR = 'Author is required';
    if (!book['PUBLISHER NAME']?.trim()) errors['PUBLISHER NAME'] = 'Publisher is required';
    if (book.QUANTITY < 0) errors.QUANTITY = 'Quantity cannot be negative';
    return errors;
  };

  const handleEditBook = (book) => {
    if (!isAuthenticated) {
      setModalType('error');
      setModalMessage('Please log in to edit book details.');
      setShowModal(true);
      return;
    }
    setSelectedBook({
      ...book,
      TITLENAME: book.TITLENAME || '',
      AUTHOR: book.AUTHOR || '',
      'PUBLISHER NAME': book['PUBLISHER NAME'] || '',
      CITY: book.CITY || '',
      SERIESCODE: book.SERIESCODE || '',
      'SUBJECT NAME': book['SUBJECT NAME'] || '',
      QUANTITY: book.QUANTITY || 0,
      STATUS: book.STATUS || 'PRESENT',
      materialType: book.materialType || 'book'
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const updateBookDetails = async (bookId, updatedDetails) => {
    const errors = validateForm(updatedDetails);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      // Since backend doesn't exist, simulate the update locally
      console.log('Simulating book update:', bookId, updatedDetails);
      
      // Update the local state to reflect changes
      setBooks(prevBooks =>
        prevBooks.map(book =>
          book.bookId === bookId ? { ...book, ...updatedDetails } : book
        )
      );
      setFilteredBooks(prevFiltered =>
        prevFiltered.map(book =>
          book.bookId === bookId ? { ...book, ...updatedDetails } : book
        )
      );
      
      setShowEditModal(false);
      setModalType('success');
      setModalMessage('Book details updated successfully! (Note: This is a demo update using mock data)');
      setShowModal(true);
      
    } catch (error) {
      setModalType('error');
      setModalMessage(error.message || 'Failed to update book details.');
      setShowModal(true);
    }
  };

  const getMaterialTypeName = (type) => {
    const types = {
      book: 'Book',
      journal: 'Journal',
      ebooksource: 'EBookSource'
    };
    return types[type] || type;
  };

  const downloadBooksReport = () => {
    try {
      const reportData = filteredBooks.map(book => ({
        'Accession No.': book.ACCNO,
        Title: book.TITLENAME,
        Author: book.AUTHOR,
        Publisher: book['PUBLISHER NAME'],
        City: book.CITY,
        'Publication Year': book['PUB.YEAR'],
        Pages: book.PAGES,
        'Series Code': book.SERIESCODE,
        'Class No.': book.CLASSNO,
        Subject: book['SUBJECT NAME'],
        Status: book.STATUS,
        'Print Price': book.PRINTPRICE,
        'Purchase Price': book.PURPRICE,
        'Reference Circulation': book.REFCIR,
        'Accession Date': book.ACCDATE,
        'Invoice No.': book.INVOICENO,
        'Invoice Date': book.INVOICE_DATE,
        'Vendor City': book['VENDER CITY']
      }));

      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Books');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, 'books-report.xlsx');
    } catch (error) {
      setError('Failed to generate report.');
    }
  };

  const handlePrintClick = (book) => {
    if (!isAuthenticated) {
      setModalType('error');
      setModalMessage('Please log in to print barcodes.');
      setShowModal(true);
      return;
    }
    setSelectedBookForPrint(book);
    setShowPrintModal(true);
  };

  const generateCustomBarcodeHTML = (book) => {
    if (!book || !book.ACCNO) {
      return null;
    }

    // Generate a simple pseudo-barcode pattern (alternating black and white lines)
    const barcodeLines = Array.from({ length: 40 }, (_, i) => {
      const width = Math.random() * 2 + 1; // Random width between 1 and 3px to simulate CODE128
      const color = i % 2 === 0 ? 'black' : 'white';
      return `<div style="display: inline-block; width: ${width}px; height: 40px; background-color: ${color};"></div>`;
    }).join('');

    const collegeName = "Nagarjuna Institute of Engineering Technology and Management Nagpur";
    const seriesAndAccNo = `${book.SERIESCODE || 'GKEA'}/${book.ACCNO || '240'}`;
    const accNoDisplay = book.ACCNO || '519.5/RAV';

    return `
      <div style="text-align: center; font-family: Arial, sans-serif; padding: 10px; background-color: white; border: 1px solid #000;">
        <p style="margin: 0; font-size: 12px; font-weight: bold;">${accNoDisplay}</p>
        <p style="margin: 5px 0; font-size: 10px;">${collegeName}</p>
        <div style="margin: 5px 0;">${barcodeLines}</div>
        <p style="margin: 5px 0; font-size: 10px;">${seriesAndAccNo}</p>
      </div>
    `;
  };

  const downloadBarcode = (book) => {
    if (!isAuthenticated) {
      setModalType('error');
      setModalMessage('Please log in to download barcodes.');
      setShowModal(true);
      return;
    }
    if (!book || !book.ACCNO) {
      setModalType('error');
      setModalMessage('No book selected for downloading.');
      setShowModal(true);
      return;
    }

    const barcodeHTML = generateCustomBarcodeHTML(book);
    if (!barcodeHTML) {
      setModalType('error');
      setModalMessage('Failed to generate barcode.');
      setShowModal(true);
      return;
    }

    // Create a temporary div to render the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = barcodeHTML;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px'; // Move off-screen to avoid visual flicker
    document.body.appendChild(tempDiv);

    // Use html2canvas to render the HTML to a canvas
    html2canvas(tempDiv, { scale: 2 }) // Increase scale for better quality
      .then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        saveAs(imgData, `barcode-${book.ACCNO}.png`);
        document.body.removeChild(tempDiv);
      })
      .catch(err => {
        setModalType('error');
        setModalMessage('Failed to download barcode: ' + err.message);
        setShowModal(true);
        document.body.removeChild(tempDiv);
      });
  };

  const doPrintBarcode = () => {
    if (!isAuthenticated) {
      setModalType('error');
      setModalMessage('Please log in to print barcodes.');
      setShowModal(true);
      return;
    }
    if (!selectedBookForPrint || !selectedBookForPrint.ACCNO) {
      setModalType('error');
      setModalMessage('No book selected for printing.');
      setShowModal(true);
      return;
    }

    if (printCopies < 1) {
      setModalType('error');
      setModalMessage('Number of copies must be at least 1.');
      setShowModal(true);
      return;
    }

    const barcodeHTML = generateCustomBarcodeHTML(selectedBookForPrint);
    if (!barcodeHTML) {
      setModalType('error');
      setModalMessage('Failed to generate barcode.');
      setShowModal(true);
      return;
    }

    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              margin: 0;
            }
            .barcode-container {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              padding: 20px;
            }
            .barcode-item {
              text-align: center;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 10px;
              background-color: #ffffff;
            }
            @media print {
              body { margin: 0; }
              .barcode-container { gap: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            ${Array.from({ length: printCopies }).map(() => `
              <div class="barcode-item">
                ${barcodeHTML}
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    setShowPrintModal(false);
    setPrintCopies(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks(); // Trigger search immediately
  };

  const handleSearchReset = () => {
    setSearchTerm('');
    setSearchBy('Title');
    setBookSeries('');
    fetchBooks(); // Fetch all books
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchBooks();
    }
  };

  const handleSearchTermChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Reset search type to Title when user starts typing
    setSearchBy('Title');
  };

  const ErrorDisplay = ({ message }) => (
    <div className="fixed top-6 right-6 bg-red-500 text-white p-4 rounded-xl shadow-2xl flex items-center max-w-md w-full z-50 animate-in fade-in duration-300 ease-in-out">
      <AlertCircle size={24} className="text-white mr-3" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => setError(null)}
        className="ml-auto text-white hover:text-gray-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div className="fixed inset-0 min-h-screen bg-gradient-to-br flex flex-col py-12 px-2 md:px-8 z-0 overflow-y-auto overflow-x-hidden bg-gray-100">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 via-teal-50 to-indigo-100 opacity-50"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ml-72">
        <header className="mb-12">
          <div className="bg-gradient-to-r from-indigo-600 to-teal-600 text-white rounded-2xl p-8 shadow-lg">
            <h1 className="text-4xl md:text-5xl font-bold flex items-center space-x-3">
              <BookOpen size={40} className="text-teal-300" />
              <span>Book List For Students & Faculty</span>
            </h1>
          </div>
        </header>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/4 bg-white p-6 rounded-xl shadow-lg sticky top-0 h-fit">
            <div className="text-center">
              <img
                src="/nga.png"
                alt="Nagarjuna Institute of Engineering Technology and Management Logo"
                className="w-24 h-24 mx-auto mb-4 rounded-full object-cover"
              />
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Nagarjuna Institute of Engineering Technology and Management Nagpur
              </h2>
              <p className="text-sm text-gray-600">
                Village Satnavri, Amravati Road, Nagpur - 440023
              </p>
            </div>
          </div>

          <div className="md:w-3/4">
            <div className="flex border-b border-gray-200 mb-6">
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'book' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
                onClick={() => {
                  setActiveTab('book');
                  setSearchTerm('');
                  setSearchBy('Title');
                  setBookSeries('');
                }}
              >
                Books
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'journal' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
                onClick={() => {
                  setActiveTab('journal');
                  setSearchTerm('');
                  setSearchBy('Title');
                  setBookSeries('');
                }}
              >
                Journal
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'ebooksource' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-600'}`}
                onClick={() => {
                  setActiveTab('ebooksource');
                  setSearchTerm('');
                  setSearchBy('Title');
                  setBookSeries('');
                }}
              >
                EBookSource
              </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search By</label>
                  <select
                    value={searchBy}
                    onChange={(e) => setSearchBy(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Title">Title</option>
                    <option value="Author">Author</option>
                    <option value="AccessionNo">Accession No.</option>
                    <option value="Subject">Subject</option>
                  </select>
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Text *</label>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={handleSearchTermChange}
                    onKeyDown={handleKeyPress}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book Category</label>
                  <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option>Please Select</option>
                  </select>
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Book Series</label>
                  <select
                    value={bookSeries}
                    onChange={(e) => setBookSeries(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">All Series</option>
                    <option value="LR">LR</option>
                    <option value="GR">GR</option>
                    <option value="MBA">MBA</option>
                    <option value="BB">BB</option>
                    <option value="THESIS">Thesis</option>
                    <option value="JOURNAL">Journal</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <Search size={20} className="mr-2" />
                  Search
                </button>
                <button
                  onClick={handleSearchReset}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {isAuthenticated && searchTerm && filteredBooks.length > 0 && (
              <div className="mb-6 flex justify-end">
                <button
                  onClick={downloadBooksReport}
                  className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 flex items-center"
                >
                  <Download size={20} className="mr-2" />
                  Export to Excel
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {filteredBooks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 to-teal-600 text-white">
                        <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort('ACCNO')}>
                          Accession No. {getSortIcon('ACCNO')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort('TITLENAME')}>
                          Title {getSortIcon('TITLENAME')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort('AUTHOR')}>
                          Author {getSortIcon('AUTHOR')}
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Publisher</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Series Code</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Subject</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Material Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Quantity</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                        {isAuthenticated && (
                          <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredBooks.map((book) => (
                        <tr key={book._id} className="hover:bg-gray-50 transition-all duration-200">
                          <td className="px-6 py-4 text-sm text-gray-800 font-medium">{book.ACCNO}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">{book.TITLENAME}</div>
                            <div className="text-xs text-gray-500">Pages: {book.PAGES}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{book.AUTHOR}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">{book['PUBLISHER NAME']}</div>
                            <div className="text-xs text-gray-500">{book.CITY}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">{book.SERIESCODE}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{book['SUBJECT NAME']}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${book.materialType === 'book' ? 'bg-blue-200 text-blue-800' :
                              book.materialType === 'journal' ? 'bg-green-200 text-green-800' :
                                book.materialType === 'ebooksource' ? 'bg-indigo-200 text-indigo-800' :
                                  'bg-gray-200 text-gray-800'
                              }`}>
                              {getMaterialTypeName(book.materialType)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getAvailabilityColor(book.QUANTITY)}`}>
                              {book.QUANTITY || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${book.STATUS === 'PRESENT' ? 'bg-teal-200 text-teal-800' :
                              book.STATUS === 'ISSUE' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-red-200 text-red-800'
                              }`}>
                              {book.STATUS}
                            </span>
                          </td>
                          {isAuthenticated && (
                            <td className="px-6 py-4">
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handlePrintClick(book)}
                                  className="p-2 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                                  title="Print Barcode"
                                >
                                  <Printer size={24} />
                                </button>
                                <button
                                  onClick={() => downloadBarcode(book)}
                                  className="p-2 rounded-full text-teal-600 hover:bg-teal-100 transition-colors"
                                  title="Download Barcode"
                                >
                                  <Download size={24} />
                                </button>
                                <button
                                  onClick={() => handleEditBook(book)}
                                  className="p-2 rounded-full text-indigo-600 hover:bg-indigo-100 transition-colors"
                                  title="Edit Book Details"
                                >
                                  <Edit size={24} />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <BookOpen size={96} className="text-gray-200 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    No Items Found
                  </h3>
                  <p className="text-gray-500 text-sm max-w-md mx-auto">
                    {searchTerm
                      ? `No items match your search for "${searchTerm}".`
                      : 'No books available in the library.'}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSearchBy('Title');
                        setBookSeries('');
                        setBooks([]);
                        setFilteredBooks([]);
                      }}
                      className="mt-6 px-6 py-3 bg-indigo-100 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-200 transition-colors"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {showEditModal && isAuthenticated && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-300 ease-out">
            <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl backdrop-blur-md bg-opacity-90">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Edit Item Details</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={selectedBook?.TITLENAME || ''}
                    onChange={(e) => setSelectedBook({ ...selectedBook, TITLENAME: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                  />
                  {formErrors.TITLENAME && <p className="text-red-500 text-xs mt-1">{formErrors.TITLENAME}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input
                    type="text"
                    value={selectedBook?.AUTHOR || ''}
                    onChange={(e) => setSelectedBook({ ...selectedBook, AUTHOR: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                  />
                  {formErrors.AUTHOR && <p className="text-red-500 text-xs mt-1">{formErrors.AUTHOR}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Publisher</label>
                  <input
                    type="text"
                    value={selectedBook?.['PUBLISHER NAME'] || ''}
                    onChange={(e) => setSelectedBook({ ...selectedBook, 'PUBLISHER NAME': e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                  />
                  {formErrors['PUBLISHER NAME'] && <p className="text-red-500 text-xs mt-1">{formErrors['PUBLISHER NAME']}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={selectedBook?.CITY || ''}
                    onChange={(e) => setSelectedBook({ ...selectedBook, CITY: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Series Code</label>
                  <input
                    type="text"
                    value={selectedBook?.SERIESCODE || ''}
                    onChange={(e) => setSelectedBook({ ...selectedBook, SERIESCODE: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={selectedBook?.['SUBJECT NAME'] || ''}
                    onChange={(e) => setSelectedBook({ ...selectedBook, 'SUBJECT NAME': e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                    {selectedBook?.QUANTITY === 0 && (
                      <span className="text-red-600 text-xs font-normal ml-2">
                        (Out of Stock)
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={selectedBook?.QUANTITY ?? 0}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 0;
                        setSelectedBook({
                          ...selectedBook,
                          QUANTITY: newQuantity
                        });

                        // Clear the quantity error when user starts typing
                        if (formErrors.QUANTITY) {
                          setFormErrors({
                            ...formErrors,
                            QUANTITY: null
                          });
                        }
                      }}
                      disabled={selectedBook?.QUANTITY === 0}
                      className={`w-full px-4 py-2 bg-white border rounded-lg shadow-sm focus:ring-2 transition-all duration-300 ${selectedBook?.QUANTITY === 0
                          ? 'border-red-500 bg-red-50 text-red-700 cursor-not-allowed opacity-75'
                          : formErrors.QUANTITY
                            ? 'border-red-500 focus:ring-red-400 focus:border-red-500'
                            : 'border-gray-200 focus:ring-teal-500 focus:border-teal-500'
                        }`}
                      placeholder={selectedBook?.QUANTITY === 0 ? "Out of stock" : "Enter quantity"}
                    />

                    {/* Out of stock overlay icon */}
                    {selectedBook?.QUANTITY === 0 && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Show form error if any */}
                  {formErrors.QUANTITY && (
                    <p className="text-red-500 text-xs mt-1 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      {formErrors.QUANTITY}
                    </p>
                  )}

                  {/* Show warning if quantity is zero */}
                  {selectedBook?.QUANTITY === 0 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-700 text-xs font-medium flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        This {selectedBook?.TYPE === 'journal' ? 'journal' : 'book'} is currently out of stock!
                      </p>
                      <p className="text-red-600 text-xs mt-1">
                        Please contact the librarian to check availability or reserve this item.
                      </p>
                    </div>
                  )}

                  {/* Show helpful message when quantity is low but not zero */}
                  {selectedBook?.QUANTITY > 0 && selectedBook?.QUANTITY <= 5 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-yellow-700 text-xs font-medium flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Only {selectedBook?.QUANTITY} copies available - Limited stock!
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedBook?.STATUS || ''}
                    onChange={(e) => setSelectedBook({ ...selectedBook, STATUS: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ISSUE">Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material Type</label>
                  <select
                    value={selectedBook?.materialType || 'book'}
                    onChange={(e) => setSelectedBook({ ...selectedBook, materialType: e.target.value })}
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                  >
                    <option value="book">Book</option>
                    <option value="journal">Journal</option>
                    <option value="ebooksource">EBookSource</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateBookDetails(selectedBook.bookId, {
                    TITLENAME: selectedBook.TITLENAME,
                    AUTHOR: selectedBook.AUTHOR,
                    'PUBLISHER NAME': selectedBook['PUBLISHER NAME'],
                    CITY: selectedBook.CITY,
                    SERIESCODE: selectedBook.SERIESCODE,
                    'SUBJECT NAME': selectedBook['SUBJECT NAME'],
                    QUANTITY: selectedBook.QUANTITY,
                    STATUS: selectedBook.STATUS,
                    materialType: selectedBook.materialType
                  })}
                  className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all duration-300"
                >
                  Update Item
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-300 ease-out">
            <div className={`bg-white rounded-2xl max-w-lg w-full p-8 shadow-5xl backdrop-blur-md bg-opacity-90 border-t-4 ${modalType === 'success' ? 'border-teal-500' : 'border-red-600'}`}>
              <h3 className={`text-xl font-bold mb-3 ${modalType === 'success' ? 'text-teal-600' : 'text-red-600'}`}>
                {modalType === 'success' ? 'Success' : 'Error'}
              </h3>
              <p className="text-gray-700 text-sm">{modalMessage}</p>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showPrintModal && isAuthenticated && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-300 ease-out">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl backdrop-blur-md bg-opacity-90">
              <h3 className="text-xl font-bold text-gray-800 mb-3">Print Barcode</h3>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Copies</label>
                <input
                  type="number"
                  min="1"
                  value={printCopies}
                  onChange={(e) => setPrintCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowPrintModal(false);
                    setPrintCopies(1);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={doPrintBarcode}
                  className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 flex items-center transition-all duration-300"
                >
                  <Printer size={20} className="mr-2" />
                  Print
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookList;