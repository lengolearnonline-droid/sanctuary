import React from 'react';

interface PanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  headerActions?: React.ReactNode;
  noPadding?: boolean;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className = '', title, headerActions, noPadding = false, children, ...props }, ref) => {
    return (
      <div ref={ref} className={`panel ${className}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', ...props.style }} {...props}>
        {(title || headerActions) && (
          <div className="panel-header">
            <div>{title}</div>
            {headerActions && <div>{headerActions}</div>}
          </div>
        )}
        <div style={{ padding: noPadding ? 0 : 'var(--space-4)', flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </div>
    );
  }
);

Panel.displayName = 'Panel';

export const Card = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className = '', title, children, noPadding = false, ...props }, ref) => {
    // Card is essentially a panel but usually without flex-1 height constraints, meant for flowing content
    return (
      <div ref={ref} className={`panel ${className}`} style={{ marginBottom: 'var(--space-4)', ...props.style }} {...props}>
        {title && (
          <div className="panel-header">
            <div>{title}</div>
          </div>
        )}
        <div style={{ padding: noPadding ? 0 : 'var(--space-4)' }}>
          {children}
        </div>
      </div>
    );
  }
);

Card.displayName = 'Card';
