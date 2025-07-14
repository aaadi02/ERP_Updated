import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Get the API URL from environment variables or use localhost as fallback
  const API_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/api/announcements`)
      .then(res => {
        setAnnouncements(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load announcements');
        setLoading(false);
      });
  }, [API_URL]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
        <p className="mt-4 text-primary-600 font-medium animate-pulse-slow">Loading announcements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 shadow-soft animate-fade-in">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
            <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-red-800">Error</h3>
            <p className="mt-1 text-red-700">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">Announcements</h2>
          <div className="ml-4 h-1 flex-grow bg-gradient-to-r from-primary-600 to-secondary-500 rounded-full"></div>
        </div>
        
        <div className="bg-white rounded-xl shadow-card p-10 text-center border border-gray-100">
          <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
            <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Announcements</h3>
          <p className="text-gray-500">There are no announcements available at this time. Check back later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">Announcements</h2>
        <div className="ml-4 h-1 flex-grow bg-gradient-to-r from-primary-600 to-secondary-500 rounded-full"></div>
      </div>
      
      <div className="space-y-5">
        {announcements.map((announcement, index) => (
          <div 
            key={announcement._id || index} 
            className={`bg-white rounded-xl shadow-card hover:shadow-hover border border-gray-100 transition-all duration-300 overflow-hidden ${
              index % 3 === 0 ? 'animate-slide-in-left' : 
              index % 3 === 1 ? 'animate-slide-in-up' : 'animate-slide-in-right'
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white mr-3">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-lg text-gray-800">{announcement.title || 'Announcement'}</h3>
                </div>
                <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full">
                  {announcement.date 
                    ? new Date(announcement.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      }) 
                    : 'No date'}
                </span>
              </div>
              
              <div className="mt-4">
                <p className={`text-gray-700 ${
                  expandedId === (announcement._id || index) ? '' : 'line-clamp-3'
                }`}>
                 {announcement.description || 'No description provided.'}
                </p>
                
                {((announcement.message || announcement.content || '').length > 150) && (
                  <button 
                    onClick={() => toggleExpand(announcement._id || index)}
                    className="mt-2 text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors duration-200"
                  >
                    {expandedId === (announcement._id || index) ? 'Show less' : 'Read more'}
                  </button>
                )}
              </div>
              
              {announcement.from && (
                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Posted by: <span className="font-medium ml-1">{announcement.from}</span>
                </div>
              )}
              
              {announcement.attachments && announcement.attachments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Attachments:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {announcement.attachments.map((attachment, i) => (
                      <a 
                        key={i}
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-colors duration-200"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {attachment.name || `Attachment ${i+1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
