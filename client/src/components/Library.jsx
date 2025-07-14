import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Library = () => {
  const studentId = 'CSEBTECH002'; // Hardcoded for now
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    axios.get(`${API_URL}/api/library/${studentId}`)
      .then(res => {
        setBooks(res.data);
        setLoading(false);
        console.log("Student ID:", studentId);
      })
      .catch(err => {
        console.error('Error fetching issued books:', err);
        setLoading(false);
      });
  }, []);

  const getDaysLeft = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusColor = (daysLeft) => {
    if (daysLeft < 0) return 'text-red-500 bg-red-50';
    if (daysLeft <= 3) return 'text-orange-500 bg-orange-50';
    return 'text-green-500 bg-green-50';
  };

  const getStatusIcon = (daysLeft) => {
    if (daysLeft < 0) return (
      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
    if (daysLeft <= 3) return (
      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
    return (
      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.bookId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'overdue') return matchesSearch && getDaysLeft(book.dueDate) < 0;
    if (filterStatus === 'due-soon') return matchesSearch && getDaysLeft(book.dueDate) >= 0 && getDaysLeft(book.dueDate) <= 3;
    if (filterStatus === 'active') return matchesSearch && getDaysLeft(book.dueDate) > 3;
    return matchesSearch;
  });

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-6 shadow-soft animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-20 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-16 animate-fade-in">
      <div className="relative mb-8">
        <div className="w-32 h-32 mx-auto bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center animate-bounce-in">
          <svg className="w-16 h-16 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-secondary-500 rounded-full animate-pulse"></div>
      </div>
      <h3 className="text-2xl font-bold text-gray-700 mb-4">No Books Issued</h3>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">You haven't issued any books from the library yet. Visit the library to explore our collection!</p>
      <button className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-glow transition-all duration-300 hover:scale-105">
        Explore Library
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-8 animate-slide-in-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl mb-6 shadow-glow animate-float">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
            My Digital Library
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Track your issued books, due dates, and reading progress all in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Books', value: books.length, icon: '📚', color: 'from-blue-500 to-blue-600' },
            { label: 'Due Soon', value: books.filter(b => getDaysLeft(b.dueDate) >= 0 && getDaysLeft(b.dueDate) <= 3).length, icon: '⏰', color: 'from-orange-500 to-orange-600' },
            { label: 'Overdue', value: books.filter(b => getDaysLeft(b.dueDate) < 0).length, icon: '⚠️', color: 'from-red-500 to-red-600' },
            { label: 'Active', value: books.filter(b => getDaysLeft(b.dueDate) > 3).length, icon: '✅', color: 'from-green-500 to-green-600' }
          ].map((stat, index) => (
            <div key={index} className={`bg-gradient-to-r ${stat.color} rounded-2xl p-6 text-white shadow-hover hover:scale-105 transition-all duration-300 animate-slide-in-up`} style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className="text-4xl opacity-80">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl p-6 shadow-soft mb-8 animate-slide-in-up">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search books by title or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-6 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 bg-white"
            >
              <option value="all">All Books</option>
              <option value="active">Active</option>
              <option value="due-soon">Due Soon</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <LoadingSkeleton />
        ) : filteredBooks.length === 0 ? (
          searchTerm || filterStatus !== 'all' ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No books found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <EmptyState />
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBooks.map((book, idx) => {
              const daysLeft = getDaysLeft(book.dueDate);
              const isOverdue = daysLeft < 0;
              
              return (
                <div key={idx} className={`bg-white rounded-2xl p-6 shadow-soft hover:shadow-hover transition-all duration-300 hover:scale-[1.02] animate-slide-in-up border-l-4 ${
                  isOverdue ? 'border-red-500' : daysLeft <= 3 ? 'border-orange-500' : 'border-green-500'
                }`} style={{ animationDelay: `${idx * 0.1}s` }}>
                  <div className="flex items-start space-x-4">
                    {/* Book Cover */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center shadow-soft">
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Book Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{book.bookTitle}</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="font-medium">ID:</span> {book.bookId}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">Issued:</span> {new Date(book.issueDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">Due:</span> {new Date(book.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-3 ${getStatusColor(daysLeft)}`}>
                        {getStatusIcon(daysLeft)}
                        {isOverdue ? `${Math.abs(daysLeft)} day(s) overdue` : `${daysLeft} day(s) left`}
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;
