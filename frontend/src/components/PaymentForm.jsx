import React, { useState, useEffect } from 'react';

const PaymentForm = ({ student, onPaymentComplete }) => {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'Cash',
    feeHead: '',
    description: '',
    transactionId: '',
    collectedBy: '',
    remarks: ''
  });
  const [feeHeads, setFeeHeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFeeHeads();
  }, [student, fetchFeeHeads]);

  const fetchFeeHeads = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/fee-heads');
      if (response.ok) {
        const data = await response.json();
        // Filter fee heads based on student's stream and caste category
        const filteredHeads = data.filter(head => 
          (!head.stream || head.stream === student?.stream) &&
          (!head.casteCategory || head.casteCategory === student?.casteCategory)
        );
        setFeeHeads(filteredHeads);
      }
    } catch (err) {
      console.error('Error fetching fee heads:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const paymentData = {
        studentId: student._id,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        feeHead: formData.feeHead || null,
        description: formData.description || '',
        transactionId: formData.transactionId || '',
        collectedBy: formData.collectedBy || '',
        remarks: formData.remarks || ''
      };

      console.log('Sending payment data:', paymentData);

      const response = await fetch('http://localhost:5000/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(`Payment of ₹${formData.amount} recorded successfully! Receipt: ${result.payment.receiptNumber}`);
        setFormData({
          amount: '',
          paymentMethod: 'Cash',
          feeHead: '',
          description: '',
          transactionId: '',
          collectedBy: '',
          remarks: ''
        });
        if (onPaymentComplete) {
          onPaymentComplete(result.payment, result.updatedStudent);
        }
      } else {
        console.error('Payment error:', result);
        setError(result.message || result.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Record Fee Payment</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Cash">Cash</option>
              <option value="Online">Online</option>
              <option value="Cheque">Cheque</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fee Head (Optional)
            </label>
            <select
              name="feeHead"
              value={formData.feeHead}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Fee Head</option>
              {feeHeads.map(head => (
                <option key={head._id} value={head._id}>
                  {head.title} - ₹{head.amount}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction ID (Optional)
            </label>
            <input
              type="text"
              name="transactionId"
              value={formData.transactionId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Transaction ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Collected By (Optional)
            </label>
            <input
              type="text"
              name="collectedBy"
              value={formData.collectedBy}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Staff name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Payment description"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Remarks (Optional)
          </label>
          <textarea
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Additional remarks"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setFormData({
              amount: '',
              paymentMethod: 'Cash',
              feeHead: '',
              description: '',
              transactionId: '',
              collectedBy: '',
              remarks: ''
            })}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Recording...' : 'Record Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm; 