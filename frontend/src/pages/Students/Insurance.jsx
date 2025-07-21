import { useState, useEffect } from "react";
import axios from "axios";

export default function Insurance() {
  const [policies, setPolicies] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  const [formData, setFormData] = useState({
    studentId: "",
    policyNumber: "",
    insuranceProvider: "",
    policyType: "Health",
    coverageAmount: "",
    premiumAmount: "",
    premiumFrequency: "Yearly",
    startDate: "",
    endDate: "",
    coverageDetails: "",
    exclusions: "",
    termsAndConditions: "",
    contactPerson: {
      name: "",
      phone: "",
      email: ""
    },
    agentName: "",
    remarks: ""
  });

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchPolicies();
  }, [searchTerm, filterStatus, filterType]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        status: filterStatus,
        policyType: filterType,
      };
      // Remove empty params to avoid sending empty queries
      Object.keys(params).forEach(key => {
        if (!params[key]) {
          delete params[key];
        }
      });
      const response = await axios.get("http://localhost:5000/api/insurance", { params });
      setPolicies(response.data);
    } catch (error) {
      setError("Failed to fetch insurance policies");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/students");
      setStudents(response.data);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/insurance/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPolicy) {
        await axios.put(`http://localhost:5000/api/insurance/${editingPolicy._id}`, formData);
      } else {
        await axios.post("http://localhost:5000/api/insurance", formData);
      }
      setShowForm(false);
      setEditingPolicy(null);
      resetForm();
      fetchPolicies();
      fetchStats();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save policy");
    }
  };

  const handleEdit = (policy) => {
    setEditingPolicy(policy);
    setFormData({
      studentId: policy.studentId._id,
      policyNumber: policy.policyNumber || "",
      insuranceProvider: policy.insuranceProvider,
      policyType: policy.policyType,
      coverageAmount: policy.coverageAmount,
      premiumAmount: policy.premiumAmount,
      premiumFrequency: policy.premiumFrequency,
      startDate: policy.startDate.split('T')[0],
      endDate: policy.endDate.split('T')[0],
      coverageDetails: policy.coverageDetails || "",
      exclusions: policy.exclusions || "",
      termsAndConditions: policy.termsAndConditions || "",
      contactPerson: policy.contactPerson || { name: "", phone: "", email: "" },
      agentName: policy.agentName || "",
      remarks: policy.remarks || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this policy?")) {
      try {
        await axios.delete(`http://localhost:5000/api/insurance/${id}`);
        fetchPolicies();
        fetchStats();
      } catch (error) {
        setError("Failed to delete policy");
      }
    }
  };

  const updatePaymentStatus = async (id, paymentStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/insurance/${id}/payment`, {
        paymentStatus,
        lastPaymentDate: paymentStatus === 'Paid' ? new Date().toISOString() : null
      });
      fetchPolicies();
    } catch (error) {
      setError("Failed to update payment status");
    }
  };

  const updatePolicyStatus = async (id, status) => {
    try {
      await axios.patch(`http://localhost:5000/api/insurance/${id}/status`, { status });
      fetchPolicies();
      fetchStats();
    } catch (error) {
      setError("Failed to update policy status");
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: "",
      policyNumber: "",
      insuranceProvider: "",
      policyType: "Health",
      coverageAmount: "",
      premiumAmount: "",
      premiumFrequency: "Yearly",
      startDate: "",
      endDate: "",
      coverageDetails: "",
      exclusions: "",
      termsAndConditions: "",
      contactPerson: { name: "", phone: "", email: "" },
      agentName: "",
      remarks: ""
    });
  };

  const getStatusColor = (status) => {
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

  if (loading) return <div className="text-center p-8">Loading insurance policies...</div>;
  if (error) return <div className="text-red-600 p-4">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🛡️ Insurance Management</h1>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingPolicy(null);
            resetForm();
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ➕ Add New Policy
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Policies</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.totalPolicies || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Policies</h3>
          <p className="text-2xl font-bold text-green-600">{stats.activePolicies || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Coverage</h3>
          <p className="text-2xl font-bold text-purple-600">₹{(stats.totalCoverage || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Pending Payments</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.pendingPayments || 0}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student name, policy number, or provider..."
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Policy Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Health">Health</option>
              <option value="Accident">Accident</option>
              <option value="Life">Life</option>
              <option value="Comprehensive">Comprehensive</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Policies Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Policy Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coverage & Premium
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {policies.map((policy) => (
                <tr key={policy._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {policy.studentId?.firstName} {policy.studentId?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {policy.studentId?.studentId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {policy.studentId?.department}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {policy.policyNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {policy.insuranceProvider}
                      </div>
                      <div className="text-sm text-gray-500">
                        {policy.policyType}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        Coverage: ₹{policy.coverageAmount?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Premium: ₹{policy.premiumAmount?.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {policy.premiumFrequency}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        Start: {new Date(policy.startDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        End: {new Date(policy.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(policy.status)}`}>
                        {policy.status}
                      </span>
                      <div>
                        <select
                          value={policy.paymentStatus}
                          onChange={(e) => updatePaymentStatus(policy._id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded border ${getPaymentStatusColor(policy.paymentStatus)}`}
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Overdue">Overdue</option>
                          <option value="Partial">Partial</option>
                        </select>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(policy)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(policy._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {policies.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No policies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-blue-600 focus:outline-none"
                  title="Back"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold">{editingPolicy ? "Edit Policy" : "Add New Policy"}</h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student and Policy Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium">Student</label>
                  <select
                    name="studentId"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    required
                    className="w-full p-2 border rounded"
                  >
                    <option value="" disabled>Select a student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.firstName} {s.middleName ? `${s.middleName} ` : ''}{s.lastName} ({s.studentId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Policy Number</label>
                  <input type="text" name="policyNumber" value={formData.policyNumber} onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })} required className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Insurance Provider</label>
                  <input type="text" name="insuranceProvider" value={formData.insuranceProvider} onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })} required className="w-full p-2 border rounded" />
                </div>
              </div>
              
              {/* Policy Type, Amounts, Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium">Policy Type</label>
                  <select name="policyType" value={formData.policyType} onChange={(e) => setFormData({ ...formData, policyType: e.target.value })} required className="w-full p-2 border rounded">
                    <option>Health</option>
                    <option>Accident</option>
                    <option>Life</option>
                    <option>Comprehensive</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Coverage Amount</label>
                  <input type="number" name="coverageAmount" value={formData.coverageAmount} onChange={(e) => setFormData({ ...formData, coverageAmount: e.target.value })} required className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Premium Amount</label>
                  <input type="number" name="premiumAmount" value={formData.premiumAmount} onChange={(e) => setFormData({ ...formData, premiumAmount: e.target.value })} required className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Premium Frequency</label>
                  <select name="premiumFrequency" value={formData.premiumFrequency} onChange={(e) => setFormData({ ...formData, premiumFrequency: e.target.value })} required className="w-full p-2 border rounded">
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Half-Yearly</option>
                    <option>Yearly</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Start Date</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required className="w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium">End Date</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required className="w-full p-2 border rounded" />
                </div>
              </div>

              {/* Textareas for details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Coverage Details</label>
                  <textarea name="coverageDetails" value={formData.coverageDetails} onChange={(e) => setFormData({ ...formData, coverageDetails: e.target.value })} className="w-full p-2 border rounded" rows="3"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium">Exclusions</label>
                  <textarea name="exclusions" value={formData.exclusions} onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })} className="w-full p-2 border rounded" rows="3"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium">Remarks</label>
                  <textarea name="remarks" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} className="w-full p-2 border rounded" rows="2"></textarea>
                </div>
              </div>
              
              {/* Buttons */}
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                  {editingPolicy ? "Update Policy" : "Save Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 