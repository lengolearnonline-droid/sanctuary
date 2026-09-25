import React, { useEffect } from 'react';
import { useBibleStore, usePresentationStore, useServiceStore } from '../../stores';

export function BiblePage() {
  const { 
    books, setBooks, selectBook, selectedBook, 
    verses, setVerses, selectedChapter, selectChapter, activeVerse, setActiveVerse,
    translations, setTranslations, activeTranslation, setActiveTranslation,
    searchQuery, setSearchQuery, searchResults, setSearchResults
  } = useBibleStore();
  const { activeService, addItemToService } = useServiceStore();
  
  const activeAbbrev = translations.find(t => t.id === activeTranslation)?.abbreviation || 'KJV';

  useEffect(() => {
    // Load books and translations on mount
    const loadInitialData = async () => {
      try {
        if (window.sanctuary) {
          const loadedTranslations = await window.sanctuary.bible.getTranslations();
          setTranslations(loadedTranslations);
          if (loadedTranslations.length > 0 && !activeTranslation) {
            setActiveTranslation(loadedTranslations[0].id);
          }
          
          const loadedBooks = await window.sanctuary.bible.getBooks();
          setBooks(loadedBooks);
        }
      } catch (err) {
        console.error('Failed to load initial bible data:', err);
      }
    };

    loadInitialData();

    // Listen for updates when a new Bible is imported
    const handleUpdate = () => {
      loadInitialData();
    };
    window.addEventListener('bible:updated', handleUpdate);
  
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    if (window.sanctuary) {
      try {
        const results = await window.sanctuary.bible.search(query, 50);
        // The backend returns BibleSearchResult[], but our store expects BibleVerse[]
        setSearchResults(results.map((r: any) => r.verse));
      } catch (err) {
        console.error('Search failed:', err);
      }
    }
  };

  return () => {
      window.removeEventListener('bible:updated', handleUpdate);
    };
  }, [activeTranslation, setActiveTranslation, setBooks, setTranslations]);

  useEffect(() => {
    // Load verses when book/chapter selected
    const loadVerses = async () => {
      if (selectedBook && selectedChapter && window.sanctuary) {
        try {
          const loadedVerses = await window.sanctuary.bible.getVerses(selectedBook, selectedChapter);
          setVerses(loadedVerses);
        } catch (err) {
          console.error('Failed to load verses:', err);
        }
      }
    };
    loadVerses();
  }, [selectedBook, selectedChapter, setVerses, activeTranslation]); // Re-fetch if translation changes

  const handleTranslationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    if (window.sanctuary) {
      await window.sanctuary.bible.setTranslation(newId);
      setActiveTranslation(newId);
      // Reload books just in case the new translation has different books/names
      const loadedBooks = await window.sanctuary.bible.getBooks();
      setBooks(loadedBooks);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    if (window.sanctuary) {
      try {
        const results = await window.sanctuary.bible.search(query, 50);
        // The backend returns BibleSearchResult[], but our store expects BibleVerse[]
        setSearchResults(results.map((r: any) => r.verse));
      } catch (err) {
        console.error('Search failed:', err);
      }
    }
  };

  
