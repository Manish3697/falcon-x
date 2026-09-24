import React, { useState, useEffect } from 'react';
import { Flame, ShieldCheck, Download, AlertTriangle, Cpu, Info, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { RiskGauge } from '../common/RiskGauge';
import { SeverityBadge, RiskBadge, StatusBadge } from '../common/Badge';
import { exportThreatReport } from '../../utils/exportUtils';

export const RiskAnalysisView = () => {
  const [riskData, setRiskData] = useState(null);
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const r = await api.getRiskAnalysis();
      const t = await api.getThreats();
      setRiskData(r);
      setThreats(t.threats || []);
    } catch (err) {
      console.error("Failed to load risk analysis", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleExportReport = () => {
    exportThreatReport(threats, riskData);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Deterministic Network Risk Engine (0–10 Scale)
            </h2>
          </div>
          <p className="text-xs font-mono text-falcon-textDim mt-0.5">
            Rule-Weighted Multi-Factor Threat Risk Evaluation • Edge Native Computation
          </p>
        </div>

        <button
          onClick={handleExportReport}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-falcon-surface border border-falcon-border hover:border-falcon-borderLight text-xs font-mono text-falcon-textMuted hover:text-white transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Threat Report</span>
        </button>
      </div>

      {/* Main Gauges & Severity Bands */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Network Risk Gauge */}
        <div className="bg-falcon-card border border-falcon-border rounded-lg p-5 flex flex-col items-center justify-between text-center">
          <div className="border-b border-falcon-border/60 pb-2 w-full">
            <h3 className="text-xs font-bold font-mono uppercase text-falcon-textMain tracking-wider">
              Network-Wide Highest Risk
            </h3>
            <p className="text-[11px] font-mono text-falcon-textDim">Peak Active Vulnerability Index</p>
          </div>

          <div className="my-3">
            <RiskGauge score={riskData?.highest_risk || 0} size={170} showDetails={true} />
          </div>

          <div className="bg-falcon-surface border border-falcon-border/60 p-2.5 rounded w-full text-xs font-mono">
            <span className="text-falcon-textDim block text-[10px]">HIGHEST RISK HOST</span>
            <span className="text-white font-bold">{riskData?.highest_risk_device?.ip || '192.168.1.1 (Gateway)'}</span>
            <span className="text-falcon-textDim block text-[10px]">
              {riskData?.highest_risk_device?.device_type || 'Baseline Safe'}
            </span>
          </div>
        </div>

        {/* 0-10 Risk Classification Matrix */}
        <div className="bg-falcon-card border border-falcon-border rounded-lg p-5 flex flex-col justify-between">
          <div className="border-b border-falcon-border/60 pb-2">
            <h3 className="text-xs font-bold font-mono uppercase text-falcon-textMain tracking-wider">
              Risk Classification Matrix
            </h3>
            <p className="text-[11px] font-mono text-falcon-textDim">Deterministic Threshold Bands</p>
          </div>

          <div className="space-y-2 my-auto py-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-red-950/40 border border-red-500/40 flex items-center justify-between">
              <div>
                <span className="text-red-400 font-bold block">9.0 – 10.0 : CRITICAL</span>
                <span className="text-[10px] text-red-300/70">Immediate isolation via nftables required</span>
              </div>
              <span className="text-base font-bold text-red-400">{riskData?.risk_breakdown?.CRITICAL || 0} Hosts</span>
            </div>

            <div className="p-2.5 rounded bg-orange-950/40 border border-orange-500/40 flex items-center justify-between">
              <div>
                <span className="text-orange-400 font-bold block">6.0 – 8.9 : HIGH</span>
                <span className="text-[10px] text-orange-300/70">Port scan / ARP poisoning detected</span>
              </div>
              <span className="text-base font-bold text-orange-400">{riskData?.risk_breakdown?.HIGH || 0} Hosts</span>
            </div>

            <div className="p-2.5 rounded bg-yellow-950/40 border border-yellow-500/40 flex items-center justify-between">
              <div>
                <span className="text-yellow-400 font-bold block">3.0 – 5.9 : MEDIUM</span>
                <span className="text-[10px] text-yellow-300/70">Unregistered rogue device / suspicious port</span>
              </div>
              <span className="text-base font-bold text-yellow-400">{riskData?.risk_breakdown?.MEDIUM || 0} Hosts</span>
            </div>

            <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-bold block">0.0 – 2.9 : LOW</span>
                <span className="text-[10px] text-emerald-300/70">Normal verified baseline behavior</span>
              </div>
              <span className="text-base font-bold text-emerald-400">{riskData?.risk_breakdown?.LOW || 0} Hosts</span>
            </div>
          </div>
        </div>

        {/* Deterministic Principles Notice (No fake AI claim) */}
        <div className="bg-falcon-card border border-falcon-border rounded-lg p-5 flex flex-col justify-between">
          <div className="border-b border-falcon-border/60 pb-2 flex items-center space-x-2">
            <Info className="w-4 h-4 text-falcon-accentLight" />
            <h3 className="text-xs font-bold font-mono uppercase text-falcon-textMain tracking-wider">
              Scoring Methodology
            </h3>
          </div>

          <div className="space-y-3 my-auto py-2 text-xs font-mono leading-relaxed text-falcon-textMuted">
            <div className="p-3 bg-falcon-surface border border-falcon-border/60 rounded">
              <span className="text-white font-semibold block mb-1 text-[11px]">DETERMINISTIC WEIGHTING</span>
              <p className="text-[11px] text-falcon-textDim">
                Risk is computed explicitly via rule triggers and sliding time-window thresholds.
              </p>
            </div>

            <div className="p-3 bg-falcon-surface border border-falcon-border/60 rounded">
              <span className="text-amber-300 font-semibold block mb-1 text-[11px]">FUTURE AI/ML SCOPE</span>
              <p className="text-[11px] text-falcon-textDim">
                Current prototype uses deterministic heuristics. TinyML anomaly detection is designated for future releases.
              </p>
            </div>
          </div>

          <div className="border-t border-falcon-border/40 pt-2 flex items-center justify-between text-[11px] font-mono text-falcon-textDim">
            <span>Average Network Risk:</span>
            <span className="text-white font-bold">{riskData?.average_network_risk || 0.0} / 10</span>
          </div>
        </div>
      </div>

      {/* Top Risky Devices & Active Threat Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Risky Devices */}
        <div className="bg-falcon-card border border-falcon-border rounded-lg p-5">
          <div className="border-b border-falcon-border/60 pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase text-white tracking-wider">
              Top Host Risk Rankings
            </h3>
            <span className="text-[10px] font-mono text-falcon-textDim">Ranked by 0–10 Score</span>
          </div>

          <div className="space-y-2">
            {riskData?.top_risky_devices?.length > 0 ? (
              riskData.top_risky_devices.map((d) => (
                <div
                  key={d.ip}
                  className="bg-falcon-surface border border-falcon-border/60 p-3 rounded flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-white">{d.ip}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="text-[10px] font-mono text-falcon-textDim">
                      {d.device_type} • {d.vendor} • {d.hostname || 'No Hostname'}
                    </p>
                  </div>
                  <RiskBadge score={d.risk_score} />
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-falcon-textDim text-center py-4">No risk data recorded.</p>
            )}
          </div>
        </div>

        {/* Active Threats Table */}
        <div className="bg-falcon-card border border-falcon-border rounded-lg p-5">
          <div className="border-b border-falcon-border/60 pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase text-white tracking-wider">
              Active Threat Types Breakdown
            </h3>
            <span className="text-[10px] font-mono text-falcon-textDim">Heuristic Threat Clusters</span>
          </div>

          <div className="space-y-2">
            {riskData?.active_threats?.length > 0 ? (
              riskData.active_threats.map((t) => (
                <div
                  key={t.threat_type}
                  className="bg-falcon-surface border border-falcon-border/60 p-3 rounded flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-mono font-bold text-white">{t.threat_type}</span>
                    <span className="text-[10px] font-mono text-falcon-textDim block">
                      {t.count} incidents observed • Avg Score: {t.avg_score}
                    </span>
                  </div>
                  <SeverityBadge severity={t.severity} />
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-falcon-textDim text-center py-4">
                No active threats recorded. Trigger a security test scenario to validate.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
