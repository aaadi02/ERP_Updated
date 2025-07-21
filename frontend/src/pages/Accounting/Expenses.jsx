import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiTrash2, FiCheck, FiX, FiSearch, FiPlusCircle, FiAlertCircle, FiDownload } from "react-icons/fi";
import { HiOutlineCurrencyRupee } from "react-icons/hi";
import { TbReportMoney, TbFileText, TbDownload } from "react-icons/tb";

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "General",
    remarks: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/expenses", {
          params: { search: searchTerm },
        });
        setExpenses(res.data);
      } catch (err) {
        setError("Failed to load expenses.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchTotal = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/expenses/total");
        setTotalExpenses(res.data.total);
      } catch (err) {
        console.error("Failed to load total expenses:", err);
      }
    };

    fetchExpenses();
    if (!searchTerm) {
      fetchTotal();
    }
  }, [searchTerm]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear messages when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleAdd = async () => {
    if (!form.title || !form.amount) {
      setError("Title and amount are required fields.");
      return;
    }
    
    // Validate amount is a positive number
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a valid positive number.");
      return;
    }
    
    setError(""); // Clear any previous errors
    
    try {
      const payload = {
        title: form.title.trim(),
        amount: amount,
        date: form.date,
        category: form.category,
        remarks: form.remarks.trim()
      };
      
      const response = await axios.post("http://localhost:5000/api/expenses", payload);
      
      // Reset form on success
      setForm({
        title: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        category: "General",
        remarks: "",
      });
      
      // Refetch expenses
      const res = await axios.get("http://localhost:5000/api/expenses", {
        params: { search: searchTerm },
      });
      setExpenses(res.data);
      
      // Refetch total
      const totalRes = await axios.get("http://localhost:5000/api/expenses/total");
      setTotalExpenses(totalRes.data.total);
      
      // Show success message
      setError(""); // Clear error on success
      setSuccess("Expense added successfully!");
      setTimeout(() => setSuccess(""), 3000); // Clear success message after 3 seconds
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to add expense.";
      console.error("Expense creation error:", err.response?.data || err.message);
      console.error("Full error object:", err);
      
      // Show more specific error for duplicate key errors
      if (errorMessage.includes('E11000') || errorMessage.includes('duplicate') || errorMessage.includes('Duplicate')) {
        setError("This expense may already exist. Please verify the details and try again. If the issue persists, try changing the title slightly.");
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      console.log('Updating expense status:', { id, status });
      // Send both status and action to backend for audit clarity
      const response = await axios.patch(`http://localhost:5000/api/expenses/${id}/status`, { status, action: status });
      console.log('Status update response:', response.data);

      setExpenses(
        expenses.map((e) => (e._id === id ? { ...e, status } : e))
      );

      // Show success message
      setSuccess(`Expense ${status.toLowerCase()} successfully!`);
      setTimeout(() => setSuccess(""), 2000);

    } catch (err) {
      console.error('Status update error:', err.response?.data || err.message);
      console.error('Full error object:', err);
      const errorMessage = err.response?.data?.message || "Failed to update status.";
      setError(`Failed to ${status.toLowerCase()} expense: ${errorMessage}`);
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`);
      
      // Remove expense from local state
      setExpenses(expenses.filter(e => e._id !== id));
      
      // Refetch total since we deleted an expense
      const totalRes = await axios.get("http://localhost:5000/api/expenses/total");
      setTotalExpenses(totalRes.data.total);
      
      // Show success message
      setSuccess("Expense deleted successfully!");
      setTimeout(() => setSuccess(""), 2000);
      
    } catch (err) {
      console.error('Delete error:', err.response?.data || err.message);
      setError("Failed to delete expense: " + (err.response?.data?.message || "Unknown error"));
      setTimeout(() => setError(""), 3000);
    }
  };

  // Add new function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const pendingAmount = expenses
    .filter((r) => r.status === "Pending")
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const approvedAmount = expenses
    .filter((r) => r.status === "Approved")
    .reduce((sum, r) => sum + Number(r.amount), 0);
  
  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExport = async (format) => {
    try {
      // Include header information in the request
      const headerInfo = {
        society: "maitrey education society",
        instituteName: "NAGARJUNA",
        instituteFullName: "Institute of Engineering, Technology & Management",
        affiliationInfo: "(AICTE, DTE Approved & Affiliated to R.T.M. Nagpur University, Nagpur)",
        address: "Village Satnavri, Amravati Road, Nagpur 440023",
        email: "maitrey.ngp@gmail.com",
        website: "www.nietm.in",
        phone: "07118 322211, 12",
        docId: `SS-EMP001-JUL2025`
      };

      const response = await axios.get(
        `http://localhost:5000/api/expenses/export/${format}`,
        { 
          responseType: 'blob',
          params: { headerInfo: JSON.stringify(headerInfo) }
        }
      );
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Expenses_Report.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
      
      // Append to html page
      document.body.appendChild(link);
      link.click();
      
      // Clean up and remove the link
      link.parentNode.removeChild(link);
      
      setSuccess(`Successfully exported expenses to ${format.toUpperCase()}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(`${format.toUpperCase()} export error:`, err);
      setError(`Failed to export expenses to ${format.toUpperCase()}`);
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6 max-w-7xl mx-auto"
    >
      {/* College Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-center gap-4">
          <img 
            src="/logo1.png" 
            alt="College Logo" 
            className="h-16 w-auto"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Nagarjuna Institute of Engineering and Technology</h1>
            <p className="text-gray-600">Management Information System - Expense Management</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <TbReportMoney className="text-blue-600" size={32} />
          Expense Management
        </h1>
        
        {/* Export buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <TbDownload size={20} />
            Export to Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <TbFileText size={20} />
            Export to PDF
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
            <HiOutlineCurrencyRupee className="text-blue-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalExpenses)}</p>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Pending Approval</h3>
            <FiAlertCircle className="text-yellow-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-yellow-600 mt-2">
            {formatCurrency(expenses.filter(r => r.status === "Pending").reduce((sum, r) => sum + Number(r.amount), 0))}
          </p>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">Approved Amount</h3>
            <FiCheck className="text-green-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(expenses.filter(r => r.status === "Approved").reduce((sum, r) => sum + Number(r.amount), 0))}
          </p>
        </motion.div>
      </div>

      {/* FORM */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiPlusCircle className="text-blue-600" />
          Add New Expense
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              name="title"
              placeholder="Enter expense title"
              value={form.title}
              onChange={handleChange}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              name="amount"
              placeholder="Enter amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option>General</option>
              <option>Office Supplies</option>
              <option>Utilities</option>
              <option>Maintenance</option>
              <option>Travel</option>
              <option>Equipment</option>
              <option>Software</option>
              <option>Other</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea
              name="remarks"
              placeholder="Additional details (optional)"
              value={form.remarks}
              onChange={handleChange}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows="2"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleAdd}
            disabled={!form.title || !form.amount}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <FiPlusCircle />
            Add Expense
          </button>
          
          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-red-500 text-sm flex items-center gap-2"
              >
                <FiAlertCircle />
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-green-500 text-sm flex items-center gap-2"
              >
                <FiCheck />
                {success}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* SEARCH */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading expenses...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((exp) => (
                  <motion.tr 
                    key={exp._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{exp.title}</div>
                      {exp.remarks && (
                        <div className="text-sm text-gray-500">{exp.remarks}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{formatCurrency(exp.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(exp.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{exp.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        exp.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        exp.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        {exp.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(exp._id, 'Approved')}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Approve"
                            >
                              <FiCheck size={18} />
                            </button>
                            <button
                              onClick={() => handleStatusChange(exp._id, 'Rejected')}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Reject"
                            >
                              <FiX size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(exp._id)}
                          className="text-gray-600 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No expenses match your search." : "No expenses recorded yet."}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}