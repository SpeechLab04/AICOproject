import os
import sys
from typing import List, Dict, Any
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

# =========================================================================
# [1단계: 다른 폴더에 있는 비밀 도구(코드)들 내 방으로 불러오기]
# =========================================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

import database  # 데이터베이스 연결 상담원
import models    # 데이터베이스 서랍장 양식
import schemas   # 프론트엔드와 주고받을 신청서/확인증 규격

# 🔒 [보안 업그레이드!] database 폴더 안에 새로 만든 철통 자물쇠(auth.py)를 불러와요!
import auth  

try:
    # AI 발표 분석 모듈들을 불러와요.
    from llm.app.services.ai_feedback import get_ai_presentation_feedback
    from llm.app.services.scoring import calculate_final_score
except ImportError as e:
    raise ImportError(f"llm 폴더 안의 AI 분석 모듈을 불러오지 못했습니다: {e}")

# 서버가 켜질 때, 양식(models)대로 데이터베이스에 새 테이블들을 자동으로 만들거나 업데이트해요.
models.Base.metadata.create_all(bind=database.engine)

# 메인 매니저인 FastAPI 소환!
app = FastAPI(title="AICO AI Presentation Coaching Service (Secure Version)")

# =========================================================================
# 🔗 [보안 핵심 연결] auth.py에 만든 '회원가입/로그인 창구'를 메인 서비스에 합체!
# =========================================================================
app.include_router(auth.router)


# =========================================================================
# [2단계: 1번 통로 - 발표 분석하고 로그인한 '내 계정 서랍'에 저장하기]
# =========================================================================
@app.post("/analyze", response_model=schemas.AnalyzeResponse)
async def analyze_and_save(
    request: schemas.AnalyzeRequest,          
    db: Session = Depends(database.get_db),
    current_user: models.UserModel = Depends(auth.get_current_user) 
):
    """
    종합 체크 후 완성된 대시보드 데이터를 전달받아, 
    영상 주소와 연습 횟수를 있는 그대로 안전하게 기록 보관합니다.
    """
    try:
        # 🎯 [수정 1] AI 서비스 호출 시 기본값이나 들어온 텍스트가 있다면 주제(topic)로 패스
        ai_result = await get_ai_presentation_feedback(
            script=request.text_input,
            selected_personas=request.selected_personas,
            topic="대학 자유 주제 발표"  # 텍스트 모드 기반 기본 폴백 세팅
        )
        voice_res = {"wpm": 150, "filler_count": 2}                  
        visual_res = {"head_pose_score": 80, "eye_contact_score": 90}  
        d_score = 85.0                                                
        c_score = float(ai_result.get("content_score", 0.0))
        f_score = calculate_final_score(c_score, d_score)
        content_fb = ai_result.get("content_feedback", {})

        # [대시보드 기록 이관] 
        new_record = models.PresentationRecord(
            user_id=current_user.id,              
            user_nickname=request.user_nickname,  
            video_url=request.video_url,          
            practice_count=request.practice_count, 
            
            title=request.presentation_topic.strip() if request.presentation_topic else "대학 자유 주제 발표",
            
            stt_result=request.text_input,        
            summary=ai_result.get("summary", ""), 
            
            # 새롭게 개설한 비평 서랍장 칸 매핑 누락 방지 (DB 폭발 예방 완료)
            content_critique=ai_result.get("content_critique", "내용 비평 데이터가 존재하지 않습니다."),
            
            persona_questions=ai_result.get("persona_questions", []), 
            strength=content_fb.get("strength", ""),      
            weakness=content_fb.get("weakness", ""),      
            improvement=content_fb.get("improvement", ""), 
            content_score=c_score,       
            delivery_score=d_score,      
            final_score=f_score,         
            voice_analysis=voice_res,     
            visual_analysis=visual_res 
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
                "visual_analysis": visual_res,
                "video_url": new_record.video_url,          
                "practice_count": new_record.practice_count  
            }
        }
    except Exception as e:
        db.rollback()  
        raise HTTPException(status_code=500, detail=f"서버에서 분석 중 에러가 발생했습니다: {str(e)}")


