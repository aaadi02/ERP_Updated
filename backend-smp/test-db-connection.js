import mongoose from 'mongoose';

// Your MongoDB connection string
const MONGODB_URI = 'mongodb+srv://kshitijmeshram31:kshitij2218@cluster0.qf98dny.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function testDatabaseConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Get the database
    const db = mongoose.connection.db;
    
    // List all collections
    console.log('\n📋 Available collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

    // Check if faculties collection exists
    const facultiesCollection = db.collection('faculties');
    const facultyCount = await facultiesCollection.countDocuments();
    console.log(`\n👥 Total faculty records: ${facultyCount}`);

    // Find faculties with ccAssignments field
    console.log('\n🔍 Searching for faculties with ccAssignments...');
    const facultiesWithCC = await facultiesCollection.find({ 
      ccAssignments: { $exists: true, $ne: [] } 
    }).toArray();

    console.log(`📊 Found ${facultiesWithCC.length} faculties with CC assignments:`);
    
    facultiesWithCC.forEach((faculty, index) => {
      console.log(`\n👤 Faculty ${index + 1}:`);
      console.log(`  Name: ${faculty.firstName} ${faculty.lastName || ''}`);
      console.log(`  Employee ID: ${faculty.employeeId}`);
      console.log(`  Email: ${faculty.email}`);
      console.log(`  Role: ${faculty.role || 'Not set'}`);
      console.log(`  Type: ${faculty.type || 'Not set'}`);
      console.log(`  CC Assignments:`, JSON.stringify(faculty.ccAssignments, null, 4));
    });

    // Check for department and semester collections
    console.log('\n🏢 Checking for department and semester collections...');
    
    const departmentsCollection = db.collection('academicdepartments');
    const departmentCount = await departmentsCollection.countDocuments();
    console.log(`📚 Academic departments count: ${departmentCount}`);
    
    if (departmentCount > 0) {
      const sampleDepartments = await departmentsCollection.find({}).limit(3).toArray();
      console.log('Sample departments:', sampleDepartments.map(d => ({ name: d.name, _id: d._id })));
    }

    const semestersCollection = db.collection('semesters');
    const semesterCount = await semestersCollection.countDocuments();
    console.log(`📅 Semesters count: ${semesterCount}`);
    
    if (semesterCount > 0) {
      const sampleSemesters = await semestersCollection.find({}).limit(3).toArray();
      console.log('Sample semesters:', sampleSemesters.map(s => ({ name: s.name, number: s.number, _id: s._id })));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDatabaseConnection();
