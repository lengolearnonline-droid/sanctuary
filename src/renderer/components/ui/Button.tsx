import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'secondary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Determine base classes
    const baseClass = 'btn';
    
    // Variant classes
    const variantClasses = {
      primary: 'btn-primary',
      secondary: '', // default in css
      danger: 'btn-danger',
      ghost: 'btn-ghost',
    };
    
    // Size classes
    const sizeClasses = {
      sm: 'btn-sm',
      md: '',
      lg: 'btn-lg',
      icon: 'btn-icon',
    };

    const combinedClassName = [
      baseClass,
      variantClasses[variant],
      sizeClasses[size],
      className
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="spinner" style={{ marginRight: children ? '6px' : '0' }}>
            {/* Simple CSS spinner placeholder, can refine later */}
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </span>
        )}
        
        {!isLoading && Icon && iconPosition === 'left' && (
          <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
        )}
        
        {children}
        
        {!isLoading && Icon && iconPosition === 'right' && (
          <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
