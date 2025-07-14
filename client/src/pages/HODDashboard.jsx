import React, { useState } from 'react';
import MaterialUpload from '../components/MaterialUpload';

const HODDashboard = () => {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="w-full max-w-xl bg-white rounded shadow-lg p-8 mt-10">
        <h1 className="text-2xl font-bold mb-6 text-center text-primary-700">HOD Material Upload</h1>
        <button
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setShowUpload(!showUpload)}
        >
          {showUpload ? 'Hide Upload Form' : 'Upload New Material'}
        </button>
        {showUpload && <MaterialUpload />}
      </div>
    </div>
  );
};

export default HODDashboard;
