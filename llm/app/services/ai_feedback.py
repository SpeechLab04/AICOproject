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
# ==========================================
# 2. 학술적 루브릭 기반 시스템 프롬프트 생성
# ==========================================
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
반드시 주관을 배제하고, 제공된 [Evaluation Rubric]과 [Scoring Rules]에 따라 기계적이고 일관되게 채점해야 한다.

[현재 심사위원 구성]
{persona_section}

# Evaluation Rubric (엄격한 채점 기준)
점수는 다음 3가지 항목을 각각 100점 만점으로 평가한다.
1. 구조와 논리성 (40%): 도입부(인사/주제), 전개(핵심/근거), 결론(요약/맺음)의 명확한 구분 여부.
2. 타당성과 근거 (40%): 기술적 근거, 통계 자료, 학술적 설명, 구체적 구현 방법 포함 여부.
3. 질의응답 및 표현 (20%): 정보의 완결성 및 청중이 이해할 수 있는 전문용어 사용 여부.

# 🚨 엄격한 채점 가이드라인 (Scoring Rules)

1. [🛑 무조건 0.0점 처리 대상 - 오직 완전 무음 및 공백]
   - 오디오에서 아무런 단어도 인식되지 않아 스크립트가 완전히 비어있거나 공백인 경우.
   - 단어가 2~3개 이하로만 찍혀서 도저히 문맥을 파악할 수 없는 수준인 경우.
   - 오직 이 경우에만 계산을 생략하고 content_score와 final_score를 무조건 0.0점으로 처리하라.

2. [⚠️ 20점 미만 최하점 채점 대상 - 100% 사담, 잡담, 게임 테스트]
   - 목소리가 인식되어 텍스트(말)는 존재하지만, 학술적/기술적/사회적 주제가 전혀 없고 전체가 장난, 게임 접속, 준비 중 나누는 사담, 혼잣말로 가득 찬 경우. (예: "네이버 게임에 들어가고 있습니다", "게임하고 싶다" 등)
   - 이 경우, 음성이 감지되어 스크립트가 생성된 노력을 감안하여 절대 0.0점을 주지 마라! 대신 [Evaluation Rubric]의 모든 항목에 최하점을 부여하여 최종 content_score와 final_score가 반드시 '1.0점 이상 ~ 20.0점 미만' (예: 5.5점, 12.0점, 15.3점 등)의 최하점 범위 내에서만 채점되도록 하라.
   - summary에는 "학술적 발표가 아닌 일상 잡담 및 시스템 테스트 음성입니다."라고 명시하라.

# Instructions
- 모든 응답은 한국어로 작성한다.
- content_feedback: 잡담일 경우 strength에는 "음성 감지 및 스크립트 변환 성공" 등을 적고, weakness와 improvement에는 학술적 발표 구성을 갖추라는 피드백을 작성하라.
- persona_questions: [현재 심사위원 구성]에 나열된 선택된 심사위원(persona_type) 각각에 대해 '정확히 딱 1개씩만' 질문을 생성하라. 중복되거나 리스트를 넘어서는 개수 혹은 선택되지 않은 성향을 생성해서는 절대 안 된다.
  * 만약 100% 잡담/사담이라 질문이 어렵다면, 선택된 페르소나 타입은 그대로 유지하되 question 내용만 다음과 같이 통일하라: "발표 형식을 갖추지 않아 질문이 불가능합니다. 학술 주제를 정해 다시 발표해주세요."
"""


# ==========================================
# 3. Structured Outputs를 위한 JSON 스키마
# ==========================================
JSON_SCHEMA = {
    "name": "presentation_feedback_schema",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "summary": {"type": "string"},
            "persona_questions": {
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
            "content_feedback": {
                "type": "object",
                "properties": {
                    "strength": { "type": "array", "items": { "type": "string" } },
                    "weakness": { "type": "array", "items": { "type": "string" } },
                    "improvement": { "type": "array", "items": { "type": "string" } }
                },
                "required": ["strength", "weakness", "improvement"],
                "additionalProperties": False
            },
            "content_score": {"type": "number"},
            "delivery_score": {"type": "number"},
            "final_score": {"type": "number"}
        },
        "required": ["summary", "persona_questions", "content_feedback", "content_score", "delivery_score", "final_score"],
        "additionalProperties": False
    }
}


# ==========================================
# 4. 분석 실행 함수
# ==========================================
async def get_ai_presentation_feedback(script: str, selected_personas: List[str]):
    if not OPENAI_API_KEY:
        raise ValueError("API KEY가 로드되지 않았습니다. .env 파일을 확인하세요.")
    
    clean_script = script.strip() if script else ""
    
    # [1차 필터링]: 진짜 스크립트가 비어있거나 공백 제외 5자 미만일 때만 무조건 0점 하드코딩
    if not clean_script or len(clean_script.replace(" ", "")) < 5:
        return {
            "summary": "발표 스크립트가 존재하지 않거나 발표로 인정할 수 있는 유의미한 음성이 감지되지 않았습니다.",
            "persona_questions": [
                {"persona_type": p, "question": "아무런 발표도 진행되지 않아 질문을 드릴 수가 없습니다."} 
                for p in (selected_personas if selected_personas else ["basic"])
            ],
            "content_feedback": {
                "strength": ["감지된 유의미한 내용이 없습니다."],
                "weakness": ["발표가 진행되지 않았거나 분량이 무의미할 정도로 짧습니다."],
                "improvement": ["발표 스크립트를 입력하거나 오디오 녹음 상태를 확인하세요."]
            },
            "content_score": 0.0,
            "delivery_score": 0.0,
            "final_score": 0.0
        }
    
    clean_script = clean_script.replace("\n", " ").replace("\r", " ").replace("\t", " ")
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
            temperature=0.0
        )

        content = response.choices[0].message.content
        if not content:
            raise HTTPException(status_code=500, detail="AI 응답 생성 실패")

        result = json.loads(content)

        # 💡 [2차 후처리 필터링 가공]: AI가 폭주하여 중복 생성하거나 다른 페르소나를 뱉는 현상 완벽 방어
        requested_personas = selected_personas if selected_personas else ["basic"]
        filtered_questions = []
        
        for p in requested_personas:
            # AI 결과물 중에서 현재 순서에 맞는 페르소나 유형만 딱 1개 매핑
            matched = next((q for q in result.get("persona_questions", []) if q.get("persona_type") == p), None)
            if matched:
                filtered_questions.append(matched)
            else:
                # 만약 AI가 누락했거나 잡담 처리에 실패한 경우 기본 구조 방어 문구 매핑
                filtered_questions.append({
                    "persona_type": p,
                    "question": "발표 형식을 갖추지 않아 질문이 불가능합니다. 학술 주제를 정해 다시 발표해주세요."
                })
        
        # 필터링 및 고정된 질문 리스트로 덮어쓰기 완료
        result["persona_questions"] = filtered_questions

        return result

    except Exception as e:
        print(f"AI Feedback Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI 분석 중 오류가 발생했습니다: {str(e)}")