import React, { useState, useEffect } from "react";
import {
  Plus,
  Save,
  X,
  Book,
  Clock,
  Calendar,
  Users,
  Target,
  AlertCircle
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

export default function CreateSubjectSchedule({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    academicYearId: '',
    semesterId: '',
    subjectId: '',
    facultyId: '',
    departmentId: '',
    totalLecturesRequired: '',
    lectureHours: 1,
    weeklyLectures: '',
    syllabusStartDate: '',
    syllabusEndDate: '',
    syllabusUnits: []
  });

  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAcademicYears();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (formData.academicYearId) {
      fetchSemesters(formData.academicYearId);
    }
  }, [formData.academicYearId]);

  useEffect(() => {
    if (formData.departmentId) {
      fetchSubjectsByDepartment(formData.departmentId);
      // Only fetch faculties by department if no subject is selected
      if (!formData.subjectId) {
        fetchFacultiesByDepartment(formData.departmentId);
      }
    }
  }, [formData.departmentId]);

  useEffect(() => {
    if (formData.subjectId) {
      fetchFacultiesBySubject(formData.subjectId);
    }
  }, [formData.subjectId]);

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get("/academic-calendar-new/academic-year/active");
      if (response.data.success) {
        setAcademicYears([response.data.data]);
        setFormData(prev => ({ ...prev, academicYearId: response.data.data._id }));
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
    }
  };

  const fetchSemesters = async (academicYearId) => {
    try {
      const academicYear = academicYears.find(year => year._id === academicYearId);
      if (academicYear) {
        setSemesters(academicYear.semesters || []);
      }
    } catch (error) {
      console.error("Error fetching semesters:", error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/departments");
      if (response.data.success) {
        setDepartments(response.data.data);
        
        // Auto-select user's department if available
        const userDataStr = localStorage.getItem("user");
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          const userDepartment = response.data.data.find(dept => 
            dept.name.toLowerCase() === userData.department?.toLowerCase()
          );
          if (userDepartment) {
            setFormData(prev => ({ ...prev, departmentId: userDepartment._id }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchSubjectsByDepartment = async (departmentId) => {
    try {
      setLoadingSubjects(true);
      const department = departments.find(dept => dept._id === departmentId);
      if (!department) return;

      const response = await api.get(`/subjects/department/${department.name}`);
      if (response.data.success) {
        setSubjects(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching subjects by department:", error);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchFacultiesByDepartment = async (departmentId) => {
    try {
      setLoadingFaculties(true);
      const department = departments.find(dept => dept._id === departmentId);
      if (!department) return;

      const response = await api.get(`/faculty/department/${department.name}`);
      if (response.data.success) {
        setFaculties(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching faculties by department:", error);
      setFaculties([]);
    } finally {
      setLoadingFaculties(false);
    }
  };

  const fetchFacultiesBySubject = async (subjectId) => {
    try {
      setLoadingFaculties(true);
      const response = await api.get(`/faculty/subject/${subjectId}`);
      if (response.data.success) {
        setFaculties(response.data.data);
        if (response.data.data.length === 0) {
          console.log("No faculties found for this subject");
        }
      }
    } catch (error) {
      console.error("Error fetching faculties by subject:", error);
      setFaculties([]);
    } finally {
      setLoadingFaculties(false);
    }
  };

  const addSyllabusUnit = () => {
    setFormData(prev => ({
      ...prev,
      syllabusUnits: [
        ...prev.syllabusUnits,
        {
          unitNumber: prev.syllabusUnits.length + 1,
          unitName: '',
          topics: [''],
          plannedLectures: '',
          targetEndDate: ''
        }
      ]
    }));
  };

  const updateSyllabusUnit = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      syllabusUnits: prev.syllabusUnits.map((unit, i) => 
        i === index ? { ...unit, [field]: value } : unit
      )
    }));
  };

  const addTopicToUnit = (unitIndex) => {
    setFormData(prev => ({
      ...prev,
      syllabusUnits: prev.syllabusUnits.map((unit, i) => 
        i === unitIndex ? { ...unit, topics: [...unit.topics, ''] } : unit
      )
    }));
  };

  const updateTopic = (unitIndex, topicIndex, value) => {
    setFormData(prev => ({
      ...prev,
      syllabusUnits: prev.syllabusUnits.map((unit, i) => 
        i === unitIndex ? {
          ...unit,
          topics: unit.topics.map((topic, j) => j === topicIndex ? value : topic)
        } : unit
      )
    }));
  };

  const removeSyllabusUnit = (index) => {
    setFormData(prev => ({
      ...prev,
      syllabusUnits: prev.syllabusUnits.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Get user's department ID
      const userDataStr = localStorage.getItem("user");
      const userData = JSON.parse(userDataStr);

      const submitData = {
        ...formData,
        departmentId: userData.departmentId,
        totalLecturesRequired: parseInt(formData.totalLecturesRequired),
        lectureHours: parseInt(formData.lectureHours),
        weeklyLectures: parseInt(formData.weeklyLectures),
        syllabusUnits: formData.syllabusUnits.map(unit => ({
          ...unit,
          plannedLectures: parseInt(unit.plannedLectures),
          topics: unit.topics.filter(topic => topic.trim() !== '')
        }))
      };

      const response = await api.post("/academic-calendar-new/subject-schedule", submitData);
      
      if (response.data.success) {
        alert("Subject schedule created successfully!");
        onSuccess?.();
        onClose?.();
      }
    } catch (error) {
      console.error("Error creating subject schedule:", error);
      if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "Failed to create subject schedule" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Plus className="h-6 w-6 text-blue-600" />
            Create Subject Schedule
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{errors.general}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Book className="h-5 w-5 text-blue-600" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year
                </label>
                <select
                  value={formData.academicYearId}
                  onChange={(e) => setFormData(prev => ({ ...prev, academicYearId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map(year => (
                    <option key={year._id} value={year._id}>{year.year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <select
                  value={formData.semesterId}
                  onChange={(e) => setFormData(prev => ({ ...prev, semesterId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map(semester => (
                    <option key={semester._id} value={semester._id}>
                      {semester.name} (Sem {semester.semesterNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    departmentId: e.target.value,
                    subjectId: '', // Reset subject when department changes
                    facultyId: ''  // Reset faculty when department changes
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(department => (
                    <option key={department._id} value={department._id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    subjectId: e.target.value,
                    facultyId: '' // Clear faculty selection when subject changes
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!formData.departmentId || loadingSubjects}
                >
                  <option value="">
                    {loadingSubjects ? "Loading subjects..." : "Select Subject"}
                  </option>
                  {!loadingSubjects && subjects.length === 0 && formData.departmentId ? (
                    <option value="" disabled>No subjects found for selected department</option>
                  ) : (
                    subjects.map(subject => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name} (Year {subject.year}, Section {subject.section})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Faculty
                </label>
                <select
                  value={formData.facultyId}
                  onChange={(e) => setFormData(prev => ({ ...prev, facultyId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!formData.departmentId || loadingFaculties}
                >
                  <option value="">
                    {loadingFaculties ? "Loading faculty..." : "Select Faculty"}
                  </option>
                  {!loadingFaculties && faculties.length === 0 && formData.subjectId ? (
                    <option value="" disabled>No faculty assigned to this subject</option>
                  ) : !loadingFaculties && faculties.length === 0 && formData.departmentId ? (
                    <option value="" disabled>No faculty found for selected department</option>
                  ) : (
                    faculties.map(faculty => (
                      <option key={faculty._id} value={faculty._id}>
                        {faculty.name} ({faculty.employeeId})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Lecture Planning */}
          <div className="bg-blue-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Lecture Planning
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Lectures Required
                </label>
                <input
                  type="number"
                  value={formData.totalLecturesRequired}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalLecturesRequired: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lecture Hours (each)
                </label>
                <input
                  type="number"
                  value={formData.lectureHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, lectureHours: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="1"
                  step="0.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekly Lectures
                </label>
                <input
                  type="number"
                  value={formData.weeklyLectures}
                  onChange={(e) => setFormData(prev => ({ ...prev, weeklyLectures: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Syllabus Start Date
                </label>
                <input
                  type="date"
                  value={formData.syllabusStartDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, syllabusStartDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Syllabus End Date
                </label>
                <input
                  type="date"
                  value={formData.syllabusEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, syllabusEndDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Calculate total hours display */}
            {formData.totalLecturesRequired && formData.lectureHours && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                <div className="text-sm text-gray-600">
                  Total Hours Required: <span className="font-semibold text-blue-600">
                    {parseInt(formData.totalLecturesRequired) * parseFloat(formData.lectureHours)} hours
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Syllabus Units */}
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Syllabus Units
              </h3>
              <button
                type="button"
                onClick={addSyllabusUnit}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Unit
              </button>
            </div>

            <div className="space-y-4">
              {formData.syllabusUnits.map((unit, index) => (
                <div key={index} className="bg-white rounded-lg border border-green-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Unit {unit.unitNumber}</h4>
                    <button
                      type="button"
                      onClick={() => removeSyllabusUnit(index)}
                      className="text-red-500 hover:bg-red-50 p-1 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Name
                      </label>
                      <input
                        type="text"
                        value={unit.unitName}
                        onChange={(e) => updateSyllabusUnit(index, 'unitName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Planned Lectures
                      </label>
                      <input
                        type="number"
                        value={unit.plannedLectures}
                        onChange={(e) => updateSyllabusUnit(index, 'plannedLectures', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                        min="1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Target End Date
                      </label>
                      <input
                        type="date"
                        value={unit.targetEndDate}
                        onChange={(e) => updateSyllabusUnit(index, 'targetEndDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Topics
                      </label>
                      <button
                        type="button"
                        onClick={() => addTopicToUnit(index)}
                        className="text-green-600 hover:bg-green-50 p-1 rounded text-sm"
                      >
                        + Add Topic
                      </button>
                    </div>
                    {unit.topics.map((topic, topicIndex) => (
                      <input
                        key={topicIndex}
                        type="text"
                        value={topic}
                        onChange={(e) => updateTopic(index, topicIndex, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 mb-2"
                        placeholder={`Topic ${topicIndex + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
