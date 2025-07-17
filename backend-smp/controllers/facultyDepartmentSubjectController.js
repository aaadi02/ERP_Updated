import FacultyDepartmentSubject from '../models/FacultyDepartmentSubject.js';
import Faculty from '../models/faculty.js';
import AcademicDepartment from '../models/AcademicDepartment.js';
import AdminSubject from '../models/AdminSubject.js';

// Get all faculty assignments for a specific department
export const getFacultyByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { academicYear, semester } = req.query;
    
    console.log('[FacDeptSubj] Getting faculty for department:', departmentId);
    
    let query = { department: departmentId, isActive: true };
    
    // Add academic year and semester filters if provided
    if (academicYear) {
      query['assignedSubjects.academicYear'] = academicYear;
    }
    if (semester) {
      query['assignedSubjects.semester'] = semester;
    }
    
    const facultyAssignments = await FacultyDepartmentSubject.find(query)
      .populate('faculty', 'firstName lastName email employeeId designation mobile')
      .populate('department', 'name code description')
      .populate('assignedSubjects.subject', 'name code credits semester')
      .sort({ 'faculty.firstName': 1 });
    
    console.log('[FacDeptSubj] Found assignments:', facultyAssignments.length);
    
    res.status(200).json({
      success: true,
      message: "Faculty assignments retrieved successfully",
      data: facultyAssignments,
      count: facultyAssignments.length
    });
    
  } catch (error) {
    console.error('Error fetching faculty by department:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching faculty assignments",
      error: error.message
    });
  }
};

// Get all subjects taught by a specific faculty
export const getSubjectsByFaculty = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { academicYear, semester } = req.query;
    
    console.log('[FacDeptSubj] Getting subjects for faculty:', facultyId);
    
    let query = { faculty: facultyId, isActive: true };
    
    if (academicYear) {
      query['assignedSubjects.academicYear'] = academicYear;
    }
    if (semester) {
      query['assignedSubjects.semester'] = semester;
    }
    
    const facultySubjects = await FacultyDepartmentSubject.find(query)
      .populate('faculty', 'firstName lastName email employeeId')
      .populate('department', 'name code')
      .populate('assignedSubjects.subject', 'name code credits semester');
    
    console.log('[FacDeptSubj] Found faculty subjects:', facultySubjects.length);
    
    res.status(200).json({
      success: true,
      message: "Faculty subjects retrieved successfully",
      data: facultySubjects,
      count: facultySubjects.length
    });
    
  } catch (error) {
    console.error('Error fetching subjects by faculty:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching faculty subjects",
      error: error.message
    });
  }
};

// Get faculty teaching a specific subject
export const getFacultyBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { academicYear, semester, section } = req.query;
    
    console.log('[FacDeptSubj] Getting faculty for subject:', subjectId);
    
    let query = { 
      'assignedSubjects.subject': subjectId, 
      'assignedSubjects.status': 'active',
      isActive: true 
    };
    
    if (academicYear) {
      query['assignedSubjects.academicYear'] = academicYear;
    }
    if (semester) {
      query['assignedSubjects.semester'] = semester;
    }
    if (section) {
      query['assignedSubjects.section'] = section;
    }
    
    const facultyTeaching = await FacultyDepartmentSubject.find(query)
      .populate('faculty', 'firstName lastName email employeeId designation')
      .populate('department', 'name code')
      .populate('assignedSubjects.subject', 'name code credits');
    
    console.log('[FacDeptSubj] Found faculty teaching subject:', facultyTeaching.length);
    
    res.status(200).json({
      success: true,
      message: "Faculty teaching subject retrieved successfully",
      data: facultyTeaching,
      count: facultyTeaching.length
    });
    
  } catch (error) {
    console.error('Error fetching faculty by subject:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching faculty for subject",
      error: error.message
    });
  }
};

