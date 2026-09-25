// ============================================================
// Sanctuary — Main App Component
// ============================================================

import React, { useEffect, useState } from 'react';
import { useNavigation, usePresentationStore, useServiceStore, useBibleStore, useThemeStore } from './stores';
import { LicenseGate, TrialBanner } from './components/LicenseGate';
import { Sidebar } from './components/Sidebar';
import { BiblePage } from './pages/Bible/BiblePage';
import { ServicePage } from './pages/Service/ServicePage';
import { SongsPage } from './pages/Songs/SongsPage';
import { ThemesPage } from './pages/Themes/ThemesPage';
import { LowerThirdsPage } from './pages/LowerThirds/LowerThirdsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { HelpPage } from './pages/Help/HelpPage';
import { MediaPage } from './pages/Media/MediaPage';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { StatusBar } from './components/StatusBar';
import { ToastContainer } from './components/ui';
import { AudioEngine } from './components/presentation/AudioEngine';
import { AISuggestionQueue } from './components/AISuggestionQueue';

/**
 * Root application layout:
 * ┌───────────────────────────────────────────────┐
 * │ Sidebar │ Main Content                     │
 * │         │                                  │
 * │  Bible  │  ┌────────────┬───────────────┐  │
 * │  Songs  │  │  Preview   │   Program     │  │
 * │  Media  │  │            │               │  │
 * │  ...    │  │            │               │  │
 * │         │  └────────────┴───────────────┘  │
 * │         │                                  │
 * │         │  ┌────────────────────────────┐  │
 * │         │  │  Active Page (Bible/Songs) │  │
 * │         │  └────────────────────────────┘  │
 * └─────────┴───────────────────────────────────┘
 */
