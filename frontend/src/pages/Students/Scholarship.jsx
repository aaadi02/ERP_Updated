import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Scholarship() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [scholarshipAmount, setScholarshipAmount] = useState("");
  const [scholarshipDetails, setScholarshipDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStudents();
  }, [searchTerm]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/students", {
        params: { search: searchTerm },
      });
      setStudents(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load students.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setScholarshipAmount(student.scholarshipAmount || "");
    setScholarshipDetails(student.scholarshipDetails || "");
  };

  const handleUpdateScholarship = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `http://localhost:5000/api/scholarships/${selectedStudent._id}`,
        {
          amount: Number(scholarshipAmount),
          details: scholarshipDetails,
        }
      );

      setStudents(
        students.map((s) =>
          s._id === selectedStudent._id ? res.data.student : s
        )
      );
      setSelectedStudent(null);
      setScholarshipAmount("");
      setScholarshipDetails("");
      alert("Scholarship updated successfully!");
    } catch (err) {
      alert("Failed to update scholarship.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  if (error)
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <p className="text-red-700">{error}</p>
      </div>
    );

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 mb-1 flex items-center gap-2">
            🎓 Scholarship Management
          </h1>
          <p className="text-gray-600 text-sm">Award, update, and track student scholarships with ease.</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Student List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
          <h2 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 7v-7" />
            </svg>
            Students
          </h2>
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <ul className="divide-y divide-blue-50">
              {students.map((student) => (
                <li
                  key={student._id}
                  className={`flex justify-between items-center p-4 rounded-lg transition-colors duration-150 hover:bg-blue-50 ${selectedStudent && selectedStudent._id === student._id ? 'bg-blue-100' : ''}`}
                >
                  <div>
                    <p className="font-medium text-blue-900 text-lg">{student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}</p>
                    <p className="text-xs text-gray-500">ID: {student.studentId}</p>
                    <p className="text-xs text-green-700 font-semibold">
                      Scholarship: <span className="text-green-900">₹{student.scholarshipAmount || 0}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectStudent(student)}
                    className="px-4 py-1 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-colors text-sm font-semibold"
                  >
                    {selectedStudent && selectedStudent._id === student._id ? 'Selected' : 'Manage'}
                  </button>
                </li>
              ))}
              {students.length === 0 && (
                <li className="text-center text-gray-400 py-8">No students found.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Scholarship Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-green-100 flex flex-col justify-center">
          <h2 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a4 4 0 018 0v2M12 7a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
            {selectedStudent ? `Update Scholarship for ${selectedStudent.firstName} ${selectedStudent.middleName ? `${selectedStudent.middleName} ` : ''}${selectedStudent.lastName}` : 'Select a Student'}
          </h2>
          {selectedStudent ? (
            <form onSubmit={handleUpdateScholarship} className="space-y-6">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="amount">
                  Scholarship Amount (₹)
                </label>
                <input
                  id="amount"
                  type="number"
                  value={scholarshipAmount}
                  onChange={(e) => setScholarshipAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="details">
                  Details (e.g., "State Scholarship", "Merit-based")
                </label>
                <textarea
                  id="details"
                  value={scholarshipDetails}
                  onChange={(e) => setScholarshipDetails(e.target.value)}
                  className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
                  rows="3"
                />
              </div>
              <div className="flex items-center justify-between mt-6">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow focus:outline-none focus:shadow-outline transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Scholarship'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="flex items-center gap-1 text-red-500 hover:text-red-700 text-sm font-semibold px-3 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a4 4 0 018 0v2M12 7a4 4 0 100-8 4 4 0 000 8z" />
              </svg>
              <p>Please select a student from the list to manage their scholarship.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}