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
    persona_questions: List[QuestionDetail] = Field(default_factory=list)
    strength: Optional[str] = None
    weakness: Optional[str] = None
    improvement: Optional[str] = None
    content_score: Optional[float] = None
    delivery_score: Optional[float] = None
    final_score: Optional[float] = None
    created_at: datetime
    
    # 💡 [추가] 과거 대시보드를 그대로 그리기 위해 누락된 필드들을 스키마에 포함시켜 줍니다!
    stt_result: Optional[str] = None
    voice_analysis: Optional[Dict[str, Any]] = None
    visual_analysis: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)