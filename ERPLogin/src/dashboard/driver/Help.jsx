import React, { useState } from 'react';
import { reportProblem } from '../../services/problemService';

const Help = () => {
  // Emergency contacts
  const emergencyContacts = [
    { id: 'E001', name: 'Police', number: '100', icon: '🚨' },
    { id: 'E002', name: 'Ambulance', number: '108', icon: '🚑' },
    { id: 'E003', name: 'Fire Service', number: '101', icon: '🚒' },
    { id: 'E004', name: 'College Principal', number: '+91 98765 43210', icon: '📞' },
    { id: 'E005', name: 'Campus Security', number: '+91 87654 32109', icon: '🛡️' },
    { id: 'E006', name: "Women's Helpline", number: '1091', icon: '📱' },
  ];

  // Problem report form state
  const [formData, setFormData] = useState({
    issueType: '',
    description: '',
    urgency: 'Low',
    busNumber: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e, field) => {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.issueType || !formData.description) {
      alert('Please fill in Issue Type and Description.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await reportProblem(formData);
      setSubmitted(true);
      setFormData({ issueType: '', description: '', urgency: 'Low', busNumber: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to report problem');
    } finally {
      setLoading(false);
    }
  };

  const handleNewReport = () => {
    setSubmitted(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Report a Problem Form */}
        <div className="max-w-3xl mx-auto mt-10">
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
                {error && <div className="text-red-400 text-center">{error}</div>}
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
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 text-center drop-shadow-md">
          Emergency Contacts
        </h2>

        {/* Contacts List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {emergencyContacts?.length > 0 ? (
            emergencyContacts.map((contact) => (
              <a
                key={contact.id}
                href={`tel:${contact.number}`}
                className="bg-white/10 backdrop-blur-md shadow-md rounded-lg p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-xl hover:bg-white/20 border border-white/20 group"
              >
                <span className="text-2xl">{contact.icon || '📞'}</span>
                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-indigo-300">
                    {contact.name || 'Unknown'}
                  </h3>
                  <p className="text-sm text-gray-200">{contact.number || 'N/A'}</p>
                </div>
              </a>
            ))
          ) : (
            <p className="text-gray-400 text-sm col-span-full text-center">
              No emergency contacts available
            </p>
          )}
        </div>


        {/* Footer Link */}
        <div className="mt-6 text-center">
          <a
            href="https://tarstech.in"
            target="_self"
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

export default Help;