// Get complete timetable data for a department
export const getDepartmentTimetableData = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { academicYear = '2025-2026', semester = '1' } = req.query;
    
    console.log('[FacDeptSubj] Getting timetable data for department:', departmentId);
    
    const timetableData = await FacultyDepartmentSubject.getDepartmentTimetableData(
      departmentId, 
      academicYear, 
      semester
    );
    
    // Format data for timetable display
    const formattedData = timetableData.map(assignment => ({
      facultyId: assignment.faculty._id,
      facultyName: `${assignment.faculty.firstName} ${assignment.faculty.lastName}`,
      employeeId: assignment.faculty.employeeId,
      subjects: assignment.assignedSubjects
        .filter(sub => sub.academicYear === academicYear && sub.semester === semester && sub.status === 'active')
        .map(sub => ({
          subjectId: sub.subject._id,
          subjectName: sub.subject.name,
          subjectCode: sub.subject.code,
          credits: sub.subject.credits,
          section: sub.section
        }))
    }));
    
    console.log('[FacDeptSubj] Formatted timetable data:', formattedData.length);
    
    res.status(200).json({
      success: true,
      message: "Department timetable data retrieved successfully",
      data: formattedData,
      academicYear,
      semester,
      department: departmentId,
      count: formattedData.length
    });
    
  } catch (error) {
    console.error('Error fetching timetable data:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching timetable data",
      error: error.message
    });
  }
};

// Assign a subject to a faculty
export const assignSubjectToFaculty = async (req, res) => {
  try {
    const { facultyId, subjectId, academicYear = '2025-2026', semester = '1', section = 'A' } = req.body;
    
    console.log('[FacDeptSubj] Assigning subject to faculty:', { facultyId, subjectId, academicYear, semester, section });
    
    // Validate required fields
    if (!facultyId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "Faculty ID and Subject ID are required"
      });
    }
    
    // Check if faculty exists
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: "Faculty not found"
      });
    }
    
    console.log('[FacDeptSubj] Found faculty:', faculty.firstName, faculty.lastName);
    
    // Check if subject exists
    const subject = await AdminSubject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found"
      });
    }
    
    console.log('[FacDeptSubj] Found subject:', subject.name);
    
    // Find or create faculty-department record
    let facultyRecord = await FacultyDepartmentSubject.findOne({
      faculty: facultyId
    });
    
    if (!facultyRecord) {
      // Create new record - need to find faculty's department
      let departmentId = faculty.department;
      
      console.log('[FacDeptSubj] Faculty department value:', departmentId, typeof departmentId);
      
      // If department is a string, try to find corresponding AcademicDepartment
      if (typeof departmentId === 'string') {
        const department = await AcademicDepartment.findOne({
          $or: [
            { name: new RegExp(departmentId, 'i') },
            { code: new RegExp(departmentId, 'i') }
          ]
        });
        
        if (department) {
          departmentId = department._id;
          console.log('[FacDeptSubj] Found matching department:', department.name);
        } else {
          return res.status(404).json({
            success: false,
            message: "Faculty department not found in AcademicDepartment collection"
          });
        }
      }
      
      console.log('[FacDeptSubj] Creating new faculty record with department:', departmentId);
      
      facultyRecord = new FacultyDepartmentSubject({
        faculty: facultyId,
        department: departmentId,
        assignedSubjects: [],
        roleInDepartment: faculty.designation || 'Other',
        isActive: true
      });
    }
    
    try {
      await facultyRecord.addSubject(subjectId, academicYear, semester, section);
      
      // Populate the response
      await facultyRecord.populate('faculty', 'firstName lastName employeeId');
      await facultyRecord.populate('assignedSubjects.subject', 'name code');
      
      console.log('[FacDeptSubj] Subject assigned successfully');
      
      res.status(200).json({
        success: true,
        message: "Subject assigned to faculty successfully",
        data: facultyRecord
      });
      
    } catch (error) {
      if (error.message.includes('already assigned')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }
    
  } catch (error) {
    console.error('Error assigning subject to faculty:', error);
    res.status(500).json({
      success: false,
      message: "Error assigning subject to faculty",
      error: error.message
    });
  }
};

// Remove a subject from faculty
export const removeSubjectFromFaculty = async (req, res) => {
  try {
    const { facultyId, subjectId, academicYear = '2025-2026', semester = '1', section = 'A' } = req.body;
    
    console.log('[FacDeptSubj] Removing subject from faculty:', { facultyId, subjectId });
    
    const facultyRecord = await FacultyDepartmentSubject.findOne({
      faculty: facultyId
    });
    
    if (!facultyRecord) {
      return res.status(404).json({
        success: false,
        message: "Faculty record not found"
      });
    }
    
    await facultyRecord.removeSubject(subjectId, academicYear, semester, section);
    
    console.log('[FacDeptSubj] Subject removed successfully');
    
    res.status(200).json({
      success: true,
      message: "Subject removed from faculty successfully",
      data: facultyRecord
    });
    
  } catch (error) {
    console.error('Error removing subject from faculty:', error);
    res.status(500).json({
      success: false,
      message: "Error removing subject from faculty",
      error: error.message
    });
  }
};

