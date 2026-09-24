import React, { useState, useEffect } from 'react';
import { Wifi, Search, Filter, Download, Lock, Unlock, Eye, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { StatusBadge, RiskBadge } from '../common/Badge';
import { DeviceDetailModal } from './DeviceDetailModal';
import { exportToCSV } from '../../utils/exportUtils';
import { formatBitrate } from '../../utils/formatters';

export const DevicesView = () => {
  const [devices, setDevices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await api.getDevices({
        status: statusFilter,
        type: typeFilter
      });
      if (data.devices) {
        setDevices(data.devices);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to load devices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 3000);
    return () => clearInterval(interval);
  }, [statusFilter, typeFilter]);

  const filteredDevices = devices.filter((d) => {
    const term = search.toLowerCase();
    return (
      d.ip.toLowerCase().includes(term) ||
      d.mac.toLowerCase().includes(term) ||
      (d.hostname && d.hostname.toLowerCase().includes(term)) ||
      (d.vendor && d.vendor.toLowerCase().includes(term)) ||
      (d.device_type && d.device_type.toLowerCase().includes(term))
    );
  });

  const handleExportCSV = () => {
    const headers = [
      { key: 'ip', label: 'Device IP' },
      { key: 'mac', label: 'MAC Address' },
      { key: 'hostname', label: 'Hostname' },
      { key: 'device_type', label: 'Device Type' },
      { key: 'vendor', label: 'Vendor' },
      { key: 'status', label: 'Status' },
      { key: 'risk_score', label: 'Risk Score' },
      { key: 'packets_per_sec', label: 'Packets/sec' },
      { key: 'first_seen', label: 'First Seen' },
      { key: 'last_seen', label: 'Last Seen' },
    ];
    exportToCSV('falconx_device_inventory', devices, headers);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Header & Export */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Wifi className="w-4 h-4 text-falcon-accentLight" />
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              IoT Device Inventory & Asset Discovery
            </h2>
          </div>
          <p className="text-xs font-mono text-falcon-textDim mt-0.5">
            Agentless Edge Inventory • Continuous MAC/IP Profile Tracking
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
            onClick={fetchDevices}
            className="p-1.5 rounded bg-falcon-surface border border-falcon-border hover:border-falcon-borderLight text-falcon-textMuted hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="bg-falcon-surface border border-falcon-border/60 p-3 rounded">
            <span className="text-[10px] text-falcon-textDim block">TOTAL DISCOVERED</span>
            <span className="text-base font-bold text-white">{summary.total} Devices</span>
          </div>
          <div className="bg-falcon-surface border border-falcon-border/60 p-3 rounded">
            <span className="text-[10px] text-falcon-textDim block">ONLINE</span>
            <span className="text-base font-bold text-emerald-400">{summary.online} Hosts</span>
          </div>
          <div className="bg-falcon-surface border border-falcon-border/60 p-3 rounded">
            <span className="text-[10px] text-falcon-textDim block">UNKNOWN / ROGUE</span>
            <span className="text-base font-bold text-amber-400">{summary.unknown} Hosts</span>
          </div>
          <div className="bg-falcon-surface border border-falcon-border/60 p-3 rounded">
            <span className="text-[10px] text-falcon-textDim block">SUSPICIOUS</span>
            <span className="text-base font-bold text-orange-400">{summary.suspicious} Hosts</span>
          </div>
          <div className="bg-falcon-surface border border-falcon-border/60 p-3 rounded col-span-2 sm:col-span-1">
            <span className="text-[10px] text-falcon-textDim block">BLOCKED (ISOLATED)</span>
            <span className="text-base font-bold text-red-400">{summary.blocked} Hosts</span>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-falcon-surface border border-falcon-border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-falcon-textDim" />
          <input
            type="text"
            placeholder="Search IP, MAC, Hostname, Vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-falcon-card border border-falcon-border rounded pl-8 pr-3 py-1.5 text-white placeholder-falcon-textDim focus:outline-none focus:border-falcon-accent"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-falcon-card border border-falcon-border rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
          >
            <option value="">All Statuses</option>
            <option value="ONLINE">ONLINE</option>
            <option value="SUSPICIOUS">SUSPICIOUS</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="OFFLINE">OFFLINE</option>
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-falcon-card border border-falcon-border rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
          >
            <option value="">All Device Types</option>
            <option value="IP Camera">IP Camera</option>
            <option value="Smart Meter">Smart Meter</option>
            <option value="POS Terminal">POS Terminal</option>
            <option value="Industrial Sensor">Industrial Sensor</option>
            <option value="PLC">PLC</option>
            <option value="Laptop">Laptop</option>
            <option value="Gateway">Gateway</option>
            <option value="Unknown Device">Unknown Device</option>
          </select>
        </div>
      </div>

      {/* Devices Table (Section 10) */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-falcon-surface border-b border-falcon-border text-falcon-textDim uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Device IP</th>
                <th className="py-2.5 px-3">MAC Address</th>
                <th className="py-2.5 px-3">Hostname</th>
                <th className="py-2.5 px-3">Device Type</th>
                <th className="py-2.5 px-3">Vendor</th>
                <th className="py-2.5 px-3">Last Seen</th>
                <th className="py-2.5 px-3">Traffic</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-falcon-border/40 text-falcon-textMuted">
              {filteredDevices.length > 0 ? (
                filteredDevices.map((dev) => (
                  <tr
                    key={dev.device_id}
                    onClick={() => setSelectedDeviceId(dev.device_id)}
                    className="hover:bg-falcon-surface/60 transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3 text-white font-bold">{dev.ip}</td>
                    <td className="py-2.5 px-3 text-falcon-textDim">{dev.mac}</td>
                    <td className="py-2.5 px-3 text-white">{dev.hostname || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-falcon-surface border border-falcon-border text-falcon-textMain text-[10px]">
                        {dev.device_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-falcon-textDim">{dev.vendor}</td>
                    <td className="py-2.5 px-3 text-falcon-textDim">{dev.last_seen?.split(' ')[1] || dev.last_seen}</td>
                    <td className="py-2.5 px-3 text-white">{dev.packets_per_sec} pps</td>
                    <td className="py-2.5 px-3">
                      <RiskBadge score={dev.risk_score} />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={dev.status} />
                    </td>
                    <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedDeviceId(dev.device_id)}
                        className="px-2 py-1 rounded bg-falcon-surface border border-falcon-border hover:border-falcon-accent/50 text-falcon-textMuted hover:text-white text-[10px]"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-falcon-textDim font-mono">
                    No devices match the criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Device Detail Modal */}
      {selectedDeviceId && (
        <DeviceDetailModal
          deviceId={selectedDeviceId}
          onClose={() => setSelectedDeviceId(null)}
          onRefresh={fetchDevices}
        />
      )}
    </div>
  );
};
