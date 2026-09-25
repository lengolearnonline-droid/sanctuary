// ============================================================
// Sanctuary — Electron Main Process
// ============================================================
//
// This is the entry point for the Electron main process.
// It creates the operator window, manages the application lifecycle,
// initializes core services, and sets up IPC handlers.
//

import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow, ipcMain, screen, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { DatabaseService } from '../core/database/DatabaseService';
import { BibleImporter } from './bible/BibleImporter';
import { Logger } from '../core/services/Logger';
import { BibleEngine } from '../core/bible/BibleEngine';
import { ServiceManager } from '../core/services/ServiceManager';
import { SongManager } from '../core/songs/SongManager';
import { SongImporter } from '../core/songs/SongImporter';
import { LyricsFetcher } from '../core/songs/LyricsFetcher';
import { MediaManager } from '../core/media/MediaManager';
import { OutputManager } from '../core/display/OutputManager';
import { OBSService } from '../core/broadcast/OBSService';
import { VMixService } from '../core/broadcast/VMixService';
import { DataImportExportService } from '../core/services/DataImportExportService';
import { safeHandle, SafeExistingFilePath, SafeDirPath, JsonString } from '../core/security/ipcGuard';
import { ThemeManager } from '../core/themes/ThemeManager';
import { LowerThirdManager } from '../core/lower_thirds/LowerThirdManager';
import { z } from 'zod';
import { registerLicenseHandlers } from './license/licenseHandler';

// ---- Globals ----

let mainWindow: BrowserWindow | null = null;
let programWindow: BrowserWindow | null = null;
let stageWindow: BrowserWindow | null = null;
let currentSlideData: string | null = null;
let db: DatabaseService;
let bibleEngine: BibleEngine;
let serviceManager: ServiceManager;
let voskEngine: any; // We'll instantiate later
let songManager: SongManager;
let songImporter: SongImporter;
let lyricsFetcher: LyricsFetcher;
let mediaManager: MediaManager;
let themeManager: ThemeManager;
let lowerThirdManager: LowerThirdManager;
let outputManager: OutputManager;
let obsService: OBSService;
let vmixService: VMixService;
let dataImportExportService: DataImportExportService;

const logger = new Logger('Main');
const isDev = !app.isPackaged;

// --- App Flags ---
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows', 'true');
app.commandLine.appendSwitch('disable-renderer-backgrounding', 'true');
app.commandLine.appendSwitch('enable-usermedia-screen-capturing');
app.commandLine.appendSwitch('allow-file-access-from-files');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
// -----------------

// ---- Path Configuration ----

function getDataPath(): string {
  return path.join(app.getPath('userData'), 'data');
}

function getLogPath(): string {
  return path.join(app.getPath('userData'), 'logs');
}

// ---- Window Creation ----

function createMainWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1600, width),
    height: Math.min(1000, height),
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Required for better-sqlite3 in preload
      webSecurity: false, // Required for getUserMedia on file://
      autoplayPolicy: 'no-user-gesture-required',
    },
    icon: path.join(__dirname, '../../../assets/icon.png'),
    title: 'Sanctuary Operator'
  });

  // Auto-allow all permissions (especially media/microphone)
  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });
  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission) => {
    return true;
  });


  // Load content (Force local file since dev server isn't running for the user)
  mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));

  // Hide the native menu bar (File, Edit, View, Window, Help)
  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.autoHideMenuBar = true;

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (mainWindow && db.getSetting('general.startMaximized') === 'true') {
      mainWindow.maximize();
    }
    if (obsService) {
      obsService.setMainWindow(mainWindow);
    }
    if (vmixService) {
      vmixService.setMainWindow(mainWindow);
    }
    logger.info('Main window ready');
  });

  // Handle close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

/**
 * Create a fullscreen program output window on a specific display
 */
