// Debug script to check actual data
import mongoose from 'mongoose';
import Faculty from './models/faculty.js';
import AcademicDepartment from './models/AcademicDepartment.js';

async function debugData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ERP');
    console.log('Connected to MongoDB');

    // Get first 5 faculties to see their structure
    const faculties = await Faculty.find({}).limit(5).lean();
    console.log('\n=== FACULTY SAMPLE ===');
    faculties.forEach((f, i) => {
      console.log(`${i+1}. ${f.firstName} ${f.lastName}`);
      console.log(`   Department: ${f.department} (Type: ${typeof f.department})`);
      console.log(`   ObjectId: ${mongoose.Types.ObjectId.isValid(f.department)}`);
    });

    // Get all academic departments
    const academicDepts = await AcademicDepartment.find({}).lean();
    console.log('\n=== ACADEMIC DEPARTMENTS ===');
    academicDepts.forEach((d, i) => {
      console.log(`${i+1}. ${d.name} (ID: ${d._id})`);
    });

    // Try to populate a faculty
    console.log('\n=== POPULATION TEST ===');
    const populatedFaculty = await Faculty.findOne({})
      .populate('department', 'name')
      .lean();
    
    if (populatedFaculty) {
      console.log('Populated faculty:', {
        name: populatedFaculty.firstName,
        department: populatedFaculty.department
      });
    }

    // Check if any faculty departments match academic department IDs
    console.log('\n=== DEPARTMENT MATCHING ===');
    const allFaculties = await Faculty.find({}).select('department firstName').lean();
    const acadDeptIds = academicDepts.map(d => d._id.toString());
    
    let matchCount = 0;
    allFaculties.forEach(f => {
      if (acadDeptIds.includes(f.department.toString())) {
        matchCount++;
        console.log(`✅ ${f.firstName} - Department matches`);
      } else {
        console.log(`❌ ${f.firstName} - Department ${f.department} doesn't match any academic dept`);
      }
    });

    console.log(`\nMatching departments: ${matchCount}/${allFaculties.length}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Debug error:', error);
    await mongoose.disconnect();
  }
}

debugData();
