import React, { useEffect, useState } from 'react';
import { getAllProblems } from '../../services/problemService';

const ProblemReports = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await getAllProblems();
        // Handle different response structures
        const problemsData = res.data?.problems || res.data?.data || res.data || [];
        setProblems(problemsData);
      } catch (err) {
        setError('Failed to fetch problem reports');
        setProblems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProblems();
  }, []);

  if (loading) return <div className="text-white">Loading...</div>;
  if (error) return <div className="text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-blue-900 py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-6 text-center drop-shadow-md">
          Reported Problems
        </h2>
        <div className="overflow-x-auto bg-white/10 backdrop-blur-md shadow-xl rounded-xl p-4 border border-white/20">
          <table className="min-w-full text-white">
            <thead>
              <tr>
                <th className="px-4 py-2">Issue Type</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Urgency</th>
                <th className="px-4 py-2">Bus Number</th>
                <th className="px-4 py-2">Driver Name</th>
                <th className="px-4 py-2">Driver ID</th>
                <th className="px-4 py-2">Reported At</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p._id} className="border-b border-white/10">
                  <td className="px-4 py-2">{p.issueType}</td>
                  <td className="px-4 py-2">{p.description}</td>
                  <td className="px-4 py-2">{p.urgency}</td>
                  <td className="px-4 py-2">{p.busNumber}</td>
                  <td className="px-4 py-2">
                    {p.driver?.personalInfo?.firstName} {p.driver?.personalInfo?.lastName}
                  </td>
                  <td className="px-4 py-2">{p.driver?.employment?.employeeId}</td>
                  <td className="px-4 py-2">{new Date(p.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {problems.length === 0 && <div className="text-gray-300 text-center py-4">No problems reported yet.</div>}
        </div>
      </div>
    </div>
  );
};

export default ProblemReports; 