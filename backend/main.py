from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
#from speech_processor import *

# 프로젝트 루트 경로를 잡아서 llm 폴더를 인식하게 함
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from speech.speech_processor import run_speech_analysis


# ✅ 추가: vision 폴더 경로 추가 (Python이 vision 파일을 찾을 수 있게)
if str(BASE_DIR / "vision") not in sys.path:
    sys.path.append(str(BASE_DIR / "vision"))

# .env 로드
load_dotenv(dotenv_path=BASE_DIR / ".env")

# 반드시 위 경로 설정/환경변수 로드 아래에 있어야 함
from llm.app.services.ai_feedback import get_ai_presentation_feedback
from vision_service import analyze_vision  # ✅ 추가: vision 분석 함수 import

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    #allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_origins=["*"],
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

    speech_result = run_speech_analysis(file_path) # 음성 분석 추가
    vision_result = analyze_vision(file_path)  # ✅ 추가: 저장된 영상 실제 분석

    return {
        "message": "분석 완료",
        "filename": file.filename,
        "video_url": f"https://aico-backend-a7bu.onrender.com/uploads/{file.filename}",        "total_score": 82,
        "summary": "전반적으로 안정적인 발표였으나 자세와 음성 표현에서 일부 보완이 필요합니다.",
        "posture": {  # ✅ 수정: 더미 데이터 → 실제 분석 결과로 교체
            "score": vision_result["delivery_score"],
            "feedback": vision_result["delivery_feedback"],
            "head_pose": vision_result["head_pose"],
            "emotion": vision_result["emotion"],
            "gaze": vision_result["gaze"],
        },
        "voice": {
            "score": speech_result["score"],
            "speed_wpm": speech_result["speed_wpm"],
            "filler_count": speech_result["filler_count"],
            "feedback": speech_result["feedback"]
        },
        "script": {
            "score": 83,
            "summary": "발표 내용은 비교적 명확하게 전달되었습니다.",
            "full_script": speech_result["script"],
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