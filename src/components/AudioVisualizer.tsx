import React from 'react';
import { VoiceState } from '../types';

interface AudioVisualizerProps {
  voiceState: VoiceState;
  micVolume?: number; // 0 to 100
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  voiceState,
  micVolume = 0,
  barCount = 18,
}) => {
  const isActive = voiceState === 'listening' || voiceState === 'speaking';

  // Rainbow spectral colors for the equalizer bars
  const spectralColors = [
    '#ff007a',
    '#f43f5e',
    '#ec4899',
    '#d946ef',
    '#a855f7',
    '#8b5cf6',
    '#6366f1',
    '#3b82f6',
    '#0ea5e9',
    '#06b6d4',
    '#14b8a6',
    '#10b981',
    '#22c55e',
    '#84cc16',
    '#eab308',
    '#f59e0b',
    '#f97316',
    '#ef4444',
  ];

  return (
    <div
      id="audio-visualizer"
      className="flex items-center justify-center gap-1 h-7 px-3 py-1 rounded-full bg-[var(--panel-card)] border border-[var(--panel-border)] shadow-sm backdrop-blur-md relative overflow-hidden"
    >
      {/* Subtle background glow */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-indigo-500/10 to-cyan-500/10 pointer-events-none animate-pulse" />
      )}

      {Array.from({ length: barCount }).map((_, i) => {
        let scaleFactor = 0.2;
        const animationDelay = `${(i * 0.08).toFixed(2)}s`;
        const color = spectralColors[i % spectralColors.length];

        if (voiceState === 'listening') {
          const distanceToCenter = Math.abs(i - barCount / 2) / (barCount / 2);
          const volNorm = Math.max(0.2, (micVolume / 100) * (1 - distanceToCenter * 0.6));
          scaleFactor = Math.min(1, Math.max(0.15, volNorm));
        } else if (voiceState === 'speaking') {
          const mod = (i % 5) + 1;
          scaleFactor = 0.3 + (mod / 5) * 0.7;
        }

        return (
          <span
            key={i}
            className={`w-[3px] rounded-full transition-all duration-100 ${
              isActive ? 'wave-bar' : ''
            }`}
            style={{
              height: isActive ? `${Math.max(4, Math.round(scaleFactor * 22))}px` : '4px',
              backgroundColor: isActive ? color : 'var(--text-subtle)',
              boxShadow: isActive ? `0 0 8px ${color}88` : 'none',
              animationDelay: isActive ? animationDelay : '0s',
            }}
          />
        );
      })}
    </div>
  );
};
