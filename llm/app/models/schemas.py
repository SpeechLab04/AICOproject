from typing import List
from pydantic import BaseModel, Field

# ✅ 추가: 각 교수별 질문 상세 구조 정의
class QuestionDetail(BaseModel):
    persona_type: str = Field(..., description="교수 성향 (mentor, press, troll, basic)")
    question: str = Field(..., description="생성된 질문 내용")

class ContentFeedback(BaseModel):
    strength: List[str] = Field(..., description="발표의 장점")
    weakness: List[str] = Field(..., description="보완할 점")
    improvement: List[str] = Field(..., description="개선 방향")

class FeedbackInput(BaseModel):
    script: str = Field(..., description="발표 스크립트")
    selected_personas: List[str] = Field(default=["basic"], description="선택된 교수님 페르소나 리스트")

class FeedbackOutput(BaseModel):
    summary: str
    # ✅ 수정: List[str] -> List[QuestionDetail]로 변경하고 이름도 persona_questions로 통일
    persona_questions: List[QuestionDetail] 
    content_feedback: ContentFeedback
    content_score: float
    delivery_score: float  # 통합용 (0.0 등 기본값)
    final_score: float