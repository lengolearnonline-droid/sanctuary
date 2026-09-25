// ============================================================
// Sanctuary — Electron Preload Script
// ============================================================
//
// Exposes a safe API from main process to renderer via contextBridge.
// This is the ONLY bridge between Node.js and the browser context.
// No arbitrary IPC — only explicit, validated channels.
//

import { contextBridge, ipcRenderer } from 'electron';

console.log('PRELOAD SCRIPT STARTING...');

// ============================================================
// CRITICAL FIX: Register IPC listeners in the preload scope
// (NOT inside contextBridge proxied functions).
//
// contextBridge.exposeInMainWorld creates proxies. When you pass
// a renderer callback through a proxy and register it with
// ipcRenderer.on(), Electron's GC can collect the proxy reference,
// causing the listener to silently stop working.
//
// Solution: Keep a Map of listeners in preload scope. The renderer
// calls subscribe/unsubscribe with a string key, and we manage
// the real ipcRenderer listeners here.
// ============================================================

type ListenerCallback = (...args: any[]) => void;
const listenerMap = new Map<string, Set<ListenerCallback>>();

// Channels the renderer is allowed to listen to
const ALLOWED_CHANNELS = [
  'presentation:update',
  'presentation:clear',
  'presentation:blackout',
  'presentation:mediaCommand',
  'obs:state',
  'vmix:state',
  'ai:transcript:partial',
  'ai:transcript:result',
  'ai:references:detected',
  'ai:action',
  'ai:command:executed',
  'ai:suggestion',
];

// Register ONE ipcRenderer.on handler per channel that fans out to all registered callbacks
for (const channel of ALLOWED_CHANNELS) {
  listenerMap.set(channel, new Set());
  ipcRenderer.on(channel, (_event: any, ...args: any[]) => {
    console.log(`[PRELOAD] Received IPC on channel: ${channel}`, args.length > 0 ? args[0]?.toString?.().substring(0, 80) : '');
    const callbacks = listenerMap.get(channel);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(...args);
        } catch (e) {
          console.error(`[PRELOAD] Error in callback for ${channel}:`, e);
        }
      });
    }
  });
}

/**
 * Subscribe to an IPC channel. Returns an unsubscribe function.
 */
function subscribeChannel(channel: string, callback: ListenerCallback): () => void {
  if (!ALLOWED_CHANNELS.includes(channel)) {
    console.error(`[PRELOAD] Attempted to subscribe to disallowed channel: ${channel}`);
    return () => {};
  }
  const callbacks = listenerMap.get(channel)!;
  callbacks.add(callback);
  console.log(`[PRELOAD] Subscribed to ${channel}. Total listeners: ${callbacks.size}`);
  return () => {
    callbacks.delete(callback);
    console.log(`[PRELOAD] Unsubscribed from ${channel}. Total listeners: ${callbacks.size}`);
  };
}

/**
 * Sanctuary API exposed to the renderer process.
 * All methods are async and return promises.
 */
