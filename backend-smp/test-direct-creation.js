import mongoose from 'mongoose';
import FacultyDepartmentSubject from './models/FacultyDepartmentSubject.js';
import Faculty from './models/faculty.js';
import AdminSubject from './models/AdminSubject.js';
import AcademicDepartment from './models/AcademicDepartment.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDirectCreation() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get first faculty
    const faculty = await Faculty.findOne({}).lean();
    console.log('📋 First Faculty:', faculty ? `${faculty.firstName} ${faculty.lastName} (${faculty._id})` : 'No faculty found');
    
    // Get first subject  
    const subject = await AdminSubject.findOne({}).lean();
    console.log('📋 First Subject:', subject ? `${subject.name} (${subject._id})` : 'No subject found');
    
    if (!faculty || !subject) {
      console.log('❌ Missing faculty or subject data');
      return;
    }
    
    // Create FacultyDepartmentSubject record directly (without populating department)
    const newRecord = new FacultyDepartmentSubject({
      faculty: faculty._id,
      department: faculty.department, // Use as-is from faculty (string)
      roleInDepartment: 'Other',
      employmentStatus: 'Permanent',
      isActive: true,
      assignedSubjects: [{
        subject: subject._id,
        academicYear: '2025-2026',
        semester: '1',
        section: 'A'
      }],
      notes: 'Test record created directly'
    });
    
    await newRecord.save();
    console.log('✅ Successfully created FacultyDepartmentSubject record');
    
    // Verify it was created (without department population)
    const verifyRecord = await FacultyDepartmentSubject.findOne({ faculty: faculty._id })
      .populate('faculty', 'firstName lastName')
      .populate('assignedSubjects.subject', 'name');
      
    console.log('📋 Verification:', {
      faculty: verifyRecord.faculty,
      department: verifyRecord.department,
      subjectsCount: verifyRecord.assignedSubjects.length,
      subject: verifyRecord.assignedSubjects[0]?.subject
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testDirectCreation();
