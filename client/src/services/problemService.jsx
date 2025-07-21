import API from './api';

export const reportProblem = async (problemData) => {
  const response = await API.post('/problems', problemData);
  return response.data;
};

export const getAllProblems = async () => {
  const response = await API.get('/problems');
  return response.data;
}; 