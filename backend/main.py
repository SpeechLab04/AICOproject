import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException, Form, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv
import traceback
from typing import List

from fastapi.responses import FileResponse
from pydantic import BaseModel

from realtime_mode.tts import generate_question_tts

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_DIR = BASE_DIR / "database"

if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

if str(BASE_DIR / "vision") not in sys.path:
    sys.path.append(str(BASE_DIR / "vision"))

if str(DATABASE_DIR) not in sys.path:
    sys.path.append(str(DATABASE_DIR))

load_dotenv(dotenv_path=BASE_DIR / ".env")

from realtime_mode.websocket import router as realtime_router

import database
import models
import auth
import schemas
from speech.speech_processor import (
    process_voice_analysis,
    get_voice_result,
    transcribe_answer,
)
from llm.app.services.ai_feedback import get_ai_presentation_feedback
from vision_service import analyze_vision


app = FastAPI(title="AICO API")

app.include_router(realtime_router)

#models.Base.metadata.create_all(bind=database.engine)

app.include_router(auth.router)

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

# 🎓 학교 상황에 맞춘 교수님 심사위원 4인 키 정의
ALL_PROFESSOR_PERSONAS = [
    "mentor",  # 멘토형 (친절하고 전문적인 교수님)
    "press",   # 압박형 (까다롭고 날카로운 전문가 교수님)
    "troll",   # 트롤형 (무성의하고 맥락 없는 교수님)
    "basic"    # 기본형 (친절하지만 원론적인 교수님)
]

class TTSRequest(BaseModel):
    text: str
    persona_type: str

@app.get("/")
def read_root():
    return {"message": "서버 연결 성공"}


