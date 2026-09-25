import React, { useRef, useEffect } from 'react';
import { Slide, Theme, ThemeLayout } from '../../../shared/types';
import { motion, AnimatePresence } from 'framer-motion';

// --- Bespoke Lower Third Graphic ---

const AutoShrinkText = ({ text, style, align }: { text: string, style: any, align: string }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (!contentRef.current) return;
    const wrapper = contentRef.current.closest('.slide-content-wrapper') as HTMLElement;
    if (!wrapper) return;
    
    let currentEm = 1.0;
    contentRef.current.style.fontSize = currentEm + 'em';
    
    // Force layout recalculation
    void wrapper.scrollHeight;
    
    let loopCount = 0;
    while (wrapper.scrollHeight > wrapper.clientHeight && currentEm > 0.2 && loopCount < 50) {
      currentEm -= 0.05;
      contentRef.current.style.fontSize = currentEm + 'em';
      void wrapper.scrollHeight;
      loopCount++;
    }
  }, [text, style]);

  return (
    <div 
      ref={contentRef} 
      style={{ 
        ...style,
        width: '100%',
        willChange: 'font-size'
      }}
    >
      {text}
    </div>
  );
};

// --- Bespoke Lower Third Graphic ---
const LowerThirdGraphic = ({ data }: { data: any }) => {
  if (!data) return null;

  const isModern = data.template === 'modern';
  const isGlassy = data.template === 'glassy';

  if (isModern) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        borderLeft: '0.8cqw solid #3B82F6',
        paddingLeft: '2cqw',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        padding: '2cqw 4cqw',
        borderRadius: '1cqw',
        boxShadow: '0 1cqw 3cqw rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)',
        maxWidth: '80%',
        marginLeft: '4cqw'
      }}>
        <div style={{ fontSize: '4cqw', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2 }}>
          {data.personName}
        </div>
        {(data.title || data.organization) && (
          <div style={{ fontSize: '2cqw', fontWeight: 500, color: '#9CA3AF', marginTop: '0.5cqh', textTransform: 'uppercase', letterSpacing: '0.2cqw' }}>
            {data.title}{data.title && data.organization ? ' | ' : ''}{data.organization}
          </div>
        )}
      </div>
    );
  }

  if (isGlassy) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '2.5cqw 4cqw',
        borderRadius: '1.5cqw',
        boxShadow: '0 1cqw 4cqw rgba(0,0,0,0.3), inset 0 0.1cqw 0.1cqw rgba(255,255,255,0.2)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        maxWidth: '80%',
        marginLeft: '5cqw'
      }}>
        <div style={{ fontSize: '4cqw', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1, textShadow: '0 0.2cqw 0.5cqw rgba(0,0,0,0.5)' }}>
          {data.personName}
        </div>
        {(data.title || data.organization) && (
          <div style={{ fontSize: '2cqw', fontWeight: 400, color: '#E2E8F0', marginTop: '0.8cqh', textShadow: '0 0.1cqw 0.3cqw rgba(0,0,0,0.5)' }}>
            {data.title}{data.title && data.organization ? ' • ' : ''}{data.organization}
          </div>
        )}
      </div>
    );
  }

  
  if (data.template === 'sermon_topic') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: '#1E293B',
        padding: '2cqw 4cqw',
        borderLeft: '1.5cqw solid #F59E0B',
        boxShadow: '0 1cqw 3cqw rgba(0,0,0,0.6)',
        maxWidth: '85%',
        marginLeft: '4cqw'
      }}>
        <div style={{ fontSize: '2cqw', fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.2cqw', marginBottom: '0.5cqh' }}>
          {data.organization || 'SERMON TOPIC'}
        </div>
        <div style={{ fontSize: '4.5cqw', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
          {data.personName}
        </div>
        {data.title && (
          <div style={{ fontSize: '2.5cqw', fontWeight: 400, color: '#cbd5e1', marginTop: '0.5cqh', fontStyle: 'italic' }}>
            {data.title}
          </div>
        )}
      </div>
    );
  }

  if (data.template === 'song_ministration') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '1.5cqw 4cqw',
        borderRadius: '5cqw',
        border: '0.2cqw solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(8px)',
        maxWidth: '80%',
        marginLeft: '5cqw',
        gap: '2cqw'
      }}>
        <div style={{ width: '4cqw', height: '4cqw', borderRadius: '50%', backgroundColor: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '2cqw' }}>🎵</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '3.5cqw', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>
            {data.personName}
          </div>
          {(data.title || data.organization) && (
            <div style={{ fontSize: '1.8cqw', fontWeight: 500, color: '#FBCFE8', marginTop: '0.2cqh', textTransform: 'uppercase' }}>
              {data.title}{data.title && data.organization ? ' • ' : ''}{data.organization}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (data.template === 'testimony') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: '#FFFFFF',
        padding: '2cqw 4cqw',
        borderRadius: '0 2cqw 2cqw 2cqw',
        borderTop: '0.8cqw solid #10B981',
        boxShadow: '0 1cqw 3cqw rgba(0,0,0,0.5)',
        maxWidth: '80%',
        marginLeft: '5cqw'
      }}>
        <div style={{ fontSize: '4cqw', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
          {data.personName}
        </div>
        {(data.title || data.organization) && (
          <div style={{ fontSize: '2cqw', fontWeight: 600, color: '#10B981', marginTop: '0.5cqh', textTransform: 'uppercase' }}>
            {data.title || 'TESTIMONY'}{data.organization ? ` - ${data.organization}` : ''}
          </div>
        )}
      </div>
    );
  }

  // Classic Template
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#0F172A',
      padding: '2cqw 4cqw',
      borderRadius: '1cqw',
      boxShadow: '0 1cqw 3cqw rgba(0,0,0,0.5)',
      maxWidth: '80%',
      borderBottom: '0.5cqw solid #3B82F6',
      marginLeft: '5cqw'
    }}>
      <div style={{ fontSize: '4.5cqw', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.1cqw', lineHeight: 1.1 }}>
        {data.personName}
      </div>
      {(data.title || data.organization) && (
        <div style={{ fontSize: '2.5cqw', fontWeight: 400, color: '#E2E8F0', marginTop: '0.5cqh' }}>
          {data.title}{data.title && data.organization ? ' • ' : ''}{data.organization}
        </div>
      )}
    </div>
  );
};

