// Simple Test Component to test faculty fetching
import { useState, useEffect } from "react";

export default function TestFacultyFetch() {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testDifferentDepartments() {
      const departmentsToTest = [
        'eletronic enigneering',
        'Electronics Engineering', 
        'Computer Science',
        'Computer Science Engineering',
        'computer engineering',
        'mechanical',
        'Mechanical Engineering'
      ];

      const results = [];

      for (const dept of departmentsToTest) {
        try {
          console.log(`Testing department: "${dept}"`);
          
          const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/faculty/department/${encodeURIComponent(dept)}`
          );
          
          const data = await response.json();
          console.log(`Result for "${dept}":`, data);
          
          results.push({
            department: dept,
            success: data.success,
            count: data.data?.length || 0,
            correctedDepartment: data.department,
            error: data.error || null
          });
        } catch (error) {
          console.error(`Error testing ${dept}:`, error);
          results.push({
            department: dept,
            success: false,
            count: 0,
            error: error.message
          });
        }
      }

      setTestResults(results);
      setLoading(false);
    }

    testDifferentDepartments();
  }, []);

  if (loading) {
    return <div className="p-4">Testing faculty fetch for different departments...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Faculty Fetch Test Results</h2>
      <div className="space-y-2">
        {testResults.map((result, index) => (
          <div key={index} className={`p-3 border rounded ${result.success && result.count > 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
            <div className="font-medium">{result.department}</div>
            <div className="text-sm">
              Success: {result.success ? '✅' : '❌'} | 
              Count: {result.count} | 
              Corrected: {result.correctedDepartment || 'N/A'}
            </div>
            {result.error && <div className="text-red-600 text-xs">{result.error}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
