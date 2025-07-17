import mongoose from 'mongoose';
import FacultyDepartmentSubject from './models/FacultyDepartmentSubject.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkCollectionData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Count documents
    const count = await FacultyDepartmentSubject.countDocuments();
    console.log(`📊 Total FacultyDepartmentSubject documents: ${count}`);
    
    // Get all documents
    const allRecords = await FacultyDepartmentSubject.find({}).limit(5);
    console.log(`📋 Sample records found: ${allRecords.length}`);
    
    allRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. Faculty ID: ${record.faculty}`);
      console.log(`   Department: ${record.department}`);
      console.log(`   Role: ${record.roleInDepartment}`);
      console.log(`   Active: ${record.isActive}`);
      console.log(`   Subjects assigned: ${record.assignedSubjects.length}`);
      console.log(`   Created: ${record.createdAt}`);
    });
    
    // Test with populated data
    console.log('\n🔄 Trying with populated data...');
    const populatedRecords = await FacultyDepartmentSubject.find({})
      .populate('faculty', 'firstName lastName')
      .limit(2);
      
    populatedRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. Faculty: ${record.faculty?.firstName} ${record.faculty?.lastName}`);
      console.log(`   Department: ${record.department}`);
      console.log(`   Role: ${record.roleInDepartment}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkCollectionData();
