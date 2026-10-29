import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-ink/5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98';
  
  const variants = {
    primary: 'bg-primary hover:bg-primary-hover active:bg-primary-active text-on-primary border border-transparent shadow-sm',
    secondary: 'bg-secondary hover:bg-secondary-hover text-on-secondary border border-hairline shadow-sm',
    outline: 'bg-transparent border border-hairline hover:bg-surface-soft text-ink',
    danger: 'bg-error hover:bg-error/90 text-white border border-transparent shadow-sm',
    ghost: 'bg-transparent hover:bg-surface-soft text-muted hover:text-ink',
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs h-9',
    md: 'px-5 py-2.5 text-sm h-10',
    lg: 'px-7 py-3 text-base h-12',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
