import React from 'react';
import { Network, Server, Clock, Shield, AlertOctagon, CheckCircle2, Activity, Zap } from 'lucide-react';
import { useFalcon } from '../../context/FalconContext';

export const Header = () => {
  const { systemStatus, lastUpdate, notification, activeScenario } = useFalcon();

  const hostname = systemStatus?.host_specs?.current_host?.hostname || 'edge-host';
  const subnet = systemStatus?.network_subnet || '192.168.1.0/24';

  return (
    <header className="bg-falcon-surface border-b border-falcon-border sticky top-0 z-30">
      {/* Toast Notification Banner if active */}
      {notification && (
        <div className={`px-4 py-1.5 text-xs font-mono font-medium flex items-center justify-between transition-all duration-300 ${
          notification.type === 'critical' ? 'bg-red-950 text-red-300 border-b border-red-700' :
          notification.type === 'warning' ? 'bg-orange-950 text-orange-300 border-b border-orange-700' :
          'bg-falcon-card text-falcon-accentLight border-b border-falcon-border'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'critical' ? <AlertOctagon className="w-4 h-4 animate-bounce text-red-400" /> :
             notification.type === 'warning' ? <Shield className="w-4 h-4 text-orange-400" /> :
             <CheckCircle2 className="w-4 h-4 text-falcon-accentLight" />}
            <span>{notification.message}</span>
          </div>
          <span className="text-[10px] opacity-75 font-mono">TELEMETRY SYNC</span>
        </div>
      )}

      {/* Main Top Header (Section 12) */}
      <div className="px-6 py-3.5 flex items-center justify-between">
        {/* Left Network & System Indicators */}
        <div className="flex items-center space-x-6">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold font-mono text-white tracking-wider">FALCON-X</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                ONLINE
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-5 text-xs font-mono border-l border-falcon-border pl-6 text-falcon-textMuted">
            <div className="flex items-center space-x-1.5">
              <Network className="w-3.5 h-3.5 text-falcon-accentLight" />
              <span className="text-falcon-textDim">Network:</span>
              <span className="text-white font-medium">{subnet}</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5 text-falcon-accentLight" />
              <span className="text-falcon-textDim">Host:</span>
              <span className="text-white font-medium">{hostname}</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-falcon-textDim">Monitoring:</span>
              <span className="text-emerald-400 font-bold">ACTIVE</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-falcon-accentLight" />
              <span className="text-falcon-textDim">Last update:</span>
              <span className="text-white font-mono">{lastUpdate}</span>
            </div>
          </div>
        </div>

        {/* Right Active Status Indicator */}
        <div className="flex items-center space-x-3">
          {activeScenario ? (
            <div className="flex items-center space-x-2 px-3 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-semibold text-[11px] uppercase tracking-wider">
                TEST SCENARIO ACTIVE: <span className="text-white font-bold">{activeScenario}</span>
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium text-[11px] uppercase tracking-wider">
                BASELINE MONITORING
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
