import express from "express";
import Faculty from "../models/faculty.js";
import bcrypt from "bcrypt";

const router = express.Router();

// Create faculty
router.post("/", async (req, res) => {
  try {
    const { firstname, type, employmentStatus, employeeId, password, department } = req.body;

    // Check if employee ID already exists
    const existingFaculty = await Faculty.findOne({ employeeId });
    if (existingFaculty) {
      return res.status(400).json({ error: "Employee ID already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const faculty = new Faculty({
      firstname,
      type,
      employmentStatus,
      employeeId,
      password: hashedPassword,
      department,
    });

    await faculty.save();
    res.status(201).json(faculty);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all faculty with optional type filter
router.get("/", async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};

    // If type is provided, filter by type
    if (type) {
      query.type = type;
    }

    const faculties = await Faculty.find(query).populate("department", "name");
    res.json(faculties);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all faculties (for dashboard)
router.get("/all", async (req, res) => {
  try {
    const faculties = await Faculty.find({}).populate("department", "name");
    
    // Create department-wise breakdown
    const departmentWise = {};
    faculties.forEach(faculty => {
      const deptName = faculty.department?.name || faculty.department || "Unknown";
      if (!departmentWise[deptName]) {
        departmentWise[deptName] = 0;
      }
      departmentWise[deptName]++;
    });

    const departmentWiseArray = Object.entries(departmentWise).map(([name, count]) => ({
      name,
      count
    }));

    res.json({ 
      faculties, 
      total: faculties.length,
      departmentWise: departmentWiseArray
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single faculty by ID
router.get("/:id", async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    res.json(faculty);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update employment status
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    res.json(faculty);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update employment status by employee ID
router.put("/employment-status/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { employmentStatus } = req.body;
    
    // Validate employment status
    if (!["Probation Period", "Permanent Employee"].includes(employmentStatus)) {
      return res.status(400).json({ 
        error: "Invalid employment status. Must be 'Probation Period' or 'Permanent Employee'" 
      });
    }

    const faculty = await Faculty.findOneAndUpdate(
      { employeeId }, 
      { employmentStatus }, 
      { new: true }
    );
    
    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    
    res.json({ 
      message: "Employment status updated successfully", 
      faculty: {
        employeeId: faculty.employeeId,
        firstname: faculty.firstname,
        employmentStatus: faculty.employmentStatus
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete faculty
router.delete("/:id", async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndDelete(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    res.json({ message: "Faculty deleted successfully." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;