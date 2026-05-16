from fastapi import FastAPI, UploadFile, File, HTTPException, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv
import traceback

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

if str(BASE_DIR / "vision") not in sys.path:
    sys.path.append(str(BASE_DIR / "vision"))

load_dotenv(dotenv_path=BASE_DIR / ".env")

from speech.speech_processor import process_voice_analysis, get_voice_result
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
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    selected_personas: str = Form("[]")
):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    try:
        selected_personas = json.loads(selected_personas)
    except Exception:
        selected_personas = []

    try:
        # 1. 업로드 파일 저장: vision 분석과 영상 URL 제공용
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # 2. speech_processor.py 함수는 UploadFile을 직접 받기 때문에 포인터 되돌리기
        file.file.seek(0)

        # 3. 음성 분석 실행
        speech_result = process_voice_analysis(file, background_tasks)

        if not speech_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=speech_result.get("error", "음성 분석 실패")
            )

        script_text = speech_result.get("full_script", "")

        # 4. 영상 분석 실행
        vision_result = analyze_vision(file_path)

        # 5. LLM 분석 실행
        ai_result = await get_ai_presentation_feedback(
            script=script_text,
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
                "score": vision_result.get("delivery_score", 0),
                "feedback": vision_result.get("delivery_feedback", ""),
                "head_pose": vision_result.get("head_pose", {}),
                "emotion": vision_result.get("emotion", {}),
                "gaze": vision_result.get("gaze", {}),
            },
            "voice": {
                "score": 0,
                "speed_wpm": 0,
                "filler_count": 0,
                "feedback": speech_result.get(
                    "message",
                    "음성 세부 분석 진행 중입니다."
                ),
                "file_id": speech_result.get("file_id"),
            },
            "script": {
                "score": c_score,
                "summary": ai_result.get("summary", ""),
                "full_script": script_text,
                "questions": ai_result.get("persona_questions", []),
                "content_feedback": ai_result.get("content_feedback", {}),
                "content_score": ai_result.get("content_score", 0),
                "delivery_score": ai_result.get("delivery_score", 0),
                "final_score": ai_result.get("final_score", 0),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print("UPLOAD ERROR:", str(e))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/result/{file_id}")
async def get_analysis_result(file_id: str):
    return get_voice_result(file_id)


@app.post("/api/v1/ai/feedback")
async def create_feedback(script: str):
    try:
        result = await get_ai_presentation_feedback(script=script)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))