import React from 'react';
import BusCard from '../student-faculty/BusCard';
import './BusList.css';

const BusList = ({ buses }) => {
  if (!buses || buses.length === 0) {
    return <div className="no-buses">No buses available</div>;
  }

  return (
    <div className="bus-list">
      <h3>Available Buses</h3>
      <div className="buses-container">
        {buses.map(bus => (
          <BusCard 
            key={bus._id} 
            bus={{
              number: bus.number,
              driver: bus.driver ? `${bus.driver.personalInfo?.firstName || ''} ${bus.driver.personalInfo?.lastName || ''}`.trim() : 'Not Assigned',
              contact: bus.driver?.personalInfo?.contactNumber || 'N/A',
              route: bus.route ? `${bus.route.name} (${bus.route.startPoint} → ${bus.route.endPoint})` : 'Not Assigned',
              currentLocation: bus.currentLocation || 'Unknown',
              nextStop: bus.nextStop || 'Not Set',
              status: bus.status || 'Unknown',
              estimatedTime: bus.estimatedTime || 'N/A'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default BusList;