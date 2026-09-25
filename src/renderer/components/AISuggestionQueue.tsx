import React, { useEffect, useState } from 'react';
import { Bot, Check, X, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from './ui';

interface Suggestion {
  id: string;
  type: 'command' | 'scripture' | 'confirmation';
  title: string;
  confidence: number;
  data: any;
}

export function AISuggestionQueue() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!window.sanctuary) return;

    const cleanup = window.sanctuary.ai.onSuggestion((suggestion: Suggestion) => {
      setSuggestions(prev => {
        // Prevent duplicates from stacking endlessly (especially due to Expanding Window sending continuous updates)
        const isDuplicate = prev.some(s => {
          if (s.data?.intent !== suggestion.data?.intent) return false;
          
          // For scripture, deduplicate by the actual reference rather than the raw text
          if (s.data?.intent === 'SHOW_SCRIPTURE' && s.data?.scriptureReference && suggestion.data?.scriptureReference) {
             const r1 = s.data.scriptureReference;
             const r2 = suggestion.data.scriptureReference;
             return r1.book === r2.book && r1.chapter === r2.chapter && r1.verse === r2.verse;
          }
          
          return s.data?.normalizedText === suggestion.data?.normalizedText;
        });

        if (isDuplicate) {
          // Update the existing suggestion's text/confidence if it's the same logical command
          return prev.map(s => {
            if (s.data?.intent === suggestion.data?.intent) {
              if (s.data?.intent === 'SHOW_SCRIPTURE' && s.data?.scriptureReference && suggestion.data?.scriptureReference) {
                const r1 = s.data.scriptureReference;
                const r2 = suggestion.data.scriptureReference;
                if (r1.book === r2.book && r1.chapter === r2.chapter && r1.verse === r2.verse) {
                   // Keep the latest ID so the user is interacting with the freshest one
                   return { ...s, id: suggestion.id, confidence: suggestion.confidence, title: suggestion.title, data: suggestion.data };
                }
              } else if (s.data?.normalizedText === suggestion.data?.normalizedText) {
                return { ...s, id: suggestion.id };
              }
            }
            return s;
          });
        }
        return [...prev, suggestion];
      });
    });

    return () => cleanup();
  }, []);

  const handleApprove = async (suggestion: Suggestion) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    await window.sanctuary?.ai.executeSuggestion(suggestion);
  };

  const handleReject = (id: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  if (suggestions.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '40px', // Above status bar
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 1000,
      maxWidth: '350px',
      width: '100%'
    }}>
      {suggestions.map((sug) => (
        <div key={sug.id} style={{
          background: 'var(--color-bg-primary)',
          border: '1px solid var(--color-accent)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
          padding: 'var(--space-3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent)' }}>
            {sug.type === 'confirmation' ? <AlertCircle size={16} /> : <Bot size={16} />}
            <strong style={{ fontSize: '13px' }}>AI Suggestion</strong>
            <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.7 }}>
              {(sug.confidence * 100).toFixed(0)}% Conf
            </span>
          </div>
          
          <div style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>
            {sug.title}
          </div>
          
          {sug.data?.scriptureReference && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BookOpen size={12} />
              {sug.data.scriptureReference.book.charAt(0).toUpperCase() + sug.data.scriptureReference.book.slice(1)} {sug.data.scriptureReference.chapter}:{sug.data.scriptureReference.verse}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <Button 
              variant="secondary" 
              size="sm" 
              icon={X} 
              onClick={() => handleReject(sug.id)}
              style={{ flex: 1 }}
            >
              Ignore
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              icon={Check} 
              onClick={() => handleApprove(sug)}
              style={{ flex: 1 }}
            >
              Approve
            </Button>
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
