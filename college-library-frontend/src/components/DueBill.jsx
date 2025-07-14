import React, { useEffect, useState } from 'react';
import { Calendar, Book, User, School, AlertTriangle, FileText } from 'lucide-react';
import axios from 'axios';

const DueBill = () => {
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState({
    amount: '',
    method: '',
    transactionId: ''
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [confirmationMsg, setConfirmationMsg] = useState('');

  // Track paid books in local state for demo (replace with backend logic in real app)
  const [paidBooks, setPaidBooks] = useState({}); // { studentId: [bookId, ...] }

  const handlePay = (studentId, bookId) => {
    if (!bookId) {
      setConfirmationMsg('Book ID is missing!');
      setTimeout(() => setConfirmationMsg(''), 3000);
      return;
    }
    setSelectedPayment({ studentId, bookId });
    setShowPayModal(true);
    setPaymentDetails({ amount: '', method: '', transactionId: '' });
  };

  const handlePaymentInput = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      if (!selectedPayment) {
        throw new Error('No payment selected');
      }

      const paymentData = {
        studentId: selectedPayment.studentId,
        bookId: selectedPayment.bookId,
        amount: parseFloat(paymentDetails.amount),
        method: paymentDetails.method,
        transactionId: paymentDetails.transactionId.trim()
      };

      console.log('Sending payment:', paymentData);

      // Send payment to backend
      const paymentResponse = await axios.post('http://localhost:5000/api/dues/pay', paymentData);
      console.log('Payment response:', paymentResponse.data);

      if (!paymentResponse.data.success) {
        throw new Error(paymentResponse.data.message || 'Payment failed');
      }

      // Refresh dues from backend
      const duesResponse = await axios.get('http://localhost:5000/api/dues/due');
      setDues(duesResponse.data);

      // Update local state
      setPaidBooks((prev) => {
        const { studentId, bookId } = selectedPayment;
        return {
          ...prev,
          [studentId]: prev[studentId] ? [...new Set([...prev[studentId], bookId])] : [bookId],
        };
      });

      setShowPayModal(false);
      setSelectedPayment(null);
      setPaymentDetails({ amount: '', method: '', transactionId: '' });
      setConfirmationMsg('Payment successful!');
      setTimeout(() => setConfirmationMsg(''), 2500);
    } catch (err) {
      console.error('Payment error:', err.response?.data || err);
      setConfirmationMsg(
        err.response?.data?.message || 
        err.message || 
        'Payment failed! Please try again.'
      );
      setTimeout(() => setConfirmationMsg(''), 3000);
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    // Dummy data for testing
    // const dummyDues = [
    //   {
    //     studentId: 'S001',
    //     name: 'Amit Kumar',
    //     rollNumber: '21CS101',
    //     department: 'CSE',
    //     totalFine: 150,
    //     books: [
    //       {
    //         id: '60d21b4667d0d8992e610c85', // valid ObjectId-like string
    //         title: 'Data Structures',
    //         returnDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    //         daysLate: 5,
    //         fine: 50,
    //       },
    //       {
    //         id: '60d21b4667d0d8992e610c86', // valid ObjectId-like string
    //         title: 'Operating Systems',
    //         returnDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    //         daysLate: 10,
    //         fine: 100,
    //       },
    //     ],
    //   },
    //   {
    //     studentId: 'S002',
    //     name: 'Priya Singh',
    //     rollNumber: '21CS102',
    //     department: 'ECE',
    //     totalFine: 80,
    //     books: [
    //       {
    //         id: '60d21b4667d0d8992e610c87', // valid ObjectId-like string
    //         title: 'Digital Logic',
    //         returnDate: new Date(Date.now() - 8 * 86400000).toISOString(),
    //         daysLate: 8,
    //         fine: 80,
    //       },
    //     ],
    //   },
    // ];
    // // Ensure every book has an id field and it's passed to handlePay
    // setDues(dummyDues);
    // setLoading(false);
    // Uncomment below to use real API
    /*
    const fetchDues = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/dues/due');
        setDues(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dues data');
      } finally {
        setLoading(false);
      }
    };
    fetchDues();
    */
    const fetchDues = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/dues/due');
        setDues(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dues data');
      } finally {
        setLoading(false);
      }
    };
    fetchDues();
  }, []);

  // Fetch payment history from backend
  const fetchPaymentHistory = async (studentId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/dues/history?studentId=${studentId}`);
      setPaymentHistory(response.data);
    } catch (err) {
      setPaymentHistory([]);
      setConfirmationMsg('Failed to fetch payment history');
      setTimeout(() => setConfirmationMsg(''), 2500);
    }
    setShowHistoryModal(true);
  };

  const isBookPaid = (studentId, bookId) => {
    return paidBooks[studentId]?.includes(bookId) || false;
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 ">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg fixed inset-0 min-h-screen bg-gradient-to-br flex flex-col py-12 px-2 md:px-8 z-0 ml-72 overflow-y-auto overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-red-100 rounded-full mr-3">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Due Bills</h2>
        </div>
        <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
          {dues.length} {dues.length === 1 ? 'Student' : 'Students'} with dues
        </span>
      </div>

      {dues.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
          <div className="bg-green-100 p-3 rounded-full mb-4">
            <Book size={24} className="text-green-600" />
          </div>
          <p className="text-lg text-gray-600 font-medium">No dues found</p>
          <p className="text-sm text-gray-500 mt-2">All books have been returned on time</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dues.map((student) => (
            <div key={student.studentId} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              <div className="bg-blue-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User size={20} className="mr-2" />
                    <h3 className="font-bold text-lg">{student.name}</h3>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <span className="bg-blue-800 px-2 py-1 rounded text-xs font-medium">{student.rollNumber}</span>
                    </div>
                    <div className="flex items-center">
                      <School size={16} className="mr-1" />
                      <span className="text-sm">{student.department}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Total Fine</span>
                    <span className="text-xl font-bold text-red-600">₹{student.totalFine}</span>
                  </div>
                </div>

                <div className="rounded-md overflow-hidden border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Late</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fine</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {student.books.map((book, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <Book size={16} className="text-blue-600 mr-2" />
                              <span className="font-medium text-gray-800">{book.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar size={16} className="text-gray-500 mr-2" />
                              <span className="text-sm text-gray-600">{new Date(book.returnDate).toDateString()}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${book.daysLate > 7 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {book.daysLate} days
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-red-600">
                            ₹{book.fine}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-2">
                              {isBookPaid(student.studentId, book.id) ? (
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1 animate-bounce-in">
                                  Paid
                                </span>
                              ) : (
                                <button
                                  onClick={() => handlePay(student.studentId, book.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200"
                                  disabled={showPayModal || paymentLoading}
                                  title="Pay fine for this book"
                                >
                                  Pay
                                </button>
                              )}
                              {/* <button
                                onClick={() => fetchPaymentHistory(student.studentId)}
                                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-md text-xs font-semibold border border-blue-200 transition-colors duration-200"
                                title="View Payment History"
                              >
                                History
                              </button> */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowPayModal(false)}
              disabled={paymentLoading}
            >
              ×
            </button>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <FileText className="mr-2 text-indigo-600" /> Payment Details
            </h3>
            <form onSubmit={handlePaymentSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={paymentDetails.amount}
                  onChange={handlePaymentInput}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  name="method"
                  value={paymentDetails.method}
                  onChange={handlePaymentInput}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select method</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="netbanking">Net Banking</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                <input
                  type="text"
                  name="transactionId"
                  value={paymentDetails.transactionId}
                  onChange={handlePaymentInput}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter transaction/reference ID"
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-300"
                  disabled={paymentLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <span className="flex items-center"><svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Processing...</span>
                  ) : (
                    'Submit Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full relative animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowHistoryModal(false)}
            >
              ×
            </button>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <FileText className="mr-2 text-indigo-600" /> Payment History
            </h3>
            {paymentHistory.length === 0 ? (
              <div className="text-center text-gray-500">No payment history found.</div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {paymentHistory.map((record, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">{record.bookTitle}</span>
                      <span className="text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="font-medium text-green-700">₹{record.amount}</span>
                      <span className="text-gray-600">{record.method}</span>
                      <span className="text-gray-600">Txn: {record.transactionId}</span>
                      {record.invoiceUrl && (
                        <a href={record.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Invoice</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Snackbar */}
      {confirmationMsg && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          {confirmationMsg}
        </div>
      )}
    </div>
  );
};

export default DueBill;