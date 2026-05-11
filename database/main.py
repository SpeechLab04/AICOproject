import sys
import os
import json
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

# 1. 경로 설정 (llm 폴더 인식을 위해 부모 폴더 추가)
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# 2. 로컬 모듈 임포트
import models, database, schemas

# 3. LLM 모듈 엄격하게 임포트
try:
    from llm.app.services.ai_feedback import get_ai_presentation_feedback
    from llm.app.services.scoring import calculate_delivery_score, calculate_final_score
except ImportError as e:
    raise ImportError(f"❌ llm 모듈 임포트 실패: {e}")

# DB 테이블 생성
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

@app.post("/analyze", response_model=schemas.AnalyzeResponse)
async def analyze_and_save(
    request: schemas.AnalyzeRequest, 
    db: Session = Depends(database.get_db)
):
    # 1. AI 분석 수행
    ai_result = await get_ai_presentation_feedback(request.text_input)

    # 2. 분석 데이터 준비 (임시값 포함)
    voice_res = {"wpm": 150, "filler_count": 2}
    visual_res = {"head_pose_score": 80, "eye_contact_score": 90}

    # 3. 점수 계산 (키워드 인자 사용으로 안전하게!)
    d_score = calculate_delivery_score(
        wpm=voice_res["wpm"],
        filler_count=voice_res["filler_count"],
        head_pose=visual_res["head_pose_score"],
        eye_contact=visual_res["eye_contact_score"]
    )
    c_score = ai_result.get("content_score", 0.0)
    f_score = calculate_final_score(c_score, d_score)

    # 4. DB 객체 생성 및 저장
    content_fb = ai_result.get("content_feedback", {})
    new_record = models.PresentationRecord(
        user_nickname=request.user_nickname,
        stt_result=request.text_input,
        summary=ai_result.get("summary", ""),
        expected_questions=json.dumps(ai_result.get("expected_questions", []), ensure_ascii=False),
        strength=content_fb.get("strength", ""),
        weakness=content_fb.get("weakness", ""),
        improvement=content_fb.get("improvement", ""),
        content_score=c_score,
        delivery_score=d_score,
        final_score=f_score,
        voice_analysis=json.dumps(voice_res, ensure_ascii=False),
        visual_analysis=json.dumps(visual_res, ensure_ascii=False)
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return {
        "status": "success",
        "record_id": new_record.id,
        "feedback": new_record.improvement,
        "analysis_summary": {
            **ai_result,
            "delivery_score": d_score,
            "final_score": f_score,
            "voice_analysis": voice_res,
            "visual_analysis": visual_res
        }
    }

@app.get("/records", response_model=list[schemas.RecordResponse])
def list_records(db: Session = Depends(database.get_db)):
    # 최신순 정렬 조회
    return db.query(models.PresentationRecord).order_by(models.PresentationRecord.created_at.desc()).all()