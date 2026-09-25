"use strict";
// ============================================================
// Sanctuary — Logger Service
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var LOG_LEVELS = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    fatal: 5,
};
/**
 * Structured logger with file output and console formatting.
 * Never exposes secrets in logs.
 */
var Logger = /** @class */ (function () {
    function Logger(module) {
        this.module = module;
    }
    /**
     * Initialize the logging system
     */
    Logger.initialize = function (logDirectory, level) {
        if (level === void 0) { level = 'info'; }
        Logger.logDir = logDirectory;
        Logger.minLevel = level;
        if (!fs_1.default.existsSync(logDirectory)) {
            fs_1.default.mkdirSync(logDirectory, { recursive: true });
        }
        var timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        Logger.logFile = path_1.default.join(logDirectory, "sanctuary-".concat(timestamp, ".log"));
        try {
            Logger.writeStream = fs_1.default.createWriteStream(Logger.logFile, { flags: 'a' });
            Logger.isInitialized = true;
        }
        catch (_a) {
            console.error('Failed to create log file:', Logger.logFile);
        }
        // Clean old log files (keep last 10)
        Logger.cleanOldLogs(logDirectory);
    };
    /**
     * Clean old log files, keeping the most recent ones
     */
    Logger.cleanOldLogs = function (dir) {
        try {
            var files = fs_1.default.readdirSync(dir)
                .filter(function (f) { return f.startsWith('sanctuary-') && f.endsWith('.log'); })
                .sort()
                .reverse();
            for (var i = 10; i < files.length; i++) {
                fs_1.default.unlinkSync(path_1.default.join(dir, files[i]));
            }
        }
        catch (_a) {
            // Non-critical — ignore
        }
    };
    /**
     * Get all log entries (for the log viewer UI)
     */
    Logger.getEntries = function (level, limit) {
        if (limit === void 0) { limit = 500; }
        var entries = Logger.entries;
        if (level) {
            var minLevelNum_1 = LOG_LEVELS[level];
            entries = entries.filter(function (e) { return LOG_LEVELS[e.level] >= minLevelNum_1; });
        }
        return entries.slice(-limit);
    };
    /**
     * Set minimum log level
     */
    Logger.setLevel = function (level) {
        Logger.minLevel = level;
    };
    // ---- Instance methods ----
    Logger.prototype.trace = function (message, data) {
        this.log('trace', message, data);
    };
    Logger.prototype.debug = function (message, data) {
        this.log('debug', message, data);
    };
    Logger.prototype.info = function (message, data) {
        this.log('info', message, data);
    };
    Logger.prototype.warn = function (message, data) {
        this.log('warn', message, data);
    };
    Logger.prototype.error = function (message, data) {
        this.log('error', message, data);
    };
    Logger.prototype.fatal = function (message, data) {
        this.log('fatal', message, data);
    };
    Logger.prototype.log = function (level, message, data) {
        if (LOG_LEVELS[level] < LOG_LEVELS[Logger.minLevel])
            return;
        var entry = {
            timestamp: new Date().toISOString(),
            level: level,
            module: this.module,
            message: message,
            data: data ? Logger.sanitizeData(data) : undefined,
        };
        // Store in memory (for log viewer)
        Logger.entries.push(entry);
        if (Logger.entries.length > 5000) {
            Logger.entries = Logger.entries.slice(-4000);
        }
        // Console output with color
        var color = Logger.getColor(level);
        var prefix = "".concat(color, "[").concat(level.toUpperCase().padEnd(5), "]\u001B[0m");
        var moduleTag = "\u001B[36m[".concat(this.module, "]\u001B[0m");
        var dataStr = data ? " ".concat(JSON.stringify(data)) : '';
        console.log("".concat(entry.timestamp, " ").concat(prefix, " ").concat(moduleTag, " ").concat(message).concat(dataStr));
        // File output
        if (Logger.writeStream) {
            Logger.writeStream.write(JSON.stringify(entry) + '\n');
        }
    };
    /**
     * Sanitize data to never log sensitive information
     */
    Logger.sanitizeData = function (data) {
        var sensitiveKeys = ['password', 'secret', 'token', 'apiKey', 'api_key', 'key', 'credential'];
        var sanitized = {};
        var _loop_1 = function (key, value) {
            if (sensitiveKeys.some(function (sk) { return key.toLowerCase().includes(sk); })) {
                sanitized[key] = '[REDACTED]';
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = Logger.sanitizeData(value);
            }
            else {
                sanitized[key] = value;
            }
        };
        for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            _loop_1(key, value);
        }
        return sanitized;
    };
    Logger.getColor = function (level) {
        switch (level) {
            case 'trace': return '\x1b[90m';
            case 'debug': return '\x1b[37m';
            case 'info': return '\x1b[32m';
            case 'warn': return '\x1b[33m';
            case 'error': return '\x1b[31m';
            case 'fatal': return '\x1b[35m';
        }
    };
    /**
     * Shutdown logging
     */
    Logger.shutdown = function () {
        if (Logger.writeStream) {
            Logger.writeStream.end();
            Logger.writeStream = null;
        }
    };
    Logger.logDir = '';
    Logger.logFile = '';
    Logger.minLevel = 'info';
    Logger.entries = [];
    Logger.writeStream = null;
    Logger.isInitialized = false;
    return Logger;
}());
exports.Logger = Logger;
