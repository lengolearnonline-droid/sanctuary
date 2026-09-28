import express from 'express';
import WebSocket from 'ws';
import http from 'http';
import os from 'os';
import cors from 'cors';
import path from 'path';
import { EventEmitter } from 'events';

export class RemoteServer extends EventEmitter {
  public app: express.Express;
  public server: http.Server;
  public wss: WebSocket.Server;
  public port: number = 8080;

  private db: any;
  private bibleEngine: any;
  private songManager: any;

  constructor(db: any, bibleEngine: any, songManager: any) {
    super();
    this.db = db;
    this.bibleEngine = bibleEngine;
    this.songManager = songManager;
    this.app = express();
    this.app.use(cors());

    const isPackaged = __dirname.includes('app.asar');
    const remotePath = isPackaged 
      ? path.join(process.resourcesPath, 'remote') 
      : path.join(__dirname, '../../../../src/remote'); // Changed to src/remote because index.html is there!
      
    this.app.use(express.static(remotePath));

    this.app.get('/api/songs', (req, res) => {
      try {
        const songs = this.songManager.listSongs(100);
        res.json(songs);
      } catch(e: any) { res.status(500).json({error: e.message}); }
    });

    this.app.get('/api/songs/:id/lyrics', (req, res) => {
      try {
        const song = this.songManager.getSong(req.params.id);
        res.json(song ? song.sections : []);
      } catch(e: any) { res.status(500).json({error: e.message}); }
    });

    this.app.get('/api/bible/books', (req, res) => {
      try {
        const books = this.bibleEngine.getBooks();
        res.json(books);
      } catch(e: any) { res.status(500).json({error: e.message}); }
    });

    this.app.get('/api/bible/verses', (req, res) => {
      try {
        const { book, chapter } = req.query;
        const verses = this.bibleEngine.getVerses(book as string, parseInt(chapter as string));
        res.json(verses);
      } catch(e: any) { res.status(500).json({error: e.message}); }
    });

    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on('connection', (ws) => {
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.emit('message', data, ws);
        } catch (e) {
          console.error('Invalid remote control message', e);
        }
      });
    });
  }

  start() {
    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(Remote control server running on port );
    });
  }

  getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]!) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }
}
