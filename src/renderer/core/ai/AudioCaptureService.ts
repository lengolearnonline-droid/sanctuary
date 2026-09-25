// ============================================================
// Sanctuary — Audio Capture Service
// ============================================================
//
// Manages the Web Audio API lifecycle, microphone permissions,
// and bridges the AudioWorklet to the main IPC channel for Vosk.
//

type AudioCaptureCallback = (buffer: ArrayBuffer) => void;
type VADCallback = (isSpeaking: boolean, rms: number) => void;

export class AudioCaptureService {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;

  private onAudioData?: AudioCaptureCallback;
  private onVADUpdate?: VADCallback;
  private _isSpeaking = false;

  constructor() {}

  /**
   * Initializes the microphone and audio pipeline.
   * Forces 16kHz sample rate natively via AudioContext.
   */
  async start(deviceId?: string): Promise<void> {
    if (this.context) {
      await this.stop();
    }

    try {
      // 1. Get Microphone Stream
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // 2. Initialize AudioContext at exactly 16kHz
      // This automatically resamples the input stream to 16kHz
      this.context = new window.AudioContext({
        sampleRate: 16000,
        latencyHint: 'interactive'
      });

      // 3. Load the AudioWorklet
      // We load relative to the current html file
      await this.context.audioWorklet.addModule('./audio-processor.js');

      // 4. Build Audio Graph
      this.source = this.context.createMediaStreamSource(this.stream);
      this.workletNode = new AudioWorkletNode(this.context, 'capture-processor');

      // 5. Handle Worklet Messages
      this.workletNode.port.onmessage = (event) => {
        const data = event.data;
        
        if (data.event === 'audio') {
          if (!this._isSpeaking) {
            this._isSpeaking = true;
            this.onVADUpdate?.(true, data.rms);
          }
          this.onAudioData?.(data.buffer);
        } else if (data.event === 'silence') {
          if (this._isSpeaking) {
            this._isSpeaking = false;
            this.onVADUpdate?.(false, data.rms);
          }
          // Optional: Still emit RMS updates for UI even if silent
          this.onVADUpdate?.(false, data.rms);
        }
      };

      // Connect source to worklet. Do NOT connect worklet to destination (prevents feedback)
      this.source.connect(this.workletNode);
      this.workletNode.connect(this.context.destination); // Required in some browsers to keep worklet alive
      
      // Mute the output so we don't actually play the mic back
      const gainNode = this.context.createGain();
      gainNode.gain.value = 0;
      this.workletNode.disconnect();
      this.workletNode.connect(gainNode);
      gainNode.connect(this.context.destination);

      console.log('AudioCaptureService: Pipeline started at 16kHz');

    } catch (err) {
      console.error('AudioCaptureService: Failed to start', err);
      throw err;
    }
  }

  async stop(): Promise<void> {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    
    this._isSpeaking = false;
    this.onVADUpdate?.(false, 0);
    console.log('AudioCaptureService: Pipeline stopped');
  }

  getDevices(): Promise<MediaDeviceInfo[]> {
    return navigator.mediaDevices.enumerateDevices()
      .then(devices => devices.filter(d => d.kind === 'audioinput'));
  }

  onData(callback: AudioCaptureCallback): void {
    this.onAudioData = callback;
  }

  onVAD(callback: VADCallback): void {
    this.onVADUpdate = callback;
  }
}

// Export a singleton instance
export const audioCapture = new AudioCaptureService();
