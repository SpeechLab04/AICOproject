from typing import List
from pydantic import BaseModel, Field

class ContentFeedback(BaseModel):
    strength: str = Field(..., description="발표의 장점")
    weakness: str = Field(..., description="보완할 점")
    improvement: str = Field(..., description="개선 방향")

class FeedbackInput(BaseModel):
    script: str = Field(..., description="발표 스크립트")
    # 교수님 선택 리스트만 필수/기본값으로 유지합니다.
    selected_personas: List[str] = Field(default=["basic"], description="선택된 교수님 페르소나 리스트")

class FeedbackOutput(BaseModel):
    summary: str
    expected_questions: List[str]
    content_feedback: ContentFeedback
    content_score: float
    delivery_score: float  # 구조 유지를 위해 남겨두되, 0으로 처리하거나 추후 통합용으로 사용
    final_score: float