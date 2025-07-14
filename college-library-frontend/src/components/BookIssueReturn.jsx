import React, { useState } from 'react';
import axios from 'axios';

const BookIssueForm = () => {
  const [formData, setFormData] = useState({
    bookId: '',
    studentId: '',
    issueDate: '',
    returnDate: '',
    borrowerName: '',
    borrowerId: '',
    designation: '',
    seriesCode: '',
    bookTitle: '',
    subTitle: '',
    classCallNumber: '',
    edition: '',
    publisher: ''
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/books/issue', formData);
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error issuing book');
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-semibold mb-4">Book Issue Form</h2>
      {message && <div className="mb-4 text-blue-700 font-medium">{message}</div>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 capitalize">{key}</label>
            <input
              type={key.toLowerCase().includes('date') ? 'date' : 'text'}
              name={key}
              value={value}
              onChange={handleChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md "
            />
          </div>
        ))}
        <div className="md:col-span-2">
          <button
            type="submit"
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Issue Book
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookIssueForm;
