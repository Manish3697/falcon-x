import React, { useState } from 'react';
import { 
  Play, 
  Scan, 
  Zap, 
  GitFork, 
  HelpCircle, 
  AlertTriangle, 
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useFalcon } from '../../context/FalconContext';

export const DemoControlBar = () => {
  const { triggerSimulation, demoMode } = useFalcon();
  const [isExpanded, setIsExpanded] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);

  if (!demoMode) return null;

  const handleAction = async (type) => {
    setLoadingAction(type);
    try {
      await triggerSimulation(type);
    } finally {
      setTimeout(() => setLoadingAction(null), 500);
    }
  };

  return (
    <div className="bg-falcon-surface border-b border-falcon-border px-6 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-white tracking-wide uppercase">
            Expo Demonstration Scenarios
          </span>
          <span className="text-[10px] font-mono text-falcon-textDim hidden sm:inline">
            (Interactive Scenario Trigger Panel)
          </span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-mono text-falcon-textMuted hover:text-white flex items-center space-x-1"
        >
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          <button
            onClick={() => handleAction('NORMAL')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded bg-falcon-card border border-falcon-border hover:border-falcon-accent/50 text-falcon-textMain hover:text-white text-[11px] font-mono transition-all group"
          >
            <Play className="w-3 h-3 text-emerald-400" />
            <span className="truncate">Normal Traffic</span>
          </button>

          <button
            onClick={() => handleAction('PORT_SCAN')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded bg-falcon-card border border-orange-900/40 hover:border-orange-500/60 text-orange-200 text-[11px] font-mono transition-all group"
          >
            <Scan className="w-3 h-3 text-orange-400" />
            <span className="truncate">Port Scan</span>
          </button>

          <button
            onClick={() => handleAction('SYN_BURST')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded bg-falcon-card border border-red-900/50 hover:border-red-500/60 text-red-200 text-[11px] font-mono transition-all group"
          >
            <Zap className="w-3 h-3 text-red-400" />
            <span className="truncate">SYN Burst</span>
          </button>

          <button
            onClick={() => handleAction('ARP_CONFLICT')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded bg-falcon-card border border-amber-900/40 hover:border-amber-500/60 text-amber-200 text-[11px] font-mono transition-all group"
          >
            <GitFork className="w-3 h-3 text-amber-400" />
            <span className="truncate">ARP Conflict</span>
          </button>

          <button
            onClick={() => handleAction('UNKNOWN_DEVICE')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded bg-falcon-card border border-cyan-900/40 hover:border-cyan-500/60 text-cyan-200 text-[11px] font-mono transition-all group"
          >
            <HelpCircle className="w-3 h-3 text-cyan-400" />
            <span className="truncate">Unknown Device</span>
          </button>

          <button
            onClick={() => handleAction('SUSPICIOUS_TRAFFIC')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded bg-falcon-card border border-yellow-900/40 hover:border-yellow-500/60 text-yellow-200 text-[11px] font-mono transition-all group"
          >
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
            <span className="truncate">Suspicious Port</span>
          </button>

          <button
            onClick={() => handleAction('CLEAR')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded bg-falcon-surface border border-slate-700 hover:border-slate-500 text-slate-300 text-[11px] font-mono transition-all col-span-2 sm:col-span-1"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span className="truncate">Clear Events</span>
          </button>
        </div>
      )}
    </div>
  );
};
