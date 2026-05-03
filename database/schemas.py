from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class AnalyzeRequest(BaseModel):
    text_input: str
    user_nickname: str = "Guest User"

class AnalyzeResponse(BaseModel):
    status: str
    record_id: int
    feedback: str
    analysis_summary: Dict[str, Any]

class RecordResponse(BaseModel):
    id: int
    user_nickname: str
    summary: Optional[str]
    final_score: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)