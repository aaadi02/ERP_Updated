import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/store';

export default function StoreDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchItems();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/items?limit=50`);
      const data = await response.json();
      setItems(data.items || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching items:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <span className="text-4xl">🏪</span>
            StoreVault - Intelligent Inventory Management System
          </h1>
          <p className="text-gray-600">Advanced inventory control with smart analytics and automated workflows</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-lg">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'inventory', label: 'Inventory', icon: '📦' },
              { id: 'transactions', label: 'Transactions', icon: '📋' },
              { id: 'requests', label: 'Requests', icon: '📝' },
              { id: 'reports', label: 'Reports', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-green-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                title="Total Items"
                value={dashboardData.statistics.totalItems}
                icon="📦"
                color="from-blue-500 to-indigo-600"
                trend={`${dashboardData.statistics.activeItems} active`}
              />
              <StatCard
                title="Low Stock Items"
                value={dashboardData.statistics.lowStockItems}
                icon="⚠️"
                color="from-orange-500 to-red-600"
                trend="Need attention"
              />
              <StatCard
                title="Out of Stock"
                value={dashboardData.statistics.outOfStockItems}
                icon="🚫"
                color="from-red-500 to-pink-600"
                trend="Urgent restocking"
              />
              <StatCard
                title="Pending Requests"
                value={dashboardData.statistics.pendingRequests}
                icon="📝"
                color="from-purple-500 to-violet-600"
                trend="Awaiting approval"
              />
            </div>

            {/* Category Breakdown and Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Items by Category
                </h3>
                <div className="space-y-3">
                  {dashboardData.categoryStats.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{category._id}</span>
                      <div className="text-right">
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {category.totalItems} items
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Total Stock: {category.totalStock}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🔄</span>
                  Recent Transactions
                </h3>
                <div className="space-y-3">
                  {dashboardData.recentTransactions.length > 0 ? (
                    dashboardData.recentTransactions.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{transaction.itemId?.itemName || 'Unknown Item'}</div>
                          <div className="text-sm text-gray-600">
                            {transaction.transactionType} - {transaction.quantity} units
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            transaction.transactionType === 'inward' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {transaction.transactionType}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(transaction.transactionDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No recent transactions
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <QuickAction
                  title="Add New Item"
                  description="Register new inventory item"
                  icon="➕"
                  onClick={() => setShowCreateItem(true)}
                />
                <QuickAction
                  title="Create Request"
                  description="Request items from store"
                  icon="📝"
                  onClick={() => setShowCreateRequest(true)}
                />
                <QuickAction
                  title="Stock Movement"
                  description="Record stock transactions"
                  icon="📋"
                  onClick={() => setActiveTab('transactions')}
                />
                <QuickAction
                  title="View Low Stock"
                  description="Check items needing restock"
                  icon="⚠️"
                  onClick={() => setActiveTab('inventory')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <InventoryManager 
            items={items} 
            onItemsUpdate={fetchItems}
            onCreateItem={() => setShowCreateItem(true)}
          />
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <TransactionManager onItemsUpdate={fetchItems} />
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <RequestManager />
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <ReportsManager dashboardData={dashboardData} />
        )}

        {/* Modals */}
        {showCreateItem && (
          <CreateItemModal
            onClose={() => setShowCreateItem(false)}
            onSuccess={() => {
              setShowCreateItem(false);
              fetchItems();
              fetchDashboardData();
            }}
          />
        )}

        {showCreateRequest && (
          <CreateRequestModal
            items={items}
            onClose={() => setShowCreateRequest(false)}
            onSuccess={() => {
              setShowCreateRequest(false);
              fetchDashboardData();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, icon, color, trend }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-xl`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-3xl">{icon}</div>
      </div>
      <div className="text-sm opacity-80 font-medium">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-70 mt-1">{trend}</div>
    </div>
  );
}

