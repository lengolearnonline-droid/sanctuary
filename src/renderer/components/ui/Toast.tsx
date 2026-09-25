import React from 'react';
import { create } from 'zustand';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    
    // Auto remove
    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration || 3000);
    }
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// Provide a convenient non-hook API for triggering toasts from anywhere
export const toast = {
  success: (title: string, description?: string, duration?: number) => useToastStore.getState().addToast({ type: 'success', title, description, duration }),
  error: (title: string, description?: string, duration?: number) => useToastStore.getState().addToast({ type: 'error', title, description, duration }),
  warning: (title: string, description?: string, duration?: number) => useToastStore.getState().addToast({ type: 'warning', title, description, duration }),
  info: (title: string, description?: string, duration?: number) => useToastStore.getState().addToast({ type: 'info', title, description, duration }),
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(var(--statusbar-height) + var(--space-4))',
      right: 'var(--space-4)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      zIndex: 'var(--z-toast)',
      pointerEvents: 'none', // Allow clicking through the container
    }}>
      {toasts.map((t) => (
        <div key={t.id} className="toast" style={{
          position: 'relative',
          bottom: 'auto', right: 'auto', // override absolute positioning from css class
          pointerEvents: 'auto',
          minWidth: '280px',
          borderLeft: `4px solid ${getToastColor(t.type)}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                {t.title}
              </div>
              {t.description && (
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  {t.description}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-tertiary)',
                cursor: 'pointer',
                padding: '0 0 0 var(--space-2)',
                fontSize: '16px'
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function getToastColor(type: ToastType): string {
  switch (type) {
    case 'success': return 'var(--color-success)';
    case 'error': return 'var(--color-error)';
    case 'warning': return 'var(--color-warning)';
    case 'info':
    default: return 'var(--color-info)';
  }
}