interface SlideRendererProps {
  slide: Slide | null;
  isBlackout: boolean;
  isPreview?: boolean;
}

export function SlideRenderer({ slide, isBlackout, isPreview = false }: SlideRendererProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // If not in preview, force un-mute due to React autoPlay/muted bug
    if (!isPreview && videoRef.current) {
      videoRef.current.muted = false;
    }

    if (!isPreview) {
      // Expose to window for bulletproof access from program.tsx
      (window as any).__sanctuary_active_video = videoRef.current;
      (window as any).__sanctuary_bg_video = bgVideoRef.current;
    }

    if (isPreview) return;

    const unsub = window.sanctuary?.presentation?.onMediaCommand?.((data: string) => {
      try {
        const cmd = JSON.parse(data);
        const videos: HTMLVideoElement[] = [];
        
        // Grab from refs directly OR fallback to global window if closure is stale
        const v = videoRef.current || (window as any).__sanctuary_active_video;
        const bg = bgVideoRef.current || (window as any).__sanctuary_bg_video;
        
        if (v) videos.push(v);
        if (bg) videos.push(bg);

        // Also just grab by tag name as an absolute fallback
        document.querySelectorAll('video').forEach(vid => {
          if (!videos.includes(vid)) videos.push(vid);
        });

        videos.forEach(video => {
          if (cmd.action === 'play') video.play().catch(() => {});
          if (cmd.action === 'pause') video.pause();
          if (cmd.action === 'volume') {
            video.volume = cmd.value;
            video.muted = cmd.value <= 0;
          }
        });
      } catch (e) {
        console.error('Failed to parse media command', e);
      }
    });

    return () => {
      if (!isPreview) {
        (window as any).__sanctuary_active_video = null;
        (window as any).__sanctuary_bg_video = null;
      }
      if (unsub) unsub();
    };
  }, [isPreview, slide]);
  // Determine animation variants based on theme transition type
  const getVariants = (theme?: Theme) => {
    const type = theme?.animation?.transitionType || 'fade';
    const duration = (theme?.animation?.transitionDuration || 500) / 1000;

    const transition = { duration, ease: 'easeInOut' as const };

    switch (type) {
      case 'cut':
        return {
          initial: { opacity: 1 },
          animate: { opacity: 1, transition: { duration: 0 } },
          exit: { opacity: 0, transition: { duration: 0 } },
        };
      case 'slide-left':
        return {
          initial: { x: '100%', opacity: 1 },
          animate: { x: 0, opacity: 1, transition },
          exit: { x: '-100%', opacity: 1, transition },
        };
      case 'slide-right':
        return {
          initial: { x: '-100%', opacity: 1 },
          animate: { x: 0, opacity: 1, transition },
          exit: { x: '100%', opacity: 1, transition },
        };
      case 'slide-up':
        return {
          initial: { y: '100%', opacity: 1 },
          animate: { y: 0, opacity: 1, transition },
          exit: { y: '-100%', opacity: 1, transition },
        };
      case 'slide-down':
        return {
          initial: { y: '-100%', opacity: 1 },
          animate: { y: 0, opacity: 1, transition },
          exit: { y: '100%', opacity: 1, transition },
        };
      case 'dissolve':
      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1, transition },
          exit: { opacity: 0, transition },
        };
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: 'transparent', containerType: 'size' }}>
      {/* 1. Dedicated Background AnimatePresence */}
      <AnimatePresence>
        {!isBlackout && slide && slide.type !== 'lower-third' && (
          <motion.div
            key={slide.theme?.id || 'default-bg'}
            variants={getVariants(slide.theme)}
            initial="initial" animate="animate" exit="exit"
            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
          >
            <BackgroundLayer theme={slide.theme} isPreview={isPreview} videoRef={bgVideoRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Content AnimatePresence */}
      <AnimatePresence>
        {isBlackout ? (
          <motion.div
            key="blackout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'black', zIndex: 100 }}
          />
        ) : slide ? (
          <motion.div
            key={slide.id}
            variants={getVariants(slide.theme)}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              ...(slide.type === 'lower-third' ? {} : getThemeStyles(slide.theme))
            }}
          >

            {/* Lower Third Layer */}
            {slide.type === 'lower-third' ? (
              <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', padding: '5cqh 0 5cqh 0' }}>
                <LowerThirdGraphic data={(slide as any).lowerThirdData} />
              </div>
            ) : slide.type === 'media' && slide.content.mediaPath ? (
              <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {slide.content.mediaPath.match(/\.(mp4|mov|webm)$/i) ? (
                  <video 
                    ref={videoRef}
                    src={slide.content.mediaPath} 
                    autoPlay 
                    loop 
                    muted={isPreview} // Mute if in preview panel, otherwise play sound
                    playsInline 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                ) : (
                  <img 
                    src={slide.content.mediaPath} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                )}
              </div>
            ) : (
              /* Content Layer (Text, lyrics, scriptures) */
              <div style={{
                position: 'relative',
                zIndex: 10,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: getAlignItems(slide.theme),
                padding: `${slide.theme?.layout?.marginTop ?? 5}cqh ${slide.theme?.layout?.marginRight ?? 5}cqw ${slide.theme?.layout?.marginBottom ?? 5}cqh ${slide.theme?.layout?.marginLeft ?? 5}cqw`,
                margin: '0 auto',
              }}>
                {/* Overlay Box for Lower Thirds / General */}
                <div style={{
                  backgroundColor: slide.theme?.colors?.textBoxBackground || 'transparent',
                  padding: slide.theme?.colors?.textBoxBackground ? '4cqw 6cqw' : '0',
                  borderRadius: slide.theme?.colors?.textBoxBackground ? '2cqw' : '0',
                  maxWidth: `${slide.theme?.layout?.maxWidth || 100}%`,
                  width: slide.theme?.colors?.textBoxBackground ? '100%' : 'auto',
                  flex: slide.theme?.colors?.textBoxBackground ? 1 : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: getJustifyContent(slide.theme),
                  alignItems: getAlignItems(slide.theme),
                  textAlign: slide.theme?.layout?.textAlign || 'center',
                }}>
                
                {/* Title / Heading */}
                {slide.content.title && (
                  <motion.div 
                    className="slide-title"
                    initial={slide.theme?.animation?.textAnimation === 'fade-in' ? { opacity: 0, y: 20 } : {}}
                    animate={slide.theme?.animation?.textAnimation === 'fade-in' ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    style={{
                      fontSize: '1.2em', // Relative to base font size
                      fontWeight: (slide.theme?.typography?.fontWeight || 400) + 200,
                        color: slide.type === 'scripture' ? (slide.theme?.colors?.referenceText || slide.theme?.colors?.accent || 'inherit') : 'inherit',
                        backgroundColor: slide.type === 'scripture' ? (slide.theme?.colors?.referenceBackground || 'transparent') : 'transparent',
                        padding: (slide.type === 'scripture' && slide.theme?.colors?.referenceBackground && slide.theme?.colors?.referenceBackground !== 'transparent') ? '0.2em 0.8em' : '0',
                        borderRadius: (slide.type === 'scripture' && slide.theme?.colors?.referenceBackground && slide.theme?.colors?.referenceBackground !== 'transparent') ? '2em' : '0',
                        display: (slide.type === 'scripture' && slide.theme?.colors?.referenceBackground && slide.theme?.colors?.referenceBackground !== 'transparent') ? 'inline-block' : 'block',
                      marginBottom: '0.5em',
                    }}
                  >
                    {slide.content.title}
                  </motion.div>
                )}

                {/* Main Body */}
                <motion.div 
                    className="slide-body"
                    initial={slide.theme?.animation?.textAnimation === 'fade-in' ? { opacity: 0, y: 20 } : {}}
                    animate={slide.theme?.animation?.textAnimation === 'fade-in' ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    style={{ flex: 1, display: 'flex', width: '100%', minHeight: 0 }}
                  >
                    <AutoShrinkText 
                      text={slide.content.body} 
                      align={getJustifyContent(slide.theme)}
                      style={{
                        fontSize: '1em',
                        lineHeight: slide.theme?.typography?.lineHeight || 1.4,
                        whiteSpace: 'pre-wrap',
                      }} 
                    />
                  </motion.div>

                                {/* Reference / Footer */}
                {slide.content.reference && (
                  <motion.div 
                    className="slide-reference"
                    initial={slide.theme?.animation?.textAnimation === 'fade-in' ? { opacity: 0 } : {}}
                    animate={slide.theme?.animation?.textAnimation === 'fade-in' ? { opacity: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{
                      fontSize: `${slide.theme?.typography?.referenceSize || 0.6}em`,
                      color: slide.theme?.colors?.referenceText || slide.theme?.colors?.reference || slide.theme?.colors?.textSecondary || 'rgba(255, 255, 255, 0.7)',
                      backgroundColor: slide.theme?.colors?.referenceBackground || 'transparent',
                      padding: slide.theme?.colors?.referenceBackground ? '0.4em 1em' : '0',
                      borderRadius: slide.theme?.colors?.referenceBackground ? '2em' : '0',
                      fontWeight: (slide.theme?.typography?.fontWeight || 400) + 100,
                      marginTop: '1.5em',
                      alignSelf: slide.theme?.layout?.referenceAlign === 'left' ? 'flex-start' : slide.theme?.layout?.referenceAlign === 'center' ? 'center' : 'flex-end',
                      boxShadow: slide.theme?.colors?.referenceBackground ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    {slide.content.reference}
                  </motion.div>
                )}
                
                </div> {/* End Overlay Box */}
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// ---- Helpers ----

function BackgroundLayer({ theme, isPreview, videoRef }: { theme?: Theme, isPreview?: boolean, videoRef?: React.RefObject<HTMLVideoElement> }) {
  if (!theme || !theme.background) {
    return <div style={{ position: 'absolute', inset: 0, backgroundColor: 'transparent' }} />;
  }

  const bg = theme.background;

  let backgroundStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    filter: `blur(${bg.blur || 0}px) brightness(${bg.brightness !== undefined ? bg.brightness : 1})`,
  };

  switch (bg.type) {
    case 'solid':
        backgroundStyle.backgroundColor = bg.color || '#000000';
        break;
      case 'transparent':
        backgroundStyle.backgroundColor = 'transparent';
        break;
    case 'gradient':
      backgroundStyle.backgroundImage = `linear-gradient(${bg.gradientAngle || 180}deg, ${bg.gradientStart || '#000'}, ${bg.gradientEnd || '#111'})`;
      break;
    case 'image':
      if (bg.imagePath) {
        backgroundStyle.backgroundImage = `url('${bg.imagePath}')`;
        backgroundStyle.backgroundSize = 'cover';
        backgroundStyle.backgroundPosition = 'center';
        backgroundStyle.opacity = bg.imageOpacity !== undefined ? bg.imageOpacity : 1;
      }
      break;
    case 'video':
      if (bg.videoPath) {
        // Return immediately for video since it needs a different DOM structure
        return (
          <>
            <video
              ref={videoRef}
              src={bg.videoPath}
              autoPlay
              loop
              muted={isPreview !== false} // Default to muted for background videos unless specifically unmuted, but definitely mute if isPreview is true
              playsInline
              style={{
                ...backgroundStyle,
                objectFit: 'cover',
                width: '100%',
                height: '100%',
              }}
            />
            {theme.colors?.overlayBackground && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 2, backgroundColor: theme.colors.overlayBackground }} />
            )}
          </>
        );
      }
      backgroundStyle.backgroundColor = '#000';
      break;
  }

  return (
    <>
      <div style={backgroundStyle} />
      {theme.colors?.overlayBackground && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, backgroundColor: theme.colors.overlayBackground }} />
      )}
    </>
  );
}

function getThemeStyles(theme?: Theme): React.CSSProperties {
  if (!theme) {
    return {
      color: '#fff',
      fontFamily: 'sans-serif',
      fontSize: '4cqw',
    };
  }

  return {
    color: theme.colors?.textPrimary || '#fff',
    fontFamily: theme.typography?.fontFamily || 'sans-serif',
    fontSize: `${theme.typography?.fontSize || 4}cqw`,
    fontWeight: theme.typography?.fontWeight || 400,
    letterSpacing: `${theme.typography?.letterSpacing || 0}em`,
    textTransform: theme.typography?.textTransform || 'none',
    textShadow: theme.typography?.textShadow || 'none',
    textAlign: theme.layout?.textAlign || 'center',
  };
}

function getJustifyContent(theme?: Theme): string {
  const align = theme?.layout?.verticalAlign || 'center';
  switch (align) {
    case 'top': return 'flex-start';
    case 'bottom': return 'flex-end';
    case 'center':
    default: return 'center';
  }
}

function getAlignItems(theme?: Theme): string {
  const align = theme?.layout?.textAlign || 'center';
  switch (align) {
    case 'left': return 'flex-start';
    case 'right': return 'flex-end';
    case 'center':
    default: return 'center';
  }
}


