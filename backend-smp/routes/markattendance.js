import express from "express";
import mongoose from "mongoose";
import Faculty from "../models/faculty.js";
import Student from "../models/student.js";
import AdminSubject from "../models/AdminSubject.js";
import AcademicDepartment from "../models/AcademicDepartment.js";
import Attendance from "../models/attendance.js";

const router = express.Router();

// POST /api/faculty/markattendance
router.post("/", async (req, res) => {
  try {
    const { subjectId, facultyId, selectedStudents = [], date } = req.body;
    
    console.log("[MarkAttendance] Request body:", { subjectId, facultyId, selectedStudents: selectedStudents.length, date });
    
    if (!subjectId || !facultyId) {
      return res.status(400).json({
        success: false,
        message: "subjectId and facultyId are required",
      });
    }

    // Find the subject with populated department info
    const adminSubject = await AdminSubject.findById(subjectId)
      .populate('department');
      
    if (!adminSubject) {
      return res.status(404).json({ 
        success: false, 
        message: "Subject not found" 
      });
    }

    console.log("[MarkAttendance] Subject found:", {
      name: adminSubject.name,
      department: adminSubject.department
    });

    // Find faculty
    const faculty = (await Faculty.findOne({ employeeId: facultyId })) || 
                   (await Faculty.findById(facultyId));
    if (!faculty) {
      return res.status(404).json({ 
        success: false, 
        message: "Faculty not found" 
      });
    }

    const today = date ? new Date(date) : new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance is already marked for today
    const existingAttendance = await Attendance.findOne({
      subject: subjectId,
      faculty: faculty._id,
      date: today,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance has already been marked for today for this subject",
        alreadyMarked: true,
      });
    }

    // Find students based on subject's department (AdminSubject only has name and department)
    let allStudents = [];
    
    // Match by department if available
    if (adminSubject.department) {
      let departmentId = null;
      
      if (typeof adminSubject.department === 'object' && adminSubject.department._id) {
        // If department is populated object with _id
        departmentId = adminSubject.department._id;
      } else if (typeof adminSubject.department === 'object' && adminSubject.department.name) {
        // If department is populated object, find by name
        const academicDept = await AcademicDepartment.findOne({ 
          name: { $regex: new RegExp(`^${adminSubject.department.name}$`, 'i') }
        });
        if (academicDept) {
          departmentId = academicDept._id;
        }
      } else if (mongoose.Types.ObjectId.isValid(adminSubject.department)) {
        // If department is already an ObjectId
        departmentId = adminSubject.department;
      } else if (typeof adminSubject.department === 'string') {
        // If department is string name, find the department ObjectId
        const academicDept = await AcademicDepartment.findOne({ 
          name: { $regex: new RegExp(`^${adminSubject.department}$`, 'i') }
        });
        if (academicDept) {
          departmentId = academicDept._id;
        }
      }

      console.log("[MarkAttendance] Department ID:", departmentId);

      if (departmentId) {
        allStudents = await Student.find({ department: departmentId })
          .select('firstName middleName lastName email studentId enrollmentNumber year section department');
      } else {
        console.log("[MarkAttendance] No valid department found, getting all students");
        allStudents = await Student.find({})
          .select('firstName middleName lastName email studentId enrollmentNumber year section department');
      }
    } else {
      // If no department info, get all students
      allStudents = await Student.find({})
        .select('firstName middleName lastName email studentId enrollmentNumber year section department');
    }
    
    console.log("[MarkAttendance] Students found:", allStudents.length);

    if (!allStudents.length) {
      return res.status(404).json({
        success: false,
        message: `No students found for this subject's department.`,
        subjectInfo: {
          name: adminSubject.name,
          department: adminSubject.department?.name || adminSubject.department || 'N/A'
        }
      });
    }

    // Get department and semester IDs for attendance records
    let departmentId = adminSubject.department?._id || adminSubject.department;
    let semesterId = adminSubject.semester?._id || adminSubject.semester;
    
    // Create default ObjectIds if not available
    if (!departmentId) {
      departmentId = new mongoose.Types.ObjectId();
    }
    if (!semesterId) {
      semesterId = new mongoose.Types.ObjectId();
    }

    // Prepare attendance records
    const records = allStudents.map((student) => ({
      student: student._id,
      subject: adminSubject._id,
      faculty: faculty._id,
      date: today,
      status: selectedStudents.includes(student._id.toString()) ? "present" : "absent",
      semester: semesterId,
      department: departmentId,
    }));

    await Attendance.insertMany(records);
    
    console.log("[MarkAttendance] Attendance marked successfully for", records.length, "students");

    res.json({ 
      success: true, 
      message: "Attendance marked for all students.",
      data: {
        totalStudents: allStudents.length,
        presentStudents: selectedStudents.length,
        absentStudents: allStudents.length - selectedStudents.length,
        subject: {
          name: adminSubject.name,
          department: adminSubject.department?.name || adminSubject.department,
          year: 'All Years', // AdminSubject doesn't have year
          section: 'All Sections' // AdminSubject doesn't have section
        }
      }
    });
  } catch (error) {
    console.error("[MarkAttendance] Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: error.toString()
    });
  }
});

