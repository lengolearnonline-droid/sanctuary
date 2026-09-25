// ============================================================
// Sanctuary — Zustand State Store
// ============================================================

import { create } from 'zustand';
import { useMediaStore } from './mediaStore';
import type {
  Service,
  BibleBook,
  BibleVerse,
  BibleTranslation,
  PresentationState,
  Slide,
  Song,
} from '../../shared/types';

// ---- Navigation ----

export type Page =
  | 'dashboard'
  | 'service'
  | 'bible'
  | 'songs'
  | 'media'
  | 'themes'
  | 'lower-thirds'
  | 'settings'
  | 'help';

interface NavigationState {
  currentPage: Page;
  setPage: (page: Page) => void;
}

export const useNavigation = create<NavigationState>((set) => ({
  currentPage: 'service',
  setPage: (page) => set({ currentPage: page }),
}));

// ---- Service ----

interface ServiceState {
  activeService: Service | null;
  recentServices: Array<{ id: string; name: string; date: string; itemCount: number; updatedAt: string }>;
  activeItemIndex: number;
  flatSlides: any[]; // Flat list of all slides in the service for keyboard navigation
  currentLinearIndex: number;
  setActiveService: (service: Service | null) => void;
  setRecentServices: (services: Array<{ id: string; name: string; date: string; itemCount: number; updatedAt: string }>) => void;
  setActiveItemIndex: (index: number) => void;
  setCurrentLinearIndex: (index: number) => void;
  recomputeFlatSlides: () => void;
}

export const useServiceStore = create<ServiceState & { addItemToService: (item: Partial<ServiceItem>) => void }>((set, get) => ({
  activeService: null,
  recentServices: [],
  activeItemIndex: -1,
  flatSlides: [],
  currentLinearIndex: -1,
  setActiveService: (service) => {
    set({ activeService: service, activeItemIndex: -1, currentLinearIndex: -1 });
    get().recomputeFlatSlides();
  },
  setRecentServices: (services) => set({ recentServices: services }),
  setActiveItemIndex: (index) => set({ activeItemIndex: index }),
  setCurrentLinearIndex: (index) => set({ currentLinearIndex: index }),
  recomputeFlatSlides: () => {
    const service = get().activeService;
    if (!service) {
      set({ flatSlides: [] });
      return;
    }
    const flat: any[] = [];
    service.items.forEach((item: any, itemIdx: number) => {
      try {
        const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
        if (item.type === 'scripture') {
          flat.push({
            id: `item_${itemIdx}_slide_0`, itemIndex: itemIdx, type: 'scripture',
            content: { title: `${data.book} ${data.chapter}:${data.verse}`, body: data.text, reference: `${data.book} ${data.chapter}:${data.verse}` }
          });
        } else if (item.type === 'song' && data.arrangement && data.sections) {
          let slideIdx = 0;
          data.arrangement.forEach((sectionId: string) => {
            const section = data.sections.find((s: any) => s.id === sectionId);
            if (section) {
              const maxLines = 4;
              for (let i = 0; i < section.lines.length; i += maxLines) {
                const chunk = section.lines.slice(i, i + maxLines);
                flat.push({
                  id: `item_${itemIdx}_slide_${slideIdx++}`, itemIndex: itemIdx, type: 'song',
                  content: { title: data.title, body: chunk.join('\n'), reference: data.title }
                });
              }
            }
          });
        }
      } catch (e) {
        console.error('Failed to parse item data for flat slides', e);
      }
    });
    set({ flatSlides: flat });
  },
  addItemToService: (item) => set((state) => {
    if (!state.activeService) return state;
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      service_id: state.activeService.id,
      item_order: state.activeService.items.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const newState = {
      activeService: {
        ...state.activeService,
        items: [...state.activeService.items, newItem as any]
      }
    };
    // Defer recompute to next tick so state is updated
    setTimeout(() => get().recomputeFlatSlides(), 0);
    return newState;
  }),
}));

// ---- Bible ----

interface BibleState {
  translations: BibleTranslation[];
  activeTranslation: string | null;
  books: BibleBook[];
  selectedBook: string | null;
  selectedChapter: number | null;
  activeVerse: number | null; // 1-based verse number
  verses: BibleVerse[];
  searchResults: BibleVerse[];
  searchQuery: string;
  recentPassages: Array<{ book: string; chapter: number; verse?: number }>;
  setTranslations: (translations: BibleTranslation[]) => void;
  setActiveTranslation: (id: string) => void;
  setBooks: (books: BibleBook[]) => void;
  selectBook: (book: string | null) => void;
  selectChapter: (chapter: number | null) => void;
  setActiveVerse: (verse: number | null) => void;
  setVerses: (verses: BibleVerse[]) => void;
  setSearchResults: (results: BibleVerse[]) => void;
  setSearchQuery: (query: string) => void;
  addRecentPassage: (passage: { book: string; chapter: number; verse?: number }) => void;
}

