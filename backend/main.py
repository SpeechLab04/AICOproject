from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from speech.speech_processor import run_speech_analysis

if str(BASE_DIR / "vision") not in sys.path:
    sys.path.append(str(BASE_DIR / "vision"))

load_dotenv(dotenv_path=BASE_DIR / ".env")

from llm.app.services.ai_feedback import get_ai_presentation_feedback
from vision_service import analyze_vision

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
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
async def upload_video(
    file: UploadFile = File(...),
    selected_personas: str = Form("[]")
):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    try:
        selected_personas = json.loads(selected_personas)
    except Exception:
        selected_personas = []

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    speech_result = run_speech_analysis(file_path)
    vision_result = analyze_vision(file_path)

    ai_result = await get_ai_presentation_feedback(
        script=speech_result["script"],
        selected_personas=selected_personas
    )

    c_score = ai_result.get("content_score", 0.0)

    return {
        "message": "분석 완료",
        "filename": file.filename,
        "video_url": f"https://aico-backend-a7bu.onrender.com/uploads/{file.filename}",
        "total_score": ai_result.get("final_score", 82),
        "summary": ai_result.get(
            "summary",
            "전반적으로 안정적인 발표였으나 일부 보완이 필요합니다."
        ),
        "posture": {
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
            "feedback": speech_result["feedback"],
        },
        "script": {
            "score": c_score,
            "summary": ai_result.get("summary", ""),
            "full_script": speech_result["script"],
            "questions": ai_result.get("persona_questions", []),
            "content_feedback": ai_result.get("content_feedback", {}),
            "content_score": ai_result.get("content_score", 0),
            "delivery_score": ai_result.get("delivery_score", 0),
            "final_score": ai_result.get("final_score", 0),
        }
    }


@app.post("/api/v1/ai/feedback")
async def create_feedback(script: str):
    try:
        result = await get_ai_presentation_feedback(script=script)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))