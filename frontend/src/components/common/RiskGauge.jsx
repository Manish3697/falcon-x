import React from 'react';

export const RiskGauge = ({ score = 0, size = 160, showDetails = true }) => {
  const normalizedScore = Math.min(10, Math.max(0, score));
  const percentage = (normalizedScore / 10) * 100;
  
  // Calculate SVG arc
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 270-degree arc
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  let color = '#10B981'; // Green
  let label = 'LOW';
  let desc = 'Normal operational baseline';

  if (normalizedScore >= 9.0) {
    color = '#EF4444'; // Red
    label = 'CRITICAL';
    desc = 'Host isolation required';
  } else if (normalizedScore >= 6.0) {
    color = '#F97316'; // Orange
    label = 'HIGH';
    desc = 'Elevated threat activity';
  } else if (normalizedScore >= 3.0) {
    color = '#EAB308'; // Yellow
    label = 'MEDIUM';
    desc = 'Suspicious anomaly observed';
  }

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-135"
          width={size}
          height={size}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1E2C48"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={arcLength}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
          {/* Value Meter */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold font-mono text-falcon-textMain">
            {normalizedScore.toFixed(1)}
          </span>
          <span className="text-[10px] font-mono tracking-wider font-semibold uppercase px-1.5 py-0.5 rounded" style={{ color: color, backgroundColor: `${color}20` }}>
            {label}
          </span>
          <span className="text-[10px] font-mono text-falcon-textDim mt-0.5">/ 10.0</span>
        </div>
      </div>

      {showDetails && (
        <div className="text-center mt-1">
          <p className="text-xs font-mono text-falcon-textMuted">{desc}</p>
        </div>
      )}
    </div>
  );
};
