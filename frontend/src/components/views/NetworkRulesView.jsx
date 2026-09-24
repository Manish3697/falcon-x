import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Trash2, ToggleLeft, ToggleRight, CheckCircle, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import { SeverityBadge } from '../common/Badge';

export const NetworkRulesView = () => {
  const [nftRules, setNftRules] = useState([]);
  const [configRules, setConfigRules] = useState([]);
  const [mechanism, setMechanism] = useState('Linux nftables');
  const [isNftNative, setIsNftNative] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newRule, setNewRule] = useState({
    source_ip: '',
    destination: 'any',
    protocol: 'tcp',
    port: 'any',
    action: 'BLOCK',
    comment: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const fwData = await api.getFirewallRules();
      const cfgData = await api.getRules();
      if (fwData.rules) {
        setNftRules(fwData.rules);
        setMechanism(fwData.mechanism);
        setIsNftNative(fwData.is_nftables_native);
      }
      if (cfgData.rules) {
        setConfigRules(cfgData.rules);
      }
    } catch (err) {
      console.error("Failed to load rules", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleConfigRule = async (ruleId) => {
    try {
      await api.toggleRule(ruleId);
      fetchData();
    } catch (err) {
      console.error("Failed to toggle rule", err);
    }
  };

  const handleDeleteNftRule = async (ruleId) => {
    try {
      await api.deleteFirewallRule(ruleId);
      fetchData();
    } catch (err) {
      console.error("Failed to delete firewall rule", err);
    }
  };

  const handleAddCustomRule = async (e) => {
    e.preventDefault();
    try {
      await api.addCustomFirewallRule(newRule);
      setShowAddModal(false);
      setNewRule({
        source_ip: '',
        destination: 'any',
        protocol: 'tcp',
        port: 'any',
        action: 'BLOCK',
        comment: ''
      });
      fetchData();
    } catch (err) {
      console.error("Failed to add custom firewall rule", err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-falcon-accentLight" />
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Network Rules & Linux nftables Policy Engine
            </h2>
          </div>
          <p className="text-xs font-mono text-falcon-textDim mt-0.5">
            Kernel-Level Isolation Control ({mechanism}) • Deterministic Rule Policies
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-falcon-accent hover:bg-falcon-accentLight text-white text-xs font-mono font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Rule</span>
          </button>

          <button
            onClick={fetchData}
            className="p-1.5 rounded bg-falcon-surface border border-falcon-border hover:border-falcon-borderLight text-falcon-textMuted hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SECTION 1: Configurable Heuristic Detection Rules (Section 15) */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg p-5">
        <div className="border-b border-falcon-border/60 pb-3 mb-4">
          <h3 className="text-xs font-bold font-mono uppercase text-white tracking-wider">
            1. Deterministic Detection Rules (Engine Configuration)
          </h3>
          <p className="text-[11px] font-mono text-falcon-textDim">
            Configure threshold limits, sliding time windows, and risk weights for edge heuristics.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-falcon-surface border-b border-falcon-border text-falcon-textDim uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Rule Code</th>
                <th className="py-2.5 px-3">Rule Name</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Threshold</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Risk Weight</th>
                <th className="py-2.5 px-3 text-right">Enabled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-falcon-border/40 text-falcon-textMuted">
              {configRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-falcon-surface/50 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-falcon-accentLight">{rule.rule_code}</td>
                  <td className="py-2.5 px-3 text-white font-semibold">{rule.rule_name}</td>
                  <td className="py-2.5 px-3 text-falcon-textDim max-w-xs">{rule.description}</td>
                  <td className="py-2.5 px-3 text-white">
                    {rule.threshold} events / {rule.window_sec}s
                  </td>
                  <td className="py-2.5 px-3">
                    <SeverityBadge severity={rule.severity} />
                  </td>
                  <td className="py-2.5 px-3 text-amber-400 font-bold">{rule.weight.toFixed(1)} / 10</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleToggleConfigRule(rule.id)}
                      className={`text-lg transition-colors ${rule.enabled ? 'text-emerald-400' : 'text-slate-600'}`}
                      title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                    >
                      {rule.enabled ? <ToggleRight className="w-6 h-6 inline" /> : <ToggleLeft className="w-6 h-6 inline" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Active Linux nftables Isolation Rules (Section 16, 17) */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg p-5">
        <div className="border-b border-falcon-border/60 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold font-mono uppercase text-white tracking-wider">
              2. Active Kernel Firewall Rules (Linux nftables)
            </h3>
            <p className="text-[11px] font-mono text-falcon-textDim">
              Table: <span className="text-falcon-accentLight font-semibold">inet falconx_filter</span> • Chain: <span className="text-falcon-accentLight font-semibold">isolation_chain</span>
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-falcon-surface border border-falcon-border text-falcon-textMuted">
            {nftRules.filter(r => r.status === 'ACTIVE').length} Active Dropped Hosts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-falcon-surface border-b border-falcon-border text-falcon-textDim uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Rule ID</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">Destination</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Port</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Created</th>
                <th className="py-2.5 px-3">Comment / Reason</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-falcon-border/40 text-falcon-textMuted">
              {nftRules.length > 0 ? (
                nftRules.map((r) => (
                  <tr key={r.id} className="hover:bg-falcon-surface/50 transition-colors">
                    <td className="py-2.5 px-3 text-falcon-accentLight font-bold">{r.rule_id}</td>
                    <td className="py-2.5 px-3 text-white font-semibold">{r.source_ip}</td>
                    <td className="py-2.5 px-3 text-falcon-textDim">{r.destination}</td>
                    <td className="py-2.5 px-3 uppercase text-falcon-textMain">{r.protocol}</td>
                    <td className="py-2.5 px-3 text-falcon-textDim">{r.port}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.action === 'BLOCK' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {r.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-falcon-textDim">{r.created_at?.split(' ')[1] || r.created_at}</td>
                    <td className="py-2.5 px-3 text-falcon-textMuted max-w-xs truncate">{r.comment || 'Automatic Heuristic Isolation'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.status === 'ACTIVE' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteNftRule(r.rule_id)}
                        className="p-1 rounded hover:bg-red-950/50 text-falcon-textDim hover:text-red-400 transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-falcon-textDim font-mono">
                    No active firewall drop rules. Trigger a SYN Burst or Port Scan test scenario to validate automatic nftables host isolation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Custom Rule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-falcon-card border border-falcon-border rounded-lg max-w-md w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-falcon-textMuted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 border-b border-falcon-border/60 pb-3 mb-4">
              <Plus className="w-4 h-4 text-falcon-accentLight" />
              <h3 className="text-sm font-bold font-mono text-white uppercase">
                Add Custom nftables Rule
              </h3>
            </div>

            <form onSubmit={handleAddCustomRule} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-[10px] text-falcon-textDim uppercase block mb-1">Source IP (or 'any')</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 192.168.1.50"
                  value={newRule.source_ip}
                  onChange={(e) => setNewRule({ ...newRule, source_ip: e.target.value })}
                  className="w-full bg-falcon-surface border border-falcon-border rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-falcon-textDim uppercase block mb-1">Protocol</label>
                  <select
                    value={newRule.protocol}
                    onChange={(e) => setNewRule({ ...newRule, protocol: e.target.value })}
                    className="w-full bg-falcon-surface border border-falcon-border rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
                  >
                    <option value="tcp">TCP</option>
                    <option value="udp">UDP</option>
                    <option value="all">ALL</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-falcon-textDim uppercase block mb-1">Port (or 'any')</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 80 or any"
                    value={newRule.port}
                    onChange={(e) => setNewRule({ ...newRule, port: e.target.value })}
                    className="w-full bg-falcon-surface border border-falcon-border rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-falcon-textDim uppercase block mb-1">Action</label>
                <select
                  value={newRule.action}
                  onChange={(e) => setNewRule({ ...newRule, action: e.target.value })}
                  className="w-full bg-falcon-surface border border-falcon-border rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
                >
                  <option value="BLOCK">BLOCK (DROP)</option>
                  <option value="ALLOW">ALLOW (ACCEPT)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-falcon-textDim uppercase block mb-1">Comment / Rationale</label>
                <input
                  type="text"
                  placeholder="e.g. Quarantine unauthorized endpoint"
                  value={newRule.comment}
                  onChange={(e) => setNewRule({ ...newRule, comment: e.target.value })}
                  className="w-full bg-falcon-surface border border-falcon-border rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
                />
              </div>

              <div className="pt-3 border-t border-falcon-border/60 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-falcon-surface border border-falcon-border text-falcon-textMuted hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-falcon-accent hover:bg-falcon-accentLight text-white font-semibold"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