function createProgramWindow(displayId?: string): BrowserWindow | null {
  if (programWindow && !programWindow.isDestroyed()) {
    logger.info('Program window already exists. Focusing instead.');
    programWindow.focus();
    return programWindow;
  }

  const displays = screen.getAllDisplays();
  
  // 1. Try passed ID
  // 2. Try saved setting ID
  // 3. Fallback to first non-primary display
  // 4. Fallback to primary display
  const savedDisplayId = displayId || db.getSetting('display.programId');
  
  let targetDisplay = savedDisplayId 
    ? displays.find((d) => d.id.toString() === savedDisplayId)
    : null;

  if (!targetDisplay) {
    targetDisplay = displays.find((d) => !d.bounds.x && !d.bounds.y ? false : true) || displays[0];
  }

  if (!targetDisplay) {
    logger.warn('No target display found for program output');
    return null;
  }

  programWindow = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height,
    fullscreen: true,
    frame: false,
    transparent: false,
    backgroundColor: '#00FF00', // Chroma Key Green
    skipTaskbar: true,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, webSecurity: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  // Force local file since dev server isn't running for the user
  programWindow.loadFile(path.join(__dirname, '../../renderer/program.html'));
  programWindow.webContents.setBackgroundThrottling(false);

  programWindow.webContents.on('did-finish-load', () => {
    if (currentSlideData && programWindow && !programWindow.isDestroyed()) {
      programWindow.webContents.send('presentation:update', currentSlideData);
    }
  });

  programWindow.on('closed', () => {
    if (outputManager) outputManager.unregisterProgramOutput();
    programWindow = null;
  });

  logger.info('Program window created', {
    display: targetDisplay.id,
    resolution: `${targetDisplay.bounds.width}x${targetDisplay.bounds.height}`,
  });

  if (outputManager) {
    outputManager.registerProgramOutput(programWindow);
  }

  return programWindow;
}

/**
 * Create a fullscreen stage display window on a specific display
 */
