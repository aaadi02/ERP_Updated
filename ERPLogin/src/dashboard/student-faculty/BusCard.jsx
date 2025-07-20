import React from 'react';
import './BusCard.css';

const BusCard = ({ bus }) => {
  const getStatusColor = () => {
    switch(bus.status?.toLowerCase()) {
      case 'on-time': return '#4CAF50';
      case 'delayed': return '#F44336';
      case 'early': return '#FFC107';
      default: return '#2196F3';
    }
  };

  return (
    <div className="bus-card">
      <div className="bus-header">
        <h4>Bus {bus.number}</h4>
        <span 
          className="status-badge"
          style={{ backgroundColor: getStatusColor() }}
        >
          {bus.status}
        </span>
      </div>
      <div className="bus-details">
        <p><strong>Driver:</strong> {bus.driver}</p>
        <p><strong>Contact:</strong> {bus.contact}</p>
        <p><strong>Route:</strong> {bus.route}</p>
        <p><strong>Current Location:</strong> {bus.currentLocation}</p>
        <p><strong>Next Stop:</strong> {bus.nextStop}</p>
      </div>
    </div>
  );
};

export default BusCard;