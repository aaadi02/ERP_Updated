import mongoose from 'mongoose';
import FacultyDepartmentSubject from './models/FacultyDepartmentSubject.js';
import Faculty from './models/faculty.js';
import AdminSubject from './models/AdminSubject.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSimplifiedSchema() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get sample data with populated fields
    const sampleRecords = await FacultyDepartmentSubject.find({})
      .populate('faculty', 'firstName lastName')
      .populate('assignedSubjects.subject', 'name')
      .limit(3);
    
    console.log('\n📋 Sample Records with Simplified Schema:');
    
    sampleRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. Faculty: ${record.faculty?.firstName} ${record.faculty?.lastName}`);
      console.log(`   Department: ${record.department}`);
      console.log(`   Active: ${record.isActive}`);
      console.log(`   Subjects Count: ${record.assignedSubjects.length}`);
      
      if (record.assignedSubjects.length > 0) {
        record.assignedSubjects.forEach((sub, i) => {
          console.log(`   Subject ${i+1}: ${sub.subject?.name || 'N/A'} (${sub.semester} sem, ${sub.section} section)`);
        });
      }
    });
    
    // Test adding a subject
    console.log('\n🧪 Testing subject assignment...');
    const firstRecord = sampleRecords[0];
    const subject = await AdminSubject.findOne({});
    
    if (firstRecord && subject) {
      try {
        await firstRecord.addSubject(subject._id, '2025-2026', '1', 'A');
        console.log(`✅ Successfully assigned subject "${subject.name}" to ${firstRecord.faculty.firstName}`);
      } catch (error) {
        console.log(`⚠️ Subject assignment: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testSimplifiedSchema();
