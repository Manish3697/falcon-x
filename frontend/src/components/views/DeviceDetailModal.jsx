import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Network, 
  Lock, 
  Unlock, 
  Radio,
  Server,
  Layers
} from 'lucide-react';
import { api } from '../../services/api';
import { SeverityBadge, StatusBadge, RiskBadge } from '../common/Badge';
import { RiskGauge } from '../common/RiskGauge';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { formatBytes, formatBitrate } from '../../utils/formatters';

export const DeviceDetailModal = ({ deviceId, onClose, onRefresh }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState(null); // 'BLOCK' or 'UNBLOCK'

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.getDeviceDetail(deviceId);
      setData(res);
    } catch (err) {
      console.error("Failed to load device detail", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deviceId) {
      fetchDetail();
    }
  }, [deviceId]);

  const handleAction = async (actionType) => {
    try {
      await api.deviceAction(deviceId, actionType, `Manual ${actionType} triggered from Device Profile`);
      fetchDetail();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(`Failed to execute ${actionType}`, err);
    }
  };

  if (!deviceId) return null;

  const dev = data?.device;
  const isBlocked = data?.is_blocked || dev?.status === 'BLOCKED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-falcon-card border border-falcon-border rounded-lg max-w-4xl w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-falcon-textMuted hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {loading || !dev ? (
          <div className="py-16 text-center text-xs font-mono text-falcon-textDim">
            Loading host security profile...
          </div>
        ) : (
          <div className="space-y-6 text-xs font-mono">
            {/* Header Identity Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-falcon-border/60 pb-4 gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">{dev.ip}</h2>
                  <StatusBadge status={dev.status} />
                  <span className="text-falcon-textDim">({dev.device_type})</span>
                </div>
                <p className="text-falcon-textDim text-[11px] mt-0.5">
                  MAC: {dev.mac} • Hostname: {dev.hostname || 'None'} • Vendor: {dev.vendor}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                {isBlocked ? (
                  <button
                    onClick={() => setConfirmAction('UNBLOCK')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unblock Host</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmAction('BLOCK')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Block Host (nftables)</span>
                  </button>
                )}

                <button
                  onClick={() => handleAction('MONITOR')}
                  className="px-3 py-1.5 rounded bg-falcon-surface border border-falcon-border hover:border-falcon-borderLight text-falcon-textMuted hover:text-white transition-colors"
                >
                  Baseline
                </button>
              </div>
            </div>

            {/* Grid 1: Identity & Real-time Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Traffic Stats */}
              <div className="bg-falcon-surface p-4 rounded border border-falcon-border/60 space-y-2">
                <span className="text-falcon-textDim text-[10px] uppercase font-bold block border-b border-falcon-border/40 pb-1">
                  Traffic Telemetry
                </span>
                <div className="flex justify-between">
                  <span className="text-falcon-textMuted">Packets / sec:</span>
                  <span className="text-white font-bold">{dev.packets_per_sec} pps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-falcon-textMuted">Bandwidth:</span>
                  <span className="text-white font-bold">{formatBitrate(dev.bytes_per_sec)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-falcon-textMuted">First Observed:</span>
                  <span className="text-falcon-textDim">{dev.first_seen?.split(' ')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-falcon-textMuted">Last Active:</span>
                  <span className="text-white">{dev.last_seen?.split(' ')[1] || dev.last_seen}</span>
                </div>
              </div>

              {/* Risk Score Gauge */}
              <div className="bg-falcon-surface p-4 rounded border border-falcon-border/60 flex flex-col items-center justify-center">
                <span className="text-falcon-textDim text-[10px] uppercase font-bold block mb-1">
                  Risk Assessment
                </span>
                <RiskGauge score={dev.risk_score} size={110} showDetails={false} />
                <span className="text-[10px] text-falcon-textDim mt-1">Deterministic Rule Model</span>
              </div>

              {/* Firewall / Mitigation State */}
              <div className="bg-falcon-surface p-4 rounded border border-falcon-border/60 space-y-2">
                <span className="text-falcon-textDim text-[10px] uppercase font-bold block border-b border-falcon-border/40 pb-1">
                  Mitigation Status
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-falcon-textMuted">Kernel State:</span>
                  <span className={`font-bold ${isBlocked ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isBlocked ? 'ISOLATED' : 'FORWARDING'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-falcon-textMuted">Enforcement:</span>
                  <span className="text-falcon-accentLight font-semibold">Linux nftables</span>
                </div>
                {data.firewall_rule && (
                  <div className="text-[10px] bg-falcon-card p-2 rounded border border-red-900/40 text-red-300">
                    Rule ID: {data.firewall_rule.rule_id}
                  </div>
                )}
              </div>
            </div>

            {/* Top Destinations & Ports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-falcon-surface p-3 rounded border border-falcon-border/60">
                <span className="text-[10px] text-falcon-textDim uppercase font-bold block mb-2">
                  Top Communicating Endpoints
                </span>
                {data.top_destinations?.length > 0 ? (
                  <div className="space-y-1">
                    {data.top_destinations.map((dst) => (
                      <div key={dst.dst_ip} className="flex justify-between text-falcon-textMuted">
                        <span className="text-white">{dst.dst_ip}</span>
                        <span className="text-falcon-textDim">{dst.count} pkts ({formatBytes(dst.total_bytes)})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-falcon-textDim">No destination activity logged</p>
                )}
              </div>

              <div className="bg-falcon-surface p-3 rounded border border-falcon-border/60">
                <span className="text-[10px] text-falcon-textDim uppercase font-bold block mb-2">
                  Top Destination Protocols & Ports
                </span>
                {data.top_ports?.length > 0 ? (
                  <div className="space-y-1">
                    {data.top_ports.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-falcon-textMuted">
                        <span className="text-white">{p.protocol} / Port {p.dst_port || '—'}</span>
                        <span className="text-falcon-textDim">{p.count} connections</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-falcon-textDim">No active ports recorded</p>
                )}
              </div>
            </div>

            {/* Detected Threats & Alerts on this Device */}
            <div className="bg-falcon-surface p-4 rounded border border-falcon-border/60">
              <span className="text-[10px] text-falcon-textDim uppercase font-bold block mb-2">
                Threat & Incident History
              </span>
              {data.threats?.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.threats.map((t) => (
                    <div key={t.id} className="p-2.5 rounded bg-falcon-card border border-falcon-border flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white">{t.threat_type}</span>
                          <SeverityBadge severity={t.severity} />
                          <RiskBadge score={t.risk_score} />
                        </div>
                        <p className="text-[11px] text-falcon-textMuted leading-relaxed">{t.evidence}</p>
                      </div>
                      <span className="text-[10px] text-falcon-textDim whitespace-nowrap ml-2">
                        {t.timestamp?.split(' ')[1]}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-falcon-textDim text-center py-2">No security incidents recorded for this device.</p>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal for Block / Unblock */}
        <ConfirmationModal
          isOpen={confirmAction !== null}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => handleAction(confirmAction)}
          title={confirmAction === 'BLOCK' ? `Isolate Host ${dev?.ip}?` : `Restore Host ${dev?.ip}?`}
          message={
            confirmAction === 'BLOCK'
              ? `This will add a drop rule to the Linux nftables firewall for host ${dev?.ip}. All local network traffic from this device will be blocked.`
              : `This will remove the nftables drop rule for host ${dev?.ip} and return its state to ONLINE.`
          }
          confirmText={confirmAction === 'BLOCK' ? 'Yes, Block Host' : 'Yes, Unblock'}
          confirmButtonClass={confirmAction === 'BLOCK' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}
        />
      </div>
    </div>
  );
};
