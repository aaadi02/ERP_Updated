import React, { useState, useEffect } from 'react';
import './BusMonitor.css';

const BusMonitor = ({ busId }) => {
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRouteInfo = async () => {
      try {
        const response = await fetch(`/api/bus/${busId}/route`);
        if (!response.ok) {
          throw new Error('Failed to fetch route information');
        }
        const data = await response.json();
        setRouteInfo(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRouteInfo();
    const interval = setInterval(fetchRouteInfo, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [busId]);

  if (loading) {
    return <div className="loading">Loading route information...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="bus-monitor">
      <div className="route-info">
        <h3>Route Information</h3>
        <div className="route-timeline">
          {routeInfo?.route?.stops?.map((stop, index) => {
            const isCovered = index < routeInfo.currentStopIndex;
            return (
              <div key={index} className="timeline-item">
                <div className={`timeline-dot ${isCovered ? 'covered' : ''}`}></div>
                <div className="timeline-content">
                  <h4>{stop.name}</h4>
                  <p>{stop.time}</p>
                </div>
                {index < routeInfo.route.stops.length - 1 && (
                  <div className={`timeline-line ${isCovered ? 'covered' : ''}`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BusMonitor; 