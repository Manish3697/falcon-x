import React from 'react';
import { getSeverityClass, getStatusClass } from '../../utils/formatters';

export const SeverityBadge = ({ severity }) => {
  const styles = getSeverityClass(severity);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium tracking-wide ${styles.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${styles.dot}`}></span>
      {severity?.toUpperCase()}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const cls = getStatusClass(status);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium tracking-wide ${cls}`}>
      {status?.toUpperCase()}
    </span>
  );
};

export const RiskBadge = ({ score }) => {
  let colorCls = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (score >= 9.0) colorCls = 'bg-red-500/20 text-red-400 border-red-500/30';
  else if (score >= 6.0) colorCls = 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  else if (score >= 3.0) colorCls = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

  return (
    <span className={`inline-flex items-center justify-center font-mono font-bold text-xs px-2 py-0.5 rounded border ${colorCls}`}>
      {score.toFixed(1)} / 10
    </span>
  );
};
