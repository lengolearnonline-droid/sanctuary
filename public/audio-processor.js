// ============================================================
// Sanctuary — Audio Processor (AudioWorklet)
// ============================================================
//
// Runs on the audio rendering thread.
// Captures 16kHz PCM data, calculates RMS energy for basic VAD,
// converts Float32 to Int16, and posts back to the main thread.
//

class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096; // 256ms at 16kHz
    this._buffer = new Float32Array(this.bufferSize);
    this._bytesWritten = 0;
    
    // Simple Energy-based VAD configuration
    this.vadThreshold = 0.01; // Tunable RMS threshold
    this.silenceCounter = 0;
    this.maxSilenceFrames = 5; // Allow trailing silence
    this.isSpeaking = false;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0];
    
    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._bytesWritten++] = channelData[i];

      if (this._bytesWritten >= this.bufferSize) {
        this.flush();
        this._bytesWritten = 0;
      }
    }

    return true;
  }

  flush() {
    // 1. Calculate RMS (Root Mean Square) for VAD
    let sumSquares = 0;
    for (let i = 0; i < this.bufferSize; i++) {
      sumSquares += this._buffer[i] * this._buffer[i];
    }
    const rms = Math.sqrt(sumSquares / this.bufferSize);

    // 2. VAD Logic
    const frameHasSpeech = rms > this.vadThreshold;
    
    if (frameHasSpeech) {
      this.isSpeaking = true;
      this.silenceCounter = 0;
    } else {
      this.silenceCounter++;
      if (this.silenceCounter > this.maxSilenceFrames) {
        this.isSpeaking = false;
      }
    }

    // 3. Convert Float32 to Int16 (required by Vosk)
    // Only send buffer if speaking (or trailing silence) to save CPU/IPC bandwidth
    if (this.isSpeaking) {
      const pcm16 = new Int16Array(this.bufferSize);
      for (let i = 0; i < this.bufferSize; i++) {
        // Clamp and scale
        const s = Math.max(-1, Math.min(1, this._buffer[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      // Post back to main thread
      this.port.postMessage({
        event: 'audio',
        buffer: pcm16.buffer,
        rms: rms
      }, [pcm16.buffer]); // Transferable
    } else {
      // Still send volume updates for UI metering, even if silent
      this.port.postMessage({
        event: 'silence',
        rms: rms
      });
    }
  }
}

registerProcessor('capture-processor', CaptureProcessor);
