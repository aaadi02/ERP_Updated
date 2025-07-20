import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { updateBusLocation } from '../../services/busServices';
import { getAllStudents } from '../../services/studentService';
import { getConductorBus } from '../../services/conductorService';
import './LocationUpdate.css';

const LocationUpdate = () => {
  // Get bus data and refresh function from outlet context
  const { bus, refreshBusData } = useOutletContext() || {};
  
  // Extract props from bus data
  const busId = bus?._id;
  const initialLocation = bus?.currentLocation;
  const route = bus?.route;
  const seatingCapacity = bus?.seatingCapacity;

  const [currentLocation, setCurrentLocation] = useState(initialLocation || '');
  const [status, setStatus] = useState('on-time');
  const [alertMessage, setAlertMessage] = useState(''); // Add alert message state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stops, setStops] = useState([]);
  const [routeDirection, setRouteDirection] = useState('departure');
  const [routeStudents, setRouteStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [currentCount, setCurrentCount] = useState(0);

  // Update current location when bus data changes
  useEffect(() => {
    if (bus?.currentLocation) {
      setCurrentLocation(bus.currentLocation);
    }
  }, [bus?.currentLocation]);

  // Fetch all students and filter by route
  useEffect(() => {
    const fetchRouteStudents = async () => {
      try {
        setLoadingStudents(true);
        const allStudents = await getAllStudents();
        console.log('Fetched all students:', allStudents);
        const studentsOnRoute = allStudents.filter(student => 
          student.busService && student.routes === route?.name
        );
        setRouteStudents(studentsOnRoute);
        setCurrentCount(0); // Reset count when route changes
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to fetch student data');
      } finally {
        setLoadingStudents(false);
      }
    };

    if (route && route.name) {
      fetchRouteStudents();
    }
  }, [route?.name]);

  useEffect(() => {
    if (route && route.stops) {
      let sortedStops = [...route.stops];
      if (routeDirection === 'return') {
        sortedStops = sortedStops.reverse();
      }
      setStops(sortedStops);
      setCurrentCount(0); // Reset count when direction changes
    }
  }, [route?.stops, routeDirection]);

  // Show error if no bus data - MOVED AFTER ALL HOOKS
  if (!bus) {
    return (
      <div className="location-update">
        <div className="error-message">
          No bus assigned. Please contact admin to assign a bus.
        </div>
      </div>
    );
  }

  // Get all possible locations including start point, stops, and end point
  const getAllPossibleLocations = () => {
    const locations = [];
    
    if (routeDirection === 'departure') {
      // For departure: start point -> stops -> end point
      if (route?.startPoint) {
        locations.push({ name: route.startPoint, type: 'start' });
      }
      if (stops.length > 0) {
        stops.forEach((stop, index) => {
          locations.push({ name: stop.name, type: 'stop', index: index + 1 });
        });
      }
      if (route?.endPoint) {
        locations.push({ name: route.endPoint, type: 'end' });
      }
    } else {
      // For return: end point -> stops (reversed) -> start point
      if (route?.endPoint) {
        locations.push({ name: route.endPoint, type: 'end' });
      }
      if (stops.length > 0) {
        stops.forEach((stop, index) => {
          locations.push({ name: stop.name, type: 'stop', index: index + 1 });
        });
      }
      if (route?.startPoint) {
        locations.push({ name: route.startPoint, type: 'start' });
      }
    }
    
    return locations;
  };

  const getNextPossibleStops = () => {
    if (!currentLocation) return [];
    const allLocations = getAllPossibleLocations();
    const currentLocationIndex = allLocations.findIndex(loc => loc.name === currentLocation);
    if (currentLocationIndex === -1) return allLocations;
    return allLocations.slice(currentLocationIndex + 1);
  };

  const handleCountChange = (amount) => {
    const busCapacity = seatingCapacity || 50; // Default capacity if not provided
    const maxCount = Math.min(routeStudents.length, busCapacity);
    
    // Always allow manual counting within reasonable limits
    setCurrentCount(prev => Math.min(Math.max(prev + amount, 0), maxCount));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Determine the current location type
      const currentLocationData = getAllPossibleLocations().find(loc => loc.name === currentLocation);
      const isStartPoint = currentLocationData?.type === 'start';
      const isEndPoint = currentLocationData?.type === 'end';
      
      // Use the manually counted student count (no auto-calculation)
      // The conductor will manually count students at all locations
      let finalStudentCount = currentCount;

      const attendanceData = {
        date: new Date().toISOString(),
        route: route?.name || 'Unknown Route',
        direction: routeDirection,
        stop: currentLocation,
        count: finalStudentCount,
        totalStudents: routeStudents.length
      };
      
      // Create the update data object
      const updateData = {
        currentLocation,
        status,
        attendanceData,
        routeDirection
      };

      // Only add alert fields if status is delayed or early
      if (status === 'delayed' || status === 'early') {
        updateData.alertMessage = alertMessage;
        updateData.alertType = status;
      } else {
        updateData.alertMessage = null;
        updateData.alertType = 'normal';
      }

      console.log('Sending data to backend:', updateData);
      
      await updateBusLocation(busId, updateData);

      // Refresh the bus data to reflect the updated location
      try {
        await refreshBusData();
        console.log('Bus data refreshed successfully');
      } catch (refreshError) {
        console.error('Failed to refresh bus data:', refreshError);
      }

      // Update the current count to reflect the auto-calculated value
      setCurrentCount(finalStudentCount);
      
      setSuccess(`Location updated successfully to ${currentLocation} with ${finalStudentCount} students counted`);
      setAlertMessage('');
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-update">
      <h2>Update Bus Location</h2>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Route Direction</label>
          <select
            value={routeDirection}
            onChange={(e) => {
              setRouteDirection(e.target.value);
              setCurrentLocation('');
              setCurrentCount(0);
            }}
            required
          >
            <option value="departure">Departure</option>
            <option value="return">Return</option>
          </select>
        </div>

        <div className="form-group">
          <label>Current Location</label>
          <select
            value={currentLocation}
            onChange={(e) => setCurrentLocation(e.target.value)}
            required
          >
            <option value="">Select Current Location</option>
            
            {getAllPossibleLocations().map((location, index) => (
              <option key={`${location.name}-${location.type}-${index}`} value={location.name}>
                {location.name} ({
                  location.type === 'start' ? 'Start Point' :
                  location.type === 'end' ? 'End Point' :
                  `Stop ${location.index}`
                })
              </option>
            ))}
          </select>
        </div>

        {currentLocation && (
          <div className="student-count">
            <h3>Student Count at {currentLocation}</h3>
            
            {/* Show different information based on location type */}
            {(() => {
              const currentLocationData = getAllPossibleLocations().find(loc => loc.name === currentLocation);
              const isStartPoint = currentLocationData?.type === 'start';
              const isEndPoint = currentLocationData?.type === 'end';
              const isStop = currentLocationData?.type === 'stop';
              
              if (routeDirection === 'departure') {
                if (isStartPoint) {
                  return (
                    <div className="location-info">
                      <p className="location-type">📍 At Starting Point</p>
                      <p className="info-text">Count students as they board</p>
                      
                      {/* Add manual counter for starting point */}
                      <div className="student-count-section">
                        <h4 className="count-title">Students Boarding at Starting Point</h4>
                        <div className="count-controls">
                          <button 
                            type="button" 
                            onClick={() => handleCountChange(-1)}
                            disabled={currentCount <= 0}
                            className="count-btn decrease-btn"
                            title="Remove student"
                          >
                            -1
                          </button>
                          <div className="count-display">
                            <span className="count-number">{currentCount}</span>
                            <span className="count-label">students</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleCountChange(1)}
                            disabled={currentCount >= Math.min(routeStudents.length, seatingCapacity || 50)}
                            className="count-btn increase-btn"
                            title="Add student"
                          >
                            +1
                          </button>
                        </div>
                        <div className="count-info">
                          <p className="count-description">
                            <strong>Students counted:</strong> {currentCount} of {routeStudents.length} total
                          </p>
                          <p className="count-warning">
                            {currentCount >= routeStudents.length ? 
                              '✅ All expected students have boarded' : 
                              `⚠️ ${routeStudents.length - currentCount} students still expected`
                            }
                          </p>
                          {seatingCapacity && currentCount > seatingCapacity && (
                            <p className="capacity-warning">
                              🚨 Warning: Count ({currentCount}) exceeds bus capacity ({seatingCapacity})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                } else if (isEndPoint) {
                  return (
                    <div className="location-info">
                      <p className="location-type">🏁 At Destination (College)</p>
                      <p className="info-text">Count students as they alight</p>
                      
                      {/* Add manual counter for end point */}
                      <div className="student-count-section">
                        <h4 className="count-title">Students Remaining on Bus</h4>
                        <div className="count-controls">
                          <button 
                            type="button" 
                            onClick={() => handleCountChange(1)}
                            disabled={currentCount >= routeStudents.length}
                            className="count-btn increase-btn"
                            title="Student getting off (reduce remaining count)"
                          >
                            -1 Off
                          </button>
                          <div className="count-display">
                            <span className="count-number">{currentCount}</span>
                            <span className="count-label">remaining</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleCountChange(-1)}
                            disabled={currentCount <= 0}
                            className="count-btn decrease-btn"
                            title="Student staying (increase remaining count)"
                          >
                            +1 On
                          </button>
                        </div>
                        <div className="count-info">
                          <p className="count-description">
                            <strong>Students still on bus:</strong> {currentCount} of {routeStudents.length} total
                          </p>
                          <p className="count-warning">
                            {currentCount === 0 ? 
                              '✅ All students have alighted at college' : 
                              `🚌 ${currentCount} students still on bus`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              } else {
                if (isEndPoint) {
                  return (
                    <div className="location-info">
                      <p className="location-type">📍 At Starting Point (College)</p>
                      <p className="info-text">Count students as they board for return journey</p>
                      
                      {/* Add manual counter for return journey start */}
                      <div className="student-count-section">
                        <h4 className="count-title">Students Boarding for Return</h4>
                        <div className="count-controls">
                          <button 
                            type="button" 
                            onClick={() => handleCountChange(-1)}
                            disabled={currentCount <= 0}
                            className="count-btn decrease-btn"
                            title="Remove student"
                          >
                            -1
                          </button>
                          <div className="count-display">
                            <span className="count-number">{currentCount}</span>
                            <span className="count-label">students</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleCountChange(1)}
                            disabled={currentCount >= Math.min(routeStudents.length, seatingCapacity || 50)}
                            className="count-btn increase-btn"
                            title="Add student"
                          >
                            +1
                          </button>
                        </div>
                        <div className="count-info">
                          <p className="count-description">
                            <strong>Students boarding:</strong> {currentCount} of {routeStudents.length} total
                          </p>
                          <p className="count-warning">
                            {currentCount >= routeStudents.length ? 
                              '✅ All expected students have boarded' : 
                              `⚠️ ${routeStudents.length - currentCount} students still expected`
                            }
                          </p>
                          {seatingCapacity && currentCount > seatingCapacity && (
                            <p className="capacity-warning">
                              🚨 Warning: Count ({currentCount}) exceeds bus capacity ({seatingCapacity})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                } else if (isStartPoint) {
                  return (
                    <div className="location-info">
                      <p className="location-type">🏁 At Final Destination</p>
                      <p className="info-text">Count students as they alight at final stop</p>
                      
                      {/* Add manual counter for final destination */}
                      <div className="student-count-section">
                        <h4 className="count-title">Students Remaining on Bus</h4>
                        <div className="count-controls">
                          <button 
                            type="button" 
                            onClick={() => handleCountChange(1)}
                            disabled={currentCount >= routeStudents.length}
                            className="count-btn increase-btn"
                            title="Student getting off"
                          >
                            -1 Off
                          </button>
                          <div className="count-display">
                            <span className="count-number">{currentCount}</span>
                            <span className="count-label">remaining</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleCountChange(-1)}
                            disabled={currentCount <= 0}
                            className="count-btn decrease-btn"
                            title="Student staying on bus"
                          >
                            +1 On
                          </button>
                        </div>
                        <div className="count-info">
                          <p className="count-description">
                            <strong>Students still on bus:</strong> {currentCount} of {routeStudents.length} total
                          </p>
                          <p className="count-warning">
                            {currentCount === 0 ? 
                              '✅ Return journey completed - All students have alighted' : 
                              `🚌 ${currentCount} students still on bus`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              }
              
              // For regular stops, show the count controls
              return (
                <>
                  <div className="student-count-section">
                    <h4 className="count-title">Student Count at This Location</h4>
                    <div className="count-controls">
                      <button 
                        type="button" 
                        onClick={() => handleCountChange(-1)}
                        disabled={routeDirection === 'departure' ? currentCount <= 0 : currentCount >= routeStudents.length}
                        className="count-btn decrease-btn"
                        title={routeDirection === 'departure' ? 'Remove student' : 'Student getting off'}
                      >
                        -1
                      </button>
                      <div className="count-display">
                        <span className="count-number">{currentCount}</span>
                        <span className="count-label">students</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleCountChange(1)}
                        disabled={routeDirection === 'departure' ? currentCount >= routeStudents.length : currentCount <= 0}
                        className="count-btn increase-btn"
                        title={routeDirection === 'departure' ? 'Add student' : 'Student getting on'}
                      >
                        +1
                      </button>
                    </div>
                    <div className="count-info">
                      {routeDirection === 'departure' ? (
                        <>
                          <p className="count-description">
                            <strong>Students boarding:</strong> {currentCount} of {routeStudents.length} total
                          </p>
                          <p className="count-warning">
                            {currentCount >= routeStudents.length ? 
                              '✅ All students have boarded' : 
                              `⚠️ ${routeStudents.length - currentCount} students still waiting`
                            }
                          </p>
                          {seatingCapacity && currentCount > seatingCapacity && (
                            <p className="capacity-warning">
                              🚨 Warning: Count ({currentCount}) exceeds bus capacity ({seatingCapacity})
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="count-description">
                            <strong>Students remaining on bus:</strong> {routeStudents.length - currentCount} of {routeStudents.length} total
                          </p>
                          <p className="count-warning">
                            {currentCount >= routeStudents.length ? 
                              '✅ All students have alighted' : 
                              `🚌 ${routeStudents.length - currentCount} students still on bus`
                            }
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        <div className="form-group">
          <label>Status</label>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            <option value="on-time">On Time</option>
            <option value="delayed">Delayed</option>
            <option value="early">Early</option>
          </select>
        </div>

        {/* Alert Message Input - Show only when status is delayed or early */}
        {(status === 'delayed' || status === 'early') && (
          <div className="form-group">
            <label>Alert Message *</label>
            <textarea
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              placeholder={`Enter ${status} message for students...`}
              required
              rows="3"
              className="alert-textarea"
            />
            <small className="help-text">
              This message will be displayed to students on their dashboard
            </small>
          </div>
        )}

        <div className="total-info">
          <h3>Current Totals</h3>
          <div className="total-stats">
            <div className="stat-item">
              <span className="stat-label">Total Students on Route:</span>
              <span className="stat-value">{routeStudents.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Current Count:</span>
              <span className="stat-value">{currentCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Remaining:</span>
              <span className="stat-value">{routeStudents.length - currentCount}</span>
            </div>
            {seatingCapacity && (
              <div className="stat-item">
                <span className="stat-label">Bus Capacity:</span>
                <span className="stat-value">{seatingCapacity}</span>
              </div>
            )}
          </div>
          
          {/* Manual counting notice */}
          {currentLocation && (
            <div className="auto-calc-notice">
              <p>📋 <strong>Note:</strong> Manually count students at this location. The count will be saved to location history.</p>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading || loadingStudents}>
          {loading ? 'Updating...' : 'Update Location'}
        </button>
      </form>
    </div>
  );
};

export default LocationUpdate;