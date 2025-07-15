// Utility functions for populating related data across models

export const populateOptions = {
  student: {
    basic: ['stream', 'department', 'semester', 'subjects'],
    detailed: [
      {
        path: 'stream',
        select: 'name description'
      },
      {
        path: 'department',
        select: 'name',
        populate: {
          path: 'stream',
          select: 'name description'
        }
      },
      {
        path: 'semester',
        select: 'number',
        populate: {
          path: 'subjects',
          select: 'name'
        }
      },
      {
        path: 'subjects',
        select: 'name department semester',
        populate: [
          {
            path: 'department',
            select: 'name'
          },
          {
            path: 'semester',
            select: 'number'
          }
        ]
      },
      {
        path: 'semesterRecords.semester',
        select: 'number'
      },
      {
        path: 'semesterRecords.subjects.subject',
        select: 'name department',
        populate: {
          path: 'department',
          select: 'name'
        }
      },
      {
        path: 'backlogs',
        select: 'name department',
        populate: {
          path: 'department',
          select: 'name'
        }
      }
    ]
  },

  faculty: {
    basic: ['department'],
    detailed: [
      {
        path: 'department',
        select: 'name',
        populate: {
          path: 'stream',
          select: 'name description'
        }
      },
      {
        path: 'subjectsTaught',
        select: 'name department',
        populate: {
          path: 'department',
          select: 'name'
        }
      },
      {
        path: 'ccAssignments.department',
        select: 'name'
      },
      {
        path: 'ccAssignments.semester',
        select: 'number'
      }
    ]
  },

  attendance: {
    basic: ['student', 'subject', 'faculty', 'semester', 'department'],
    detailed: [
      {
        path: 'student',
        select: 'firstName lastName enrollmentNumber department semester',
        populate: [
          {
            path: 'department',
            select: 'name'
          },
          {
            path: 'semester',
            select: 'number'
          }
        ]
      },
      {
        path: 'subject',
        select: 'name department semester',
        populate: [
          {
            path: 'department',
            select: 'name'
          },
          {
            path: 'semester',
            select: 'number'
          }
        ]
      },
      {
        path: 'faculty',
        select: 'firstName lastName employeeId department',
        populate: {
          path: 'department',
          select: 'name'
        }
      },
      {
        path: 'semester',
        select: 'number'
      },
      {
        path: 'department',
        select: 'name'
      }
    ]
  },

  accountStudent: {
    basic: ['stream', 'department', 'currentSemester'],
    detailed: [
      {
        path: 'stream',
        select: 'name description'
      },
      {
        path: 'department',
        select: 'name',
        populate: {
          path: 'stream',
          select: 'name description'
        }
      },
      {
        path: 'currentSemester',
        select: 'number',
        populate: {
          path: 'subjects',
          select: 'name'
        }
      },
      {
        path: 'semesterEntries.semesterRecord.semester',
        select: 'number'
      },
      {
        path: 'semesterEntries.semesterRecord.subjects.subject',
        select: 'name department',
        populate: {
          path: 'department',
          select: 'name'
        }
      }
    ]
  },

  adminSubject: {
    basic: ['department'],
    detailed: [
      {
        path: 'department',
        select: 'name',
        populate: {
          path: 'stream',
          select: 'name description'
        }
      }
    ]
  },

  semester: {
    basic: ['subjects'],
    detailed: [
      {
        path: 'subjects',
        select: 'name department',
        populate: {
          path: 'department',
          select: 'name'
        }
      }
    ]
  },

  academicDepartment: {
    basic: ['stream'],
    detailed: [
      {
        path: 'stream',
        select: 'name description'
      }
    ]
  }
};

// Helper function to get populate options for a model
export const getPopulateOptions = (modelName, level = 'basic') => {
  const options = populateOptions[modelName.toLowerCase()];
  if (!options) return [];
  
  return options[level] || options.basic || [];
};

// Helper function to populate a query
export const populateQuery = (query, modelName, level = 'basic') => {
  const options = getPopulateOptions(modelName, level);
  
  if (Array.isArray(options) && options.length > 0) {
    options.forEach(option => {
      if (typeof option === 'string') {
        query.populate(option);
      } else {
        query.populate(option);
      }
    });
  }
  
  return query;
};

// Helper function to populate multiple paths
export const populateMultiple = (query, paths) => {
  if (Array.isArray(paths)) {
    paths.forEach(path => {
      if (typeof path === 'string') {
        query.populate(path);
      } else {
        query.populate(path);
      }
    });
  }
  
  return query;
};
