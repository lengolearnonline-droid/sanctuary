// ============================================================
// Sanctuary — OBS Studio WebSocket Service
// ============================================================
//
// Bi-directional OBS WebSocket v5 Client. Manages connection state,
// authentication, scene switching, source toggling (lower thirds), 
// and stream status telemetry for the UI.
//

import OBSWebSocket, { EventSubscription } from 'obs-websocket-js';
import { Logger } from '../services/Logger';
import { DatabaseService } from '../database/DatabaseService';
import { BrowserWindow } from 'electron';

const logger = new Logger('OBSService');

export interface OBSHealth {
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
  version?: string;
  streaming: boolean;
  recording: boolean;
  currentScene: string;
}

export class OBSService {
  private obs = new OBSWebSocket();
  private db: DatabaseService;
  private mainWindow: BrowserWindow | null = null;
  private autoReconnectTimer: NodeJS.Timeout | null = null;

  private health: OBSHealth = {
    status: 'DISCONNECTED',
    streaming: false,
    recording: false,
    currentScene: '',
  };

  private intentionallyClosed = false;

  constructor(db: DatabaseService) {
    this.db = db;
    this.setupListeners();
  }

  public setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window;
  }

  private setupListeners(): void {
    this.obs.on('ConnectionClosed', (error) => {
      logger.warn('OBS connection closed', { error });
      this.updateStatus('DISCONNECTED');
      if (!this.intentionallyClosed) {
        this.scheduleReconnect();
      }
    });

    this.obs.on('ConnectionError', (error) => {
      logger.warn('OBS connection error', { error: error.message });
      this.updateStatus('ERROR');
    });

    this.obs.on('CurrentProgramSceneChanged', (data) => {
      this.health.currentScene = data.sceneName;
      this.broadcastState();
    });

    this.obs.on('StreamStateChanged', (data) => {
      this.health.streaming = data.outputActive;
      this.broadcastState();
    });

    this.obs.on('RecordStateChanged', (data) => {
      this.health.recording = data.outputActive;
      this.broadcastState();
    });
  }

  /**
   * Reads settings from SQLite and connects to OBS.
   */
  public async connect(): Promise<void> {
    this.intentionallyClosed = false;
    if (this.autoReconnectTimer) {
      clearTimeout(this.autoReconnectTimer);
      this.autoReconnectTimer = null;
    }

    const enabled = this.db.getSetting('obs.enabled') === 'true';
    if (!enabled) {
      this.updateStatus('DISCONNECTED');
      return;
    }

    let address = this.db.getSetting('obs.address') || '127.0.0.1:4455';
    // Auto-append default port if none is provided
    if (!address.includes(':')) {
      address = `${address}:4455`;
    }
    const password = this.db.getSetting('obs.password') || '';
    const url = address.startsWith('ws://') || address.startsWith('wss://') ? address : `ws://${address}`;

    this.updateStatus('CONNECTING');
    logger.info('Connecting to OBS', { url });

    try {
      const response = await this.obs.connect(url, password, {
        eventSubscriptions: EventSubscription.All | EventSubscription.InputVolumeMeters,
      });

      this.health.version = response.obsWebSocketVersion;
      this.updateStatus('CONNECTED');
      logger.info('OBS connected successfully');

      // Fetch initial state
      await this.fetchInitialState();

    } catch (e: any) {
      logger.warn('Failed to connect to OBS', { error: e.message || String(e) });
      this.updateStatus('ERROR');
      this.scheduleReconnect();
    }
  }

  public async disconnect(): Promise<void> {
    this.intentionallyClosed = true;
    if (this.autoReconnectTimer) {
      clearTimeout(this.autoReconnectTimer);
      this.autoReconnectTimer = null;
    }

    try {
      await this.obs.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    this.updateStatus('DISCONNECTED');
  }

  private scheduleReconnect(): void {
    if (this.autoReconnectTimer || this.intentionallyClosed) return;
    
    logger.debug('Scheduling OBS reconnect in 30s');
    this.autoReconnectTimer = setTimeout(() => {
      this.autoReconnectTimer = null;
      this.connect();
    }, 30000);
  }

  private async fetchInitialState(): Promise<void> {
    try {
      const sceneData = await this.obs.call('GetCurrentProgramScene');
      this.health.currentScene = sceneData.currentProgramSceneName;

      const streamData = await this.obs.call('GetStreamStatus');
      this.health.streaming = streamData.outputActive;

      const recordData = await this.obs.call('GetRecordStatus');
      this.health.recording = recordData.outputActive;

      this.broadcastState();
    } catch (e) {
      logger.warn('Failed to fetch initial OBS state', { error: String(e) });
    }
  }

  private updateStatus(status: OBSHealth['status']): void {
    this.health.status = status;
    this.broadcastState();
  }

  private broadcastState(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('obs:state', this.getHealth());
    }
  }

  // ---- Public API ----

  public getHealth(): OBSHealth {
    return { ...this.health };
  }

  public async getScenes(): Promise<string[]> {
    if (this.health.status !== 'CONNECTED') return [];
    try {
      const response = await this.obs.call('GetSceneList');
      return response.scenes.map(s => s.sceneName) as string[];
    } catch (e) {
      logger.error('Failed to get scenes', { error: String(e) });
      return [];
    }
  }

  public async setCurrentScene(sceneName: string): Promise<boolean> {
    if (this.health.status !== 'CONNECTED') return false;
    try {
      await this.obs.call('SetCurrentProgramScene', { sceneName });
      return true;
    } catch (e) {
      logger.error('Failed to set scene', { sceneName, error: String(e) });
      return false;
    }
  }

  public async toggleSource(sceneName: string, sourceName: string, enabled: boolean): Promise<boolean> {
    if (this.health.status !== 'CONNECTED') return false;
    try {
      // Find scene item ID first
      const itemsResponse = await this.obs.call('GetSceneItemList', { sceneName });
      const item = itemsResponse.sceneItems.find((i: any) => i.sourceName === sourceName);
      
      if (!item) {
        logger.warn('Source not found in scene', { sceneName, sourceName });
        return false;
      }

      await this.obs.call('SetSceneItemEnabled', {
        sceneName,
        sceneItemId: item.sceneItemId as number,
        sceneItemEnabled: enabled
      });
      return true;
    } catch (e) {
      logger.error('Failed to toggle source', { sceneName, sourceName, enabled, error: String(e) });
      return false;
    }
  }
}
