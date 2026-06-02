import os
from openai import OpenAI
from dotenv import load_dotenv
import json
from moviepy import VideoFileClip

from llm.app.services.ai_feedback import (
    get_ai_presentation_feedback
)

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

from fastapi import (
    APIRouter,
    WebSocket,
    HTTPException,
    UploadFile,
    File,
    Form
)
from starlette.websockets import WebSocketDisconnect
from pydantic import BaseModel

router = APIRouter()

audio_chunks = []

#class QuestionRequest(BaseModel):
#    selected_personas: list[str]

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
async def generate_questions(
    file: UploadFile = File(...),
    selected_personas: str = Form(...)
):

    try:

        personas = json.loads(selected_personas)

        print("질문 생성 요청 도착")
        print("선택된 페르소나 =", personas)

        temp_file = "temp_realtime.webm"

        content = await file.read()

        print("파일명 =", file.filename)
        print("content_type =", file.content_type)
        print("파일크기 =", len(content))

        with open(temp_file, "wb") as f:
            f.write(content)

        print("저장 후 파일크기 =", os.path.getsize(temp_file))
        
        audio_temp_path = "temp_realtime.mp3"
        
        import subprocess

        audio_temp_path = "temp_realtime.mp3"

        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            temp_file,
            audio_temp_path
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True
        )

        print("FFMPEG RETURN =", result.returncode)
        print(result.stderr)

        if result.returncode != 0:
            raise Exception("ffmpeg 변환 실패")

        with open(audio_temp_path, "rb") as audio_file:

            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
            )

        script_text = transcript.text

        print("실시간 STT 결과:")
        print(script_text)

        ai_result = await get_ai_presentation_feedback(
            script=script_text,
            selected_personas=personas
        )

        questions = ai_result.get(
            "persona_questions",
            []
        )

        return {
            "questions": questions,
            "script": script_text,
        }

    except Exception as e:

        print("실시간 질문 생성 오류:", e)

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        try:

            if os.path.exists("temp_realtime.webm"):
                os.remove("temp_realtime.webm")

            if os.path.exists("temp_realtime.mp3"):
                os.remove("temp_realtime.mp3")

        except Exception as e:

            print("임시파일 삭제 실패:", e)