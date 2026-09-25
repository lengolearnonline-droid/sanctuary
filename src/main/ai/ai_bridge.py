import socket
import json
import speech_recognition as sr
import threading
import sys

def process_audio(req_id, audio_bytes):
    try:
        r = sr.Recognizer()
        audio_data = sr.AudioData(bytes(audio_bytes), 16000, 2)
        text = r.recognize_google(audio_data)
        # We must output the Vosk-style JSON for compatibility with the extractor
        print(json.dumps({"type": "result", "req_id": req_id, "data": json.dumps({"text": text.lower()})}), flush=True)
    except sr.UnknownValueError:
        pass
    except Exception as e:
        pass

def start_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind(('127.0.0.1', 2700))
    server.listen(5)
    print(json.dumps({"type": "ready"}), flush=True)
    
    while True:
        conn, addr = server.accept()
        audio_buffer = bytearray()
        while True:
            try:
                data = conn.recv(4096)
                if not data:
                    break
                audio_buffer.extend(data)
            except Exception:
                break
        conn.close()
        
        if len(audio_buffer) > 3200:
            # First 4 bytes are the Request ID
            req_id = int.from_bytes(audio_buffer[:4], byteorder='little')
            threading.Thread(target=process_audio, args=(req_id, audio_buffer[4:])).start()

if __name__ == '__main__':
    start_server()
