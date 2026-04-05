from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

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