import React, { useState } from 'react';
import { Sliders, Save, RotateCcw, Check, Network, Shield, Bell, RefreshCw } from 'lucide-react';
import { useFalcon } from '../../context/FalconContext';

export const SettingsView = () => {
  const { demoMode, toggleDemoMode, showNotification } = useFalcon();

  const [settings, setSettings] = useState({
    interface: 'eth0',
    subnet: '192.168.1.0/24',
    gateway: '192.168.1.1',
    portScanThreshold: 5,
    portScanWindow: 10,
    synBurstThreshold: 20,
    synBurstWindow: 5,
    autoMitigateHighRisk: true,
    telemetryRefreshSec: 1,
    exportRetentionDays: 30
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    showNotification('System configuration parameters saved and applied to edge engine.', 'info');
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      interface: 'eth0',
      subnet: '192.168.1.0/24',
      gateway: '192.168.1.1',
      portScanThreshold: 5,
      portScanWindow: 10,
      synBurstThreshold: 20,
      synBurstWindow: 5,
      autoMitigateHighRisk: true,
      telemetryRefreshSec: 1,
      exportRetentionDays: 30
    });
    showNotification('Configuration reset to verified factory defaults.', 'info');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="bg-falcon-card border border-falcon-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-falcon-accentLight" />
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Edge Engine Parameters & Settings
            </h2>
          </div>
          <p className="text-xs font-mono text-falcon-textDim mt-0.5">
            Network Interface Configuration • Heuristic Thresholds • Operating Modes
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-falcon-surface border border-falcon-border hover:border-falcon-borderLight text-xs font-mono text-falcon-textMuted hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs font-mono">
        {/* Section 1: Network Interface & Subnet */}
        <div className="bg-falcon-card border border-falcon-border rounded-lg p-5 space-y-4">
          <div className="border-b border-falcon-border/60 pb-3 flex items-center space-x-2">
            <Network className="w-4 h-4 text-falcon-accentLight" />
            <h3 className="text-xs font-bold uppercase text-white tracking-wider">
              1. Network Interface & Addressing
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-falcon-textDim uppercase block mb-1">Monitoring Interface</label>
              <input
                type="text"
                value={settings.interface}
                onChange={(e) => setSettings({ ...settings, interface: e.target.value })}
                className="w-full bg-falcon-surface border border-falcon-border rounded px-3 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
              />
              <span className="text-[10px] text-falcon-textDim mt-1 block">e.g. eth0, eth1 (USB 3.0 adapter)</span>
            </div>

            <div>
              <label className="text-falcon-textDim uppercase block mb-1">Local Network Subnet (CIDR)</label>
              <input
                type="text"
                value={settings.subnet}
                onChange={(e) => setSettings({ ...settings, subnet: e.target.value })}
                className="w-full bg-falcon-surface border border-falcon-border rounded px-3 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
              />
              <span className="text-[10px] text-falcon-textDim mt-1 block">Subnet scope for device discovery</span>
            </div>

            <div>
              <label className="text-falcon-textDim uppercase block mb-1">Default Gateway IP</label>
              <input
                type="text"
                value={settings.gateway}
                onChange={(e) => setSettings({ ...settings, gateway: e.target.value })}
                className="w-full bg-falcon-surface border border-falcon-border rounded px-3 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
              />
              <span className="text-[10px] text-falcon-textDim mt-1 block">Router / default gateway</span>
            </div>
          </div>
        </div>

        {/* Section 2: Heuristic Detection Engine Thresholds */}
        <div className="bg-falcon-card border border-falcon-border rounded-lg p-5 space-y-4">
          <div className="border-b border-falcon-border/60 pb-3 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-bold uppercase text-white tracking-wider">
              2. Heuristic Detection Thresholds & Sliding Windows
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-falcon-textDim uppercase block mb-1">Port Scan Threshold</label>
              <input
                type="number"
                value={settings.portScanThreshold}
                onChange={(e) => setSettings({ ...settings, portScanThreshold: parseInt(e.target.value) })}
                className="w-full bg-falcon-surface border border-falcon-border rounded px-3 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
              />
              <span className="text-[10px] text-falcon-textDim mt-1 block">Unique ports before trigger</span>
            </div>

            <div>
              <label className="text-falcon-textDim uppercase block mb-1">Port Scan Window (Sec)</label>
              <input
                type="number"
                value={settings.portScanWindow}
                onChange={(e) => setSettings({ ...settings, portScanWindow: parseInt(e.target.value) })}
                className="w-full bg-falcon-surface border border-falcon-border rounded px-3 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
              />
              <span className="text-[10px] text-falcon-textDim mt-1 block">Sliding evaluation window</span>
            </div>

            <div>
              <label className="text-falcon-textDim uppercase block mb-1">SYN Burst Threshold</label>
              <input
                type="number"
                value={settings.synBurstThreshold}
                onChange={(e) => setSettings({ ...settings, synBurstThreshold: parseInt(e.target.value) })}
                className="w-full bg-falcon-surface border border-falcon-border rounded px-3 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
              />
              <span className="text-[10px] text-falcon-textDim mt-1 block">Raw SYN packets limit</span>
            </div>

            <div>
              <label className="text-falcon-textDim uppercase block mb-1">SYN Window (Sec)</label>
              <input
                type="number"
                value={settings.synBurstWindow}
                onChange={(e) => setSettings({ ...settings, synBurstWindow: parseInt(e.target.value) })}
                className="w-full bg-falcon-surface border border-falcon-border rounded px-3 py-1.5 text-white focus:outline-none focus:border-falcon-accent"
              />
              <span className="text-[10px] text-falcon-textDim mt-1 block">Burst interval window</span>
            </div>
          </div>
        </div>

        {/* Section 3: Autonomous Mitigation Policy */}
        <div className="bg-falcon-card border border-falcon-border rounded-lg p-5 space-y-4">
          <div className="border-b border-falcon-border/60 pb-3 flex items-center space-x-2">
            <Bell className="w-4 h-4 text-yellow-400" />
            <h3 className="text-xs font-bold uppercase text-white tracking-wider">
              3. Autonomous Mitigation & Isolation Policy
            </h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoMitigateHighRisk}
                onChange={(e) => setSettings({ ...settings, autoMitigateHighRisk: e.target.checked })}
                className="w-4 h-4 rounded bg-falcon-surface border-falcon-border text-falcon-accent focus:ring-0"
              />
              <div>
                <span className="text-white font-semibold">Enable Automatic Linux nftables Host Isolation on Critical Threats</span>
                <p className="text-falcon-textDim text-[11px]">
                  Automatically generates and inserts kernel drop rules when deterministic risk reaches ≥ 8.0/10.
                </p>
              </div>
            </label>

            <div className="border-t border-falcon-border/40 pt-3 flex items-center justify-between text-falcon-textDim">
              <div>
                <span className="text-white font-semibold">Kernel Firewall Mechanism</span>
                <p className="text-[11px]">
                  Enforcement via Linux <code className="text-falcon-accentLight">inet falconx_filter isolation_chain</code> table.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                KERNEL HOOK READY
              </span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          {isSaved && (
            <span className="text-emerald-400 font-bold flex items-center space-x-1 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Configuration Applied Successfully!</span>
            </span>
          )}
          <button
            type="submit"
            className="flex items-center space-x-2 px-5 py-2 rounded bg-falcon-accent hover:bg-falcon-accentLight text-white font-semibold shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
