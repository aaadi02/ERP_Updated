import { useState, useEffect } from "react";
import axios from "axios";
import { Save, Edit3, Plus, Trash2, Clock, BookOpen, Calendar, Check, X } from "lucide-react";

export default function TimetableSimple({ userData }) {
  // Core state - minimal and focused
  const [timetable, setTimetable] = useState({
    department: '',
    semester: '',
    section: '',
    schedule: [] // Will contain days and time slots
  });

  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectFacultyMap, setSubjectFacultyMap] = useState({}); // Maps subject to its assigned faculties
  const [conflictingFaculties, setConflictingFaculties] = useState({}); // Track faculty conflicts by day/time
  const [facultySchedules, setFacultySchedules] = useState({}); // Track all faculty schedules for advanced display
  const [ccAssignment, setCcAssignment] = useState(null); // Current user's CC assignment
  const [currentTimetableId, setCurrentTimetableId] = useState(null); // Track current timetable ID for deletion
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [isEditingTimeSlots, setIsEditingTimeSlots] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState({ start: '', end: '', isBreak: false });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Default structure - simple 6-day week with 6 periods
  const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DEFAULT_TIME_SLOTS = [
    '09:00-10:00',
    '10:00-11:00',
    '11:15-12:15', // Break after 2nd period
    '12:15-13:15',
    '14:00-15:00', // Lunch break
    '15:00-16:00'
  ];

  // Initialize with default time slots
  useEffect(() => {
    setTimeSlots(DEFAULT_TIME_SLOTS.map(slot => ({
      timeSlot: slot,
      isBreak: slot === '11:15-12:15'
    })));
  }, []);

  // Initialize userData and fetch CC assignment
  useEffect(() => {
    if (userData?.employeeId) {
      fetchCCAssignment();
    }
  }, [userData]);

  // Auto-load timetable when CC assignment is fetched
  useEffect(() => {
    if (ccAssignment && userData?.employeeId) {
      loadTimetable();
    }
  }, [ccAssignment, userData?.employeeId]);

  // Fetch user's CC assignment
  const fetchCCAssignment = async () => {
    setLoading(true);
    console.log('Starting fetchCCAssignment...');
    console.log('userData:', userData);
    console.log('authToken available:', !!localStorage.getItem("authToken"));

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMessage('No authentication token found. Please log in.');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/cc/my-cc-assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Full API response:', response.data);

      if (response.data?.success && response.data.data?.ccAssignments?.length > 0) {
        const assignment = response.data.data.ccAssignments[0]; // Use first CC assignment
        console.log('CC Assignment data received:', assignment);
        setCcAssignment(assignment);

        // Auto-fill timetable info from CC assignment
        setTimetable(prev => ({
          ...prev,
          department: assignment.department,
          semester: assignment.semester,
          section: assignment.section
        }));

        console.log('Timetable state updated with:', {
          department: assignment.department,
          semester: assignment.semester,
          section: assignment.section
        });

        // Load department data
        await loadDepartmentData(assignment.department);
        setMessage(`CC Assignment loaded: ${assignment.department} - Sem ${assignment.semester} - Sec ${assignment.section}`);
      } else {
        setMessage('No CC assignment found. You may not have permission to create timetables.');
      }
    } catch (error) {
      console.error('Error fetching CC assignment:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.status === 401) {
        setMessage('Authentication failed. Please log in again.');
      } else if (error.response?.status === 404) {
        setMessage('Faculty record not found. Please contact admin.');
      } else {
        setMessage(`Failed to fetch CC assignment: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load department subjects and faculties
  const loadDepartmentData = async (department) => {
    if (!department) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const headers = { Authorization: `Bearer ${token}` };

      // Load subjects for the department
      const subjectsRes = await axios.get(
        `http://localhost:5000/api/subjects/department/${encodeURIComponent(department)}`,
        { headers }
      );

      if (subjectsRes.data?.success) {
        const subjectsList = subjectsRes.data.data || [];
        setSubjects(subjectsList);

        // Build subject-faculty mapping using the new API
        await buildSubjectFacultyMap(department, headers);
      }

      // Load all teaching faculties for the department (for reference)
      const facultiesRes = await axios.get(
        "http://localhost:5000/api/faculty/faculties",
        { params: { department, teachingOnly: 'true' }, headers },
      );

      const facultyList = facultiesRes.data?.data?.faculties || facultiesRes.data?.faculties || [];
      setFaculties(facultyList.map(f => ({
        id: f.employeeId || f._id,
        name: `${f.firstName} ${f.lastName || ''}`.trim(),
        employeeId: f.employeeId
      })));

      // Load existing timetable conflicts
      await loadConflictingFaculties();

    } catch (error) {
      console.error('Error loading department data:', error);

      // Provide more specific error messages
      if (error.response?.status === 401 || error.response?.status === 403) {
        setMessage('Authentication failed. Please refresh the page and log in again.');
      } else if (error.response?.status === 500) {
        setMessage('Server error while loading department data. Please try again or contact support.');
      } else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        setMessage('Cannot connect to server. Please ensure the backend is running.');
      } else {
        setMessage(`Failed to load department data: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Build mapping of subjects to their assigned faculties using the new API
  const buildSubjectFacultyMap = async (department, headers) => {
    try {
      console.log('Building subject-faculty map for department:', department);

      // Use the new dedicated API endpoint
      const response = await axios.get(
        `http://localhost:5000/api/faculty-dept-subject/department-faculty-subjects/${encodeURIComponent(department)}`,
        { headers }
      );

      if (response.data?.success) {
        const { subjectFacultyMap } = response.data.data;

        // Convert the API response to the format expected by the frontend
        const mapping = {};
        Object.entries(subjectFacultyMap).forEach(([subjectName, data]) => {
          mapping[subjectName] = data.faculties || [];
        });

        setSubjectFacultyMap(mapping);
        console.log('Subject-faculty mapping loaded:', mapping);

        // Show success message
        const totalAssignments = Object.values(mapping).reduce((sum, faculties) => sum + faculties.length, 0);
        setMessage(`Loaded ${Object.keys(mapping).length} subjects with ${totalAssignments} faculty assignments`);
      } else {
        console.error('Failed to load subject-faculty mapping:', response.data);

        // Fallback: Try to build mapping manually from individual faculty records
        console.log('Attempting fallback method to load faculty-subject assignments...');
        await buildSubjectFacultyMapFallback(department, headers);
      }
    } catch (error) {
      console.error('Error building subject-faculty map:', error);

      // Check for authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        setMessage('Authentication failed. Please refresh the page and log in again.');
        return;
      }

      // For other errors, try fallback method
      console.log('Attempting fallback method due to API error...');
      await buildSubjectFacultyMapFallback(department, headers);
    }
  };

  // Fallback method to build subject-faculty mapping
  const buildSubjectFacultyMapFallback = async (department, headers) => {
    try {
      console.log('Using fallback method to build subject-faculty mapping...');

      // Get all faculties for the department
      const facultiesRes = await axios.get(
        "http://localhost:5000/api/faculty/faculties",
        { params: { department, teachingOnly: 'true' }, headers }
      );

      const facultyList = facultiesRes.data?.data?.faculties || facultiesRes.data?.faculties || [];
      console.log('Faculties found:', facultyList.length);

      // Build mapping by checking each faculty's subjects
      const mapping = {};

      for (const faculty of facultyList) {
        const facultyName = `${faculty.firstName} ${faculty.lastName || ''}`.trim();
        const subjectsTaught = faculty.subjectsTaught || [];

        console.log(`Faculty ${facultyName} teaches:`, subjectsTaught);

        // Handle both populated and non-populated subjects
        subjectsTaught.forEach(subject => {
          let subjectName = '';

          if (typeof subject === 'string') {
            subjectName = subject;
          } else if (subject && subject.name) {
            subjectName = subject.name;
          } else if (subject && subject._id) {
            // If it's just an ObjectId, we'll need to fetch the subject details
            return; // Skip for now, handle separately if needed
          }

          if (subjectName) {
            if (!mapping[subjectName]) {
              mapping[subjectName] = [];
            }

            // Check if faculty is already added for this subject
            const facultyExists = mapping[subjectName].some(f => f.name === facultyName);
            if (!facultyExists) {
              mapping[subjectName].push({
                name: facultyName,
                employeeId: faculty.employeeId || faculty._id,
                id: faculty._id
              });
            }
          }
        });
      }

      setSubjectFacultyMap(mapping);
      console.log('Fallback subject-faculty mapping loaded:', mapping);

      const totalAssignments = Object.values(mapping).reduce((sum, faculties) => sum + faculties.length, 0);
      setMessage(`Loaded ${Object.keys(mapping).length} subjects with ${totalAssignments} faculty assignments (fallback method)`);

    } catch (fallbackError) {
      console.error('Fallback method also failed:', fallbackError);

      // Check for authentication errors
      if (fallbackError.response?.status === 401 || fallbackError.response?.status === 403) {
        setMessage('Authentication failed. Please refresh the page and log in again.');
      } else if (fallbackError.response?.status === 500) {
        setMessage('Server error. The backend may need to be restarted or there may be a database issue.');
      } else if (fallbackError.code === 'ECONNREFUSED' || fallbackError.message?.includes('Network Error')) {
        setMessage('Cannot connect to server. Please ensure the backend is running on port 5000.');
      } else {
        setMessage(`Failed to load subject-faculty assignments: ${fallbackError.response?.data?.message || fallbackError.message}`);
      }

      setSubjectFacultyMap({});
    }
  };

  // Load conflicting faculties from existing timetables (ADVANCED VERSION)
  const loadConflictingFaculties = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get('http://localhost:5000/api/timetable', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allTimetables = response.data || [];

      const conflicts = {};
      const facultySchedules = {}; // Track all faculty schedules for better visualization

      console.log('🔍 Loading conflicts from', allTimetables.length, 'timetables');

      allTimetables.forEach(timetable => {
        const ttInfo = `${timetable.collegeInfo?.department || 'Unknown'} - ${timetable.collegeInfo?.semester || 'Unknown'} - ${timetable.collegeInfo?.section || 'Unknown'}`;

        // Skip current user's exact timetable (same dept, sem, section)
        const isCurrentTimetable = ccAssignment &&
          timetable.collegeInfo?.department === ccAssignment.department &&
          timetable.collegeInfo?.semester === ccAssignment.semester &&
          timetable.collegeInfo?.section === ccAssignment.section;

        timetable.timetableData?.forEach(day => {
          day.classes?.forEach(cls => {
            if (cls && cls.faculty && cls.timeSlot) {
              const conflictKey = `${day.day}_${cls.timeSlot}`;
              const facultyKey = cls.faculty;

              // Initialize conflict tracking
              if (!conflicts[conflictKey]) conflicts[conflictKey] = [];
              if (!facultySchedules[facultyKey]) facultySchedules[facultyKey] = [];

              // Add conflict info with details
              const conflictInfo = {
                faculty: cls.faculty,
                subject: cls.subject || 'Unknown Subject',
                timetableInfo: ttInfo,
                isCurrentTimetable: isCurrentTimetable,
                day: day.day,
                timeSlot: cls.timeSlot
              };

              // Only add to conflicts if it's NOT the current timetable
              if (!isCurrentTimetable) {
                conflicts[conflictKey].push(cls.faculty);
              }

              // Always add to faculty schedules for visualization
              facultySchedules[facultyKey].push(conflictInfo);
            }
          });
        });
      });

      console.log('📊 Conflict summary:', {
        totalConflictSlots: Object.keys(conflicts).length,
        totalFacultySchedules: Object.keys(facultySchedules).length
      });

      setConflictingFaculties(conflicts);

      // Store faculty schedules for advanced display
      setFacultySchedules(facultySchedules);

    } catch (error) {
      console.error('Error loading faculty conflicts:', error);
    }
  };

  // Initialize empty timetable
  const initializeTimetable = () => {
    const schedule = DEFAULT_DAYS.map(day => ({
      day,
      periods: timeSlots.map(slot => ({
        timeSlot: slot.timeSlot,
        subject: '',
        faculty: '',
        type: slot.isBreak ? 'Break' : 'Theory'
      }))
    }));

    setTimetable(prev => ({ ...prev, schedule }));
    setCurrentTimetableId(null); // Clear current timetable ID for new timetable
    setIsEditing(true);
  };

  // Add new time slot
  const addTimeSlot = () => {
    if (!newTimeSlot.start || !newTimeSlot.end) {
      setMessage('Please enter both start and end times');
      return;
    }

    const timeSlotString = `${newTimeSlot.start}-${newTimeSlot.end}`;

    if (timeSlots.some(slot => slot.timeSlot === timeSlotString)) {
      setMessage('This time slot already exists');
      return;
    }

    const newSlot = {
      timeSlot: timeSlotString,
      isBreak: newTimeSlot.isBreak
    };

    setTimeSlots(prev => [...prev, newSlot]);
    setNewTimeSlot({ start: '', end: '', isBreak: false });
    setMessage('Time slot added successfully!');

    // Update existing timetable if it exists
    if (timetable.schedule.length > 0) {
      const updatedSchedule = timetable.schedule.map(day => ({
        ...day,
        periods: [...day.periods, {
          timeSlot: timeSlotString,
          subject: '',
          faculty: '',
          type: newTimeSlot.isBreak ? 'Break' : 'Theory'
        }]
      }));
      setTimetable(prev => ({ ...prev, schedule: updatedSchedule }));
    }
  };

  // Remove time slot
  const removeTimeSlot = (timeSlotToRemove) => {
    setTimeSlots(prev => prev.filter(slot => slot.timeSlot !== timeSlotToRemove));

    // Update existing timetable if it exists
    if (timetable.schedule.length > 0) {
      const updatedSchedule = timetable.schedule.map(day => ({
        ...day,
        periods: day.periods.filter(period => period.timeSlot !== timeSlotToRemove)
      }));
      setTimetable(prev => ({ ...prev, schedule: updatedSchedule }));
    }

    setMessage('Time slot removed successfully!');
  };

  // Toggle break status of time slot
  const toggleBreakStatus = (timeSlotToToggle) => {
    setTimeSlots(prev => prev.map(slot =>
      slot.timeSlot === timeSlotToToggle
        ? { ...slot, isBreak: !slot.isBreak }
        : slot
    ));

    // Update existing timetable if it exists
    if (timetable.schedule.length > 0) {
      const updatedSchedule = timetable.schedule.map(day => ({
        ...day,
        periods: day.periods.map(period =>
          period.timeSlot === timeSlotToToggle
            ? { ...period, type: period.type === 'Break' ? 'Theory' : 'Break', subject: '', faculty: '' }
            : period
        )
      }));
      setTimetable(prev => ({ ...prev, schedule: updatedSchedule }));
    }

    setMessage('Time slot updated successfully!');
  };

  // Update a specific cell in the timetable
  const updateCell = async (dayIndex, periodIndex, field, value) => {
    setTimetable(prev => {
      const newSchedule = [...prev.schedule];
      const currentPeriod = newSchedule[dayIndex].periods[periodIndex];

      // If subject is changed, clear faculty and auto-select if only one option
      if (field === 'subject') {
        currentPeriod.subject = value;
        currentPeriod.faculty = ''; // Clear faculty when subject changes

        console.log(`[UPDATE_CELL] Subject changed to: "${value}"`);

        // Get available faculties for this subject
        const availableFaculties = getAvailableFacultiesForSubject(value, newSchedule[dayIndex].day, currentPeriod.timeSlot);

        console.log(`[UPDATE_CELL] Available faculties:`, availableFaculties);

        // Auto-select if only one faculty is available
        if (availableFaculties.length === 1) {
          currentPeriod.faculty = availableFaculties[0].name;
          setMessage(`Auto-selected faculty: ${availableFaculties[0].name} for ${value}`);
          console.log(`[UPDATE_CELL] Auto-selected faculty: ${availableFaculties[0].name}`);
        } else if (availableFaculties.length === 0 && value) {
          console.log(`[UPDATE_CELL] No faculties found locally, trying API...`);
          // Try to fetch from API if not in local map
          getFacultiesForSubject(value).then(apiFaculties => {
            console.log(`[UPDATE_CELL] API returned faculties:`, apiFaculties);
            if (apiFaculties.length === 1) {
              setTimetable(prevTimetable => {
                const updatedSchedule = [...prevTimetable.schedule];
                updatedSchedule[dayIndex].periods[periodIndex].faculty = apiFaculties[0].name;
                return { ...prevTimetable, schedule: updatedSchedule };
              });
              setMessage(`Auto-selected faculty: ${apiFaculties[0].name} for ${value}`);
            } else if (apiFaculties.length > 1) {
              setMessage(`${apiFaculties.length} faculties available for ${value}. Please select one.`);
            } else {
              setMessage(`No faculty assigned to teach ${value}. Please contact admin.`);
            }
          }).catch(error => {
            console.error('[UPDATE_CELL] API call failed:', error);
            setMessage(`Unable to load faculty for ${value}. Please try again.`);
          });
        } else if (availableFaculties.length > 1) {
          setMessage(`${availableFaculties.length} faculties available for ${value}. Please select one.`);
        }
      } else {
        currentPeriod[field] = value;
        console.log(`[UPDATE_CELL] Updated ${field} to: "${value}"`);
      }

      return { ...prev, schedule: newSchedule };
    });
  };

  // Get available faculties for a subject (ADVANCED VERSION with cross-class conflict detection)
  const getAvailableFacultiesForSubject = (subjectName, day, timeSlot) => {
    if (!subjectName) return [];

    console.log(`[ADVANCED_DEBUG] Checking faculty for subject: "${subjectName}" on ${day} at ${timeSlot}`);
    console.log(`[ADVANCED_DEBUG] Available subjects in map:`, Object.keys(subjectFacultyMap));

    // Get faculties assigned to this subject - try exact match first
    let assignedFaculties = subjectFacultyMap[subjectName] || [];

    // If no exact match, try case-insensitive match
    if (assignedFaculties.length === 0) {
      const subjectKey = Object.keys(subjectFacultyMap).find(
        key => key.toLowerCase() === subjectName.toLowerCase()
      );
      if (subjectKey) {
        assignedFaculties = subjectFacultyMap[subjectKey] || [];
        console.log(`[ADVANCED_DEBUG] Found case-insensitive match for "${subjectName}" -> "${subjectKey}"`);
      }
    }

    // If still no match, try partial match
    if (assignedFaculties.length === 0) {
      const subjectKey = Object.keys(subjectFacultyMap).find(
        key => key.toLowerCase().includes(subjectName.toLowerCase()) ||
          subjectName.toLowerCase().includes(key.toLowerCase())
      );
      if (subjectKey) {
        assignedFaculties = subjectFacultyMap[subjectKey] || [];
        console.log(`[ADVANCED_DEBUG] Found partial match for "${subjectName}" -> "${subjectKey}"`);
      }
    }

    console.log(`[ADVANCED_DEBUG] Assigned faculties for "${subjectName}":`, assignedFaculties);

    if (assignedFaculties.length === 0) {
      console.log(`[ADVANCED_DEBUG] No faculty assigned to subject: ${subjectName}`);
      return [];
    }

    // ADVANCED CONFLICT DETECTION
    const conflictKey = `${day}_${timeSlot}`;
    const conflictedFaculties = conflictingFaculties[conflictKey] || [];

    const availableFaculties = assignedFaculties.filter(faculty => {
      const isConflicted = conflictedFaculties.includes(faculty.name);

      if (isConflicted) {
        console.log(`[CONFLICT_DETECTED] ${faculty.name} is busy at ${day} ${timeSlot} in another class`);
      }

      return !isConflicted;
    });

    // Add faculty schedule info for better UX
    const facultiesWithScheduleInfo = availableFaculties.map(faculty => {
      const facultySchedule = facultySchedules[faculty.name] || [];
      const conflictsAtThisTime = facultySchedule.filter(
        schedule => schedule.day === day && schedule.timeSlot === timeSlot
      );

      return {
        ...faculty,
        scheduleInfo: {
          totalClasses: facultySchedule.length,
          conflictsAtThisTime: conflictsAtThisTime,
          hasConflict: conflictsAtThisTime.length > 0
        }
      };
    });

    console.log(`[ADVANCED_DEBUG] Available faculties for ${subjectName} at ${day} ${timeSlot}:`, facultiesWithScheduleInfo);

    return facultiesWithScheduleInfo;
  };

  // Get faculty assignment for a specific subject using the API
  const getFacultiesForSubject = async (subjectName) => {
    if (!subjectName || !ccAssignment) return [];

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(
        `http://localhost:5000/api/faculty-subject/subject-faculty-by-name/${encodeURIComponent(subjectName)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { department: ccAssignment.department }
        }
      );

      if (response.data?.success) {
        return response.data.data.faculties || [];
      }
    } catch (error) {
      console.error('Error fetching faculties for subject:', error);
    }

    return [];
  };

  // Save timetable
  const saveTimetable = async () => {
    if (!ccAssignment) {
      setMessage('No CC assignment found. Cannot save timetable.');
      return;
    }

    if (!timetable.department || !timetable.semester || !timetable.section) {
      setMessage('Please ensure all basic information is filled');
      return;
    }

    if (!timetable.schedule || timetable.schedule.length === 0) {
      setMessage('Please create a timetable schedule first.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");

      // Prepare data in the backend expected format
      const payload = {
        collegeInfo: {
          name: 'College Name', // Make this configurable if needed
          status: 'Active',
          department: timetable.department,
          semester: timetable.semester,
          section: timetable.section,
          date: new Date().toISOString().split('T')[0]
        },
        subjects: subjects.map(subject => ({
          code: subject.code || '',
          name: subject.name,
          faculty: subject.faculty || ''
        })),
        timetableData: timetable.schedule.map(day => ({
          day: day.day,
          classes: day.periods
            .filter(period => period.subject && period.type !== 'Break')
            .map(period => ({
              subject: period.subject,
              faculty: period.faculty,
              type: period.type || 'Theory',
              timeSlot: period.timeSlot,
              colSpan: 1
            }))
        })),
        timeSlots: timeSlots.map(slot => slot.timeSlot)
      };

      console.log('Saving timetable payload:', payload);

      const response = await axios.post('http://localhost:5000/api/timetable', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.success) {
        setMessage('Timetable saved successfully!');
        setIsEditing(false);
        console.log('Timetable saved:', response.data.data);

        // Store the new timetable ID for future operations
        if (response.data.data && response.data.data._id) {
          setCurrentTimetableId(response.data.data._id);
        }

        // Reload conflicts after saving
        loadConflictingFaculties();
      } else {
        throw new Error(response.data?.message || 'Failed to save timetable');
      }
    } catch (error) {
      console.error('Error saving timetable:', error);

      if (error.response?.status === 403) {
        setMessage('Access denied. You can only create timetables for your assigned class.');
      } else if (error.response?.status === 409) {
        setMessage('A timetable already exists for this department, semester, and section.');
      } else if (error.response?.data?.error) {
        setMessage(`Failed to save: ${error.response.data.error}`);
      } else {
        setMessage('Failed to save timetable. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Load existing timetable
  const loadTimetable = async () => {
    if (!ccAssignment) {
      console.log('No CC assignment available for loading timetable');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:5000/api/timetable', {
        params: {
          department: ccAssignment.department
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Load timetable response:', response.data);

      // Handle new response format - could be array or single object
      let timetableData = null;

      if (Array.isArray(response.data)) {
        // Find timetable matching our CC assignment
        timetableData = response.data.find(tt =>
          tt.collegeInfo?.department === ccAssignment.department &&
          tt.collegeInfo?.semester === ccAssignment.semester &&
          tt.collegeInfo?.section === ccAssignment.section
        );
      } else if (response.data && response.data.collegeInfo) {
        timetableData = response.data;
      }

      if (timetableData) {
        console.log('Found matching timetable:', timetableData);

        // Store timetable ID for deletion
        setCurrentTimetableId(timetableData._id);

        // Load custom time slots if available
        if (timetableData.timeSlots && Array.isArray(timetableData.timeSlots)) {
          const loadedTimeSlots = timetableData.timeSlots.map(slot => ({
            timeSlot: slot,
            isBreak: slot.includes('11:15') || slot.includes('Break')
          }));
          setTimeSlots(loadedTimeSlots);
        }

        // Load timetable schedule
        if (timetableData.timetableData && Array.isArray(timetableData.timetableData)) {
          const schedule = DEFAULT_DAYS.map(day => {
            const dayData = timetableData.timetableData.find(d => d.day === day);

            if (dayData && dayData.classes) {
              const periods = timeSlots.map(timeSlot => {
                const classData = dayData.classes.find(c => c.timeSlot === timeSlot.timeSlot);
                return {
                  timeSlot: timeSlot.timeSlot,
                  subject: classData?.subject || '',
                  faculty: classData?.faculty || '',
                  type: classData?.type || (timeSlot.isBreak ? 'Break' : 'Theory')
                };
              });

              return { day, periods };
            } else {
              // Create empty periods for days without data
              return {
                day,
                periods: timeSlots.map(timeSlot => ({
                  timeSlot: timeSlot.timeSlot,
                  subject: '',
                  faculty: '',
                  type: timeSlot.isBreak ? 'Break' : 'Theory'
                }))
              };
            }
          });

          setTimetable(prev => ({
            ...prev,
            schedule
          }));
        }

        setMessage('Timetable loaded successfully!');
        console.log('Timetable loaded and set');
      } else {
        console.log('No matching timetable found');
        setMessage('No existing timetable found for your assignment.');
      }
    } catch (error) {
      console.error('Error loading timetable:', error);
      if (error.response?.status === 404) {
        setMessage('No existing timetable found.');
      } else if (error.response?.data?.error) {
        setMessage(`Failed to load: ${error.response.data.error}`);
      } else {
        setMessage('Failed to load existing timetable.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete timetable function
  const deleteTimetable = async () => {
    if (!currentTimetableId) {
      setMessage('No timetable found to delete.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");

      const response = await axios.delete(
        `http://localhost:5000/api/timetable/${currentTimetableId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data?.success) {
        setMessage('Timetable deleted successfully!');

        // Clear current timetable data
        setTimetable(prev => ({
          ...prev,
          schedule: []
        }));
        setCurrentTimetableId(null);
        setIsEditing(false);
        setShowDeleteConfirmation(false);

        // Reload conflicts after deletion
        loadConflictingFaculties();

        console.log('Timetable deleted:', response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to delete timetable');
      }
    } catch (error) {
      console.error('Error deleting timetable:', error);

      if (error.response?.status === 403) {
        setMessage('Access denied. You can only delete timetables for your assigned class.');
      } else if (error.response?.status === 404) {
        setMessage('Timetable not found. It may have been already deleted.');
      } else if (error.response?.data?.error) {
        setMessage(`Failed to delete: ${error.response.data.error}`);
      } else {
        setMessage('Failed to delete timetable. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <Calendar className="h-6 w-6 text-blue-600" />
          Course Timetable
        </h1>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' :
            message.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
            {message}
          </div>
        )}
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          Basic Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <div className="w-full p-3 border border-blue-200 rounded-lg bg-blue-50">
              <div className="font-medium text-gray-800">
                {timetable.department || (ccAssignment ? 'Loading...' : 'No CC Assignment')}
              </div>

            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
            <div className="w-full p-3 border border-blue-200 rounded-lg bg-blue-50">
              <div className="font-medium text-gray-800">
                {timetable.semester || (ccAssignment ? 'Loading...' : 'No CC Assignment')}
              </div>

            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
            <div className="w-full p-3 border border-blue-200 rounded-lg bg-blue-50">
              <div className="font-medium text-gray-800">
                {timetable.section || (ccAssignment ? 'Loading...' : 'No CC Assignment')}
              </div>

            </div>
          </div>
        </div>




      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Loading...</span>
            </div>
          )}
          {!loading && !ccAssignment && (
            <div className="text-orange-600 text-sm">
              Please wait while we load your CC assignment...
            </div>
          )}
          {!loading && ccAssignment && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                <Edit3 className="h-4 w-4" />
                Edit Timetable
              </button>
              <button
                onClick={initializeTimetable}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                <Plus className="h-4 w-4" />
                Create New
              </button>
              <button
                onClick={() => setIsEditingTimeSlots(!isEditingTimeSlots)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Clock className="h-4 w-4" />
                {isEditingTimeSlots ? 'Done' : 'Manage Time Slots'}
              </button>
              {currentTimetableId && (
                <button
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Timetable
                </button>
              )}
            </>
          )}
          {!loading && ccAssignment && isEditing && (
            <>
              <button
                onClick={saveTimetable}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Timetable'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Debug Panel - Show Faculty-Subject Mapping */}
      {ccAssignment && isEditing && Object.keys(subjectFacultyMap).length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 Subject-Faculty Assignments (Debug)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {Object.entries(subjectFacultyMap).map(([subject, faculties]) => (
              <div key={subject} className="bg-white p-2 rounded border">
                <div className="font-medium text-gray-800">{subject}</div>
                <div className="text-gray-600 mt-1">
                  {faculties.length > 0 ? (
                    faculties.map(faculty => faculty.name || faculty.firstName || 'Unknown').join(', ')
                  ) : (
                    <span className="text-orange-600">No faculty assigned</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADVANCED: Real-time Faculty Schedule Panel */}
      {ccAssignment && isEditing && Object.keys(facultySchedules).length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
          <h3 className="text-sm font-semibold text-purple-800 mb-3">
            🕒 Real-time Faculty Schedules (Cross-Class View)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {Object.entries(facultySchedules).slice(0, 6).map(([facultyName, schedules]) => (
              <div key={facultyName} className="bg-white p-3 rounded border border-purple-100 shadow-sm">
                <div className="font-medium text-purple-800 mb-2">👩‍🏫 {facultyName}</div>
                <div className="space-y-1">
                  {schedules
                    .filter(s => !s.isCurrentTimetable) // Only show other classes
                    .slice(0, 3)
                    .map((schedule, idx) => (
                      <div key={idx} className="text-xs">
                        <div className="text-purple-700">
                          📚 {schedule.subject}
                        </div>
                        <div className="text-purple-600">
                          🕐 {schedule.day} {schedule.timeSlot}
                        </div>
                        <div className="text-purple-500 text-xs">
                          🏫 {schedule.timetableInfo}
                        </div>
                        <hr className="my-1 border-purple-100" />
                      </div>
                    ))}
                  {schedules.filter(s => !s.isCurrentTimetable).length === 0 && (
                    <div className="text-green-600 text-xs">✅ No other classes assigned</div>
                  )}
                  {schedules.filter(s => !s.isCurrentTimetable).length > 3 && (
                    <div className="text-purple-500 text-xs">
                      ... and {schedules.filter(s => !s.isCurrentTimetable).length - 3} more classes
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {Object.keys(facultySchedules).length > 6 && (
            <div className="mt-3 text-center text-purple-600 text-xs">
              Showing 6 of {Object.keys(facultySchedules).length} faculty schedules
            </div>
          )}
        </div>
      )}

      {/* Time Slot Management */}
      {isEditingTimeSlots && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            Manage Time Slots
          </h2>

          {/* Add New Time Slot */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="text-md font-semibold text-purple-800 mb-3">Add New Time Slot</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={newTimeSlot.start}
                  onChange={(e) => setNewTimeSlot(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={newTimeSlot.end}
                  onChange={(e) => setNewTimeSlot(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newTimeSlot.isBreak}
                    onChange={(e) => setNewTimeSlot(prev => ({ ...prev, isBreak: e.target.checked }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Break Period</span>
                </label>
              </div>
              <div>
                <button
                  onClick={addTimeSlot}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Slot
                </button>
              </div>
            </div>
          </div>

          {/* Current Time Slots */}
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-3">Current Time Slots</h3>
            <div className="space-y-2">
              {timeSlots.map((slot, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-800">{slot.timeSlot}</span>
                    {slot.isBreak && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        Break
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBreakStatus(slot.timeSlot)}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${slot.isBreak
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                    >
                      {slot.isBreak ? 'Make Class' : 'Make Break'}
                    </button>
                    <button
                      onClick={() => removeTimeSlot(slot.timeSlot)}
                      className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      {timetable.schedule?.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Weekly Schedule
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700">Day</th>
                  {timeSlots.map((slot, index) => (
                    <th key={index} className="border border-gray-300 p-3 text-center font-semibold text-gray-700 min-w-[200px]">
                      {slot.timeSlot}
                      {slot.isBreak && (
                        <div className="text-xs text-yellow-600 mt-1">Break</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timetable.schedule.map((day, dayIndex) => (
                  <tr key={dayIndex}>
                    <td className="border border-gray-300 p-3 font-semibold bg-gray-50 text-gray-700">
                      {day.day}
                    </td>
                    {day.periods.map((period, periodIndex) => (
                      <td key={periodIndex} className="border border-gray-300 p-2">
                        {period.type === 'Break' ? (
                          <div className="text-center py-4 bg-yellow-50 text-yellow-700 font-medium rounded">
                            BREAK
                          </div>
                        ) : isEditing ? (
                          <div className="space-y-2">
                            <select
                              value={period.subject}
                              onChange={(e) => updateCell(dayIndex, periodIndex, 'subject', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Subject</option>
                              {subjects.map((subject, idx) => (
                                <option key={idx} value={subject.name}>
                                  {subject.name}
                                </option>
                              ))}
                            </select>
                            <select
                              value={period.faculty}
                              onChange={(e) => updateCell(dayIndex, periodIndex, 'faculty', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                              disabled={!period.subject}
                            >
                              <option value="">
                                {period.subject ? 'Select Faculty' : 'Select Subject First'}
                              </option>
                              {period.subject && getAvailableFacultiesForSubject(period.subject, day.day, period.timeSlot).map((faculty, idx) => (
                                <option key={idx} value={faculty.name}>
                                  {faculty.name}
                                  {faculty.scheduleInfo?.hasConflict ? ' (⚠️ Busy in other class)' : ''}
                                </option>
                              ))}
                              {period.subject && getAvailableFacultiesForSubject(period.subject, day.day, period.timeSlot).length === 0 && (
                                <option value="" disabled>No available faculty</option>
                              )}
                            </select>

                            {/* ADVANCED CONFLICT WARNINGS */}
                            {period.subject && getAvailableFacultiesForSubject(period.subject, day.day, period.timeSlot).length === 0 && (
                              <div className="text-xs text-red-600 mt-1 p-2 bg-red-50 rounded border border-red-200">
                                🚫 <strong>All faculties busy:</strong> Every faculty assigned to teach "{period.subject}" is occupied in other classes at this time.
                              </div>
                            )}

                            {/* Show specific conflict info for selected faculty */}
                            {period.faculty && facultySchedules[period.faculty] && (
                              <div className="text-xs mt-1 p-2 bg-blue-50 rounded border border-blue-200">
                                <div className="font-medium text-blue-800">📅 {period.faculty}'s Schedule Info:</div>
                                {facultySchedules[period.faculty]
                                  .filter(schedule => schedule.day === day.day && schedule.timeSlot === period.timeSlot && !schedule.isCurrentTimetable)
                                  .map((conflict, idx) => (
                                    <div key={idx} className="text-blue-700 text-xs mt-1">
                                      🏫 Teaching "{conflict.subject}" in {conflict.timetableInfo}
                                    </div>
                                  ))
                                }
                                {facultySchedules[period.faculty].filter(s => !s.isCurrentTimetable).length === 0 && (
                                  <div className="text-green-700 text-xs">✅ Free at this time slot</div>
                                )}
                              </div>
                            )}

                            {period.subject && subjectFacultyMap[period.subject]?.length === 0 && getAvailableFacultiesForSubject(period.subject, day.day, period.timeSlot).length === 0 && (
                              <div className="text-xs text-yellow-600 mt-1 p-2 bg-yellow-50 rounded border border-yellow-200">
                                ⚠️ <strong>No faculty assigned:</strong> No faculty has been assigned to teach this subject. Please contact admin.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center space-y-1">
                            {period.subject ? (
                              <>
                                <div className="font-medium text-gray-800">{period.subject}</div>
                                <div className="text-sm text-gray-600">{period.faculty}</div>
                              </>
                            ) : (
                              <div className="text-gray-400 py-4">Empty</div>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Timetable</h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                Are you sure you want to delete this timetable? This action cannot be undone.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <div className="text-sm text-gray-700">
                  <strong>Department:</strong> {timetable.department}
                </div>
                <div className="text-sm text-gray-700">
                  <strong>Semester:</strong> {timetable.semester}
                </div>
                <div className="text-sm text-gray-700">
                  <strong>Section:</strong> {timetable.section}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={deleteTimetable}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Timetable
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
