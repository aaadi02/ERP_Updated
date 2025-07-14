import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ActiveIssues = () => {
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchActiveIssues = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/issues/active');
        setIssues(response.data);
      } catch (error) {
        setError('Failed to fetch active issues');
      }
    };

    fetchActiveIssues();
    // Refresh data every minute to update fines
    const interval = setInterval(fetchActiveIssues, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Active Issues</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">Book Title</th>
              <th className="py-2 px-4 border">Borrower name</th>
              <th className="py-2 px-4 border">Due Date</th>
              <th className="py-2 px-4 border">Days Overdue</th>
              <th className="py-2 px-4 border">Current Fine</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue._id} className={issue.daysOverdue > 0 ? 'bg-red-50' : ''}>
                <td className="py-2 px-4 border">{issue.bookId.title}</td>
                <td className="py-2 px-4 border">{issue.borrowerName}</td>
                <td className="py-2 px-4 border">
                  {new Date(issue.dueDate).toLocaleDateString()}
                </td>
                <td className="py-2 px-4 border">
                  {issue.daysOverdue > 0 ? issue.daysOverdue : '-'}
                </td>
                <td className="py-2 px-4 border">
                  {issue.currentFine > 0 ? `Rs. ${issue.currentFine}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActiveIssues;