import sys
import json
import os
from vosk import Model, KaldiRecognizer, SetLogLevel

SetLogLevel(-1)

def log(msg):
    with open('python_internal.log', 'a') as f:
        f.write(msg + '\n')
    print(json.dumps({"type": "info", "message": msg}), flush=True)

def main():
    log("Started python bridge")
    if len(sys.argv) < 2:
        log("Missing model path argument")
        sys.exit(1)

    model_path = sys.argv[1]
    log(f"Model path: {model_path}")
    
    if not os.path.exists(model_path):
        log("Model not found")
        sys.exit(1)

    try:
        log("Loading Model...")
        model = Model(model_path)
        log("Loading KaldiRecognizer...")
        rec = KaldiRecognizer(model, 16000)
        log("Loaded KaldiRecognizer successfully")
    except Exception as e:
        log(f"Exception: {str(e)}")
        sys.exit(1)

    log("Sending ready signal")
    print(json.dumps({"type": "ready"}), flush=True)

    # Read audio chunks from stdin and process them
    # Electron will send raw PCM 16kHz 16-bit mono bytes
    while True:
        # Read 4000 bytes at a time (standard chunk size)
        data = sys.stdin.buffer.read(4000)
        if len(data) == 0:
            break
            
        if rec.AcceptWaveform(data):
            res = rec.Result()
            print(json.dumps({"type": "result", "data": res}), flush=True)
        else:
            res = rec.PartialResult()
            print(json.dumps({"type": "partial", "data": res}), flush=True)

if __name__ == '__main__':
    main()
