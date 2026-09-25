import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'live' | 'preview' | 'success' | 'warning' | 'error' | 'info';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    
    // Default class matches the design system
    let combinedClassName = 'badge';
    
    // Add specific variants defined in CSS
    if (variant === 'live') combinedClassName += ' badge-live';
    else if (variant === 'preview') combinedClassName += ' badge-preview';
    
    // Custom inline styles for variants not explicitly defined in the main CSS yet
    // but useful for a complete component library
    const getStyle = () => {
      switch (variant) {
        case 'success': return { background: 'var(--color-success-subtle)', color: 'var(--color-success)' };
        case 'warning': return { background: 'var(--color-warning-subtle)', color: 'var(--color-warning)' };
        case 'error': return { background: 'var(--color-error-subtle)', color: 'var(--color-error)' };
        case 'info': return { background: 'var(--color-info-subtle)', color: 'var(--color-info)' };
        case 'default':
        default: return { background: 'var(--color-bg-elevated)', color: 'var(--color-text-secondary)' };
      }
    };
    
    const inlineStyle = (variant !== 'live' && variant !== 'preview') ? getStyle() : {};

    return (
      <span
        ref={ref}
        className={`${combinedClassName} ${className}`}
        style={{ ...inlineStyle, ...props.style }}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
