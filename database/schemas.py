from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class QuestionDetail(BaseModel):
    persona_type: str
    question: str

class AnalyzeRequest(BaseModel):
    text_input: str
    user_nickname: str = "Guest User"
    # ✅ 1. Mutable Default 방지를 위해 가동하는 동적 기본값 공장!
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

    # ✅ 2. 혹시 질문이 없어도 에러 안 나게 빈 리스트 공장 설정
    persona_questions: List[QuestionDetail] = Field(default_factory=list)

    strength: Optional[str] = None
    weakness: Optional[str] = None
    improvement: Optional[str] = None

    # ✅ 3. 어떤 점수라도 누락되었을 때 서버가 터지지 않게 안전장치 확보!
    content_score: Optional[float] = None
    delivery_score: Optional[float] = None
    final_score: Optional[float] = None

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)