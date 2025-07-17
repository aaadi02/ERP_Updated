import express from 'express';
import Student from '../models/student.js';
import Faculty from '../models/faculty.js';
import BorrowerEntry from '../models/BorrowerEntry.js';

const router = express.Router();

router.post('/borrower-entry', async (req, res) => {
  try {
    const newBorrower = new BorrowerEntry(req.body);
    await newBorrower.save();

    res.status(201).json({ success: true, message: 'Borrower entry saved successfully.' });
  } catch (error) {
    console.error('Error saving borrower entry:', error);
    res.status(500).json({ success: false, message: 'Failed to submit borrower entry.', error: error.message });
  }
});

router.get('/borrower-entry', async (req, res) => {
  const { id, type } = req.query;

  try {
    if (type === 'student') {
      const student = await Student.findOne({ studentId: id }).populate('department', 'name');

      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      return res.json({
        success: true,
        result: {
          name: `${student.firstName} ${student.lastName}`,
          department: student.department?.name || student.department || '',
          gender: student.gender || '',
          admissionBatch: student.admissionBatch || student.batch || '',
        },
      });
    }

    if (type === 'faculty') {
      const faculty = await Faculty.findOne({ employeeId: id }).populate('department', 'name');

      if (!faculty) return res.status(404).json({ success: false, message: 'Faculty not found' });

      return res.json({
        success: true,
        result: {
          name: `${faculty.firstName} ${faculty.lastName}`,
          department: faculty.department?.name || faculty.department || '',
          gender: faculty.gender || '',
          designation: faculty.designation || '',
        },
      });
    }

    res.status(400).json({ success: false, message: 'Invalid type' });
  } catch (error) {
    console.error('Error fetching borrower entry:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
});

export default router;
