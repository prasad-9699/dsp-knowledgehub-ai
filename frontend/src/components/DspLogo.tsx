import React from 'react';

export interface DspLogoProps {
  /**
   * Presentation variant:
   * - 'card': Original cropped logo with signature navy background (#083A5D) and subtle border.
   * - 'transparent': Clean transparent background (white serif DSP + teal accent bar).
   * - 'badge': Square icon badge with rounded corners, perfect for compact spaces.
   * - 'full': Wide landscape banner.
   */
  variant?: 'card' | 'transparent' | 'badge' | 'full';
  /**
   * Predefined size presets or specific height in px.
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
  withGlow?: boolean;
}

const HEIGHT_MAP: Record<string, number> = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

export default function DspLogo({
  variant = 'card',
  size = 'md',
  className = '',
  style = {},
  alt = 'DSP Asset Management Logo',
  withGlow = false,
}: DspLogoProps) {
  const height = typeof size === 'number' ? size : HEIGHT_MAP[size] || 36;

  let src = '/dsp-logo.png';
  if (variant === 'transparent') {
    src = '/dsp-logo-transparent.png';
  } else if (variant === 'badge') {
    src = '/dsp-logo-square.png';
  } else if (variant === 'full') {
    src = '/dsp-logo-full.png';
  }

  const baseStyle: React.CSSProperties = {
    height: `${height}px`,
    width: 'auto',
    display: 'inline-block',
    verticalAlign: 'middle',
    objectFit: 'contain',
    borderRadius: variant === 'badge' ? `${Math.max(4, Math.round(height * 0.22))}px` : variant === 'card' ? '6px' : undefined,
    boxShadow: withGlow
      ? '0 0 16px rgba(0, 196, 176, 0.35)'
      : variant === 'card'
      ? '0 2px 6px rgba(0, 0, 0, 0.25)'
      : undefined,
    ...style,
  };

  return (
    <img
      src={src}
      alt={alt}
      className={`dsp-brand-logo dsp-logo-${variant} ${className}`}
      style={baseStyle}
      loading="eager"
    />
  );
}