// Get faculty assignment summary
export const getFacultyAssignmentSummary = async (req, res) => {
  try {
    const { academicYear = '2025-2026', semester } = req.query;
    
    console.log('[FacDeptSubj] Getting assignment summary');
    
    // Simple aggregation without lookups first
    const pipeline = [
      {
        $match: {
          isActive: true
        }
      },
      {
        $group: {
          _id: '$department',
          departmentName: { $first: '$department' },
          totalFaculty: { $sum: 1 },
          facultyWithSubjects: {
            $sum: {
              $cond: [
                { $gt: [{ $size: '$assignedSubjects' }, 0] },
                1,
                0
              ]
            }
          },
          totalSubjectAssignments: {
            $sum: { $size: '$assignedSubjects' }
          }
        }
      },
      {
        $sort: { departmentName: 1 }
      }
    ];
    
    const summary = await FacultyDepartmentSubject.aggregate(pipeline);
    
    console.log('[FacDeptSubj] Assignment summary:', summary.length, 'departments');
    
    res.status(200).json({
      success: true,
      message: "Faculty assignment summary retrieved successfully",
      data: summary,
      academicYear,
      semester: semester || 'All'
    });
    
  } catch (error) {
    console.error('Error fetching assignment summary:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching assignment summary",
      error: error.message
    });
  }
};

// Update faculty preferences
export const updateFacultyPreferences = async (req, res) => {
  try {
    const { facultyId } = req.params;
    const { timetablePreferences, specializations, qualifications } = req.body;
    
    console.log('[FacDeptSubj] Updating faculty preferences for:', facultyId);
    
    const facultyRecord = await FacultyDepartmentSubject.findOne({
      faculty: facultyId
    });
    
    if (!facultyRecord) {
      return res.status(404).json({
        success: false,
        message: "Faculty record not found"
      });
    }
    
    // Update preferences
    if (timetablePreferences) {
      facultyRecord.timetablePreferences = {
        ...facultyRecord.timetablePreferences,
        ...timetablePreferences
      };
    }
    
    if (specializations) {
      facultyRecord.specializations = specializations;
    }
    
    if (qualifications) {
      facultyRecord.qualifications = qualifications;
    }
    
    await facultyRecord.save();
    
    console.log('[FacDeptSubj] Faculty preferences updated successfully');
    
    res.status(200).json({
      success: true,
      message: "Faculty preferences updated successfully",
      data: facultyRecord
    });
    
  } catch (error) {
    console.error('Error updating faculty preferences:', error);
    res.status(500).json({
      success: false,
      message: "Error updating faculty preferences",
      error: error.message
    });
  }
};

// Get all records (for debugging) - Simplified
export const getAllRecords = async (req, res) => {
  try {
    console.log('[FacDeptSubj] Getting all records for debugging');
    
    const allRecords = await FacultyDepartmentSubject.find({})
      .populate('faculty', 'firstName lastName email')
      .populate('assignedSubjects.subject', 'name code')
      .limit(20);
    
    console.log('[FacDeptSubj] Found records:', allRecords.length);
    
    const simpleData = allRecords.map(record => ({
      id: record._id,
      facultyName: record.faculty ? `${record.faculty.firstName} ${record.faculty.lastName}` : 'Unknown',
      facultyEmail: record.faculty?.email,
      department: record.department,
      isActive: record.isActive,
      subjects: record.assignedSubjects.map(sub => ({
        name: sub.subject?.name || 'Unknown',
        code: sub.subject?.code || 'N/A',
        semester: sub.semester,
        section: sub.section,
        academicYear: sub.academicYear,
        status: sub.status
      })),
      subjectsCount: record.assignedSubjects.length,
      createdAt: record.createdAt
    }));
    
    res.json({
      success: true,
      message: "Faculty Department Subject records (Simplified)",
      count: allRecords.length,
      data: simpleData
    });
    
  } catch (error) {
    console.error('Error fetching all records:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching records",
      error: error.message
    });
  }
};

export default {
  getFacultyByDepartment,
  getSubjectsByFaculty,
  getFacultyBySubject,
  getDepartmentTimetableData,
  assignSubjectToFaculty,
  removeSubjectFromFaculty,
  getFacultyAssignmentSummary,
  updateFacultyPreferences,
  getAllRecords
};