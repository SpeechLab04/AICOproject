from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from database import Base 
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))

class PresentationRecord(Base):
    __tablename__ = "presentation_records"

    id = Column(Integer, primary_key=True, index=True)
    user_nickname = Column(String, default="Guest User")

    # 분석 데이터 (내용)
    summary = Column(Text)
    expected_questions = Column(Text)  # JSON 문자열 저장
    strength = Column(Text)
    weakness = Column(Text)
    improvement = Column(Text)
    
    # 점수 및 상세 분석 결과
    content_score = Column(Float)
    delivery_score = Column(Float)
    final_score = Column(Float)
    stt_result = Column(Text)
    voice_analysis = Column(Text)   # JSON 문자열 저장
    visual_analysis = Column(Text)  # JSON 문자열 저장

    created_at = Column(DateTime, default=lambda: datetime.now(KST))