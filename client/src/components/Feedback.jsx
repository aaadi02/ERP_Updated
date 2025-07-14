import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Feedback = () => {
  const enrollmentNumber = '123456';
  const departmentId = 'Computer Science'; // Use department name instead of ObjectId
  const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000';

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [feedbackAllowed, setFeedbackAllowed] = useState(true);
  const [feedbackStatusMessage, setFeedbackStatusMessage] = useState('');
  const [loadingStatus, setLoadingStatus] = useState(true);

  const questions = [
    `Overall experience gained from the {subject}`,
    `Clarity of concepts taught in the {subject}`,
    `Practical relevance of the {subject}`,
    `Interaction with the faculty during {subject}`,
    `Understanding of learning objectives in {subject}`,
  ];

  const options = [
    { value: 'Highly satisfied', emoji: '😍', color: 'bg-green-500' },
    { value: 'Satisfactory', emoji: '😊', color: 'bg-blue-500' },
    { value: 'Average', emoji: '😐', color: 'bg-yellow-500' },
    { value: 'Good', emoji: '🙂', color: 'bg-orange-500' },
    { value: 'Poor', emoji: '😞', color: 'bg-red-500' }
  ];

  const [responses, setResponses] = useState(Array(5).fill(''));

  // Check if feedback is allowed for the department
  const checkFeedbackStatus = async () => {
    try {
      setLoadingStatus(true);
      const response = await axios.get(`${API_URL}/api/feedback/status/${departmentId}`);
      
      if (response.data.success) {
        setFeedbackAllowed(response.data.allow);
        setFeedbackStatusMessage(response.data.message);
      } else {
        setFeedbackAllowed(false);
        setFeedbackStatusMessage('Unable to check feedback status');
      }
    } catch (error) {
      console.error('Error checking feedback status:', error);
      setFeedbackAllowed(false);
      setFeedbackStatusMessage('Feedback system is currently unavailable');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    // Check feedback status first
    checkFeedbackStatus();
    
    // Then fetch subjects
    axios
      .get(`${API_URL}/api/subjects?department=${departmentId}`)
      .then((res) => setSubjects(res.data))
      .catch(() => setSubjects([]));
  }, []);

  const handleSubmit = async () => {
    setError('');

    // Check if feedback is allowed before submitting
    if (!feedbackAllowed) {
      setError('Feedback submission is currently disabled for your department.');
      return;
    }

    if (!selectedSubject || responses.includes('')) {
      setError('Please answer all questions.');
      return;
    }

    setSubmitting(true);

    try {
      // Double-check feedback status before submitting
      const statusCheck = await axios.get(`${API_URL}/api/feedback/status/${departmentId}`);
      if (!statusCheck.data.allow) {
        setError('Feedback has been disabled during your session. Please refresh the page.');
        setSubmitting(false);
        setFeedbackAllowed(false);
        setFeedbackStatusMessage(statusCheck.data.message);
        return;
      }

      const payload = {
        enrollmentNumber,
        department: departmentId,
        subject: selectedSubject,
        responses: questions.map((q, i) => ({
          question: q.replace('{subject}', selectedSubject),
          answer: responses[i],
        })),
        comments 
      };

      await axios.post(`${API_URL}/api/feedback`, payload);
      setSubmitted(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Feedback already submitted for this subject.');
      } else {
        setError('Failed to submit feedback.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResponseChange = (qIndex, answer) => {
    const updated = [...responses];
    updated[qIndex] = answer;
    setResponses(updated);
  };

  const nextStep = () => {
    if (currentStep < questions.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = selectedSubject ? ((currentStep + 1) / (questions.length + 1)) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mb-4 animate-bounce-in">
            <span className="text-3xl">📝</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
            Student Feedback Portal
          </h1>
          <p className="text-gray-600 text-lg">Your voice matters! Help us improve your learning experience</p>
        </div>

        {/* Loading Status */}
        {loadingStatus && (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 animate-pulse">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Checking Feedback Status...</h2>
              <p className="text-gray-500">Please wait while we verify if feedback is currently enabled.</p>
            </div>
          </div>
        )}

        {/* Feedback Not Allowed */}
        {!loadingStatus && !feedbackAllowed && (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 animate-scale-in">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
                <span className="text-4xl">🚫</span>
              </div>
              <h2 className="text-3xl font-bold text-red-600 mb-4">Feedback Currently Disabled</h2>
              <p className="text-gray-600 text-lg mb-6">
                {feedbackStatusMessage || 'Feedback submission is currently disabled for your department.'}
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">ℹ️</span>
                  <span className="text-red-700 font-medium">
                    Please contact your HOD or department administration for more information.
                  </span>
                </div>
              </div>
              <button 
                onClick={checkFeedbackStatus}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Check Status Again
              </button>
            </div>
          </div>
        )}

        {/* Feedback Allowed - Show Normal Form */}
        {!loadingStatus && feedbackAllowed && (
          <>
            {/* Progress Bar */}
            {selectedSubject && (
              <div className="mb-8 animate-slide-in-up">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-medium text-primary-600">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Main Card */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-scale-in">
              {submitted ? (
                <div className="p-12 text-center animate-bounce-in">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🎉</span>
                  </div>
                  <h2 className="text-3xl font-bold text-green-600 mb-4">Thank You!</h2>
                  <p className="text-gray-600 text-lg">Your feedback has been submitted successfully.</p>
                  <div className="mt-8">
                    <button 
                      onClick={() => window.location.reload()} 
                      className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-3 rounded-full hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      Submit Another Feedback
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8">
                  {/* Error Message */}
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-slide-in-left">
                      <div className="flex items-center">
                        <span className="text-red-500 mr-2">⚠️</span>
                        <span className="text-red-700 font-medium">{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Subject Selection */}
                  <div className="mb-8 animate-slide-in-up">
                    <label className="block text-lg font-semibold text-gray-700 mb-3">
                      🎯 Select Subject
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-4 text-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-300 appearance-none cursor-pointer hover:border-primary-300"
                        value={selectedSubject}
                        onChange={(e) => {
                          setSelectedSubject(e.target.value);
                          setResponses(Array(5).fill(''));
                          setCurrentStep(0);
                          setError('');
                        }}
                      >
                        <option value="">Choose your subject...</option>
                        {subjects.map((subj) => (
                          <option key={subj._id} value={subj.name}>
                            {subj.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Questions */}
                  {selectedSubject && (
                    <div className="space-y-8">
                      {currentStep < questions.length ? (
                        <div key={currentStep} className="animate-slide-in-right">
                          <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-medium text-primary-600 bg-primary-100 px-3 py-1 rounded-full">
                                Question {currentStep + 1} of {questions.length}
                              </span>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 leading-relaxed">
                              {questions[currentStep].replace('{subject}', selectedSubject)}
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            {options.map((option, oIndex) => (
                              <div
                                key={oIndex}
                                className={`relative cursor-pointer group transition-all duration-300 transform hover:scale-105 ${
                                  responses[currentStep] === option.value ? 'scale-105' : ''
                                }`}
                                onClick={() => handleResponseChange(currentStep, option.value)}
                              >
                                <input
                                  type="radio"
                                  name={`question-${currentStep}`}
                                  value={option.value}
                                  checked={responses[currentStep] === option.value}
                                  onChange={() => handleResponseChange(currentStep, option.value)}
                                  className="sr-only"
                                />
                                <div className={`
                                  p-6 rounded-2xl border-2 text-center transition-all duration-300
                                  ${responses[currentStep] === option.value 
                                    ? `${option.color} text-white shadow-lg border-transparent` 
                                    : 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-md'
                                  }
                                `}>
                                  <div className="text-3xl mb-2">{option.emoji}</div>
                                  <div className="font-medium text-sm">{option.value}</div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between mt-8">
                            <button
                              onClick={prevStep}
                              disabled={currentStep === 0}
                              className="flex items-center px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                              </svg>
                              Previous
                            </button>
                            <button
                              onClick={nextStep}
                              disabled={!responses[currentStep]}
                              className="flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              Next
                              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="animate-slide-in-up">
                          <div className="mb-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                              💬 Additional Comments (Optional)
                            </h3>
                            <p className="text-gray-600">Share any additional thoughts or suggestions</p>
                          </div>
                          <textarea
                            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-4 text-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-300 resize-none"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={6}
                            placeholder="Enter your suggestions, remarks, or any feedback not covered above..."
                          />

                          <div className="flex justify-between mt-8">
                            <button
                              onClick={prevStep}
                              className="flex items-center px-6 py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all duration-300"
                            >
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                              </svg>
                              Previous
                            </button>
                            <button
                              onClick={handleSubmit}
                              disabled={submitting || responses.includes('')}
                              className="flex items-center px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                              {submitting ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  Submit Feedback
                                  <span className="ml-2">🚀</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="text-center mt-8 text-gray-500 animate-fade-in">
              <p>Your feedback helps us create better learning experiences ✨</p>
            </div>
          </>
        )}

        {/* Footer for disabled state */}
        {!loadingStatus && !feedbackAllowed && (
          <div className="text-center mt-8 text-gray-500 animate-fade-in">
            <p>Contact your department for feedback availability ✨</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;
