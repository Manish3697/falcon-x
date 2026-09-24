import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Cpu, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Sliders, 
  Server, 
  Wifi,
  Radio,
  Flame
} from 'lucide-react';
import { useFalcon } from '../../context/FalconContext';

export const Sidebar = () => {
  const { activeTab, setActiveTab, systemStatus, isStreaming } = useFalcon();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'traffic', label: 'Live Traffic', icon: Activity },
    { id: 'devices', label: 'Devices', icon: Wifi },
    { id: 'alerts', label: 'Alerts', icon: ShieldAlert },
    { id: 'risk', label: 'Risk Analysis', icon: Flame },
    { id: 'rules', label: 'Network Rules', icon: ShieldCheck },
    { id: 'logs', label: 'Event Logs', icon: FileText },
    { id: 'status', label: 'System Status', icon: Server },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  const currentHost = systemStatus?.host_specs?.current_host?.name || 'Linux Host';

  return (
    <aside className="w-64 bg-falcon-surface border-r border-falcon-border flex flex-col justify-between select-none h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-falcon-border flex items-center space-x-3 bg-falcon-bg/40">
          <div className="w-9 h-9 rounded bg-falcon-accent/15 border border-falcon-accent/40 flex items-center justify-center text-falcon-accentLight">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-mono font-black text-lg tracking-wider text-white">FALCON-X</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-falcon-accent/20 border border-falcon-accent/30 text-falcon-accentLight rounded">
                EDGE
              </span>
            </div>
            <p className="text-[11px] font-mono text-falcon-textDim">IoT Security Appliance</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-falcon-accent/15 border border-falcon-accent/40 text-white shadow-sm'
                    : 'text-falcon-textMuted hover:text-white hover:bg-falcon-card/80 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-falcon-accentLight' : 'text-falcon-textDim'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Edge Hardware Badge (Section 13) */}
      <div className="p-4 border-t border-falcon-border bg-falcon-bg/60 space-y-3">
        <div className="bg-falcon-card border border-falcon-border/60 rounded p-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1">
            <span className="text-falcon-textDim">SYSTEM STATUS</span>
            <span className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
              <span className={isStreaming ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {isStreaming ? 'ONLINE' : 'OFFLINE'}
              </span>
            </span>
          </div>

          <div className="border-t border-falcon-border/40 pt-1.5 mt-1.5 text-[10px] font-mono text-falcon-textDim space-y-0.5">
            <div className="flex justify-between">
              <span>HOST:</span>
              <span className="text-falcon-textMuted truncate max-w-[125px]" title={currentHost}>
                {currentHost.split('(')[0].trim()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>TARGET:</span>
              <span className="text-falcon-accentLight">Raspberry Pi 4B</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] font-mono text-falcon-textDim tracking-wide">FALCON-X Platform</p>
        </div>
      </div>
    </aside>
  );
};
