import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, fullWidth = true, ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: fullWidth ? '100%' : 'auto' }}>
        {label && (
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`input ${className}`}
          style={{ borderColor: error ? 'var(--color-error)' : undefined }}
          {...props}
        />
        {error && (
          <span style={{ fontSize: '11px', color: 'var(--color-error)' }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
