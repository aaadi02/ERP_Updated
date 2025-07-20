import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";

export default function StudentDetails() {
  const [students, setStudents] = useState([]);
  const [feeData, setFeeData] = useState({});
  const [examFeeData, setExamFeeData] = useState({});
  const [insuranceData, setInsuranceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term to avoid too many API calls
  useEffect(
    () => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError("");
      try {
        // Use local API for students with search term
        const res = await axios.get("http://localhost:5000/api/students", {
          params: { search: debouncedSearchTerm },
        });
        const studentList = res.data;
        setStudents(studentList);

        // Fetch related data for the filtered students in parallel
        await Promise.all([
          fetchFeeHeads(studentList),
          fetchExamFees(studentList), 
          fetchInsurancePolicies(studentList)
        ]);
      } catch (err) {
        console.error("API call failed:", err);
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
            const pending = total - paid;

            feesMap[student._id] = {
              total,
              paid,
              pending,
              heads,
            };
          } catch (err) {
            console.error(`Error fetching fee heads for student ${student._id}:`, err);
            feesMap[student._id] = {
              total: 0,
              paid: student.feesPaid || 0,
              pending: 0,
              heads: [],
            };
          }
        })
      );
      setFeeData(feesMap);
    };

    const fetchExamFees = async (studentList) => {
      const examMap = {};
      await Promise.all(
        studentList.map(async (student) => {
          try {
            const res = await axios.get(`http://localhost:5000/api/payments/student/${student._id}`);
            // Filter only exam fee payments (by semester field or description)
            const examPayments = res.data.filter(p => p.semester || (p.description && p.description.toLowerCase().includes('exam fee')));
            examMap[student._id] = examPayments;
          } catch (err) {
            examMap[student._id] = [];
          }
        })
      );
      setExamFeeData(examMap);
    };

    const fetchInsurancePolicies = async (studentList) => {
      const insuranceMap = {};
      await Promise.all(
        studentList.map(async (student) => {
          try {
            const res = await axios.get(`http://localhost:5000/api/insurance/student/${student._id}`);
            insuranceMap[student._id] = res.data;
          } catch (err) {
            console.error(`Error fetching insurance for student ${student._id}:`, err);
            insuranceMap[student._id] = [];
          }
        })
      );
      setInsuranceData(insuranceMap);
    };

    fetchStudents();
  }, [debouncedSearchTerm]);

  // Helper functions for calculations (moved outside of render)
  const calculateInsuranceStats = (insurancePolicies) => {
    if (!insurancePolicies.length) return null;
    
    return {
      totalPolicies: insurancePolicies.length,
      activePolicies: insurancePolicies.filter(p => p.status === 'Active').length,
      totalCoverage: insurancePolicies.reduce((sum, p) => sum + (p.coverageAmount || 0), 0),
      totalPremium: insurancePolicies.reduce((sum, p) => sum + (p.premiumAmount || 0), 0)
    };
  };

  const calculateExamFeeStats = (examFees) => {
    if (!examFees.length) return null;
    
    return {
      totalPaid: examFees.reduce((sum, p) => sum + p.amount, 0),
      latestSemester: Math.max(...examFees.map(p => p.semester || 0)) || 'N/A',
      totalPayments: examFees.length
    };
  };

  const getInsuranceStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Expired': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-gray-100 text-gray-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading student details...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-600 text-lg">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="bg-white p-4 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-4">🧑 Student Detail Records</h1>
        
        {/* Search Section */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or email..."
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Search Results Count */}
        <div className="mt-2 text-sm text-gray-600">
          Found {students.length} student{students.length !== 1 ? 's' : ''}
        </div>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded shadow p-6 text-center">
          <p className="text-gray-500">{searchTerm ? "No students match your search." : "No students found."}</p>
          {!searchTerm && (
            <p className="text-sm text-gray-400 mt-2">
              Try running: <code className="bg-gray-100 px-2 py-1 rounded">cd backend && node seed-data.js</code>
            </p>
          )}
        </div>
      ) : (
        students.map((student) => {
          const fee = feeData[student._id] || {
            total: 0,
            paid: 0,
            pending: 0,
            heads: [],
          };
          const examFees = examFeeData[student._id] || [];
          const insurancePolicies = insuranceData[student._id] || [];

          // Calculate insurance stats using helper function
          const insuranceStats = calculateInsuranceStats(insurancePolicies);

          // Calculate exam fee stats using helper function
          const examFeeStats = calculateExamFeeStats(examFees);

          return (
            <div
              key={student._id}
              className="bg-white rounded shadow p-6 space-y-2 border-l-4 border-blue-500"
            >
              <h2 className="text-xl font-semibold text-gray-800">
                {student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <p><strong>Student ID:</strong> {student.studentId}</p>
                <p><strong>Enrollment No:</strong> {student.enrollmentNumber}</p>
                <p><strong>Email:</strong> {student.email}</p>
                <p><strong>Mobile:</strong> {student.mobileNumber || "N/A"}</p>
                <p><strong>Father Name:</strong> {student.fatherName || "N/A"}</p>
                <p><strong>Department:</strong> {student.department?.name || student.department || "N/A"}</p>
                <p><strong>Stream:</strong> {student.stream?.name || student.stream || "N/A"}</p>
                <p><strong>Section:</strong> {student.section || "N/A"}</p>
                <p><strong>Gender:</strong> {student.gender || "N/A"}</p>
                <p><strong>Caste Category:</strong> {student.casteCategory || "N/A"}</p>
                <p><strong>Admission Type:</strong> {student.admissionType || "N/A"}</p>
                <p><strong>Date of Birth:</strong> {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "N/A"}</p>
                <p><strong>Address:</strong> {student.address || "N/A"}</p>
                <p><strong>Guardian Number:</strong> {student.guardianNumber || "N/A"}</p>
                <p><strong>Nationality:</strong> {student.nationality || "N/A"}</p>
                <p><strong>Academic Status:</strong> {student.academicStatus || "Active"}</p>
                <p><strong>Enrollment Year:</strong> {student.enrollmentYear}</p>
                <p><strong>Current Semester:</strong> {student.currentSemester}</p>
                <p><strong>Academic Status:</strong> {student.academicStatus}</p>
                <p><strong>Caste Category:</strong> {student.casteCategory}</p>
                <p><strong>Stream:</strong> {student.stream?.name || "N/A"}</p>

                {/* Fee Summary */}
                <p><strong>Total Fees:</strong> ₹{fee.total}</p>
                <p><strong>Fees Paid:</strong> <span className="text-green-600 font-semibold">₹{fee.paid}</span></p>
                <p>
                  <strong>Pending Fees:</strong>{" "}
                  <span className={`font-semibold ${fee.pending > 0 ? "text-red-600" : "text-green-700"}`}>
                    ₹{fee.pending}
                  </span>
                </p>
              </div>

              {/* Applied Fee Heads */}
              {fee.heads.length > 0 && (
                <div className="mt-4 text-sm">
                  <p className="font-medium text-gray-800">Applied Fee Heads:</p>
                  <ul className="list-disc list-inside text-gray-700">
                    {fee.heads.map((h, i) => (
                      <li key={i}>
                        {h.title} – ₹{h.amount}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Insurance Policies */}
              {insuranceStats && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-purple-800">🛡️ Insurance Policies</h3>
                  
                  {/* Insurance Summary Card */}
                  <div className="grid grid-cols-4 gap-4 bg-purple-50 p-4 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-purple-600">Total Policies</p>
                      <p className="text-lg font-bold text-purple-800">{insuranceStats.totalPolicies}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-purple-600">Active Policies</p>
                      <p className="text-lg font-bold text-purple-800">{insuranceStats.activePolicies}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-purple-600">Total Coverage</p>
                      <p className="text-lg font-bold text-purple-800">
                        ₹{insuranceStats.totalCoverage.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-purple-600">Total Premium</p>
                      <p className="text-lg font-bold text-purple-800">
                        ₹{insuranceStats.totalPremium.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Insurance Policies Table */}
                  <div className="bg-white border border-purple-100 rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-purple-50">
                        <tr>
                          <th className="p-3 text-left font-medium text-purple-800">Policy Number</th>
                          <th className="p-3 text-left font-medium text-purple-800">Provider</th>
                          <th className="p-3 text-left font-medium text-purple-800">Type</th>
                          <th className="p-3 text-right font-medium text-purple-800">Coverage (₹)</th>
                          <th className="p-3 text-right font-medium text-purple-800">Premium (₹)</th>
                          <th className="p-3 text-left font-medium text-purple-800">Status</th>
                          <th className="p-3 text-left font-medium text-purple-800">Payment</th>
                          <th className="p-3 text-left font-medium text-purple-800">Valid Till</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-100">
                        {insurancePolicies.map((policy, i) => (
                          <tr key={i} className="hover:bg-purple-50">
                            <td className="p-3 font-mono text-sm">{policy.policyNumber}</td>
                            <td className="p-3">{policy.insuranceProvider}</td>
                            <td className="p-3">
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                                {policy.policyType}
                              </span>
                            </td>
                            <td className="p-3 text-right font-medium">
                              {policy.coverageAmount?.toLocaleString()}
                            </td>
                            <td className="p-3 text-right font-medium">
                              {policy.premiumAmount?.toLocaleString()}
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInsuranceStatusColor(policy.status)}`}>
                                {policy.status}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(policy.paymentStatus)}`}>
                                {policy.paymentStatus}
                              </span>
                            </td>
                            <td className="p-3 text-sm">
                              {new Date(policy.endDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Exam Fee Payments */}
              {examFeeStats && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-blue-800">📝 Exam Fee Details</h3>
                  
                  {/* Exam Fee Summary Card */}
                  <div className="grid grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-blue-600">Total Exam Fees Paid</p>
                      <p className="text-lg font-bold text-blue-800">₹{examFeeStats.totalPaid}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-600">Latest Semester Paid</p>
                      <p className="text-lg font-bold text-blue-800">{examFeeStats.latestSemester}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-600">Total Payments</p>
                      <p className="text-lg font-bold text-blue-800">{examFeeStats.totalPayments}</p>
                    </div>
                  </div>

                  {/* Exam Fee Payment History */}
                  <div className="bg-white border border-blue-100 rounded-lg overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="p-3 text-left font-medium text-blue-800">Date</th>
                          <th className="p-3 text-left font-medium text-blue-800">Semester</th>
                          <th className="p-3 text-right font-medium text-blue-800">Amount (₹)</th>
                          <th className="p-3 text-left font-medium text-blue-800">Method</th>
                          <th className="p-3 text-left font-medium text-blue-800">Receipt</th>
                          <th className="p-3 text-center font-medium text-blue-800">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-100">
                        {examFees.map((p, i) => (
                          <tr key={i} className="hover:bg-blue-50">
                            <td className="p-3">{new Date(p.paymentDate || p.createdAt).toLocaleDateString()}</td>
                            <td className="p-3">{p.semester || '-'}</td>
                            <td className="p-3 text-right font-medium">₹{p.amount}</td>
                            <td className="p-3">{p.paymentMethod}</td>
                            <td className="p-3 font-mono text-sm">{p.receiptNumber}</td>
                            <td className="p-3 text-center">
                              <button 
                                onClick={() => window.open(`/receipt/${p.receiptNumber}`, '_blank')}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                              >
                                View Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
