from fastapi import FastAPI
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Dict, Any, Optional, List

# 1. 우리 서비스의 '매니저' 역할을 하는 FastAPI를 불러와요.
app = FastAPI()

# --- [1단계: 데이터 상자 규격 정의] ---

# [기록 상자] 사용자가 발표한 내용을 담는 칸이에요.
class CoachingHistory(BaseModel):
    id: Optional[int] = None           # 기록의 고유 번호 (나중에 서버가 1, 2, 3... 자동으로 매겨줌)
    user_id: str                       # 사용자 아이디 (누구의 기록인지 이름표)
    video_url: str                     # 발표 영상이 저장된 인터넷 주소
    audio_url: str                     # 발표 목소리가 저장된 인터넷 주소
    script: str                        # 발표할 때 읽은 대본 텍스트
    llm_feedback: Dict[str, Any]       # AI가 분석한 결과 (점수, 조언 등 여러 정보를 묶어서 저장)
    created_at: datetime = Field(default_factory=datetime.now) # 저장 버튼을 누른 바로 그 '순간'의 시간

# [저장 응답 상자] 저장이 잘 됐을 때 프론트엔드에게 돌려줄 확인증이에요.
class SaveHistoryResponse(BaseModel):
    success: bool      # 성공했는지 알려주는 도장 (True/False)
    message: str       # "성공적으로 저장되었어!" 같은 안내 메시지
    saved_id: int      # 방금 저장된 기록이 몇 번 번호를 받았는지 알려줌

# [조회 응답 상자] 기록을 보여달라고 할 때 예쁘게 포장해서 줄 상자예요.
class GetHistoryResponse(BaseModel):
    success: bool                    # 성공 도장
    user: str                        # 누구의 기록들을 보여주는지 확인
    all_records: List[CoachingHistory] # 찾은 기록들을 리스트로 묶어서 전달

# --- [2단계: 임시 보관 가방] ---
# 지금은 진짜 데이터베이스 대신 컴퓨터 메모리(리스트)에 임시로 저장해요.
# (서버를 끄면 데이터가 날아가니까, 나중엔 진짜 DB로 바꿀 부분이에요!)
history_db: List[CoachingHistory] = []

# --- [3단계: 기록 저장 기능 (POST)] ---
@app.post("/save-history", response_model=SaveHistoryResponse)
async def save_history(data: CoachingHistory):
    """
    사용자가 코칭 결과를 저장하고 싶을 때 이 통로로 데이터를 보내줘요.
    """
    # [똑똑한 번호표 매기기]
    # 가방에 기록이 있으면 마지막 번호 + 1, 없으면 1번을 부여해요.
    next_id = (history_db[-1].id + 1) if history_db else 1
    data.id = next_id
    
    # 가방에 기록 상자를 쏙 집어넣어요.
    history_db.append(data)

    # 정해진 응답 규격(SaveHistoryResponse)에 맞춰서 대답해줘요.
    return {
        "success": True,
        "message": "성공적으로 저장되었어!",
        "saved_id": data.id
    }

# --- [4단계: 기록 조회 기능 (GET)] ---
@app.get("/get-history/{user_id}", response_model=GetHistoryResponse)
async def get_history(user_id: str):
    """
    특정 사용자의 아이디를 알려주면, 그 사람의 모든 기록을 찾아서 보여줘요.
    """
    # 가방을 샅샅이 뒤져서 이름표(user_id)가 일치하는 기록만 골라내요.
    my_records: List[CoachingHistory] = [
        record for record in history_db if record.user_id == user_id
    ]

    # 정해진 응답 규격(GetHistoryResponse)에 맞춰서 결과를 돌려줘요.
    return {
        "success": True,
        "user": user_id,
        "all_records": my_records
    }