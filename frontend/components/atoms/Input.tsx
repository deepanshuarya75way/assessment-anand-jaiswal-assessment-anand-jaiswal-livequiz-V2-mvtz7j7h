import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, className = '', ...props }, ref) => {
    const containerStyle = fullWidth ? 'w-full' : '';
    
    return (
      <div className={`flex flex-col gap-1.5 ${containerStyle}`}>
        {label && (
          <label className="text-xs font-semibold text-muted tracking-wide uppercase px-0.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            px-3.5 py-2.5 bg-canvas border rounded-md text-ink placeholder-muted-soft
            transition-all duration-200 outline-none text-sm h-10
            ${error ? 'border-error focus:ring-4 focus:ring-error/5 focus:border-error' : 'border-hairline focus:border-ink focus:ring-4 focus:ring-ink/5'}
            ${fullWidth ? 'w-full' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-400 font-medium">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
