import express from 'express';
const router = express.Router();

import AccountStudent from '../models/AccountStudent.js';
import Stream from '../models/Stream.js';

// POST /api/account/add-student
router.post('/add-student', async (req, res) => {
  const {
    firstName,
    middleName,
    lastName,
    enrollmentNumber,
    mobileNumber,
    email,
    stream,
    semesterRecord,
    message,
  } = req.body;

  if (!stream) {
    return res.status(400).json({ error: 'Stream is required' });
  }

  console.log('Enrollment number:', enrollmentNumber);

  try {
    let accountStudent = await AccountStudent.findOne({ enrollmentNumber });
    console.log('Account student found:', accountStudent);

    if (accountStudent) {
      accountStudent.stream = stream;
      accountStudent.semesterEntries.push({
        semesterRecord,
        message,
        addedAt: new Date(),
      });
      await accountStudent.save();
      return res.json({ message: 'Semester entry added successfully', accountStudent });
    }

    accountStudent = new AccountStudent({
      firstName,
      middleName,
      lastName,
      enrollmentNumber,
      mobileNumber,
      email,
      stream,
      semesterEntries: [
        {
          semesterRecord,
          message,
          addedAt: new Date(),
        },
      ],
    });

    await accountStudent.save();
    res.json({ message: 'Student added successfully', accountStudent });
  } catch (err) {
    console.error('Error adding student to account:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/account/students - Fetch all account students
router.get('/students', async (req, res) => {
  try {
    const students = await AccountStudent.find();
    res.json(students);
  } catch (err) {
    console.error('Error fetching account students:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/account/students/:enrollmentNumber - Fetch a single student by enrollment number
router.get('/students/:enrollmentNumber', async (req, res) => {
  try {
    const student = await AccountStudent.findOne({
      enrollmentNumber: req.params.enrollmentNumber,
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const stream = await Stream.findById(student.stream);

    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    const studentWithStreamName = {
      ...student.toObject(),
      stream: stream.name,
    };

    res.json(studentWithStreamName);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