@app.post("/check-camera")
async def check_camera_frame(file: UploadFile = File(...)):
    """카메라 프레임 1장을 받아 얼굴 위치/거리 판단"""
    import numpy as np
    import mediapipe as mp
    import cv2

    content = await file.read()
    nparr = np.frombuffer(content, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return {"is_valid": False, "distance": "오류", "suggestion": "이미지를 읽을 수 없습니다."}

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    with mp.solutions.face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        min_detection_confidence=0.5,
    ) as face_mesh:
        result = face_mesh.process(rgb)

        if not result.multi_face_landmarks:
            return {"is_valid": False, "distance": "얼굴 미감지", "suggestion": "얼굴이 감지되지 않습니다. 카메라를 정면으로 바라봐주세요."}

        lm = result.multi_face_landmarks[0].landmark
        face_left   = lm[234].x
        face_right  = lm[454].x
        face_ratio  = abs(face_right - face_left)
        nose_x      = lm[1].x    # 코 끝 x좌표
        chin_y      = lm[152].y  # 턱 y좌표 (0=상단, 1=하단)
        forehead_y  = lm[10].y   # 이마 y좌표

        # 고개 방향 계산 (좌우 회전): 코가 얼굴 중심에서 얼마나 벗어났는지
        face_center_x = (face_left + face_right) / 2
        face_width_val = abs(face_right - face_left)
        nose_offset = round((nose_x - face_center_x) / face_width_val, 3) if face_width_val > 0 else 0.0
        if nose_offset > 0.08:
            head_turn = "right"
        elif nose_offset < -0.08:
            head_turn = "left"
        else:
            head_turn = "front"

        # 미소 감지: 입꼬리(61, 291)가 입술 중심(13, 14)보다 올라가면 smile
        avg_corner_y  = (lm[61].y + lm[291].y) / 2
        lip_center_y  = (lm[13].y  + lm[14].y)  / 2
        face_height   = abs(lm[152].y - lm[10].y)
        smile_ratio   = (lip_center_y - avg_corner_y) / face_height if face_height > 0 else 0.0
        smile         = bool(smile_ratio > 0.015)

        # 손 제스처 감지 (pointing / palm)
        with mp.solutions.hands.Hands(
            static_image_mode=True, max_num_hands=1, min_detection_confidence=0.5,
        ) as hands_det:
            h_result = hands_det.process(rgb)
        gesture = None
        if h_result.multi_hand_landmarks:
            h     = h_result.multi_hand_landmarks[0].landmark
            idx   = h[8].y  < h[6].y
            mid   = h[12].y < h[10].y
            ring  = h[16].y < h[14].y
            pinky = h[20].y < h[18].y
            ext   = sum([idx, mid, ring, pinky])
            if idx and not mid and not ring and not pinky:
                gesture = "pointing"
            elif ext >= 4:
                gesture = "palm"

        FACE_TOO_CLOSE = 0.28  # 얼굴이 프레임 너비의 28% 이상이면 너무 가까움
        FACE_TOO_FAR   = 0.07  # 7% 이하면 너무 멀음

        # 얼굴이 중앙에서 너무 벗어난 경우
        if abs(nose_x - 0.5) > 0.18:
            return {"is_valid": False, "distance": "중앙 벗어남", "suggestion": "몸을 가이드라인 안 중앙으로 이동해주세요.", "face_ratio": round(face_ratio, 3), "nose_offset": nose_offset, "head_turn": head_turn, "smile": smile, "gesture": gesture}

        # 턱이 화면 60% 아래 → 얼굴만 클로즈업된 상태 → 상반신 안 보임
        if chin_y > 0.62:
            return {"is_valid": False, "distance": "너무 가까움", "suggestion": "상반신이 보이도록 1~2m 거리를 유지해 주세요.", "face_ratio": round(face_ratio, 3), "nose_offset": nose_offset, "head_turn": head_turn, "smile": smile, "gesture": gesture}

        if face_ratio > FACE_TOO_CLOSE:
            return {"is_valid": False, "distance": "너무 가까움", "suggestion": "상반신이 보이도록 1~2m 거리를 유지해 주세요.", "face_ratio": round(face_ratio, 3), "nose_offset": nose_offset, "head_turn": head_turn, "smile": smile, "gesture": gesture}
        elif face_ratio < FACE_TOO_FAR:
            return {"is_valid": False, "distance": "너무 멀음", "suggestion": "카메라에 조금 더 가까이 다가와 주세요. 1~2m 거리를 유지해 주세요.", "face_ratio": round(face_ratio, 3), "nose_offset": nose_offset, "head_turn": head_turn, "smile": smile, "gesture": gesture}
        # 거리는 적당하지만 얼굴이 화면 너무 아래 → 상반신이 가이드라인 안에 안 들어옴
        elif forehead_y > 0.30:
            return {"is_valid": False, "distance": "위치 조정", "suggestion": "상반신이 가이드라인 안에 들어오도록 위로 올려주세요.", "face_ratio": round(face_ratio, 3), "nose_offset": nose_offset, "head_turn": head_turn, "smile": smile, "gesture": gesture}
        else:
            return {"is_valid": True, "distance": "적당", "suggestion": "좋아요! 발표를 시작할 수 있습니다.", "face_ratio": round(face_ratio, 3), "nose_offset": nose_offset, "head_turn": head_turn, "smile": smile, "gesture": gesture}


