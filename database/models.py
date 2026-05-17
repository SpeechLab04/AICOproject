from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON 
from database import Base 
from datetime import datetime, timedelta, timezone

# 한국 시간(KST)을 기준으로 설정해요 (세계 표준시보다 9시간 빠름)
KST = timezone(timedelta(hours=9))

class PresentationRecord(Base):
    # 데이터베이스에 'presentation_records'(발표 기록들)라는 이름의 테이블(표)을 만들어요.
    __tablename__ = "presentation_records"

    # 1. 고유 번호 (몇 번째 발표인지 자동으로 숫자가 매겨져요)
    id = Column(Integer, primary_key=True, index=True)
    
    # 2. 발표한 사람의 닉네임 (입력 안 하면 자동으로 'Guest User'가 돼요)
    user_nickname = Column(String, default="Guest User")

    # 3. 발표 내용을 한 줄 요약한 텍스트
    summary = Column(Text)
    
    # 4. 예상 면접관(페르소나)이 던질법한 질문 목록들 
    # [예: {"질문1": "왜 이 주제를 골랐나요?", "질문2": "어려웠던 점은?"}] 처럼 여러 데이터를 묶어서 저장해요!
    persona_questions = Column(JSON)  
    
    # 5. 발표의 장점 (잘한 점)
    strength = Column(Text)
    
    # 6. 발표의 단점 (아쉬운 점)
    weakness = Column(Text)
    
    # 7. 앞으로 개선해야 할 점 (피드백)
    improvement = Column(Text)
    
    # 8. 발표 내용 점수 (예: 4.5점 / 소수점이 있는 실수 형태)
    content_score = Column(Float)
    
    # 9. 발표 태도 및 전달력 점수 (예: 4.2점)
    delivery_score = Column(Float)
    
    # 10. 최종 종합 점수 (예: 4.35점)
    final_score = Column(Float)
    
    # 11. 발표자가 말한 오디오를 그대로 받아 적은 텍스트 (STT: Speech-to-Text)
    stt_result = Column(Text)
    
    # 12. 목소리 분석 결과 
    # [예: {"목소리크기": "적당함", "말하기속도": "조금빠름"}] 처럼 세부 분석표를 통째로 저장해요!
    voice_analysis = Column(JSON)   
    
    # 13. 시선 처리 및 표정 분석 결과 
    # [예: {"카메라아이컨택": "80%", "움직임": "산만함"}] 같은 시각적 분석 데이터를 저장해요!
    visual_analysis = Column(JSON)  

    # 14. 이 발표 연습 기록이 '언제' 저장되었는지 날짜와 시간을 자동으로 기록해요
    created_at = Column(DateTime, default=lambda: datetime.now(KST))