export const useBibleStore = create<BibleState>((set) => ({
  translations: [],
  activeTranslation: null,
  books: [],
  selectedBook: null,
  selectedChapter: null,
  activeVerse: null,
  verses: [],
  searchResults: [],
  searchQuery: '',
  recentPassages: [],
  setTranslations: (translations) => set({ translations }),
  setActiveTranslation: (id) => set({ activeTranslation: id }),
  setBooks: (books) => set({ books }),
  selectBook: (book) => set({ selectedBook: book, selectedChapter: null, verses: [] }),
  selectChapter: (chapter) => set({ selectedChapter: chapter, activeVerse: null }),
  setActiveVerse: (verse) => set({ activeVerse: verse }),
  setVerses: (verses) => set({ verses }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  addRecentPassage: (passage) =>
    set((state) => ({
      recentPassages: [passage, ...state.recentPassages.slice(0, 19)],
    })),
}));

// ---- Themes ----

interface ThemeStoreState {
  defaultBibleTheme: any | null;
  defaultSongTheme: any | null;
  setDefaultBibleTheme: (theme: any | null) => void;
  setDefaultSongTheme: (theme: any | null) => void;
  loadDefaults: () => Promise<void>;
}

export const useThemeStore = create<ThemeStoreState>((set) => ({
  defaultBibleTheme: null,
  defaultSongTheme: null,
  setDefaultBibleTheme: (theme) => set({ defaultBibleTheme: theme }),
  setDefaultSongTheme: (theme) => set({ defaultSongTheme: theme }),
  loadDefaults: async () => {
    if (window.sanctuary) {
      const bibleThemeId = await window.sanctuary.settings.get('bible.defaultThemeId');
      const songThemeId = await window.sanctuary.settings.get('lyrics.defaultThemeId');
      
      if (bibleThemeId) {
        const theme = await window.sanctuary.themes.get(bibleThemeId);
        set({ defaultBibleTheme: theme });
      }
      if (songThemeId) {
        const theme = await window.sanctuary.themes.get(songThemeId);
        set({ defaultSongTheme: theme });
      }
    }
  }
}));

// ---- Presentation ----

interface PresentationStoreState {
  state: PresentationState;
  previewSlide: Slide | null;
  setPreviewSlide: (slide: Slide | null) => void;
  sendToProgram: (slide: Slide) => void;
  clearProgram: () => void;
  setBlackout: (isBlack: boolean) => void;
  updateState: (updates: Partial<PresentationState>) => void;
}

export const usePresentationStore = create<PresentationStoreState>((set) => ({
  state: {
    currentSlide: null,
    nextSlide: null,
    previousSlide: null,
    isLive: false,
    isBlackout: false,
    isFrozen: false,
    transitionActive: false,
    currentServiceItemIndex: -1,
    currentSlideIndex: -1,
  },
  previewSlide: null,
  setPreviewSlide: (slide) => {
    if (slide && !slide.theme) {
      const themeStore = useThemeStore.getState();
      if (slide.type === 'scripture' && themeStore.defaultBibleTheme) {
        slide.theme = themeStore.defaultBibleTheme;
      } else if (slide.type === 'song' && themeStore.defaultSongTheme) {
        slide.theme = themeStore.defaultSongTheme;
      }
    }
    set({ previewSlide: slide });
  },
  sendToProgram: (slide) => {
    // Inject default themes if missing
    if (!slide.theme) {
      const themeStore = useThemeStore.getState();
      if (slide.type === 'scripture' && themeStore.defaultBibleTheme) {
        slide.theme = themeStore.defaultBibleTheme;
      } else if (slide.type === 'song' && themeStore.defaultSongTheme) {
        slide.theme = themeStore.defaultSongTheme;
      }
    }

    set((state) => ({
      state: {
        ...state.state,
        currentSlide: slide,
        isLive: true,
      },
    }));
    window.sanctuary?.presentation.setSlide(JSON.stringify(slide)).then(() => {
      const vol = useMediaStore.getState().isMuted ? 0 : useMediaStore.getState().globalVolume;
      window.sanctuary?.presentation?.mediaCommand?.(JSON.stringify({ action: 'volume', value: vol }));
    }).catch((err: any) => {
      console.error('IPC ERROR:', err);
    });
  },
  clearProgram: () => {
    set((state) => ({
      state: {
        ...state.state,
        currentSlide: null,
        isLive: false,
      },
    }));
    window.sanctuary?.presentation.clear();
  },
  setBlackout: (isBlack) => {
    set((state) => ({
      state: { ...state.state, isBlackout: isBlack },
    }));
    window.sanctuary?.presentation.blackout(isBlack);
  },
  updateState: (updates) =>
    set((state) => ({
      state: { ...state.state, ...updates },
    })),
}));

// ---- Songs ----

interface SongState {
  songs: Song[];
  selectedSong: Song | null;
  searchQuery: string;
  setSongs: (songs: Song[]) => void;
  setSelectedSong: (song: Song | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useSongStore = create<SongState>((set) => ({
  songs: [],
  selectedSong: null,
  searchQuery: '',
  setSongs: (songs) => set({ songs }),
  setSelectedSong: (song) => set({ selectedSong: song }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

// ---- UI State ----

interface UIState {
  sidebarCollapsed: boolean;
  previewVisible: boolean;
  programVisible: boolean;
  statusBarVisible: boolean;
  toggleSidebar: () => void;
  setPreviewVisible: (visible: boolean) => void;
  setProgramVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  previewVisible: true,
  programVisible: true,
  statusBarVisible: true,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setPreviewVisible: (visible) => set({ previewVisible: visible }),
  setProgramVisible: (visible) => set({ programVisible: visible }),
}));

export * from './mediaStore';
