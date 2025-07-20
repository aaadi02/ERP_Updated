import AccountStudent from '../models/AccountStudent.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const studentLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Student login attempt:', { email, password: password ? '***provided***' : '***missing***' });
    
    // Find student by email
    const student = await AccountStudent.findOne({ email }).select('+password');
    
    if (!student) {
      console.log('Student not found with email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, student.password);
    
    if (!isMatch) {
      console.log('Password mismatch for student:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      {
        id: student._id,
        userId: student._id,
        email: student.email,
        role: 'student'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Remove password from response
    student.password = undefined;
    
    res.json({
      token,
      user: {
        _id: student._id,
        email: student.email,
        name: student.name,
        studentId: student.studentId,
        role: 'student',
        department: student.department,
        year: student.year,
        section: student.section
      }
    });
    
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export { studentLogin };
