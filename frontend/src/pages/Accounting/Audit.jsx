import { useEffect, useState } from "react";

export default function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uniqueActions, setUniqueActions] = useState([]);

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.append('action', actionFilter);
    if (searchTerm) params.append('search', searchTerm);

    const res = await fetch(`/api/audit?${params.toString()}`);
    const data = await res.json();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    // Fetch unique actions for the filter dropdown only once
    const fetchActions = async () => {
      const res = await fetch("/api/audit/stats/overview");
      const data = await res.json();
      if(data.actionStats) {
        setUniqueActions(data.actionStats.map(stat => stat._id));
      }
    };
    fetchActions();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, searchTerm]);

  // CSV download helper
  const downloadCSV = () => {
    if (!logs.length) return;
    const headers = [
      'Action', 'Entity Type', 'Entity ID', 'User', 'Details', 'Timestamp'
    ];
    const rows = logs.map(log => [
      log.action,
      log.entityType,
      log.entityId,
      log.user || '-',
      log.details || '-',
      log.timestamp ? new Date(log.timestamp).toLocaleString() : ''
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📝 Audit Log</h1>
      <div className="flex flex-wrap items-center gap-4 mb-2 bg-white p-4 rounded shadow">
        <input
          type="text"
          placeholder="Search logs..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="p-2 border rounded w-full md:w-1/3"
        />
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Actions</option>
          {uniqueActions.map(action => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
        >
          Refresh
        </button>
        <button
          onClick={downloadCSV}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow"
        >
          Download CSV
        </button>
      </div>
      <div className="overflow-x-auto shadow rounded bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Action</th>
              <th className="p-3">Entity Type</th>
              <th className="p-3">Entity ID</th>
              <th className="p-3">User</th>
              <th className="p-3">Details</th>
              <th className="p-3">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-400">No audit logs found.</td></tr>
            ) : logs.map(log => (
              <tr key={log._id} className="border-t">
                <td className="p-3">{log.action}</td>
                <td className="p-3">{log.entityType}</td>
                <td className="p-3">{log.entityId}</td>
                <td className="p-3">{log.user || '-'}</td>
                <td className="p-3">{log.details || '-'}</td>
                <td className="p-3">{log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
