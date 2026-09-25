"use strict";
// ============================================================
// Sanctuary — Core Type Definitions
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCChannel = void 0;
// ---- IPC Channel Types ----
var IPCChannel;
(function (IPCChannel) {
    // Database
    IPCChannel["DB_QUERY"] = "db:query";
    IPCChannel["DB_EXECUTE"] = "db:execute";
    // Services
    IPCChannel["SERVICE_CREATE"] = "service:create";
    IPCChannel["SERVICE_LOAD"] = "service:load";
    IPCChannel["SERVICE_SAVE"] = "service:save";
    IPCChannel["SERVICE_DELETE"] = "service:delete";
    IPCChannel["SERVICE_LIST"] = "service:list";
    IPCChannel["SERVICE_AUTOSAVE"] = "service:autosave";
    IPCChannel["SERVICE_RECOVER"] = "service:recover";
    // Bible
    IPCChannel["BIBLE_GET_BOOKS"] = "bible:getBooks";
    IPCChannel["BIBLE_GET_CHAPTERS"] = "bible:getChapters";
    IPCChannel["BIBLE_GET_VERSES"] = "bible:getVerses";
    IPCChannel["BIBLE_GET_PASSAGE"] = "bible:getPassage";
    IPCChannel["BIBLE_SEARCH"] = "bible:search";
    IPCChannel["BIBLE_GET_TRANSLATIONS"] = "bible:getTranslations";
    // Songs
    IPCChannel["SONG_CREATE"] = "song:create";
    IPCChannel["SONG_LOAD"] = "song:load";
    IPCChannel["SONG_SAVE"] = "song:save";
    IPCChannel["SONG_DELETE"] = "song:delete";
    IPCChannel["SONG_LIST"] = "song:list";
    IPCChannel["SONG_SEARCH"] = "song:search";
    IPCChannel["SONG_IMPORT"] = "song:import";
    // Media
    IPCChannel["MEDIA_IMPORT"] = "media:import";
    IPCChannel["MEDIA_DELETE"] = "media:delete";
    IPCChannel["MEDIA_LIST"] = "media:list";
    IPCChannel["MEDIA_SEARCH"] = "media:search";
    IPCChannel["MEDIA_GET_THUMBNAIL"] = "media:getThumbnail";
    // Presentation
    IPCChannel["PRESENTATION_SET_SLIDE"] = "presentation:setSlide";
    IPCChannel["PRESENTATION_CLEAR"] = "presentation:clear";
    IPCChannel["PRESENTATION_BLACKOUT"] = "presentation:blackout";
    IPCChannel["PRESENTATION_NEXT"] = "presentation:next";
    IPCChannel["PRESENTATION_PREVIOUS"] = "presentation:previous";
    IPCChannel["PRESENTATION_GO_TO"] = "presentation:goTo";
    IPCChannel["PRESENTATION_GET_STATE"] = "presentation:getState";
    IPCChannel["PRESENTATION_TRANSITION"] = "presentation:transition";
    // Display
    IPCChannel["DISPLAY_GET_ALL"] = "display:getAll";
    IPCChannel["DISPLAY_ASSIGN"] = "display:assign";
    IPCChannel["DISPLAY_OPEN_OUTPUT"] = "display:openOutput";
    IPCChannel["DISPLAY_CLOSE_OUTPUT"] = "display:closeOutput";
    // NDI
    IPCChannel["NDI_CREATE_OUTPUT"] = "ndi:createOutput";
    IPCChannel["NDI_DESTROY_OUTPUT"] = "ndi:destroyOutput";
    IPCChannel["NDI_ENABLE"] = "ndi:enable";
    IPCChannel["NDI_DISABLE"] = "ndi:disable";
    // AI
    IPCChannel["AI_START_LISTENING"] = "ai:startListening";
    IPCChannel["AI_STOP_LISTENING"] = "ai:stopListening";
    IPCChannel["AI_PROCESS_COMMAND"] = "ai:processCommand";
    IPCChannel["AI_DETECTION_RESULT"] = "ai:detectionResult";
    IPCChannel["AI_GET_STATUS"] = "ai:getStatus";
    // Audio
    IPCChannel["AUDIO_GET_DEVICES"] = "audio:getDevices";
    IPCChannel["AUDIO_SET_DEVICE"] = "audio:setDevice";
    IPCChannel["AUDIO_GET_LEVEL"] = "audio:getLevel";
    // Settings
    IPCChannel["SETTINGS_GET"] = "settings:get";
    IPCChannel["SETTINGS_SET"] = "settings:set";
    IPCChannel["SETTINGS_RESET"] = "settings:reset";
    // Themes
    IPCChannel["THEME_LIST"] = "theme:list";
    IPCChannel["THEME_LOAD"] = "theme:load";
    IPCChannel["THEME_SAVE"] = "theme:save";
    IPCChannel["THEME_DELETE"] = "theme:delete";
    // App
    IPCChannel["APP_GET_VERSION"] = "app:getVersion";
    IPCChannel["APP_CHECK_UPDATE"] = "app:checkUpdate";
    IPCChannel["APP_QUIT"] = "app:quit";
    IPCChannel["APP_MINIMIZE"] = "app:minimize";
    IPCChannel["APP_MAXIMIZE"] = "app:maximize";
    IPCChannel["APP_GET_PATH"] = "app:getPath";
})(IPCChannel || (exports.IPCChannel = IPCChannel = {}));
