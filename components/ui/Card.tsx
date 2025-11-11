import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export default function Card({ children, className = '', hover = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-gray-900 rounded-2xl border border-gray-800 shadow-soft p-4 sm:p-6 ${
        hover ? 'transition-all hover:shadow-soft-lg hover:border-gray-700' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