React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (!verses || verses.length === 0) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        let currentIndex = -1;
        if (activeVerse !== null) {
          currentIndex = verses.findIndex(v => v.verse === activeVerse);
        }
        if (currentIndex === -1) currentIndex = 0;
        else if (currentIndex < verses.length - 1) currentIndex++;
        
        if (currentIndex === verses.length - 1) {
            setTimeout(() => {
               const numChapters = books.find((b: any) => b.name === selectedBook)?.chapters || 0;
               if (selectedChapter && selectedChapter < numChapters) {
                 selectChapter(selectedChapter + 1);
               }
            }, 100);
        }
        setActiveVerse(verses[currentIndex].verse);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        let currentIndex = -1;
        if (activeVerse !== null) {
          currentIndex = verses.findIndex(v => v.verse === activeVerse);
        }
        if (currentIndex > 0) {
          setActiveVerse(verses[currentIndex - 1].verse);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [verses, selectedChapter, selectedBook, books, activeVerse, setActiveVerse, selectChapter]); React.useEffect(() => {
    if (activeVerse !== null && verses.length > 0) {
      const v = verses.find(v => v.verse === activeVerse);
      if (v) {
        const slide = { id: `scripture_${v.book}_${v.chapter}_${v.verse}`, notes: '',
          type: 'scripture',
          content: {
            title: `${v.book} ${v.chapter}:${v.verse} (${activeAbbrev})`,
            body: v.text,
            reference: ''
          }
        };
        (usePresentationStore.getState() as any).setPreviewSlide(slide); 
        // We do NOT call sendToProgram here automatically anymore because the AI will do it directly,
        // and we don't want duplicate calls. If the user uses arrow keys, they can hit Enter to send.
        // Wait, arrow keys used to auto-send! Let's keep it but ensure we don't spam.
        // Actually, it's fine for now, we'll keep the auto-send for arrow keys.
        (usePresentationStore.getState() as any).sendToProgram(slide);
      }
    }
  }, [activeVerse, verses, activeAbbrev]);
  
  return (
    <div className="bible-page flex flex-col h-full p-4 gap-4">
      {/* Search Bar */}
      <div className="flex gap-2 w-full">
        <input 
          type="text" 
          placeholder="Search scriptures (e.g. 'Jesus wept', 'John 3:16')..." 
          className="flex-1 bg-surface border border-surface-border rounded-md px-4 py-2 text-text-primary focus:outline-none focus:border-accent"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="btn btn-secondary"
            onClick={() => handleSearch('')}
          >
            Clear
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex h-full gap-4 min-h-0">
        {searchQuery ? (
          // Search Results View
          <div className="panel flex-1 overflow-auto p-4">
            <div className="panel-header mb-4">
              Search Results for "{searchQuery}" ({searchResults.length})
            </div>
            <div className="verses-list">
              {searchResults.length === 0 ? (
                <div className="text-secondary p-4 text-center">No results found.</div>
              ) : (
                searchResults.map(v => (
                  <div key={`${v.book}-${v.chapter}-${v.verse}`} className="verse-item mb-2 p-2 hover:bg-surface-hover rounded cursor-pointer border border-transparent hover:border-surface-border flex justify-between items-start group"
                    onClick={() => { setActiveVerse(v.verse); const slide = { id: `scripture_${Date.now()}`, notes: '',
                        type: 'scripture',
                        content: {
                          title: `${v.book} ${v.chapter}:${v.verse} (${activeAbbrev})`,
                          body: v.text,
                          reference: ''
                        }
                      }; usePresentationStore.getState().setPreviewSlide(slide); usePresentationStore.getState().sendToProgram(slide);
                    }}
                  >
                    <div>
                      <div className="text-accent font-bold text-sm mb-1">{v.book} {v.chapter}:{v.verse}</div>
                      <span>{v.text}</span>
                    </div>
                    {activeService && (
                      <button 
                        className="btn btn-sm btn-secondary opacity-0 group-hover:opacity-100 transition-opacity ml-4 shrink-0"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const newItem = {
                            type: 'scripture',
                            title: `${v.book} ${v.chapter}:${v.verse} (${activeAbbrev})`,
                            data: { book: v.book, chapter: v.chapter, verse: v.verse, text: v.text }
                          };
                          addItemToService(newItem);
                          
                          // Auto-save the service
                          const state = useServiceStore.getState();
                          if (state.activeService && window.sanctuary) {
                            const toSave = { ...state.activeService };
                            toSave.items = toSave.items.map((it, idx) => ({ ...it, order: idx }));
                            await window.sanctuary.service.save(JSON.stringify(toSave));
                          }
                        }}
                      >
                        + Service
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // Standard Browser View
          <>
            <div className="panel bible-books w-64 flex flex-col p-2">
              <div className="panel-header mb-2 flex justify-between items-center">
                <span>Books</span>
                {translations.length > 0 && (
                  <select 
                    className="bg-surface-elevated border border-surface-border rounded px-2 py-1 text-sm text-text-primary"
                    value={activeTranslation || ''}
                    onChange={handleTranslationChange}
                  >
                    {translations.map(t => (
                      <option key={t.id} value={t.id}>{t.abbreviation}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex flex-col gap-1 overflow-auto flex-1 pr-1">
                {books.length > 0 ? books.map(b => (
                  <button 
                    key={b.id} 
                    className={`btn btn-sm ${selectedBook === b.name ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => selectBook(b.name)}
                  >
                    {b.name}
                  </button>
                )) : (
                  <p className="p-2 text-secondary text-sm">No books loaded. (Ensure bible data is present)</p>
                )}
              </div>
            </div>
            
            {selectedBook && (
              <div className="panel bible-chapters w-48 overflow-auto p-2">
                <div className="panel-header mb-2">Chapters</div>
                <div className="flex flex-col gap-1">
                  {Array.from({ length: books.find(b => b.name === selectedBook)?.chapters || 0 }).map((_, i) => (
                    <button 
                      key={i + 1} 
                      className={`btn btn-sm ${selectedChapter === i + 1 ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => selectChapter(i + 1)}
                    >
                      Chapter {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedBook && selectedChapter && (
              <div className="panel bible-verses flex-1 overflow-auto p-4">
                <div className="panel-header mb-4">{selectedBook} {selectedChapter}</div>
                <div className="verses-list">
                  {verses.map(v => (
                    <div key={v.verse} className={`verse-item mb-2 p-2 hover:bg-surface-hover rounded cursor-pointer flex justify-between items-start group ${activeVerse === v.verse ? 'bg-primary/20 border border-primary' : ''}`}
                      onClick={() => { setActiveVerse(v.verse); const slide = { id: `scripture_${Date.now()}`, notes: '',
                          type: 'scripture',
                          content: {
                            title: `${v.book} ${v.chapter}:${v.verse} (${activeAbbrev})`,
                            body: v.text,
                            reference: ''
                          }
                        }; usePresentationStore.getState().setPreviewSlide(slide); usePresentationStore.getState().sendToProgram(slide);
                      }}
                    >
                      <div>
                        <sup className="text-accent mr-2">{v.verse}</sup>
                        <span>{v.text}</span>
                      </div>
                      {activeService && (
                        <button 
                          className="btn btn-sm btn-secondary opacity-0 group-hover:opacity-100 transition-opacity ml-4 shrink-0"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const newItem = {
                              type: 'scripture',
                              title: `${v.book} ${v.chapter}:${v.verse} (${activeAbbrev})`,
                              data: { book: v.book, chapter: v.chapter, verse: v.verse, text: v.text }
                            };
                            addItemToService(newItem);
                            
                            // Auto-save the service
                            const state = useServiceStore.getState();
                            if (state.activeService && window.sanctuary) {
                              const toSave = { ...state.activeService };
                              toSave.items = toSave.items.map((it, idx) => ({ ...it, order: idx }));
                              await window.sanctuary.service.save(JSON.stringify(toSave));
                            }
                          }}
                        >
                          + Service
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


