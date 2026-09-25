import asyncio
import websockets
import sys
import json
from vosk import Model, KaldiRecognizer, SetLogLevel
SetLogLevel(-1)

print('Loading model...')
model = Model(r'C:\Users\OBITECH\vosk-model')
print('Model loaded.')

async def recognize(websocket, path):
    rec = KaldiRecognizer(model, 16000)
    print('Client connected')
    try:
        async for message in websocket:
            if rec.AcceptWaveform(message):
                await websocket.send(rec.Result())
            else:
                await websocket.send(rec.PartialResult())
    except websockets.exceptions.ConnectionClosed:
        print('Client disconnected')

start_server = websockets.serve(recognize, 'localhost', 2700)
print('Listening on ws://localhost:2700')
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
