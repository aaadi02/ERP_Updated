import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Filter,
  Eye,
  Plus,
  Edit
} from 'lucide-react';

const FacultyAcademicCalendar = ({ userData }) => {
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [filters, setFilters] = useState({
    academicYear: '',
    semester: '',
    status: ''
  });

  useEffect(() => {
    fetchFacultyCalendars();
  }, [filters]);

  const fetchFacultyCalendars = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams();
      
      // Add faculty filter to get only calendars assigned to this faculty
      queryParams.append('faculty', userData._id);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`http://localhost:5000/api/academic-calendar?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setCalendars(data.data.calendars || []);
      } else {
        setError(data.message || 'Failed to fetch calendars');
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
      setError('Failed to load calendars');
    } finally {
      setLoading(false);
    }
  };

  const updateTopicStatus = async (calendarId, topicId, status) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/academic-calendar/${calendarId}/topics/${topicId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh calendars after update
        fetchFacultyCalendars();
      } else {
        alert(data.message || 'Failed to update topic status');
      }
    } catch (error) {
      console.error('Error updating topic status:', error);
      alert('Failed to update topic status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Planned': return 'bg-blue-100 text-blue-800';
      case 'Postponed': return 'bg-orange-100 text-orange-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading Academic Calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                My Academic Calendar
              </h1>
              <p className="text-gray-600">
                View and manage your subject schedules and progress
              </p>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.academicYear}
                onChange={(e) => setFilters(prev => ({ ...prev, academicYear: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Years</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
              </select>
              
              <select
                value={filters.semester}
                onChange={(e) => setFilters(prev => ({ ...prev, semester: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
              
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        {calendars.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Academic Calendars</h3>
            <p className="text-gray-500">No academic calendars have been assigned to you yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {calendars.map((calendar) => (
              <div key={calendar._id} className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{calendar.title}</h3>
                      <p className="text-sm text-gray-600">
                        {calendar.subjectName} | {calendar.academicYear} | Sem {calendar.semester}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(calendar.status)}`}>
                    {calendar.status}
                  </div>
                </div>

                {/* Progress Overview */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                    <span className={`text-lg font-bold ${getProgressColor(calendar.progressPercentage)}`}>
                      {calendar.progressPercentage}%
                    </span>
                  </div>
                  
                  <div className="h-2 bg-gray-200 rounded-full mb-3">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${calendar.progressPercentage}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-gray-500">Completed Hours</div>
                      <div className="font-semibold">{calendar.totalCompletedHours}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">Total Hours</div>
                      <div className="font-semibold">{calendar.totalPlannedHours}</div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Start: {new Date(calendar.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>End: {new Date(calendar.endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Topics Preview */}
                <div className="space-y-2 mb-4">
                  <h4 className="font-semibold text-gray-800">Recent Topics ({calendar.topics?.length || 0} total)</h4>
                  {calendar.topics?.slice(0, 3).map((topic) => (
                    <div key={topic._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{topic.topicName}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(topic.plannedDate).toLocaleDateString()} | {topic.duration}h
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(topic.status)}`}>
                          {topic.status}
                        </span>
                        
                        {topic.status !== 'Completed' && (
                          <button
                            onClick={() => updateTopicStatus(calendar._id, topic._id, 'Completed')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => setSelectedCalendar(selectedCalendar === calendar._id ? null : calendar._id)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {selectedCalendar === calendar._id ? 'Hide Details' : 'View Details'}
                </button>

                {/* Detailed View */}
                {selectedCalendar === calendar._id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold mb-3">All Topics</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {calendar.topics?.map((topic) => (
                        <div key={topic._id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{topic.topicName}</h5>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(topic.status)}`}>
                              {topic.status}
                            </span>
                          </div>
                          
                          {topic.description && (
                            <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                          )}
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                            <div>Planned: {new Date(topic.plannedDate).toLocaleDateString()}</div>
                            <div>Duration: {topic.duration} hours</div>
                            {topic.actualDate && (
                              <div>Actual: {new Date(topic.actualDate).toLocaleDateString()}</div>
                            )}
                            <div>Type: {topic.lectureType}</div>
                          </div>
                          
                          {topic.notes && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
                              <strong>Notes:</strong> {topic.notes}
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="flex gap-2 mt-2">
                            {topic.status !== 'Completed' && (
                              <>
                                <button
                                  onClick={() => updateTopicStatus(calendar._id, topic._id, 'In Progress')}
                                  className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                                >
                                  Start
                                </button>
                                <button
                                  onClick={() => updateTopicStatus(calendar._id, topic._id, 'Completed')}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                >
                                  Complete
                                </button>
                              </>
                            )}
                            {topic.status === 'Planned' && (
                              <button
                                onClick={() => updateTopicStatus(calendar._id, topic._id, 'Postponed')}
                                className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                              >
                                Postpone
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyAcademicCalendar;
