import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Faculty from "../models/faculty.js";

const router = express.Router(); // ✅ valid

router.post("/", async (req, res) => {
  try {
    const { firstname, type, employmentStatus, employeeId, password } =
      req.body;

    // Hash the password using bcrypt before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const faculty = new Faculty({
      firstname,
      type,
      employmentStatus,
      employeeId,
      password: hashedPassword,
    });

    await faculty.save();
    res.status(201).json(faculty);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all faculty
router.get("/", async (req, res) => {
  try {
    const faculties = await Faculty.find(); // Fetch all faculties

    if (faculties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No faculty records found",
      });
    }

    res.status(200).json({
      success: true,
      data: faculties,
    });
  } catch (error) {
    console.error("Get Faculties Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving faculty data",
      error: error.message,
    });
  }
});
router.get('/dashboard', async (req, res) => {
  try {
    const { financialYear = '2024-2025' } = req.query;
    
    // Get unique employees from salary data
    const employees = await Salary.aggregate([
      {
        $group: {
          _id: '$name',
          totalSalary: { $sum: '$amount' },
          recordCount: { $sum: 1 },
          latestRecord: { $last: '$$ROOT' }
        }
      },
      {
        $project: {
          name: '$_id',
          totalSalary: 1,
          recordCount: 1,
          latestMonth: '$latestRecord.month',
          latestAmount: '$latestRecord.amount'
        }
      },
      { $sort: { totalSalary: -1 } }
    ]);

    // Get PF data for these employees
    const pfData = await PF.find({ financialYear }).lean();
    const pfByEmployee = {};
    pfData.forEach(pf => {
      pfByEmployee[pf.employeeName] = pf;
    });

    // Get Income Tax data for these employees
    const incomeTaxData = await IncomeTax.find({ financialYear }).lean();
    const incomeTaxByEmployee = {};
    incomeTaxData.forEach(it => {
      incomeTaxByEmployee[it.employeeName] = it;
    });

    // Combine all data
    const facultyData = employees.map(emp => ({
      ...emp,
      pf: pfByEmployee[emp.name] || null,
      incomeTax: incomeTaxByEmployee[emp.name] || null,
      hasCompleteData: !!(pfByEmployee[emp.name] && incomeTaxByEmployee[emp.name])
    }));

    // Summary statistics
    const summary = {
      totalEmployees: employees.length,
      totalSalaryPaid: employees.reduce((sum, emp) => sum + emp.totalSalary, 0),
      employeesWithPF: Object.keys(pfByEmployee).length,
      employeesWithIncomeTax: Object.keys(incomeTaxByEmployee).length,
      fullyCompliantEmployees: facultyData.filter(emp => emp.hasCompleteData).length
    };

    res.json({
      summary,
      facultyData,
      financialYear
    });
  } catch (err) {
    console.error('Error fetching faculty dashboard:', err);
    res.status(500).json({ error: "Error fetching faculty dashboard" });
  }
});
// Update employment status
router.put("/:id/status", async (req, res) => {
  try {
    const { employmentStatus } = req.body;
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      { employmentStatus },
      { new: true }
    );
    res.json(faculty);
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

// Faculty Login (type-based, only Permanent Employee allowed)
router.post("/rolelogin", async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    // Find faculty by employeeId
    const faculty = await Faculty.findOne({ employeeId });

    if (!faculty) {
      return res.status(404).json({ error: "Faculty not found" });
    }

    // Check if employment status is 'Permanent Employee'
    if (faculty.employmentStatus !== "Permanent Employee") {
      return res
        .status(403)
        .json({ error: "Only Permanent Employees can log in" });
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, faculty.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Create a JWT token
    const token = jwt.sign(
      { id: faculty._id, type: faculty.type },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Respond with the token
    res.json({ token, faculty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;