import React from 'react';
import { useNavigation, Page } from '../stores';
import { 
  MonitorPlay, 
  ListTodo, 
  BookOpen, 
  Music, 
  Image as ImageIcon, 
  Palette, 
  Captions, 
  Settings,
  HelpCircle
, Trash2 } from 'lucide-react';

export function Sidebar() {
  const { currentPage, setPage } = useNavigation();

  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'service', label: 'Service Planner', icon: <ListTodo size={20} /> },
    { id: 'bible', label: 'Bible', icon: <BookOpen size={20} /> },
    { id: 'songs', label: 'Songs', icon: <Music size={20} /> },
    { id: 'media', label: 'Media', icon: <ImageIcon size={20} /> },
    { id: 'themes', label: 'Themes', icon: <Palette size={20} /> },
    { id: 'lower-thirds', label: 'Lower Thirds', icon: <Captions size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
    { id: 'help', label: 'Help', icon: <HelpCircle size={20} /> },
  ];

  return (
    <aside className="sidebar panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRight: '1px solid var(--color-surface-border)' }}>
      <div className="sidebar-header" style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-surface-border)' }}>
        <h2 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)', margin: 0, fontWeight: 700, letterSpacing: '1px' }}>SANCTUARY</h2>
      </div>
      <nav className="sidebar-nav" style={{ flex: 1, padding: 'var(--space-2) 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              background: currentPage === item.id ? 'var(--color-bg-active)' : 'transparent',
              border: 'none',
              borderLeft: `3px solid ${currentPage === item.id ? 'var(--color-accent)' : 'transparent'}`,
              color: currentPage === item.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
              fontSize: 'var(--font-size-sm)',
              fontWeight: currentPage === item.id ? 600 : 500,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (currentPage !== item.id) {
                e.currentTarget.style.background = 'var(--color-bg-hover)';
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== item.id) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', opacity: currentPage === item.id ? 1 : 0.7 }}>
              {item.icon}
            </span>
            <span style={{ letterSpacing: '0.3px' }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
