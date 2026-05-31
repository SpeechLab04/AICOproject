# database/auth.py
import os
import re  
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt import encode, decode, PyJWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import database
import models
import schemas
from dotenv import load_dotenv

import hashlib

# 📁 현재 폴더(database)의 부모 폴더(AICOproject)에 있는 .env 파일을 강제로 찾아오게 만듭니다.
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
load_dotenv(os.path.join(parent_dir, ".env"))

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"                
ACCESS_TOKEN_EXPIRE_MINUTES = 60

if not SECRET_KEY:
    raise RuntimeError("🚨 [보안 경고] SECRET_KEY 환경변수가 설정되지 않았습니다. .env 파일을 확인해 주세요.")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter(prefix="/auth", tags=["Authentication"])

# 🌍 대한민국 표준 시간(KST) 구하기 함수 (잠금 시간 비교용)
def get_kst_now():
    return datetime.now(timezone(timedelta(hours=9)))

# 비밀번호 강도 검증 함수
def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="비밀번호는 최소 8자 이상이어야 합니다.")
    if not re.search(r"[A-Za-z]", password):
        raise HTTPException(status_code=400, detail="비밀번호에는 최소 하나의 영문자가 포함되어야 합니다.")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="비밀번호에는 최소 하나의 숫자가 포함되어야 합니다.")

# 암호화 유틸리티 함수
def hash_password(password: str) -> str:
    # 1. 비밀번호가 72자를 넘으면 SHA-256으로 먼저 해싱해서 64글자의 고정된 길이로 만듦
    #    (이렇게 하면 bcrypt가 72자 제한 때문에 잘라먹어도 원래 비밀번호 정보를 다 유지함)
    if len(password.encode('utf-8')) > 72:
        password = hashlib.sha256(password.encode('utf-8')).hexdigest()
    
    # 2. 가공된 비밀번호를 bcrypt로 최종 암호화
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # 검증할 때도 똑같이 전처리를 거친 후 비교해야 해!
    if len(plain_password.encode('utf-8')) > 72:
        plain_password = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """[5번 피드백 반영] 토큰 주머니에 만료 시간(exp)과 발급 시간(iat)을 모두 넣어서 출입증을 구워요."""
    to_encode = data.copy()
    now = get_kst_now() # 현재 시간
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES) # 30분 뒤 만료
    
    to_encode.update({
        "exp": expire,
        "iat": now  # 🎫 iat = Issued At (출입증을 끊어준 시간 기록)
    }) 
    return encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# =========================================================================
# 🕵️‍♂️ [3번 피드백 반영] ValueError까지 함께 낚아채는 철통 경비원
# =========================================================================
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="출입증이 가짜거나 시간이 만료되었습니다. 다시 로그인해 주세요!",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub") 
        if user_id_str is None:
            raise credentials_exception
            
        # 🛠️ [3번 피드백 반영] 만약 해커가 위조한 토큰이라 문자열을 숫자(int)로 바꾸다가 
        # 튕겨나가는 에러(ValueError)가 발생해도, 안전하게 잡아내서 쫓아내요!
        user_id = int(user_id_str)
        
    except (PyJWTError, ValueError): # 낚아챌 에러 바구니에 두 종류를 다 넣어둬요!
        raise credentials_exception

    user = db.query(models.UserModel).filter(models.UserModel.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user 


# --- 📌 [창구 1: 회원가입] ---
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_in: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """새로운 회원이 가입 신청서를 내는 통로예요."""
    
    # 📧 [4번 피드백 반영] 사용자가 입력한 메일 주소를 전부 무조건 소문자(.lower())로 바꿔서 조회해요.
    lowered_email = user_in.email.lower()
    
    existing_user = db.query(models.UserModel).filter(models.UserModel.email == lowered_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="이미 다른 사람이 사용 중인 이메일이에요!")
    
    validate_password(user_in.password)

    new_user = models.UserModel(
        email=lowered_email,  # 📧 DB에도 무조건 소문자로 이쁘게 닦아서 저장!
        hashed_password=hash_password(user_in.password),
        is_social=False
    )
    db.add(new_user)
    db.commit() 
    db.refresh(new_user)
    return {"message": "축하합니다! 회원가입이 정상적으로 완료되었습니다.", "user_id": new_user.id}


# =========================================================================
# 📌 [창구 2: 로그인] 5회 실패 시 10분 잠금 제어 장치가 장착된 통로
# =========================================================================
@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    
    # 📧 [4번 피드백 반영] 로그인할 때도 대소문자 안 헷갈리게 소문자로 싹 바꿔서 유저를 찾아요.
    lowered_email = form_data.username.lower()
    user = db.query(models.UserModel).filter(models.UserModel.email == lowered_email).first()
    
    # 열거 공격 방지를 위한 기본 보안 에러 배달원
    auth_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해 주세요.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # 만약 아예 등록 안 된 이메일이라면 그냥 즉시 쫓아내요.
    if not user or user.is_social:
        raise auth_exception
        
    # ⏱️ [잠금 체크 시작] 유저 서랍에 잠금 시간표가 적혀있는지 먼저 검사해요.
    now = get_kst_now()
    if user.lockout_until:
        # 아직 잠금 해제 시간(10분 뒤)에 도달하지 못했다면 거절!
        if now < user.lockout_until:
            remain_time = user.lockout_until - now
            minutes_left = int(remain_time.total_seconds() // 60) + 1
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"🔒 비밀번호 5회 실패로 계정이 잠겼습니다. {minutes_left}분 뒤에 다시 시도해 주세요!"
            )
        else:
            # 10분이 지났다면 다음 기회를 주기 위해 잠금 기록을 깨끗이 지워줍니다.
            user.lockout_until = None
            user.login_attempts = 0
            db.commit()

    # 🔐 비밀번호 검증 단계
    if not verify_password(form_data.password, user.hashed_password):
        # ❌ 비밀번호가 틀렸다면 틀린 횟수를 1 늘려요!
        user.login_attempts += 1
        
        # 🚨 [5회 채웠을 때 처리] 만약 틀린 횟수가 5번이 되는 순간!
        if user.login_attempts >= 5:
            # 현재 시간에서 딱 10분을 더한 시간표를 서랍에 박아버립니다.
            user.lockout_until = now + timedelta(minutes=10)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="🔒 비밀번호를 5회 연속 틀려 계정이 10분간 잠깁니다. 보안을 위해 잠시 기다려 주세요!"
            )
        
        # 5번 미만으로 틀렸을 때는 누적 횟수만 DB에 저장하고 일반 에러를 뿜어요.
        db.commit()
        raise auth_exception

    # ⭕ 로그인 성공! 다음을 위해 틀린 횟수를 카운트를 0으로 깔끔하게 초기화해 줍니다.
    user.login_attempts = 0
    user.lockout_until = None
    db.commit()

    # 안전하게 sub 규격에 유저 ID 문자열을 실어서 출입증을 발급해 줍니다.
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}