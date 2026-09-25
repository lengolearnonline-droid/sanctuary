import socket
import json
from vosk import Model, KaldiRecognizer, SetLogLevel

SetLogLevel(-1)
print('Loading model...')
model = Model(r'C:\Users\OBITECH\vosk-model')
print('Model loaded.')

def start_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.bind(('localhost', 2700))
    server.listen(1)
    print('Listening on 2700')
    
    while True:
        conn, addr = server.accept()
        print('Connected', addr)
        rec = KaldiRecognizer(model, 16000)
        while True:
            data = conn.recv(4096)
            if not data:
                break
            if rec.AcceptWaveform(data):
                conn.sendall(rec.Result().encode('utf-8') + b'\n')
            else:
                conn.sendall(rec.PartialResult().encode('utf-8') + b'\n')
        conn.close()

if __name__ == '__main__':
    start_server()
