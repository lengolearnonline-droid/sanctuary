import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import net from 'net';

export class VoskEngine extends EventEmitter {
  private pythonProcess: ChildProcess | null = null;
  private isReady = false;
  
  private ringBuffer: Buffer = Buffer.alloc(0);
  private lastSendTime: number = 0;
  private silenceTimeout: NodeJS.Timeout | null = null;
  
  // Track the ID of the current sentence so we can ignore out-of-order responses
  private currentSentenceId: number = 0; 
  private responseCounter: number = 0;

  constructor() {
    super();
  }

  async initialize(): Promise<boolean> {
    this.start();
    return true;
  }

  start() {
    const isPackaged = require('electron').app.isPackaged;
    
    // We are reverting to ai_bridge.py because Vosk crashes on this machine's Python 3.14
    const binaryName = process.platform === 'win32' ? 'ai_bridge.exe' : 'ai_bridge';
    const prodScriptPath = require('path').join(process.resourcesPath, binaryName);
    const devScriptPath = require('path').join(__dirname, '../../../../src/main/ai/ai_bridge.py');
    
    const scriptPath = isPackaged ? prodScriptPath : devScriptPath;
    const command = isPackaged ? prodScriptPath : (process.platform === 'win32' ? 'python' : 'python3');
    
    const args = isPackaged ? [] : [devScriptPath];

    try {
      this.pythonProcess = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.pythonProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'ready') {
              this.isReady = true;
              this.emit('ready');
            } else if (parsed.type === 'result') {
              const resData = JSON.parse(parsed.data);
              if (resData.text) {
                // Drop out-of-order older requests
                if (parsed.req_id && parsed.req_id < this.responseCounter) {
                   return; // Ignore older results that arrived late!
                }
                if (parsed.req_id) {
                   this.responseCounter = parsed.req_id;
                }
                this.emit('result', resData.text);
              }
            } else if (parsed.type === 'error') {
              console.error('[AI Bridge Error]', parsed.message);
            }
          } catch (e) {
            // ignore non-json
          }
        }
      });

      this.pythonProcess.stderr?.on('data', (data) => {
        console.error('[AI Bridge stderr]', data.toString());
      });

      this.pythonProcess.on('close', (code) => {
        console.log(`AI Bridge exited with code ${code}`);
        this.isReady = false;
      });

    } catch (error) {
      console.error('Failed to start AI Bridge', error);
      this.emit('error', error);
    }
  }

  processAudio(buffer: ArrayBuffer) {
    if (!this.isReady) return;

    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
    }

    // EXPANDING WINDOW: Keep appending! DO NOT TRUNCATE!
    this.ringBuffer = Buffer.concat([this.ringBuffer, Buffer.from(buffer)]);
    
    // Safety limit: if someone speaks for 60 seconds straight without pausing, clear it so we don't run out of RAM/bandwidth
    // 60 seconds * 16000 * 2 = 1,920,000 bytes
    if (this.ringBuffer.length > 1920000) {
        this.ringBuffer = Buffer.alloc(0);
        this.currentSentenceId++;
    }

    const now = Date.now();
    // Send the ENTIRE expanding window every 1.5 seconds!
    if (now - this.lastSendTime > 1500 && this.ringBuffer.length > 16000) { // Require at least 0.5s of audio
      this.lastSendTime = now;
      this.sendBufferToPython(this.ringBuffer);
    }

    // SILENCE DETECTION: 800ms of silence means the sentence is over.
    this.silenceTimeout = setTimeout(() => {
      if (this.ringBuffer.length > 16000) {
        this.sendBufferToPython(this.ringBuffer);
      }
      // Start a fresh sentence!
      this.ringBuffer = Buffer.alloc(0);
      this.currentSentenceId++;
    }, 800);
  }

  private currentRequestId: number = 0;

  private sendBufferToPython(buf: Buffer) {
    this.currentRequestId++;
    
    // Prepend a 4-byte integer ID to the buffer
    const idBuffer = Buffer.alloc(4);
    idBuffer.writeUInt32LE(this.currentRequestId, 0);
    const payload = Buffer.concat([idBuffer, buf]);

    const socket = new net.Socket();
    socket.on('error', () => {}); 
    socket.connect(2700, '127.0.0.1', () => {
      socket.write(payload);
      socket.end();
    });
  }

  free() {
    this.stop();
  }

  stop() {
    if (this.silenceTimeout) clearTimeout(this.silenceTimeout);
    if (this.pythonProcess) {
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
    this.isReady = false;
  }
}
