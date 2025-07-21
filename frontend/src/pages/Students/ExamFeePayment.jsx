import { useState, useEffect } from "react";
import axios from "axios";
import ReceiptSlip from "../../components/ReceiptSlip";

export default function ExamFeePayment() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [semester, setSemester] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transactionId, setTransactionId] = useState("");
  const [collectedBy, setCollectedBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [receiptStudent, setReceiptStudent] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/students").then(res => setStudents(res.data));
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      axios.get(`http://localhost:5000/api/payments/student/${selectedStudent}`)
        .then(res => {
          // Filter only exam fee payments
          const examPayments = res.data.filter(p => p.semester || (p.description && p.description.toLowerCase().includes('exam fee')));
          setHistory(examPayments);
        })
        .catch(() => setHistory([]));
    } else {
      setHistory([]);
    }
  }, [selectedStudent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        studentId: selectedStudent,
        semester,
        amount: parseFloat(amount),
        paymentMethod,
        transactionId,
        collectedBy,
        description: `Exam Fee - Semester ${semester}`,
        remarks: `Exam fee for semester ${semester}`
      };
      const res = await axios.post("http://localhost:5000/api/payments/exam-fee", payload);
      setSuccess("Exam fee payment recorded successfully!");
      setAmount("");
      setSemester("");
      setTransactionId("");
      setCollectedBy("");
      // Add new payment to history
      setHistory(prev => [res.data.payment, ...prev]);
      // Show receipt modal
      setReceiptPayment(res.data.payment);
      const stu = students.find(s => s._id === selectedStudent);
      setReceiptStudent(stu);
      setShowReceipt(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow space-y-6">
      <h1 className="text-2xl font-bold mb-4">Semester-wise Exam Fee Payment (Individual)</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Student</label>
          <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} required className="w-full border p-2 rounded">
            <option value="">Select Student</option>
            {students.map(s => (
              <option key={s._id} value={s._id}>{s.firstName} {s.middleName ? `${s.middleName} ` : ''}{s.lastName} ({s.studentId})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Semester</label>
          <select value={semester} onChange={e => setSemester(e.target.value)} required className="w-full border p-2 rounded">
            <option value="">Select Semester</option>
            {[1,2,3,4,5,6,7,8].map(n => (
              <option key={n} value={n}>Semester {n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Exam Fee Amount (₹)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Payment Method</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full border p-2 rounded">
            <option value="Cash">Cash</option>
            <option value="Online">Online</option>
            <option value="Bank">Bank</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Transaction ID (if any)</label>
          <input type="text" value={transactionId} onChange={e => setTransactionId(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Collected By</label>
          <input type="text" value={collectedBy} onChange={e => setCollectedBy(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {loading ? "Processing..." : "Record Exam Fee Payment"}
        </button>
      </form>
      {selectedStudent && history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Exam Fee Payment History</h2>
          <table className="min-w-full text-sm bg-gray-50 rounded">
            <thead>
              <tr>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Semester</th>
                <th className="p-2 text-right">Amount (₹)</th>
                <th className="p-2 text-left">Method</th>
                <th className="p-2 text-left">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td className="p-2">{new Date(h.paymentDate || h.createdAt).toLocaleDateString()}</td>
                  <td className="p-2">{h.semester || '-'}</td>
                  <td className="p-2 text-right">₹{h.amount}</td>
                  <td className="p-2">{h.paymentMethod}</td>
                  <td className="p-2">{h.receiptNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showReceipt && receiptPayment && receiptStudent && (
        <ReceiptSlip payment={receiptPayment} student={receiptStudent} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
} 