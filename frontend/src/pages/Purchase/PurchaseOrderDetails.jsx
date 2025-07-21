import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  Download, 
  Printer, 
  MessageSquare,
  Calendar,
  User,
  Building,
  Package,
  FileText,
  DollarSign,
  Clock,
  AlertTriangle,
  Truck,
  CreditCard
} from 'lucide-react';

const PurchaseOrderDetails = ({ orderId, onClose, onEdit }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/purchase/orders/${orderId}`);
      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approvalType, approved) => {
    try {
      setApprovalLoading(true);
      const response = await fetch(`/api/purchase/orders/${orderId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvalType,
          approved,
          comments,
          approvedBy: 'current-user-id' // Replace with actual user ID
        })
      });

      if (response.ok) {
        await fetchOrderDetails(); // Refresh data
        setShowApprovalModal(false);
        setComments('');
        alert(`Purchase order ${approved ? 'approved' : 'rejected'} successfully!`);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Error processing approval. Please try again.');
    } finally {
      setApprovalLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Draft': 'bg-gray-100 text-gray-800',
      'Submitted': 'bg-blue-100 text-blue-800',
      'Department Approved': 'bg-yellow-100 text-yellow-800',
      'Finance Approved': 'bg-orange-100 text-orange-800',
      'Director Approved': 'bg-purple-100 text-purple-800',
      'Purchase Approved': 'bg-indigo-100 text-indigo-800',
      'Ordered': 'bg-cyan-100 text-cyan-800',
      'Received': 'bg-green-100 text-green-800',
      'Completed': 'bg-green-200 text-green-900',
      'Rejected': 'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'text-green-600',
      'Medium': 'text-yellow-600',
      'High': 'text-orange-600',
      'Critical': 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getApprovalSteps = () => {
    const steps = [
      {
        name: 'Department Head',
        key: 'departmentHead',
        required: true
      },
      {
        name: 'Finance Head',
        key: 'financeHead',
        required: true
      }
    ];

    if (order?.level === 'Institute') {
      steps.push({
        name: 'Director',
        key: 'director',
        required: true
      });
    }

    steps.push({
      name: 'Purchase Officer',
      key: 'purchaseOfficer',
      required: true
    });

    return steps;
  };

  const canApprove = (approvalType) => {
    // Add logic to check if current user can approve
    // This would typically check user role and current status
    const statusFlow = {
      'departmentHead': order?.status === 'Submitted',
      'financeHead': order?.status === 'Department Approved',
      'director': order?.status === 'Finance Approved' && order?.level === 'Institute',
      'purchaseOfficer': order?.status === 'Director Approved' || (order?.status === 'Finance Approved' && order?.level === 'Department')
    };
    
    return statusFlow[approvalType] || false;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading purchase order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-600">The requested purchase order could not be found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SmartProcure - Order Details</h1>
            <p className="text-gray-600">Order #{order.poNumber}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => onEdit && onEdit(order._id)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Edit3 size={20} />
            <span>Edit</span>
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2">
            <Download size={20} />
            <span>Download</span>
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Printer size={20} />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Order Information</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="text-gray-400 mr-3" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Requested By</p>
                    <p className="font-medium">{order.requestedBy?.name}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Building className="text-gray-400 mr-3" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{order.department}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="text-gray-400 mr-3" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Request Date</p>
                    <p className="font-medium">{formatDate(order.requestDate)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <AlertTriangle className={`mr-3 ${getPriorityColor(order.priority)}`} size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Priority</p>
                    <p className={`font-medium ${getPriorityColor(order.priority)}`}>{order.priority}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <Clock className="text-gray-400 mr-3" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Required Date</p>
                    <p className="font-medium">{formatDate(order.requiredDate)}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Building className="text-gray-400 mr-3" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Level</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.level === 'Institute' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.level}
                    </span>
                  </div>
                </div>

                <div className="flex items-center">
                  <DollarSign className="text-gray-400 mr-3" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Budget Head</p>
                    <p className="font-medium">{order.budgetHead}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <DollarSign className="text-gray-400 mr-3" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Budget Allocation</p>
                    <p className="font-medium">{formatCurrency(order.budgetAllocation)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center mb-4">
              <Package className="text-blue-600 mr-2" size={20} />
              <h2 className="text-lg font-semibold text-gray-900">Items ({order.items.length})</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{item.itemName}</div>
                          <div className="text-sm text-gray-500">{item.itemCode}</div>
                          <div className="text-xs text-gray-400 mt-1">{item.specifications}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{item.category}</div>
                        <div className="text-xs text-gray-500">{item.subcategory}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">{formatCurrency(item.totalPrice)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.urgency === 'Critical' ? 'bg-red-100 text-red-800' :
                          item.urgency === 'High' ? 'bg-orange-100 text-orange-800' :
                          item.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.urgency}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(order.totalAmount)}</div>
              </div>
            </div>
          </div>

          {/* Vendor Information */}
          {order.vendor?.name && (
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <Truck className="text-blue-600 mr-2" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Vendor Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Vendor Name</p>
                  <p className="font-medium">{order.vendor.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="font-medium">{order.vendor.contact}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{order.vendor.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">GST Number</p>
                  <p className="font-medium">{order.vendor.gst}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{order.vendor.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Information */}
          {order.payment && Object.keys(order.payment).length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <CreditCard className="text-blue-600 mr-2" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Advance Amount</p>
                  <p className="font-medium text-green-600">{formatCurrency(order.payment.advanceAmount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Paid Amount</p>
                  <p className="font-medium text-blue-600">{formatCurrency(order.payment.paidAmount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Balance Amount</p>
                  <p className="font-medium text-orange-600">{formatCurrency(order.payment.balanceAmount || 0)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Audit Trail */}
          {order.auditTrail && order.auditTrail.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <FileText className="text-blue-600 mr-2" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
              </div>

              <div className="space-y-4">
                {order.auditTrail.map((entry, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{entry.action}</p>
                        <p className="text-sm text-gray-500">{formatDate(entry.date)}</p>
                      </div>
                      <p className="text-sm text-gray-600">{entry.details}</p>
                      {entry.previousStatus && entry.newStatus && (
                        <p className="text-xs text-gray-500 mt-1">
                          Status: {entry.previousStatus} → {entry.newStatus}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Approval Status */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Status</h3>
            <div className="space-y-4">
              {getApprovalSteps().map((step, index) => {
                const approval = order.approvals[step.key];
                const isCompleted = approval?.approved;
                const canApproveThis = canApprove(step.key);

                return (
                  <div key={step.key} className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-green-100 text-green-600' 
                        : canApproveThis 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle size={16} />
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isCompleted ? 'text-green-600' : 'text-gray-900'}`}>
                        {step.name}
                      </p>
                      {approval?.approvedDate && (
                        <p className="text-xs text-gray-500">
                          {formatDate(approval.approvedDate)}
                        </p>
                      )}
                      {approval?.comments && (
                        <p className="text-xs text-gray-600 mt-1">{approval.comments}</p>
                      )}
                    </div>
                    {canApproveThis && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setApprovalAction({ type: step.key, approved: true });
                            setShowApprovalModal(true);
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setApprovalAction({ type: step.key, approved: false });
                            setShowApprovalModal(true);
                          }}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Items:</span>
                <span className="font-medium">{order.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Quantity:</span>
                <span className="font-medium">
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Budget Utilization:</span>
                <span className="font-medium">
                  {((order.totalAmount / order.budgetAllocation) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-green-600">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {order.attachments && order.attachments.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
              <div className="space-y-2">
                {order.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <FileText size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700">{file.fileName}</span>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {approvalAction?.approved ? 'Approve' : 'Reject'} Purchase Order
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to {approvalAction?.approved ? 'approve' : 'reject'} this purchase order?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments {!approvalAction?.approved && '*'}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Enter your comments..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproval(approvalAction.type, approvalAction.approved)}
                disabled={approvalLoading || (!approvalAction?.approved && !comments.trim())}
                className={`flex-1 px-4 py-2 rounded-lg text-white ${
                  approvalAction?.approved 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {approvalLoading ? 'Processing...' : (approvalAction?.approved ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrderDetails;
