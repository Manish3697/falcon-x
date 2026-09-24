import React from 'react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, tag, accentColor = 'blue', statusIndicator }) => {
  const borderAccents = {
    blue: 'border-falcon-border hover:border-falcon-accent/50',
    red: 'border-red-900/50 hover:border-red-500/50',
    orange: 'border-orange-900/50 hover:border-orange-500/50',
    green: 'border-emerald-900/50 hover:border-emerald-500/50',
  };

  const iconColors = {
    blue: 'text-falcon-accentLight bg-falcon-accent/10 border-falcon-accent/20',
    red: 'text-red-400 bg-red-500/10 border-red-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <div className={`bg-falcon-card border ${borderAccents[accentColor]} rounded-lg p-4 transition-all duration-200 flex flex-col justify-between shadow-sm relative overflow-hidden group`}>
      {/* Background subtle highlight */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-falcon-textMuted font-mono">
          {title}
        </span>
        {Icon && (
          <div className={`p-1.5 rounded border ${iconColors[accentColor]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div className="text-2xl font-bold font-mono text-falcon-textMain tracking-tight">
          {value}
        </div>
        {tag && (
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-falcon-surface border border-falcon-border text-falcon-textMuted">
            {tag}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-2 text-xs text-falcon-textDim flex items-center justify-between border-t border-falcon-border/40 pt-2 font-mono">
          <span>{subtitle}</span>
          {statusIndicator && (
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 text-[10px] uppercase font-bold">{statusIndicator}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
