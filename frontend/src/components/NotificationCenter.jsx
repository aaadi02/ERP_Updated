import React, { useState, useEffect } from 'react';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [settings, setSettings] = useState({
    lowBalanceAlert: true,
    highVolumeAlert: true,
    failedPaymentAlert: true,
    dailyReport: true
  });

  useEffect(() => {
    fetchNotifications();
    fetchAlerts();
    // Set up real-time notifications
    const interval = setInterval(() => {
      checkForAlerts();
    }, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
      console.error('Error fetching data for alerts:', err);
    }
  };

  const generateAlerts = (data) => {
    const newAlerts = [];

    // Check for unusual patterns
    if (data.totalStudentPayments === 0) {
      newAlerts.push({
        id: 'no-payments',
        type: 'warning',
        title: 'No Payments Today',
        message: 'No student payments have been recorded today',
        action: 'Check payment systems'
      });
    }

    if (data.totalStudentRevenue > data.avgStudentPayment * 20) {
      newAlerts.push({
        id: 'high-volume',
        type: 'info',
        title: 'High Payment Volume',
        message: `Today's revenue (₹${data.totalStudentRevenue.toLocaleString()}) is significantly higher than average`,
        action: 'Monitor for any issues'
      });
    }

    setAlerts(newAlerts);
  };

  const checkForAlerts = async () => {
    // Check for failed payments in last 5 minutes
    try {
      const response = await fetch('http://localhost:5000/api/payments/history?status=Failed&period=1');
      if (response.ok) {
        const failedPayments = await response.json();
        if (failedPayments.length > 0) {
          const newNotification = {
            id: Date.now(),
            type: 'error',
            title: 'Payment Failures Detected',
            message: `${failedPayments.length} payment(s) have failed recently`,
            time: new Date(),
            read: false,
            priority: 'high'
          };
          setNotifications(prev => [newNotification, ...prev]);
        }
      }
    } catch (err) {
      console.error('Error checking for alerts:', err);
    }
  };

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
      case 'error':
        return (
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClass} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  const formatTime = (time) => {
    const now = new Date();
    const diff = now - new Date(time);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
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
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount} new
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

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
        <div className="space-y-4">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </p>
                <p className="text-sm text-gray-500">
                  {key === 'lowBalanceAlert' && 'Get notified when account balance is low'}
                  {key === 'highVolumeAlert' && 'Get notified during high payment volumes'}
                  {key === 'failedPaymentAlert' && 'Get notified when payments fail'}
                  {key === 'dailyReport' && 'Receive daily payment summary reports'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
