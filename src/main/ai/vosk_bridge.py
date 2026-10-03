import sys
import json
import os
os.environ['OPENBLAS_CORETYPE'] = 'NEHALEM'
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import shutil
import tempfile
from vosk import Model, KaldiRecognizer, SetLogLevel

SetLogLevel(0)

def log(msg):
    try:
        with open('python_internal.log', 'a') as f:
            f.write(msg + '\n')
    except:
        pass
    print(json.dumps({"type": "info", "message": msg}), flush=True)

def main():
    log("Started python bridge")
    if len(sys.argv) < 2:
        log("Missing model path argument")
        sys.exit(1)

    model_path = os.path.abspath(sys.argv[1])
    log(f"Original Model path: {model_path}")
    
    if not os.path.exists(model_path):
        log("Model not found")
        sys.exit(1)

    if " " in model_path:
        temp_dir = os.path.join(tempfile.gettempdir(), "vosk_sanctuary_model")
        log(f"Space detected in path, copying model to {temp_dir}")
        try:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
            shutil.copytree(model_path, temp_dir)
            model_path = temp_dir
        except BaseException as e:
            log(f"Failed to copy model: {str(e)}")

    try:
        log("Loading Model...")
        model = Model(model_path)
        log("Loading KaldiRecognizer...")
        rec = KaldiRecognizer(model, 16000)
        log("Loaded KaldiRecognizer successfully")
    except BaseException as e:
        log(f"Exception: {str(e)}")
        sys.exit(1)

    log("Sending ready signal")
    print(json.dumps({"type": "ready"}), flush=True)

    try:
        while True:
            data = sys.stdin.buffer.read(4000)
            if len(data) == 0:
                break
            
            if rec.AcceptWaveform(data):
                res = rec.Result()
                print(json.dumps({"type": "result", "data": res}), flush=True)
            else:
                res = rec.PartialResult()
                print(json.dumps({"type": "partial", "data": res}), flush=True)
    except BaseException as e:
        log(f"Loop Exception: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
