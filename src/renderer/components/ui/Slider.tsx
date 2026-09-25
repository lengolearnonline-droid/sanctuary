import React, { useState, useRef, useEffect } from 'react';

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  valueFormat?: (val: number) => string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ 
    className = '', 
    value, 
    onChange, 
    min = 0, 
    max = 100, 
    step = 1, 
    label, 
    showValue = true,
    valueFormat = (v) => v.toString(),
    ...props 
  }, ref) => {
    
    // Calculate percentage for styling the track fill
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {(label || showValue) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {label && (
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </label>
            )}
            {showValue && (
              <span style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {valueFormat(value)}
              </span>
            )}
          </div>
        )}
        
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '20px' }}>
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={`slider-input ${className}`}
            style={{
              width: '100%',
              margin: 0,
              appearance: 'none',
              background: 'transparent',
              cursor: 'pointer',
              zIndex: 2,
            }}
            {...props}
          />
          
          {/* Custom Track Background */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '4px',
            transform: 'translateY(-50%)',
            background: 'var(--color-surface-border)',
            borderRadius: 'var(--radius-full)',
            zIndex: 0,
            pointerEvents: 'none'
          }} />
          
          {/* Custom Track Fill */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            width: `${percentage}%`,
            height: '4px',
            transform: 'translateY(-50%)',
            background: 'var(--color-accent)',
            borderRadius: 'var(--radius-full)',
            zIndex: 1,
            pointerEvents: 'none'
          }} />
        </div>
        
        <style>{`
          .slider-input::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.4);
            cursor: pointer;
            border: 2px solid var(--color-accent);
            transition: transform 0.1s;
          }
          .slider-input:focus-visible::-webkit-slider-thumb {
            outline: 2px solid var(--color-accent);
            outline-offset: 2px;
          }
          .slider-input:active::-webkit-slider-thumb {
            transform: scale(1.1);
          }
        `}</style>
      </div>
    );
  }
);

Slider.displayName = 'Slider';