@app.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    selected_personas: str = Form("[]"),
    presentation_topic: str = Form("대학 자유 주제 발표"),
    scenario_id: str = Form(""),
    presentation_material: str = Form(""),
    presentation_script_text: str = Form(""),
    db: Session = Depends(database.get_db),
    current_user: models.UserModel = Depends(auth.get_current_user),
):
    import time as _time
    ext = os.path.splitext(file.filename)[1] or ".webm"
    unique_name = f"{int(_time.time())}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    #  프론트에서 넘어온 페르소나 파싱 가드 처리 및 폴백 적용
    try:
        parsed_personas = json.loads(selected_personas)
        if not isinstance(parsed_personas, list) or not parsed_personas:
            parsed_personas = ALL_PROFESSOR_PERSONAS
    except Exception:
        parsed_personas = ALL_PROFESSOR_PERSONAS

    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        file.file.seek(0)

        # webm → mp4 변환 (실시간 녹화 영상 대응) — 음성/영상 병렬 분석 전 미리 수행
        analyze_path = file_path
        if file_path.endswith('.webm'):
            import subprocess
            mp4_path = file_path.replace('.webm', '.mp4')
            cmd = ['ffmpeg', '-y', '-i', file_path, mp4_path]
            conv = subprocess.run(cmd, capture_output=True, text=True)
            if conv.returncode == 0:
                analyze_path = mp4_path

        # 음성 분석 + 영상 분석 병렬 실행
        loop = asyncio.get_event_loop()
        speech_result, vision_result = await asyncio.gather(
            loop.run_in_executor(None, process_voice_analysis, file, background_tasks),
            loop.run_in_executor(None, analyze_vision, analyze_path),
        )

        if not speech_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=speech_result.get("error", "음성 분석 실패")
            )

        script_text = speech_result.get("full_script", "")

        if vision_result.get("is_valid") is False:
            vision_result = {
                "camera_guide": vision_result.get("camera_guide", {}),
                "is_valid": False,
                "head_pose": {},
                "emotion": {},
                "gaze": {},
                "gesture": {},
                "delivery_score": 0,
                "delivery_feedback": vision_result.get(
                    "suggestion",
                    "영상에서 얼굴이 감지되지 않아 영상 분석을 수행하지 못했습니다."
                ),
                "analysis_time": 0,
                "video_dashboard": {
                    "overall": {
                        "score": 0,
                        "feedback": vision_result.get(
                            "suggestion",
                            "영상에서 얼굴이 감지되지 않아 영상 분석을 수행하지 못했습니다."
                        ),
                        "analysis_time": 0,
                    },
                    "metrics": [
                        {
                            "key": "head",
                            "label": "고개 방향",
                            "score": 0,
                            "feedback": "얼굴이 감지되지 않아 고개 방향 분석을 수행하지 못했습니다.",
                        },
                        {
                            "key": "emotion",
                            "label": "표정",
                            "score": 0,
                            "feedback": "얼굴이 감지되지 않아 표정 분석을 수행하지 못했습니다.",
                        },
                        {
                            "key": "gaze",
                            "label": "시선",
                            "score": 0,
                            "feedback": "얼굴이 감지되지 않아 시선 분석을 수행하지 못했습니다.",
                        },
                        {
                            "key": "gesture",
                            "label": "손동작",
                            "score": 0,
                            "feedback": "촬영 가이드가 통과되지 않아 손동작 분석을 수행하지 못했습니다.",
                        },
                    ],
                    "timeline": [],
                    "feedback_items": [],
                },
            }

        # 음성·영상 완료 후 내용 분석 실행
        ai_result = await get_ai_presentation_feedback(
            script=script_text,
            selected_personas=parsed_personas,
            topic=presentation_topic or "대학 자유 주제 발표",
            material=presentation_material,
            presentation_script=presentation_script_text,
        )
        content_feedback = ai_result.get("content_feedback", {})
        content_score = ai_result.get("content_score", 0)
        delivery_score = vision_result.get("delivery_score", 0)
        voice_score = speech_result.get("summary", {}).get("voice_score", 0)
        final_score = round((content_score + delivery_score + voice_score) / 3)

        new_record = models.PresentationRecord(
            user_id=current_user.id,
            user_nickname=current_user.email,
            stt_result=script_text,
            summary=ai_result.get("summary", ""),
            content_critique=ai_result.get("content_critique", "내용 비평 데이터가 존재하지 않습니다."),
            title=presentation_topic.strip() if presentation_topic and presentation_topic.strip() else None,
            scenario_id=scenario_id or None,
            video_url=f"{os.environ.get('BASE_URL', 'http://127.0.0.1:8000')}/uploads/{unique_name}",
            
            persona_questions=ai_result.get("persona_questions", []),
            strength=content_feedback.get("strength", ""),
            weakness=content_feedback.get("weakness", ""),
            improvement=content_feedback.get("improvement", ""),
            content_score=content_score,
            delivery_score=delivery_score,
            final_score=final_score,
            voice_analysis=speech_result,
            visual_analysis=vision_result,
        )

        print("before db.commit()")
        db.add(new_record)
        db.commit()
        
        print("after db.commit()")
        db.refresh(new_record)

        if not new_record.title:
            new_record.title = f"학교발표#{new_record.id}"
            db.commit()
            db.refresh(new_record)

        return {
            "message": "분석 완료",
            "record_id": new_record.id,
            "title": new_record.title,
            "filename": file.filename,
            "video_url": f"{os.environ.get('BASE_URL', 'http://127.0.0.1:8000')}/uploads/{unique_name}",
            "total_score": final_score,
            "summary": ai_result.get(
                "summary",
                "전반적으로 안정적인 발표였으나 일부 보완이 필요합니다."
            ),
            "posture": {
                "score": delivery_score,
                "feedback": vision_result.get("delivery_feedback", ""),
                "head_pose": vision_result.get("head_pose", {}),
                "emotion": vision_result.get("emotion", {}),
                "gaze": vision_result.get("gaze", {}),
                "gesture": vision_result.get("gesture", {}),
                "analysis_time": vision_result.get("analysis_time", 0),
                "video_dashboard": vision_result.get("video_dashboard", {}),
            },
            "voice": {
                "score": voice_score,
                "speed_wpm": speech_result.get("summary", {}).get("wpm", 0),
                "filler_count": speech_result.get("speech_habits", {}).get("filler_count", 0),
                "feedback": speech_result.get(
                    "message",
                    "음성 세부 분석 진행 중입니다."
                ),
                "file_id": speech_result.get("file_id"),
            },
            "script": {
                "score": content_score,
                "summary": ai_result.get("summary", ""),
                "content_critique": ai_result.get("content_critique", "내용 비평 데이터가 존재하지 않습니다."),
                "full_script": script_text,
                "general_questions": ai_result.get("general_questions", []),
                "persona_questions": ai_result.get("persona_questions", []),
                "questions": ai_result.get("persona_questions", []),
                "content_feedback": content_feedback,
                "content_score": content_score,
                "delivery_score": delivery_score,
                "final_score": final_score,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print("UPLOAD ERROR:", str(e), flush=True)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/records", response_model=list[schemas.RecordResponse])
def get_my_records(
    limit: int = 3,
    offset: int = 0,
    db: Session = Depends(database.get_db),
    current_user: models.UserModel = Depends(auth.get_current_user),
):
    records = (
        db.query(models.PresentationRecord)
        .filter(models.PresentationRecord.user_id == current_user.id)
        .order_by(models.PresentationRecord.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )
    return records


@app.get("/records/{record_id}", response_model=schemas.RecordResponse)
def get_record_detail(
    record_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.UserModel = Depends(auth.get_current_user),
):
    record = (
        db.query(models.PresentationRecord)
        .filter(
            models.PresentationRecord.id == record_id,
            models.PresentationRecord.user_id == current_user.id
        )
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")

    return record


@app.patch("/records/{record_id}", response_model=schemas.TitleUpdateResponse)
def update_record_title(
    record_id: int,
    request: schemas.TitleUpdateRequest,
    db: Session = Depends(database.get_db),
    current_user: models.UserModel = Depends(auth.get_current_user),
):
    record = (
        db.query(models.PresentationRecord)
        .filter(
            models.PresentationRecord.id == record_id,
            models.PresentationRecord.user_id == current_user.id,
        )
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="기록을 찾을 수 없습니다.")

    record.title = request.title
    db.commit()
    db.refresh(record)

    return {
        "status": "success",
        "message": "제목이 수정되었습니다.",
        "record_id": record_id,
        "updated_title": record.title,
    }


@app.delete("/records/{record_id}", response_model=schemas.DeleteResponse)
def delete_record(
    record_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.UserModel = Depends(auth.get_current_user),
):
    record = (
        db.query(models.PresentationRecord)
        .filter(
            models.PresentationRecord.id == record_id,
            models.PresentationRecord.user_id == current_user.id
        )
        .first()
    )

    if not record:
        raise HTTPException(status_code=404, detail="삭제할 기록을 찾을 수 없습니다.")

    db.delete(record)
    db.commit()

    return {
        "status": "success",
        "message": "발표 기록이 삭제되었습니다.",
        "deleted_id": record_id,
    }


@app.get("/result/{file_id}")
async def get_analysis_result(file_id: str):
    return get_voice_result(file_id)


# 독립적인 피드백 생성 테스트 API 라우터도 학교용 4인 체제로 깔끔하게 연동
@app.post("/api/v1/ai/feedback")
async def create_feedback(script: str, topic: str = "대학 자유 주제 발표"):
    try:
        result = await get_ai_presentation_feedback(
            script=script, 
            selected_personas=ALL_PROFESSOR_PERSONAS,
            topic=topic  # 인자 추가 동기화
        )
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/stt-answer")
async def stt_answer(
    file: UploadFile = File(...)
):


    result = transcribe_answer(file)

    if not result["success"]:
        raise HTTPException(
            status_code=500,
            detail=result["error"]
        )

    return result

@app.post("/tts-question")
async def tts_question(req: TTSRequest):

    audio_path = generate_question_tts(
        req.text,
        req.persona_type
    )

    return FileResponse(
        audio_path,
        media_type="audio/mpeg",
        filename="question.mp3"
    )