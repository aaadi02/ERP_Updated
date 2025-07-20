import React, { useState, useEffect } from 'react';
import { getAllBuses } from '../../services/busServices';
import './BusMonitoring.css';

const BusMonitoring = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBus, setSelectedBus] = useState(null);
  const [filter, setFilter] = useState('all'); // all, on-time, delayed, maintenance

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true);
        const response = await getAllBuses();
        // Ensure we're setting an array of buses
        const busesData = Array.isArray(response) ? response : 
                         response.data ? response.data?.data?.buses || [] : [];

        console.log('Fetched buses:', response);
        setBuses(busesData);
      } catch (err) {
        setError('Failed to fetch bus data');
        console.error('Error fetching buses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchBuses, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredBuses = Array.isArray(buses) ? buses.filter(bus => {
    if (filter === 'all') return true;
    return bus.status === filter;
  }) : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'on-time':
        return '#2ecc71';
      case 'delayed':
        return '#e74c3c';
      case 'maintenance':
        return '#f1c40f';
      default:
        return '#95a5a6';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return <div className="loading">Loading bus data...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="bus-monitoring">
      <h2>Bus Monitoring Dashboard</h2>
      
      <div className="filters">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Buses</option>
          <option value="on-time">On Time</option>
          <option value="delayed">Delayed</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className="bus-grid">
        {filteredBuses.map(bus => (
          <div 
            key={bus._id} 
            className="bus-card"
            onClick={() => setSelectedBus(bus)}
          >
            <div className="bus-header">
              <h3>Bus {bus.number}</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(bus.status) }}
              >
                {bus.status || 'Unknown'}
              </span>
            </div>

            <div className="bus-info">
              <div className="info-item">
                <label>Current Location:</label>
                <span>{bus.currentLocation || 'Not set'}</span>
              </div>
              <div className="info-item">
                <label>Next Stop:</label>
                <span>{bus.nextStop || 'Not set'}</span>
              </div>
              <div className="info-item">
                <label>Route:</label>
                <span>{bus.route?.name || 'Not assigned'}</span>
              </div>
              <div className="info-item">
                <label>Driver:</label>
                <span>
                  {bus.driver ? 
                    `${bus.driver.personalInfo?.firstName || ''} ${bus.driver.personalInfo?.lastName || ''}` : 
                    'Not assigned'}
                </span>
              </div>
              <div className="info-item">
                <label>Last Updated:</label>
                <span>{formatDate(bus.updatedAt)}</span>
              </div>
            </div>

            {bus.attendanceData && (
              <div className="attendance-info">
                <h4>Current Attendance</h4>
                <div className="attendance-details">
                  <div className="attendance-item">
                    <label>Direction:</label>
                    <span>{bus.attendanceData.direction || 'Not set'}</span>
                  </div>
                  <div className="attendance-item">
                    <label>Students:</label>
                    <span>{bus.attendanceData.count || 0} / {bus.attendanceData.totalStudents || 0}</span>
                  </div>
                  <div className="attendance-item">
                    <label>Last Count:</label>
                    <span>{formatDate(bus.attendanceData.date)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedBus && (
        <div className="modal" onClick={() => setSelectedBus(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Bus {selectedBus.number} Details</h3>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Location Information</h4>
                <p><strong>Current Location:</strong> {selectedBus.currentLocation || 'Not set'}</p>
                <p><strong>Next Stop:</strong> {selectedBus.nextStop || 'Not set'}</p>
                <p><strong>Status:</strong> {selectedBus.status || 'Unknown'}</p>
                <p><strong>Last Updated:</strong> {formatDate(selectedBus.updatedAt)}</p>
              </div>

              <div className="detail-section">
                <h4>Route Information</h4>
                <p><strong>Route:</strong> {selectedBus.route?.name || 'Not assigned'}</p>
                <p><strong>Driver:</strong> {
                  selectedBus.driver ? 
                    `${selectedBus.driver.personalInfo?.firstName || ''} ${selectedBus.driver.personalInfo?.lastName || ''}` : 
                    'Not assigned'
                }</p>
                <p><strong>Conductor:</strong> {
                  selectedBus.conductor ? 
                    `${selectedBus.conductor.name || 'Not set'}` : 
                    'Not assigned'
                }</p>
              </div>

              {selectedBus.attendanceData && (
                <div className="detail-section">
                  <h4>Attendance Information</h4>
                  <p><strong>Direction:</strong> {selectedBus.attendanceData.direction || 'Not set'}</p>
                  <p><strong>Current Stop:</strong> {selectedBus.attendanceData.stop || 'Not set'}</p>
                  <p><strong>Student Count:</strong> {selectedBus.attendanceData.count || 0}</p>
                  <p><strong>Total Students:</strong> {selectedBus.attendanceData.totalStudents || 0}</p>
                  <p><strong>Last Count:</strong> {formatDate(selectedBus.attendanceData.date)}</p>
                </div>
              )}
            </div>
            <button className="close-button" onClick={() => setSelectedBus(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusMonitoring; 