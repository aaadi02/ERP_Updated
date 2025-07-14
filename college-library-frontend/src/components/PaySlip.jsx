import React, { useState } from 'react';

const PaySlip = ({ faculty, onClose }) => {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [allowances, setAllowances] = useState({
    basic: 0,
    hra: 0,
    da: 0,
    specialAllowance: 0
  });

  const calculateTotal = () => {
    return Object.values(allowances).reduce((acc, val) => acc + Number(val), 0);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl mx-auto my-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pay Slip</h2>
        <p className="text-gray-600">For the month of {new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-semibold mb-2">Employee Details</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {faculty?.name}</p>
            <p><span className="font-medium">Department:</span> {faculty?.department}</p>
            <p><span className="font-medium">Employee ID:</span> {faculty?._id}</p>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Select Month</label>
            <input 
              type="month" 
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-4">Earnings</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <label className="w-32">Basic Pay</label>
            <input
              type="number"
              value={allowances.basic}
              onChange={(e) => setAllowances({...allowances, basic: e.target.value})}
              className="p-2 border rounded w-40"
            />
          </div>
          <div className="flex items-center">
            <label className="w-32">HRA</label>
            <input
              type="number"
              value={allowances.hra}
              onChange={(e) => setAllowances({...allowances, hra: e.target.value})}
              className="p-2 border rounded w-40"
            />
          </div>
          <div className="flex items-center">
            <label className="w-32">DA</label>
            <input
              type="number"
              value={allowances.da}
              onChange={(e) => setAllowances({...allowances, da: e.target.value})}
              className="p-2 border rounded w-40"
            />
          </div>
          <div className="flex items-center">
            <label className="w-32">Special</label>
            <input
              type="number"
              value={allowances.specialAllowance}
              onChange={(e) => setAllowances({...allowances, specialAllowance: e.target.value})}
              className="p-2 border rounded w-40"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total</span>
          <span>₹ {calculateTotal()}</span>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Print Pay Slip
        </button>
      </div>

      <style jsx>{`
        @media print {
          button {
            display: none;
          }
          input {
            border: none;
          }
        }
      `}</style>
    </div>
  );
};

const FacultyPaySlip = () => {
  const [showPaySlip, setShowPaySlip] = useState(false);
  const [currentFaculty, setCurrentFaculty] = useState(null);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);

  const handleFacultySelect = (faculty) => {
    setCurrentFaculty(faculty);
    setIsCheckboxChecked(true);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Generate Pay Slip</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="form-group">
          <label className="block text-sm font-medium mb-2">Select Faculty</label>
          <select
            onChange={(e) => handleFacultySelect(JSON.parse(e.target.value))}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select Faculty --</option>
            {/* Map through faculty members here */}
            <option value={JSON.stringify({ name: 'John Doe', department: 'Mathematics', _id: '12345' })}>
              John Doe - Mathematics
            </option>
            <option value={JSON.stringify({ name: 'Jane Smith', department: 'Science', _id: '67890' })}>
              Jane Smith - Science
            </option>
          </select>
        </div>

        <div className="form-group">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isCheckboxChecked}
              onChange={() => setIsCheckboxChecked(!isCheckboxChecked)}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label className="ml-2 block text-sm font-medium">
              I confirm that the above information is correct
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={() => {
            const facultyId = document.getElementById('facultyId').value;
            if (facultyId && isCheckboxChecked) {
              // Navigate to pay slip page or show modal
              setShowPaySlip(true);
            } else {
              alert('Please select a faculty member first');
            }
          }}
          className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Generate Pay Slip
        </button>
      </div>

      {showPaySlip && (
        <PaySlip 
          faculty={currentFaculty}
          onClose={() => setShowPaySlip(false)}
        />
      )}
    </div>
  );
};

export default FacultyPaySlip;