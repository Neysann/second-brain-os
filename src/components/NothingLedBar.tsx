'use client';

import React from 'react';

interface NothingLedBarProps {
  value: number;
  max?: number;
  segments?: number;
  color?: 'red' | 'white' | 'mixed';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NothingLedBar: React.FC<NothingLedBarProps> = ({
  value,
  max = 100,
  segments = 14,
  color = 'red',
  className = '',
  size = 'md',
}) => {
  const percentage = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));
  const activeCount = Math.round((percentage / 100) * segments);

  const dotSize =
    size === 'sm'
      ? 'w-1.5 h-1.5'
      : size === 'lg'
      ? 'w-2.5 h-2.5'
      : 'w-2 h-2';

  return (
    <div
      className={`flex items-center gap-1.5 ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
    >
      {Array.from({ length: segments }).map((_, idx) => {
        const isActive = idx < activeCount;
        const isRed = color === 'red' || (color === 'mixed' && idx >= segments - 3);

        return (
          <span
            key={idx}
            className={`${dotSize} rounded-full transition-all duration-300 ${
              isActive
                ? isRed
                  ? 'bg-[#D71920] shadow-[0_0_8px_rgba(215,25,32,0.85)] scale-105'
                  : 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.75)] scale-105'
                : 'bg-zinc-800/80 border border-white/5 opacity-40'
            }`}
          />
        );
      })}
    </div>
  );
};

export default NothingLedBar;
