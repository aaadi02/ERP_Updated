import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const getBooks = () => axios.get(`${API_URL}/api/books`);
export const getStudents = () => axios.get(`${API_URL}/api/students`);
// Updated returnBook function to include required parameters
export const returnBook = (bookId, borrowerId, borrowerType) => axios.post(`${API_URL}/api/issues/return`, {
  bookId,
  borrowerId,
  borrowerType
});
export const reissueBook = (bookId) => axios.post(`${API_URL}/api/books/reissue/${bookId}`);
export const getDues = () => axios.get(`${API_URL}/api/dues`);
export const getAnalyticsSummary = () => axios.get(`${API_URL}/api/analytics/summary`);

export const issueBook = async ({ ACCNO, userId, borrowerType, borrowerData }) => {
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
  
  return await axios.post(`${API_URL}/api/issues/issue`, payload);
};

export const checkConnection = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const handleApiError = (error) => {
  if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
    return 'Cannot connect to server. Please check if the server is running.';
  }
  return error.response?.data?.message || 'An error occurred. Please try again.';
};