function QuickAction({ title, description, icon, onClick }) {
  return (
    <div 
      className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm opacity-80">{description}</p>
    </div>
  );
}

// Placeholder components - will be implemented separately
function InventoryManager({ items, onItemsUpdate, onCreateItem }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
        <button
          onClick={onCreateItem}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          Add New Item
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <ItemCard key={item._id} item={item} onUpdate={onItemsUpdate} />
        ))}
      </div>
    </div>
  );
}

function ItemCard({ item, onUpdate }) {
  const getStockStatus = () => {
    if (item.currentStock === 0) return { status: 'out', color: 'red', text: 'Out of Stock' };
    if (item.currentStock <= item.minimumStock) return { status: 'low', color: 'orange', text: 'Low Stock' };
    return { status: 'normal', color: 'green', text: 'In Stock' };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-all">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">{item.itemName}</h3>
          <p className="text-sm text-gray-600">{item.itemId}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-semibold bg-${stockStatus.color}-100 text-${stockStatus.color}-800`}>
          {stockStatus.text}
        </span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Category:</span>
          <span className="font-medium">{item.category}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Current Stock:</span>
          <span className="font-medium">{item.currentStock} {item.unit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Unit Price:</span>
          <span className="font-medium">₹{item.unitPrice}</span>
        </div>
      </div>
    </div>
  );
}

function TransactionManager({ onItemsUpdate }) {
  const [transactions, setTransactions] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);
  const [filters, setFilters] = useState({
    transactionType: '',
    department: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchTransactions();
    fetchItems();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '20');
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`${API_BASE_URL}/transactions?${queryParams}`);
      const data = await response.json();
      setTransactions(data.transactions || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/items?limit=100`);
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      transactionType: '',
      department: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'inward': return 'bg-green-100 text-green-800';
      case 'outward': return 'bg-orange-100 text-orange-800';
      case 'adjustment': return 'bg-blue-100 text-blue-800';
      case 'return': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span>📋</span>
              Transaction Management
            </h2>
            <p className="text-gray-600 mt-1">Track and manage all stock movements</p>
          </div>
          <button
            onClick={() => setShowCreateTransaction(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            New Transaction
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type
            </label>
            <select
              name="transactionType"
              value={filters.transactionType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="inward">Inward</option>
              <option value="outward">Outward</option>
              <option value="adjustment">Adjustment</option>
              <option value="return">Return</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <input
              type="text"
              name="department"
              value={filters.department}
              onChange={handleFilterChange}
              placeholder="Filter by department"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800 text-sm underline"
          >
            Clear Filters
          </button>
          <div className="text-sm text-gray-600">
            Showing {transactions.length} transactions
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Transactions Found</h3>
            <p className="text-gray-600 mb-4">No transactions match your current filters.</p>
            <button
              onClick={() => setShowCreateTransaction(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Create First Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Transaction ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock Change</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <TransactionRow 
                    key={transaction._id} 
                    transaction={transaction}
                    onUpdate={fetchTransactions}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Transaction Modal */}
      {showCreateTransaction && (
        <CreateTransactionModal
          items={items}
          onClose={() => setShowCreateTransaction(false)}
          onSuccess={() => {
            setShowCreateTransaction(false);
            fetchTransactions();
            onItemsUpdate();
          }}
        />
      )}
    </div>
  );
}

function TransactionRow({ transaction, onUpdate }) {
  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'inward': return 'bg-green-100 text-green-800';
      case 'outward': return 'bg-orange-100 text-orange-800';
      case 'adjustment': return 'bg-blue-100 text-blue-800';
      case 'return': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStockChange = () => {
    const change = transaction.newStock - transaction.previousStock;
    const sign = change >= 0 ? '+' : '';
    const color = change >= 0 ? 'text-green-600' : 'text-red-600';
    return (
      <span className={color}>
        {sign}{change} ({transaction.previousStock} → {transaction.newStock})
      </span>
    );
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-4">
        <div className="font-medium text-gray-900">{transaction.transactionId}</div>
      </td>
      <td className="py-3 px-4">
        <div className="font-medium text-gray-900">
          {transaction.itemId?.itemName || 'Unknown Item'}
        </div>
        <div className="text-sm text-gray-500">
          {transaction.itemId?.itemId}
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTransactionTypeColor(transaction.transactionType)}`}>
          {transaction.transactionType}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="font-medium">{transaction.quantity} {transaction.itemId?.unit}</div>
        <div className="text-sm text-gray-500">₹{transaction.unitPrice || 0}/unit</div>
      </td>
      <td className="py-3 px-4">
        {formatStockChange()}
      </td>
      <td className="py-3 px-4">
        <div className="text-gray-900">{transaction.department}</div>
      </td>
      <td className="py-3 px-4">
        <div className="text-gray-900">
          {new Date(transaction.transactionDate).toLocaleDateString()}
        </div>
        <div className="text-sm text-gray-500">
          {new Date(transaction.transactionDate).toLocaleTimeString()}
        </div>
      </td>
      <td className="py-3 px-4">
        <button
          className="text-blue-600 hover:text-blue-800 text-sm"
          onClick={() => {
            // View details functionality can be added here
            alert(`Transaction Details:\n\nID: ${transaction.transactionId}\nReason: ${transaction.reason || 'N/A'}\nRemarks: ${transaction.remarks || 'N/A'}`);
          }}
        >
          View Details
        </button>
      </td>
    </tr>
  );
}

function CreateTransactionModal({ items, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    itemId: '',
    transactionType: 'inward',
    quantity: 0,
    unitPrice: 0,
    department: '',
    reason: '',
    remarks: '',
    invoiceDetails: {
      invoiceNumber: '',
      invoiceDate: '',
      supplierName: ''
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const transactionTypes = [
    { value: 'inward', label: 'Inward (Stock In)', description: 'Add stock to inventory' },
    { value: 'outward', label: 'Outward (Stock Out)', description: 'Remove stock from inventory' },
    { value: 'adjustment', label: 'Adjustment', description: 'Adjust stock to specific quantity' },
    { value: 'return', label: 'Return', description: 'Return items to inventory' }
  ];

  const departments = [
    'Administration', 'Computer Science', 'Electronics', 'Mechanical', 
    'Civil', 'Library', 'Sports', 'Maintenance', 'Accounts', 'Other'
  ];

  useEffect(() => {
    if (formData.itemId) {
      const item = items.find(i => i._id === formData.itemId);
      setSelectedItem(item);
      if (item) {
        setFormData(prev => ({ ...prev, unitPrice: item.unitPrice || 0 }));
      }
    } else {
      setSelectedItem(null);
    }
  }, [formData.itemId, items]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.itemId) newErrors.itemId = 'Item selection is required';
    if (!formData.transactionType) newErrors.transactionType = 'Transaction type is required';
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (!formData.department) newErrors.department = 'Department is required';
    if (formData.unitPrice < 0) newErrors.unitPrice = 'Unit price cannot be negative';
    
    // Check stock availability for outward transactions
    if (formData.transactionType === 'outward' && selectedItem) {
      if (formData.quantity > selectedItem.currentStock) {
        newErrors.quantity = `Insufficient stock. Available: ${selectedItem.currentStock}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setErrors({ submit: data.message || 'Failed to create transaction' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getStockPreview = () => {
    if (!selectedItem || !formData.quantity) return null;

    const currentStock = selectedItem.currentStock;
    let newStock = currentStock;

    switch (formData.transactionType) {
      case 'inward':
        newStock = currentStock + parseInt(formData.quantity);
        break;
      case 'outward':
        newStock = currentStock - parseInt(formData.quantity);
        break;
      case 'adjustment':
        newStock = parseInt(formData.quantity);
        break;
      case 'return':
        newStock = currentStock + parseInt(formData.quantity);
        break;
    }

    return (
      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm font-medium text-blue-800">Stock Preview</div>
        <div className="text-sm text-blue-700">
          Current: {currentStock} → New: {newStock} 
          {formData.transactionType !== 'adjustment' && (
            <span className={newStock >= currentStock ? 'text-green-600' : 'text-red-600'}>
              ({newStock >= currentStock ? '+' : ''}{newStock - currentStock})
            </span>
          )}
        </div>
        {newStock < 0 && (
          <div className="text-sm text-red-600 font-medium">
            ⚠️ This will result in negative stock!
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">StoreVault - Create Stock Transaction</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              {errors.submit}
            </div>
          )}

          {/* Item Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Item Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Item *
                </label>
                <select
                  name="itemId"
                  value={formData.itemId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.itemId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select an item</option>
                  {items.map(item => (
                    <option key={item._id} value={item._id}>
                      {item.itemName} ({item.itemId}) - {item.currentStock} {item.unit}
                    </option>
                  ))}
                </select>
                {errors.itemId && <p className="text-red-500 text-sm mt-1">{errors.itemId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type *
                </label>
                <select
                  name="transactionType"
                  value={formData.transactionType}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.transactionType ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {transactionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.transactionType && <p className="text-red-500 text-sm mt-1">{errors.transactionType}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {transactionTypes.find(t => t.value === formData.transactionType)?.description}
                </p>
              </div>
            </div>

            {selectedItem && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Current Stock:</span>
                    <div className="font-medium">{selectedItem.currentStock} {selectedItem.unit}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Unit Price:</span>
                    <div className="font-medium">₹{selectedItem.unitPrice}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <div className="font-medium">{selectedItem.category}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div className={`font-medium ${
                      selectedItem.currentStock <= selectedItem.minimumStock ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {selectedItem.currentStock <= selectedItem.minimumStock ? 'Low Stock' : 'In Stock'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.quantity ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter quantity"
                />
                {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                {getStockPreview()}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price (₹)
                </label>
                <input
                  type="number"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.unitPrice ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.unitPrice && <p className="text-red-500 text-sm mt-1">{errors.unitPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.department ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Value
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  ₹{(formData.quantity * formData.unitPrice).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Reason for transaction"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional remarks"
                />
              </div>
            </div>
          </div>

          {/* Invoice Details (for inward transactions) */}
          {formData.transactionType === 'inward' && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Details (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    name="invoiceDetails.invoiceNumber"
                    value={formData.invoiceDetails.invoiceNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Invoice number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    name="invoiceDetails.invoiceDate"
                    value={formData.invoiceDetails.invoiceDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    name="invoiceDetails.supplierName"
                    value={formData.invoiceDetails.supplierName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Supplier name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RequestManager() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Request Management</h2>
      <p className="text-gray-600">Request management coming soon!</p>
    </div>
  );
}

function ReportsManager({ dashboardData }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Reports & Analytics</h2>
      <p className="text-gray-600">Advanced reporting coming soon!</p>
    </div>
  );
}

function CreateItemModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    category: '',
    subcategory: '',
    unit: 'Piece',
    currentStock: 0,
    minimumStock: 10,
    maximumStock: 1000,
    reorderLevel: 20,
    unitPrice: 0,
    location: {
      building: '',
      floor: '',
      room: '',
      rack: '',
      shelf: ''
    },
    supplier: {
      name: '',
      contact: '',
      email: '',
      address: ''
    },
    specifications: '',
    brand: '',
    model: '',
    status: 'active'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const categories = [
    'Office Supplies',
    'Cleaning Supplies', 
    'IT Equipment',
    'Furniture',
    'Lab Equipment',
    'Books',
    'Electronics',
    'Maintenance',
    'Safety Equipment',
    'Sports Equipment',
    'Other'
  ];

  const units = [
    'Piece', 'Kilogram', 'Liter', 'Meter', 'Box', 'Pack', 
    'Set', 'Dozen', 'Ream', 'Carton', 'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.itemName.trim()) newErrors.itemName = 'Item name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.subcategory.trim()) newErrors.subcategory = 'Subcategory is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (formData.unitPrice < 0) newErrors.unitPrice = 'Unit price cannot be negative';
    if (formData.currentStock < 0) newErrors.currentStock = 'Current stock cannot be negative';
    if (formData.minimumStock < 0) newErrors.minimumStock = 'Minimum stock cannot be negative';
    if (formData.maximumStock <= formData.minimumStock) {
      newErrors.maximumStock = 'Maximum stock must be greater than minimum stock';
    }
    if (formData.reorderLevel < formData.minimumStock) {
      newErrors.reorderLevel = 'Reorder level should be at least equal to minimum stock';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/store/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        setErrors({ submit: data.message || 'Failed to create item' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">StoreVault - Add New Item</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
              {errors.submit}
            </div>
          )}

          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.itemName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter item name"
                />
                {errors.itemName && <p className="text-red-500 text-sm mt-1">{errors.itemName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory *
                </label>
                <input
                  type="text"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.subcategory ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter subcategory"
                />
                {errors.subcategory && <p className="text-red-500 text-sm mt-1">{errors.subcategory}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.unit ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
                {errors.unit && <p className="text-red-500 text-sm mt-1">{errors.unit}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter item description"
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Stock Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <input
                  type="number"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.currentStock ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.currentStock && <p className="text-red-500 text-sm mt-1">{errors.currentStock}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stock
                </label>
                <input
                  type="number"
                  name="minimumStock"
                  value={formData.minimumStock}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.minimumStock ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.minimumStock && <p className="text-red-500 text-sm mt-1">{errors.minimumStock}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Stock
                </label>
                <input
                  type="number"
                  name="maximumStock"
                  value={formData.maximumStock}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.maximumStock ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.maximumStock && <p className="text-red-500 text-sm mt-1">{errors.maximumStock}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Level
                </label>
                <input
                  type="number"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.reorderLevel ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.reorderLevel && <p className="text-red-500 text-sm mt-1">{errors.reorderLevel}</p>}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (₹)
              </label>
              <input
                type="number"
                name="unitPrice"
                value={formData.unitPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full md:w-1/2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.unitPrice ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.unitPrice && <p className="text-red-500 text-sm mt-1">{errors.unitPrice}</p>}
            </div>
          </div>

          {/* Location Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Location Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Building
                </label>
                <input
                  type="text"
                  name="location.building"
                  value={formData.location.building}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Building name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floor
                </label>
                <input
                  type="text"
                  name="location.floor"
                  value={formData.location.floor}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Floor number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room
                </label>
                <input
                  type="text"
                  name="location.room"
                  value={formData.location.room}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Room number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rack
                </label>
                <input
                  type="text"
                  name="location.rack"
                  value={formData.location.rack}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Rack ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shelf
                </label>
                <input
                  type="text"
                  name="location.shelf"
                  value={formData.location.shelf}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Shelf number"
                />
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Supplier Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  name="supplier.name"
                  value={formData.supplier.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="supplier.contact"
                  value={formData.supplier.contact}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contact number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="supplier.email"
                  value={formData.supplier.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="supplier.address"
                  value={formData.supplier.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Supplier address"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Model number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specifications
              </label>
              <textarea
                name="specifications"
                value={formData.specifications}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Technical specifications, features, etc."
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateRequestModal({ items, onClose, onSuccess }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4">
        <h2 className="text-2xl font-bold mb-4">Create Store Request</h2>
        <p className="text-gray-600 mb-4">Request creation form coming soon!</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSuccess}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Create Request
          </button>
        </div>
      </div>
    </div>
  );
}
