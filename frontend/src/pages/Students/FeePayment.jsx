import { useState, useEffect } from "react";
import axios from "axios";
import PaymentForm from "../../components/PaymentForm";

export default function FeePayment() {
  const [students, setStudents] = useState([]);
  const [feeData, setFeeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const localRes = await axios.get("http://localhost:5000/api/students");
        const studentList = localRes.data;
        setStudents(studentList);
        await fetchFeeHeads(studentList);
      } catch (localErr) {
        setError("Failed to load student data. Please check your backend server.");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchFeeHeads = async (studentList) => {
      const feesMap = {};
      await Promise.all(
        studentList.map(async (student) => {
          try {
            const feeRes = await axios.get(
              `http://localhost:5000/api/fee-heads/applicable/${student._id}`
            );
            const heads = feeRes.data;
            const total = heads.reduce((sum, h) => sum + h.amount, 0);
            const paid = student.feesPaid || 0;
            const scholarship = student.scholarshipAmount || 0;
            const pending = total - paid - scholarship;

            feesMap[student._id] = {
              total,
              paid,
              pending,
              scholarship,
              heads,
            };
          } catch (err) {
            feesMap[student._id] = {
              total: 0,
              paid: 0,
              pending: 0,
              scholarship: 0,
              heads: [],
            };
          }
        })
      );
      setFeeData(feesMap);
    };

    fetchStudents();
  }, []);

  const handlePaymentComplete = (payment, updatedStudent) => {
    setStudents(prev => prev.map(student => 
      student._id === updatedStudent._id 
        ? { ...student, feesPaid: updatedStudent.feesPaid, pendingAmount: updatedStudent.pendingAmount }
        : student
    ));
    setFeeData(prev => ({
      ...prev,
      [updatedStudent._id]: {
        ...prev[updatedStudent._id],
        paid: updatedStudent.feesPaid,
        pending: updatedStudent.pendingAmount
      }
    }));
    setShowPaymentForm(false);
    setSelectedStudent(null);
  };

  if (loading) return <p>Loading student records…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold">💳 Fee Payment Portal</h1>
        <p className="text-gray-600">Process student fee payments and manage payment records</p>
        <div className="mt-2 text-sm text-blue-700">
          💡 For comprehensive student overview including insurance and exam fees, visit{" "}
          <a href="/students/details" className="font-medium underline hover:text-blue-800">
            Student Details & Overview
          </a>
        </div>
      </div>
      {students.length === 0 ? (
        <div className="bg-white rounded shadow p-6 text-center">
          <p className="text-gray-500">No students found.</p>
          <p className="text-sm text-gray-400 mt-2">
            Try running: <code className="bg-gray-100 px-2 py-1 rounded">cd backend && node seed-data.js</code>
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {students.map((student) => {
            const fee = feeData[student._id] || {
              total: 0,
              paid: 0,
              pending: 0,
              scholarship: 0,
              heads: [],
            };

            return (
              <div key={student._id} className="bg-white rounded shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                    <p className="text-sm text-gray-600">Enrollment: {student.enrollmentNumber}</p>
                    <p className="text-sm text-gray-600">Department: {student.department?.name || student.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Caste: {student.casteCategory?.toUpperCase()}</p>
                    <p className="text-sm text-gray-600">Status: {student.academicStatus}</p>
                  </div>
                </div>

                {/* Fee Summary */}
                <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Fees</p>
                    <p className="text-lg font-bold text-blue-600">₹{fee.total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Paid</p>
                    <p className="text-lg font-bold text-green-600">₹{fee.paid}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Scholarship</p>
                    <p className="text-lg font-bold text-yellow-600">₹{fee.scholarship}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className={`text-lg font-bold ${fee.pending > 0 ? 'text-red-600' : 'text-green-700'}`}>₹{fee.pending}</p>
                  </div>
                </div>

                {/* Fee Heads */}
                {fee.heads.length > 0 && (
                  <div className="mb-4">
                    <p className="font-medium text-gray-800 mb-2">Fee Heads:</p>
                    <ul className="list-disc list-inside text-gray-700">
                      {fee.heads.map((h, i) => (
                        <li key={i}>{h.title} – ₹{h.amount}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => {
                    setSelectedStudent(student);
                    setShowPaymentForm(true);
                  }}
                >
                  Make Payment
                </button>
              </div>
            );
          })}
        </div>
      )}
      {showPaymentForm && selectedStudent && (
        <PaymentForm
          student={selectedStudent}
          onClose={() => setShowPaymentForm(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
