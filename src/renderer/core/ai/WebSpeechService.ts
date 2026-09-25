type TranscriptCallback = (text: string, isFinal: boolean) => void;

export class WebSpeechService {
  private recognition: any = null;
  private onTranscriptCallback?: TranscriptCallback;
  private isRunning: boolean = false;
  private shouldRestart: boolean = true;
  private hasWarned: boolean = false;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true; // THIS IS THE MAGIC! Word-by-word streaming!
      
      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const fullTranscript = finalTranscript + interimTranscript;
        if (fullTranscript.trim() && this.onTranscriptCallback) {
          this.onTranscriptCallback(fullTranscript.trim(), finalTranscript.length > 0);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('WebSpeechService Error:', event.error);
        if (event.error === 'network' && !this.hasWarned) {
          this.hasWarned = true;
          alert('Native Speech API network error. The default Python engine will be used as a fallback.');
        }
      };

      this.recognition.onend = () => {
        if (this.isRunning && this.shouldRestart) {
          try {
            this.recognition.start();
          } catch(e) {}
        } else {
          this.isRunning = false;
        }
      };
    } else {
      console.warn('SpeechRecognition API not supported in this browser environment');
    }
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  onTranscript(callback: TranscriptCallback) {
    this.onTranscriptCallback = callback;
  }

  start() {
    if (this.recognition && !this.isRunning) {
      this.shouldRestart = true;
      try {
        this.recognition.start();
        this.isRunning = true;
      } catch (e) {
        console.error('Failed to start recognition', e);
      }
    }
  }

  stop() {
    this.shouldRestart = false;
    this.isRunning = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch(e) {}
    }
  }
}

export const webSpeech = new WebSpeechService();