# =========================================================================
# [3단계: 2번 통로 - 주소창 조작 차단! '내가 연습한 기록만' 최신순으로 가져오기]
# =========================================================================
@app.get("/records", response_model=List[schemas.RecordResponse])
def list_records(
    limit: int = 3,                                                             
    offset: int = 0,                                                            
    db: Session = Depends(database.get_db),
    current_user: models.UserModel = Depends(auth.get_current_user)
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


# =========================================================================
# [4단계: 3번 통로 - 마이페이지 꺾은선 실력 그래프용 날짜+점수 가져오기]
# =========================================================================
@app.get("/records/performance-trend", response_model=List[Dict[str, Any]])
def get_performance_trend(
    db: Session = Depends(database.get_db),
    current_user: models.UserModel = Depends(auth.get_current_user) 
):
    records = (
        db.query(models.PresentationRecord.created_at, models.PresentationRecord.final_score)
        .filter(models.PresentationRecord.user_id == current_user.id) 
        .order_by(models.PresentationRecord.created_at.asc()) 
        .all()
    )
    
    return [
        {
            "date": record.created_at.strftime("%m.%d"), 
            "score": record.final_score                                 
        } 
        for record in records
    ]


# =========================================================================
# [5단계: 4번 통로 - 리스트에서 기록 하나를 누르면 내 것일 때만 대시보드 복원]
# =========================================================================
@app.get("/records/{record_id}", response_model=schemas.RecordResponse)
def get_single_record(
    record_id: int,                                                             
    db: Session = Depends(database.get_db),
    current_user: models.UserModel = Depends(auth.get_current_user) 
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
        raise HTTPException(
            status_code=404, 
            detail="해당 발표 기록을 찾을 수 없거나 접근 권한이 없습니다!"
        )
        
    return record


# =========================================================================
# [6단계: 5번 통로 - 안전하게 오직 '내 기록만' 골라서 삭제하기]
# =========================================================================
@app.delete("/records/{record_id}", response_model=schemas.DeleteResponse)
def delete_record(
    record_id: int,                                                             
    db: Session = Depends(database.get_db),
    current_user: models.UserModel = Depends(auth.get_current_user) 
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
        raise HTTPException(
            status_code=404, 
            detail="해당 발표 기록을 찾을 수 없거나 삭제할 권한이 없습니다!"
        )
    
    try:
        db.delete(record) 
        db.commit()       
        
        return {
            "status": "success",
            "message": "발표 기록이 안전하게 삭제되었습니다.",
            "deleted_id": record_id
        }
    except Exception as e:
        db.rollback() 
        raise HTTPException(status_code=500, detail=f"기록 삭제 중 서버 오류 발생: {str(e)}")
    

# =========================================================================
# [7단계: 6번 통로 - 마이페이지에서 내 발표 기록 제목 내 마음대로 수정하기]
# =========================================================================
@app.patch("/records/{record_id}/title", response_model=schemas.TitleUpdateResponse)
def update_record_title(
    record_id: int,
    request: schemas.TitleUpdateRequest,
    db: Session = Depends(database.get_db),
    current_user: models.UserModel = Depends(auth.get_current_user) 
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
        raise HTTPException(
            status_code=404, 
            detail="해당 발표 기록을 찾을 수 없거나 수정할 권한이 없습니다!"
        )
    
    try:
        record.title = request.title
        db.commit()
        db.refresh(record)
        
        return {
            "status": "success",
            "message": "발표 기록 제목이 성공적으로 수정되었습니다.",
            "record_id": record.id,
            "updated_title": record.title
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"제목 수정 중 서버 오류 발생: {str(e)}")