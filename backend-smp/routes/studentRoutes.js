import express from 'express';
import Student from '../models/Student.js';

const router = express.Router();


// Add new student
router.post('/', async (req, res) => {
  try {
    const { email, rollNo } = req.body;

    const existingStudent = await Student.findOne({
      $or: [{ email }, { rollNo }]
    });

    if (existingStudent) {
      return res.status(400).json({
        message: existingStudent.email === email
          ? 'Email already registered'
          : 'Roll number already exists'
      });
    }

    const student = new Student(req.body);
    await student.save();
    res.status(201).json({ message: 'Student added successfully', student });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student by BT number
router.get('/bt/:studentId', async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find();
    res.json({ students }); // <-- should be an array
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student by ID (this should be last to avoid conflicts with other routes)
// router.get('/:id', async (req, res) => {
//   try {
//     const student = await Student.findById(req.params.id);
//     if (!student) {
//       return res.status(404).json({ message: 'Student not found' });
//     }
//     res.json(student);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

router.get("/api/students", async (req, res) => {
  const { studentId } = req.query;

  try {
    const student = await Student.findOne({ studentId }); // ✅ not FacultyModel
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ students: [student] });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
