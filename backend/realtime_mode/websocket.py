from fastapi import APIRouter, WebSocket
from starlette.websockets import WebSocketDisconnect

router = APIRouter()

@router.websocket("/ws/audio")
async def websocket_audio(ws: WebSocket):

    await ws.accept()

    print("WebSocket connected")

    try:

        while True:

            data = await ws.receive_bytes()

            print(f"받은 데이터 크기: {len(data)} bytes")

    except WebSocketDisconnect:

        print("WebSocket disconnected")