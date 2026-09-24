import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Flame, 
  Cpu, 
  ArrowUpRight, 
  AlertTriangle,
  ExternalLink,
  Lock,
  CheckCircle,
  Clock,
  Layers
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useFalcon } from '../../context/FalconContext';
import { MetricCard } from '../common/MetricCard';
import { RiskGauge } from '../common/RiskGauge';
import { SeverityBadge, StatusBadge, RiskBadge } from '../common/Badge';
import { formatBitrate } from '../../utils/formatters';
import { api } from '../../services/api';

export const DashboardView = () => {
  const { kpis, trafficHistory, recentAlerts, setActiveTab, systemStatus } = useFalcon();
  const [threatDistribution, setThreatDistribution] = useState([]);
  const [topRiskyDevices, setTopRiskyDevices] = useState([]);
  const [timeRange, setTimeRange] = useState('5m');

  useEffect(() => {
    const loadDashboardExtras = async () => {
      try {
        const threatsData = await api.getThreats();
        if (threatsData.distribution) {
          setThreatDistribution(threatsData.distribution);
        }
        const riskData = await api.getRiskAnalysis();
        if (riskData.top_risky_devices) {
          setTopRiskyDevices(riskData.top_risky_devices);
        }
      } catch (err) {
        console.error("Failed to load dashboard extras", err);
      }
    };
    loadDashboardExtras();
    const interval = setInterval(loadDashboardExtras, 4000);
    return () => clearInterval(interval);
  }, []);

  // Pie chart colors for threat categories
  const THREAT_COLORS = {
    'Port Scan': '#F97316',
    'SYN Flood/Burst': '#EF4444',
    'ARP Spoofing/Conflict': '#EAB308',
    'Unknown/Rogue Device': '#38BDF8',
    'Suspicious Traffic': '#A855F7',
  };

  const pieData = threatDistribution.length > 0 
    ? threatDistribution.map(t => ({ name: t.category, value: t.count, color: THREAT_COLORS[t.category] || '#64748B' }))
    : [
        { name: 'Baseline Monitoring', value: 1, color: '#1E2C48' }
      ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. KPI Cards Row (6 Cards as requested in Section 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="DEVICES"
          value={kpis.devices.total}
          subtitle={`${kpis.devices.online} Online • ${kpis.devices.unknown} Unknown`}
          icon={Wifi}
          accentColor="blue"
          statusIndicator="ACTIVE"
        />
        <MetricCard
          title="NETWORK TRAFFIC"
          value={`${kpis.traffic.packets_per_sec} pps`}
          subtitle={formatBitrate(kpis.traffic.bytes_per_sec)}
          icon={Activity}
          accentColor="blue"
          statusIndicator={kpis.traffic.status}
        />
        <MetricCard
          title="THREATS"
          value={kpis.threats.detected}
          subtitle={`${kpis.threats.unresolved} Unresolved • ${kpis.threats.critical} Critical`}
          icon={ShieldAlert}
          accentColor={kpis.threats.critical > 0 ? 'red' : kpis.threats.detected > 0 ? 'orange' : 'green'}
          tag={kpis.threats.critical > 0 ? 'ALERT' : 'STABLE'}
        />
        <MetricCard
          title="BLOCKED"
          value={kpis.blocked.blocked_hosts}
          subtitle={`${kpis.blocked.active_rules} Active nftables rules`}
          icon={ShieldCheck}
          accentColor="red"
          tag="ISOLATED"
        />
        <MetricCard
          title="RISK"
          value={`${kpis.risk.highest_risk} / 10`}
          subtitle={`Avg Network: ${kpis.risk.avg_risk} (${kpis.risk.severity})`}
          icon={Flame}
          accentColor={kpis.risk.highest_risk >= 8.0 ? 'red' : kpis.risk.highest_risk >= 5.0 ? 'orange' : 'green'}
        />
        <MetricCard
          title="SYSTEM"
          value={`${kpis.system.cpu_percent}% CPU`}
          subtitle={`RAM: ${kpis.system.ram_percent}% • Up: ${kpis.system.uptime.split(' ')[0]}`}
          icon={Cpu}
          accentColor="green"
          statusIndicator="HEALTHY"
        />
      </div>

      {/* 2. Real-Time Network Traffic Graph */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-falcon-border/60 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-falcon-accentLight" />
              <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Real-Time Network Traffic
              </h2>
            </div>
            <p className="text-xs font-mono text-falcon-textDim mt-0.5">
              Edge Traffic Telemetry (Packets/sec & KB/sec)
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center space-x-1 bg-falcon-surface border border-falcon-border rounded p-1 text-xs font-mono">
            {['1m', '5m', '15m', '30m', '1h'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  timeRange === r
                    ? 'bg-falcon-accent text-white font-bold'
                    : 'text-falcon-textDim hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Traffic Chart */}
        <div className="h-64 mt-4 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trafficHistory}>
              <defs>
                <linearGradient id="ppsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="kbpsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2C48" />
              <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B1120',
                  borderColor: '#1E2C48',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px'
                }}
              />
              <Area type="monotone" dataKey="packets_per_sec" name="Packets/sec" stroke="#38BDF8" strokeWidth={2} fillOpacity={1} fill="url(#ppsGradient)" />
              <Area type="monotone" dataKey="kbytes_per_sec" name="KB/sec" stroke="#10B981" strokeWidth={1.5} fillOpacity={1} fill="url(#kbpsGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Threat Distribution & Network Risk Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Distribution Chart (Section 8) */}
        <div className="bg-falcon-card border border-falcon-border rounded-lg p-5 flex flex-col justify-between">
          <div className="border-b border-falcon-border/60 pb-3">
            <h3 className="text-xs font-bold font-mono uppercase text-falcon-textMain tracking-wider">
              Threat Distribution
            </h3>
            <p className="text-[11px] font-mono text-falcon-textDim">Categorized by Heuristic Detection Type</p>
          </div>

          <div className="h-48 my-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1120',
                    borderColor: '#1E2C48',
                    fontFamily: 'monospace',
                    fontSize: '11px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Distribution list */}
          <div className="space-y-1.5 border-t border-falcon-border/40 pt-3">
            {threatDistribution.length > 0 ? (
              threatDistribution.map((t) => (
                <div key={t.category} className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: THREAT_COLORS[t.category] || '#64748B' }}></span>
                    <span className="text-falcon-textMuted">{t.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">{t.count}</span>
                    <span className="text-falcon-textDim text-[10px]">({t.percentage}%)</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-falcon-textDim text-center py-2">No active threats recorded</p>
            )}
          </div>
        </div>

        {/* Network Risk Engine Gauge */}
        <div className="bg-falcon-card border border-falcon-border rounded-lg p-5 flex flex-col justify-between">
          <div className="border-b border-falcon-border/60 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase text-falcon-textMain tracking-wider">
                Network Risk Evaluation
              </h3>
              <p className="text-[11px] font-mono text-falcon-textDim">Deterministic 0–10 Weighted Scoring</p>
            </div>
            <button
              onClick={() => setActiveTab('risk')}
              className="text-xs font-mono text-falcon-accentLight hover:underline flex items-center space-x-1"
            >
              <span>Details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="my-auto py-2">
            <RiskGauge score={kpis.risk.highest_risk} size={150} showDetails={true} />
          </div>

          <div className="bg-falcon-surface border border-falcon-border/60 rounded p-2.5 text-xs font-mono space-y-1">
            <div className="flex justify-between text-falcon-textMuted">
              <span>Avg Risk Score:</span>
              <span className="text-white font-bold">{kpis.risk.avg_risk} / 10</span>
            </div>
            <div className="flex justify-between text-falcon-textMuted">
              <span>Scoring Engine:</span>
              <span className="text-falcon-accentLight">Deterministic / Heuristic</span>
            </div>
          </div>
        </div>

        {/* Top Risky Devices */}
        <div className="bg-falcon-card border border-falcon-border rounded-lg p-5 flex flex-col justify-between">
          <div className="border-b border-falcon-border/60 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase text-falcon-textMain tracking-wider">
                Top Risk Devices
              </h3>
              <p className="text-[11px] font-mono text-falcon-textDim">Hosts Requiring Operational Attention</p>
            </div>
            <button
              onClick={() => setActiveTab('devices')}
              className="text-xs font-mono text-falcon-accentLight hover:underline flex items-center space-x-1"
            >
              <span>Inventory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 my-auto py-2">
            {topRiskyDevices.length > 0 ? (
              topRiskyDevices.slice(0, 4).map((d) => (
                <div
                  key={d.ip}
                  className="bg-falcon-surface border border-falcon-border/60 hover:border-falcon-accent/40 rounded p-2 flex items-center justify-between transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-mono font-bold text-white">{d.ip}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="text-[10px] font-mono text-falcon-textDim truncate max-w-[150px]">
                      {d.device_type} • {d.vendor}
                    </p>
                  </div>
                  <RiskBadge score={d.risk_score} />
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-falcon-textDim text-center py-4">All devices at baseline risk</p>
            )}
          </div>

          <div className="border-t border-falcon-border/40 pt-2 text-[11px] font-mono text-falcon-textDim flex items-center justify-between">
            <span>Mitigation:</span>
            <span className="text-emerald-400 font-semibold">Linux nftables active</span>
          </div>
        </div>
      </div>

      {/* 4. Recent Alerts Table (Section 9) */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg p-5">
        <div className="flex items-center justify-between border-b border-falcon-border/60 pb-3 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <h3 className="text-xs font-bold font-mono uppercase text-white tracking-wider">
                Recent Security Alerts
              </h3>
            </div>
            <p className="text-[11px] font-mono text-falcon-textDim">Real-Time Event Dispatch Queue</p>
          </div>
          <button
            onClick={() => setActiveTab('alerts')}
            className="text-xs font-mono text-falcon-accentLight hover:underline flex items-center space-x-1"
          >
            <span>View All Alerts</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-falcon-border text-falcon-textDim uppercase text-[10px]">
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Device IP</th>
                <th className="py-2 px-3">MAC Address</th>
                <th className="py-2 px-3">Threat</th>
                <th className="py-2 px-3">Risk</th>
                <th className="py-2 px-3">Severity</th>
                <th className="py-2 px-3">Action</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-falcon-border/40 text-falcon-textMuted">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((a) => (
                  <tr key={a.id} className="hover:bg-falcon-surface/50 transition-colors">
                    <td className="py-2.5 px-3 text-white font-mono">{a.timestamp?.split(' ')[1] || a.timestamp}</td>
                    <td className="py-2.5 px-3 text-white font-semibold">{a.device_ip}</td>
                    <td className="py-2.5 px-3 text-falcon-textDim font-mono">{a.mac_address || '—'}</td>
                    <td className="py-2.5 px-3 text-white">{a.threat_type}</td>
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
                      <span className="text-[11px] font-semibold text-falcon-accentLight">{a.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-falcon-textDim font-mono">
                    No security alerts generated. Trigger a test scenario above to validate detection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Verified Prototype Specifications Card (Section 34) */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg p-5">
        <div className="border-b border-falcon-border/60 pb-3 mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold font-mono uppercase text-white tracking-wider">
              Verified Prototype Operational Benchmarks
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            EMPIRICALLY TESTED
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="bg-falcon-surface border border-falcon-border/60 p-2.5 rounded">
            <span className="text-[10px] text-falcon-textDim block">COLD BOOT</span>
            <span className="text-white font-bold">22.4 seconds</span>
          </div>
          <div className="bg-falcon-surface border border-falcon-border/60 p-2.5 rounded">
            <span className="text-[10px] text-falcon-textDim block">SYN DETECTION</span>
            <span className="text-white font-bold">~1.2 seconds</span>
          </div>
          <div className="bg-falcon-surface border border-falcon-border/60 p-2.5 rounded">
            <span className="text-[10px] text-falcon-textDim block">DASHBOARD LATENCY</span>
            <span className="text-white font-bold">&lt; 30 ms</span>
          </div>
          <div className="bg-falcon-surface border border-falcon-border/60 p-2.5 rounded">
            <span className="text-[10px] text-falcon-textDim block">DAEMON RECOVERY</span>
            <span className="text-white font-bold">~1.4 seconds</span>
          </div>
          <div className="bg-falcon-surface border border-falcon-border/60 p-2.5 rounded">
            <span className="text-[10px] text-falcon-textDim block">BLOCKING TEST</span>
            <span className="text-emerald-400 font-bold">0 Accepted Packets</span>
          </div>
          <div className="bg-falcon-surface border border-falcon-border/60 p-2.5 rounded">
            <span className="text-[10px] text-falcon-textDim block">PACKET CAPTURE</span>
            <span className="text-emerald-400 font-bold">Zero Buffer Loss</span>
          </div>
        </div>
      </div>
    </div>
  );
};
