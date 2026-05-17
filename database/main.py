import os
import sys
from typing import List
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

# =========================================================================
# [1단계: 📁 다른 폴더에 있는 비밀 도구(코드)들 내 방으로 불러오기]
# =========================================================================
# 프로그램이 실행될 때 컴퓨터가 다른 폴더에 있는 파일들을 잘 찾을 수 있도록 길을 열어주는 과정이에요.
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

import database  # 🤵 데이터베이스(기록장)를 열고 닫아주는 친절한 상담원 창구예요.
import models    # 📊 진짜 데이터베이스(종이 기록장)에 어떤 칸(이름, 점수 등)이 있는지 적힌 양식이에요.
import schemas   # 📄 손님들이 요청할 때 들고 오는 '신청서'와 결과를 받아 갈 '확인증'의 규격이에요.

try:
    # AI 친구들에게 분석을 부탁하는 똑똑한 마법 모듈들을 불러와요.
    from llm.app.services.ai_feedback import get_ai_presentation_feedback
    from llm.app.services.scoring import calculate_final_score
except ImportError as e:
    # 혹시나 파일 위치가 잘못되어서 못 불러오면 에러를 뿜으며 알려줘요.
    raise ImportError(f"❌ llm 폴더 안의 AI 분석 모듈을 불러오지 못했습니다: {e}")

# 🔥 [컴퓨터야 준비해!] 서버가 켜질 때, 혹시 기록장 파일이 없으면 양식(models)대로 새 테이블을 자동으로 만들어줘요.
models.Base.metadata.create_all(bind=database.engine)

# 우리의 메인 매니저인 FastAPI를 소환합니다! 서비스의 이름도 멋지게 지어줬어요.
app = FastAPI(title="AICO AI Presentation Coaching Service (Secure Version)")


# =========================================================================
# [2단계: 🎯 1번 통로 - 발표 분석하고 자동으로 진짜 기록장에 보관하기]
# =========================================================================
@app.post("/analyze", response_model=schemas.AnalyzeResponse)
async def analyze_and_save(
    request: schemas.AnalyzeRequest,          # 📥 사용자가 보낸 대본과 선택한 면접관 정보가 담긴 '신청서'예요.
    db: Session = Depends(database.get_db)    # 🔑 상담원(DB 세션)에게서 기록장을 건네받아 대기해요.
):
    """
    사용자가 발표 대본을 넣고 '분석해 줘!' 요청하면, AI가 분석한 뒤 결과를 기록장에 쏙 저장하는 통로예요.
    """
    try:
        # 🤖 [AI 마법 작동!] 대본과 선택한 면접관(페르소나) 정보를 AI에게 보내서 분석 결과를 받아옵니다.
        ai_result = await get_ai_presentation_feedback(
            script=request.text_input,
            selected_personas=request.selected_personas
        )

        # 🎤 [목소리와 시선 분석] 지금은 가짜 데이터(더미)를 넣어두었지만, 나중엔 진짜 분석 결과가 들어갈 자리예요!
        voice_res = {"wpm": 150, "filler_count": 2}       # 말하기 속도(WPM)와 "음, 아" 같은 불필요한 말 횟수
        visual_res = {"head_pose_score": 80, "eye_contact_score": 90}  # 고개 움직임과 시선 처리 점수
        d_score = 85.0                                    # 전달력 점수 기본값

        # 🧮 [점수 계산하기] AI가 준 내용 점수를 가져와서, 전달력 점수와 합쳐 최종 종합 점수를 구해요.
        c_score = float(ai_result.get("content_score", 0.0))
        f_score = calculate_final_score(c_score, d_score)

        content_fb = ai_result.get("content_feedback", {})

        # 📝 [새 기록지 작성] 데이터베이스 기록장 양식에 맞춰서 이름표와 분석 결과를 꼼꼼히 적어요.
        new_record = models.PresentationRecord(
            user_nickname=request.user_nickname,  # 🏷️ 주인 이름표를 딱 붙여서 누가 연습했는지 기록해요!
            stt_result=request.text_input,        # 사용자가 입력한 대본 텍스트
            summary=ai_result.get("summary", ""), # AI가 요약해 준 발표 내용
            persona_questions=ai_result.get("persona_questions", []), # 예상 면접관들의 예리한 질문들
            strength=content_fb.get("strength", ""),      # 잘한 점
            weakness=content_fb.get("weakness", ""),      # 아쉬운 점
            improvement=content_fb.get("improvement", ""), # 앞으로 고칠 점
            content_score=c_score,       # 내용 점수
            delivery_score=d_score,      # 전달 점수
            final_score=f_score,         # 종합 점수
            voice_analysis=voice_res,     # 목소리 분석 데이터
            visual_analysis=visual_res    # 시선 분석 데이터
        )

        # 🗄️ [진짜 데이터베이스 책장에 넣기]
        db.add(new_record)     # 상담원에게 "이 기록지 보관함에 넣어줘" 하고 건네줘요.
        db.commit()            # 책장 문을 쾅! 닫아서 안전하게 영구 저장(저장 완료 도장)을 해요.
        db.refresh(new_record) # 방금 저장하면서 자동으로 매겨진 '기록 번호(ID)'를 확인하기 위해 기록지를 새로고침해요.

        # 📤 사용자의 화면(프론트엔드)에 "성공했어!" 도장과 함께 분석 요약본을 예쁘게 포장해서 돌려줍니다.
        return {
            "status": "success",
            "record_id": new_record.id,
            "feedback": new_record.improvement,
            "analysis_summary": {
                **ai_result,  # AI가 준 원래 결과들을 흩뿌려 펼쳐놓고
                "delivery_score": d_score,
                "final_score": f_score,
                "voice_analysis": voice_res,
                "visual_analysis": visual_res
            }
        }
    except Exception as e:
        db.rollback()  # 🚨 [비상사태!] 만약 저장하다가 에러가 나면, 기록장이 엉망이 되지 않게 하던 작업을 전부 취소(되돌리기)해요!
        raise HTTPException(status_code=500, detail=f"서버에서 분석 중 에러가 발생했어: {str(e)}")


