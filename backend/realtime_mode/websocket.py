from fastapi import APIRouter, WebSocket, HTTPException
from starlette.websockets import WebSocketDisconnect
from pydantic import BaseModel

router = APIRouter()

audio_chunks = []

class QuestionRequest(BaseModel):
    selected_personas: list[str]

@router.websocket("/ws/audio")
async def websocket_audio(ws: WebSocket):

    await ws.accept()

    print("WebSocket connected")

    try:

        while True:

            data = await ws.receive_bytes()

            audio_chunks.append(data)
            print(f"받은 데이터 크기: {len(data)} bytes")

    except WebSocketDisconnect:

        print("WebSocket disconnected")
        print("총 청크 수 =", len(audio_chunks))
        
@router.post("/realtime/generate-questions")
async def generate_questions(data: QuestionRequest):

    print("질문 생성 요청 도착")
    print("선택된 페르소나 =", data.selected_personas)
    print("저장된 청크 수 =", len(audio_chunks))

    return {
        "questions": [
            {
                "audience": "테스트",
                "question": "질문 생성 API 연결 성공"
            }
        ]
    }