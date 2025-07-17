// Test script to check if ccAssignments are properly parsed

async function testCCAssignments() {
  try {
    console.log('Testing CC assignments parsing logic...');
    
    const testAssignment = "department:eletronic enigneering,semester:3,section:D,academicYear:2025-2026,assignedAt:2025-07-10T06:17:35.465Z";
    
    console.log('Original string:', testAssignment);
    
    // Test our parsing logic
    const assignmentObj = {};
    const pairs = testAssignment.split(',');
    pairs.forEach(pair => {
      const [key, value] = pair.split(':');
      if (key && value) {
        assignmentObj[key.trim()] = value.trim();
      }
    });
    
    console.log('Parsed object:', assignmentObj);
    
    // Check if it has the expected properties
    if (assignmentObj.department && assignmentObj.semester && assignmentObj.section) {
      console.log('✅ Success! Parsed object has required properties:');
      console.log('   Department:', assignmentObj.department);
      console.log('   Semester:', assignmentObj.semester);
      console.log('   Section:', assignmentObj.section);
      console.log('   Academic Year:', assignmentObj.academicYear);
    } else {
      console.log('❌ Error: Missing required properties');
    }
    
  } catch (error) {
    console.error('Error testing CC assignments:', error);
  }
}

testCCAssignments();
