import os
import tempfile

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

VOICE_MAP = {
    "mentor": "onyx",    # 중후하고 차분
    "press": "ash",      # 날카롭고 강한 느낌
    "troll": "ballad",   # 독특하고 개성 있는 느낌
    "basic": "nova",     # 친절하고 부드러운 느낌
}

TTS_STYLE = {
    "mentor": """
따뜻하고 다정한 지도교수처럼 말합니다.
학생을 격려하는 느낌으로 읽습니다.
부드럽고 안정적인 톤을 사용합니다.
""",

    "press": """
매우 엄격한 심사위원처럼 말합니다.
날카롭고 권위적인 분위기를 사용합니다.
질문의 핵심을 강하게 압박합니다.
""",

    "troll": """
조금 시큰둥한 교수처럼 말합니다.
질문 내용을 의심하는 듯한 뉘앙스를 사용합니다.
약간 비꼬는 느낌이 있지만 무례하지는 않습니다.
""",

    "basic": """
친절하고 인자한 교수처럼 말합니다.
학생이 편안하게 답변할 수 있도록 말합니다.
"""
}


def generate_question_tts(
    text: str,
    persona_type: str
):
    voice = VOICE_MAP.get(
        persona_type,
        "nova"
    )

    instruction = TTS_STYLE.get(
        persona_type,
        ""
    )

    print(
        f"TTS 생성: {persona_type} / {voice}"
    )

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".mp3"
    )

    response = client.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice=voice,
        instructions=instruction,
        input=text,
    )

    response.stream_to_file(
        temp_file.name
    )

    return temp_file.name