import Student from '../models/StudentManagement.js';
import Faculty from '../models/faculty.js';
import Attendance from '../models/attendance.js';
import AccountStudent from '../models/AccountStudent.js';
import AdminSubject from '../models/AdminSubject.js';
import AcademicDepartment from '../models/AcademicDepartment.js';
import Semester from '../models/Semester.js';
import Stream from '../models/Stream.js';
import { populateQuery, getPopulateOptions } from '../utils/populateUtils.js';

// Example controller showing how to use populated models

export const getStudentWithFullDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Get student with all related data populated
    const student = await Student.findById(studentId)
      .populate({
        path: 'stream',
        select: 'name description'
      })
      .populate({
        path: 'department',
        select: 'name',
        populate: {
          path: 'stream',
          select: 'name description'
        }
      })
      .populate({
        path: 'semester',
        select: 'number',
        populate: {
          path: 'subjects',
          select: 'name',
          populate: {
            path: 'department',
            select: 'name'
          }
        }
      })
      .populate({
        path: 'subjects',
        select: 'name department',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .populate({
        path: 'semesterRecords.semester',
        select: 'number'
      })
      .populate({
        path: 'semesterRecords.subjects.subject',
        select: 'name department',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .populate({
        path: 'backlogs',
        select: 'name department',
        populate: {
          path: 'department',
          select: 'name'
        }
      });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });

  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getFacultyWithFullDetails = async (req, res) => {
  try {
    const { facultyId } = req.params;
    
    // Get faculty with all related data populated
    const faculty = await Faculty.findById(facultyId)
      .populate({
        path: 'department',
        select: 'name',
        populate: {
          path: 'stream',
          select: 'name description'
        }
      })
      .populate({
        path: 'subjectsTaught',
        select: 'name department',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .populate({
        path: 'ccAssignments.department',
        select: 'name'
      })
      .populate({
        path: 'ccAssignments.semester',
        select: 'number'
      });

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found'
      });
    }

    res.status(200).json({
      success: true,
      data: faculty
    });

  } catch (error) {
    console.error('Error fetching faculty details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getAttendanceWithFullDetails = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    
    // Get attendance with all related data populated
    const attendance = await Attendance.findById(attendanceId)
      .populate({
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
      })
      .populate({
        path: 'subject',
        select: 'name department',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .populate({
        path: 'faculty',
        select: 'firstName lastName employeeId department',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .populate({
        path: 'semester',
        select: 'number'
      })
      .populate({
        path: 'department',
        select: 'name'
      });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: attendance
    });

  } catch (error) {
    console.error('Error fetching attendance details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getAllStudentsWithDetails = async (req, res) => {
  try {
    // Using the populate utility function
    let query = Student.find();
    query = populateQuery(query, 'student', 'detailed');
    
    const students = await query.exec();

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getAllFacultiesWithDetails = async (req, res) => {
  try {
    // Using the populate utility function
    let query = Faculty.find();
    query = populateQuery(query, 'faculty', 'detailed');
    
    const faculties = await query.exec();

    res.status(200).json({
      success: true,
      count: faculties.length,
      data: faculties
    });

  } catch (error) {
    console.error('Error fetching faculties:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

export const getAccountStudentWithDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const accountStudent = await AccountStudent.findById(studentId)
      .populate({
        path: 'stream',
        select: 'name description'
      })
      .populate({
        path: 'department',
        select: 'name',
        populate: {
          path: 'stream',
          select: 'name description'
        }
      })
      .populate({
        path: 'currentSemester',
        select: 'number',
        populate: {
          path: 'subjects',
          select: 'name',
          populate: {
            path: 'department',
            select: 'name'
          }
        }
      })
      .populate({
        path: 'semesterEntries.semesterRecord.semester',
        select: 'number'
      })
      .populate({
        path: 'semesterEntries.semesterRecord.subjects.subject',
        select: 'name department',
        populate: {
          path: 'department',
          select: 'name'
        }
      });

    if (!accountStudent) {
      return res.status(404).json({
        success: false,
        message: 'Account student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: accountStudent
    });

  } catch (error) {
    console.error('Error fetching account student details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Example of complex query with multiple filters and population
export const getAttendanceReportWithFullDetails = async (req, res) => {
  try {
    const { department, semester, subject, startDate, endDate } = req.query;
    
    // Build filter object
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = semester;
    if (subject) filter.subject = subject;
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const attendanceReport = await Attendance.find(filter)
      .populate({
        path: 'student',
        select: 'firstName lastName enrollmentNumber',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .populate({
        path: 'subject',
        select: 'name'
      })
      .populate({
        path: 'faculty',
        select: 'firstName lastName'
      })
      .populate({
        path: 'department',
        select: 'name'
      })
      .populate({
        path: 'semester',
        select: 'number'
      })
      .sort({ date: -1 });

    // Group by student for summary
    const studentAttendanceSummary = {};
    attendanceReport.forEach(record => {
      const studentId = record.student._id.toString();
      if (!studentAttendanceSummary[studentId]) {
        studentAttendanceSummary[studentId] = {
          student: record.student,
          totalClasses: 0,
          presentClasses: 0,
          absentClasses: 0,
          percentage: 0
        };
      }
      
      studentAttendanceSummary[studentId].totalClasses++;
      if (record.status === 'present') {
        studentAttendanceSummary[studentId].presentClasses++;
      } else {
        studentAttendanceSummary[studentId].absentClasses++;
      }
      
      studentAttendanceSummary[studentId].percentage = 
        (studentAttendanceSummary[studentId].presentClasses / 
         studentAttendanceSummary[studentId].totalClasses * 100).toFixed(2);
    });

    res.status(200).json({
      success: true,
      data: {
        detailedRecords: attendanceReport,
        summary: Object.values(studentAttendanceSummary),
        totalRecords: attendanceReport.length
      }
    });

  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

