from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from .speech_processor import *

# 프로젝트 루트 경로를 잡아서 llm 폴더를 인식하게 함
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# .env 로드
load_dotenv(dotenv_path=BASE_DIR / ".env")

# 반드시 위 경로 설정/환경변수 로드 아래에 있어야 함
from llm.app.services.ai_feedback import get_ai_presentation_feedback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/")
def read_root():
    return {"message": "서버 연결 성공"}


@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    return {
        "message": "분석 완료",
        "filename": file.filename,
        "video_url": f"http://127.0.0.1:8000/uploads/{file.filename}",
        "total_score": 82,
        "summary": "전반적으로 안정적인 발표였으나 자세와 음성 표현에서 일부 보완이 필요합니다.",
        "posture": {
            "score": 78,
            "feedback": "자세는 비교적 안정적이지만 고개 움직임이 다소 있었습니다."
        },
        "voice": {
            "score": 85,
            "speed_wpm": 128,
            "filler_count": 3,
            "feedback": "말속도는 적절하지만 필러어 사용을 조금 줄이면 더 좋습니다."
        },
        "script": {
            "score": 83,
            "summary": "발표 내용은 비교적 명확하게 전달되었습니다.",
            "questions": [
                "이 발표의 핵심 기능은 무엇인가요?",
                "기존 서비스와의 차별점은 무엇인가요?",
                "주요 사용자층은 누구인가요?"
            ]
        }
    }


@app.post("/api/v1/ai/feedback")
async def create_feedback(script: str):
    """
    프론트엔드에서 받은 스크립트를 AI로 분석하여 결과를 반환합니다.
    """
    try:
        result = await get_ai_presentation_feedback(script)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))