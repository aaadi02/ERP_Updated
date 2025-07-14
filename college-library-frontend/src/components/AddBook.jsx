import React, { useState, useRef, useEffect } from 'react';
import Barcode from 'react-barcode';
import { Book, User, Bookmark, Package, CheckCircle, XCircle, X, Download, MapPin, Package2, BookOpen, Printer, Calendar, FileText, IndianRupee, FileDown } from 'lucide-react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const AddBook = ({ initialData }) => {
  const [formData, setFormData] = useState({
    ACCDATE: initialData?.ACCDATE || '',
    STATUS: initialData?.STATUS || 'PRESENT',
    ACCNO: initialData?.ACCNO || '',
    SERIESCODE: initialData?.SERIESCODE || '',
    CLASSNO: initialData?.CLASSNO || '',
    AUTHOR: initialData?.AUTHOR || '',
    TITLENAME: initialData?.TITLENAME || '',
    "PUBLISHER NAME": initialData?.["PUBLISHER NAME"] || '',
    CITY: initialData?.CITY || '',
    "PUB.YEAR": initialData?.["PUB.YEAR"] || '',
    PAGES: initialData?.PAGES || '',
    "VENDER CITY": initialData?.["VENDER CITY"] || '',
    INVOICENO: initialData?.INVOICENO || '',
    INVOICE_DATE: initialData?.INVOICE_DATE || '',
    "SUB.Subject NAME": initialData?.["SUB.Subject NAME"] || '',
    PRINTPRICE: initialData?.PRINTPRICE || '',
    PURPRICE: initialData?.PURPRICE || '',
    REFCIR: initialData?.REFCIR || '',
    QUANTITY: initialData?.QUANTITY || 1,
     materialType: initialData?.materialType || ''
  });

  const [barcodes, setBarcodes] = useState([]);

  const materialTypes = [
    { id: 'book', name: 'Book' },
    { id: 'magazine', name: 'Magazine' },
    { id: 'journal', name: 'Journal' },
    { id: 'thesis', name: 'Thesis' },
    { id: 'report', name: 'Report' },
    { id: 'research', name: 'Research Paper' },
    { id: 'newspaper', name: 'Newspaper' }
  ];

  const seriesCodes = [
    { id: 'LR', name: 'LR' },
    { id: 'GR', name: 'GR' },
    { id: 'MBA', name: 'MBA' },
    { id: 'BB', name: 'BB' },
    { id: 'JOURNAL', name: 'JOURNAL' },
    { id: 'THESIS', name: 'THESIS' }
  ];

  const [shelves] = useState([
    { id: 'A', name: 'Shelf A', sections: ['1', '2', '3'] },
    { id: 'B', name: 'Shelf B', sections: ['1', '2', '3'] },
    { id: 'C', name: 'Shelf C', sections: ['1', '2', '3'] }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalMessage, setModalMessage] = useState('');
  const barcodeRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      handleProvidedBookData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      ACCDATE: '',
      STATUS: 'PRESENT',
      ACCNO: '',
      SERIESCODE: '',
      CLASSNO: '',
      AUTHOR: '',
      TITLENAME: '',
      "PUBLISHER NAME": '',
      CITY: '',
      "PUB.YEAR": '',
      PAGES: '',
      "VENDER CITY": '',
      INVOICENO: '',
      INVOICE_DATE: '',
      "SUB.Subject NAME": '',
      PRINTPRICE: '',
      PURPRICE: '',
      REFCIR: '',
      QUANTITY: 1,
      materialType: ''
    });
  };

  const validateForm = () => {
    if (!formData.TITLENAME.trim()) {
      setModalType('error');
      setModalMessage('Please enter a title');
      setShowModal(true);
      return false;
    }
    
    if (!formData.AUTHOR.trim()) {
      setModalType('error');
      setModalMessage('Please enter an author name');
      setShowModal(true);
      return false;
    }

    if (!formData.materialType) {
      setModalType('error');
      setModalMessage('Please select a material type');
      setShowModal(true);
      return false;
    }
    
    if (isNaN(formData.QUANTITY) || formData.QUANTITY < 1) {
      setModalType('error');
      setModalMessage('QUANTITY must be a valid number and at least 1');
      setShowModal(true);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      const bookData = {
        ACCDATE: formData.ACCDATE,
      STATUS: formData.STATUS,
      ACCNO: formData.ACCNO,
      SERIESCODE: formData.SERIESCODE,
      CLASSNO: formData.CLASSNO,
      AUTHOR: formData.AUTHOR,
      TITLENAME: formData.TITLENAME,
      "PUBLISHER NAME": formData["PUBLISHER NAME"],
      CITY: formData.CITY,
      "PUB.YEAR": formData["PUB.YEAR"],
      PAGES: formData.PAGES,
      "VENDER CITY": formData["VENDER CITY"],
      INVOICENO: formData.INVOICENO,
      INVOICE_DATE: formData.INVOICE_DATE,
      "SUB.Subject NAME": formData["SUB.Subject NAME"],
      PRINTPRICE: formData.PRINTPRICE,
      PURPRICE: formData.PURPRICE,
      REFCIR: formData.REFCIR,
      QUANTITY: parseInt(formData.QUANTITY),
      materialType: formData.materialType
      };

      console.log('Submitting book data:', bookData);

      const response = await axios.post('http://localhost:5000/api/books', bookData);
      
      if (response.data) {
        setModalType('success');
        setModalMessage('Book added successfully!');
        setShowModal(true);
        resetForm();
      }
    } catch (error) {
      console.error('Error adding book:', error);
      setModalType('error');
      setModalMessage(error.response?.data?.message || 'Error adding book');
      setShowModal(true);
    }
  };

  const handleProvidedBookData = async (bookData) => {
    try {
      const formattedData = {
        ACCDATE: bookData.ACCDATE,
        STATUS: bookData.STATUS,
        ACCNO: bookData.ACCNO,
        SERIESCODE: bookData.SERIESCODE,
        CLASSNO: bookData.CLASSNO,
        AUTHOR: bookData.AUTHOR,
        TITLENAME: bookData.TITLENAME,
        "PUBLISHER NAME": bookData["PUBLISHER NAME"],
        CITY: bookData.CITY,
        "PUB.YEAR": bookData["PUB.YEAR"],
        PAGES: bookData.PAGES,
        "VENDER CITY": bookData["VENDER CITY"],
        INVOICENO: bookData.INVOICENO,
        INVOICE_DATE: bookData.INVOICE_DATE,
        "SUB.Subject NAME": bookData["SUB.Subject NAME"],
        PRINTPRICE: bookData.PRINTPRICE,
        PURPRICE: bookData.PURPRICE,
        REFCIR: bookData.REFCIR
      };

      const response = await axios.post('http://localhost:5000/api/books', formattedData);
      
      if (response.data) {
        setModalType('success');
        setModalMessage('Book added successfully!');
        setShowModal(true);
      }
    } catch (error) {
      setModalType('error');
      setModalMessage(error.response?.data?.message || 'Error adding book');
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const downloadBarcodes = () => {
    barcodes.forEach((barcode, index) => {
      const canvas = document.querySelector(`#barcode-${barcode.id} canvas`);
      if (canvas) {
        try {
          const pngUrl = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `${barcode.title}-copy-${barcode.copyNumber}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        } catch (error) {
          console.error("Error downloading barcode:", error);
        }
      }
    });
  };

  const printBarcode = () => {
    const printWindow = window.open('', '', 'width=800,height=800');
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            body { 
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            .barcode-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              padding: 20px;
            }
            .barcode-item {
              border: 1px solid #e5e7eb;
              padding: 15px;
              page-break-inside: avoid;
              text-align: center;
              border-radius: 8px;
            }
            .book-info {
              margin-bottom: 10px;
            }
            .book-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .book-author {
              font-size: 12px;
              color: #666;
              margin-bottom: 4px;
            }
            .copy-number {
              font-size: 11px;
              color: #888;
            }
            @media print {
              .barcode-grid {
                gap: 15px;
              }
              .barcode-item {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-grid">
            ${barcodes.map(barcode => `
              <div class="barcode-item">
                <div class="book-info">
                  <div class="book-title">${barcode.title}</div>
                  <div class="book-author">By: ${barcode.author}</div>
                  <div class="copy-number">Copy ${barcode.copyNumber}</div>
                </div>
                <div id="barcode-${barcode.id}"></div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportBookDetails = () => {
    try {
      const headers = [
        'Book ID',
        'Title',
        'Author',
        'ISBN',
        'Publisher',
        'Material Type',
        'Shelf',
        'Section',
        'Copy Number',
        'Vendor',
        'Purchase Date',
        'Invoice Number',
        'Price',
        'Payment Method',
        'Payment Status'
      ].join(',');

      const rows = barcodes.map(barcode => {
        const bookData = {
          bookId: barcode.id,
          title: barcode.title,
          author: barcode.author,
          isbn: formData.ACCNO,
          publisher: formData["PUBLISHER NAME"],
          materialType: formData.materialType,
          shelf: formData.SERIESCODE,
          section: formData.CLASSNO,
          copyNumber: barcode.copyNumber,
          vendor: formData["VENDER CITY"],
          purchaseDate: formData.INVOICE_DATE,
          invoiceNumber: formData.INVOICENO,
          price: formData.PURPRICE,
          paymentMethod: formData.paymentMethod,
          paymentStatus: formData.paymentStatus
        };

        return Object.values(bookData).map(value => 
          typeof value === 'string' ? `"${value}"` : value
        ).join(',');
      });

      const csvContent = [headers, ...rows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `book_details_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting book details:', err);
      setModalType('error');
      setModalMessage('Failed to export book details');
      setShowModal(true);
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-gradient-to-br flex flex-col py-12 px-2 md:px-8 z-0 ml-72 overflow-y-auto overflow-x-hidden from-blue-100 to-indigo-200">
      <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-5xl border border-blue-100">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-600 text-white p-3 rounded-full">
            <Book size={24} />
          </div>
          <h2 className="text-3xl font-bold ml-3 text-blue-800">Add Book</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                <Book size={18} />
              </div>
              <input
                name="TITLENAME"
                placeholder="Book Title"
                value={formData.TITLENAME}
                onChange={handleChange}
                className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                <User size={18} />
              </div>
              <input
                name="AUTHOR"
                placeholder="Author Name"
                value={formData.AUTHOR}
                onChange={handleChange}
                className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                <Package2 size={18} />
              </div>
              <input
                name="PUBLISHER NAME"
                placeholder="Publisher Name"
                value={formData["PUBLISHER NAME"]}
                onChange={handleChange}
                className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                <Bookmark size={18} />
              </div>
              <input
                name="ACCNO"
                placeholder="Accession Number"
                value={formData.ACCNO}
                onChange={handleChange}
                className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                <BookOpen size={18} />
              </div>
              <select
                name="materialType"
                value={formData.materialType}
                onChange={handleChange}
                className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                required
              >
                <option value="">Select Material Type</option>
                {materialTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                <Package size={18} />
              </div>
              <input
                name="QUANTITY"
                type="number"
                placeholder="Quantity"
                value={formData.QUANTITY}
                onChange={handleChange}
                className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                required
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                <MapPin size={18} />
              </div>
              <select
                name="SERIESCODE"
                value={formData.SERIESCODE}
                onChange={handleChange}
                className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                required
              >
                <option value="">Select Series Code</option>
                {seriesCodes.map(code => (
                  <option key={code.id} value={code.id}>
                    {code.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                <MapPin size={18} />
              </div>
              <input
                name="CLASSNO"
                placeholder="Class Number"
                value={formData.CLASSNO}
                onChange={handleChange}
                className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                required
              />
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                  <Calendar size={18} />
                </div>
                <input
                  type="date"
                  name="ACCDATE"
                  value={formData.ACCDATE}
                  onChange={handleChange}
                  className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                  <Calendar size={18} />
                </div>
                <input
                  type="date"
                  name="INVOICE_DATE"
                  value={formData.INVOICE_DATE}
                  onChange={handleChange}
                  className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                  <FileText size={18} />
                </div>
                <input
                  name="INVOICENO"
                  placeholder="Invoice Number"
                  value={formData.INVOICENO}
                  onChange={handleChange}
                  className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                  <IndianRupee size={18} />
                </div>
                <input
                  type="number"
                  name="PRINTPRICE"
                  placeholder="Print Price"
                  value={formData.PRINTPRICE}
                  onChange={handleChange}
                  className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                  <IndianRupee size={18} />
                </div>
                <input
                  type="number"
                  name="PURPRICE"
                  placeholder="Purchase Price"
                  value={formData.PURPRICE}
                  onChange={handleChange}
                  className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                  <Package2 size={18} />
                </div>
                <input
                  name="VENDER CITY"
                  placeholder="Vendor City"
                  value={formData["VENDER CITY"]}
                  onChange={handleChange}
                  className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                  <BookOpen size={18} />
                </div>
                <input
                  name="SUB.Subject NAME"
                  placeholder="Subject Name"
                  value={formData["SUB.Subject NAME"]}
                  onChange={handleChange}
                  className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                  <FileText size={18} />
                </div>
                <input
                  name="PAGES"
                  placeholder="Number of Pages"
                  value={formData.PAGES}
                  onChange={handleChange}
                  className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                  <BookOpen size={18} />
                </div>
                <input
                  name="PUB.YEAR"
                  placeholder="Publication Year"
                  value={formData["PUB.YEAR"]}
                  onChange={handleChange}
                  className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                  <MapPin size={18} />
                </div>
                <input
                  name="CITY"
                  placeholder="City"
                  value={formData.CITY}
                  onChange={handleChange}
                  className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600">
                  <BookOpen size={18} />
                </div>
                <input
                  name="REFCIR"
                  placeholder="Reference Circulation"
                  value={formData.REFCIR}
                  onChange={handleChange}
                  className="pl-10 border border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 w-full transition duration-200"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg w-full shadow-md transition duration-200 flex justify-center items-center space-x-2"
          >
            <Book size={20} />
            <span>Add Book</span>
          </button>
        </form>

        <p className="text-gray-500 text-center mt-6 text-sm">
          All books will be added to your library collection
        </p>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                {modalType === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 mr-3" />
                )}
                <h3 className="text-lg font-medium text-gray-900">
                  {modalType === 'success' ? 'Success' : 'Error'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-2">
              <p className="text-gray-600">
                {modalMessage}
              </p>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={closeModal}
                className={`w-full py-2 px-4 rounded-md font-medium text-white ${modalType === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 ${modalType === 'success' ? 'focus:ring-green-500' : 'focus:ring-blue-500'
                  } transition-colors`}
              >
                {modalType === 'success' ? 'Continue' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      )}

      {barcodes.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Generated Barcodes</h3>
            <div className="space-y-6">
              {barcodes.map((barcode) => (
                <div key={barcode.id} className="p-4 border rounded-lg">
                  <div id={`barcode-${barcode.id}`} className="flex flex-col items-center">
                    <div className="text-center mb-2">
                      <p className="font-bold">{barcode.title}</p>
                      <p className="text-gray-600">By: {barcode.author}</p>
                      <p className="text-sm text-gray-500">Copy {barcode.copyNumber}</p>
                    </div>
                    <Barcode
                      value={barcode.barcodeValue}
                      width={2}
                      height={100}
                      displayValue={true}
                      textMargin={2}
                      fontSize={14}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-2 mt-4 justify-end">
              <button
                onClick={exportBookDetails}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              >
                <FileDown size={20} className="mr-2" />
                Export Details
              </button>
              <button
                onClick={printBarcode}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <Printer size={20} className="mr-2" />
                Print All
              </button>
              <button
                onClick={downloadBarcodes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Download size={20} className="mr-2" />
                Download All
              </button>
              <button
                onClick={() => setBarcodes([])}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddBook;