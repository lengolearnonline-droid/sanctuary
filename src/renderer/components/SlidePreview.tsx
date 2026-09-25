import React from 'react';
import type { Slide } from '../../shared/types';
import { SlideRenderer } from './presentation/SlideRenderer';

interface SlidePreviewProps {
  slide: Slide | null;
  label?: string;
  variant?: 'live' | 'preview';
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function SlidePreview({ slide, label, variant = 'preview', onClick, style }: SlidePreviewProps) {
  const isLive = variant === 'live';
  
  // Theme colors based on variant
  const borderColor = isLive ? 'var(--color-program)' : 'var(--color-preview)';
  const labelBg = isLive ? 'var(--color-program)' : 'var(--color-preview)';
  const labelColor = '#fff';

  return (
    <div 
      className="slide-preview-container"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        aspectRatio: '16/9',
        margin: '0 auto',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onClick={onClick}
    >
      {label && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          background: labelBg,
          color: labelColor,
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottomRightRadius: '4px',
          zIndex: 10,
        }}>
          {label}
        </div>
      )}
      
      <div 
        className="slide-preview-aspect"
        style={{
          width: '100%',
          height: '100%',
          background: '#000',
          border: `2px solid ${borderColor}`,
          borderRadius: '4px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'border-color 0.2s ease',
        }}
      >
        <SlideRenderer slide={slide} isBlackout={false} isPreview={true} />
      </div>
    </div>
  );
}
