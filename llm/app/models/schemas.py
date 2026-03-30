from typing import List, Optional
from pydantic import BaseModel, Field

class ContentFeedback(BaseModel):
    strength: str = Field(..., description="발표의 장점")
    weakness: str = Field(..., description="보완할 점")
    improvement: str = Field(..., description="개선 방향")

class FeedbackInput(BaseModel):
    script: str = Field(..., description="발표 스크립트")
    wpm: Optional[float] = Field(None, description="말 속도")
    filler_count: int = Field(0, description="필러워드 개수")
    head_pose_score: Optional[float] = Field(None, ge=0, le=100)
    eye_contact_score: Optional[float] = Field(None, ge=0, le=100)

class FeedbackOutput(BaseModel):
    summary: str
    expected_questions: List[str]
    content_feedback: ContentFeedback
    content_score: float
    delivery_score: float
    final_score: float