# =========================================================================
# [3단계: 📂 2번 통로 - '내 발표 기록만' 골라서 최신순으로 가져오기]
# =========================================================================
@app.get("/records", response_model=List[schemas.RecordResponse])
def list_records(
    user_nickname: str,                       # 👤 "누구 기록을 찾으시나요?" 물어볼 이름표예요.
    db: Session = Depends(database.get_db)    # 🔑 기록장을 열어줄 상담원을 불러와요.
):
    """
    사용자가 "내가 여태까지 연습한 기록 다 보여줘!"라고 할 때 사용하는 통로예요.
    """
    # 🔍 데이터베이스 책장을 샅샅이 뒤져서 조건에 맞는 기록만 뽑아내요.
    records = (
        db.query(models.PresentationRecord)
        .filter(models.PresentationRecord.user_nickname == user_nickname)  # 🔍 1. 내 이름표가 붙은 기록만 골라내고!
        .order_by(models.PresentationRecord.created_at.desc())             # 📅 2. 최근에 연습한 순서대로 정렬해서!
        .all()                                                             # 📚 3. 몽땅 다 가져와요.
    )

    # ✨ [자동 포장 시스템]
    # schemas.RecordResponse에 `from_attributes=True` 설정이 있어서,
    # 복잡하게 수작업으로 포장할 필요 없이 가져온 기록들을 그대로 리턴하면 FastAPI가 알아서 예쁘게 포장해서 보내줘요!
    return records


# =========================================================================
# [4단계: 🗑️ 3번 통로 - 안전하게 내 기록만 골라서 지우기 (보안 업그레이드!)]
# =========================================================================
@app.delete("/records/{record_id}", response_model=schemas.DeleteResponse)
def delete_record(
    record_id: int,                           # 🔑 주소창에 실려 온 "지우고 싶은 기록 번호"예요.
    user_nickname: str,                       # 👤 "지금 지워달라고 요청한 사람이 누구지?" 확인용 이름표예요.
    db: Session = Depends(database.get_db)    # 🔑 기록장을 열어줄 상담원을 불러와요.
):
    """
    과거에 마음에 안 들게 연습했던 기록을 기록장에서 영구히 지워버리는 통로예요.
    """
    # 🔍 [이중 잠금장치] 기록 번호(id)도 맞아야 하고, 그 기록에 적힌 주인의 이름도 일치해야만 서랍에서 꺼내옵니다.
    record = (
        db.query(models.PresentationRecord)
        .filter(
            models.PresentationRecord.id == record_id,
            models.PresentationRecord.user_nickname == user_nickname  # 🛡️ 다른 사람 글이면 아예 검색조차 안 되게 철벽 방어!
        )
        .first()
    )
    
    # 🛑 만약 번호가 없거나, 번호는 맞는데 진짜 주인이 아니라면 "없는데요?" 하고 단호하게 거절해요.
    if not record:
        raise HTTPException(
            status_code=404, 
            detail="해당 사용자의 발표 기록을 찾을 수 없거나 지울 권한이 없습니다!"
        )
    
    try:
        # 🗑️ 본인 확인이 100% 완벽하게 끝났으니 안심하고 지웁니다.
        db.delete(record) # 상담원에게 "이 기록지 파쇄기에 넣어줘" 요청하고
        db.commit()       # 책장 문을 닫아서 완벽하게 삭제를 확정 지어요!
        
        # 🧼 지우는 데 성공했다고 확인증을 보냅니다.
        return {
            "status": "success",
            "message": "발표 기록이 안전하게 삭제되었습니다.",
            "deleted_id": record_id
        }
    except Exception as e:
        db.rollback() # 🚨 혹시나 지우다가 렉 걸리거나 에러 나면 안전하게 작업을 취소해요.
        raise HTTPException(status_code=500, detail=f"기록 삭제 중 서버 오류 발생: {str(e)}")