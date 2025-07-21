async function testDeleteCC() {
  try {
    console.log("Testing delete-cc-assignment endpoint...");

    const response = await fetch(
      "http://localhost:5000/api/faculty/delete-cc-assignment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facultyId: "invalid_id",
          academicYear: "2025-2026",
          semester: "3",
          section: "D",
          department: "Information Technology",
        }),
      }
    );

    const data = await response.json();
    console.log("Response status:", response.status);
    console.log("Response data:", data);
  } catch (error) {
    console.log("Full error:", error.message);
  }
}

testDeleteCC();