export function App() {
  const { currentPage } = useNavigation();
  const [licenseResult, setLicenseResult] = useState<{ valid: boolean; plan?: string; status?: string; daysLeft?: number } | null>(null);
  const [licenseChecked, setLicenseChecked] = useState(false);

  // Check cached license on startup � avoid showing gate if already validated
  useEffect(() => {
    async function checkCachedLicense() {
      try {
        const cached = await window.sanctuary?.license?.getCached?.();
        if (cached?.licenseKey) {
          // Strictly validate in background on startup
          const fresh = await window.sanctuary.license.validate(cached.licenseKey);
          if (fresh.valid) {
            setLicenseResult(fresh);
            setLicenseChecked(true);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to check license on startup", err);
      }
      setLicenseChecked(true);
    }
    checkCachedLicense();
  }, []);

  useEffect(() => {
    console.log('Sanctuary API Check:', window.sanctuary);
    if (!window.sanctuary) {
      console.error('CRITICAL ERROR: window.sanctuary is UNDEFINED!');
    }
    
    // Load default themes on startup
    useThemeStore.getState().loadDefaults();
    
    // Register global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Global shortcuts
      if (e.key === 'Escape') {
        // Clear presentation
        window.sanctuary?.presentation?.clear();
      }
      if (e.key === 'b' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Blackout
        window.sanctuary?.presentation?.blackout(true);
      }

      // Linear Slide Navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        const { flatSlides, currentLinearIndex, setCurrentLinearIndex, setActiveItemIndex } = useServiceStore.getState();
        if (flatSlides.length > 0) {
          const nextIdx = currentLinearIndex + 1;
          if (nextIdx < flatSlides.length) {
            setCurrentLinearIndex(nextIdx);
            const slide = flatSlides[nextIdx];
            setActiveItemIndex(slide.itemIndex);
            usePresentationStore.getState().sendToProgram({
              type: slide.type,
              content: slide.content
            });
          }
        }
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const { flatSlides, currentLinearIndex, setCurrentLinearIndex, setActiveItemIndex } = useServiceStore.getState();
        if (flatSlides.length > 0 && currentLinearIndex > 0) {
          const prevIdx = currentLinearIndex - 1;
          setCurrentLinearIndex(prevIdx);
          const slide = flatSlides[prevIdx];
          setActiveItemIndex(slide.itemIndex);
          usePresentationStore.getState().sendToProgram({
            type: slide.type,
            content: slide.content
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    let cleanupRefs: (() => void) | undefined;
    let cleanupLive: (() => void) | undefined;

    if (window.sanctuary) {
      cleanupRefs = window.sanctuary.ai.onReferencesDetected(async (refs: any[]) => {
        if (refs.length > 0) {
          const ref = refs[0];
          try {
            const passage = await window.sanctuary?.bible.getPassage(
              ref.book,
              ref.chapter,
              ref.verse || 1,
              ref.endVerse || ref.verse || 1
            );
            
            if (passage && passage.verses && passage.verses.length > 0) {
              const firstVerse = passage.verses[0];
              const bStore = useBibleStore.getState();
              const activeAbbrev = bStore.translations.find((t: any) => t.id === bStore.activeTranslation)?.abbreviation || 'KJV';
              
              const slide = {
                id: `scripture_${Date.now()}`,
                type: 'scripture' as const,
                notes: '',
                content: {
                  title: `${passage.book} ${passage.chapter}:${firstVerse.verse} (${activeAbbrev})`,
                  body: firstVerse.text,
                  reference: ''
                }
              };
              
              usePresentationStore.getState().setPreviewSlide(slide as any); 
            }
          } catch (e) {
            console.error('Failed to auto-preview scripture', e);
          }
        }
      });

      cleanupLive = window.sanctuary.ai.onAction(async (action: string, payload?: any) => {
        if (action === 'GO_LIVE_SCRIPTURE' && payload) {
          const ref = payload;
          try {
            const passage = await window.sanctuary?.bible.getPassage(
              ref.book,
              ref.chapter,
              ref.verse || 1,
              ref.endVerse || ref.verse || 1
            );
            
            if (passage && passage.verses && passage.verses.length > 0) {
              const firstVerse = passage.verses[0];
              const bStore = useBibleStore.getState();
              const activeAbbrev = bStore.translations.find((t: any) => t.id === bStore.activeTranslation)?.abbreviation || 'KJV';
              
              const slide = {
                id: `scripture_${Date.now()}`,
                type: 'scripture' as const,
                notes: '',
                content: {
                  title: `${passage.book} ${passage.chapter}:${firstVerse.verse} (${activeAbbrev})`,
                  body: firstVerse.text,
                  reference: ''
                }
              };
              
              usePresentationStore.getState().setPreviewSlide(slide as any); 
              
              // Sync with Bible workspace
              const matchedBook = bStore.books.find((b: any) => b.name.toLowerCase() === ref.book.toLowerCase());
              if (matchedBook) {
                bStore.selectBook(matchedBook.name);
                bStore.selectChapter(ref.chapter);
              }

              usePresentationStore.getState().sendToProgram(slide as any);
            }
          } catch (e) {
            console.error('Failed to go live with scripture', e);
          }
        }
      });
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (cleanupRefs) cleanupRefs();
      if (cleanupLive) cleanupLive();
    };
  }, []);

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', whiteSpace: 'pre-wrap' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
            <br />
            {this.state.error?.stack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

  if (!licenseResult) {
    if (!licenseChecked) {
      return <div style={{ background: '#0A0E1A', height: '100vh' }} />;
    }
    return <LicenseGate onActivated={(r) => setLicenseResult(r)} />;
  }

  return (
    <div className="app-layout">
      {licenseResult?.plan === 'trial' && <TrialBanner daysLeft={licenseResult?.daysLeft ?? 0} plan={licenseResult?.plan ?? ''} />}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main className="app-main" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: '45%', minHeight: '350px', flexShrink: 0, borderBottom: '1px solid var(--color-surface-border)', zIndex: 10 }}>
            <WorkspaceHeader />
          </div>
          <div className="app-content" style={{ flex: 1, overflow: 'auto' }}>
            <ErrorBoundary>
              {renderPage(currentPage)}
            </ErrorBoundary>
          </div>
        </main>
      </div>
      <StatusBar />
      <ToastContainer />
      <AudioEngine />
      <AISuggestionQueue />
    </div>
  );
}

function renderPage(page: string): React.ReactNode {
  switch (page) {
    case 'bible':
      return <BiblePage />;
    case 'service':
      return <ServicePage />;
    case 'songs':
      return <SongsPage />;
    case 'media':
      return <MediaPage />;
    case 'themes':
      return <ThemesPage />;
    case 'lower-thirds':
      return <LowerThirdsPage />;
    case 'settings':
      return <SettingsPage />;
    case 'help':
        return <HelpPage />;
    default:
      return <ServicePage />;
  }
}

/**
 * Placeholder page for modules not yet implemented.
 * Clearly marked as future functionality (per project requirement).
 */
function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-page-content">
        <div className="placeholder-icon">🚧</div>
        <h2>{title}</h2>
        <p className="text-secondary">{description}</p>
        <span className="badge" style={{ background: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }}>
          Coming Soon
        </span>
      </div>
    </div>
  );
}







