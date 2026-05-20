from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base 
from datetime import datetime, timedelta, timezone

# 🌍 대한민국 표준 시간(KST)을 기준으로 설정해요 (세계 표준시보다 9시간 빠름)
KST = timezone(timedelta(hours=9))

class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    
    # 📧 [4번 피드백 반영] 대소문자 무관하게 똑같은 이메일로 인식하도록 소문자로만 저장할 거예요.
    email = Column(String, unique=True, index=True, nullable=False) 
    hashed_password = Column(String, nullable=True)                  
    is_active = Column(Boolean, default=True)                       
    is_social = Column(Boolean, default=False)                      
    social_provider = Column(String, nullable=True)                 
    social_id = Column(String, nullable=True)                       

    # 🔒 [로그인 시도 제한 기능 추가]
    # 몇 번 틀렸는지 숫자를 세는 칸이에요 (기본값은 0번)
    login_attempts = Column(Integer, default=0, nullable=False)
    
    # ⏱️ 5번 틀려서 계정이 잠기면, '언제까지 잠글지' 시간을 적어두는 칸이에요 (기본값은 빈칸)
    # ⏱️ [보안 튜닝 완료] 타임존 정보를 포함(timezone=True)하도록 설정!
    # 파이썬 코드의 get_kst_now() 시간과 데이터베이스 시간이 완벽하게 같은 '한국 시간'으로 동기화돼요.
    lockout_until = Column(DateTime(timezone=True), nullable=True)

    # 발표 기록과의 연결고리
    records = relationship("PresentationRecord", back_populates="owner", cascade="all, delete-orphan")

class PresentationRecord(Base):
    # 📊 데이터베이스에 'presentation_records'(발표 기록들)라는 이름의 테이블을 만들어요.
    __tablename__ = "presentation_records"

    id = Column(Integer, primary_key=True, index=True)
    
    # 🔗 [보안 업그레이드!] 예전에는 그냥 'Guest User' 같은 이름표를 붙였지만, 
    # 이제는 방금 위에서 만든 'users' 서랍의 고유 번호(id)를 훔쳐와서 외래키(ForeignKey)로 딱 박아버립니다. 
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    
    # 🔗 유저 서랍과 발표 기록 서랍 사이에 양방향 비밀 통로를 열어둡니다.
    owner = relationship("UserModel", back_populates="records")

    # --- 아래는 기존에 만들었던 발표 결과 데이터 칸들이에요 ---
    user_nickname = Column(String, default="Guest User")
    summary = Column(Text)
    persona_questions = Column(JSON)  
    strength = Column(Text)
    weakness = Column(Text)
    improvement = Column(Text)
    content_score = Column(Float)
    delivery_score = Column(Float)
    final_score = Column(Float)
    stt_result = Column(Text)
    voice_analysis = Column(JSON)   
    visual_analysis = Column(JSON)   
    # 📅 [보안 튜닝 완료] 발표 기록 저장 시간도 타임존을 켜줍니다(timezone=True).
    # 이제 '서버 시간', '토큰 만료 시간', 'DB 저장 시간' 삼박자가 완벽하게 일치해요!
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(KST))
    