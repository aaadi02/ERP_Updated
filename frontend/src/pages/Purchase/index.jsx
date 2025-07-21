import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Building, 
  BarChart3, 
  Settings, 
  FileText,
  Package,
  TrendingUp,
  Users
} from 'lucide-react';
import PurchaseDashboard from './PurchaseDashboard';
import PurchaseOrderForm from './PurchaseOrderForm';
import PurchaseOrderDetails from './PurchaseOrderDetails';
import DepartmentManagement from './DepartmentManagement';

const PurchaseModule = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [editOrderId, setEditOrderId] = useState(null);

  const navigation = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: BarChart3,
      description: 'Overview of purchase orders and analytics'
    },
    {
      id: 'new-order',
      name: 'New Purchase Order',
      icon: ShoppingCart,
      description: 'Create new purchase order'
    },
    {
      id: 'departments',
      name: 'Department Management',
      icon: Building,
      description: 'Manage departments and purchase authorities'
    },
    {
      id: 'analytics',
      name: 'Advanced Analytics',
      icon: TrendingUp,
      description: 'Detailed purchase analytics and reports'
    }
  ];

  const handleViewOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setActiveView('view-order');
  };

  const handleEditOrder = (orderId) => {
    setEditOrderId(orderId);
    setActiveView('edit-order');
  };

  const handleOrderSaved = () => {
    setActiveView('dashboard');
    setEditOrderId(null);
    setSelectedOrderId(null);
  };

  const handleCloseOrder = () => {
    setActiveView('dashboard');
    setEditOrderId(null);
    setSelectedOrderId(null);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <PurchaseDashboard 
            onViewOrder={handleViewOrder}
            onEditOrder={handleEditOrder}
          />
        );
      
      case 'new-order':
        return (
          <PurchaseOrderForm 
            onClose={handleCloseOrder}
            onSave={handleOrderSaved}
          />
        );
      
      case 'edit-order':
        return (
          <PurchaseOrderForm 
            orderId={editOrderId}
            onClose={handleCloseOrder}
            onSave={handleOrderSaved}
          />
        );
      
      case 'view-order':
        return (
          <PurchaseOrderDetails 
            orderId={selectedOrderId}
            onClose={handleCloseOrder}
            onEdit={handleEditOrder}
          />
        );
      
      case 'departments':
        return <DepartmentManagement />;
      
      case 'analytics':
        return <PurchaseAnalytics />;
      
      default:
        return (
          <PurchaseDashboard 
            onViewOrder={handleViewOrder}
            onEditOrder={handleEditOrder}
          />
        );
    }
  };

  // Show full content for specific views
  if (['new-order', 'edit-order', 'view-order', 'departments', 'analytics'].includes(activeView)) {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="text-blue-600" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SmartProcure - Advanced Purchase Management System</h1>
                <p className="text-gray-600">Intelligent Department & Institute Level Procurement Control Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Session</p>
                <p className="font-medium text-gray-900">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`p-6 rounded-xl border transition-all duration-200 text-left ${
                  isActive 
                    ? 'bg-blue-50 border-blue-200 shadow-md' 
                    : 'bg-white border-gray-200 hover:shadow-lg hover:border-gray-300'
                }`}
              >
                <div className="flex items-center mb-3">
                  <div className={`p-3 rounded-lg ${
                    isActive ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon 
                      size={24} 
                      className={isActive ? 'text-blue-600' : 'text-gray-600'} 
                    />
                  </div>
                </div>
                <h3 className={`font-semibold mb-2 ${
                  isActive ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {item.name}
                </h3>
                <p className={`text-sm ${
                  isActive ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Placeholder for Advanced Analytics component
const PurchaseAnalytics = () => {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <TrendingUp size={64} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Advanced Analytics</h2>
        <p className="text-gray-600 mb-6">
          Comprehensive purchase analytics and reporting dashboard
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <BarChart3 className="text-blue-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">Spending Analytics</h3>
            <p className="text-sm text-gray-600">Department-wise spending analysis and trends</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <FileText className="text-green-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">Custom Reports</h3>
            <p className="text-sm text-gray-600">Generate detailed purchase reports</p>
          </div>
          <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <Users className="text-purple-600 mb-3" size={32} />
            <h3 className="font-semibold text-gray-900 mb-2">User Analytics</h3>
            <p className="text-sm text-gray-600">Track user activity and approval patterns</p>
          </div>
        </div>
        <div className="mt-8">
          <p className="text-gray-500">Coming soon - Advanced analytics dashboard with interactive charts and detailed insights</p>
        </div>
      </div>
    </div>
  );      																						
};

export default PurchaseModule;
