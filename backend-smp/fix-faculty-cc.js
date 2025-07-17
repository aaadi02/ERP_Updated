import mongoose from 'mongoose';

// Your MongoDB connection string
const MONGODB_URI = 'mongodb+srv://kshitijmeshram31:kshitij2218@cluster0.qf98dny.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function fixFacultyRecord() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');

    // Get the database
    const db = mongoose.connection.db;
    const facultiesCollection = db.collection('faculties');

    // Find the specific faculty record with NCAT2011
    console.log('🔍 Looking for faculty NCAT2011...');
    const faculty = await facultiesCollection.findOne({ 
      employeeId: 'NCAT2011' 
    });

    if (!faculty) {
      console.log('❌ Faculty NCAT2011 not found');
      return;
    }

    console.log('👤 Found faculty:', {
      name: `${faculty.firstName} ${faculty.lastName}`,
      employeeId: faculty.employeeId,
      ccAssignments: faculty.ccAssignments
    });

    // Check if ccAssignments exist but are missing department/semester
    if (faculty.ccAssignments && faculty.ccAssignments.length > 0) {
      const assignment = faculty.ccAssignments[0];
      
      if (!assignment.department || !assignment.semester) {
        console.log('🔧 CC Assignment is missing department or semester. Updating...');
        
        // Update the CC assignment with proper data
        const updatedAssignment = {
          ...assignment,
          semester: "3",
          department: "eletronic enigneering"
        };

        const updateResult = await facultiesCollection.updateOne(
          { employeeId: 'NCAT2011' },
          { 
            $set: { 
              'ccAssignments.0': updatedAssignment
            } 
          }
        );

        console.log('✅ Update result:', updateResult);
        
        // Verify the update
        const updatedFaculty = await facultiesCollection.findOne({ 
          employeeId: 'NCAT2011' 
        });
        
        console.log('✅ Updated CC Assignment:', updatedFaculty.ccAssignments[0]);
      } else {
        console.log('✅ CC Assignment already has department and semester');
      }
    } else {
      console.log('❌ No CC assignments found for this faculty');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixFacultyRecord();
