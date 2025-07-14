import express from "express";
import Subject from "../models/AdminSubject.js";
import AcademicDepartment from "../models/AcademicDepartment.js";

const router = express.Router();

// Department name corrections mapping (consistent with faculty controller)
const departmentCorrections = {
  "eletronic enigneering": "Electronics",
  "eletronic engineering": "Electronics",
  "electronic enigneering": "Electronics",
  "electronic engineering": "Electronics",
  "electronics engineering": "Electronics",
  electronics: "Electronics",
  "computer scince": "Computer Science",
  "computer science": "Computer Science",
  "computer science and engineering": "Computer Science",
  cse: "Computer Science",
  "civil enigneering": "Civil",
  "civil engineering": "Civil",
  civil: "Civil",
  "mechanical enigneering": "Mechanical",
  "mechanical engineering": "Mechanical",
  mechanical: "Mechanical",
  "electrical enigneering": "Electrical",
  "electrical engineering": "Electrical",
  electrical: "Electrical",
  "information tecnology": "Information Technology",
  "information technology": "Information Technology",
  it: "Information Technology",
  "data scince": "Data Science",
  "data science": "Data Science",
  account: "Account Section",
};

// Create Subject
router.post("/", async (req, res) => {
  try {
    const { name, department } = req.body;
    if (!name || !department) {
      return res
        .status(400)
        .json({ error: "Name and department are required." });
    }
    const subject = new Subject({ name, department });
    await subject.save();
    res.status(201).json(subject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all subjects by department
router.get("/", async (req, res) => {
  try {
    const { departmentId } = req.query;
    const filter = departmentId ? { department: departmentId } : {};
    const subjects = await Subject.find(filter).populate("department");
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Subject
router.put("/:id", async (req, res) => {
  try {
    const { name, department } = req.body;
    const updatedData = {};
    if (name) updatedData.name = name;
    if (department) updatedData.department = department;

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );
    res.json(subject);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Subject
router.delete("/:id", async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get subjects by department name (for faculty assignment)
router.get("/by-department", async (req, res) => {
  try {
    let { department } = req.query;

    if (!department) {
      return res.status(400).json({
        success: false,
        message: "Department parameter is required",
      });
    }

    console.log("[SubjectsByDept] Original department:", department);

    // Apply department corrections
    const originalDepartment = department.trim();
    const lowerDept = originalDepartment.toLowerCase();
    let correctedDepartment =
      departmentCorrections[lowerDept] || originalDepartment;

    // If no correction found, normalize to title case
    if (!departmentCorrections[lowerDept]) {
      correctedDepartment = originalDepartment
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    console.log("[SubjectsByDept] Corrected department:", correctedDepartment);

    // Find the academic department by name (try multiple variations)
    const departmentVariations = [
      correctedDepartment,
      originalDepartment,
      correctedDepartment.toLowerCase(),
      originalDepartment.toLowerCase(),
    ];

    let academicDept = null;
    for (const deptName of departmentVariations) {
      academicDept = await AcademicDepartment.findOne({
        name: {
          $regex: new RegExp(
            `^${deptName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "i"
          ),
        },
      });
      if (academicDept) {
        console.log("[SubjectsByDept] Found academic department with name:", deptName);
        break;
      }
    }

    if (!academicDept) {
      console.log("[SubjectsByDept] Academic department not found for:", correctedDepartment);
      return res.status(200).json({
        success: true,
        message: `No academic department found for ${correctedDepartment}`,
        data: [],
      });
    }

    // Find subjects for this department
    const subjects = await Subject.find({ department: academicDept._id })
      .populate("department")
      .sort({ name: 1 });

    console.log("[SubjectsByDept] Found subjects:", subjects.length);

    const subjectsData = subjects.map((subject) => ({
      _id: subject._id,
      name: subject.name,
      department: subject.department?.name || correctedDepartment,
    }));

    res.status(200).json({
      success: true,
      message: `Found ${subjects.length} subjects for ${correctedDepartment}`,
      data: subjectsData,
      department: correctedDepartment,
    });
  } catch (error) {
    console.error("[SubjectsByDept] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching subjects by department",
      error: error.message,
    });
  }
});

// Get subjects by department name (URL parameter version for frontend compatibility)
router.get("/department/:departmentName", async (req, res) => {
  try {
    let { departmentName } = req.params;

    if (!departmentName) {
      return res.status(400).json({
        success: false,
        message: "Department parameter is required",
      });
    }

    // Decode URL encoding
    departmentName = decodeURIComponent(departmentName);
    
    console.log("[SubjectsByDeptParam] Original department:", departmentName);

    // Apply department corrections
    const originalDepartment = departmentName.trim();
    const lowerDept = originalDepartment.toLowerCase();
    let correctedDepartment =
      departmentCorrections[lowerDept] || originalDepartment;

    // If no correction found, normalize to title case
    if (!departmentCorrections[lowerDept]) {
      correctedDepartment = originalDepartment
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    console.log("[SubjectsByDeptParam] Corrected department:", correctedDepartment);

    // Find the academic department by name (try multiple variations)
    const departmentVariations = [
      correctedDepartment,
      originalDepartment,
      correctedDepartment.toLowerCase(),
      originalDepartment.toLowerCase(),
    ];

    let academicDept = null;
    for (const deptName of departmentVariations) {
      academicDept = await AcademicDepartment.findOne({
        name: {
          $regex: new RegExp(
            `^${deptName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "i"
          ),
        },
      });
      if (academicDept) {
        console.log("[SubjectsByDeptParam] Found academic department with name:", deptName);
        break;
      }
    }

    if (!academicDept) {
      console.log("[SubjectsByDeptParam] Academic department not found for:", correctedDepartment);
      return res.status(200).json({
        success: true,
        message: `No academic department found for ${correctedDepartment}`,
        data: [],
      });
    }

    // Find subjects for this department
    const subjects = await Subject.find({ department: academicDept._id })
      .populate("department")
      .sort({ name: 1 });

    console.log("[SubjectsByDeptParam] Found subjects:", subjects.length);

    const subjectsData = subjects.map((subject) => ({
      _id: subject._id,
      name: subject.name,
      department: subject.department?.name || correctedDepartment,
    }));

    res.status(200).json({
      success: true,
      message: `Found ${subjects.length} subjects for ${correctedDepartment}`,
      data: subjectsData,
      department: correctedDepartment,
    });
  } catch (error) {
    console.error("[SubjectsByDeptParam] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching subjects by department",
      error: error.message,
    });
  }
});

export default router;
