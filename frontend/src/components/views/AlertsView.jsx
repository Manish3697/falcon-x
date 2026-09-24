import React, { useState, useEffect } from 'react';
import { ShieldAlert, Filter, Download, Check, RefreshCw, AlertTriangle, Eye, X } from 'lucide-react';
import { api } from '../../services/api';
import { SeverityBadge, RiskBadge } from '../common/Badge';
import { exportToCSV } from '../../utils/exportUtils';

export const AlertsView = () => {
  const [alerts, setAlerts] = useState([]);
  const [counts, setCounts] = useState({ open: 0, acknowledged: 0, resolved: 0, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts({
        status: statusFilter,
        severity: severityFilter,
        limit: 100
      });
      if (data.alerts) {
        setAlerts(data.alerts);
        setCounts({
          open: data.open_count || 0,
          acknowledged: data.acknowledged_count || 0,
          resolved: data.resolved_count || 0,
          total: data.total_count || 0
        });
      }
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, [statusFilter, severityFilter]);

  const handleStatusChange = async (alertId, newStatus) => {
    try {
      await api.updateAlertStatus(alertId, newStatus);
      fetchAlerts();
      if (selectedAlert?.id === alertId) {
        setSelectedAlert(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Failed to update alert status", err);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'device_ip', label: 'Device IP' },
      { key: 'mac_address', label: 'MAC Address' },
      { key: 'threat_type', label: 'Threat Type' },
      { key: 'risk_score', label: 'Risk Score' },
      { key: 'severity', label: 'Severity' },
      { key: 'action', label: 'Action Taken' },
      { key: 'status', label: 'Alert Status' },
      { key: 'evidence', label: 'Detection Evidence' }
    ];
    exportToCSV('falconx_security_alerts', alerts, headers);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header & Export */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Security Alert Management & Incident Triage
            </h2>
          </div>
          <p className="text-xs font-mono text-falcon-textDim mt-0.5">
            Deterministic Heuristic Threat Signals • Operational Incident Queue
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
            onClick={fetchAlerts}
            className="p-1.5 rounded bg-falcon-surface border border-falcon-border hover:border-falcon-borderLight text-falcon-textMuted hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <button
          onClick={() => setStatusFilter('')}
          className={`p-3 rounded border text-left transition-colors ${
            statusFilter === '' ? 'bg-falcon-card border-falcon-accent' : 'bg-falcon-surface border-falcon-border/60'
          }`}
        >
          <span className="text-[10px] text-falcon-textDim block">TOTAL ALERTS</span>
          <span className="text-base font-bold text-white">{counts.total}</span>
        </button>

        <button
          onClick={() => setStatusFilter('OPEN')}
          className={`p-3 rounded border text-left transition-colors ${
            statusFilter === 'OPEN' ? 'bg-red-950/40 border-red-500' : 'bg-falcon-surface border-falcon-border/60'
          }`}
        >
          <span className="text-[10px] text-falcon-textDim block">OPEN (PENDING)</span>
          <span className="text-base font-bold text-red-400">{counts.open}</span>
        </button>

        <button
          onClick={() => setStatusFilter('ACKNOWLEDGED')}
          className={`p-3 rounded border text-left transition-colors ${
            statusFilter === 'ACKNOWLEDGED' ? 'bg-yellow-950/40 border-yellow-500' : 'bg-falcon-surface border-falcon-border/60'
          }`}
        >
          <span className="text-[10px] text-falcon-textDim block">ACKNOWLEDGED</span>
          <span className="text-base font-bold text-yellow-400">{counts.acknowledged}</span>
        </button>

        <button
          onClick={() => setStatusFilter('RESOLVED')}
          className={`p-3 rounded border text-left transition-colors ${
            statusFilter === 'RESOLVED' ? 'bg-emerald-950/40 border-emerald-500' : 'bg-falcon-surface border-falcon-border/60'
          }`}
        >
          <span className="text-[10px] text-falcon-textDim block">RESOLVED</span>
          <span className="text-base font-bold text-emerald-400">{counts.resolved}</span>
        </button>
      </div>

      {/* Severity Filter */}
      <div className="bg-falcon-surface border border-falcon-border rounded-lg p-3 flex items-center space-x-3 text-xs font-mono">
        <span className="text-[10px] text-falcon-textDim uppercase">Filter Severity:</span>
        {['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`px-2.5 py-1 rounded transition-colors ${
              severityFilter === sev
                ? 'bg-falcon-card border border-falcon-accent text-white font-bold'
                : 'text-falcon-textDim hover:text-white'
            }`}
          >
            {sev || 'ALL SEVERITIES'}
          </button>
        ))}
      </div>

      {/* Alerts Table (Section 9) */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-falcon-surface border-b border-falcon-border text-falcon-textDim uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Device IP</th>
                <th className="py-2.5 px-3">MAC Address</th>
                <th className="py-2.5 px-3">Threat</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-falcon-border/40 text-falcon-textMuted">
              {alerts.length > 0 ? (
                alerts.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedAlert(a)}
                    className="hover:bg-falcon-surface/60 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3 text-white font-mono">{a.timestamp?.split(' ')[1] || a.timestamp}</td>
                    <td className="py-2.5 px-3 text-white font-bold">{a.device_ip}</td>
                    <td className="py-2.5 px-3 text-falcon-textDim">{a.mac_address || '—'}</td>
                    <td className="py-2.5 px-3 text-white font-semibold">{a.threat_type}</td>
                    <td className="py-2.5 px-3">
                      <RiskBadge score={a.risk_score} />
                    </td>
                    <td className="py-2.5 px-3">
                      <SeverityBadge severity={a.severity} />
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.action === 'BLOCKED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-700/50 text-slate-300'
                      }`}>
                        {a.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.status === 'OPEN' ? 'text-red-400 bg-red-500/10' :
                        a.status === 'ACKNOWLEDGED' ? 'text-yellow-400 bg-yellow-500/10' :
                        'text-emerald-400 bg-emerald-500/10'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        {a.status !== 'RESOLVED' && (
                          <button
                            onClick={() => handleStatusChange(a.id, 'RESOLVED')}
                            className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 hover:bg-emerald-900 text-[10px]"
                            title="Mark Resolved"
                          >
                            Resolve
                          </button>
                        )}
                        {a.status === 'OPEN' && (
                          <button
                            onClick={() => handleStatusChange(a.id, 'ACKNOWLEDGED')}
                            className="px-2 py-1 rounded bg-yellow-950/80 border border-yellow-600/50 text-yellow-300 hover:bg-yellow-900 text-[10px]"
                            title="Acknowledge"
                          >
                            Ack
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-falcon-textDim font-mono">
                    No alerts matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Details Modal (Section 28) */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-falcon-card border border-falcon-border rounded-lg max-w-lg w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedAlert(null)}
              className="absolute top-4 right-4 text-falcon-textMuted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 border-b border-falcon-border/60 pb-3 mb-4">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <h3 className="text-sm font-bold font-mono text-white uppercase">
                Alert Incident #{selectedAlert.id} Details
              </h3>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 bg-falcon-surface p-3 rounded border border-falcon-border/50">
                <div>
                  <span className="text-falcon-textDim block text-[10px]">HOST IP / MAC</span>
                  <span className="text-white font-bold">{selectedAlert.device_ip}</span>
                  <span className="text-falcon-textDim block text-[10px]">{selectedAlert.mac_address}</span>
                </div>
                <div>
                  <span className="text-falcon-textDim block text-[10px]">DETECTION TIME</span>
                  <span className="text-white">{selectedAlert.timestamp}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-falcon-surface p-2.5 rounded border border-falcon-border/50">
                <div>
                  <span className="text-falcon-textDim block text-[10px]">THREAT</span>
                  <span className="text-white font-bold">{selectedAlert.threat_type}</span>
                </div>
                <div>
                  <span className="text-falcon-textDim block text-[10px]">RISK SCORE</span>
                  <span className="text-orange-400 font-bold">{selectedAlert.risk_score} / 10</span>
                </div>
                <div>
                  <span className="text-falcon-textDim block text-[10px]">SEVERITY</span>
                  <SeverityBadge severity={selectedAlert.severity} />
                </div>
              </div>

              <div className="p-3 rounded bg-falcon-surface border border-falcon-border/50 space-y-1">
                <span className="text-falcon-textDim block text-[10px] uppercase font-bold">Heuristic Evidence</span>
                <p className="text-falcon-textMuted text-[11px] leading-relaxed">
                  {selectedAlert.evidence || selectedAlert.message}
                </p>
              </div>

              <div className="p-3 rounded bg-falcon-surface border border-falcon-border/50 flex justify-between items-center">
                <div>
                  <span className="text-falcon-textDim block text-[10px] uppercase font-bold">Action Taken</span>
                  <span className="text-white font-bold">{selectedAlert.action}</span>
                </div>
                <div>
                  <span className="text-falcon-textDim block text-[10px] uppercase font-bold">Current Status</span>
                  <span className="text-falcon-accentLight font-bold">{selectedAlert.status}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-falcon-border/60 flex items-center justify-between">
              <div className="flex space-x-2">
                {selectedAlert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleStatusChange(selectedAlert.id, 'RESOLVED')}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs font-mono"
                  >
                    Mark Resolved
                  </button>
                )}
                {selectedAlert.status === 'OPEN' && (
                  <button
                    onClick={() => handleStatusChange(selectedAlert.id, 'ACKNOWLEDGED')}
                    className="px-3 py-1.5 rounded bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-xs font-mono"
                  >
                    Acknowledge
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedAlert(null)}
                className="px-3 py-1.5 rounded bg-falcon-surface border border-falcon-border hover:border-falcon-borderLight text-xs font-mono text-falcon-textMuted hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
