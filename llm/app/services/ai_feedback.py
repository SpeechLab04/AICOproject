import json
from typing import List
from openai import AsyncOpenAI
from fastapi import HTTPException
from llm.app.core.config import OPENAI_API_KEY, OPENAI_MODEL

# 1. 교수님 페르소나 상세 정의
PERSONA_DETAILS = {
    "mentor": """[멘토형 — 친절하고 전문적인 교수님]
- 성격: 발표자의 성장을 돕는 따뜻한 전문가. 발표 내용을 깊이 있게 경청하며, 논리적 완성도를 높일 수 있는 방향을 제시함.
- 질문 방식: 발표에서 언급된 '핵심 개념'이나 '방법론'의 타당성을 묻고, 보완할 점을 제안하는 방식.
 
- 지시: 반드시 스크립트 내의 특정 키워드를 인용하여 질문하고, 정중한 존댓말을 사용하세요.""",
# (예: "발표에서 [A]라는 해결책을 제시하셨는데, 이를 [B] 상황에 적용한다면 어떤 기대효과가 있을까요?")

    "press": """[압박형 — 까다롭고 날카로운 전문가 교수님]
- 성격: 매우 높은 전문성을 바탕으로 논리적 허점과 근거의 빈약함을 집요하게 파고듦. 칭찬보다는 비판적 검증에 집중함.
- 질문 방식: 발표자가 제시한 '근거'의 취약점을 공격하거나, 반대 사례를 들어 당혹스럽게 만드는 방식.
  
- 지시: 날카로운 통찰력을 보여주되 인신공격은 금지하며, 존댓말을 하되 권위적인 분위기를 조성하세요.""",
#(예: "본인은 [A]라고 주장하지만, 실제 법령이나 통계는 [B]라고 말합니다. 이거 논리적 모순 아닌가요?")

    "troll": """[트롤형 — 무성의하고 맥락 없는 교수님]
- 성격: 발표에는 관심이 없고 본인의 기분이나 아주 지엽적인 부분에 집착함. 전문성은 낮으나 까다로운 태도를 보임.
- 질문 방식: 이미 설명한 내용을 다시 묻거나, 발표 주제와 상관없는 개인적인 궁금증 혹은 단어 하나에 트집 잡는 방식.

- 지시: 무성의한 태도를 유지하며, 전문적인 깊이보다는 청중을 당황하게 만드는 소모적인 질문을 던지세요. 단 존댓말을 사용하세요.""",
#  (예: "아까 [A]라고 말한 것 같은데 다시 설명해봐요.")

    "basic": """[기본형 — 친절하지만 원론적인 교수님]
- 성격: 발표자의 노력을 격려하며 무난하고 표준적인 질문을 던짐. 깊은 전문 지식보다는 발표의 전반적인 흐름과 준비 과정을 확인하려 함.
- 질문 방식: 발표 내용의 '의의'나 '청중 타겟팅', 혹은 '추후 발전 방향'에 대해 묻는 방식.
  
- 지시: 부드럽고 따뜻한 말투를 사용하며, 발표자가 자신의 준비 과정을 충분히 설명할 기회를 주는 질문을 하세요."""
#(예: "[A]라는 주제를 선정하게 된 특별한 계기가 있나요?")
}

