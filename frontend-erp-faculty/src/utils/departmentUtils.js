// Utility functions for managing departments

export const fetchDepartments = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/superadmin/departments`);
    
    if (response.ok) {
      const data = await response.json();
      
      // Handle different response structures
      let departmentNames = [];
      if (Array.isArray(data)) {
        // Direct array response
        departmentNames = data.map(dept => dept.name);
      } else if (data.value && Array.isArray(data.value)) {
        // Response wrapped in 'value' property
        departmentNames = data.value.map(dept => dept.name);
      } else if (data.departments && Array.isArray(data.departments)) {
        // Response wrapped in 'departments' property
        departmentNames = data.departments.map(dept => dept.name);
      }
      
      return {
        success: true,
        departments: departmentNames,
        fullData: data
      };
    } else {
      console.error('Failed to fetch departments, response not ok');
      return {
        success: false,
        error: 'Failed to fetch departments',
        departments: getFallbackDepartments()
      };
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
    return {
      success: false,
      error: error.message,
      departments: getFallbackDepartments()
    };
  }
};

export const getFallbackDepartments = () => [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical",
  "Civil",
  "Electrical",
  "Data Science",
  "Account Section",
];

export const fetchFacultyDistribution = async () => {
  try {
    // First get the departments
    const departmentResult = await fetchDepartments();
    const departments = departmentResult.departments;
    
    // Then get faculty data
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty/faculties?limit=1000`);
    
    if (response.ok) {
      const data = await response.json();
      
      let faculties = [];
      if (Array.isArray(data.data?.faculties))
        faculties = data.data.faculties;
      else if (Array.isArray(data.data)) 
        faculties = data.data;
      else if (Array.isArray(data)) 
        faculties = data;
      
      // Create distribution map with all departments (including zero counts)
      const distributionMap = {};
      departments.forEach(dept => {
        distributionMap[dept] = 0;
      });
      
      // Count faculties by department
      faculties.forEach((faculty) => {
        const dept = faculty.department || "Unknown";
        if (distributionMap.hasOwnProperty(dept)) {
          distributionMap[dept]++;
        } else {
          // If department not in our list, add it
          distributionMap[dept] = 1;
        }
      });
      
      // Convert to array format for charts
      const distribution = Object.entries(distributionMap).map(([name, count]) => ({
        name,
        count,
      }));
      
      return {
        success: true,
        distribution,
        totalFaculties: faculties.length
      };
    } else {
      throw new Error('Failed to fetch faculty data');
    }
  } catch (error) {
    console.error('Error fetching faculty distribution:', error);
    return {
      success: false,
      error: error.message,
      distribution: []
    };
  }
};

export const fetchStudentDistribution = async () => {
  try {
    // First get the departments
    const departmentResult = await fetchDepartments();
    const departments = departmentResult.departments;
    
    // Then get student data
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/students?limit=1000`);
    
    if (response.ok) {
      const data = await response.json();
      
      let students = [];
      if (Array.isArray(data.data?.students))
        students = data.data.students;
      else if (Array.isArray(data.data)) 
        students = data.data;
      else if (Array.isArray(data)) 
        students = data;
      
      // Create distribution map with all departments (including zero counts)
      const distributionMap = {};
      departments.forEach(dept => {
        distributionMap[dept] = 0;
      });
      
      // Count students by department
      students.forEach((student) => {
        const dept = student.department || student.branch || "Unknown";
        if (distributionMap.hasOwnProperty(dept)) {
          distributionMap[dept]++;
        } else {
          // If department not in our list, add it
          distributionMap[dept] = 1;
        }
      });
      
      // Convert to array format for charts
      const distribution = Object.entries(distributionMap).map(([name, count]) => ({
        name,
        count,
      }));
      
      return {
        success: true,
        distribution,
        totalStudents: students.length
      };
    } else {
      throw new Error('Failed to fetch student data');
    }
  } catch (error) {
    console.error('Error fetching student distribution:', error);
    return {
      success: false,
      error: error.message,
      distribution: []
    };
  }
};

export const fetchFacultyByDepartment = async (department) => {
  try {
    const normalizedDepartment = department ? department.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "";
    
    if (!normalizedDepartment) {
      throw new Error('Department is required');
    }

    // Use the specific endpoint for fetching faculties by department
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty/department/${encodeURIComponent(normalizedDepartment)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch faculty data: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle the response structure from the specific endpoint
    let facultiesData = [];
    if (data.success && Array.isArray(data.data)) {
      facultiesData = data.data;
    } else if (Array.isArray(data.data?.faculties)) {
      facultiesData = data.data.faculties;
    } else if (Array.isArray(data.data)) {
      facultiesData = data.data;
    } else if (Array.isArray(data)) {
      facultiesData = data;
    }
    
    return {
      success: true,
      faculties: facultiesData,
      department: normalizedDepartment,
      count: facultiesData.length
    };
  } catch (error) {
    console.error('[DepartmentUtils] Error fetching faculty by department:', error);
    return {
      success: false,
      error: error.message,
      faculties: [],
      department: department,
      count: 0
    };
  }
};

export const fetchCCAssignmentsByDepartment = async (department) => {
  try {
    if (!department) {
      throw new Error('Department is required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty/cc-assignments?department=${encodeURIComponent(department)}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CC assignments: ${response.status}`);
    }
    
    const data = await response.json();
    const assignments = Array.isArray(data.data) ? data.data : [];
    
    return {
      success: true,
      assignments,
      department: department
    };
  } catch (error) {
    console.error('Error fetching CC assignments by department:', error);
    return {
      success: false,
      error: error.message,
      assignments: [],
      department: department
    };
  }
};

export const fetchSubjects = async (department = null) => {
  try {
    let url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/subjects`;
    
    // If department is provided, use the department-specific endpoint
    if (department) {
      url += `/by-department?department=${encodeURIComponent(department)}`;
      console.log("[FetchSubjects] Fetching subjects for department:", department);
    } else {
      console.log("[FetchSubjects] Fetching all subjects");
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch subjects: ${response.status}`);
    }
    
    const data = await response.json();
    const subjectsData = Array.isArray(data.data) ? data.data : [];
    
    console.log("[FetchSubjects] Retrieved subjects:", subjectsData.length);
    
    return {
      success: true,
      subjects: subjectsData
    };
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return {
      success: false,
      error: error.message,
      subjects: []
    };
  }
};
