from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime

#  1. 손님이 회원가입할 때 작성해 올 '신청서' 양식
class UserCreate(BaseModel):
    email: EmailStr  
    password: str    

#  2. 로그인을 무사히 통과한 유저에게 들려 보낼 '출입증(토큰)' 양식
class Token(BaseModel):
    access_token: str  
    token_type: str    

# --- 발표 관련 신청서/확인증 양식들 ---
class QuestionDetail(BaseModel):
    persona_type: str
    question: str

class AnalyzeRequest(BaseModel):
    text_input: str
    user_nickname: str = "Guest User"
    selected_personas: List[str] = Field(default_factory=lambda: ["basic"])
    video_url: Optional[str] = None
    practice_count: Optional[int] = None
    
class AnalyzeResponse(BaseModel):
    status: str
    record_id: int
    feedback: str
    analysis_summary: Dict[str, Any]

class TitleUpdateRequest(BaseModel):
    title: str = Field(..., max_length=100, description="변경할 새로운 발표 기록 제목")

class TitleUpdateResponse(BaseModel):
    status: str
    message: str
    record_id: int
    updated_title: str
    
class RecordResponse(BaseModel):
    id: int
    user_nickname: str
    title: Optional[str] = None
    video_url: Optional[str] = None
    practice_count: Optional[int] = None
    
    summary: Optional[str] = None
    
    #  [추가] DB(models.py)에 추가한 content_critique 컬럼과 
    # 프론트엔드 대시보드를 에러 없이 연결해 주는 징검다리 필드입니다.
    content_critique: Optional[str] = None
    
    persona_questions: Any = Field(default_factory=list)
    strength: Optional[Any] = None
    weakness: Optional[Any] = None
    improvement: Optional[Any] = None
    content_score: Optional[float] = None
    delivery_score: Optional[float] = None
    final_score: Optional[float] = None
    created_at: datetime
    stt_result: Optional[str] = None
    voice_analysis: Optional[Dict[str, Any]] = None
    visual_analysis: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)
    
class DeleteResponse(BaseModel):
    status: str
    message: str
    deleted_id: int