# 2. 동적 시스템 프롬프트 생성
# 2. 학술적 루브릭 기반 시스템 프롬프트 생성
def generate_system_prompt(selected_personas: List[str]):
    valid_personas = [p for p in selected_personas if p in PERSONA_DETAILS]
    if not valid_personas:
        valid_personas = ["basic"]

    persona_section = ""
    for p in valid_personas:
        persona_section += f"\n{PERSONA_DETAILS[p]}\n"

    return f"""
# Role & Academic Background
너는 대학 및 고등학교의 학술 발표를 전문적으로 비평하는 '발표 내용 분석 전문가'이다.
본 페르소나는 '학습자 중심 발표 수행평가 루브릭 개발 연구' 및 교육공학 선행 연구의 검증된 학술적 기준을 바탕으로 작동한다.

[현재 심사위원 구성]
{persona_section}

# Evaluation Rubric (엄격한 채점 기준)
점수는 다음 3가지 항목을 각 100점 만점으로 평가한 후 평균을 낸다.

1. 구조와 논리성 (40%):
   - 도입부(인사, 주제 소개), 전개(핵심 내용, 근거), 결론(요약, 맺음말)이 명확히 구분되는가?
   - 분량이 너무 짧거나(예: 3문장 미만) 구조가 생략된 경우 해당 항목은 최대 30점 이상 주지 마라.

2. 타당성과 근거 (40%):
   - 기술적 근거, 통계자료, 혹은 구체적인 구현 방법이 포함되어 있는가?
   - 단순히 "서비스가 있다"고 나열만 하거나 논리적 근거가 없으면 40점 이하로 감점하라.

3. 질의응답 및 표현 (20%):
   - 청중이 이해하기 쉬운 용어를 사용하는가? 정보의 완결성이 있는가?

# Scoring Mission (필독)
- 매우 짧은 스크립트(예: 단순 인사 및 소개)의 경우, 절대 50점을 넘기지 마라.
- 내용이 부실함에도 불구하고 높은 점수를 주는 '후한 평가'를 지양하고, 냉정하고 객관적인 학술적 잣대로 평가하라.

# Instructions
- 모든 응답은 한국어로 작성한다.
- summary: 발표 전체 내용을 2~3문장으로 요약한다.
- content_feedback: 
    - strength: 내용 면에서 우수한 점 3가지를 '문자열 리스트' 형태로 작성하세요.
    - weakness: 논리적 허점이나 보완점 3가지를 '문자열 리스트' 형태로 작성하세요.
    - improvement: 다음 발표에서 즉시 개선 가능한 개선 조언 3가지를 '문자열 리스트' 형태로 작성하세요.
- persona_questions: 선택된 심사위원마다 성향을 재현한 질문을 1개씩 생성한다.
- content_score: 위 루브릭에 따른 최종 평균 점수를 산출한다.
"""

# 3. Structured Outputs를 위한 JSON 스키마
JSON_SCHEMA = {
    "name": "presentation_feedback_schema",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "summary": {"type": "string"},
            "persona_questions": { # 스키마에 따라 expected_questions로 바꿀 수도 있음
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "persona_type": {"type": "string", "enum": ["mentor", "press", "troll", "basic"]},
                        "question": {"type": "string"}
                    },
                    "required": ["persona_type", "question"],
                    "additionalProperties": False
                }
            },
            "content_feedback": { # 여기를 에러 메시지의 필드명과 일치시킵니다.
                "type": "object",
                "properties": {
                    "strength": { "type": "array", "items": { "type": "string" } }, # 👈 string에서 array로 변경
                    "weakness": { "type": "array", "items": { "type": "string" } },
                    "improvement": { "type": "array", "items": { "type": "string" } }
                },
                "required": ["strength", "weakness", "improvement"],
                "additionalProperties": False
            },
            "content_score": {"type": "number"},
            "delivery_score": {"type": "number"}, # 스키마에 있는 필드 추가
            "final_score": {"type": "number"}    # 스키마에 있는 필드 추가
        },
        "required": ["summary", "persona_questions", "content_feedback", "content_score", "delivery_score", "final_score"],
        "additionalProperties": False
    }
}


# 4. 분석 실행 함수
async def get_ai_presentation_feedback(script: str, selected_personas: List[str]):
    if not OPENAI_API_KEY:
        raise ValueError("API KEY가 로드되지 않았습니다. .env 파일을 확인하세요.")
    
    # 텍스트 전처리
    clean_script = script.replace("\n", " ").replace("\r", " ").replace("\t", " ")
    
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    
    try:
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": generate_system_prompt(selected_personas)},
                {"role": "user", "content": f"다음 발표 스크립트와 질의응답을 분석하여 루브릭 기반 피드백을 주세요:\n\n{clean_script}"}
            ],
            response_format={
                "type": "json_schema",
                "json_schema": JSON_SCHEMA
            },
            temperature=0.5 # 평가 일관성을 위해 낮은 온도 설정
        )

        content = response.choices[0].message.content
        if not content:
            raise HTTPException(status_code=500, detail="AI 응답 생성 실패")

        return json.loads(content)

    except Exception as e:
        print(f"AI Feedback Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI 분석 중 오류가 발생했습니다: {str(e)}")