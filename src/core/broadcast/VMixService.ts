// ============================================================
// Sanctuary — vMix Production Service
// ============================================================
//
// Manages HTTP/TCP communication with vMix. Supports fetching inputs,
// triggering transitions, setting XAML/GTZip dynamic title text,
// and polling for Tally/Status.
//

import { Logger } from '../services/Logger';
import { DatabaseService } from '../database/DatabaseService';
import { BrowserWindow } from 'electron';

const logger = new Logger('VMixService');

export interface VMixHealth {
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
  version?: string;
  recording: boolean;
  streaming: boolean;
  activeInput?: string;
}

export class VMixService {
  private db: DatabaseService;
  private mainWindow: BrowserWindow | null = null;
  private pollTimer: NodeJS.Timeout | null = null;

  private health: VMixHealth = {
    status: 'DISCONNECTED',
    recording: false,
    streaming: false,
  };

  private intentionallyClosed = false;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  public setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  public async connect(): Promise<void> {
    this.intentionallyClosed = false;
    this.stopPolling();

    const enabled = this.db.getSetting('vmix.enabled') === 'true';
    if (!enabled) {
      this.updateStatus('DISCONNECTED');
      return;
    }

    this.updateStatus('CONNECTING');
    logger.info('Connecting to vMix API');

    await this.pollApi(); // Initial fetch
    
    if (!this.intentionallyClosed) {
      this.startPolling();
    }
  }

  public async disconnect(): Promise<void> {
    this.intentionallyClosed = true;
    this.stopPolling();
    this.updateStatus('DISCONNECTED');
    logger.info('Disconnected from vMix');
  }

  private startPolling(): void {
    // Poll vMix API every 2 seconds for status updates
    this.pollTimer = setInterval(() => {
      this.pollApi();
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private getApiUrl(): string {
    let address = this.db.getSetting('vmix.address') || '127.0.0.1:8088';
    if (!address.startsWith('http')) {
      address = `http://${address}`;
    }
    return `${address}/api`;
  }

  private async pollApi(): Promise<void> {
    try {
      const response = await fetch(this.getApiUrl());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const xmlText = await response.text();
      
      // We don't have a full XML parser, so we'll do fast Regex extraction for state
      const versionMatch = xmlText.match(/<version>(.*?)<\/version>/);
      const streamingMatch = xmlText.match(/<streaming>(.*?)<\/streaming>/);
      const recordingMatch = xmlText.match(/<recording>(.*?)<\/recording>/);
      
      const wasConnected = this.health.status === 'CONNECTED';
      
      this.health.status = 'CONNECTED';
      this.health.version = versionMatch ? versionMatch[1] : undefined;
      this.health.streaming = streamingMatch ? streamingMatch[1].toLowerCase() === 'true' : false;
      this.health.recording = recordingMatch ? recordingMatch[1].toLowerCase() === 'true' : false;
      
      this.broadcastState();

      if (!wasConnected) {
        logger.info('vMix connected successfully', { version: this.health.version });
      }
    } catch (e: any) {
      if (this.health.status !== 'ERROR') {
        logger.error('Failed to poll vMix API', { error: e.message });
        this.updateStatus('ERROR');
      }
    }
  }

  /**
   * Executes a vMix Function via the HTTP API.
   */
  public async sendCommand(func: string, params: Record<string, string> = {}): Promise<boolean> {
    if (this.health.status !== 'CONNECTED') return false;
    
    try {
      const url = new URL(this.getApiUrl());
      url.searchParams.append('Function', func);
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
      }

      const response = await fetch(url.toString());
      return response.ok;
    } catch (e) {
      logger.error('Failed to send vMix command', { func, params, error: String(e) });
      return false;
    }
  }

  /**
   * Sets text for a dynamic vMix Title (XAML/GTZip)
   */
  public async setTitleText(input: string, titleName: string, text: string): Promise<boolean> {
    return this.sendCommand('SetText', {
      Input: input,
      SelectedName: titleName,
      Value: text
    });
  }

  /**
   * Triggers a transition to a specific input
   */
  public async transition(input: string, transitionType: string = 'Fade', duration: number = 500): Promise<boolean> {
    return this.sendCommand(transitionType, {
      Input: input,
      Duration: duration.toString()
    });
  }

  private updateStatus(status: VMixHealth['status']): void {
    this.health.status = status;
    this.broadcastState();
  }

  private broadcastState(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('vmix:state', this.getHealth());
    }
  }

  public getHealth(): VMixHealth {
    return { ...this.health };
  }
}
