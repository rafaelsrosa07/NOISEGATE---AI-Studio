import React from 'react';
import { playClickSound } from '../services/audio';

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'outline';
  isLoading?: boolean;
}

const CyberButton: React.FC<CyberButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '',
  onClick,
  disabled,
  ...props 
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading) {
      playClickSound();
      onClick?.(e);
    }
  };

  const baseStyles = "relative px-6 py-3 font-mono text-sm font-bold uppercase tracking-widest transition-all duration-200 clip-path-slant disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden";
  
  const variants = {
    primary: "bg-emerald-500 text-black hover:bg-emerald-400 active:translate-y-0.5",
    danger: "bg-red-500 text-black hover:bg-red-400 active:translate-y-0.5",
    outline: "bg-transparent border border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 active:translate-y-0.5",
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Glitch effect overlay */}
      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
      
      <span className="relative z-10 flex items-center justify-center gap-2">
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </span>
    </button>
  );
};

export default CyberButton;