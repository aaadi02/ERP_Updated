import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PaymentHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/dues/history/all');
        // Convert dummy/test bookId to valid ObjectId-like string if needed
        const fixed = Array.isArray(response.data)
          ? response.data.map(rec => ({
              ...rec,
              bookId: rec.bookId && rec.bookId.length !== 24
                ? '60d21b4667d0d8992e610c' + (Math.floor(Math.random()*90)+10) // makes 24 chars
                : rec.bookId
            }))
          : [];
        setHistory(fixed);
      } catch (err) {
        setError('Failed to fetch payment history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-8 mt-8 ml-72">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">All Payment History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Txn ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-6 text-gray-500">No payment records found.</td></tr>
            ) : (
              history.map((rec, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">{rec.studentName}</td>
                  <td className="px-4 py-2">{rec.studentId}</td>
                  <td className="px-4 py-2">{rec.bookTitle}</td>
                  <td className="px-4 py-2 text-green-700 font-semibold">₹{rec.amount}</td>
                  <td className="px-4 py-2">{rec.method}</td>
                  <td className="px-4 py-2">{rec.transactionId}</td>
                  <td className="px-4 py-2">{rec.date ? new Date(rec.date).toLocaleDateString() : ''}</td>
                  <td className="px-4 py-2">
                    {rec.invoiceUrl ? (
                      <a href={rec.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistory;
