// ============================================================
// Sanctuary — Logger Service
// ============================================================

import fs from 'fs';
import path from 'path';
import type { LogLevel, LogEntry } from '../../shared/types';

const LOG_LEVELS: Record<LogLevel, number> = {
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
export class Logger {
  private static logDir: string = '';
  private static logFile: string = '';
  private static minLevel: LogLevel = 'info';
  private static entries: LogEntry[] = [];
  private static writeStream: fs.WriteStream | null = null;
  private static isInitialized = false;

  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  /**
   * Initialize the logging system
   */
  static initialize(logDirectory: string, level: LogLevel = 'info'): void {
    Logger.logDir = logDirectory;
    Logger.minLevel = level;

    if (!fs.existsSync(logDirectory)) {
      fs.mkdirSync(logDirectory, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    Logger.logFile = path.join(logDirectory, `sanctuary-${timestamp}.log`);

    try {
      Logger.writeStream = fs.createWriteStream(Logger.logFile, { flags: 'a' });
      Logger.isInitialized = true;
    } catch {
      console.error('Failed to create log file:', Logger.logFile);
    }

    // Clean old log files (keep last 10)
    Logger.cleanOldLogs(logDirectory);
  }

  /**
   * Clean old log files, keeping the most recent ones
   */
  private static cleanOldLogs(dir: string): void {
    try {
      const files = fs.readdirSync(dir)
        .filter((f) => f.startsWith('sanctuary-') && f.endsWith('.log'))
        .sort()
        .reverse();

      for (let i = 10; i < files.length; i++) {
        fs.unlinkSync(path.join(dir, files[i]));
      }
    } catch {
      // Non-critical — ignore
    }
  }

  /**
   * Get all log entries (for the log viewer UI)
   */
  static getEntries(level?: LogLevel, limit: number = 500): LogEntry[] {
    let entries = Logger.entries;
    if (level) {
      const minLevelNum = LOG_LEVELS[level];
      entries = entries.filter((e) => LOG_LEVELS[e.level] >= minLevelNum);
    }
    return entries.slice(-limit);
  }

  /**
   * Set minimum log level
   */
  static setLevel(level: LogLevel): void {
    Logger.minLevel = level;
  }

  // ---- Instance methods ----

  trace(message: string, data?: Record<string, unknown>): void {
    this.log('trace', message, data);
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data);
  }

  fatal(message: string, data?: Record<string, unknown>): void {
    this.log('fatal', message, data);
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[Logger.minLevel]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module: this.module,
      message,
      data: data ? Logger.sanitizeData(data) : undefined,
    };

    // Store in memory (for log viewer)
    Logger.entries.push(entry);
    if (Logger.entries.length > 5000) {
      Logger.entries = Logger.entries.slice(-4000);
    }

    // Console output with color
    const color = Logger.getColor(level);
    const prefix = `${color}[${level.toUpperCase().padEnd(5)}]\x1b[0m`;
    const moduleTag = `\x1b[36m[${this.module}]\x1b[0m`;
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    console.log(`${entry.timestamp} ${prefix} ${moduleTag} ${message}${dataStr}`);

    // File output
    if (Logger.writeStream) {
      Logger.writeStream.write(JSON.stringify(entry) + '\n');
    }
  }

  /**
   * Sanitize data to never log sensitive information
   */
  private static sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'secret', 'token', 'apiKey', 'api_key', 'key', 'credential'];
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = Logger.sanitizeData(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private static getColor(level: LogLevel): string {
    switch (level) {
      case 'trace': return '\x1b[90m';
      case 'debug': return '\x1b[37m';
      case 'info': return '\x1b[32m';
      case 'warn': return '\x1b[33m';
      case 'error': return '\x1b[31m';
      case 'fatal': return '\x1b[35m';
    }
  }

  /**
   * Shutdown logging
   */
  static shutdown(): void {
    if (Logger.writeStream) {
      Logger.writeStream.end();
      Logger.writeStream = null;
    }
  }
}
