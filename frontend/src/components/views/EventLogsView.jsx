import React, { useState, useEffect } from 'react';
import { FileText, Search, Download, Filter, RefreshCw, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { SeverityBadge, RiskBadge } from '../common/Badge';
import { exportToCSV } from '../../utils/exportUtils';

export const EventLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getLogs({
        search,
        event_type: eventTypeFilter,
        severity: severityFilter,
        limit: 150
      });
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [search, eventTypeFilter, severityFilter]);

  const handleExportCSV = () => {
    const headers = [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'event_type', label: 'Event Type' },
      { key: 'device', label: 'Device / Target' },
      { key: 'threat', label: 'Threat' },
      { key: 'risk', label: 'Risk Score' },
      { key: 'action', label: 'Action Taken' },
      { key: 'result', label: 'Result' },
      { key: 'message', label: 'Audit Message' },
      { key: 'severity', label: 'Severity' }
    ];
    exportToCSV('falconx_audit_event_logs', logs, headers);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header & Export */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-falcon-accentLight" />
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Immutable Edge Event Logs & Audit Trail
            </h2>
          </div>
          <p className="text-xs font-mono text-falcon-textDim mt-0.5">
            Local SQLite Event Store • Hardware-Isolated Incident Recording
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-falcon-surface border border-falcon-border hover:border-falcon-borderLight text-xs font-mono text-falcon-textMuted hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchLogs}
            className="p-1.5 rounded bg-falcon-surface border border-falcon-border hover:border-falcon-borderLight text-falcon-textMuted hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar (Section 18) */}
      <div className="bg-falcon-surface border border-falcon-border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-falcon-textDim" />
          <input
            type="text"
            placeholder="Search audit messages, devices, actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-falcon-card border border-falcon-border rounded pl-8 pr-3 py-1.5 text-white placeholder-falcon-textDim focus:outline-none focus:border-falcon-accent"
          />
        </div>

        <div>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="w-full bg-falcon-card border border-falcon-border rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
          >
            <option value="">All Event Types</option>
            <option value="DEVICE_DISCOVERED">DEVICE_DISCOVERED</option>
            <option value="THREAT_DETECTED">THREAT_DETECTED</option>
            <option value="RISK_UPDATED">RISK_UPDATED</option>
            <option value="ALERT_CREATED">ALERT_CREATED</option>
            <option value="HOST_BLOCKED">HOST_BLOCKED</option>
            <option value="HOST_UNBLOCKED">HOST_UNBLOCKED</option>
            <option value="RULE_CREATED">RULE_CREATED</option>
            <option value="RULE_REMOVED">RULE_REMOVED</option>
            <option value="SYSTEM_STARTED">SYSTEM_STARTED</option>
            <option value="CAPTURE_STARTED">CAPTURE_STARTED</option>
            <option value="CAPTURE_STOPPED">CAPTURE_STOPPED</option>
          </select>
        </div>

        <div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full bg-falcon-card border border-falcon-border rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
          >
            <option value="">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-falcon-surface border-b border-falcon-border text-falcon-textDim uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Target / Device</th>
                <th className="py-2.5 px-3">Threat Context</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Result</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-falcon-border/40 text-falcon-textMuted">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-falcon-surface/50 transition-colors">
                    <td className="py-2 px-3 text-white font-mono whitespace-nowrap">
                      {log.timestamp?.split(' ')[1] || log.timestamp}
                    </td>
                    <td className="py-2 px-3 font-semibold text-falcon-accentLight whitespace-nowrap">
                      {log.event_type}
                    </td>
                    <td className="py-2 px-3 text-white font-mono">{log.device || 'SYSTEM'}</td>
                    <td className="py-2 px-3 text-falcon-textDim">{log.threat || '—'}</td>
                    <td className="py-2 px-3">
                      {log.risk ? <RiskBadge score={log.risk} /> : '—'}
                    </td>
                    <td className="py-2 px-3 text-falcon-textMain font-mono">{log.action || '—'}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.result === 'SUCCESS' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                      }`}>
                        {log.result || 'OK'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <SeverityBadge severity={log.severity || 'INFO'} />
                    </td>
                    <td className="py-2 px-3 text-falcon-textDim max-w-sm truncate" title={log.message}>
                      {log.message}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-falcon-textDim font-mono">
                    No logs found matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
