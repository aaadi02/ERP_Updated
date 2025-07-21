import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/maintenance';

export default function AssetManagement() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAsset, setShowCreateAsset] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showMaintenanceHistory, setShowMaintenanceHistory] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [filters, setFilters] = useState({
    assetType: '',
    status: '',
    location: ''
  });

  useEffect(() => {
    fetchAssets();
  }, [filters]);

  const fetchAssets = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.assetType) queryParams.append('assetType', filters.assetType);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.location) queryParams.append('location', filters.location);

      const response = await fetch(`${API_BASE_URL}/assets?${queryParams}`);
      const data = await response.json();
      setAssets(data.assets || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setLoading(false);
    }
  };

  const handleCreateAsset = async (assetData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assetData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Asset created:', result);
        setShowCreateAsset(false);
        fetchAssets();
        alert(`Asset created successfully! Asset ID: ${result.asset.assetId}`);
      } else {
        const error = await response.json();
        alert(`Error creating asset: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      alert(`Network error: ${error.message}`);
    }
  };

  const handleAddMaintenance = async (maintenanceData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assets/${selectedAsset._id}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maintenanceData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Maintenance added:', result);
        setShowAddMaintenance(false);
        fetchAssets();
        alert('Maintenance history updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error adding maintenance: ${error.message}`);
      }
    } catch (error) {
      console.error('Error adding maintenance:', error);
      alert(`Network error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <span className="text-4xl">🏢</span>
            Asset Management System
          </h1>
          <p className="text-gray-600">Comprehensive asset tracking and maintenance history management</p>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4">
              <select
                value={filters.assetType}
                onChange={(e) => setFilters({...filters, assetType: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Asset Types</option>
                <option value="HVAC">HVAC</option>
                <option value="Generator">Generator</option>
                <option value="Elevator">Elevator</option>
                <option value="Fire Safety">Fire Safety</option>
                <option value="Security System">Security System</option>
                <option value="IT Equipment">IT Equipment</option>
                <option value="Furniture">Furniture</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="repair">Under Repair</option>
                <option value="retired">Retired</option>
              </select>

              <input
                type="text"
                placeholder="Filter by location..."
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => setShowCreateAsset(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <span>➕</span>
              Add New Asset
            </button>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid gap-6">
          {assets.map((asset) => (
            <AssetCard
              key={asset._id}
              asset={asset}
              onViewHistory={() => {
                setSelectedAsset(asset);
                setShowMaintenanceHistory(true);
              }}
              onAddMaintenance={() => {
                setSelectedAsset(asset);
                setShowAddMaintenance(true);
              }}
            />
          ))}
        </div>

        {assets.length === 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Assets Found</h2>
            <p className="text-gray-600 mb-6">Start by adding your first asset to track maintenance and history.</p>
            <button
              onClick={() => setShowCreateAsset(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add First Asset
            </button>
          </div>
        )}

        {/* Modals */}
        {showCreateAsset && (
          <CreateAssetModal
            onClose={() => setShowCreateAsset(false)}
            onSubmit={handleCreateAsset}
          />
        )}

        {showMaintenanceHistory && selectedAsset && (
          <MaintenanceHistoryModal
            asset={selectedAsset}
            onClose={() => {
              setShowMaintenanceHistory(false);
              setSelectedAsset(null);
            }}
          />
        )}

        {showAddMaintenance && selectedAsset && (
          <AddMaintenanceModal
            asset={selectedAsset}
            onClose={() => {
              setShowAddMaintenance(false);
              setSelectedAsset(null);
            }}
            onSubmit={handleAddMaintenance}
          />
        )}
      </div>
    </div>
  );
}

function AssetCard({ asset, onViewHistory, onAddMaintenance }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'repair': return 'bg-red-100 text-red-800';
      case 'retired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getAssetIcon = (type) => {
    switch (type) {
      case 'HVAC': return '❄️';
      case 'Generator': return '⚡';
      case 'Elevator': return '🛗';
      case 'Fire Safety': return '🔥';
      case 'Security System': return '🔒';
      case 'IT Equipment': return '💻';
      case 'Furniture': return '🪑';
      case 'Vehicle': return '🚗';
      default: return '📦';
    }
  };

  const isWarrantyExpiring = () => {
    if (!asset.warrantyExpiry) return false;
    const today = new Date();
    const warranty = new Date(asset.warrantyExpiry);
    const daysUntilExpiry = Math.ceil((warranty - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isMaintenanceDue = () => {
    if (!asset.nextMaintenanceDate) return false;
    const today = new Date();
    const nextMaintenance = new Date(asset.nextMaintenanceDate);
    return nextMaintenance <= today;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{getAssetIcon(asset.assetType)}</div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{asset.assetName}</h3>
            <p className="text-gray-600">ID: {asset.assetId}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(asset.status)}`}>
                {asset.status}
              </span>
              <span className="text-sm text-gray-500">{asset.assetType}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onViewHistory}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
          >
            History
          </button>
          <button
            onClick={onAddMaintenance}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
          >
            Add Maintenance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-500">Location</div>
          <div className="font-medium">{asset.location?.building || 'Not specified'}</div>
          {asset.location?.room && <div className="text-sm text-gray-600">{asset.location.room}</div>}
        </div>
        <div>
          <div className="text-sm text-gray-500">Purchase Date</div>
          <div className="font-medium">
            {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Last Maintenance</div>
          <div className="font-medium">
            {asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString() : 'Never'}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Next Maintenance</div>
          <div className={`font-medium ${isMaintenanceDue() ? 'text-red-600' : ''}`}>
            {asset.nextMaintenanceDate ? new Date(asset.nextMaintenanceDate).toLocaleDateString() : 'Not scheduled'}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        {isMaintenanceDue() && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <span className="text-red-500">⚠️</span>
            <span className="text-red-700 text-sm font-medium">Maintenance overdue!</span>
          </div>
        )}
        {isWarrantyExpiring() && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
            <span className="text-yellow-500">⏰</span>
            <span className="text-yellow-700 text-sm font-medium">Warranty expiring soon</span>
          </div>
        )}
      </div>

      {/* Maintenance History Summary */}
      {asset.maintenanceHistory && asset.maintenanceHistory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{asset.maintenanceHistory.length}</span> maintenance record(s)
            {asset.maintenanceHistory.length > 0 && (
              <span> • Last: {new Date(asset.maintenanceHistory[asset.maintenanceHistory.length - 1].date).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateAssetModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    assetId: '',
    assetName: '',
    assetType: 'Other',
    location: {
      building: '',
      floor: '',
      room: ''
    },
    purchaseDate: '',
    warrantyExpiry: '',
    maintenanceFrequency: 'monthly',
    status: 'active'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.assetId.trim()) {
      alert('Please enter an Asset ID');
      return;
    }
    if (!formData.assetName.trim()) {
      alert('Please enter an Asset Name');
      return;
    }
    if (!formData.location.building.trim()) {
      alert('Please enter a Building');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add New Asset</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset ID *</label>
              <input
                type="text"
                required
                value={formData.assetId}
                onChange={(e) => setFormData({...formData, assetId: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., AC001, GEN001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name *</label>
              <input
                type="text"
                required
                value={formData.assetName}
                onChange={(e) => setFormData({...formData, assetName: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Main Campus Generator"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
              <select
                value={formData.assetType}
                onChange={(e) => setFormData({...formData, assetType: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="HVAC">HVAC</option>
                <option value="Generator">Generator</option>
                <option value="Elevator">Elevator</option>
                <option value="Fire Safety">Fire Safety</option>
                <option value="Security System">Security System</option>
                <option value="IT Equipment">IT Equipment</option>
                <option value="Furniture">Furniture</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="repair">Under Repair</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Building *</label>
              <input
                type="text"
                required
                value={formData.location.building}
                onChange={(e) => setFormData({
                  ...formData, 
                  location: {...formData.location, building: e.target.value}
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Main Building"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
              <input
                type="text"
                value={formData.location.floor}
                onChange={(e) => setFormData({
                  ...formData, 
                  location: {...formData.location, floor: e.target.value}
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Ground Floor"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <input
                type="text"
                value={formData.location.room}
                onChange={(e) => setFormData({
                  ...formData, 
                  location: {...formData.location, room: e.target.value}
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Generator Room"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
              <input
                type="date"
                value={formData.warrantyExpiry}
                onChange={(e) => setFormData({...formData, warrantyExpiry: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Frequency</label>
            <select
              value={formData.maintenanceFrequency}
              onChange={(e) => setFormData({...formData, maintenanceFrequency: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semi-annually">Semi-Annually</option>
              <option value="annually">Annually</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MaintenanceHistoryModal({ asset, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Maintenance History - {asset.assetName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Asset ID</div>
              <div className="font-medium">{asset.assetId}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Type</div>
              <div className="font-medium">{asset.assetType}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className="font-medium capitalize">{asset.status}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Location</div>
              <div className="font-medium">{asset.location?.building}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {asset.maintenanceHistory && asset.maintenanceHistory.length > 0 ? (
            asset.maintenanceHistory.map((maintenance, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{new Date(maintenance.date).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      maintenance.type === 'emergency' ? 'bg-red-100 text-red-800' :
                      maintenance.type === 'repair' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {maintenance.type}
                    </span>
                  </div>
                  {maintenance.cost && (
                    <span className="font-medium text-green-600">₹{maintenance.cost.toLocaleString()}</span>
                  )}
                </div>
                <p className="text-gray-700 mb-2">{maintenance.description}</p>
                {maintenance.performedBy && (
                  <p className="text-sm text-gray-500">Performed by: {maintenance.performedBy}</p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>No maintenance history available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddMaintenanceModal({ asset, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'routine',
    description: '',
    cost: '',
    performedBy: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      alert('Please enter a description');
      return;
    }
    if (!formData.performedBy.trim()) {
      alert('Please enter who performed the maintenance');
      return;
    }

    const maintenanceData = {
      ...formData,
      cost: formData.cost ? parseFloat(formData.cost) : 0
    };

    onSubmit(maintenanceData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add Maintenance Record</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-800">{asset.assetName}</h3>
          <p className="text-sm text-gray-600">Asset ID: {asset.assetId}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="routine">Routine</option>
                <option value="repair">Repair</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Describe the maintenance work performed..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Performed By *</label>
              <input
                type="text"
                required
                value={formData.performedBy}
                onChange={(e) => setFormData({...formData, performedBy: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Technician/Company name"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add Maintenance Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
