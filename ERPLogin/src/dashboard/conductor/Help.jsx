import React from 'react';

const Help = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Help & Support</h2>
      
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Getting Started</h3>
          <p className="text-blue-700">
            Welcome to the Conductor Dashboard! Use this portal to manage your daily bus operations, 
            update location status, and generate reports.
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Location Updates</h3>
          <p className="text-green-700">
            Regularly update the bus location and passenger count to keep the system current. 
            This helps students track bus arrivals and departures accurately.
          </p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Daily Reports</h3>
          <p className="text-yellow-700">
            Generate and review daily reports to track passenger counts, route performance, 
            and any incidents during your shifts.
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Profile Management</h3>
          <p className="text-purple-700">
            Keep your profile information updated and review your assigned bus details 
            in the Profile section.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Support</h3>
          <p className="text-gray-700 mb-3">
            If you need assistance or encounter any technical issues:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Email: support@collegebus.edu</li>
            <li>Phone: +1 (555) 123-4567</li>
            <li>Hours: Monday-Friday, 8:00 AM - 6:00 PM</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Help;
