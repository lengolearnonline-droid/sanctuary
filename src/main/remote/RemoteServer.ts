import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import cors from 'cors';
import { networkInterfaces } from 'os';
import { EventEmitter } from 'events';
import { app } from 'electron';

export class RemoteServer extends EventEmitter {
  private app: express.Express;
  private server: http.Server;
  private wss: WebSocketServer;
  public port: number = 8080;

  constructor() {
    super();
    this.app = express();
    this.app.use(cors());
    
    // Serve static files for the web remote
    const remotePath = app.isPackaged 
      ? path.join(process.resourcesPath, 'remote') 
      : path.join(__dirname, '../../../../dist/remote');
      
    this.app.use(express.static(remotePath));

    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[Remote] Client connected');
      
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.emit('message', data, ws);
        } catch (e) {
          console.error('[Remote] Failed to parse message', e);
        }
      });

      ws.send(JSON.stringify({ type: 'welcome', version: app.getVersion() }));
    });
  }

  public start() {
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`[Remote] Server listening on port ` + this.port);
    });
  }

  public stop() {
    this.wss.close();
    this.server.close();
  }

  public broadcast(data: any) {
    const payload = JSON.stringify(data);
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) { // OPEN
        client.send(payload);
      }
    });
  }

  public getLocalIp(): string {
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1)
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return '127.0.0.1';
  }
}
