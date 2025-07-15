import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Search,
  User,
  ChevronDown,
  ChevronUp,
  Clock,
  BookOpen,
  Briefcase,
  UserCheck,
  Clipboard,
  X,
  Award,
  Trash2,
} from "lucide-react";
import { 
  fetchFacultyByDepartment, 
  fetchCCAssignmentsByDepartment, 
  fetchSubjects 
} from "../../utils/departmentUtils";

function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  if (month >= 6) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

export default function DepartmentFaculty({ userData }) {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [expandedFaculty, setExpandedFaculty] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("assign"); // "assign", "details", or "assignSubject"
  const [userDepartment, setUserDepartment] = useState("");
  const [selectedYear, setSelectedYear] = useState(getCurrentAcademicYear());
  const [selectedYearGroup, setSelectedYearGroup] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [assignSuccess, setAssignSuccess] = useState(null);
  const [ccAssignments, setCCAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]); // New state for subjects
  const [assignSubjectSuccess, setAssignSubjectSuccess] = useState(null); // New state for subject assignment feedback

  const currentAcademicYear = getCurrentAcademicYear();
  const academicYears = [
    `${parseInt(currentAcademicYear.split("-")[0], 10) - 1}-${parseInt(
      currentAcademicYear.split("-")[0],
      10
    )}`,
    currentAcademicYear,
    `${parseInt(currentAcademicYear.split("-")[1], 10)}-${
      parseInt(currentAcademicYear.split("-")[1], 10) + 1
    }`,
  ];
  const yearOptions = [
    { value: "1", label: "1st Year" },
    { value: "2", label: "2nd Year" },
    { value: "3", label: "3rd Year" },
    { value: "4", label: "4th Year" },
  ];
  const sections = ["A", "B", "C", "D"];

  const normalizeDepartment = (dept) =>
    dept ? dept.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "";

  const [lastFetchedDepartment, setLastFetchedDepartment] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const fetchingRef = useRef(false); // Use ref to track fetching state

  // Memoized fetchData function to prevent repeated calls
  const fetchAllData = useCallback(
    async (department) => {
      console.log("[DepartmentFaculty] fetchAllData called - fetchingRef:", fetchingRef.current, "department:", department);
      
      if (fetchingRef.current || !department) {
        console.log("[DepartmentFaculty] Skipping fetchAllData - already fetching or no department");
        return;
      }

      fetchingRef.current = true;
      setIsFetching(true);
      try {
        setLoading(true);
        setError(null);

        console.log("[DepartmentFaculty] Calling fetchFacultyByDepartment with:", department);
        const result = await fetchFacultyByDepartment(department);
        console.log("[DepartmentFaculty] fetchFacultyByDepartment result:", result);
        
        if (result.success) {
          console.log("[DepartmentFaculty] Successfully fetched", result.count, "faculty members for", result.department);
          console.log("[DepartmentFaculty] Faculty data structure:", result.faculties.slice(0, 2));
          setFaculties(result.faculties || []);
          setUserDepartment(result.department);
          // Set filter department to user's department to ensure only their department's faculty is shown
          setFilterDepartment(result.department);
        } else {
          console.error("[DepartmentFaculty] fetchFacultyByDepartment failed:", result.error);
          throw new Error(result.error || 'Failed to fetch faculty data');
        }
      } catch (err) {
        console.error("[DepartmentFaculty] Error fetching faculty:", err);
        setError(err.message);
        setFaculties([]);
      } finally {
        setLoading(false);
        setIsFetching(false);
        fetchingRef.current = false;
      }
    },
    [] // Remove isFetching from dependencies to prevent recreation
  );

  useEffect(() => {
    const currentDepartment = userData?.department;

    console.log("[DepartmentFaculty] useEffect triggered with userData:", {
      userData: userData,
      department: currentDepartment,
      userDataKeys: userData ? Object.keys(userData) : 'No userData'
    });

    // Only proceed if we have a valid department from userData
    if (!currentDepartment) {
      console.log("[DepartmentFaculty] No department in userData, skipping fetch");
      setLoading(false);
      return;
    }

    // Normalize the department name for consistent comparison
    const normalizedCurrentDept = normalizeDepartment(currentDepartment);
    const normalizedLastFetched = normalizeDepartment(lastFetchedDepartment);

    console.log("[DepartmentFaculty] Department comparison:", {
      current: normalizedCurrentDept,
      lastFetched: normalizedLastFetched,
      areEqual: normalizedCurrentDept === normalizedLastFetched,
      fetchingRef: fetchingRef.current
    });

    // Skip if we've already fetched for this department or if currently fetching
    if (normalizedCurrentDept === normalizedLastFetched || fetchingRef.current) {
      if (fetchingRef.current) {
        console.log("[DepartmentFaculty] Already fetching, skipping");
      } else {
        console.log("[DepartmentFaculty] Already fetched for this department, skipping");
      }
      return;
    }

    console.log("[DepartmentFaculty] Fetching faculty for department:", currentDepartment);
    fetchAllData(currentDepartment);
    setLastFetchedDepartment(normalizedCurrentDept);
  }, [userData?.department, lastFetchedDepartment, fetchAllData]);

  const fetchCCAssignments = async () => {
    try {
      const department = userData?.department;
      if (!department) {
        console.log("[CCAssignmentsFetch] No department in userData");
        return;
      }

      console.log("[CCAssignmentsFetch] Fetching assignments for exact department:", department);
      
      try {
        const result = await fetchCCAssignmentsByDepartment(department);
        
        if (result.success) {
          console.log(`[CCAssignmentsFetch] Successfully fetched ${result.assignments.length} assignments`);
          setCCAssignments(result.assignments);
        } else {
          console.log("[CCAssignmentsFetch] No assignments found");
          setCCAssignments([]);
        }
      } catch (err) {
        console.warn(`[CCAssignmentsFetch] Failed:`, err);
        setCCAssignments([]);
      }
    } catch (err) {
      console.error("[CCAssignmentsFetch] Error:", err);
      setCCAssignments([]);
    }
  };

  const fetchSubjectsData = async () => {
    try {
      const department = userData?.department;
      if (!department) {
        console.log("[SubjectsFetch] No department in userData");
        setSubjects([]);
        return;
      }

      console.log("[SubjectsFetch] Fetching subjects for exact department:", department);
      const result = await fetchSubjects(department);
      
      if (result.success) {
        console.log("[SubjectsFetch] Subjects fetched successfully:", result.subjects.length);
        console.log("[SubjectsFetch] Subjects data:", result.subjects);
        setSubjects(result.subjects);
      } else {
        console.error("[SubjectsFetch] Error:", result.error);
        setAssignSubjectSuccess(`Error fetching subjects: ${result.error}`);
        setSubjects([]);
      }
    } catch (err) {
      console.error("[SubjectsFetch] Error:", err);
      setAssignSubjectSuccess(`Error fetching subjects: ${err.message}`);
      setSubjects([]);
    }
  };

  useEffect(() => {
    // Only fetch CC assignments and subjects if we have valid userData with department
    if (userData?.department) {
      fetchCCAssignments();
      fetchSubjectsData();
    }
  }, [userData?.department]);

  // Debug: Track subjects state changes
  useEffect(() => {
    console.log("[DepartmentFaculty] Subjects state changed:", {
      count: subjects.length,
      subjects: subjects.map(s => ({ name: s.name, dept: s.department, id: s._id }))
    });
  }, [subjects]);

  const filteredFaculties = faculties.filter((faculty) => {
    // Handle both name formats - API returns 'name' field, some may have firstName/lastName
    const fullName = faculty.name || `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim();
    const firstName = faculty.firstName || faculty.name?.split(' ')[0] || '';
    
    const matchesSearch =
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faculty.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || faculty.type === filterType;
    
    // Since we're fetching faculty by the user's exact department, 
    // all returned faculty should belong to that department
    // No need for complex department matching - just show all fetched faculty
    const matchesDepartment = true;

    return matchesSearch && matchesType && matchesDepartment;
  });

  const sortedFaculties = [...filteredFaculties].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") {
      const nameA = a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim();
      const nameB = b.name || `${b.firstName || ''} ${b.lastName || ''}`.trim();
      comparison = nameA.localeCompare(nameB);
    } else if (sortBy === "department") {
      comparison = (a.department || "").localeCompare(b.department || "");
    } else if (sortBy === "dateOfJoining") {
      comparison =
        new Date(a.dateOfJoining || 0) - new Date(b.dateOfJoining || 0);
    } else if (sortBy === "experience") {
      comparison = (a.teachingExperience || 0) - (b.teachingExperience || 0);
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Debug: Log the data to see what's happening
  console.log("[DepartmentFaculty] Debug Data:", {
    facultiesCount: faculties.length,
    filteredCount: filteredFaculties.length,
    sortedCount: sortedFaculties.length,
    userDepartment,
    userDataDepartment: userData?.department,
    filterType,
    searchTerm,
    subjectsCount: subjects.length,
    loadingState: loading,
    errorState: error,
    lastFetchedDepartment,
    isFetching,
    fetchingRefCurrent: fetchingRef.current,
    facultySample: faculties.slice(0, 2).map(f => ({ 
      id: f._id, 
      name: f.name, 
      dept: f.department,
      type: f.type,
      email: f.email
    })),
    subjectsPreview: subjects.slice(0, 3).map(s => ({ name: s.name, dept: s.department })),
    allFacultyDepartments: [...new Set(faculties.map(f => f.department))],
    facultiesPreview: faculties.slice(0, 3).map(f => ({ id: f._id, name: f.name, dept: f.department })),
    filteredFacultiesPreview: filteredFaculties.slice(0, 3).map(f => ({ id: f._id, name: f.name, dept: f.department })),
    facultyStructure: faculties.length > 0 ? Object.keys(faculties[0]) : [],
    fetchAllDataFunction: typeof fetchAllData,
    ccAssignmentsCount: ccAssignments.length
  });

  const handleExpandFaculty = (facultyId) => {
    setExpandedFaculty((prev) => (prev === facultyId ? null : facultyId));
  };

  const handleViewDetails = (faculty) => {
    setSelectedFaculty(faculty);
    setModalMode("details");
    setShowModal(true);
    setAssignSuccess(null);
    setAssignSubjectSuccess(null);
  };

  const handleAssignCCClick = (faculty) => {
    // Check if faculty is eligible (only teaching type can become CC)
    if (faculty.type !== "teaching" && faculty.type !== "cc") {
      alert("Only teaching faculty can be assigned as Course Coordinator");
      return;
    }

    setSelectedFaculty(faculty);
    setModalMode("assign");
    setSelectedYear(getCurrentAcademicYear());
    setSelectedYearGroup("");
    setSelectedSection("");
    setAssignSuccess(null);
    setAssignSubjectSuccess(null);
    setShowModal(true);
  };

  const handleAssignSubjectClick = (faculty) => {
    setSelectedFaculty(faculty);
    setModalMode("assignSubject");
    setAssignSuccess(null);
    setAssignSubjectSuccess(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFaculty(null);
    setSelectedYear(getCurrentAcademicYear());
    setSelectedYearGroup("");
    setSelectedSection("");
    setAssignSuccess(null);
    setAssignSubjectSuccess(null);
    setModalMode("assign");
  };

  const handleAssignCC = async () => {
    if (!selectedYear || !selectedYearGroup || !selectedSection) {
      setAssignSuccess("Please select academic year, semester, and section.");
      return;
    }

    // Check if faculty is eligible (only teaching or already cc type)
    if (selectedFaculty.type !== "teaching" && selectedFaculty.type !== "cc") {
      setAssignSuccess("Error: Only teaching faculty can be assigned as Course Coordinator");
      return;
    }

    try {
      // Validate that the selected faculty belongs to the user's department
      const userDept = (userData?.department || '').toLowerCase().trim();
      const facultyDept = (selectedFaculty.department || '').toLowerCase().trim();
      
      // More flexible department matching to handle variations
      const departmentsMatch = userDept === facultyDept || 
        userDept.includes('electronic') && facultyDept.includes('electronic') ||
        userDept.includes('eletronic') && facultyDept.includes('eletronic');
      
      if (!departmentsMatch) {
        console.error("[AssignCC] Department mismatch:", { userDept, facultyDept, selectedFaculty });
        setAssignSuccess(`Error: Cannot assign faculty from ${selectedFaculty.department} to ${userData?.department} department`);
        return;
      }
      
      // Use the original department name from userData (let backend handle corrections)
      const department = userData?.department || selectedFaculty.department;
      console.log("[AssignCC] Sending department:", department);

      // Check if there's already a CC assigned for this year/section
      const existingCC = getCurrentCC(selectedYear, selectedYearGroup, selectedSection);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty/assign-cc`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            facultyId: selectedFaculty._id,
            academicYear: selectedYear,
            semester: selectedYearGroup,
            section: selectedSection,
            department,
            updateType: "cc",
            existingCCId: existingCC?.facultyId, // Send existing CC ID for replacement
          }),
        }
      );

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(
          responseData.message || "Failed to assign Course Coordinator"
        );
      }

      console.log("[AssignCC] Success response:", responseData);

      // Update faculty type from backend response
      if (responseData.data && responseData.data.type) {
        setFaculties(prevFaculties =>
          prevFaculties.map(faculty => {
            // Update the newly assigned CC faculty - only change type, preserve original department
            if (faculty._id === selectedFaculty._id) {
              return { 
                ...faculty, 
                type: responseData.data.type,
                // Ensure department doesn't get overwritten
                department: faculty.department 
              };
            }
            // If there was an existing CC being replaced, revert their type to "teaching"
            if (existingCC && faculty._id === existingCC.facultyId) {
              return { ...faculty, type: "teaching" };
            }
            return faculty;
          })
        );
      }

      setAssignSuccess(
        `${selectedFaculty.name || selectedFaculty.firstName || 'Faculty'} assigned as Course Coordinator for ${selectedYear}, Semester ${selectedYearGroup}, Section ${selectedSection}.${existingCC ? ` Previous CC (${existingCC.name}) has been replaced.` : ""}`
      );

      // Refresh CC assignments using both original and corrected department names
      const departmentVariations = [
        department, // Original department name
        responseData.data?.department, // Corrected department from backend
        userDepartment // Normalized department
      ].filter(Boolean);

      let assignmentsUpdated = false;
      
      for (const deptName of departmentVariations) {
        if (assignmentsUpdated) break;
        
        try {
          const updatedAssignmentsResponse = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty/cc-assignments?department=${encodeURIComponent(deptName)}`,
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            }
          );
          if (updatedAssignmentsResponse.ok) {
            const updatedData = await updatedAssignmentsResponse.json();
            const assignments = Array.isArray(updatedData.data) ? updatedData.data : [];
            if (assignments.length > 0) {
              console.log("[AssignCC] Updated assignments:", assignments);
              setCCAssignments(assignments);
              assignmentsUpdated = true;
            }
          }
        } catch (err) {
          console.warn(`[AssignCC] Failed to fetch assignments for department: ${deptName}`, err);
        }
      }

      // Force refresh faculty data to ensure type changes are reflected
      try {
        console.log("[AssignCC] Refreshing faculty data...");
        const facultyResponse = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty/department/${encodeURIComponent(userDepartment || department)}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
          }
        );
        if (facultyResponse.ok) {
          const facultyData = await facultyResponse.json();
          if (facultyData.success && Array.isArray(facultyData.data)) {
            console.log("[AssignCC] Faculty data refreshed, updating state");
            setFaculties(facultyData.data);
          }
        }
      } catch (err) {
        console.warn("[AssignCC] Failed to refresh faculty data:", err);
      }

      // Also refresh CC assignments again to make sure everything is up to date
      setTimeout(() => {
        console.log("[AssignCC] Final refresh of CC assignments");
        fetchCCAssignments();
      }, 1000);

      setTimeout(closeModal, 3000);
    } catch (err) {
      setAssignSuccess(`Error: ${err.message}`);
      console.error("[AssignCC] Error:", err);
    }
  };

  const handleAssignSubject = async (subjectId, faculty = null) => {
    try {
      const targetFaculty = faculty || selectedFaculty;
      if (!targetFaculty) {
        throw new Error("No faculty selected for subject assignment");
      }

      const department = userData?.department || targetFaculty.department;
      console.log("[AssignSubject] Assigning subject:", {
        subjectId,
        department,
        facultyId: targetFaculty._id,
        facultyName: targetFaculty.name || targetFaculty.firstName
      });
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty-subject/assign-faculty-subject`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify({
            facultyId: targetFaculty._id,
            subjectId
          }),
        }
      );

      const responseData = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases with user-friendly messages
        const errorMessage = responseData.message || "Failed to assign subject";
        
        if (errorMessage.includes("already assigned")) {
          setAssignSubjectSuccess(
            `Error: This subject is already assigned to ${targetFaculty.name || targetFaculty.firstName || 'this faculty'}.`
          );
        } else if (errorMessage.includes("not found")) {
          setAssignSubjectSuccess(
            `Error: ${errorMessage}. Please refresh the page and try again.`
          );
        } else {
          setAssignSubjectSuccess(`Error: ${errorMessage}`);
        }
        
        console.error("[AssignSubject] API Error:", errorMessage);
        
        // Clear error message after 5 seconds
        setTimeout(() => setAssignSubjectSuccess(null), 5000);
        return;
      }

      console.log("[AssignSubject] Success response:", responseData);
      setAssignSubjectSuccess(
        `Subject assigned to ${targetFaculty.name || targetFaculty.firstName || 'Faculty'} successfully.`
      );

      // Optionally, refetch faculties to update subjectsTaught
      const facultyResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty/faculties?department=${encodeURIComponent(
          department
        )}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      if (facultyResponse.ok) {
        const facultyData = await facultyResponse.json();
        const facultiesData = Array.isArray(facultyData.data?.faculties)
          ? facultyData.data.faculties
          : Array.isArray(facultyData.data)
          ? facultyData.data
          : Array.isArray(facultyData)
          ? facultyData
          : [];
        setFaculties(facultiesData);
      }

      // Only close modal if it was opened (when faculty is null, we're using inline dropdown)
      if (!faculty) {
        setTimeout(closeModal, 2000);
      } else {
        // Clear success message after 3 seconds for inline assignment
        setTimeout(() => setAssignSubjectSuccess(null), 3000);
      }
    } catch (err) {
      // Handle network errors and other unexpected errors
      const errorMessage = err.message || "An unexpected error occurred";
      setAssignSubjectSuccess(`Error: ${errorMessage}`);
      console.error("[AssignSubject] Network/Unexpected Error:", err);
      
      // Clear error message after 5 seconds
      setTimeout(() => setAssignSubjectSuccess(null), 5000);
    }
  };

  const handleDeleteCC = async (assignment) => {
    if (
      !window.confirm(
        `Remove ${assignment.name} as CC for ${assignment.academicYear}, Semester ${assignment.semester}, Section ${assignment.section}?`
      )
    ) {
      return;
    }

    try {
      const department = userData?.department || assignment.department;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty/delete-cc-assignment`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify({
            facultyId: assignment.facultyId,
            academicYear: assignment.academicYear,
            semester: assignment.semester,
            section: assignment.section,
            department,
            restoreType: "teaching", // Restore to teaching when no more CC assignments
          }),
        }
      );

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(
          responseData.message || "Failed to delete CC assignment"
        );
      }

      console.log("[DeleteCC] Success response:", responseData);

      // Update faculty type from backend response
      if (responseData.data && responseData.data.type) {
        setFaculties(prevFaculties => 
          prevFaculties.map(faculty => {
            if (faculty._id === assignment.facultyId) {
              return { ...faculty, type: responseData.data.type };
            }
            return faculty;
          })
        );
      }

      // Refresh CC assignments
      const updatedAssignmentsResponse = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty/cc-assignments?department=${encodeURIComponent(
          department
        )}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      if (updatedAssignmentsResponse.ok) {
        const updatedData = await updatedAssignmentsResponse.json();
        const assignments = Array.isArray(updatedData.data)
          ? updatedData.data
          : [];
        console.log("[DeleteCC] Updated assignments:", assignments);
        setCCAssignments(assignments);
      }
    } catch (err) {
      console.error("[DeleteCC] Error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  const getCurrentCC = (year, semester, section) => {
    return ccAssignments.find(
      (cc) =>
        cc.academicYear === year &&
        cc.semester === semester &&
        cc.section === section &&
        (cc.department === userDepartment ||
        (cc.department && userDepartment && 
         cc.department.toLowerCase().trim() === userDepartment.toLowerCase().trim()) ||
        (cc.department && userDepartment && 
         cc.department.toLowerCase().includes('electronic') && userDepartment.toLowerCase().includes('electronic')) ||
        (cc.department && userDepartment && 
         cc.department.toLowerCase().includes('eletronic') && userDepartment.toLowerCase().includes('eletronic')))
    );
  };

  const isCCAssigned = (semester, section, academicYear) => {
    const isAssigned = ccAssignments.some(
      (assignment) =>
        assignment.semester === semester &&
        assignment.section === section &&
        assignment.academicYear === academicYear &&
        (assignment.department === userDepartment ||
        (assignment.department && userDepartment && 
         assignment.department.toLowerCase().trim() === userDepartment.toLowerCase().trim()) ||
        (assignment.department && userDepartment && 
         assignment.department.toLowerCase().includes('electronic') && userDepartment.toLowerCase().includes('electronic')) ||
        (assignment.department && userDepartment && 
         assignment.department.toLowerCase().includes('eletronic') && userDepartment.toLowerCase().includes('eletronic')))
    );
    console.log("[isCCAssigned] Checking:", {
      semester,
      section,
      academicYear,
      userDepartment,
      isAssigned,
    });
    return isAssigned;
  };

  const formatField = (value, isDate = false) => {
    if (value === null || value === undefined || value === "") return "N/A";
    if (isDate && value) return new Date(value).toLocaleDateString();
    if (Array.isArray(value)) return value.length ? value.join(", ") : "None";
    return value.toString();
  };

  // Get available subjects for dropdown - since we fetch department-specific subjects
  const getAvailableSubjects = useCallback(() => {
    console.log("[getAvailableSubjects] Returning all subjects:", subjects.length);
    console.log("[getAvailableSubjects] Subjects:", subjects.map(s => ({ name: s.name, department: s.department })));
    return subjects;
  }, [subjects]);

  // Helper to check if a subject is assigned to another faculty (not the selected one)
  const isSubjectAssignedToOther = (subjectId, facultyId) => {
    return faculties.some(
      (faculty) =>
        faculty._id !== facultyId &&
        Array.isArray(faculty.subjectsTaught) &&
        faculty.subjectsTaught.some(
          (subj) => (typeof subj === "string" ? subj : subj._id) === subjectId
        )
    );
  };

  // Helper to check if a subject is already assigned to any faculty
  const isSubjectAssigned = (subjectId) => {
    return faculties.some(
      (faculty) =>
        Array.isArray(faculty.subjectsTaught) &&
        faculty.subjectsTaught.some(
          (subj) => (typeof subj === "string" ? subj : subj._id) === subjectId
        )
    );
  };

  // Helper to get faculty's CC assignments count
  const getFacultyCCCount = (facultyId) => {
    return ccAssignments.filter(assignment => assignment.facultyId === facultyId).length;
  };

  // Helper to get faculty's CC assignments
  const getFacultyCCAssignments = (facultyId) => {
    return ccAssignments.filter(assignment => assignment.facultyId === facultyId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center p-6">
        <div className="glass-effect rounded-3xl shadow-2xl border border-white/30 p-12 text-center animate-pulse-soft">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Loading Faculty Data</h3>
          <p className="text-slate-600">Please wait while we fetch the information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center p-6">
        <div className="glass-effect rounded-3xl shadow-2xl border border-red-200/50 p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <X size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-4">Error Loading Faculty</h3>
          <p className="text-slate-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show message if no userData or department
  if (!userData?.department) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center p-6">
        <div className="glass-effect rounded-3xl shadow-2xl border border-white/30 p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <User size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-4">Department Required</h3>
          <p className="text-slate-600 mb-6">
            Please ensure you are logged in with a valid department assignment to view faculty data.
          </p>
          <div className="text-sm text-slate-500 bg-slate-100 p-3 rounded-lg text-left">
            <strong>Debug Info:</strong><br />
            userData: {JSON.stringify(userData, null, 2)}<br />
            department: {userData?.department || 'undefined'}
          </div>
        </div>
      </div>
    );
  }

  const eligibleCCFaculty = faculties.filter(
    (f) => f.type === "teaching" && f.department === userDepartment
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          .animate-fade-in {
            animation: fadeIn 0.6s ease-out forwards;
          }
          .animate-slide-in {
            animation: slideIn 0.5s ease-out forwards;
          }
          .animate-pulse-soft {
            animation: pulse 3s ease-in-out infinite;
          }
          .glass-effect {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
          }
          .hover-lift {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .hover-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
        `}
      </style>
      <div className="container mx-auto px-6 py-10">
        {/* Success/Error Notification */}
        {assignSubjectSuccess && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border-l-4 max-w-md animate-slide-in ${
            assignSubjectSuccess.includes('Error') 
              ? 'bg-red-50 border-red-400 text-red-700' 
              : 'bg-green-50 border-green-400 text-green-700'
          }`}>
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                assignSubjectSuccess.includes('Error') ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {assignSubjectSuccess.includes('Error') ? '✗' : '✓'}
              </div>
              <span className="font-medium">{assignSubjectSuccess}</span>
            </div>
          </div>
        )}

        <div className="glass-effect rounded-3xl shadow-2xl border border-white/30 p-8 mb-8 animate-fade-in">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen size={28} className="text-white" />
            </div>
            {userDepartment ? `${userDepartment} Faculty Management` : "Faculty Dashboard"}
          </h1>
          <p className="text-slate-600 text-lg">
            Manage faculty assignments, course coordinators, and department operations
          </p>
        </div>

        <div className="mb-8 glass-effect rounded-3xl shadow-xl border border-white/30 p-8 animate-fade-in hover-lift">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
              <Award size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Course Coordinators
              </h2>
              <p className="text-slate-600 text-sm mt-1">
                Currently assigned coordinators for academic sessions
              </p>
            </div>
          </div>
          {ccAssignments.length === 0 ? (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl text-center border border-indigo-100">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                <Award size={32} className="text-white" />
              </div>
              <p className="text-slate-600 font-medium">
                No Course Coordinators assigned yet.
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Start by assigning coordinators to faculty members below
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ccAssignments.map((assignment, index) => (
                <div
                  key={`${assignment.facultyId}-${assignment.academicYear}-${assignment.semester}-${assignment.section}`}
                  className="bg-gradient-to-br from-white to-indigo-50/50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-100 hover-lift animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {assignment.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleDeleteCC(assignment)}
                      className="text-rose-500 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition-colors duration-200"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Session:</span>
                      <span className="text-slate-700 font-semibold">{assignment.academicYear}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Year:</span>
                      <span className="text-slate-700 font-semibold">{assignment.semester}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Section:</span>
                      <span className="text-slate-700 font-semibold">{assignment.section}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Department:</span>
                      <span className="text-slate-700 font-semibold">{assignment.department}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Assigned:</span>{" "}
                      {new Date(assignment.assignedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-6 mb-8 glass-effect rounded-3xl shadow-xl border border-white/30 p-8 animate-fade-in">
          <div className="flex items-center mb-4 w-full">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg mr-3">
              <Search size={20} className="text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Search & Filter Faculty
            </h3>
          </div>

          <div className="relative flex-1 min-w-[280px]">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              className="border border-slate-300 p-4 pl-12 rounded-xl w-full bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm font-medium placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-slate-300 p-4 rounded-xl bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm font-medium min-w-[180px]"
          >
            <option value="all">All Types</option>
            <option value="teaching">Teaching</option>
            <option value="cc">Course Coordinator</option>
            <option value="non-teaching">Non-Teaching</option>
            <option value="hod">HOD</option>
            <option value="principal">Principal</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split("-");
              setSortBy(by);
              setSortOrder(order);
            }}
            className="border border-slate-300 p-4 rounded-xl bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm font-medium min-w-[220px]"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="department-asc">Department (A-Z)</option>
            <option value="department-desc">Department (Z-A)</option>
            <option value="dateOfJoining-asc">Joining Date (Oldest)</option>
            <option value="dateOfJoining-desc">Joining Date (Newest)</option>
            <option value="experience-asc">Experience (Low to High)</option>
            <option value="experience-desc">Experience (High to Low)</option>
          </select>
        </div>

        {sortedFaculties.length === 0 ? (
          <div className="glass-effect rounded-3xl p-12 text-center shadow-xl border border-white/30 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-400 to-slate-500 rounded-3xl flex items-center justify-center shadow-lg mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              No faculty found
            </h3>
            <p className="text-slate-600 text-lg">
              {searchTerm
                ? "No faculty match your search criteria"
                : "No faculty available in this department"}
            </p>
          </div>
        ) : (
          <div className="glass-effect shadow-2xl rounded-3xl overflow-hidden animate-fade-in border border-white/30">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <User size={24} />
                Faculty Members ({sortedFaculties.length})
              </h3>
              <p className="text-white/80 mt-2">Organized view for better management</p>
            </div>

            {/* Two Column Grid Layout */}
            <div className="p-6 bg-gradient-to-br from-slate-50/50 to-white/50">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sortedFaculties.map((faculty, index) => (
                  <div
                    key={faculty._id}
                    className="glass-effect rounded-2xl p-6 border border-white/50 hover:shadow-lg transition-all duration-300 animate-slide-in group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Faculty Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <User className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700 transition-colors flex items-center gap-2">
                          {faculty.name || `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim()}
                          {faculty.type === "cc" && (
                            <span className="text-xs px-2 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-full font-semibold">
                              CC
                            </span>
                          )}
                        </h4>
                        <div className="text-sm text-slate-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <span className="truncate">{faculty.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                            <span>ID: {faculty.employeeId}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Department Badge */}
                    <div className="mb-4 flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1.5 text-xs rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 font-semibold">
                        📚 {faculty.department}
                      </span>
                      {(faculty.type === "teaching" || faculty.type === "cc") && (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 font-semibold">
                          ✅ CC Eligible
                        </span>
                      )}
                      {faculty.type === "cc" && (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 font-semibold">
                          👑 Current CC
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAssignCCClick(faculty)}
                          disabled={faculty.type !== "teaching" && faculty.type !== "cc"}
                          className={`flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 shadow-md hover:shadow-lg font-medium text-sm ${
                            faculty.type === "teaching" || faculty.type === "cc"
                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 focus:ring-emerald-500"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          🎯 {faculty.type === "cc" ? "Manage CC" : "Assign CC"}
                        </button>
                        <button
                          onClick={() => handleExpandFaculty(faculty._id)}
                          className="px-3 py-2.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-all duration-300 border border-indigo-200"
                        >
                          {expandedFaculty === faculty._id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </div>

                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            console.log("[Dropdown] Subject selected:", e.target.value, "for faculty:", faculty.name);
                            handleAssignSubject(e.target.value, faculty);
                            e.target.value = "";
                          }
                        }}
                        className="w-full border border-slate-300 p-3 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 shadow-sm font-medium text-sm"
                      >
                        <option value="">📖 Select Subject to Assign ({subjects.length} available)</option>
                        {(() => {
                          try {
                            const availableSubjects = getAvailableSubjects();
                            console.log("[Dropdown] About to render subjects:", availableSubjects.length);
                            return availableSubjects.map((subject) => (
                              <option
                                key={subject._id}
                                value={subject._id}
                                disabled={isSubjectAssigned(subject._id)}
                              >
                                {subject.name} {isSubjectAssigned(subject._id) ? "(Assigned)" : ""}
                              </option>
                            ));
                          } catch (error) {
                            console.error("[Dropdown] Error rendering subjects:", error);
                            return <option disabled>Error loading subjects</option>;
                          }
                        })()}
                        {subjects.length === 0 && (
                          <option disabled>No subjects available for this department</option>
                        )}
                      </select>
                    </div>

                    {/* Expanded Details Section */}
                    {expandedFaculty === faculty._id && (
                      <div className="mt-6 pt-6 border-t border-slate-200/50">
                        <div className="space-y-4">
                          {/* Faculty Information Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-white/80">
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Clipboard size={14} className="text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Employee ID</p>
                                <p className="font-bold text-slate-800 text-sm">{faculty.employeeId}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-white/80">
                              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                                <UserCheck size={14} className="text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Type</p>
                                <p className="font-bold text-slate-800 text-sm capitalize flex items-center gap-1">
                                  {faculty.type === "cc" ? "Course Coordinator" : faculty.type}
                                  {faculty.type === "cc" && <span className="text-xs">👑</span>}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-white/80">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                                <Clock size={14} className="text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Joined</p>
                                <p className="font-bold text-slate-800 text-sm">
                                  {new Date(faculty.dateOfJoining).toLocaleDateString() || "N/A"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-white/80">
                              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                                <Briefcase size={14} className="text-white" />
                              </div>
                              <div>
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Experience</p>
                                <p className="font-bold text-slate-800 text-sm">{faculty.teachingExperience || 0} years</p>
                              </div>
                            </div>
                          </div>

                          {/* Subjects Taught */}
                          <div className="bg-white/60 rounded-lg border border-white/80 p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg flex items-center justify-center">
                                <BookOpen size={14} className="text-white" />
                              </div>
                              <h5 className="font-bold text-slate-800 text-sm">Subjects Taught</h5>
                            </div>
                            {faculty.subjectsTaught && faculty.subjectsTaught.length > 0 ? (
                              <div className="space-y-2">
                                {faculty.subjectsTaught.map((subject) =>
                                  subject && subject.name ? (
                                    <div
                                      key={subject._id}
                                      className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 p-2 rounded-lg border border-indigo-200"
                                    >
                                      <span className="font-medium text-slate-700 text-sm">{subject.name}</span>
                                      <button
                                        className="px-2 py-1 text-xs bg-gradient-to-r from-rose-500 to-red-600 text-white rounded hover:from-rose-600 hover:to-red-700 transition-all duration-200 shadow-sm font-medium"
                                        onClick={async () => {
                                          await fetch(
                                            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty-subject/remove-faculty-subject`,
                                            {
                                              method: "DELETE",
                                              headers: {
                                                "Content-Type": "application/json",
                                                "Authorization": `Bearer ${localStorage.getItem("authToken")}`
                                              },
                                              body: JSON.stringify({
                                                facultyId: faculty._id,
                                                subjectId: subject._id,
                                              }),
                                            }
                                          );
                                          // Refetch faculties to update UI
                                          const department = userData?.department || faculty.department;
                                          const response = await fetch(
                                            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty/faculties?department=${encodeURIComponent(
                                              department
                                            )}`,
                                            {
                                              headers: {
                                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                              }
                                            }
                                          );
                                          if (response.ok) {
                                            const data = await response.json();
                                            setFaculties(
                                              Array.isArray(data.data?.faculties)
                                                ? data.data.faculties
                                                : []
                                            );
                                          }
                                        }}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ) : null
                                )}
                              </div>
                            ) : (
                              <p className="text-slate-500 text-sm italic">No subjects assigned</p>
                            )}
                          </div>

                          {/* CC Assignments */}
                          {faculty.type === "cc" && getFacultyCCCount(faculty._id) > 0 && (
                            <div className="bg-white/60 rounded-lg border border-white/80 p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                                  <Award size={14} className="text-white" />
                                </div>
                                <h5 className="font-bold text-slate-800 text-sm">CC Assignments ({getFacultyCCCount(faculty._id)})</h5>
                              </div>
                              <div className="space-y-2">
                                {getFacultyCCAssignments(faculty._id).map((assignment, index) => (
                                  <div
                                    key={`${assignment.academicYear}-${assignment.semester}-${assignment.section}`}
                                    className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 p-2 rounded-lg border border-amber-200"
                                  >
                                    <span className="font-medium text-slate-700 text-sm">
                                      {assignment.academicYear} - Year {assignment.semester}, Section {assignment.section}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                                      Active
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* View Details Button */}
                          <div className="flex justify-center pt-2">
                            <button
                              onClick={() => handleViewDetails(faculty)}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl font-medium text-sm"
                            >
                              <User size={16} className="mr-2" />
                              View Complete Profile
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showModal && selectedFaculty && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
            <div className="glass-effect rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/30">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    {modalMode === "details" ? (
                      <>
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <User size={24} className="text-white" />
                        </div>
                        Faculty Details
                      </>
                    ) : modalMode === "assignSubject" ? (
                      <>
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <BookOpen size={24} className="text-white" />
                        </div>
                        Assign Subject
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <Award size={24} className="text-white" />
                        </div>
                        {isCCAssigned(selectedYearGroup, selectedSection, selectedYear)
                          ? "Change Course Coordinator"
                          : "Assign Course Coordinator"}
                      </>
                    )}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center space-x-6 mb-8 p-6 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-2xl border border-indigo-200/50">
                  <div className="flex-shrink-0 h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <User className="h-10 w-10 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-slate-800">
                      {selectedFaculty.name || 
                       `${selectedFaculty.title || ""} ${selectedFaculty.firstName || ""} ${selectedFaculty.middleName || ""} ${selectedFaculty.lastName || ""}`.trim()}
                    </h4>
                    <p className="text-slate-600 mt-1 font-medium">
                      {selectedFaculty.email}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">
                      {selectedFaculty.designation} • {selectedFaculty.department}
                    </p>
                  </div>
                </div>

                {modalMode === "details" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    {/* Existing details content remains unchanged */}
                    <div>
                      <p className="text-gray-500 font-medium">Employee ID</p>
                      <p>{formatField(selectedFaculty.employeeId)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Gender</p>
                      <p>{formatField(selectedFaculty.gender)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Designation</p>
                      <p>{formatField(selectedFaculty.designation)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Mobile</p>
                      <p>{formatField(selectedFaculty.mobile)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Date of Birth</p>
                      <p>{formatField(selectedFaculty.dateOfBirth, true)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Date of Joining
                      </p>
                      <p>{formatField(selectedFaculty.dateOfJoining, true)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Department</p>
                      <p>{formatField(selectedFaculty.department)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Address</p>
                      <p>{formatField(selectedFaculty.address)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Aadhaar</p>
                      <p>{formatField(selectedFaculty.aadhaar)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Employment Type
                      </p>
                      <p>{formatField(selectedFaculty.employmentStatus)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Status</p>
                      <p>{formatField(selectedFaculty.status)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Faculty Type</p>
                      <p>{formatField(selectedFaculty.type)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Role</p>
                      <p>{formatField(selectedFaculty.role)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Teaching Experience
                      </p>
                      <p>
                        {formatField(selectedFaculty.teachingExperience)} years
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Subjects Taught
                      </p>
                      <p>{formatField(selectedFaculty.subjectsTaught)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Technical Skills
                      </p>
                      <p>{formatField(selectedFaculty.technicalSkills)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Father's Name</p>
                      <p>{formatField(selectedFaculty.fathersName)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">RFID No</p>
                      <p>{formatField(selectedFaculty.rfidNo)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Sevarth No</p>
                      <p>{formatField(selectedFaculty.sevarthNo)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Personal Email
                      </p>
                      <p>{formatField(selectedFaculty.personalEmail)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Communication Email
                      </p>
                      <p>{formatField(selectedFaculty.communicationEmail)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Spouse Name</p>
                      <p>{formatField(selectedFaculty.spouseName)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Date of Increment
                      </p>
                      <p>
                        {formatField(selectedFaculty.dateOfIncrement, true)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Date of Retirement
                      </p>
                      <p>
                        {formatField(selectedFaculty.dateOfRetirement, true)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Relieving Date
                      </p>
                      <p>{formatField(selectedFaculty.relievingDate, true)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Pay Revised Date
                      </p>
                      <p>{formatField(selectedFaculty.payRevisedDate, true)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Transport Allowance
                      </p>
                      <p>{formatField(selectedFaculty.transportAllowance)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Handicap</p>
                      <p>{formatField(selectedFaculty.handicap)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Senior Citizen
                      </p>
                      <p>{formatField(selectedFaculty.seniorCitizen)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">HRA</p>
                      <p>{formatField(selectedFaculty.hra)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Quarter</p>
                      <p>{formatField(selectedFaculty.quarter)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Bank Name</p>
                      <p>{formatField(selectedFaculty.bankName)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">PAN Number</p>
                      <p>{formatField(selectedFaculty.panNumber)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Mother Tongue</p>
                      <p>{formatField(selectedFaculty.motherTongue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Designation Nature
                      </p>
                      <p>{formatField(selectedFaculty.designationNature)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">PF</p>
                      <p>{formatField(selectedFaculty.pf)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">PF Number</p>
                      <p>{formatField(selectedFaculty.pfNumber)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">NPS Number</p>
                      <p>{formatField(selectedFaculty.npsNumber)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">
                        Bank Branch Name
                      </p>
                      <p>{formatField(selectedFaculty.bankBranchName)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">UAN Number</p>
                      <p>{formatField(selectedFaculty.uanNumber)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">IFSC Code</p>
                      <p>{formatField(selectedFaculty.ifscCode)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">ESIC Number</p>
                      <p>{formatField(selectedFaculty.esicNumber)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">PF Applicable</p>
                      <p>{formatField(selectedFaculty.pfApplicable)}</p>
                    </div>
                  </div>
                ) : modalMode === "assignSubject" ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Academic Year (Session)
                      </label>
                      <input
                        type="text"
                        value={currentAcademicYear}
                        readOnly
                        className="w-full border border-slate-300 p-4 rounded-xl bg-slate-100 text-slate-700 cursor-not-allowed font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Select Subject
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignSubject(e.target.value);
                            e.target.value = ""; // Reset dropdown
                          }
                        }}
                        className="w-full border border-slate-300 p-4 rounded-xl bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium shadow-sm"
                      >
                        <option value="">Select Subject</option>
                        {getAvailableSubjects().map(
                          (subject) => (
                            <option
                              key={subject._id}
                              value={subject._id}
                              disabled={isSubjectAssignedToOther(
                                subject._id,
                                selectedFaculty._id
                              )}
                            >
                              {subject.name}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    {assignSubjectSuccess && (
                      <div className={`p-4 rounded-xl border ${
                          assignSubjectSuccess.includes("Error")
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        } animate-fade-in`}>
                        <p className="font-medium">{assignSubjectSuccess}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedYear &&
                      selectedYearGroup &&
                      selectedSection &&
                      isCCAssigned(
                        selectedYearGroup,
                        selectedSection,
                        selectedYear
                      ) && (
                        <div className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                              <Award size={16} className="text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-amber-800">Current Assignment</p>
                              <p className="text-sm text-amber-700">
                                {getCurrentCC(selectedYear, selectedYearGroup, selectedSection)?.name || "Unknown"}{" "}
                                is currently assigned. New assignment will replace this.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Academic Year (Session)
                      </label>
                      <input
                        type="text"
                        value={currentAcademicYear}
                        readOnly
                        className="w-full border border-slate-300 p-4 rounded-xl bg-slate-100 text-slate-700 cursor-not-allowed font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Select Year (for Session: {currentAcademicYear})
                      </label>
                      <select
                        value={selectedYearGroup}
                        onChange={(e) => setSelectedYearGroup(e.target.value)}
                        className="w-full border border-slate-300 p-4 rounded-xl bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium shadow-sm"
                      >
                        <option value="">Select Year</option>
                        {yearOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Select Section
                      </label>
                      <select
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="w-full border border-slate-300 p-4 rounded-xl bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium shadow-sm"
                      >
                        <option value="">Select Section</option>
                        {sections.map((sec) => (
                          <option key={sec} value={sec}>
                            Section {sec}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleAssignCC}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-lg"
                    >
                      {isCCAssigned(selectedYearGroup, selectedSection, selectedYear)
                        ? "Change Course Coordinator"
                        : "Assign Course Coordinator"}
                    </button>
                    {assignSuccess && (
                      <div className={`p-4 rounded-xl border ${
                          assignSuccess.includes("Error")
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        } animate-fade-in`}>
                        <p className="font-medium">{assignSuccess}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="px-8 py-6 border-t border-slate-200/50 bg-gradient-to-r from-slate-50/50 to-indigo-50/50 rounded-b-3xl flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
