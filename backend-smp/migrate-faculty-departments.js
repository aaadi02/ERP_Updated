// Migration script to fix faculty-department relationships
import mongoose from 'mongoose';
import Faculty from './models/faculty.js';
import AcademicDepartment from './models/AcademicDepartment.js';

async function fixFacultyDepartments() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ERP', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get all faculties with string departments
    const facultiesWithStringDepts = await Faculty.find({
      department: { $type: "string" }
    }).lean();

    console.log(`Found ${facultiesWithStringDepts.length} faculties with string departments`);

    // Get all academic departments
    const academicDepartments = await AcademicDepartment.find({}).lean();
    console.log('Academic departments:', academicDepartments.map(d => d.name));

    // Create mapping of common department names
    const deptMapping = {
      'eletronic enigneering': 'Electronics Engineering',
      'electronic enigneering': 'Electronics Engineering',
      'computer science': 'Computer Science Engineering',
      'computer engineering': 'Computer Science Engineering',
      'mechanical': 'Mechanical Engineering',
      'electrical': 'Electrical Engineering'
    };

    // Process each faculty
    for (const faculty of facultiesWithStringDepts) {
      const currentDept = faculty.department.toLowerCase().trim();
      let targetDeptName = deptMapping[currentDept] || faculty.department;

      console.log(`Processing faculty ${faculty.firstName} ${faculty.lastName} - Current dept: "${faculty.department}" -> Target: "${targetDeptName}"`);

      // Find or create academic department
      let academicDept = await AcademicDepartment.findOne({
        name: { $regex: new RegExp(`^${targetDeptName}$`, 'i') }
      });

      if (!academicDept) {
        console.log(`Creating new academic department: ${targetDeptName}`);
        academicDept = await AcademicDepartment.create({
          name: targetDeptName,
          code: targetDeptName.split(' ').map(w => w[0]).join('').toUpperCase()
        });
      }

      // Update faculty to use ObjectId reference
      await Faculty.updateOne(
        { _id: faculty._id },
        { department: academicDept._id }
      );

      console.log(`Updated faculty ${faculty.firstName} ${faculty.lastName} to department ObjectId ${academicDept._id}`);
    }

    console.log('Migration completed successfully!');
    await mongoose.disconnect();

  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.disconnect();
  }
}

// Run the migration
fixFacultyDepartments();
