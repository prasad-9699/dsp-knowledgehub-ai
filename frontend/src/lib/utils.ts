/**
 * Utility functions for the DSP Investment Platform.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number using Indian numbering convention.
 * e.g., 12500000 → "1,25,00,000"
 */
export function formatIndianNumber(num: number): string {
  if (isNaN(num)) return '—';
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const parts = absNum.toFixed(2).split('.');
  let intPart = parts[0];
  const decPart = parts[1];

  // Indian grouping: last 3 digits, then groups of 2
  if (intPart.length > 3) {
    const lastThree = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const grouped = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    intPart = grouped + ',' + lastThree;
  }

  return `${isNegative ? '-' : ''}${intPart}.${decPart}`;
}

/**
 * Format currency in INR with Indian conventions.
 * Small: ₹1,25,000
 * Lakhs: ₹12.5 L
 * Crores: ₹125.8 Cr
 */
export function formatINR(value: number, compact: boolean = true): string {
  if (isNaN(value) || value === null || value === undefined) return '—';

  if (compact) {
    const absValue = Math.abs(value);
    if (absValue >= 1e9) {
      // Hundreds of crores
      return `₹${(value / 1e7).toFixed(0)} Cr`;
    } else if (absValue >= 1e7) {
      return `₹${(value / 1e7).toFixed(1)} Cr`;
    } else if (absValue >= 1e5) {
      return `₹${(value / 1e5).toFixed(1)} L`;
    }
  }

  return `₹${formatIndianNumber(value)}`;
}

/**
 * Format a percentage value.
 */
export function formatPct(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Format a date in Indian-friendly format.
 */
export function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format datetime in Indian format with IST.
 */
export function formatDateTime(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  }) + ' IST';
}

/**
 * Determine CSS class for positive/negative values.
 */
export function changeClass(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return value >= 0 ? 'positive' : 'negative';
}

/**
 * Color for change indicators.
 */
export function changeColor(value: number): string {
  return value >= 0 ? 'var(--color-positive)' : 'var(--color-negative)';
}
