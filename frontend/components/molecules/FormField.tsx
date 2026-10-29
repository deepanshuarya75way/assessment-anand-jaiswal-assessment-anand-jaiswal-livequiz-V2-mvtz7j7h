import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

export default function FormField({
  label,
  error,
  children,
  required = false,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-muted tracking-wide uppercase flex items-center gap-1 px-0.5">
        {label}
        {required && <span className="text-error font-bold">*</span>}
      </label>
      {children}
      {error && (
        <span className="text-xs text-red-400 font-medium px-0.5 animate-slide-up">
          {error}
        </span>
      )}
    </div>
  );
}
