import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Book,
  Users,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  BookOpen,
  Plus,
  Filter,
  BarChart3
} from "lucide-react";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include JWT token
api.interceptors?.request?.use?.(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default function AcademicCalendar() {
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('faculty'); // 'faculty' or 'hod'
  const [activeAcademicYear, setActiveAcademicYear] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    fetchActiveAcademicYear();
    fetchCalendarData();
  }, [selectedView]);

  const fetchActiveAcademicYear = async () => {
    try {
      const response = await api.get("/academic-calendar-new/academic-year/active");
      if (response.data.success) {
        setActiveAcademicYear(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching active academic year:", error);
    }
  };

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const userDataStr = localStorage.getItem("user");
      const userData = JSON.parse(userDataStr);
      
      let endpoint;
      if (selectedView === 'faculty') {
        endpoint = `/academic-calendar-new/faculty/${userData.employeeId}`;
      } else {
        // HOD view - assuming user has departmentId
        endpoint = `/academic-calendar-new/department/${userData.departmentId}`;
      }
      
      const response = await api.get(endpoint);
      if (response.data.success) {
        setCalendarData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      setError("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (actual, expected) => {
    if (actual >= expected) return "text-green-600 bg-green-100";
    if (actual >= expected - 10) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getProgressBarColor = (actual, expected) => {
    if (actual >= expected) return "bg-green-500";
    if (actual >= expected - 10) return "bg-yellow-500";
    return "bg-red-500";
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
                Academic Calendar
              </h1>
              <p className="text-gray-600">
                {activeAcademicYear ? `Academic Year: ${activeAcademicYear.year}` : "Manage your academic schedule and syllabus progress"}
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedView('faculty')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedView === 'faculty'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Faculty View
              </button>
              <button
                onClick={() => setSelectedView('hod')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedView === 'hod'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                HOD View
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Content */}
        {calendarData.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-8 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Calendar Data</h3>
            <p className="text-gray-500">No academic calendar has been set up yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {calendarData.map((semesterData, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
                {/* Semester Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <Calendar className="h-6 w-6 text-blue-600" />
                      {semesterData.semester.name} (Semester {semesterData.semester.semesterNumber})
                    </h2>
                    <p className="text-gray-600">
                      {new Date(semesterData.semester.startDate).toLocaleDateString()} - 
                      {new Date(semesterData.semester.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Semester Stats */}
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Working Days</div>
                    <div className="text-xl font-bold text-blue-600">{semesterData.semester.workingDays || 'TBD'}</div>
                  </div>
                </div>

                {/* Subjects */}
                {selectedView === 'faculty' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {semesterData.subjects.map((subject) => (
                      <div
                        key={subject._id}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedSubject(selectedSubject === subject._id ? null : subject._id)}
                      >
                        {/* Subject Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Book className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{subject.subject.name}</h3>
                              <p className="text-sm text-gray-600">
                                Year {subject.subject.year} | Section {subject.subject.section}
                              </p>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressColor(subject.progress.percentageCompleted, subject.expectedProgress)}`}>
                            {subject.progress.percentageCompleted}%
                          </div>
                        </div>

                        {/* Progress Overview */}
                        <div className="space-y-3">
                          {/* Lecture Progress */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Lectures Completed</span>
                              <span>{subject.progress.lecturesCompleted}/{subject.totalLecturesRequired}</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div
                                className={`h-full rounded-full ${getProgressBarColor(subject.progress.percentageCompleted, subject.expectedProgress)}`}
                                style={{ width: `${subject.progress.percentageCompleted}%` }}
                              />
                            </div>
                          </div>

                          {/* Time Info */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-gray-50 rounded-lg p-2">
                              <div className="text-xs text-gray-500">Total Hours</div>
                              <div className="font-semibold">{subject.totalHoursRequired}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <div className="text-xs text-gray-500">Weekly</div>
                              <div className="font-semibold">{subject.weeklyLectures}</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                              <div className="text-xs text-gray-500">Days Left</div>
                              <div className="font-semibold">{subject.daysRemaining}</div>
                            </div>
                          </div>

                          {/* Expected vs Actual Progress */}
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-blue-500" />
                              <span>Expected: {subject.expectedProgress}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className={subject.progress.actualPace === 'ahead' ? 'text-green-600' : 
                                              subject.progress.actualPace === 'behind' ? 'text-red-600' : 'text-yellow-600'}>
                                {subject.progress.actualPace}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Detailed View */}
                        {selectedSubject === subject._id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              Syllabus Units
                            </h4>
                            <div className="space-y-2">
                              {subject.syllabusUnits.map((unit, unitIndex) => (
                                <div key={unitIndex} className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-medium">Unit {unit.unitNumber}: {unit.unitName}</h5>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      unit.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      unit.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                      unit.status === 'delayed' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {unit.status.replace('-', ' ')}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600 mb-2">
                                    Lectures: {unit.completedLectures}/{unit.plannedLectures}
                                  </div>
                                  {unit.targetEndDate && (
                                    <div className="text-xs text-gray-500">
                                      Target: {new Date(unit.targetEndDate).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-4">
                              <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                Log Lecture
                              </button>
                              <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                                Update Progress
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  // HOD View - Department Overview
                  <div className="space-y-4">
                    {Object.entries(semesterData.years || {}).map(([year, yearData]) => (
                      <div key={year} className="border border-gray-200 rounded-xl p-4">
                        <h3 className="text-lg font-semibold mb-4">Year {year}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {yearData.subjects.map((subject) => (
                            <div key={subject._id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{subject.subject.name}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs ${getProgressColor(subject.progress.percentageCompleted, 50)}`}>
                                  {subject.progress.percentageCompleted}%
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                Faculty: {subject.faculty.firstName} {subject.faculty.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {subject.progress.lecturesCompleted}/{subject.totalLecturesRequired} lectures
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
