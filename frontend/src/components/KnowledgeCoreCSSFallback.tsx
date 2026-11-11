import React from 'react';

export type AssistantCoreState = 'idle' | 'processing' | 'answered';

export default function KnowledgeCoreCSSFallback({
  state = 'idle',
  size = 'md',
  className = '',
}: {
  state?: AssistantCoreState;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizePx = size === 'sm' ? 140 : size === 'lg' ? 260 : 200;
  const isProcessing = state === 'processing';

  return (
    <div
      className={`knowledge-core-fallback ${className}`}
      style={{
        width: sizePx,
        height: sizePx,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
      }}
      aria-label="DSP KnowledgeHub AI Core visual representation"
      role="img"
    >
      {/* Outer Glow Ring */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: isProcessing
            ? 'radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, rgba(2, 132, 199, 0.05) 70%, transparent 100%)'
            : 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, rgba(3, 105, 161, 0.03) 70%, transparent 100%)',
          animation: isProcessing ? 'core-pulse 1.2s infinite ease-in-out' : 'core-pulse 4s infinite ease-in-out',
        }}
      />

      {/* Rotating Dashed Geodesic Ring */}
      <div
        style={{
          position: 'absolute',
          width: sizePx * 0.85,
          height: sizePx * 0.85,
          borderRadius: '50%',
          border: '1.5px dashed rgba(56, 189, 248, 0.6)',
          animation: isProcessing ? 'core-spin 4s linear infinite' : 'core-spin 18s linear infinite',
        }}
      />

      {/* Counter-Rotating Orbital Ring */}
      <div
        style={{
          position: 'absolute',
          width: sizePx * 0.7,
          height: sizePx * 0.7,
          borderRadius: '50%',
          border: '1px solid rgba(125, 211, 252, 0.4)',
          transform: 'rotateX(60deg) rotateY(25deg)',
          animation: 'core-spin-reverse 12s linear infinite',
        }}
      />

      {/* Central Prismatic Core */}
      <div
        style={{
          width: sizePx * 0.45,
          height: sizePx * 0.45,
          borderRadius: '28%',
          background: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 60%, #0369a1 100%)',
          boxShadow: isProcessing
            ? '0 0 35px rgba(56, 189, 248, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.5)'
            : '0 0 24px rgba(14, 165, 233, 0.45), inset 0 0 14px rgba(255, 255, 255, 0.4)',
          transform: 'rotate(45deg)',
          animation: isProcessing ? 'core-breath 1s ease-in-out infinite' : 'core-breath 3.5s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 800,
          fontSize: size === 'sm' ? '0.75rem' : '0.9rem',
          letterSpacing: '0.05em',
        }}
      >
        <span style={{ transform: 'rotate(-45deg)' }}>DSP</span>
      </div>

      <style>{`
        @keyframes core-pulse {
          0%, 100% { transform: scale(0.96); opacity: 0.7; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes core-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes core-spin-reverse {
          from { transform: rotateX(60deg) rotateY(25deg) rotate(360deg); }
          to { transform: rotateX(60deg) rotateY(25deg) rotate(0deg); }
        }
        @keyframes core-breath {
          0%, 100% { transform: rotate(45deg) scale(0.95); }
          50% { transform: rotate(45deg) scale(1.06); }
        }
      `}</style>
    </div>
  );
}
