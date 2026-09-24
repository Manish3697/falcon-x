import React, { useState, useEffect } from 'react';
import { Activity, Filter, Pause, Play, RefreshCw, Shield, Search, Eye, X } from 'lucide-react';
import { api } from '../../services/api';
import { RiskBadge } from '../common/Badge';
import { formatBytes } from '../../utils/formatters';

export const LiveTrafficView = () => {
  const [trafficEvents, setTrafficEvents] = useState([]);
  const [filters, setFilters] = useState({
    src_ip: '',
    dst_ip: '',
    protocol: '',
    min_risk: ''
  });
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [selectedPacket, setSelectedPacket] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTraffic = async () => {
    try {
      setLoading(true);
      const data = await api.getTraffic({
        ...filters,
        limit: 100
      });
      if (data.events) {
        setTrafficEvents(data.events);
      }
    } catch (err) {
      console.error("Failed to fetch traffic events", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraffic();
    if (!isLivePaused) {
      const interval = setInterval(fetchTraffic, 2000);
      return () => clearInterval(interval);
    }
  }, [filters, isLivePaused]);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header & Live Control */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-falcon-accentLight" />
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Network Traffic Monitoring
            </h2>
          </div>
          <p className="text-xs font-mono text-falcon-textDim mt-0.5">
            Agentless Edge Packet Metadata Inspection • Zero Payload Retention
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsLivePaused(!isLivePaused)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors ${
              isLivePaused
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-falcon-surface border border-falcon-border hover:border-falcon-borderLight text-falcon-textMuted hover:text-white'
            }`}
          >
            {isLivePaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isLivePaused ? 'Resume Feed' : 'Pause Feed'}</span>
          </button>

          <button
            onClick={fetchTraffic}
            className="p-1.5 rounded bg-falcon-surface border border-falcon-border hover:border-falcon-borderLight text-falcon-textMuted hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar (Section 12) */}
      <div className="bg-falcon-surface border border-falcon-border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div>
          <label className="text-[10px] text-falcon-textDim uppercase block mb-1">Source IP</label>
          <input
            type="text"
            placeholder="e.g. 192.168.1.15"
            value={filters.src_ip}
            onChange={(e) => setFilters({ ...filters, src_ip: e.target.value })}
            className="w-full bg-falcon-card border border-falcon-border rounded px-2.5 py-1.5 text-white placeholder-falcon-textDim focus:outline-none focus:border-falcon-accent"
          />
        </div>

        <div>
          <label className="text-[10px] text-falcon-textDim uppercase block mb-1">Destination IP</label>
          <input
            type="text"
            placeholder="e.g. 192.168.1.1"
            value={filters.dst_ip}
            onChange={(e) => setFilters({ ...filters, dst_ip: e.target.value })}
            className="w-full bg-falcon-card border border-falcon-border rounded px-2.5 py-1.5 text-white placeholder-falcon-textDim focus:outline-none focus:border-falcon-accent"
          />
        </div>

        <div>
          <label className="text-[10px] text-falcon-textDim uppercase block mb-1">Protocol</label>
          <select
            value={filters.protocol}
            onChange={(e) => setFilters({ ...filters, protocol: e.target.value })}
            className="w-full bg-falcon-card border border-falcon-border rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
          >
            <option value="">All Protocols</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="ARP">ARP</option>
            <option value="ICMP">ICMP</option>
            <option value="RTSP">RTSP</option>
            <option value="MODBUS">MODBUS</option>
            <option value="TLS">TLS</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] text-falcon-textDim uppercase block mb-1">Min Risk Score</label>
          <select
            value={filters.min_risk}
            onChange={(e) => setFilters({ ...filters, min_risk: e.target.value })}
            className="w-full bg-falcon-card border border-falcon-border rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
          >
            <option value="">Any Risk</option>
            <option value="3.0">Medium Risk (≥ 3.0)</option>
            <option value="6.0">High Risk (≥ 6.0)</option>
            <option value="8.0">Critical Threat (≥ 8.0)</option>
          </select>
        </div>
      </div>

      {/* Traffic Table */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="sticky top-0 bg-falcon-surface border-b border-falcon-border text-falcon-textDim uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">Src Port</th>
                <th className="py-2.5 px-3">Destination IP</th>
                <th className="py-2.5 px-3">Dst Port</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Size</th>
                <th className="py-2.5 px-3">TCP Flags</th>
                <th className="py-2.5 px-3">Risk</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-falcon-border/40 text-falcon-textMuted">
              {trafficEvents.length > 0 ? (
                trafficEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    className={`hover:bg-falcon-surface/60 transition-colors ${
                      evt.risk_score >= 8.0 ? 'bg-red-950/20' : evt.risk_score >= 5.0 ? 'bg-amber-950/15' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-white">{evt.timestamp?.split(' ')[1] || evt.timestamp}</td>
                    <td className="py-2 px-3 text-white font-semibold">{evt.src_ip}</td>
                    <td className="py-2 px-3 text-falcon-textDim">{evt.src_port || '—'}</td>
                    <td className="py-2 px-3 text-white">{evt.dst_ip}</td>
                    <td className="py-2 px-3 text-falcon-accentLight font-semibold">{evt.dst_port || '—'}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-falcon-surface border border-falcon-border text-falcon-textMain text-[10px]">
                        {evt.protocol}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-falcon-textDim">{formatBytes(evt.packet_size)}</td>
                    <td className="py-2 px-3 font-mono font-bold text-amber-300">{evt.tcp_flags || '—'}</td>
                    <td className="py-2 px-3">
                      <RiskBadge score={evt.risk_score} />
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        evt.action === 'BLOCKED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {evt.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => setSelectedPacket(evt)}
                        className="p-1 rounded hover:bg-falcon-surface text-falcon-textMuted hover:text-white"
                        title="View Packet Metadata"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-falcon-textDim font-mono">
                    No traffic matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packet Metadata Inspector Modal (Safe - No sensitive payload) */}
      {selectedPacket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-falcon-card border border-falcon-border rounded-lg max-w-lg w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedPacket(null)}
              className="absolute top-4 right-4 text-falcon-textMuted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 border-b border-falcon-border/60 pb-3 mb-4">
              <Shield className="w-4 h-4 text-falcon-accentLight" />
              <h3 className="text-sm font-bold font-mono text-white uppercase">
                Packet Metadata Frame #{selectedPacket.id}
              </h3>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 bg-falcon-surface p-3 rounded border border-falcon-border/50">
                <div>
                  <span className="text-falcon-textDim block text-[10px]">SOURCE SOCKET</span>
                  <span className="text-white font-bold">{selectedPacket.src_ip}:{selectedPacket.src_port || '—'}</span>
                </div>
                <div>
                  <span className="text-falcon-textDim block text-[10px]">DESTINATION SOCKET</span>
                  <span className="text-white font-bold">{selectedPacket.dst_ip}:{selectedPacket.dst_port || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-falcon-surface p-2.5 rounded border border-falcon-border/50">
                <div>
                  <span className="text-falcon-textDim block text-[10px]">PROTOCOL</span>
                  <span className="text-falcon-accentLight font-bold">{selectedPacket.protocol}</span>
                </div>
                <div>
                  <span className="text-falcon-textDim block text-[10px]">SIZE</span>
                  <span className="text-white">{selectedPacket.packet_size} Bytes</span>
                </div>
                <div>
                  <span className="text-falcon-textDim block text-[10px]">TCP FLAGS</span>
                  <span className="text-amber-300 font-bold">{selectedPacket.tcp_flags || 'NONE'}</span>
                </div>
              </div>

              <div className="p-3 rounded bg-falcon-surface border border-falcon-border/50">
                <span className="text-falcon-textDim block text-[10px] mb-1">PRIVACY & SECURITY COMPLIANCE</span>
                <p className="text-[11px] text-falcon-textMuted leading-relaxed">
                  Payload content is discarded at the Linux socket layer for privacy protection. Only Layer 3/4 headers and statistical traffic patterns are stored locally.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-falcon-border/60 flex justify-end">
              <button
                onClick={() => setSelectedPacket(null)}
                className="px-3 py-1.5 rounded bg-falcon-surface border border-falcon-border hover:border-falcon-borderLight text-xs font-mono text-white"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
