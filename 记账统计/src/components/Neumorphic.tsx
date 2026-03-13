import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card = ({ children, className, inset = false, ...props }: { children: React.ReactNode, className?: string, inset?: boolean, [key: string]: any }) => (
  <div 
    {...props}
    className={cn(
      "rounded-2xl transition-all duration-300 bg-bg-neumorphic",
      inset ? "neumorphic-inset" : "neumorphic-raised",
      className
    )}
  >
    {children}
  </div>
);

export const Button = ({ 
  children, 
  className, 
  onClick, 
  active = false,
  size = 'md'
}: { 
  children: React.ReactNode, 
  className?: string, 
  onClick?: () => void,
  active?: boolean,
  size?: 'sm' | 'md' | 'lg'
}) => (
  <button 
    onClick={onClick}
    className={cn(
      "rounded-xl transition-all duration-200 flex items-center justify-center font-medium",
      active ? "neumorphic-inset text-theme-primary" : "neumorphic-raised hover:scale-[1.02] active:scale-[0.98]",
      size === 'sm' ? "px-3 py-1.5 text-sm" : size === 'lg' ? "px-8 py-3 text-lg" : "px-6 py-2",
      className
    )}
  >
    {children}
  </button>
);

export const IconButton = ({ 
  icon: Icon, 
  className, 
  onClick,
  active = false,
  size = 'md'
}: { 
  icon: any, 
  className?: string, 
  onClick?: () => void,
  active?: boolean,
  size?: 'sm' | 'md'
}) => (
  <button 
    onClick={onClick}
    className={cn(
      "rounded-full transition-all duration-200 flex items-center justify-center",
      active ? "neumorphic-inset text-theme-primary" : "neumorphic-raised hover:scale-110 active:scale-90",
      size === 'sm' ? "w-8 h-8" : "w-10 h-10",
      className
    )}
  >
    <Icon size={size === 'sm' ? 16 : 20} />
  </button>
);
