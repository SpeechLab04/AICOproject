from typing import List
from pydantic import BaseModel, Field

class QuestionDetail(BaseModel):
    persona_type: str = Field(
        ..., 
        description="심사위원 성향 ID (예: hr_manager, tech_developer, sharp_critic, distracted_troll 등 10종)"
    )
    question: str = Field(..., description="생성된 질문 내용")
    intent: str = Field(..., description="대시보드 표출용 질문 생성 의도 및 역량 검증 목적")

class ContentFeedback(BaseModel):
    strength: List[str] = Field(..., description="발표의 장점 (정확히 3개)")
    weakness: List[str] = Field(..., description="보완할 점 (정확히 3개)")
    improvement: List[str] = Field(..., description="개선 방향 (정확히 3개)")

class FeedbackInput(BaseModel):
    script: str = Field(..., description="발표 스크립트")
    selected_personas: List[str] = Field(default=["hr_manager"], description="선택된 심사위원 페르소나 리스트")

class FeedbackOutput(BaseModel):
    summary: str = Field(..., description="발표 종합 요약")
    persona_questions: List[QuestionDetail] = Field(..., description="심사위원단 질문 및 의도 세트")
    content_feedback: ContentFeedback
    content_score: float = Field(..., description="LLM 내용 채점 최종본 (40/40/20 가중치 합산)")
    final_score: float = Field(..., description="최종 점수 (내용 점수가 고정 반영 및 보정된 결과)")