// GET /api/faculty/markattendance/subject-details/:subjectId - Get subject details with department, year, section
router.get("/subject-details/:subjectId", async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    console.log("[GetSubjectDetails] Getting details for subject:", subjectId);

    // Find the subject with populated information
    const adminSubject = await AdminSubject.findById(subjectId)
      .populate('department');
      
    if (!adminSubject) {
      return res.status(404).json({ 
        success: false, 
        message: "Subject not found" 
      });
    }

    // Count students for this subject's department
    let totalStudents = 0;
    if (adminSubject.department) {
      let departmentId = null;
      
      if (typeof adminSubject.department === 'object' && adminSubject.department._id) {
        departmentId = adminSubject.department._id;
      } else if (typeof adminSubject.department === 'object' && adminSubject.department.name) {
        const academicDept = await AcademicDepartment.findOne({ 
          name: { $regex: new RegExp(`^${adminSubject.department.name}$`, 'i') }
        });
        if (academicDept) {
          departmentId = academicDept._id;
        }
      } else if (mongoose.Types.ObjectId.isValid(adminSubject.department)) {
        departmentId = adminSubject.department;
      } else if (typeof adminSubject.department === 'string') {
        const academicDept = await AcademicDepartment.findOne({ 
          name: { $regex: new RegExp(`^${adminSubject.department}$`, 'i') }
        });
        if (academicDept) {
          departmentId = academicDept._id;
        }
      }

      if (departmentId) {
        totalStudents = await Student.countDocuments({ department: departmentId });
      }
    }

    // Return subject details (AdminSubject only has name and department)
    const subjectDetails = {
      _id: adminSubject._id,
      name: adminSubject.name,
      department: adminSubject.department?.name || adminSubject.department || 'Not Specified',
      // Since AdminSubject doesn't have these fields, we'll set defaults
      year: 'All Years',
      section: 'All Sections',
      semester: 'Not Specified',
      totalStudents: totalStudents // Now shows actual count
    };

    console.log("[GetSubjectDetails] Subject details:", subjectDetails);

    res.json({ 
      success: true, 
      data: subjectDetails
    });
  } catch (error) {
    console.error("[GetSubjectDetails] Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: error.toString()
    });
  }
});

// GET /api/faculty/markattendance/students/:subjectId - Get students for a specific subject
router.get("/students/:subjectId", async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    console.log("[GetSubjectStudents] Getting students for subject:", subjectId);

    // Find the subject with populated department info
    const adminSubject = await AdminSubject.findById(subjectId)
      .populate('department');
      
    if (!adminSubject) {
      return res.status(404).json({ 
        success: false, 
        message: "Subject not found" 
      });
    }

    console.log("[GetSubjectStudents] Subject details:", {
      name: adminSubject.name,
      department: adminSubject.department
    });

    // Since AdminSubject doesn't have year/section, we'll get students by department
    // If you need more specific filtering, you'd need to enhance the AdminSubject schema
    let students = [];
    
    // Match by department if available
    if (adminSubject.department) {
      let departmentId = null;
      
      if (typeof adminSubject.department === 'object' && adminSubject.department._id) {
        // If department is populated object with _id
        departmentId = adminSubject.department._id;
      } else if (typeof adminSubject.department === 'object' && adminSubject.department.name) {
        // If department is populated object, find by name
        const academicDept = await AcademicDepartment.findOne({ 
          name: { $regex: new RegExp(`^${adminSubject.department.name}$`, 'i') }
        });
        if (academicDept) {
          departmentId = academicDept._id;
        }
      } else if (mongoose.Types.ObjectId.isValid(adminSubject.department)) {
        // If department is already an ObjectId
        departmentId = adminSubject.department;
      } else if (typeof adminSubject.department === 'string') {
        // If department is string name, find the department ObjectId
        const academicDept = await AcademicDepartment.findOne({ 
          name: { $regex: new RegExp(`^${adminSubject.department}$`, 'i') }
        });
        if (academicDept) {
          departmentId = academicDept._id;
        }
      }

      console.log("[GetSubjectStudents] Department ID:", departmentId);

      if (departmentId) {
        students = await Student.find({ department: departmentId })
          .select('firstName middleName lastName email studentId enrollmentNumber year section department')
          .populate('department', 'name')
          .sort({ firstName: 1, lastName: 1 });
      } else {
        console.log("[GetSubjectStudents] No valid department found, getting all students");
        students = await Student.find({})
          .select('firstName middleName lastName email studentId enrollmentNumber year section department')
          .populate('department', 'name')
          .sort({ firstName: 1, lastName: 1 });
      }
    } else {
      // If no department info, get all students
      students = await Student.find({})
        .select('firstName middleName lastName email studentId enrollmentNumber year section department')
        .populate('department', 'name')
        .sort({ firstName: 1, lastName: 1 });
    }

    // Add computed name field for frontend compatibility
    const studentsWithName = students.map(student => ({
      ...student.toObject(),
      name: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`.trim()
    }));

    console.log("[GetSubjectStudents] Found students:", studentsWithName.length);

    res.json({ 
      success: true, 
      data: studentsWithName, // Use students with computed name field
      subject: {
        _id: adminSubject._id,
        name: adminSubject.name,
        department: adminSubject.department?.name || adminSubject.department,
        year: 'All Years', // AdminSubject doesn't have year
        section: 'All Sections', // AdminSubject doesn't have section
        semester: 'Not Specified' // AdminSubject doesn't have semester
      },
      totalStudents: studentsWithName.length
    });
  } catch (error) {
    console.error("[GetSubjectStudents] Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      error: error.toString()
    });
  }
});

// GET /api/faculty/attendance/:subjectId?date=YYYY-MM-DD
router.get("/attendance/:subjectId", async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { date } = req.query;
    const query = { subject: subjectId };
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      query.date = d;
    }
    const records = await Attendance.find(query)
      .populate("student")
      .populate("faculty");
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
