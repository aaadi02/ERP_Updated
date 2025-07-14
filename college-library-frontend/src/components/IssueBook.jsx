const handleIssueBook = async (ACCNO, userId, borrowerType, borrowerData) => {
  try {
    const payload = {
      ACCNO,
      borrowerType,
      ...(borrowerType === 'student' ? { studentId: userId } : { employeeId: userId }),
      ...(borrowerType === 'student' 
        ? { 
            studentName: borrowerData.name,
            semester: borrowerData.semester,
            course: borrowerData.course,
          }
        : {
            facultyName: borrowerData.name,
            designation: borrowerData.designation,
            department: borrowerData.department,
          }
      ),
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    };

    const response = await fetch('http://localhost:5000/api/issues/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || 'Failed to issue book');
    }

    // Show success message
    toast.success('Book issued successfully');
    
  } catch (error) {
    // Show error message
    toast.error(error.message);
  }
};