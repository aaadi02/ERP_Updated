import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getConductorDateRangeReports, getConductorLocationHistory } from '../../services/conductorService';
import { getCurrentUser } from '../../services/authService';
import * as XLSX from 'xlsx';
import { FaDownload, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock, FaRoute, FaChartLine, FaInfoCircle, FaSpinner } from 'react-icons/fa';

const DailyReports = () => {
  // Get bus data from outlet context
  const { bus } = useOutletContext() || {};
  
  const [reports, setReports] = useState([]);
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [viewType, setViewType] = useState('daily'); // 'daily' or 'range'

  useEffect(() => {
    // Load today's data by default
    if (bus) {
      fetchDailyReports(selectedDate);
    }
  }, [selectedDate, bus]);

  const fetchDailyReports = async (date) => {
    if (!bus?._id) {
      console.log('No bus assigned, skipping daily reports fetch');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const user = getCurrentUser();
      
      console.log('=== DAILY VIEW DEBUG ===');
      console.log('Daily view - Selected date:', date);
      console.log('Daily view - Formatted date:', formatSelectedDate(date));
      console.log('Daily view - User ID:', user._id);
      console.log('Daily view - Bus ID:', bus._id);
      
      // Create next day for end date to ensure we capture all records for the selected date
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const endDate = nextDay.toISOString().split('T')[0];
      
      console.log('Daily view - API call parameters (using date range):', { startDate: date, endDate: endDate });
      
      // Use date range with next day as end date to capture all records
      const response = await getConductorLocationHistory(user._id, { 
        startDate: date, 
        endDate: endDate
      });
      
      console.log('Daily reports response:', response);
      
      if (response?.data && response.data.length > 0) {
        // Filter results to only include records from the selected date
        const selectedDateStr = date; // YYYY-MM-DD format
        const filteredData = response.data.filter(record => {
          const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
          return recordDate === selectedDateStr;
        });
        
        console.log('Daily view - Total records received:', response.data.length);
        console.log('Daily view - Records for selected date:', filteredData.length);
        
        setReports(filteredData);
        setLocationHistory(filteredData); // Set both so the table shows data
        
        if (filteredData.length > 0) {
          // Log the first record's timestamp for comparison
          console.log('Daily view - First record timestamp:', filteredData[0].timestamp);
        }
      } else {
        setReports([]);
        setLocationHistory([]);
        console.log('Daily view - No data in response or empty array');
        console.log('Daily view - Response.data:', response?.data);
      }
    } catch (err) {
      console.error('Error fetching daily reports:', err);
      setError('Failed to fetch daily reports. Please try again.');
      setReports([]);
      setLocationHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDateRangeReports = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const user = getCurrentUser();
      
      console.log('=== DATE RANGE DEBUG ===');
      console.log('Date range - Start date:', startDate);
      console.log('Date range - End date:', endDate);
      console.log('Date range - User ID:', user._id);
      console.log('Date range - API call parameters:', { startDate, endDate, limit: 1000 });
      
      // Use location history endpoint with date range
      const response = await getConductorLocationHistory(user._id, { 
        startDate, 
        endDate,
        limit: 1000 // Get more records for range view
      });
      
      console.log('Date range response:', response);
      
      if (response?.data) {
        setReports(response.data);
        setLocationHistory([]); // Clear location history for range view
        console.log('Date range - Found', response.data.length, 'records');
        
        if (response.data.length > 0) {
          console.log('Date range - First record timestamp:', response.data[0].timestamp);
        }
      } else {
        setReports([]);
      }
    } catch (err) {
      console.error('Error fetching date range reports:', err);
      setError('Failed to fetch reports for the selected date range');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setError('');
  };

  const handleViewTypeChange = (type) => {
    setViewType(type);
    setError('');
    if (type === 'daily') {
      fetchDailyReports(selectedDate);
    }
  };
  
  const exportToExcel = () => {
    if (viewType === 'daily' && locationHistory.length === 0) {
      setError('No data available to export');
      return;
    }

    const workbook = XLSX.utils.book_new();
    
    if (viewType === 'daily') {
      // Export location history for the selected date
      const historyData = locationHistory.map((record, index) => ({
        'Sr. No.': index + 1,
        'Date': new Date(record.timestamp).toLocaleDateString(),
        'Time': new Date(record.timestamp).toLocaleTimeString(),
        'Location': record.location,
        'Student Count': record.count || record.studentCount || 0,
        'Direction': record.direction || 'N/A',
        'Bus Number': bus?.number || 'N/A',
        'Route': bus?.route?.name || 'N/A'
      }));

      const historySheet = XLSX.utils.json_to_sheet(historyData);
      XLSX.utils.book_append_sheet(workbook, historySheet, 'Location History');

      const fileName = `Daily_Location_History_${selectedDate}_Bus_${bus?.number || 'Unknown'}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } else {
      // Export date range reports
      if (reports.length === 0) {
        setError('No data available to export for the selected date range');
        return;
      }

      const rangeData = reports.map((record, index) => ({
        'Sr. No.': index + 1,
        'Date': new Date(record.timestamp).toLocaleDateString(),
        'Time': new Date(record.timestamp).toLocaleTimeString(),
        'Location': record.location,
        'Student Count': record.count || record.studentCount || 0,
        'Direction': record.direction || 'N/A',
        'Bus Number': record.bus?.number || bus?.number || 'N/A',
        'Route': record.bus?.route?.name || bus?.route?.name || 'N/A'
      }));

      const rangeSheet = XLSX.utils.json_to_sheet(rangeData);
      XLSX.utils.book_append_sheet(workbook, rangeSheet, 'Date Range History');

      const fileName = `Location_History_${startDate}_to_${endDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    // Ensure we're working with a valid date
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSelectedDate = (dateString) => {
    // Handle YYYY-MM-DD format from date input
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLocationStats = () => {
    if (viewType === 'daily' && locationHistory.length > 0) {
      const totalStudents = locationHistory.reduce((sum, entry) => sum + (entry.count || entry.studentCount || 0), 0);
      const avgStudents = Math.floor(totalStudents / locationHistory.length);
      const uniqueLocations = new Set(locationHistory.map(entry => entry.location)).size;
      const timeSpan = locationHistory.length > 1 ? 
        new Date(locationHistory[locationHistory.length - 1].timestamp) - new Date(locationHistory[0].timestamp) : 0;
      const hours = Math.floor(timeSpan / (1000 * 60 * 60));
      const minutes = Math.floor((timeSpan % (1000 * 60 * 60)) / (1000 * 60));

      return {
        totalUpdates: locationHistory.length,
        avgStudents,
        uniqueLocations,
        timeSpan: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
      };
    }
    return null;
  };

  const stats = getLocationStats();

  // Show loading or no bus message
  if (!bus) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FaInfoCircle className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Daily Reports</h1>
              <p className="text-gray-100 text-sm lg:text-base">No bus assigned. Please contact admin.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <FaChartLine className="text-2xl" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Daily Reports</h1>
              <p className="text-green-100 text-sm lg:text-base">
                {bus ? `Bus ${bus.number} - ${bus.route?.name || 'No route'}` : 'Loading bus info...'}
              </p>
            </div>
          </div>
          
          <button
            onClick={exportToExcel}
            disabled={loading || (viewType === 'daily' ? locationHistory.length === 0 : reports.length === 0)}
            className="bg-white bg-opacity-10 hover:bg-opacity-20 disabled:bg-opacity-5 disabled:cursor-not-allowed rounded-lg px-6 py-3 backdrop-blur-sm transition-all duration-200 flex items-center space-x-2"
          >
            <FaDownload className="text-sm" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* View Type Selector */}
          <div className="flex space-x-4">
            <button
              onClick={() => handleViewTypeChange('daily')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewType === 'daily'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily View
            </button>
            <button
              onClick={() => handleViewTypeChange('range')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewType === 'range'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Date Range
            </button>
          </div>

          {/* Date Controls */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {viewType === 'daily' ? (
              <div className="flex items-center space-x-2">
                <FaCalendarAlt className="text-gray-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="Start Date"
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500 self-center">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="End Date"
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={fetchDateRangeReports}
                  disabled={loading || !startDate || !endDate}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {loading ? <FaSpinner className="animate-spin" /> : 'Fetch'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <FaInfoCircle className="text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats for Daily View */}
      {viewType === 'daily' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FaClock className="text-blue-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total Updates</p>
                <p className="font-semibold text-gray-900">{stats.totalUpdates}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <FaUsers className="text-green-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Avg Students</p>
                <p className="font-semibold text-gray-900">{stats.avgStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <FaMapMarkerAlt className="text-purple-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Locations</p>
                <p className="font-semibold text-gray-900">{stats.uniqueLocations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <FaRoute className="text-orange-600" />
              </div>
              <div>
                <p className="text-gray-600 text-sm">Duration</p>
                <p className="font-semibold text-gray-900">{stats.timeSpan}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <FaSpinner className="animate-spin text-blue-600 text-3xl" />
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      )}

      {/* Data Display */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {viewType === 'daily' ? `Location History - ${formatSelectedDate(selectedDate)}` : 'Date Range Results'}
            </h3>
          </div>

          <div className="overflow-x-auto">
            {viewType === 'daily' ? (
              locationHistory.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {locationHistory.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(record.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <FaMapMarkerAlt className="text-blue-500 text-sm" />
                            <span className="text-sm text-gray-900">{record.location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {record.count || record.studentCount || 0} students
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {record.direction || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <FaInfoCircle className="text-gray-400 text-3xl mx-auto mb-4" />
                  <p className="text-gray-600">No location history found for {formatSelectedDate(selectedDate)}</p>
                  <p className="text-gray-500 text-sm mt-1">Try selecting a different date or update your location.</p>
                </div>
              )
            ) : (
              reports.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reports.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(record.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTime(record.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <FaMapMarkerAlt className="text-blue-500 text-sm" />
                            <span className="text-sm text-gray-900">{record.location}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {record.count || record.studentCount || 0} students
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                          {record.direction || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <FaInfoCircle className="text-gray-400 text-3xl mx-auto mb-4" />
                  <p className="text-gray-600">No data found for the selected date range</p>
                  <p className="text-gray-500 text-sm mt-1">Try selecting a different date range.</p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReports;
