import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:5000/api' });

export const getAllStudents = async () => {
  try {
    const response = await API.get('/superadmin/students');
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

export const getStudentByEmail = async (email) => {
  const res = await getAllStudents();
  return res.students.find(s => s.email === email);
};

export const studentLogin = async (email, password) => {
  const response = await API.post('/auth/student-login', { email, password });
  return response.data;
};

export const getStudentById = async (id) => {
  try {
    const response = await API.get(`/superadmin/students/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching student by ID:', error);
    throw error;
  }
};

export const getAssignedBusInfo = async () => {
  const token = localStorage.getItem('token');
  const response = await API.get('/students/assigned-bus', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
}; 