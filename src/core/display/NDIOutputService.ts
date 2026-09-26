// ============================================================
// Sanctuary — NDI Output Service
// ============================================================
//
// Manages NDI broadcast output. Uses `grandiose` (NewTek NDI native bindings)
// to transmit the canonical Program frame. Includes backpressure handling,
// bounded frame queuing, timing, and failure isolation.
//

import { Logger } from '../services/Logger';

const logger = new Logger('NDIOutputService');

export interface NDISettings {
  enabled: boolean;
  sourceName: string;
  resolution: { width: number; height: number };
  frameRate: { numerator: number; denominator: number }; // e.g., 60000 / 1000 = 60 FPS
  alpha: 'opaque' | 'transparent';
}

export interface NDIHealth {
  status: 'DISABLED' | 'INITIALIZING' | 'READY' | 'RUNNING' | 'DEGRADED' | 'ERROR' | 'RESTARTING' | 'STOPPED';
  framesSent: number;
  framesDropped: number;
  actualFPS: number;
  latencyMs: number;
  errorCount: number;
}

export class NDIOutputService {
  private settings: NDISettings;
  private health: NDIHealth;
  private grandiose: any;
  private sender: any;
  
  // Bounded frame queue to prevent unbounded memory growth (backpressure)
  private readonly MAX_QUEUE_SIZE = 2;
  private frameQueue: { buffer: Buffer; width: number; height: number; timestamp: number }[] = [];
    private lastFrame: { buffer: Buffer; width: number; height: number; timestamp: number } | null = null;
  
  private isProcessing = false;
  private frameTimer: NodeJS.Timeout | null = null;
  private lastFrameTime = 0;
  private fpsCounter = 0;
  private fpsTimer: NodeJS.Timeout | null = null;
  private consecutiveErrors = 0;

  constructor(settings: Partial<NDISettings>) {
    this.settings = {
      enabled: settings.enabled ?? false,
      sourceName: settings.sourceName || 'Sanctuary Program',
      resolution: settings.resolution || { width: 1920, height: 1080 },
      frameRate: settings.frameRate || { numerator: 60000, denominator: 1000 },
      alpha: settings.alpha || 'transparent',
    };

    this.health = {
      status: this.settings.enabled ? 'INITIALIZING' : 'DISABLED',
      framesSent: 0,
      framesDropped: 0,
      actualFPS: 0,
      latencyMs: 0,
      errorCount: 0,
    };
  }

  /**
   * Initializes the NDI Sender. Fails gracefully if grandiose is unavailable.
   */
  public async initialize(): Promise<void> {
    if (!this.settings.enabled) return;
    
    this.health.status = 'INITIALIZING';
    logger.info('Initializing NDI Output Service', { sourceName: this.settings.sourceName });

    try {
      // Dynamic import to isolate native dependencies
      this.grandiose = require('grandiose');
    } catch (e) {
      logger.error('Failed to load grandiose NDI bindings. NDI will be disabled.', { error: String(e) });
      this.health.status = 'ERROR';
      this.health.errorCount++;
      return;
    }

    try {
      // Initialize NDI sender
      // Note: grandiose.send({ name, colorFormat, ... })
      this.sender = await this.grandiose.send({
        name: this.settings.sourceName,
        colorFormat: this.settings.alpha === 'transparent' ? this.grandiose.COLOR_FORMAT_BGRA_BGRA : this.grandiose.COLOR_FORMAT_UYVY_BGRA,
        clockVideo: true, // Let NDI SDK handle clocking based on submission
        clockAudio: false
      });

      this.health.status = 'RUNNING';
      logger.info('NDI Sender successfully initialized');
      this.startFPSMonitor();
      
      // Start processing loop
      this.startFrameLoop();
    } catch (e) {
      logger.error('Failed to start NDI sender', { error: String(e) });
      this.health.status = 'ERROR';
      this.health.errorCount++;
      this.attemptRecovery();
    }
  }

  /**
   * Called by the OutputManager to push a new frame from the canonical Program renderer.
   * Uses a bounded queue. Drops stale frames if the queue is full.
   */
  public pushFrame(buffer: Buffer, width: number, height: number): void {
    if (this.health.status !== 'RUNNING' || !this.sender) return;

    // Bounded Queue / Backpressure
    if (this.frameQueue.length >= this.MAX_QUEUE_SIZE) {
      this.frameQueue.shift(); // Drop the oldest stale frame
      this.health.framesDropped++;
      logger.debug('NDI Frame dropped due to backpressure');
    }

    this.frameQueue.push({
      buffer,
      width,
      height,
      timestamp: performance.now()
    });
  }

  private startFrameLoop() {
    const frameIntervalMs = 1000 / (this.settings.frameRate.numerator / this.settings.frameRate.denominator);

    this.frameTimer = setInterval(() => {
      this.processNextFrame();
    }, frameIntervalMs);
  }

  private async processNextFrame() {
    if (this.isProcessing || (!this.frameQueue.length && !this.lastFrame) || !this.sender) return;

    this.isProcessing = true;
    const frame = this.frameQueue.shift() || this.lastFrame;
    if (!frame) { this.isProcessing = false; return; }
    this.lastFrame = frame;


    const processingStart = performance.now();

    try {
      // Pass the buffer directly to grandiose.
      // Assuming BGRA 8-bit, typical for Electron frame extraction.
      await this.sender.video({
        xres: frame.width,
        yres: frame.height,
        frameRateN: this.settings.frameRate.numerator,
        frameRateD: this.settings.frameRate.denominator,
        pictureAspectRatio: frame.width / frame.height,
        data: frame.buffer
      });

      this.fpsCounter++;
      this.health.framesSent++;
      this.health.latencyMs = performance.now() - frame.timestamp;
      this.consecutiveErrors = 0; // Reset error threshold
    } catch (e) {
      logger.error('Error sending NDI frame', { error: String(e) });
      this.health.errorCount++;
      this.consecutiveErrors++;

      if (this.consecutiveErrors > 10) {
        logger.fatal('NDI sender stalled. Marking DEGRADED and attempting recovery.');
        this.health.status = 'DEGRADED';
        this.attemptRecovery();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private startFPSMonitor() {
    this.fpsTimer = setInterval(() => {
      this.health.actualFPS = this.fpsCounter;
      this.fpsCounter = 0;
    }, 1000);
  }

  private attemptRecovery() {
    if (this.health.status === 'ERROR') return; // Don't infinite-loop on fatal startup errors

    logger.info('Attempting NDI output recovery...');
    this.health.status = 'RESTARTING';
    this.shutdown();
    
    // Bounded exponential backoff could be added here
    setTimeout(() => {
      this.initialize();
    }, 5000);
  }

  public shutdown(): void {
    logger.info('Shutting down NDI output');
    this.health.status = 'STOPPED';
    
    if (this.frameTimer) clearInterval(this.frameTimer);
    if (this.fpsTimer) clearInterval(this.fpsTimer);
    this.frameQueue = [];
    
    if (this.sender) {
      try {
        this.sender.destroy();
      } catch (e) {
        logger.error('Error destroying NDI sender', { error: String(e) });
      }
      this.sender = null;
    }
  }

  public getHealth(): NDIHealth {
    return { ...this.health };
  }
}

