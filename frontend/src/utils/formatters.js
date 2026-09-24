export const formatBytes = (bytes, decimals = 1) => {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatBitrate = (bytesPerSec) => {
  if (!+bytesPerSec) return '0 B/s';
  return `${formatBytes(bytesPerSec)}/s`;
};

export const getSeverityClass = (severity) => {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
      return {
        bg: 'bg-red-950/80',
        text: 'text-red-400',
        border: 'border-red-600/50',
        badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
        dot: 'bg-red-500'
      };
    case 'HIGH':
      return {
        bg: 'bg-orange-950/80',
        text: 'text-orange-400',
        border: 'border-orange-600/50',
        badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
        dot: 'bg-orange-500'
      };
    case 'MEDIUM':
      return {
        bg: 'bg-yellow-950/80',
        text: 'text-yellow-400',
        border: 'border-yellow-600/50',
        badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        dot: 'bg-yellow-500'
      };
    case 'LOW':
    default:
      return {
        bg: 'bg-emerald-950/80',
        text: 'text-emerald-400',
        border: 'border-emerald-600/50',
        badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        dot: 'bg-emerald-500'
      };
  }
};

export const getStatusClass = (status) => {
  switch (status?.toUpperCase()) {
    case 'ONLINE':
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    case 'BLOCKED':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'SUSPICIOUS':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'OFFLINE':
      return 'bg-slate-700/50 text-slate-400 border border-slate-600/30';
    default:
      return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
  }
};
