import React, { useState, useEffect } from 'react';
import dataSyncManager from '../utils/dataSyncManager';

const SystemStatus = () => {
  const [status, setStatus] = useState({
    backend: 'checking',
    database: 'checking',
    sync: 'checking',
    lastUpdated: null
  });
  const [healthScore, setHealthScore] = useState(0);

  useEffect(() => {
    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check backend health
      const response = await fetch('http://localhost:5000/api/faculty/status');
      const backendStatus = response.ok ? 'healthy' : 'error';
      const databaseStatus = response.ok ? 'connected' : 'disconnected';
      
      // Check data sync health
      const syncHealth = await dataSyncManager.getSystemHealth();
      const syncStatus = syncHealth.score >= 90 ? 'synced' : syncHealth.score >= 50 ? 'partial' : 'error';
      
      setStatus({
        backend: backendStatus,
        database: databaseStatus,
        sync: syncStatus,
        lastUpdated: new Date().toLocaleTimeString()
      });
      
      setHealthScore(syncHealth.score);
    } catch (error) {
      setStatus({
        backend: 'offline',
        database: 'disconnected',
        sync: 'error',
        lastUpdated: new Date().toLocaleTimeString()
      });
      setHealthScore(0);
    }
  };

  const handleFullSync = async () => {
    setStatus(prev => ({ ...prev, sync: 'syncing' }));
    const result = await dataSyncManager.performFullSync();
    
    if (result.success) {
      setStatus(prev => ({ ...prev, sync: 'synced' }));
      await checkSystemStatus(); // Refresh status
    } else {
      setStatus(prev => ({ ...prev, sync: 'error' }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'synced':
        return 'text-green-600 bg-green-50';
      case 'checking':
      case 'syncing':
        return 'text-yellow-600 bg-yellow-50';
      case 'partial':
        return 'text-orange-600 bg-orange-50';
      case 'error':
      case 'offline':
      case 'disconnected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'synced':
        return '✅';
      case 'checking':
      case 'syncing':
        return '🔄';
      case 'partial':
        return '⚠️';
      case 'error':
      case 'offline':
      case 'disconnected':
        return '❌';
      default:
        return '❓';
    }
  };

  const getOverallStatus = () => {
    if (status.backend === 'healthy' && status.database === 'connected' && status.sync === 'synced') {
      return { text: 'All Systems Operational', color: 'text-green-600' };
    } else if (status.backend === 'offline') {
      return { text: 'Backend Offline', color: 'text-red-600' };
    } else if (status.database === 'disconnected') {
      return { text: 'Database Issues', color: 'text-red-600' };
    } else if (status.sync === 'error') {
      return { text: 'Sync Issues', color: 'text-orange-600' };
    } else {
      return { text: 'System Checking...', color: 'text-yellow-600' };
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="bg-gradient-to-r from-white via-blue-50 to-purple-50 rounded-2xl shadow-xl p-6 mb-6 border border-blue-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <span className="text-3xl">🖥️</span>
          System Health Monitor
        </h3>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-full text-sm font-bold ${overallStatus.color} bg-white shadow-md border`}>
            {overallStatus.text}
          </div>
          <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-lg shadow-sm">
            Last: {status.lastUpdated || 'Never'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <ModernStatusCard
          title="Backend API"
          status={status.backend}
          icon={getStatusIcon(status.backend)}
          color={getStatusColor(status.backend)}
        />
        
        <ModernStatusCard
          title="Database"
          status={status.database}
          icon={getStatusIcon(status.database)}
          color={getStatusColor(status.database)}
        />

        <ModernStatusCard
          title="Data Sync"
          status={status.sync}
          icon={getStatusIcon(status.sync)}
          color={getStatusColor(status.sync)}
        />

        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📊</span>
            <div>
              <p className="font-bold text-white">Health Score</p>
              <p className="text-2xl font-bold">{healthScore}%</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500" 
                style={{ width: `${healthScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={checkSystemStatus}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
        >
          <span className="animate-spin">🔄</span>
          Refresh Status
        </button>
        {status.sync !== 'synced' && status.sync !== 'syncing' && (
          <button
            onClick={handleFullSync}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
          >
            <span className="animate-pulse">🔄</span>
            Force Sync All Modules
          </button>
        )}
      </div>
    </div>
  );
};

function ModernStatusCard({ title, status, icon, color }) {
  return (
    <div className={`rounded-xl p-4 border transition-all duration-300 hover:scale-105 hover:shadow-lg ${color}`}>
      <div className="flex items-center space-x-3">
        <span className="text-2xl animate-pulse">{icon}</span>
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm capitalize font-semibold">{status}</p>
        </div>
      </div>
    </div>
  );
}

export default SystemStatus;