function createStageWindow(displayId?: string): BrowserWindow | null {
  const displays = screen.getAllDisplays();
  const savedDisplayId = displayId || db.getSetting('display.stageId');
  
  let targetDisplay = savedDisplayId 
    ? displays.find((d) => d.id.toString() === savedDisplayId)
    : null;

  if (!targetDisplay) {
    targetDisplay = displays.find((d) => !d.bounds.x && !d.bounds.y ? false : true) || displays[0];
  }

  if (!targetDisplay) {
    logger.warn('No target display found for stage output');
    return null;
  }

  stageWindow = new BrowserWindow({
    x: targetDisplay.bounds.x,
    y: targetDisplay.bounds.y,
    width: targetDisplay.bounds.width,
    height: targetDisplay.bounds.height,
    fullscreen: true,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0a',
    skipTaskbar: true,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, webSecurity: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  // Force local file since dev server isn't running for the user
  stageWindow.loadFile(path.join(__dirname, '../../renderer/stage.html'));

  stageWindow.on('closed', () => {
    stageWindow = null;
  });

  logger.info('Stage window created', {
    display: targetDisplay.id,
    resolution: `${targetDisplay.bounds.width}x${targetDisplay.bounds.height}`,
  });

  return stageWindow;
}

// ---- IPC Handlers ----

function setupIPC(): void {
  // ---- License ----
  registerLicenseHandlers();

  // ---- Shell ----
  ipcMain.handle('shell:openExternal', (_event, url: string) => {
    shell.openExternal(url);
  });

  // ---- Display ----
  ipcMain.handle('display:getAll', () => {
    return screen.getAllDisplays().map((d) => ({
      id: d.id.toString(),
      label: d.label || `Display ${d.id}`,
      x: d.bounds.x,
      y: d.bounds.y,
      width: d.bounds.width,
      height: d.bounds.height,
      isPrimary: d.bounds.x === 0 && d.bounds.y === 0,
      scaleFactor: d.scaleFactor,
    }));
  });

  ipcMain.handle('display:openOutput', (_event, displayId: string) => {
    createProgramWindow(displayId);
    return true;
  });

  ipcMain.handle('display:closeOutput', () => {
    if (programWindow) {
      programWindow.close();
      programWindow = null;
    }
    return true;
  });

  ipcMain.handle('display:toggleFullscreen', () => {
    if (programWindow) {
      programWindow.setFullScreen(!programWindow.isFullScreen());
    }
    return true;
  });

  ipcMain.handle('display:openStage', (_event, displayId: string) => {
    createStageWindow(displayId);
    return true;
  });

  ipcMain.handle('display:closeStage', () => {
    if (stageWindow) {
      stageWindow.close();
      stageWindow = null;
    }
    return true;
  });

  // ---- NDI ----
  ipcMain.handle('ndi:getHealth', () => {
    return outputManager ? outputManager.getNDIHealth() : null;
  });

  ipcMain.handle('ndi:restart', async () => {
    if (programWindow) {
      // Unregister and re-register to re-initialize NDI
      outputManager.unregisterProgramOutput();
      outputManager.registerProgramOutput(programWindow);
    }
    return true;
  });

  // ---- OBS ----
  ipcMain.handle('obs:getHealth', () => {
    return obsService ? obsService.getHealth() : null;
  });

  ipcMain.handle('obs:reconnect', async () => {
    if (obsService) {
      await obsService.disconnect();
      await obsService.connect();
    }
    return true;
  });

  ipcMain.handle('obs:getScenes', async () => {
    return obsService ? obsService.getScenes() : [];
  });

  ipcMain.handle('obs:setScene', async (_event, sceneName: string) => {
    return obsService ? obsService.setCurrentScene(sceneName) : false;
  });

  ipcMain.handle('obs:toggleSource', async (_event, sceneName: string, sourceName: string, enabled: boolean) => {
    return obsService ? obsService.toggleSource(sceneName, sourceName, enabled) : false;
  });

  // ---- vMix ----
  ipcMain.handle('vmix:getHealth', () => {
    return vmixService ? vmixService.getHealth() : null;
  });

  ipcMain.handle('vmix:reconnect', async () => {
    if (vmixService) await vmixService.connect();
    return true;
  });

  ipcMain.handle('vmix:setTitleText', async (_event, input: string, titleName: string, text: string) => {
    return vmixService ? vmixService.setTitleText(input, titleName, text) : false;
  });

  ipcMain.handle('vmix:transition', async (_event, input: string, transitionType: string, duration: number) => {
    return vmixService ? vmixService.transition(input, transitionType, duration) : false;
  });

  // ---- Presentation ----
  ipcMain.handle('presentation:getCurrentSlide', () => {
    return currentSlideData;
  });

  ipcMain.handle('presentation:setSlide', (_event, slideData: string) => {
    currentSlideData = slideData;
    const allWindows = BrowserWindow.getAllWindows();
    let sentCount = 0;
    const windowTitles = allWindows.map(w => w.getTitle());
    
    allWindows.forEach(w => {
      if (!w.isDestroyed()) {
        try {
          w.webContents.send('presentation:update', slideData);
          sentCount++;
        } catch (e) {
          logger.error('Failed to send to window', { id: w.id, error: String(e) });
        }
      }
    });
    return { received: true, windowExists: !!programWindow, success: true, pid: process.pid, totalWindows: allWindows.length, sentCount, windowTitles };
  });

  ipcMain.handle('presentation:mediaCommand', (_event, commandData: string) => {
    BrowserWindow.getAllWindows().forEach(w => {
      if (!w.isDestroyed()) {
        w.webContents.send('presentation:mediaCommand', commandData);
      }
    });
    return true;
  });

  ipcMain.handle('presentation:clear', () => {
    currentSlideData = null;
    BrowserWindow.getAllWindows().forEach(w => {
      if (!w.isDestroyed()) {
        w.webContents.send('presentation:clear');
      }
    });
    return true;
  });

  ipcMain.handle('presentation:blackout', (_event, isBlack: boolean) => {
    BrowserWindow.getAllWindows().forEach(w => {
      if (!w.isDestroyed()) {
        w.webContents.send('presentation:blackout', isBlack);
      }
    });
    return true;
  });

  // ---- Bible ----
  ipcMain.handle('bible:import', async (_event, filePath?: string) => {
    try {
      let finalPath = filePath;
      if (!finalPath) {
        const { dialog } = require('electron');
        const res = await dialog.showOpenDialog(mainWindow || undefined, {
          title: 'Select Bible XML File',
          filters: [{ name: 'XML Files', extensions: ['xml'] }],
          properties: ['openFile']
        });
        if (res.canceled || res.filePaths.length === 0) {
          return { success: false, error: 'User cancelled the file selection.' };
        }
        finalPath = res.filePaths[0];
      }

      const importer = new BibleImporter(db.getDatabase());
      const result = await importer.importXml(finalPath!);
      
      // Refresh bible engine to pick up new translations
      bibleEngine = new BibleEngine();
      await loadBibleData(); 
      
      return { success: true, message: result };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('bible:getTranslations', () => {
    return bibleEngine.getTranslations();
  });

  ipcMain.handle('bible:getBooks', () => {
    return bibleEngine.getBooks();
  });

  ipcMain.handle('bible:getVerses', (_event, bookName: string, chapter: number) => {
    return bibleEngine.getVerses(bookName, chapter);
  });

  ipcMain.handle('bible:getPassage', (
    _event,
    bookName: string,
    chapter: number,
    verseStart: number,
    verseEnd: number
  ) => {
    return bibleEngine.getPassage(bookName, chapter, verseStart, verseEnd);
  });

  ipcMain.handle('bible:search', (_event, query: string, limit?: number) => {
    return bibleEngine.search(query, limit);
  });

  ipcMain.handle('bible:setTranslation', (_event, translationId: string) => {
    bibleEngine.setActiveTranslation(translationId);
    return true;
  });

  // ---- Services ----
  safeHandle('service:create', z.tuple([z.string().min(1)]), async (name: string) => {
    return serviceManager.createService(name);
  });

  safeHandle('service:load', z.tuple([z.string().uuid()]), async (id: string) => {
    return serviceManager.loadService(id);
  });

  safeHandle('service:save', z.tuple([JsonString]), async (serviceData: string) => {
    return serviceManager.saveService(JSON.parse(serviceData));
  });

  safeHandle('service:delete', z.tuple([z.string().uuid()]), async (id: string) => {
    return serviceManager.deleteService(id);
  });

  ipcMain.handle('service:list', () => {
    return serviceManager.listServices();
  });



  // ---- Songs ----
  safeHandle('song:create', z.tuple([JsonString]), async (songData: string) => {
    return songManager.createSong(JSON.parse(songData));
  });

  safeHandle('song:load', z.tuple([z.string().uuid()]), async (id: string) => {
    return songManager.getSong(id);
  });

  safeHandle('song:update', z.tuple([z.string().uuid(), JsonString]), async (id: string, updates: string) => {
    return songManager.updateSong(id, JSON.parse(updates));
  });

  safeHandle('song:delete', z.tuple([z.string().uuid()]), async (id: string) => {
    songManager.deleteSong(id);
    return true;
  });

  ipcMain.handle('song:list', (_event, limit?: number) => {
    return songManager.listSongs(limit);
  });

  ipcMain.handle('song:search', (_event, query: string, limit?: number) => {
    return songManager.searchSongs(query, limit);
  });

  ipcMain.handle('song:import', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Import Songs',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Song Files', extensions: ['xml', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (canceled || filePaths.length === 0) return { success: false, message: 'Canceled' };

    let successCount = 0;
    const errors: string[] = [];

    for (const file of filePaths) {
      try {
        await songImporter.importFile(file);
        successCount++;
      } catch (err) {
        errors.push(`${require('path').basename(file)}: ${String(err)}`);
      }
    }

    return { 
      success: errors.length === 0, 
      message: `Imported ${successCount} songs. ${errors.length ? 'Errors: ' + errors.join(', ') : ''}`
    };
  });

  ipcMain.handle('song:fetchLyrics', async (_event, query: string) => {
    return lyricsFetcher.fetchAndParse(query);
  });

  // ---- Media ----
  ipcMain.handle('media:import', async () => {
    return await mediaManager.importMedia();
  });
  ipcMain.handle('media:list', () => {
    return mediaManager.listMedia();
  });
  ipcMain.handle('media:delete', (_event, id: string) => {
    mediaManager.deleteMedia(id);
    return true;
  });

  // ---- Themes ----
  ipcMain.handle('theme:list', () => {
    return themeManager.getThemes();
  });

  ipcMain.handle('theme:get', (_event, id: string) => {
    return themeManager.getTheme(id);
  });

  ipcMain.handle('theme:create', (_event, themeData: string) => {
    themeManager.createTheme(JSON.parse(themeData));
    return true;
  });

  ipcMain.handle('theme:update', (_event, id: string, themeData: string) => {
    themeManager.updateTheme(id, JSON.parse(themeData));
    return true;
  });

  ipcMain.handle('theme:delete', (_event, id: string) => {
    themeManager.deleteTheme(id);
    return true;
  });

  // ---- Lower Thirds ----
  ipcMain.handle('lowerThirds:list', () => {
    return lowerThirdManager.getAll();
  });

  ipcMain.handle('lowerThirds:get', (_event, id: string) => {
    return lowerThirdManager.get(id);
  });

  ipcMain.handle('lowerThirds:create', (_event, data: string) => {
    return lowerThirdManager.create(JSON.parse(data));
  });

  ipcMain.handle('lowerThirds:update', (_event, id: string, data: string) => {
    lowerThirdManager.update(id, JSON.parse(data));
    return true;
  });

  ipcMain.handle('lowerThirds:delete', (_event, id: string) => {
    lowerThirdManager.delete(id);
    return true;
  });

  // ---- Settings ----
  ipcMain.handle('settings:get', (_event, key: string) => {
    return db.getSetting(key);
  });

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    db.setSetting(key, value);
    return true;
  });

  // ---- App ----
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:getPath', (_event, name: string) => {
    return app.getPath(name as 'userData' | 'documents' | 'temp');
  });

  ipcMain.handle('app:quit', () => {
    app.quit();
  });

  ipcMain.handle('app:minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('app:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  // ---- Data Import/Export (Secured) ----
  safeHandle('data:importOpenLP', z.tuple([SafeExistingFilePath]), async (filePath: string) => {
    return dataImportExportService.importFromOpenLP(filePath);
  });

  safeHandle('data:importCCLI', z.tuple([SafeExistingFilePath]), async (filePath: string) => {
    return dataImportExportService.importFromCCLI(filePath);
  });

  safeHandle('data:importUSFM', z.tuple([SafeExistingFilePath, z.string(), z.string()]), async (filePath: string, transId: string, transName: string) => {
    return dataImportExportService.importUSFMBible(filePath, transId, transName);
  });

  safeHandle('data:createBackup', z.tuple([SafeDirPath]), async (targetDir: string) => {
    return dataImportExportService.createBackup(targetDir);
  });

  safeHandle('data:restoreBackup', z.tuple([SafeExistingFilePath]), async (filePath: string) => {
    return dataImportExportService.restoreBackup(filePath);
  });

  // ---- Recent Items ----
  ipcMain.handle('recent:add', (_event, type: string, reference: string, data: string) => {
    db.addRecentItem(type, reference, JSON.parse(data || '{}'));
    return true;
  });

  ipcMain.handle('recent:list', (_event, type?: string, limit?: number) => {
    return db.getRecentItems(type, limit);
  });

  // ---- AI / Speech ----
  ipcMain.handle('ai:sendAudio', (_event, buffer: ArrayBuffer) => {
    if (voskEngine) {
      voskEngine.processAudio(buffer);
    }
    return true;
  });
}

// ---- Application Lifecycle ----

async function initializeApp(): Promise<void> {
  // Initialize logging
  Logger.initialize(getLogPath(), isDev ? 'debug' : 'info');
  logger.info('Sanctuary starting', { version: app.getVersion(), isDev });

  // Initialize database
  db = new DatabaseService(getDataPath());
  await db.initialize();

  // Initialize Bible engine
  bibleEngine = new BibleEngine();

  // Load Bible data (will be done via SQLiteBibleProvider once data is imported)
  await loadBibleData();

  // Initialize service manager
  serviceManager = new ServiceManager(db);

  // Initialize song manager
  songManager = new SongManager(db);
  songImporter = new SongImporter(db, songManager);
  lyricsFetcher = new LyricsFetcher();
  mediaManager = new MediaManager(db);
  themeManager = new ThemeManager(db);
  lowerThirdManager = new LowerThirdManager(db);

  // Initialize output manager
  outputManager = new OutputManager(db);

  // Initialize OBS Service
  obsService = new OBSService(db);
  if (mainWindow) obsService.setMainWindow(mainWindow);
  obsService.connect();


  // Initialize vMix Service
  vmixService = new VMixService(db);
  if (mainWindow) vmixService.setMainWindow(mainWindow);
  vmixService.connect();

  // Initialize Data Import/Export Engine
  dataImportExportService = new DataImportExportService(db);

  // Setup IPC
  setupIPC();

  // Check for crash recovery
  const recovery = db.getLatestRecovery();
  if (recovery) {
    logger.info('Recovery data found', { sessionId: recovery.sessionId });
    // TODO: Show recovery dialog in renderer
  }

  // Auto-launch Program Window if enabled
  if (db.getSetting('display.autoLaunch') === 'true') {
    logger.info('Auto-launching program window');
    createProgramWindow();
  }

  // Auto-launch Stage Window if enabled
  if (db.getSetting('display.autoLaunchStage') === 'true') {
    logger.info('Auto-launching stage window');
    createStageWindow();
  }

  // Initialize AI / Speech Engine
  const { VoskEngine } = require('./ai/VoskEngine');
  const { ScriptureExtractor } = require('./ai/ScriptureExtractor');
  const { CommandGateway } = require('./ai/CommandGateway');
  
  voskEngine = new VoskEngine();
  const commandGateway = new CommandGateway();
  await voskEngine.initialize();

  // Route transcript tokens back to the dashboard renderer
  voskEngine.on('partial', (text: string) => {
    if (mainWindow) mainWindow.webContents.send('ai:transcript:partial', text);
    commandGateway.handleTranscript(text, false, programWindow, stageWindow, mainWindow);
  });
  
  voskEngine.on('result', (text: string) => {
    if (mainWindow) {
      mainWindow.webContents.send('ai:transcript:result', text);
      
      // Run NLP Scripture Extraction
      const refs = ScriptureExtractor.extract(text);
      if (refs && refs.length > 0) {
        mainWindow.webContents.send('ai:references:detected', refs);
      }
    }

    // Run Command Interpreter on the final transcript token
    commandGateway.handleTranscript(text, true, programWindow, stageWindow, mainWindow);
  });

  ipcMain.handle('ai:execute_suggestion', (_event, suggestion: any) => {
    logger.info('Executing human-validated suggestion', { intent: suggestion.data.intent });
    commandGateway.executeCommand(suggestion.data, programWindow, stageWindow, mainWindow);
    return true;
  });

  // Mock endpoint for simulating transcripts when Vosk is unavailable
  ipcMain.handle('ai:simulate_transcript', (_event, text: string, isFinal: boolean = true) => {
    logger.info('Simulating AI transcript', { text });
    if (mainWindow) {
      mainWindow.webContents.send('ai:transcript:result', text);
      const refs = ScriptureExtractor.extract(text);
      if (refs && refs.length > 0) {
        mainWindow.webContents.send('ai:references:detected', refs);
      }
    }
    commandGateway.handleTranscript(text, true, programWindow, stageWindow, mainWindow);
    return true;
  });

  logger.info('Application initialized');
}

async function loadBibleData(): Promise<void> {
  try {
    const { SQLiteBibleProvider } = require('../core/bible/SQLiteBibleProvider');
    const { BibleImporter: OldBibleImporter } = require('../core/bible/BibleImporter');
    const oldImporter = new OldBibleImporter(db);

    const checkAndImport = async (
      id: string, 
      name: string, 
      abbreviation: string, 
      fileName: string
    ) => {
      const dataPath = isDev
        ? path.join(__dirname, `../../../bible-data/${fileName}`)
        : path.join(process.resourcesPath, `bible-data/${fileName}`);

      if (fs.existsSync(dataPath)) {
        await oldImporter.importFromJsonFile(id, dataPath, 'en', 'Public Domain', true);
      }
    };

    // Load default bundled JSON translations
    await checkAndImport('web', 'World English Bible', 'WEB', 'web.json');
    await checkAndImport('kjv', 'King James Version', 'KJV', 'kjv.json');

    // Auto-import XML Bibles from Documents folder if they exist
    try {
      const { BibleImporter: XmlBibleImporter } = require('./bible/BibleImporter');
      const xmlImporter = new XmlBibleImporter(db.getDatabase());
      const biblesDir = 'C:\\Users\\OBITECH\\Documents\\Bible';
      
      if (fs.existsSync(biblesDir)) {
        const files = fs.readdirSync(biblesDir).filter((f: string) => f.toLowerCase().endsWith('.xml'));
        for (const file of files) {
          const fullPath = path.join(biblesDir, file);
          try {
            await xmlImporter.importXml(fullPath);
          } catch (err) {
            logger.error(`Failed to auto-import ${file}`, { error: String(err) });
          }
        }
      }
    } catch (err) {
      logger.error('Failed to run XML auto-import phase', { error: String(err) });
    }

    // Fix existing abbreviations that were incorrectly sliced to 5 chars (e.g. 'ENGLI')
    const allT = db.query('SELECT id, name FROM bible_translations');
    for (const t of (allT as any[])) {
      let abbr = t.name.substring(0, 5).toUpperCase();
      const n = t.name.toUpperCase();
      if (n.includes('NIV')) abbr = 'NIV';
      else if (n.includes('NKJ')) abbr = 'NKJV';
      else if (n.includes('NLT')) abbr = 'NLT';
      else if (n.includes('GNT')) abbr = 'GNT';
      else if (n.includes('AMPLIFIED')) abbr = 'AMP';
      else if (n.includes('HEBREW')) abbr = 'HEB';
      else if (n.includes('YORUBA')) abbr = 'YOR';
      else if (n.includes('AKUAPEM')) abbr = 'TWI-A';
      else if (n.includes('ASANTE')) abbr = 'TWI-S';
      
      db.execute(`UPDATE bible_translations SET abbreviation = ? WHERE id = ?`, [abbr, t.id]);
    }

    // Register ALL translations that exist in the database!
    const translations = db.query('SELECT id, abbreviation FROM bible_translations');
    for (const t of (translations as any[])) {
      const provider = new SQLiteBibleProvider(db, t.id);
      bibleEngine.registerProvider(provider);
      logger.info(`${t.abbreviation} translation registered`);
    }

  } catch (error) {
    logger.error('Failed to load Bible data', { error: String(error) });
  }
}

// ---- App Events ----

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    try {
      await initializeApp();
      createMainWindow();
      autoUpdater.checkForUpdatesAndNotify();
  } catch (error) {
    logger.fatal('Failed to start application', { error: String(error) });
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
      autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('before-quit', () => {
  // Save recovery data
  try {
    if (serviceManager && db) {
      const activeService = serviceManager.getActiveService();
      if (activeService) {
        db.saveRecoveryData(
          `session-${Date.now()}`,
          JSON.stringify(activeService)
        );
        logger.info('Recovery data saved');
      }
    }
  } catch (error) {
    logger.error('Failed to save recovery data', { error: String(error) });
  }

  // Close database
  if (db) {
    db.close();
  }

  if (outputManager) {
    outputManager.shutdown();
  }

  if (obsService) {
    obsService.disconnect();
  }

  if (vmixService) {
    vmixService.disconnect();
  }

  Logger.shutdown();
});

// ---- Global Error Handling ----

process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught exception', { error: error.message, stack: error.stack });
  // Don't crash — try to keep running for live presentation
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
});

}


