import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Filter,
  X,
  FileText
} from 'lucide-react';
import AcademicCalendarPrint from './AcademicCalendarPrint';

const AcademicCalendar = ({ userData }) => {
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [printCalendar, setPrintCalendar] = useState(null);
  const [filters, setFilters] = useState({
    academicYear: '',
    semester: '',
    status: '',
    subjectId: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);

  useEffect(() => {
    fetchCalendars();
    fetchSubjects();
    fetchFaculty();
  }, [filters]);

  const fetchCalendars = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams();
      
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
        setCalendars(data.data.calendars);
      }
    } catch (error) {
      console.error('Error fetching calendars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/subjects/department/${userData.department}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchFaculty = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/faculty/department/${userData.department}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setFaculty(data.data);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  const handleDeleteCalendar = async (id) => {
    if (window.confirm('Are you sure you want to delete this calendar?')) {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`http://localhost:5000/api/academic-calendar/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          fetchCalendars();
        }
      } catch (error) {
        console.error('Error deleting calendar:', error);
      }
    }
  };

  const handlePublishCalendar = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/academic-calendar/${id}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchCalendars();
      }
    } catch (error) {
      console.error('Error publishing calendar:', error);
    }
  };

  const handlePrintView = (calendar) => {
    setPrintCalendar(calendar);
    setShowPrintView(true);
  };

  // Show print view if selected
  if (showPrintView && printCalendar) {
    return (
      <AcademicCalendarPrint 
        calendar={printCalendar}
        onBack={() => {
          setShowPrintView(false);
          setPrintCalendar(null);
        }}
      />
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      case 'Archived': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="text-blue-600" />
            Academic Calendar
          </h1>
          <p className="text-gray-600 mt-1">Manage subject-wise academic schedules and track progress</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Calendar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={20} className="text-gray-500" />
          <span className="font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.academicYear}
            onChange={(e) => setFilters({...filters, academicYear: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Academic Years</option>
            <option value="2024-25">2024-25</option>
            <option value="2025-26">2025-26</option>
          </select>
          
          <select
            value={filters.semester}
            onChange={(e) => setFilters({...filters, semester: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>

          <select
            value={filters.subjectId}
            onChange={(e) => setFilters({...filters, subjectId: e.target.value})}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject._id} value={subject._id}>{subject.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calendars.map((calendar) => (
          <div key={calendar._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{calendar.title}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <BookOpen size={16} />
                    {calendar.subjectName}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(calendar.status)}`}>
                  {calendar.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Academic Year:</span>
                  <span className="font-medium">{calendar.academicYear}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Semester:</span>
                  <span className="font-medium">{calendar.semester}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Faculty:</span>
                  <span className="font-medium">{calendar.facultyName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Topics:</span>
                  <span className="font-medium">{calendar.topics?.length || 0}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-medium text-gray-900">{calendar.progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getProgressColor(calendar.progressPercentage)}`}
                    style={{ width: `${calendar.progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{calendar.totalPlannedHours}</div>
                  <div className="text-xs text-gray-500">Planned Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{calendar.totalCompletedHours}</div>
                  <div className="text-xs text-gray-500">Completed Hours</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCalendar(calendar)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handlePrintView(calendar)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Print View"
                  >
                    <FileText size={16} />
                  </button>
                  <button
                    onClick={() => {/* Handle edit */}}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCalendar(calendar._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {calendar.status === 'Draft' && (
                  <button
                    onClick={() => handlePublishCalendar(calendar._id)}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition-colors"
                  >
                    Publish
                  </button>
                )}
              </div>

              {/* Published indicator */}
              {calendar.isPublished && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle size={12} />
                  Published
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {calendars.length === 0 && (
        <div className="text-center py-12">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Academic Calendars</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first academic calendar</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Create Calendar
          </button>
        </div>
      )}

      {/* Create/Edit Modal would go here */}
      {showCreateModal && (
        <CreateCalendarModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCalendars();
          }}
          subjects={subjects}
          faculty={faculty}
          userData={userData}
        />
      )}

      {/* Calendar Detail Modal would go here */}
      {selectedCalendar && (
        <CalendarDetailModal
          calendar={selectedCalendar}
          onClose={() => setSelectedCalendar(null)}
          onUpdate={fetchCalendars}
        />
      )}
    </div>
  );
};

// Create Calendar Modal Component
const CreateCalendarModal = ({ isOpen, onClose, onSuccess, subjects, faculty, userData }) => {
  const [formData, setFormData] = useState({
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    semester: '',
    subjectId: '',
    facultyId: '',
    title: '',
    description: '',
    department: userData?.department || '',
    institutionName: 'NAGARJUNA UNIVERSITY',
    startDate: '',
    endDate: '',
    topics: []
  });
  const [newTopic, setNewTopic] = useState({
    name: '',
    description: '',
    plannedDate: '',
    estimatedHours: 1
  });
  const [loading, setLoading] = useState(false);
  const [subjectFaculty, setSubjectFaculty] = useState([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);

  // Fetch faculty when subject changes
  React.useEffect(() => {
    if (formData.subjectId) {
      fetchFacultiesBySubject(formData.subjectId);
    } else {
      setSubjectFaculty(faculty); // Show all department faculty when no subject selected
    }
  }, [formData.subjectId, faculty]);

  // Initialize subject faculty with all faculty
  React.useEffect(() => {
    setSubjectFaculty(faculty);
  }, [faculty]);

  const fetchFacultiesBySubject = async (subjectId) => {
    try {
      setLoadingFaculties(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/faculty/subject/${subjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSubjectFaculty(data.data);
      } else {
        setSubjectFaculty([]);
      }
    } catch (error) {
      console.error('Error fetching faculty by subject:', error);
      setSubjectFaculty([]);
    } finally {
      setLoadingFaculties(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      // Transform topics to match backend schema
      const transformedFormData = {
        ...formData,
        topics: formData.topics.map(topic => ({
          topicName: topic.name,
          description: topic.description,
          plannedDate: topic.plannedDate,
          estimatedHours: topic.estimatedHours,
          status: 'Planned'
        }))
      };
      
      const response = await fetch('http://localhost:5000/api/academic-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(transformedFormData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const error = await response.json();
        alert('Error creating calendar: ' + error.message);
      }
    } catch (error) {
      console.error('Error creating calendar:', error);
      alert('Error creating calendar');
    } finally {
      setLoading(false);
    }
  };

  const addTopic = () => {
    if (newTopic.name && newTopic.plannedDate) {
      setFormData(prev => ({
        ...prev,
        topics: [...prev.topics, { ...newTopic, id: Date.now() }]
      }));
      setNewTopic({
        name: '',
        description: '',
        plannedDate: '',
        estimatedHours: 1
      });
    }
  };

  const removeTopic = (topicId) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic.id !== topicId)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Academic Calendar</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Calendar title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="2024-2025"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData(prev => ({ ...prev, semester: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  subjectId: e.target.value,
                  facultyId: '' // Clear faculty selection when subject changes
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Faculty
              </label>
              <select
                value={formData.facultyId}
                onChange={(e) => setFormData(prev => ({ ...prev, facultyId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loadingFaculties}
              >
                <option value="">
                  {loadingFaculties ? "Loading faculty..." : "Select Faculty"}
                </option>
                {!loadingFaculties && subjectFaculty.length === 0 && formData.subjectId ? (
                  <option value="" disabled>No faculty assigned to this subject</option>
                ) : !loadingFaculties && subjectFaculty.length === 0 ? (
                  <option value="" disabled>No faculty found for this department</option>
                ) : (
                  subjectFaculty.map(f => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.employeeId})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution Name
              </label>
              <input
                type="text"
                value={formData.institutionName}
                onChange={(e) => setFormData(prev => ({ ...prev, institutionName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Institution Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Department"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Optional description for the calendar"
            />
          </div>

          {/* Topics Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Topics/Lessons</h3>
            
            {/* Add New Topic */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Add New Topic</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Topic name"
                  value={newTopic.name}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newTopic.description}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, description: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={newTopic.plannedDate}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, plannedDate: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Hours"
                    min="1"
                    value={newTopic.estimatedHours}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addTopic}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Topics List */}
            {formData.topics.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Added Topics ({formData.topics.length})</h4>
                {formData.topics.map((topic, index) => (
                  <div key={topic.id} className="flex items-center justify-between bg-white p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{topic.name}</div>
                      <div className="text-sm text-gray-600">
                        {topic.description} • {new Date(topic.plannedDate).toLocaleDateString()} • {topic.estimatedHours}h
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTopic(topic.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Calendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Calendar Detail Modal Component
const CalendarDetailModal = ({ calendar, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingTopic, setEditingTopic] = useState(null);
  const [newTopic, setNewTopic] = useState({
    name: '',
    description: '',
    plannedDate: '',
    estimatedHours: 1
  });
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/academic-calendar/${calendar._id}/publish`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onUpdate();
        onClose();
      } else {
        const error = await response.json();
        alert('Error publishing calendar: ' + error.message);
      }
    } catch (error) {
      console.error('Error publishing calendar:', error);
      alert('Error publishing calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async () => {
    if (!newTopic.name || !newTopic.plannedDate) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/academic-calendar/${calendar._id}/topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newTopic),
      });

      if (response.ok) {
        setNewTopic({
          name: '',
          description: '',
          plannedDate: '',
          estimatedHours: 1
        });
        onUpdate();
      } else {
        const error = await response.json();
        alert('Error adding topic: ' + error.message);
      }
    } catch (error) {
      console.error('Error adding topic:', error);
      alert('Error adding topic');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTopic = async (topicId, updates) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/api/academic-calendar/${calendar._id}/topics/${topicId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setEditingTopic(null);
        onUpdate();
      } else {
        const error = await response.json();
        alert('Error updating topic: ' + error.message);
      }
    } catch (error) {
      console.error('Error updating topic:', error);
      alert('Error updating topic');
    } finally {
      setLoading(false);
    }
  };

  if (!calendar) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Academic Calendar Details</h2>
            <p className="text-gray-600">
              {calendar.title} - {calendar.subjectId?.name} ({calendar.subjectId?.code}) - {calendar.academicYear} Semester {calendar.semester}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('topics')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'topics'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Topics ({calendar.topics?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'analytics'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Analytics
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="text-blue-600" size={20} />
                    <span className="font-medium text-blue-800">Subject</span>
                  </div>
                  <p className="text-blue-900">{calendar.subjectId?.name}</p>
                  <p className="text-blue-700 text-sm">{calendar.subjectId?.code}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-green-600" size={20} />
                    <span className="font-medium text-green-800">Academic Year</span>
                  </div>
                  <p className="text-green-900">{calendar.academicYear}</p>
                  <p className="text-green-700 text-sm">Semester {calendar.semester}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-purple-600" size={20} />
                    <span className="font-medium text-purple-800">Total Hours</span>
                  </div>
                  <p className="text-purple-900">
                    {calendar.topics?.reduce((sum, topic) => sum + (topic.estimatedHours || 0), 0) || 0}h
                  </p>
                  <p className="text-purple-700 text-sm">{calendar.topics?.length || 0} topics</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {calendar.status === 'published' ? (
                      <CheckCircle className="text-yellow-600" size={20} />
                    ) : (
                      <AlertCircle className="text-yellow-600" size={20} />
                    )}
                    <span className="font-medium text-yellow-800">Status</span>
                  </div>
                  <p className="text-yellow-900 capitalize">{calendar.status}</p>
                  <p className="text-yellow-700 text-sm">
                    {calendar.status === 'published' ? 'Active' : 'Draft'}
                  </p>
                </div>
              </div>

              {calendar.description && (
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Description</h3>
                  <p className="text-gray-600">{calendar.description}</p>
                </div>
              )}

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Assigned Faculty</h3>
                <p className="text-gray-600">
                  {calendar.facultyId?.name || 'Not assigned'} 
                  {calendar.facultyId?.employeeId && ` (${calendar.facultyId.employeeId})`}
                </p>
              </div>

              {calendar.status === 'draft' && (
                <div className="pt-4 border-t">
                  <button
                    onClick={handlePublish}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Publishing...' : 'Publish Calendar'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Topics Tab */}
          {activeTab === 'topics' && (
            <div className="space-y-6">
              {/* Add New Topic */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">Add New Topic</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  <input
                    type="text"
                    placeholder="Topic name"
                    value={newTopic.name}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={newTopic.description}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, description: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={newTopic.plannedDate}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, plannedDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Hours"
                    min="1"
                    value={newTopic.estimatedHours}
                    onChange={(e) => setNewTopic(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddTopic}
                    disabled={loading || !newTopic.name || !newTopic.plannedDate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Topic'}
                  </button>
                </div>
              </div>

              {/* Topics List */}
              <div className="space-y-3">
                {calendar.topics && calendar.topics.length > 0 ? (
                  calendar.topics.map((topic, index) => (
                    <div key={topic._id || index} className="bg-white border border-gray-200 rounded-lg p-4">
                      {editingTopic === topic._id ? (
                        <EditTopicForm
                          topic={topic}
                          onSave={(updates) => handleUpdateTopic(topic._id, updates)}
                          onCancel={() => setEditingTopic(null)}
                          loading={loading}
                        />
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{topic.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>📅 {new Date(topic.plannedDate).toLocaleDateString()}</span>
                              <span>⏱️ {topic.estimatedHours}h</span>
                              {topic.actualDate && (
                                <span>✅ Completed {new Date(topic.actualDate).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingTopic(topic._id)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                            >
                              <Edit size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No topics added yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Topics Progress</h4>
                  <div className="text-2xl font-bold text-blue-900">
                    {calendar.topics?.filter(t => t.actualDate).length || 0} / {calendar.topics?.length || 0}
                  </div>
                  <p className="text-blue-700 text-sm">Completed</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Hours Planned</h4>
                  <div className="text-2xl font-bold text-green-900">
                    {calendar.topics?.reduce((sum, topic) => sum + (topic.estimatedHours || 0), 0) || 0}
                  </div>
                  <p className="text-green-700 text-sm">Total hours</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">Completion Rate</h4>
                  <div className="text-2xl font-bold text-purple-900">
                    {calendar.topics?.length ? 
                      Math.round((calendar.topics.filter(t => t.actualDate).length / calendar.topics.length) * 100) : 0
                    }%
                  </div>
                  <p className="text-purple-700 text-sm">Overall</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-4">Timeline View</h4>
                <div className="space-y-2">
                  {calendar.topics?.sort((a, b) => new Date(a.plannedDate) - new Date(b.plannedDate)).map((topic, index) => (
                    <div key={topic._id || index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${topic.actualDate ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <div className="flex-1">
                        <span className="font-medium">{topic.name}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({new Date(topic.plannedDate).toLocaleDateString()})
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{topic.estimatedHours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Topic Form Component
const EditTopicForm = ({ topic, onSave, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    name: topic.name || '',
    description: topic.description || '',
    plannedDate: topic.plannedDate ? topic.plannedDate.split('T')[0] : '',
    estimatedHours: topic.estimatedHours || 1,
    actualDate: topic.actualDate ? topic.actualDate.split('T')[0] : '',
    notes: topic.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Topic name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="date"
          value={formData.plannedDate}
          onChange={(e) => setFormData(prev => ({ ...prev, plannedDate: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <input
          type="number"
          placeholder="Estimated hours"
          min="1"
          value={formData.estimatedHours}
          onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="date"
          placeholder="Actual completion date"
          value={formData.actualDate}
          onChange={(e) => setFormData(prev => ({ ...prev, actualDate: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        <input
          type="text"
          placeholder="Notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default AcademicCalendar;
