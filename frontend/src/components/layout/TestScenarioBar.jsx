import React, { useState } from 'react';
import { 
  Play, 
  Scan, 
  Zap, 
  GitFork, 
  HelpCircle, 
  AlertTriangle, 
  RotateCcw,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { useFalcon } from '../../context/FalconContext';

export const TestScenarioBar = () => {
  const { triggerSimulation, activeScenario } = useFalcon();
  const [isExpanded, setIsExpanded] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);

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
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-falcon-accentLight" />
            <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
              TEST SCENARIOS
            </span>
          </div>
          <span className="text-falcon-border">|</span>
          <span className="text-[11px] font-mono text-falcon-textDim">
            Controlled security event generation
          </span>
          {activeScenario && (
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500/30 text-amber-300">
              ACTIVE: {activeScenario}
            </span>
          )}
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-mono text-falcon-textMuted hover:text-white flex items-center space-x-1"
        >
          <span>{isExpanded ? 'Hide Panel' : 'Show Panel'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {/* 1. NORMAL TRAFFIC */}
          <button
            onClick={() => handleAction('NORMAL')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded bg-falcon-card border border-falcon-border hover:border-falcon-accent/50 text-falcon-textMain hover:text-white text-[11px] font-mono font-medium transition-all group shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">NORMAL TRAFFIC</span>
          </button>

          {/* 2. PORT SCAN */}
          <button
            onClick={() => handleAction('PORT_SCAN')}
            disabled={loadingAction !== null}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded bg-falcon-card border text-[11px] font-mono font-medium transition-all group shadow-sm ${
              activeScenario === 'PORT SCAN'
                ? 'border-orange-500 bg-orange-950/40 text-orange-200'
                : 'border-orange-900/40 hover:border-orange-500/60 text-orange-200'
            }`}
          >
            <Scan className="w-3.5 h-3.5 text-orange-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">PORT SCAN</span>
          </button>

          {/* 3. SYN BURST */}
          <button
            onClick={() => handleAction('SYN_BURST')}
            disabled={loadingAction !== null}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded bg-falcon-card border text-[11px] font-mono font-medium transition-all group shadow-sm ${
              activeScenario === 'SYN BURST'
                ? 'border-red-500 bg-red-950/40 text-red-200'
                : 'border-red-900/50 hover:border-red-500/60 text-red-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">SYN BURST</span>
          </button>

          {/* 4. ARP CONFLICT */}
          <button
            onClick={() => handleAction('ARP_CONFLICT')}
            disabled={loadingAction !== null}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded bg-falcon-card border text-[11px] font-mono font-medium transition-all group shadow-sm ${
              activeScenario === 'ARP CONFLICT'
                ? 'border-amber-500 bg-amber-950/40 text-amber-200'
                : 'border-amber-900/40 hover:border-amber-500/60 text-amber-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">ARP CONFLICT</span>
          </button>

          {/* 5. UNKNOWN DEVICE */}
          <button
            onClick={() => handleAction('UNKNOWN_DEVICE')}
            disabled={loadingAction !== null}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded bg-falcon-card border text-[11px] font-mono font-medium transition-all group shadow-sm ${
              activeScenario === 'UNKNOWN DEVICE'
                ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                : 'border-cyan-900/40 hover:border-cyan-500/60 text-cyan-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">UNKNOWN DEVICE</span>
          </button>

          {/* 6. SUSPICIOUS TRAFFIC */}
          <button
            onClick={() => handleAction('SUSPICIOUS_TRAFFIC')}
            disabled={loadingAction !== null}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded bg-falcon-card border text-[11px] font-mono font-medium transition-all group shadow-sm ${
              activeScenario === 'SUSPICIOUS TRAFFIC'
                ? 'border-yellow-500 bg-yellow-950/40 text-yellow-200'
                : 'border-yellow-900/40 hover:border-yellow-500/60 text-yellow-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">SUSPICIOUS TRAFFIC</span>
          </button>

          {/* 7. ML FLOW ANOMALY */}
          <button
            onClick={() => handleAction('ML_ANOMALY')}
            disabled={loadingAction !== null}
            className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded bg-falcon-card border text-[11px] font-mono font-medium transition-all group shadow-sm ${
              activeScenario === 'ML FLOW ANOMALY'
                ? 'border-purple-500 bg-purple-950/40 text-purple-200'
                : 'border-purple-900/40 hover:border-purple-500/60 text-purple-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">ML ANOMALY</span>
          </button>

          {/* 8. CLEAR EVENTS */}
          <button
            onClick={() => handleAction('CLEAR')}
            disabled={loadingAction !== null}
            className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded bg-falcon-surface border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-[11px] font-mono font-medium transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">CLEAR EVENTS</span>
          </button>
        </div>
      )}
    </div>
  );
};
