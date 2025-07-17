import { MongoClient } from 'mongodb';

async function checkFacultyData() {
  const client = new MongoClient('mongodb+srv://kshitijmeshram31:kshitij2218@cluster0.qf98dny.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('test');
    const facultiesCollection = db.collection('faculties');
    
    // Find faculty NCAT2011 and examine their ccAssignments
    const faculty = await facultiesCollection.findOne(
      { employeeId: 'NCAT2011' },
      { projection: { employeeId: 1, ccAssignments: 1, department: 1, firstName: 1, lastName: 1 } }
    );
    
    console.log('\n=== Faculty NCAT2011 Data ===');
    console.log('Employee ID:', faculty?.employeeId);
    console.log('Name:', faculty?.firstName, faculty?.lastName);
    console.log('Faculty Department:', faculty?.department);
    console.log('CC Assignments:', JSON.stringify(faculty?.ccAssignments, null, 2));
    
    if (faculty?.ccAssignments && faculty.ccAssignments.length > 0) {
      console.log('\n=== CC Assignment Details ===');
      const assignment = faculty.ccAssignments[0];
      console.log('Assignment Keys:', Object.keys(assignment));
      console.log('Department:', assignment.department);
      console.log('Semester:', assignment.semester);
      console.log('Section:', assignment.section);
      console.log('Academic Year:', assignment.academicYear);
      console.log('Assigned At:', assignment.assignedAt);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkFacultyData();
