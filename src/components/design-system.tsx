// Add these styles or a design system
import React from 'react';

// Color palette
export const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
    warning: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    danger: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
  }
};

// Animation keyframes
export const animations = {
  fadeIn: 'fadeIn 0.3s ease-out',
  slideUp: 'slideUp 0.3s ease-out',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
};

// Common component styles
export const cardStyles = {
  base: 'rounded-2xl bg-white shadow-lg border border-slate-200/60 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
  hover: 'hover:shadow-2xl hover:border-slate-300/80',
  interactive: 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
};

export const buttonStyles = {
  primary: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl hover:opacity-95 active:scale-95 transition-all duration-200',
  secondary: 'bg-white text-slate-700 font-medium rounded-xl px-5 py-2.5 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all duration-200',
  danger: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-xl px-6 py-3 shadow-lg hover:shadow-xl hover:opacity-95 active:scale-95 transition-all duration-200',
  ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg px-4 py-2 transition-colors duration-200',
};

// Loading skeleton component
export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg ${className}`} />
  );
}

// Enhanced Card Component
interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}

export function EnhancedCard({ 
  children, 
  className = '', 
  hover = true, 
  interactive = false,
  onClick 
}: EnhancedCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`
        ${cardStyles.base}
        ${hover ? cardStyles.hover : ''}
        ${interactive ? cardStyles.interactive : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}