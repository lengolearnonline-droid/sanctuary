"use strict";
// ============================================================
// Sanctuary — Database Service
// ============================================================
//
// Manages SQLite database lifecycle, migrations, and provides
// typed query methods. Uses better-sqlite3 for synchronous,
// high-performance SQLite access in the Electron main process.
//
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var migrations_1 = require("./migrations");
var Logger_1 = require("../services/Logger");
var logger = new Logger_1.Logger('Database');
/**
 * DatabaseService — singleton managing the SQLite database
 */
var DatabaseService = /** @class */ (function () {
    function DatabaseService(dataDirectory) {
        this.db = null;
        this.isInitialized = false;
        // Ensure data directory exists
        if (!fs_1.default.existsSync(dataDirectory)) {
            fs_1.default.mkdirSync(dataDirectory, { recursive: true });
        }
        this.dbPath = path_1.default.join(dataDirectory, 'sanctuary.db');
    }
    /**
     * Initialize the database: open connection, run migrations
     */
    DatabaseService.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var BetterSqlite3;
            return __generator(this, function (_a) {
                if (this.isInitialized)
                    return [2 /*return*/];
                try {
                    BetterSqlite3 = require('better-sqlite3');
                    this.db = new BetterSqlite3(this.dbPath);
                    // Enable WAL mode for concurrent reads and crash recovery
                    this.db.pragma('journal_mode = WAL');
                    this.db.pragma('foreign_keys = ON');
                    this.db.pragma('busy_timeout = 5000');
                    // Run migrations
                    this.runMigrations();
                    // Insert default settings if first run
                    this.seedDefaults();
                    this.isInitialized = true;
                    logger.info('Database initialized', { path: this.dbPath });
                }
                catch (error) {
                    logger.error('Failed to initialize database', { error: String(error) });
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Run pending migrations
     */
    DatabaseService.prototype.runMigrations = function () {
        var _this = this;
        var _a;
        if (!this.db)
            throw new Error('Database not open');
        // Ensure schema_version table exists
        this.db.exec("\n      CREATE TABLE IF NOT EXISTS schema_version (\n        version INTEGER PRIMARY KEY NOT NULL,\n        name TEXT NOT NULL,\n        applied_at TEXT NOT NULL DEFAULT (datetime('now'))\n      );\n    ");
        // Get current version
        var row = this.db.prepare('SELECT MAX(version) as version FROM schema_version').get();
        var currentVersion = (_a = row === null || row === void 0 ? void 0 : row.version) !== null && _a !== void 0 ? _a : 0;
        // Apply pending migrations
        var pending = migrations_1.MIGRATIONS.filter(function (m) { return m.version > currentVersion; });
        if (pending.length === 0) {
            logger.debug('No pending migrations');
            return;
        }
        var _loop_1 = function (migration) {
            logger.info("Applying migration ".concat(migration.version, ": ").concat(migration.name));
            var transaction = this_1.db.transaction(function () {
                // Run the migration SQL
                _this.db.exec(migration.up);
                // Record the migration
                _this.db.prepare('INSERT INTO schema_version (version, name) VALUES (?, ?)').run(migration.version, migration.name);
            });
            try {
                transaction();
                logger.info("Migration ".concat(migration.version, " applied successfully"));
            }
            catch (error) {
                logger.error("Migration ".concat(migration.version, " failed"), {
                    error: String(error),
                });
                throw error;
            }
        };
        var this_1 = this;
        for (var _i = 0, pending_1 = pending; _i < pending_1.length; _i++) {
            var migration = pending_1[_i];
            _loop_1(migration);
        }
    };
    /**
     * Seed default settings (only if settings table is empty)
     */
    DatabaseService.prototype.seedDefaults = function () {
        if (!this.db)
            return;
        var count = this.db.prepare('SELECT COUNT(*) as count FROM settings').get();
        if (count.count > 0)
            return;
        var insert = this.db.prepare('INSERT OR IGNORE INTO settings (key, value, category) VALUES (?, ?, ?)');
        var transaction = this.db.transaction(function () {
            for (var _i = 0, _a = Object.entries(migrations_1.DEFAULT_SETTINGS); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], _c = _b[1], value = _c.value, category = _c.category;
                insert.run(key, value, category);
            }
        });
        transaction();
        logger.info('Default settings seeded');
    };
    /**
     * Get the raw database instance (for advanced queries)
     */
    DatabaseService.prototype.getDatabase = function () {
        if (!this.db)
            throw new Error('Database not initialized');
        return this.db;
    };
    /**
     * Execute a query that returns rows
     */
    DatabaseService.prototype.query = function (sql, params) {
        var _a;
        if (params === void 0) { params = []; }
        if (!this.db)
            throw new Error('Database not initialized');
        return (_a = this.db.prepare(sql)).all.apply(_a, params);
    };
    /**
     * Execute a query that returns a single row
     */
    DatabaseService.prototype.queryOne = function (sql, params) {
        var _a;
        if (params === void 0) { params = []; }
        if (!this.db)
            throw new Error('Database not initialized');
        return (_a = this.db.prepare(sql)).get.apply(_a, params);
    };
    /**
     * Execute a statement (INSERT, UPDATE, DELETE)
     */
    DatabaseService.prototype.execute = function (sql, params) {
        var _a;
        if (params === void 0) { params = []; }
        if (!this.db)
            throw new Error('Database not initialized');
        return (_a = this.db.prepare(sql)).run.apply(_a, params);
    };
    /**
     * Run multiple statements in a transaction
     */
    DatabaseService.prototype.transaction = function (fn) {
        if (!this.db)
            throw new Error('Database not initialized');
        return this.db.transaction(fn)();
    };
    /**
     * Get a setting value
     */
    DatabaseService.prototype.getSetting = function (key) {
        var _a;
        var row = this.queryOne('SELECT value FROM settings WHERE key = ?', [key]);
        return (_a = row === null || row === void 0 ? void 0 : row.value) !== null && _a !== void 0 ? _a : null;
    };
    /**
     * Set a setting value
     */
    DatabaseService.prototype.setSetting = function (key, value, category) {
        if (category === void 0) { category = 'general'; }
        this.execute("INSERT INTO settings (key, value, category, updated_at)\n       VALUES (?, ?, ?, datetime('now'))\n       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at", [key, value, category]);
    };
    /**
     * Create a backup of the database
     */
    DatabaseService.prototype.backup = function (backupDir) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, backupPath;
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.db)
                    throw new Error('Database not initialized');
                if (!fs_1.default.existsSync(backupDir)) {
                    fs_1.default.mkdirSync(backupDir, { recursive: true });
                }
                timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                backupPath = path_1.default.join(backupDir, "sanctuary-backup-".concat(timestamp, ".db"));
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        try {
                            _this.db.backup(backupPath)
                                .then(function () {
                                logger.info('Database backup created', { path: backupPath });
                                resolve(backupPath);
                            })
                                .catch(reject);
                        }
                        catch (error) {
                            reject(error);
                        }
                    })];
            });
        });
    };
    /**
     * Save recovery data for crash recovery
     */
    DatabaseService.prototype.saveRecoveryData = function (sessionId, serviceData) {
        this.execute("INSERT INTO recovery (session_id, service_data) VALUES (?, ?)", [sessionId, serviceData]);
        // Keep only the last 5 recovery entries
        this.execute("DELETE FROM recovery WHERE id NOT IN (\n        SELECT id FROM recovery ORDER BY created_at DESC LIMIT 5\n      )");
    };
    /**
     * Get the latest recovery data
     */
    DatabaseService.prototype.getLatestRecovery = function () {
        var row = this.queryOne('SELECT session_id, service_data, created_at FROM recovery ORDER BY created_at DESC LIMIT 1');
        if (!row)
            return null;
        return {
            sessionId: row.session_id,
            serviceData: row.service_data,
            createdAt: row.created_at,
        };
    };
    /**
     * Add to recent items
     */
    DatabaseService.prototype.addRecentItem = function (type, reference, data) {
        if (data === void 0) { data = {}; }
        this.execute("INSERT INTO recent_items (type, reference, data, accessed_at)\n       VALUES (?, ?, ?, datetime('now'))", [type, reference, JSON.stringify(data)]);
        // Keep only last 50 recent items
        this.execute("DELETE FROM recent_items WHERE id NOT IN (\n        SELECT id FROM recent_items ORDER BY accessed_at DESC LIMIT 50\n      )");
    };
    /**
     * Get recent items
     */
    DatabaseService.prototype.getRecentItems = function (type, limit) {
        if (limit === void 0) { limit = 20; }
        var sql = type
            ? 'SELECT * FROM recent_items WHERE type = ? ORDER BY accessed_at DESC LIMIT ?'
            : 'SELECT * FROM recent_items ORDER BY accessed_at DESC LIMIT ?';
        var params = type ? [type, limit] : [limit];
        var rows = this.query(sql, params);
        return rows.map(function (row) { return ({
            type: row.type,
            reference: row.reference,
            data: JSON.parse(row.data),
            accessedAt: row.accessed_at,
        }); });
    };
    /**
     * Close the database connection
     */
    DatabaseService.prototype.close = function () {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            logger.info('Database closed');
        }
    };
    return DatabaseService;
}());
exports.DatabaseService = DatabaseService;