const sanctuaryAPI = {
  // ---- App ----
  app: {
    getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
    getPath: (name: string): Promise<string> => ipcRenderer.invoke('app:getPath', name),
    quit: (): Promise<void> => ipcRenderer.invoke('app:quit'),
    minimize: (): Promise<void> => ipcRenderer.invoke('app:minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('app:maximize'),
  },

  // ---- License ----
  license: {
    validate: (licenseKey: string) => ipcRenderer.invoke('license:validate', licenseKey),
    startTrial: (email: string, fullName: string) => ipcRenderer.invoke('license:start-trial', email, fullName),
    getCached: () => ipcRenderer.invoke('license:get-cached'),
    clear: () => ipcRenderer.invoke('license:clear'),
  },

  // ---- Shell (open external URLs) ----
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },

  // ---- Bible ----
  bible: {
    importXml: (filePath?: string) => ipcRenderer.invoke('bible:import', filePath),
    getTranslations: () => ipcRenderer.invoke('bible:getTranslations'),
    getBooks: () => ipcRenderer.invoke('bible:getBooks'),
    getVerses: (bookName: string, chapter: number) =>
      ipcRenderer.invoke('bible:getVerses', bookName, chapter),
    getPassage: (bookName: string, chapter: number, verseStart: number, verseEnd: number) =>
      ipcRenderer.invoke('bible:getPassage', bookName, chapter, verseStart, verseEnd),
    search: (query: string, limit?: number) =>
      ipcRenderer.invoke('bible:search', query, limit),
    setTranslation: (translationId: string) =>
      ipcRenderer.invoke('bible:setTranslation', translationId),
  },

  // ---- Services ----
  service: {
    create: (name: string) => ipcRenderer.invoke('service:create', name),
    load: (id: string) => ipcRenderer.invoke('service:load', id),
    save: (serviceData: string) => ipcRenderer.invoke('service:save', serviceData),
    delete: (id: string) => ipcRenderer.invoke('service:delete', id),
    list: () => ipcRenderer.invoke('service:list'),
  },

  // ---- Songs ----
  song: {
    create: (songData: string) => ipcRenderer.invoke('song:create', songData),
    load: (id: string) => ipcRenderer.invoke('song:load', id),
    update: (id: string, updates: string) => ipcRenderer.invoke('song:update', id, updates),
    delete: (id: string) => ipcRenderer.invoke('song:delete', id),
    list: (limit?: number) => ipcRenderer.invoke('song:list', limit),
    search: (query: string, limit?: number) => ipcRenderer.invoke('song:search', query, limit),
    import: () => ipcRenderer.invoke('song:import'),
    fetchLyrics: (query: string) => ipcRenderer.invoke('song:fetchLyrics', query),
  },

  // ---- Media ----
  media: {
    import: () => ipcRenderer.invoke('media:import'),
    list: () => ipcRenderer.invoke('media:list'),
    delete: (id: string) => ipcRenderer.invoke('media:delete', id),
  },

  // ---- Themes ----
  theme: {
    list: () => ipcRenderer.invoke('theme:list'),
    get: (id: string) => ipcRenderer.invoke('theme:get', id),
    create: (themeData: string) => ipcRenderer.invoke('theme:create', themeData),
    update: (id: string, themeData: string) => ipcRenderer.invoke('theme:update', id, themeData),
    delete: (id: string) => ipcRenderer.invoke('theme:delete', id),
  },

  // ---- Lower Thirds ----
  lowerThirds: {
    list: () => ipcRenderer.invoke('lowerThirds:list'),
    get: (id: string) => ipcRenderer.invoke('lowerThirds:get', id),
    create: (data: string) => ipcRenderer.invoke('lowerThirds:create', data),
    update: (id: string, data: string) => ipcRenderer.invoke('lowerThirds:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('lowerThirds:delete', id),
  },

  // ---- Presentation ----
  presentation: {
    getCurrentSlide: (): Promise<string | null> => ipcRenderer.invoke('presentation:getCurrentSlide'),
    setSlide: (slideData: string) =>
      ipcRenderer.invoke('presentation:setSlide', slideData),
    clear: () => ipcRenderer.invoke('presentation:clear'),
    blackout: (isBlack: boolean) =>
      ipcRenderer.invoke('presentation:blackout', isBlack),
    onUpdate: (callback: (data: string) => void) => {
      return subscribeChannel('presentation:update', callback);
    },
    mediaCommand: (commandData: string) =>
      ipcRenderer.invoke('presentation:mediaCommand', commandData),
    onMediaCommand: (callback: (data: string) => void) => {
      return subscribeChannel('presentation:mediaCommand', callback);
    },
    onClear: (callback: () => void) => {
      return subscribeChannel('presentation:clear', callback);
    },
    onBlackout: (callback: (isBlack: boolean) => void) => {
      return subscribeChannel('presentation:blackout', callback);
    },
  },

  // ---- Display ----
  display: {
    getAll: () => ipcRenderer.invoke('display:getAll'),
    openOutput: (displayId?: string) => ipcRenderer.invoke('display:openOutput', displayId),
    closeOutput: () => ipcRenderer.invoke('display:closeOutput'),
    openStage: (displayId?: string) => ipcRenderer.invoke('display:openStage', displayId),
    closeStage: () => ipcRenderer.invoke('display:closeStage'),
    toggleFullscreen: () => ipcRenderer.invoke('display:toggleFullscreen'),
  },

  // ---- NDI ----
  ndi: {
    getHealth: () => ipcRenderer.invoke('ndi:getHealth'),
    restart: () => ipcRenderer.invoke('ndi:restart'),
  },

  // ---- OBS ----
  obs: {
    getHealth: () => ipcRenderer.invoke('obs:getHealth'),
    reconnect: () => ipcRenderer.invoke('obs:reconnect'),
    getScenes: () => ipcRenderer.invoke('obs:getScenes'),
    setScene: (sceneName: string) => ipcRenderer.invoke('obs:setScene', sceneName),
    toggleSource: (sceneName: string, sourceName: string, enabled: boolean) => ipcRenderer.invoke('obs:toggleSource', sceneName, sourceName, enabled),
    onStateChange: (callback: (state: any) => void) => {
      return subscribeChannel('obs:state', callback);
    }
  },

  // ---- vMix ----
  vmix: {
    getHealth: () => ipcRenderer.invoke('vmix:getHealth'),
    reconnect: () => ipcRenderer.invoke('vmix:reconnect'),
    setTitleText: (input: string, titleName: string, text: string) => ipcRenderer.invoke('vmix:setTitleText', input, titleName, text),
    transition: (input: string, transitionType: string, duration: number) => ipcRenderer.invoke('vmix:transition', input, transitionType, duration),
    onStateChange: (callback: (state: any) => void) => {
      return subscribeChannel('vmix:state', callback);
    }
  },

  // ---- Settings ----
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', key, value),
  },

  // ---- Data Import/Export ----
  data: {
    importOpenLP: (filePath: string) => ipcRenderer.invoke('data:importOpenLP', filePath),
    importCCLI: (filePath: string) => ipcRenderer.invoke('data:importCCLI', filePath),
    importUSFM: (filePath: string, transId: string, transName: string) => ipcRenderer.invoke('data:importUSFM', filePath, transId, transName),
    createBackup: (targetDir: string) => ipcRenderer.invoke('data:createBackup', targetDir),
    restoreBackup: (filePath: string) => ipcRenderer.invoke('data:restoreBackup', filePath),
  },

  // ---- Recent Items ----
  recent: {
    add: (type: string, reference: string, data?: string) =>
      ipcRenderer.invoke('recent:add', type, reference, data),
    list: (type?: string, limit?: number) =>
      ipcRenderer.invoke('recent:list', type, limit),
  },

  // ---- Remote Control ----
  remote: {
    getInfo: () => ipcRenderer.invoke('remote:get_info')
  },

  // ---- AI / Speech ----
  ai: {
    sendAudio: (buffer: ArrayBuffer) => 
      ipcRenderer.invoke('ai:sendAudio', buffer),
    onTranscriptPartial: (callback: (text: string) => void) => {
      return subscribeChannel('ai:transcript:partial', callback);
    },
    onTranscriptResult: (callback: (text: string) => void) => {
      return subscribeChannel('ai:transcript:result', callback);
    },
    onReferencesDetected: (callback: (refs: any[]) => void) => {
      return subscribeChannel('ai:references:detected', callback);
    },
    onAction: (callback: (action: string, payload?: any) => void) => {
      return subscribeChannel('ai:action', callback);
    },
    onCommandExecuted: (callback: (info: any) => void) => {
      return subscribeChannel('ai:command:executed', callback);
    },
    onSuggestion: (callback: (suggestion: any) => void) => {
      return subscribeChannel('ai:suggestion', callback);
    },
    executeSuggestion: (suggestion: any) => 
      ipcRenderer.invoke('ai:execute_suggestion', suggestion),
    simulateTranscript: (text: string, isFinal: boolean = true) =>
      ipcRenderer.invoke('ai:simulate_transcript', text, isFinal),
  },
};

// Expose API to renderer
contextBridge.exposeInMainWorld('sanctuary', sanctuaryAPI);

// Type declaration for the renderer
export type SanctuaryAPI = typeof sanctuaryAPI;

