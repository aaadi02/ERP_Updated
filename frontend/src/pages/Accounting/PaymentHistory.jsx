import { useState, useEffect } from 'react';
import ReceiptSlip from '../../components/ReceiptSlip';
import AdvancedAnalytics from '../../components/AdvancedAnalytics';

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // New states for advanced features
  const [activeTab, setActiveTab] = useState('payments');
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchPayments();
    fetchStats();
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
    if (activeTab === 'notifications') {
      fetchNotifications();
      fetchAlerts();
    }
  }, [searchTerm, statusFilter, methodFilter, typeFilter, dateRange, sortBy, activeTab]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const url = new URL('http://localhost:5000/api/payments/history');
      if (searchTerm) url.searchParams.append('search', searchTerm);
      if (statusFilter !== 'all') url.searchParams.append('status', statusFilter);
      if (typeFilter !== 'all') url.searchParams.append('type', typeFilter);
      if (methodFilter !== 'all') url.searchParams.append('method', methodFilter);
      if (dateRange.start) url.searchParams.append('startDate', dateRange.start);
      if (dateRange.end) url.searchParams.append('endDate', dateRange.end);
      if (sortBy) url.searchParams.append('sort', sortBy);
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPayments(Array.isArray(data) ? data : []);
        setError('');
      } else {
        setError('Failed to fetch payments');
        setPayments([]);
      }
    } catch (err) {
      setError('Network error');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from fetched payments data
      const response = await fetch('http://localhost:5000/api/payments/history');
      if (response.ok) {
        const allPayments = await response.json();
        
        const totalPayments = allPayments.length;
        const totalAmount = allPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const completedPayments = allPayments.filter(p => p.status === 'Completed' || p.status === 'Paid').length;
        const pendingPayments = allPayments.filter(p => p.status === 'Pending').length;
        
        setStats({
          totalPayments,
          totalAmount,
          completedPayments,
          pendingPayments
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/payments/analytics?period=30');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const generateNotificationsFromPayments = (recentPayments) => {
    const notifications = [];
    
    // Generate notifications from recent payments
    recentPayments.forEach((payment, index) => {
      if (payment.amount >= 50000) {
        notifications.push({
          id: `payment-${payment._id}`,
          type: 'payment',
          title: 'Large Payment Received',
          message: `Payment of ₹${payment.amount.toLocaleString()} received from ${payment.recipientName || 'Student'}`,
          time: new Date(payment.paymentDate || payment.createdAt),
          read: false,
          priority: 'high'
        });
      }
      
      if (payment.status === 'Failed') {
        notifications.push({
          id: `failed-${payment._id}`,
          type: 'error',
          title: 'Payment Failed',
          message: `Payment of ₹${payment.amount.toLocaleString()} failed for ${payment.recipientName || 'Student'}`,
          time: new Date(payment.paymentDate || payment.createdAt),
          read: false,
          priority: 'high'
        });
      }
    });
    
    return notifications.slice(0, 10); // Limit to 10 most recent
  };

  const fetchNotifications = async () => {
    try {
      // Fetch real notifications from backend
      const response = await fetch('http://localhost:5000/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        // If no notifications endpoint exists, generate based on recent payments
        const paymentsResponse = await fetch('http://localhost:5000/api/payments/history?limit=10&sort=latest');
        if (paymentsResponse.ok) {
          const recentPayments = await paymentsResponse.json();
          const generatedNotifications = generateNotificationsFromPayments(recentPayments);
          setNotifications(generatedNotifications);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/payments/analytics?period=1');
      if (response.ok) {
        const data = await response.json();
        generateAlerts(data);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  const generateAlerts = (data) => {
    const newAlerts = [];

    if (data.totalStudentPayments === 0) {
      newAlerts.push({
        id: 'no-payments',
        type: 'warning',
        title: 'No Payments Today',
        message: 'No student payments have been recorded today',
        action: 'Check payment systems'
      });
    }

    setAlerts(newAlerts);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': 
      case 'Paid': 
        return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      case 'Refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'cash':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'online':
      case 'upi':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
    }
  };

  const handleViewReceipt = (payment) => {
    setSelectedPayment(payment);
    setShowReceipt(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setMethodFilter('all');
    setTypeFilter('all');
    setDateRange({ start: '', end: '' });
    setSortBy('latest');
    setCurrentPage(1);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPayments = payments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(payments.length / itemsPerPage);

  // Notification helpers
  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const dismissAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const formatTime = (time) => {
    const now = new Date();
    const diff = now - new Date(time);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return 'Just now';
  };

  const getNotificationIcon = (type) => {
    const iconClass = "w-6 h-6";
    switch (type) {
      case 'payment':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClass} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case 'alert':
        return (
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClass} text-yellow-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.382 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Loading all payments...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-600 text-lg">{error}</div>
            <button 
              onClick={fetchPayments}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management System</h1>
            <p className="text-gray-600">Complete payment tracking, analytics and notifications</p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'payments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Payments & History
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analytics'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytics & Reports
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'notifications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5z" />
                    </svg>
                    Alerts & Notifications
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notifications.filter(n => !n.read).length}
                      </span>
                    )}
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Payments</p>
                      <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-green-600">₹{payments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Student Fees</p>
                      <p className="text-2xl font-bold text-blue-600">{payments.filter(p => p.type === 'student').length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Faculty Salary</p>
                      <p className="text-2xl font-bold text-purple-600">{payments.filter(p => p.type === 'salary').length}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search & Filter</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Types</option>
                    <option value="student">Student Fees</option>
                    <option value="salary">Faculty Salary</option>
                  </select>

                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Payments Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Payment Records</h3>
                </div>
                
                {currentPayments.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-500 text-xl">No payments found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type & Receipt</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentPayments.map((payment) => (
                          <tr key={payment._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mb-2 ${
                                  payment.type === 'salary' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {payment.type === 'salary' ? 'Salary' : 'Student Fee'}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  #{payment.receiptNumber || payment.paymentId}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {payment.recipientName || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-lg font-bold text-gray-900">
                                ₹{(payment.amount || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {getPaymentMethodIcon(payment.paymentMethod)}
                                <span className="text-sm">{payment.paymentMethod || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(payment.paymentDate)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                                {payment.status || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleViewReceipt(payment)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-full"
                                title="View Receipt"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, payments.length)} of {payments.length} results
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <AdvancedAnalytics analytics={analytics} timeRange={parseInt(dateRange.end ? 30 : 30)} />
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Alerts Section */}
              {alerts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                      alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                      alert.type === 'error' ? 'bg-red-50 border-red-400' :
                      'bg-blue-50 border-blue-400'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium ${
                            alert.type === 'warning' ? 'text-yellow-800' :
                            alert.type === 'error' ? 'text-red-800' :
                            'text-blue-800'
                          }`}>
                            {alert.title}
                          </h4>
                          <p className={`text-sm mt-1 ${
                            alert.type === 'warning' ? 'text-yellow-700' :
                            alert.type === 'error' ? 'text-red-700' :
                            'text-blue-700'
                          }`}>
                            {alert.message}
                          </p>
                          {alert.action && (
                            <p className={`text-xs mt-2 font-medium ${
                              alert.type === 'warning' ? 'text-yellow-600' :
                              alert.type === 'error' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              Action: {alert.action}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => dismissAlert(alert.id)}
                          className="ml-4 text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Notifications Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Notifications
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {notifications.filter(n => !n.read).length} new
                        </span>
                      )}
                    </h3>
                    <button
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-6 hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-4">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className={`font-medium ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">
                                  {formatTime(notification.time)}
                                </span>
                                {notification.priority === 'high' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    High
                                  </span>
                                )}
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && selectedPayment && (
        <ReceiptSlip 
          payment={selectedPayment} 
          onClose={() => setShowReceipt(false)} 
        />
      )}
    </>
  );
}
