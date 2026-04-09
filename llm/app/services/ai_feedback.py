import json
from openai import AsyncOpenAI
from fastapi import HTTPException
from llm.app.core.config import OPENAI_API_KEY, OPENAI_MODEL

SYSTEM_PROMPT = """
당신은 발표 코칭 전문가입니다.
사용자의 발표 스크립트를 분석하여 반드시 지정된 JSON 형식을 지켜서 응답하세요.

지시사항:
- 모든 텍스트는 한국어로 작성하세요.
- summary는 발표 내용을 3문장 이내로 요약하세요.
- expected_questions는 발표 내용과 관련된 날카로운 질문 3개를 만드세요.
- content_feedback은 반드시 strength(장점), weakness(단점), improvement(개선점) 세 키를 포함해야 합니다.
- content_score는 0~100 사이의 숫자로 책정하세요.
"""

# json_schema 안에 들어갈 실제 스키마 본문
JSON_SCHEMA = {
    "name": "feedback_schema",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "summary": {"type": "string"},
            "expected_questions": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 3,
                "maxItems": 3
            },
            "content_feedback": {
                "type": "object",
                "properties": {
                    "strength": {"type": "string"},
                    "weakness": {"type": "string"},
                    "improvement": {"type": "string"}
                },
                "required": ["strength", "weakness", "improvement"],
                "additionalProperties": False
            },
            "content_score": {
                "type": "number",
                "minimum": 0,
                "maximum": 100
            }
        },
        "required": [
            "summary",
            "expected_questions",
            "content_feedback",
            "content_score"
        ],
        "additionalProperties": False
    }
}

async def get_ai_presentation_feedback(script: str):
    # 함수 실행 시점에 키를 확인하고 클라이언트를 생성해야 안전합니다.
    if not OPENAI_API_KEY:
        raise ValueError("API KEY가 로드되지 않았습니다.")
        
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    try:
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"다음 발표 스크립트를 분석하세요.\n\n{script}"}
            ],
            response_format={
                "type": "json_schema",
                "json_schema": JSON_SCHEMA
            }
        )

        content = response.choices[0].message.content

        if not content:
            raise HTTPException(status_code=500, detail="AI 응답이 비어 있습니다.")

        result = json.loads(content)
        return result

    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI 피드백 생성 실패: {str(e)}")