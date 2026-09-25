// ============================================================
// Sanctuary — Output Manager
// ============================================================
//
// Central abstraction that owns the canonical Program rendering surface
// and distributes it to downstream outputs (Display, NDI).
//

import { BrowserWindow } from 'electron';
import { Logger } from '../services/Logger';
import { NDIOutputService, NDIHealth } from './NDIOutputService';
import { DatabaseService } from '../database/DatabaseService';

const logger = new Logger('OutputManager');

export class OutputManager {
  private programWindow: BrowserWindow | null = null;
  private ndiService: NDIOutputService | null = null;
  private db: DatabaseService;
  private frameSubscriptionActive = false;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Registers the canonical Program surface (the Electron BrowserWindow).
   * Automatically initializes downstream outputs (like NDI).
   */
  public registerProgramOutput(window: BrowserWindow): void {
    if (this.programWindow === window) return;
    
    this.programWindow = window;
    logger.info('Canonical Program Output registered');

    this.initializeNDI();
  }

  /**
   * Unregisters the Program surface and cleans up frame subscriptions.
   */
  public unregisterProgramOutput(): void {
    logger.info('Canonical Program Output unregistered');
    this.stopFrameSubscription();
    this.programWindow = null;
  }

  private async initializeNDI(): Promise<void> {
    const ndiEnabled = this.db.getSetting('ndi.enabled') === 'true';
    const sourceName = this.db.getSetting('ndi.sourceName') || 'Sanctuary Program';
    const alphaMode = this.db.getSetting('ndi.alpha') === 'opaque' ? 'opaque' : 'transparent';
    
    // Cleanup existing instance
    if (this.ndiService) {
      this.ndiService.shutdown();
      this.ndiService = null;
    }

    if (ndiEnabled) {
      this.ndiService = new NDIOutputService({
        enabled: true,
        sourceName,
        alpha: alphaMode
      });
      await this.ndiService.initialize();
      this.startFrameSubscription();
    }
  }

  /**
   * Starts extracting the RGBA buffer from the canonical Program Renderer
   * and pipes it to the downstream NDI service.
   */
  private startFrameSubscription(): void {
    if (!this.programWindow || !this.programWindow.webContents) return;
    if (this.frameSubscriptionActive) return;

    try {
      if (typeof this.programWindow.webContents.beginFrameSubscription === 'function') {
        logger.info('Starting native frame subscription for NDI output');
        this.programWindow.webContents.beginFrameSubscription(false, (image: any, dirtyRect: any) => {
          if (!this.ndiService || this.ndiService.getHealth().status !== 'RUNNING') return;
          
          const buffer = image.toBitmap(); // Get raw BGRA buffer
          const size = image.getSize();
          
          this.ndiService.pushFrame(buffer, size.width, size.height);
        });
        this.frameSubscriptionActive = true;
      } else {
        // Fallback: If beginFrameSubscription is stripped from this Electron version, 
        // we log the architectural limitation.
        logger.warn('beginFrameSubscription is not available in this Electron build. Cannot extract native frames efficiently.');
        this.ndiService?.shutdown();
      }
    } catch (e) {
      logger.error('Failed to start frame subscription', { error: String(e) });
    }
  }

  private stopFrameSubscription(): void {
    if (this.programWindow && this.frameSubscriptionActive) {
      try {
        if (!this.programWindow.isDestroyed() && this.programWindow.webContents) {
          if (typeof this.programWindow.webContents.endFrameSubscription === 'function') {
            this.programWindow.webContents.endFrameSubscription();
          }
        }
      } catch (e) {
        logger.warn('Failed to stop frame subscription safely', { error: String(e) });
      }
      this.frameSubscriptionActive = false;
      logger.info('Stopped frame subscription');
    }
  }

  public getNDIHealth(): NDIHealth | null {
    return this.ndiService ? this.ndiService.getHealth() : null;
  }

  public shutdown(): void {
    this.stopFrameSubscription();
    if (this.ndiService) {
      this.ndiService.shutdown();
    }
  }
}
