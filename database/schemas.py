from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, EmailStr

# 📝 1. 손님이 회원가입할 때 작성해 올 '신청서' 양식이에요.
class UserCreate(BaseModel):
    # EmailStr을 쓰면 "@"가 빠졌거나 주소가 이상할 때 컴퓨터가 알아서 "이메일 형식이 아니잖아!" 하고 거절해요.
    email: EmailStr  
    password: str    # 유저가 비밀번호로 쓰고 싶다고 입력한 글자

# 🎫 2. 로그인을 무사히 통과한 유저에게 들려 보낼 '출입증(토큰)' 양식이에요.
class Token(BaseModel):
    access_token: str  # 엄청 복잡하게 암호화된 가짜 출입증 문자열
    token_type: str    # 토큰의 종류 (우리는 표준인 'bearer'를 써요)

# --- 아래는 기존에 사용하던 발표 관련 신청서/확인증 양식들이에요 ---
class QuestionDetail(BaseModel):
    persona_type: str
    question: str

class AnalyzeRequest(BaseModel):
    text_input: str
    user_nickname: str = "Guest User"
    selected_personas: List[str] = Field(default_factory=lambda: ["basic"])

class AnalyzeResponse(BaseModel):
    status: str
    record_id: int
    feedback: str
    analysis_summary: Dict[str, Any]

class RecordResponse(BaseModel):
    id: int
    user_nickname: str
    summary: Optional[str] = None
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