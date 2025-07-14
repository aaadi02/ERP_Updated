import express from "express";
import Subject from "../models/Subject.js";
import Department from "../models/Department.js";
import AdminSubject from "../models/AdminSubject.js";
import AcademicDepartment from "../models/AcademicDepartment.js";

const router = express.Router();

// GET all subjects
router.get("/", async (req, res) => {
  try {
    console.log("[SubjectsFetch] Starting subject fetch...");
    const subjects = await Subject.find().populate("department");
    console.log("[SubjectsFetch] Subjects retrieved:", subjects.length);

    // Validate populated data
    const validSubjects = subjects.filter((subject) => {
      if (!subject.department || !subject.name) {
        console.warn("[SubjectsFetch] Invalid subject:", {
          _id: subject._id,
          name: subject.name,
          department: subject.department,
        });
        return false;
      }
      return true;
    });

    if (validSubjects.length === 0) {
      console.log("[SubjectsFetch] No valid subjects found");
      return res.status(200).json({
        success: true,
        message: "No valid subjects found",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Subjects retrieved successfully",
      data: validSubjects,
    });
  } catch (error) {
    console.error("[SubjectsFetch] Error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Error fetching subjects",
      error: error.message,
    });
  }
});

// GET subjects by department
router.get("/department/:departmentName", async (req, res) => {
  try {
    const { departmentName } = req.params;
    console.log("[SubjectsByDepartment] Fetching subjects for department:", departmentName);

    // First try AdminSubject with AcademicDepartment
    const academicDepartment = await AcademicDepartment.findOne({
      name: { $regex: new RegExp(departmentName, 'i') }
    });

    if (academicDepartment) {
      console.log("[SubjectsByDepartment] Found academic department:", academicDepartment.name);
      
      // Find admin subjects for this department
      const adminSubjects = await AdminSubject.find({ department: academicDepartment._id }).populate("department");
      console.log("[SubjectsByDepartment] Admin subjects found:", adminSubjects.length);

      if (adminSubjects.length > 0) {
        const formattedSubjects = adminSubjects.map(subject => ({
          _id: subject._id,
          name: subject.name,
          code: subject.code || subject.subjectCode || '',
          department: subject.department?.name || departmentName,
          type: 'admin'
        }));

        return res.status(200).json({
          success: true,
          message: "Admin subjects retrieved successfully",
          data: formattedSubjects,
          department: departmentName
        });
      }
    }

    // Fallback to old Department/Subject logic
    const department = await Department.findOne({
      name: { $regex: new RegExp(departmentName, 'i') }
    });

    if (!department) {
      console.log("[SubjectsByDepartment] No department found:", departmentName);
      return res.status(200).json({
        success: true,
        message: "Department not found",
        data: [],
      });
    }

    // Find subjects for this department
    const subjects = await Subject.find({ department: department._id }).populate("department");
    console.log("[SubjectsByDepartment] Legacy subjects found:", subjects.length);

    const formattedSubjects = subjects.map(subject => ({
      _id: subject._id,
      name: subject.name,
      code: subject.subjectCode,
      department: subject.department?.name || departmentName,
      year: subject.year,
      totalLectures: subject.totalLectures,
      type: 'legacy'
    }));

    res.status(200).json({
      success: true,
      message: "Subjects retrieved successfully",
      data: formattedSubjects,
      department: departmentName
    });
  } catch (error) {
    console.error("[SubjectsByDepartment] Error:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "Error fetching subjects by department",
      error: error.message,
    });
  }
});

export default router;
