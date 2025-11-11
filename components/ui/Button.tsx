import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation inline-flex items-center justify-center';
  
  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover focus:ring-accent shadow-sm hover:shadow-lg',
    secondary: 'bg-gray-800 hover:bg-gray-700 text-white focus:ring-accent border border-gray-700 hover:border-gray-600',
    outline: 'border-2 border-gray-700 text-white hover:border-accent hover:text-accent focus:ring-accent',
    ghost: 'text-gray-300 hover:bg-gray-800 hover:text-white focus:ring-accent',
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[40px]',
    md: 'px-4 py-2.5 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
