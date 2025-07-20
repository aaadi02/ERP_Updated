import React from 'react';
import './BusMap.css';

const BusMap = ({ buses }) => {
  // Helper functions for positioning
  const getPositionX = (location) => {
    const positions = {
      'Main Gate': '10%',
      'CSE Block': '30%',
      'Library': '50%',
      'Hostel': '70%',
      'Admin Block': '30%'
    };
    return positions[location] || '10%';
  };

  const getPositionY = (location) => {
    const positions = {
      'Main Gate': '80%',
      'CSE Block': '40%',
      'Library': '60%',
      'Hostel': '20%',
      'Admin Block': '70%'
    };
    return positions[location] || '50%';
  };

  return (
    <div className="bus-map">
      <h3>Bus Locations</h3>
      <div className="map-container">
        {/* Simplified representation of campus map */}
        <div className="campus-map">
          {/* Sample stops */}
          <div className="stop main-gate">Main Gate</div>
          <div className="stop cse-block">CSE Block</div>
          <div className="stop library">Library</div>
          <div className="stop hostel">Hostel</div>
          <div className="stop admin-block">Admin Block</div>
          
          {/* Bus markers */}
          {buses.map(bus => (
            <div 
              key={bus.id} 
              className={`bus-marker ${bus.status}`}
              style={{ 
                left: getPositionX(bus.currentLocation),
                top: getPositionY(bus.currentLocation)
              }}
              title={`Bus ${bus.number} (${bus.driver}) - Next: ${bus.nextStop}`}
            >
              {bus.number}
            </div>
          ))}
        </div>
      </div>
      <div className="map-legend">
        <div><span className="legend on-time"></span> On Time</div>
        <div><span className="legend delayed"></span> Delayed</div>
        <div><span className="legend early"></span> Early</div>
      </div>
    </div>
  );
};

export default BusMap;