// Test frontend subject fetching
const testFrontendSubjects = async () => {
  try {
    console.log('Testing frontend subject fetching...');
    
    // Simulate the exact same fetch that frontend does
    const department = 'eletronic enigneering';
    const url = `http://localhost:5000/api/subjects/by-department?department=${encodeURIComponent(department)}`;
    
    console.log('Fetching from URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch subjects: ${response.status}`);
    }
    
    const data = await response.json();
    const subjectsData = Array.isArray(data.data) ? data.data : [];
    
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('Subjects extracted:', subjectsData);
    
    return {
      success: true,
      subjects: subjectsData
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      success: false,
      error: error.message,
      subjects: []
    };
  }
};

// Test in browser console
testFrontendSubjects().then(result => {
  console.log('Final result:', result);
});

console.log('Script loaded! Run testFrontendSubjects() in console to test.');
