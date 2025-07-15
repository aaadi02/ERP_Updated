// Test script to demonstrate populated models
// Run with: node testPopulation.js

import mongoose from 'mongoose';
import Student from './models/student.js';
import Faculty from './models/faculty.js';
import Attendance from './models/attendance.js';
import AccountStudent from './models/AccountStudent.js';
import { populateQuery } from './utils/populateUtils.js';

// Connect to database
mongoose.connect('mongodb://localhost:27017/your_database_name', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testPopulation() {
  try {
    console.log('🔗 Testing Model Population...\n');

    // Test 1: Get all students with basic population
    console.log('1️⃣ Testing Student Basic Population:');
    const studentsBasic = await Student.find().limit(2)
      .populate('stream', 'name')
      .populate('department', 'name')
      .populate('semester', 'number');
    
    console.log(`Found ${studentsBasic.length} students with basic population`);
    if (studentsBasic.length > 0) {
      console.log('Sample:', {
        name: `${studentsBasic[0].firstName} ${studentsBasic[0].lastName}`,
        stream: studentsBasic[0].stream?.name,
        department: studentsBasic[0].department?.name,
        semester: studentsBasic[0].semester?.number
      });
    }
    console.log('');

    // Test 2: Get student with deep population
    console.log('2️⃣ Testing Student Deep Population:');
    const studentDeep = await Student.findOne()
      .populate({
        path: 'department',
        populate: {
          path: 'stream',
          select: 'name description'
        }
      })
      .populate({
        path: 'subjects',
        populate: {
          path: 'department',
          select: 'name'
        }
      });

    if (studentDeep) {
      console.log('Student with deep population:', {
        name: `${studentDeep.firstName} ${studentDeep.lastName}`,
        department: {
          name: studentDeep.department?.name,
          stream: studentDeep.department?.stream?.name
        },
        subjectsCount: studentDeep.subjects?.length || 0
      });
    }
    console.log('');

    // Test 3: Get faculty with population
    console.log('3️⃣ Testing Faculty Population:');
    const faculties = await Faculty.find().limit(2)
      .populate('department', 'name')
      .populate('subjectsTaught', 'name')
      .populate('ccAssignments.department', 'name')
      .populate('ccAssignments.semester', 'number');

    console.log(`Found ${faculties.length} faculties with population`);
    if (faculties.length > 0) {
      console.log('Sample:', {
        name: `${faculties[0].firstName} ${faculties[0].lastName}`,
        department: faculties[0].department?.name,
        subjectsCount: faculties[0].subjectsTaught?.length || 0,
        ccAssignments: faculties[0].ccAssignments?.length || 0
      });
    }
    console.log('');

    // Test 4: Get attendance with full population
    console.log('4️⃣ Testing Attendance Population:');
    const attendanceRecords = await Attendance.find().limit(2)
      .populate({
        path: 'student',
        select: 'firstName lastName enrollmentNumber',
        populate: {
          path: 'department',
          select: 'name'
        }
      })
      .populate('subject', 'name')
      .populate('faculty', 'firstName lastName')
      .populate('semester', 'number')
      .populate('department', 'name');

    console.log(`Found ${attendanceRecords.length} attendance records with population`);
    if (attendanceRecords.length > 0) {
      console.log('Sample:', {
        student: `${attendanceRecords[0].student?.firstName} ${attendanceRecords[0].student?.lastName}`,
        subject: attendanceRecords[0].subject?.name,
        faculty: `${attendanceRecords[0].faculty?.firstName} ${attendanceRecords[0].faculty?.lastName}`,
        status: attendanceRecords[0].status,
        date: attendanceRecords[0].date?.toDateString()
      });
    }
    console.log('');

    // Test 5: Using populate utility
    console.log('5️⃣ Testing Populate Utility:');
    let utilityQuery = Student.find().limit(1);
    utilityQuery = populateQuery(utilityQuery, 'student', 'detailed');
    const studentWithUtility = await utilityQuery.exec();

    if (studentWithUtility.length > 0) {
      console.log('Student populated with utility:', {
        name: `${studentWithUtility[0].firstName} ${studentWithUtility[0].lastName}`,
        hasPopulatedData: !!(studentWithUtility[0].department && studentWithUtility[0].stream)
      });
    }
    console.log('');

    // Test 6: Complex aggregation with population
    console.log('6️⃣ Testing Complex Query with Population:');
    const departmentStats = await Student.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'academicdepartments',
          localField: '_id',
          foreignField: '_id',
          as: 'departmentInfo'
        }
      },
      {
        $unwind: '$departmentInfo'
      },
      {
        $lookup: {
          from: 'streams',
          localField: 'departmentInfo.stream',
          foreignField: '_id',
          as: 'streamInfo'
        }
      },
      {
        $unwind: '$streamInfo'
      },
      {
        $project: {
          department: '$departmentInfo.name',
          stream: '$streamInfo.name',
          studentCount: '$count'
        }
      }
    ]);

    console.log('Department Statistics:', departmentStats);
    console.log('');

    console.log('✅ All population tests completed successfully!');

  } catch (error) {
    console.error('❌ Error during population testing:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testPopulation();
