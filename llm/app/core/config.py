import os
from pathlib import Path
from dotenv import load_dotenv

# 현재 config.py 위치: aico-project/llm/app/core/config.py
# .env 위치: aico-project/.env
# 따라서 부모 폴더로 4번 올라가야 루트(aico-project)에 도달합니다.
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
env_path = BASE_DIR / ".env"

# 경로를 명시적으로 지정해서 로드
load_dotenv(dotenv_path=env_path)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# 🔍 디버깅용 (서버 터미널에서 확인용)
if not OPENAI_API_KEY:
    print(f"❌ 설정 에러: .env 파일을 못 찾았습니다! 시도한 경로: {env_path}")
else:
    print(f"✅ 성공: API 키 로드 완료!")