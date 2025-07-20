import React, { useState } from 'react';

const ProblemRise = () => {
  // Form state
  const [formData, setFormData] = useState({
    issueType: '',
    description: '',
    urgency: 'Low',
    busNumber: '',
  });
  // Submission state
  const [submitted, setSubmitted] = useState(false);
  const [submissions, setSubmissions] = useState([]); // Mock storage

  // Handle input changes
  const handleInputChange = (e, field) => {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.issueType || !formData.description) {
      alert('Please fill in Issue Type and Description.');
      return;
    }
    // Mock submission
    setSubmissions([
      ...submissions,
      { id: `P${Date.now()}`, ...formData, timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) },
    ]);
    setSubmitted(true);
    setFormData({
      issueType: '',
      description: '',
      urgency: 'Low',
      busNumber: '',
    });
  };

  // Reset form for new submission
  const handleNewReport = () => {
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 text-center drop-shadow-md">
          Report a Problem
        </h2>

        <div className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-4 sm:p-6 border border-white/20">
          {submitted ? (
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white mb-2">Problem Reported Successfully!</h3>
              <p className="text-sm text-gray-200 mb-4">
                Your issue has been logged. We'll address it soon.
              </p>
              <button
                onClick={handleNewReport}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-all duration-200"
              >
                Report Another Issue
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Issue Type */}
              <div>
                <label className="text-sm font-medium text-gray-200">Issue Type</label>
                <select
                  value={formData.issueType || ''}
                  onChange={(e) => handleInputChange(e, 'issueType')}
                  className="mt-1 w-full px-3 py-2 bg-white/5 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="" disabled className="text-black">
                    Select an issue
                  </option>
                  <option value="Mechanical" className="text-black">Mechanical</option>
                  <option value="Route" className="text-black">Route</option>
                  <option value="Passenger" className="text-black">Passenger</option>
                  <option value="Other" className="text-black">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-200">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange(e, 'description')}
                  className="mt-1 w-full px-3 py-2 bg-white/5 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows="4"
                  placeholder="Describe the issue in detail"
                  required
                ></textarea>
              </div>

              {/* Urgency */}
              <div>
                <label className="text-sm font-medium text-gray-200">Urgency</label>
                <div className="mt-1 flex gap-4">
                  {['Low', 'Medium', 'High'].map((level) => (
                    <label key={level} className="flex items-center text-sm text-gray-200">
                      <input
                        type="radio"
                        name="urgency"
                        value={level}
                        checked={formData.urgency === level}
                        onChange={(e) => handleInputChange(e, 'urgency')}
                        className="mr-2 accent-indigo-500"
                      />
                      {level}
                    </label>
                  ))}
                </div>
              </div>

              {/* Bus Number */}
              <div>
                <label className="text-sm font-medium text-gray-200">Bus Number (Optional)</label>
                <input
                  type="text"
                  value={formData.busNumber || ''}
                  onChange={(e) => handleInputChange(e, 'busNumber')}
                  className="mt-1 w-full px-3 py-2 bg-white/5 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., KA-01-1234"
                />
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-all duration-200"
                >
                  Submit Report
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Link */}
        <div className="mt-6 text-center">
          <a
            href="https://tarstech.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 font-semibold text-sm hover:text-indigo-100 transition-colors"
          >
            A TARS TECH PRODUCT
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProblemRise;