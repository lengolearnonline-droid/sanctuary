// ============================================================
// Sanctuary — Core Type Definitions
// ============================================================

// ---- Common Types ----

export type UUID = string;

export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

export interface Identifiable {
  id: UUID;
}

export interface Entity extends Identifiable, Timestamped {}

// ---- Service Planning ----

export interface Service extends Entity {
  name: string;
  description: string;
  date: string;
  items: ServiceItem[];
  isAutosaved: boolean;
  lastAutosavedAt: string | null;
}

export type ServiceItemType =
  | 'scripture'
  | 'song'
  | 'media'
  | 'countdown'
  | 'announcement'
  | 'lower-third'
  | 'custom'
  | 'blank';

export interface ServiceItem extends Entity {
  serviceId: UUID;
  type: ServiceItemType;
  title: string;
  order: number;
  data: ServiceItemData;
  notes: string;
  duration: number | null; // seconds
}

export type ServiceItemData =
  | ScriptureItemData
  | SongItemData
  | MediaItemData
  | CountdownItemData
  | AnnouncementItemData
  | LowerThirdItemData
  | CustomItemData
  | BlankItemData;

export interface ScriptureItemData {
  type: 'scripture';
  translationId: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number | null;
  themeId: UUID | null;
}

export interface SongItemData {
  type: 'song';
  songId: UUID;
  arrangement: string[];
  themeId: UUID | null;
}

export interface MediaItemData {
  type: 'media';
  mediaId: UUID;
  loop: boolean;
  volume: number;
  startTime: number;
  endTime: number | null;
}

export interface CountdownItemData {
  type: 'countdown';
  duration: number; // seconds
  targetTime: string | null;
  label: string;
  themeId: UUID | null;
}

export interface AnnouncementItemData {
  type: 'announcement';
  title: string;
  description: string;
  date: string | null;
  time: string | null;
  location: string | null;
  imageMediaId: UUID | null;
  themeId: UUID | null;
}

export interface LowerThirdItemData {
  type: 'lower-third';
  lowerThirdId: UUID;
}

export interface CustomItemData {
  type: 'custom';
  html: string;
  themeId: UUID | null;
}

export interface BlankItemData {
  type: 'blank';
}

// ---- Bible ----

export interface BibleTranslation {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  copyright: string;
  isPublicDomain: boolean;
}

export interface BibleBook {
  id: number;
  name: string;
  abbreviation: string;
  testament: 'OT' | 'NT';
  chapters: number;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BiblePassage {
  translationId: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  verses: BibleVerse[];
  reference: string; // "John 3:16" formatted
}

export interface BibleSearchResult {
  verse: BibleVerse;
  relevance: number;
  translationId: string;
}

// ---- Songs / Lyrics ----

export type SongSectionType =
  | 'verse'
  | 'chorus'
  | 'bridge'
  | 'pre-chorus'
  | 'tag'
  | 'intro'
  | 'outro'
  | 'interlude';

export interface Song extends Entity {
  title: string;
  artist: string;
  author: string;
  copyright: string;
  ccliNumber: string;
  key: string;
  language: string;
  sections: SongSection[];
  arrangement: string[]; // ordered section IDs
  tags: string[];
}

export interface SongSection extends Identifiable {
  songId: UUID;
  type: SongSectionType;
  label: string; // "Verse 1", "Chorus", etc.
  lines: string[];
  order: number;
}

// ---- Media ----

export type MediaType = 'image' | 'video' | 'audio';

export interface MediaItem extends Entity {
  name: string;
  type: MediaType;
  path: string;
  size: number;
  duration: number | null; // seconds, for video/audio
  width: number | null;
  height: number | null;
  thumbnailPath: string | null;
  mimeType: string;
  tags: string[];
  category: string;
}

// ---- Themes ----

export interface Theme extends Entity {
  name: string;
  category: string;
  isBuiltIn: boolean;
  typography: ThemeTypography;
  colors: ThemeColors;
  background: ThemeBackground;
  layout: ThemeLayout;
  animation: ThemeAnimation;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: number; // base px
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textTransform: 'none' | 'uppercase' | 'lowercase';
  textShadow: string;
  verseNumberStyle: 'superscript' | 'inline' | 'hidden';
  referenceSize: number; // relative to base
}


export interface ThemeColors {
  textPrimary: string;
  textSecondary: string;
  referenceText?: string;
  referenceBackground?: string;

  accent: string;
  verseNumber: string;
  reference: string;
  overlayBackground: string; // Full-screen dimming overlay
  textBoxBackground?: string; // Shrink-wrapped box specifically around the text
}

export interface ThemeBackground {
  type: 'solid' | 'gradient' | 'image' | 'video';
  color: string;
  gradientStart: string;
  gradientEnd: string;
  gradientAngle: number;
  imagePath: string | null;
  videoPath: string | null;
  imageOpacity: number;
  blur: number;
  brightness: number;
}

export interface ThemeLayout {
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'center' | 'bottom';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  maxWidth: number; // percentage
  referenceAlign?: 'left' | 'center' | 'right';
}

export interface ThemeAnimation {
  transitionType: 'cut' | 'fade' | 'dissolve' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down';
  transitionDuration: number; // ms
  textAnimation: 'none' | 'fade-in' | 'type-in' | 'slide-up';
  textAnimationDuration: number; // ms
}

// ---- Lower Thirds ----

export interface LowerThird extends Entity {
  name: string;
  template: string;
  personName: string;
  title: string;
  organization: string;
  logoPath: string | null;
  colors: LowerThirdColors;
  typography: LowerThirdTypography;
  animation: LowerThirdAnimation;
  duration: number; // ms, 0 = manual
}

export interface LowerThirdColors {
  background: string;
  nameColor: string;
  titleColor: string;
  accentColor: string;
  borderColor: string;
}

export interface LowerThirdTypography {
  nameFont: string;
  nameSize: number;
  nameWeight: number;
  titleFont: string;
  titleSize: number;
  titleWeight: number;
}

export interface LowerThirdAnimation {
  enterType: 'slide-left' | 'slide-right' | 'slide-up' | 'fade' | 'scale';
  exitType: 'slide-left' | 'slide-right' | 'slide-down' | 'fade' | 'scale';
  enterDuration: number; // ms
  exitDuration: number; // ms
}

// ---- Presentation ----

export type PresentationTarget = 'preview' | 'program' | 'stage' | 'confidence';

export type SlideType = 'scripture' | 'song' | 'media' | 'countdown' | 'announcement' | 'lower-third' | 'custom' | 'blank';

export interface Slide {
  id: UUID;
  type: SlideType;
  content: SlideContent;
  theme: Theme;
  notes: string;
}

export interface SlideContent {
  title: string;
  body: string;
  subtitle: string;
  reference: string;
  mediaPath: string | null;
  html: string | null;
}

export interface PresentationState {
  currentSlide: Slide | null;
  nextSlide: Slide | null;
  previousSlide: Slide | null;
  isLive: boolean;
  isBlackout: boolean;
  isFrozen: boolean;
  transitionActive: boolean;
  currentServiceItemIndex: number;
  currentSlideIndex: number;
}

export type TransitionType = 'cut' | 'fade' | 'dissolve' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down';

// ---- Output / Display ----

export interface DisplayInfo {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isPrimary: boolean;
  scaleFactor: number;
}

export interface OutputConfig extends Entity {
  displayId: string;
  role: PresentationTarget;
  enabled: boolean;
  resolution: { width: number; height: number };
  fullscreen: boolean;
}

// ---- NDI / Broadcast ----

export interface NDIOutput {
  id: UUID;
  name: string;
  enabled: boolean;
  source: PresentationTarget;
  resolution: { width: number; height: number };
  frameRate: number;
  includeAudio: boolean;
  includeAlpha: boolean;
}

export interface OBSConfig {
  host: string;
  port: number;
  password: string;
  enabled: boolean;
  autoConnect: boolean;
}

export interface VMixConfig {
  host: string;
  port: number;
  enabled: boolean;
}

// ---- AI ----

export interface ScriptureReference {
  book: string;
  chapter: number;
  verses: number[];
  confidence: number;
  rawText: string;
}

export type AIConfidenceLevel = 'high' | 'medium' | 'low';

export interface AIConfidenceThresholds {
  autoDisplay: number; // default 0.90
  suggestion: number; // default 0.70
}

export interface AIDetectionResult {
  reference: ScriptureReference | null;
  confidence: AIConfidenceLevel;
  score: number;
  rawTranscription: string;
  timestamp: number;
}

export interface AICommand {
  intent: string;
  action: string;
  parameters: Record<string, unknown>;
  confidence: number;
  rawText: string;
}

export type AIProviderType = 'local' | 'cloud';

export interface AIProviderConfig {
  type: AIProviderType;
  modelPath: string | null; // for local models
  apiKey: string | null; // for cloud providers
  endpoint: string | null;
}

// ---- Audio ----

export interface AudioDevice {
  id: string;
  name: string;
  isDefault: boolean;
  sampleRate: number;
  channels: number;
}

export interface AudioPipelineConfig {
  deviceId: string | null;
  sampleRate: number;
  bufferSize: number;
  noiseSuppression: boolean;
  voiceActivityDetection: boolean;
  vadThreshold: number;
  enabled: boolean;
}

// ---- Settings ----

export interface AppSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  bible: BibleSettings;
  lyrics: LyricsSettings;
  audio: AudioPipelineConfig;
  ai: AISettings;
  displays: OutputConfig[];
  ndi: NDISettings;
  broadcast: BroadcastSettings;
  shortcuts: ShortcutMap;
  media: MediaSettings;
  storage: StorageSettings;
  updates: UpdateSettings;
}

export interface GeneralSettings {
  language: string;
  autoSaveInterval: number; // seconds
  crashRecovery: boolean;
  startMaximized: boolean;
  confirmOnExit: boolean;
}

export interface AppearanceSettings {
  theme: 'dark' | 'light';
  accentColor: string;
  fontSize: number;
  sidebarWidth: number;
  showStatusBar: boolean;
}

export interface BibleSettings {
  defaultTranslation: string;
  showVerseNumbers: boolean;
  paragraphMode: boolean;
  fontSize: number;
  defaultThemeId: UUID | null;
}

export interface LyricsSettings {
  defaultThemeId: UUID | null;
  showSectionLabels: boolean;
  fontSize: number;
}

export interface AISettings {
  enabled: boolean;
  provider: AIProviderConfig;
  confidenceThresholds: AIConfidenceThresholds;
  autoDisplayHighConfidence: boolean;
  voiceCommandsEnabled: boolean;
}

export interface NDISettings {
  enabled: boolean;
  outputs: NDIOutput[];
}

export interface BroadcastSettings {
  obs: OBSConfig;
  vmix: VMixConfig;
}

export interface ShortcutMap {
  [action: string]: string; // action -> key combo
}

export interface MediaSettings {
  libraryPaths: string[];
  thumbnailQuality: number;
  autoGenerateThumbnails: boolean;
}

export interface StorageSettings {
  dataDirectory: string;
  backupDirectory: string;
  autoBackup: boolean;
  backupInterval: number; // hours
  maxBackups: number;
}

export interface UpdateSettings {
  autoCheck: boolean;
  autoDownload: boolean;
  channel: 'stable' | 'beta';
}

// ---- IPC Channel Types ----

export enum IPCChannel {
  // Database
  DB_QUERY = 'db:query',
  DB_EXECUTE = 'db:execute',

  // Services
  SERVICE_CREATE = 'service:create',
  SERVICE_LOAD = 'service:load',
  SERVICE_SAVE = 'service:save',
  SERVICE_DELETE = 'service:delete',
  SERVICE_LIST = 'service:list',
  SERVICE_AUTOSAVE = 'service:autosave',
  SERVICE_RECOVER = 'service:recover',

  // Bible
  BIBLE_GET_BOOKS = 'bible:getBooks',
  BIBLE_GET_CHAPTERS = 'bible:getChapters',
  BIBLE_GET_VERSES = 'bible:getVerses',
  BIBLE_GET_PASSAGE = 'bible:getPassage',
  BIBLE_SEARCH = 'bible:search',
  BIBLE_GET_TRANSLATIONS = 'bible:getTranslations',

  // Songs
  SONG_CREATE = 'song:create',
  SONG_LOAD = 'song:load',
  SONG_SAVE = 'song:save',
  SONG_DELETE = 'song:delete',
  SONG_LIST = 'song:list',
  SONG_SEARCH = 'song:search',
  SONG_IMPORT = 'song:import',

  // Media
  MEDIA_IMPORT = 'media:import',
  MEDIA_DELETE = 'media:delete',
  MEDIA_LIST = 'media:list',
  MEDIA_SEARCH = 'media:search',
  MEDIA_GET_THUMBNAIL = 'media:getThumbnail',

  // Presentation
  PRESENTATION_SET_SLIDE = 'presentation:setSlide',
  PRESENTATION_CLEAR = 'presentation:clear',
  PRESENTATION_BLACKOUT = 'presentation:blackout',
  PRESENTATION_NEXT = 'presentation:next',
  PRESENTATION_PREVIOUS = 'presentation:previous',
  PRESENTATION_GO_TO = 'presentation:goTo',
  PRESENTATION_GET_STATE = 'presentation:getState',
  PRESENTATION_TRANSITION = 'presentation:transition',

  // Display
  DISPLAY_GET_ALL = 'display:getAll',
  DISPLAY_ASSIGN = 'display:assign',
  DISPLAY_OPEN_OUTPUT = 'display:openOutput',
  DISPLAY_CLOSE_OUTPUT = 'display:closeOutput',

  // NDI
  NDI_CREATE_OUTPUT = 'ndi:createOutput',
  NDI_DESTROY_OUTPUT = 'ndi:destroyOutput',
  NDI_ENABLE = 'ndi:enable',
  NDI_DISABLE = 'ndi:disable',

  // AI
  AI_START_LISTENING = 'ai:startListening',
  AI_STOP_LISTENING = 'ai:stopListening',
  AI_PROCESS_COMMAND = 'ai:processCommand',
  AI_DETECTION_RESULT = 'ai:detectionResult',
  AI_GET_STATUS = 'ai:getStatus',

  // Audio
  AUDIO_GET_DEVICES = 'audio:getDevices',
  AUDIO_SET_DEVICE = 'audio:setDevice',
  AUDIO_GET_LEVEL = 'audio:getLevel',

  // Settings
  SETTINGS_GET = 'settings:get',
  SETTINGS_SET = 'settings:set',
  SETTINGS_RESET = 'settings:reset',

  // Themes
  THEME_LIST = 'theme:list',
  THEME_LOAD = 'theme:load',
  THEME_SAVE = 'theme:save',
  THEME_DELETE = 'theme:delete',

  // App
  APP_GET_VERSION = 'app:getVersion',
  APP_CHECK_UPDATE = 'app:checkUpdate',
  APP_QUIT = 'app:quit',
  APP_MINIMIZE = 'app:minimize',
  APP_MAXIMIZE = 'app:maximize',
  APP_GET_PATH = 'app:getPath',
}

// ---- Logging ----

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, unknown>;
}

