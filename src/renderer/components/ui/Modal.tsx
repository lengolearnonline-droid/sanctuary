import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = '500px' }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 'var(--z-modal)',
      padding: 'var(--space-4)'
    }}>
      <div 
        role="dialog"
        aria-modal="true"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-surface-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          width: '100%',
          maxWidth,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'modal-enter 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--color-surface-border)'
        }}>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </Button>
        </div>

        {/* Body */}
        <div style={{ padding: 'var(--space-4)', overflowY: 'auto' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: 'var(--space-4)',
            borderTop: '1px solid var(--color-surface-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
            background: 'var(--color-bg-tertiary)',
            borderBottomLeftRadius: 'var(--radius-lg)',
            borderBottomRightRadius: 'var(--radius-lg)',
          }}>
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes modal-enter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
