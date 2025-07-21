import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TestTicketCreation from '../../components/TestTicketCreation';
import AssetManagement from './AssetManagement';

const API_BASE_URL = 'http://localhost:5000/api/maintenance';

export default function MaintenancePage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [scheduledItems, setScheduledItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateTicket, setShowCreateTicket] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchTickets();
    fetchScheduledMaintenance();
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

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tickets?limit=10`);
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const fetchScheduledMaintenance = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/scheduled`);
      const data = await response.json();
      setScheduledItems(data.scheduled || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching scheduled maintenance:', error);
      setLoading(false);
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        fetchTickets();
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading maintenance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <span className="text-4xl">🔧</span>
            MaintenancePro - Smart Facility Management System
          </h1>
          <p className="text-gray-600">Intelligent facility maintenance with predictive analytics and automated workflows</p>
        </div>

        {/* Debug Component - Remove in production */}
        <TestTicketCreation />

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-lg">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'tickets', label: 'Tickets', icon: '🎫' },
              { id: 'scheduled', label: 'Scheduled', icon: '📅' },
              { id: 'assets', label: 'Assets', icon: '🏢' },
              { id: 'budget', label: 'Budget', icon: '💰' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-md'
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
                title="Open Tickets"
                value={dashboardData.statistics.openTickets}
                icon="🎫"
                color="from-orange-500 to-red-600"
                trend={`${dashboardData.statistics.totalTickets} total`}
              />
              <StatCard
                title="In Progress"
                value={dashboardData.statistics.inProgressTickets}
                icon="⚙️"
                color="from-blue-500 to-indigo-600"
                trend="Active work"
              />
              <StatCard
                title="Completed Today"
                value={dashboardData.statistics.completedToday}
                icon="✅"
                color="from-green-500 to-emerald-600"
                trend="Today's progress"
              />
              <StatCard
                title="Budget Utilization"
                value={`${dashboardData.statistics.budgetUtilization}%`}
                icon="💰"
                color="from-purple-500 to-violet-600"
                trend={`₹${dashboardData.statistics.monthlySpentTotal.toLocaleString()} spent`}
              />
            </div>

            {/* Category and Priority Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Tickets by Category
                </h3>
                <div className="space-y-3">
                  {dashboardData.categoryStats.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{category._id}</span>
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {category.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🎯</span>
                  Priority Distribution
                </h3>
                <div className="space-y-3">
                  {dashboardData.priorityStats.map((priority, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${getPriorityDot(priority._id)}`}></span>
                        <span className="font-medium capitalize">{priority._id}</span>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {priority.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <QuickAction
                  title="Create Ticket"
                  description="Report new maintenance issue"
                  icon="🎫"
                  onClick={() => setShowCreateTicket(true)}
                />
                <QuickAction
                  title="Emergency Alert"
                  description="Report urgent maintenance issue"
                  icon="🚨"
                  onClick={() => alert('Emergency alert feature coming soon!')}
                />
                <QuickAction
                  title="Schedule Maintenance"
                  description="Plan routine maintenance"
                  icon="📅"
                  onClick={() => setActiveTab('scheduled')}
                />
                <QuickAction
                  title="View Assets"
                  description="Manage facility assets"
                  icon="🏢"
                  onClick={() => setActiveTab('assets')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Maintenance Tickets</h2>
              <button
                onClick={() => setShowCreateTicket(true)}
                className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <span>➕</span>
                Create Ticket
              </button>
            </div>
            
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <TicketCard
                  key={ticket._id}
                  ticket={ticket}
                  onStatusUpdate={updateTicketStatus}
                />
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Tab */}
        {activeTab === 'scheduled' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Scheduled Maintenance</h2>
            <div className="grid gap-4">
              {scheduledItems.map((item) => (
                <ScheduledMaintenanceCard key={item._id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <AssetManagement />
        )}

        {activeTab === 'budget' && dashboardData && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Budget Overview</h2>
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    ₹{dashboardData.statistics.monthlyBudgetTotal.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Monthly Allocated</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    ₹{dashboardData.statistics.monthlySpentTotal.toLocaleString()}
                  </div>
                  <div className="text-gray-600">Amount Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    ₹{(dashboardData.statistics.monthlyBudgetTotal - dashboardData.statistics.monthlySpentTotal).toLocaleString()}
                  </div>
                  <div className="text-gray-600">Remaining</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Ticket Modal */}
        {showCreateTicket && (
          <CreateTicketModal
            onClose={() => setShowCreateTicket(false)}
            onSuccess={() => {
              setShowCreateTicket(false);
              fetchTickets();
              fetchDashboardData();
            }}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, trend }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-xl`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-3xl">{icon}</div>
      </div>
      <div className="text-sm opacity-80 font-medium">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {trend && <div className="text-xs opacity-70 mt-1">{trend}</div>}
    </div>
  );
}

function TicketCard({ ticket, onStatusUpdate }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-700';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-700';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      case 'low': return 'border-green-500 bg-green-50 text-green-700';
      default: return 'border-gray-500 bg-gray-50 text-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-800">{ticket.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
              {ticket.status}
            </span>
          </div>
          <p className="text-gray-600 mb-2">{ticket.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>📍 {ticket.location.building} - {ticket.location.room}</span>
            <span>👤 {ticket.reportedBy.name}</span>
            <span>🏷️ {ticket.category}</span>
            {ticket.estimatedCost > 0 && <span>💰 ₹{ticket.estimatedCost.toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {ticket.status === 'open' && (
            <button
              onClick={() => onStatusUpdate(ticket._id, 'in-progress')}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Start
            </button>
          )}
          {ticket.status === 'in-progress' && (
            <button
              onClick={() => onStatusUpdate(ticket._id, 'completed')}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
            >
              Complete
            </button>
          )}
        </div>
      </div>
      {ticket.workLog && ticket.workLog.length > 0 && (
        <div className="border-t pt-3">
          <div className="text-sm text-gray-600">
            Latest Update: {ticket.workLog[ticket.workLog.length - 1].workDone}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduledMaintenanceCard({ item }) {
  const getFrequencyColor = (frequency) => {
    switch (frequency) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-orange-100 text-orange-800';
      case 'quarterly': return 'bg-purple-100 text-purple-800';
      case 'annually': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getFrequencyColor(item.frequency)}`}>
              {item.frequency}
            </span>
          </div>
          <p className="text-gray-600 mb-2">{item.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>📍 {item.location.building}</span>
            <span>👥 {item.assignedTeam}</span>
            <span>🏷️ {item.category}</span>
            <span>⏱️ {item.estimatedDuration}h</span>
            <span>💰 ₹{item.estimatedCost.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-800">
            Next: {new Date(item.nextScheduledDate).toLocaleDateString()}
          </div>
          {item.lastCompletedDate && (
            <div className="text-xs text-gray-500">
              Last: {new Date(item.lastCompletedDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, description, icon, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-colors cursor-pointer group"
    >
      <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm opacity-80">{description}</p>
    </div>
  );
}

function CreateTicketModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    priority: 'medium',
    location: {
      building: '',
      floor: '',
      room: '',
      area: ''
    },
    reportedBy: {
      name: '',
      email: '',
      phone: '',
      department: ''
    },
    estimatedCost: 0
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!formData.description.trim()) {
      alert('Please enter a description');
      return;
    }
    if (!formData.location.building.trim()) {
      alert('Please enter a building');
      return;
    }
    if (!formData.reportedBy.name.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      console.log('Submitting ticket data:', formData);
      
      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Ticket created successfully:', result);
        alert(`Ticket created successfully! Ticket ID: ${result.ticket.ticketId || 'Generated'}`);
        onSuccess();
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert(`Error creating ticket: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network error creating ticket:', error);
      alert(`Network error creating ticket: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Maintenance Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Brief description of the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows="3"
              placeholder="Detailed description of the issue"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="HVAC">HVAC</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
                <option value="Safety">Safety</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Security">Security</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
              <input
                type="text"
                required
                value={formData.location.building}
                onChange={(e) => setFormData({
                  ...formData, 
                  location: {...formData.location, building: e.target.value}
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Main Building"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room/Area</label>
              <input
                type="text"
                value={formData.location.room}
                onChange={(e) => setFormData({
                  ...formData, 
                  location: {...formData.location, room: e.target.value}
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="e.g., Room 101"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reported By</label>
              <input
                type="text"
                required
                value={formData.reportedBy.name}
                onChange={(e) => setFormData({
                  ...formData, 
                  reportedBy: {...formData.reportedBy, name: e.target.value}
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.reportedBy.department}
                onChange={(e) => setFormData({
                  ...formData, 
                  reportedBy: {...formData.reportedBy, department: e.target.value}
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Your department"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (Optional)</label>
            <input
              type="number"
              value={formData.estimatedCost}
              onChange={(e) => setFormData({...formData, estimatedCost: parseInt(e.target.value) || 0})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="0"
            />
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
              className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Create Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const getPriorityDot = (priority) => {
  switch (priority) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};
