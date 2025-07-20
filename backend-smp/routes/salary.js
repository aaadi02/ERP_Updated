import express from "express.js";
const router = express.Router();
import Salary from "../models/Salary.js"; // Mongoose model

// Create new salary record
router.post('/salary', async (req, res) => {
  try {
    const newSalary = new Salary(req.body);
    const savedSalary = await newSalary.save();
    res.status(201).json(savedSalary);
  } catch (err) {
    console.error('Error saving salary record:', err);
    res.status(500).json({ error: "Failed to save salary record", details: err.message });
  }
});

// Get salary record by employee name, month and year
router.get('/salary', async (req, res) => {
  try {
    const { name, month, year } = req.query;
    const query = {};
    
    if (name) query.employeeName = name;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    
    const records = await Salary.find(query);
    res.json(records);
  } catch (err) {
    console.error('Error fetching salary records:', err);
    res.status(500).json({ error: "Server error" });
  }
});

// Total paid salary API
router.get('/salary/total-paid', async (req, res) => {
  try {
    const result = await Salary.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, totalPaid: { $sum: "$amount" } } }
    ]);
    res.json({ totalPaid: result[0]?.totalPaid || 0 });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
