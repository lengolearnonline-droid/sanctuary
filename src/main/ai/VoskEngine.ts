import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';

export class VoskEngine extends EventEmitter {
  private pythonProcess: ChildProcess | null = null;
  private isReady = false;

  constructor() {
    super();
  }

  async initialize(): Promise<boolean> {
    this.start();
    return true;
  }

  start() {
    const isPackaged = require('electron').app.isPackaged;
    
    // Switch back to instant offline vosk_bridge
    const binaryName = process.platform === 'win32' ? 'vosk_bridge.exe' : 'vosk_bridge';
    const prodScriptPath = path.join(process.resourcesPath, binaryName);
    const devScriptPath = path.join(__dirname, '../../../../src/main/ai/vosk_bridge.py');
    
    const command = isPackaged ? prodScriptPath : (process.platform === 'win32' ? 'python' : 'python3');
    
    // Define the model path
    const modelPath = isPackaged 
      ? path.join(process.resourcesPath, 'model') 
      : path.join(__dirname, '../../../../src/main/ai/model');

    const args = isPackaged ? [modelPath] : [devScriptPath, modelPath];

    try {
      this.pythonProcess = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
      this.pythonProcess.stdin?.on('error', (err) => {
        console.error('[Vosk Bridge stdin error]', err);
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
                this.emit('result', resData.text);
              }
            } else if (parsed.type === 'partial') {
              const resData = JSON.parse(parsed.data);
              if (resData.partial) {
                this.emit('partial', resData.partial);
              }
            } else if (parsed.type === 'info') {
              console.log('[Vosk Info]', parsed.message);
            }
          } catch (e) {
            // ignore non-json
          }
        }
      });

      this.pythonProcess.stderr?.on('data', (data) => {
        console.error('[Vosk Bridge stderr]', data.toString());
      });

      this.pythonProcess.on('close', (code) => {
        console.log(Vosk Bridge exited with code );
        this.isReady = false;
      });

    } catch (error) {
      console.error('Failed to start Vosk Bridge', error);
      this.emit('error', error);
    }
  }

  processAudio(buffer: ArrayBuffer) {
    if (!this.isReady || !this.pythonProcess || !this.pythonProcess.stdin) return;

    // Stream directly into stdin for instant partials!
    this.pythonProcess.stdin.write(Buffer.from(buffer));
  }

  free() {
    this.stop();
  }

  stop() {
    if (this.pythonProcess) {
      if (this.pythonProcess.stdin) {
        this.pythonProcess.stdin.end();
      }
      this.pythonProcess.kill();
      this.pythonProcess = null;
    }
    this.isReady = false;
  }
}

