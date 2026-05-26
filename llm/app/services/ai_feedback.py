import json
import re
from typing import List
from openai import AsyncOpenAI
from fastapi import HTTPException
from llm.app.core.config import OPENAI_API_KEY, OPENAI_MODEL

import json
import re
from typing import List
from openai import AsyncOpenAI
from fastapi import HTTPException
from llm.app.core.config import OPENAI_API_KEY, OPENAI_MODEL

# ==========================================
# 1. 🎯 [유저 제안 반영] 직관적인 흐름 감지 패턴 사전
# ==========================================
# 학술성을 빼고, 실제 대학생들이 발표할 때 쓰는 자연스러운 구어체 오프닝/연결어 패턴
PRESENTATION_PATTERNS = [
    "안녕하세요", "소개하겠습니다", "설명드리겠습니다", "발표를 시작", 
    "이번 주제", "저희 팀은", "먼저", "다음으로", "마지막으로", "결론적으로", "저는", "저희는"
]

# 100% 순수 잡담 및 장난, 징징거림만 잡아내는 강력한 잡담 필터
CHAT_KEYWORDS = [
    "배고파", "졸려", "게임", "놀자", "귀찮아", 
    "ㅋㅋ", "ㅎㅎ", "뭐하지", "하고 싶다", "안되네"
]

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

# ==========================================
# 2. 🛡️ [최종 진화] 규칙 기반 의도/분량 4단계 분류 엔진
# ==========================================
def classify_script(script: str) -> str:
    text = script.strip()
    cleaned = text.replace(" ", "")
    
    # 1단계: 완전 무음 / 공백 최소 분량 미달 판정 (Silent)
    if not cleaned or len(cleaned) < 5:
        return "silent"

    # [유저 컴프리헨션 구조 적용]: 각 사전 컴포넌트 포함 여부 카운팅
    presentation_score = sum(1 for p in PRESENTATION_PATTERNS if p in text)
    chat_score = sum(1 for c in CHAT_KEYWORDS if c in text)

    # 🎯 [제일 큰 문제 2 반영]: 잡담 키워드가 2개 이상 꽂히면 하단 로직 볼 것도 없이 강제 차단 (Obvious Chat)
    if chat_score >= 2:
        return "chat"

    # 2단계: 발표자로서 청중과 대화하려는 최소한의 의도/패턴 확인
    if presentation_score < 2:
        return "chat"

    # 3단계: Whisper STT 특성(쉼표, 줄바꿈)을 감안한 정교한 문장 수 분석
    sentences = [s for s in re.split(r'[.!?,\n]|다\.|요\.', text) if s.strip()]
    sentence_count = len(sentences)

    # 🎯 [제일 큰 문제 3 반영]: 연결 패턴 단어만 도배한 알맹이 없는 입력 필터링
    # 전체 글자 수가 40자 미만이거나 문장 개수가 3개 미만인 경우 (Weak Presentation)
    if len(cleaned) < 40 or sentence_count < 3:
        return "weak_presentation"
        
    # 4단계: 모든 방어선을 뚫고 검증 완료된 정식 발표 데이터
    return "presentation"

# ==========================================
# 3. 고정 응답 제어 함수 (서버 즉시 반환)
# ==========================================
def get_silent_response(selected_personas: List[str]):
    personas = selected_personas if selected_personas else ["basic"]
    return {
        "summary": "발표 스크립트가 존재하지 않거나 발표로 인정할 수 있는 유의미한 음성이 감지되지 않았습니다.",
        "persona_questions": [{"persona_type": p, "question": "아무런 발표도 진행되지 않아 질문을 드릴 수가 없습니다."} for p in personas],
        "content_feedback": {
            "strength": ["감지된 유의미한 내용이 없습니다."],
            "weakness": ["발표가 진행되지 않았거나 분량이 무의미할 정도로 짧습니다."],
            "improvement": ["발표 스크립트를 입력하거나 오디오 녹음 상태를 확인하세요."]
        },
        "content_score": 0.0,
        "delivery_score": 0.0,
        "final_score": 0.0
    }

def get_low_score_response(selected_personas: List[str]):
    personas = selected_personas if selected_personas else ["basic"]
    return {
        "summary": "정식 발표 형식을 갖추지 않은 일상 사담 또는 테스트 음성으로 판단되었습니다.",
        "persona_questions": [{"persona_type": p, "question": "발표 형식을 갖추지 않아 질문이 불가능합니다. 발표 주제를 정해 다시 발표해주세요."} for p in personas],
        "content_feedback": {
            "strength": ["음성이 정상적으로 감지 및 텍스트 대본화되었습니다."],
            "weakness": ["발표 오프닝이나 소통 연결 구조 등 청중에게 정보를 전달하려는 흐름이 전혀 존재하지 않습니다."],
            "improvement": ["연습하고자 하는 팀플이나 과제 주제를 정확히 밝혀주세요.", "사담을 제외하고 정식 발표 오프닝(안녕하세요 등)과 함께 재도전해 보세요."]
        },
        "content_score": 8.0,   
        "delivery_score": 0.0,  
        "final_score": 8.0  
    }

def get_weak_presentation_response(selected_personas: List[str]):
    personas = selected_personas if selected_personas else ["basic"]
    return {
        "summary": "발표의 오프닝이나 의도는 감지되었으나, 본문 설명의 분량이 너무 짧아 구체적인 루브릭 비평이 불가능합니다.",
        "persona_questions": [{"persona_type": p, "question": "발표 형식을 갖추지 않아 질문이 불가능합니다. 본문 내용을 채워 다시 발표해주세요."} for p in personas],
        "content_feedback": {
            "strength": ["안녕하세요, 연결 패턴 등 기본적인 발표 소통 레이아웃을 시도하려는 의도가 확인되었습니다."],
            "weakness": ["발표 본문의 정보량이 지나치게 짧아 구체적인 설명 구조 및 타당성 검증이 불가능합니다."],
            "improvement": ["준비하신 과제나 기획 서비스의 세부 본문 내용을 최소 3문장 이상 추가하여 구체적으로 설명해 주세요."]
        },
        "content_score": 25.0,   # 최소 하한선 점수 보장 (비용 차단)
        "delivery_score": 0.0,  
        "final_score": 25.0  
    }


# ==========================================
# 4. 학술적/프로젝트 루브릭 전용 시스템 프롬프트
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
너는 대학 및 고등학교의 다양한 발표(팀플 기획, 창업 아이디어, 디자인, 마케팅 전략, 서비스 소개 등)를 채점하는 '루브릭 기반 내용 심사위원'이다.
주관적 감정이나 학술어 집착을 배제하고, 오직 아래 제공된 [Evaluation Rubric]의 정량적 채점 기준과 공식에 의해서만 기계적으로 점수를 산출해야 한다.

[현재 심사위원 구성]
{persona_section}

# Evaluation Rubric (엄격한 항목별 배점 및 채점 기준)
최종 점수는 다음 3가지 루브릭 평가 항목의 가중치를 합산하여 100점 만점으로 정밀 산출한다.

1. 구조와 논리성 (배점 가중치: 40%)
   - [채점 요건]: 도입부(인사, 팀/발표자 소개, 주제 및 목적), 전개(핵심 설명, 상세 기획/아이디어 내용), 결론(요약, 맺음말)의 흐름이 명확히 존재하는가?
   - [기준]: 청중이 발표의 흐름을 쉽게 파악할 수 있도록 기본적인 연결어("안녕하세요", "먼저", "다음으로", "마지막으로")가 유기적으로 잘 쓰였는지 채점하라.

2. 타당성과 근거 (배점 가중치: 40%)
   - [채점 요건]: 발표자가 제시한 기획, 전략, 주장 혹은 서비스 아이디어가 설득력이 있는가?
   - [기준]: 이를 뒷받침할 구체적인 구현/실행 방법론, 시장 조사 자료, 사례, 통계, 혹은 구체적 예시 등의 객관적 근거가 스크립트 내에 성실하게 포함되었는지 검증하고 감점/가점하라.

3. 질의응답 및 표현 (배점 가중치: 20%)
   - [채점 요건]: 발표 내용이 청중에게 오해 없이 완결성 있게 전달되는가? 발표 주제에 적합한 단어와 어휘를 올바르게 구사했는지 채점하라.

# 🧮 Scoring Rules (점수 산출 공식)
- 위 3가지 루브릭 항목을 각각 100점 만점으로 채점한 뒤 아래 공식에 대입하여 소수점 첫째 자리까지 계산하라:
  * content_score = (구조와 논리성 점수 * 0.4) + (타당성과 근거 점수 * 0.4) + (질의응답 및 표현 점수 * 0.2)
  * final_score = content_score
  
# 🚨 감점 하한선 및 0점 통제 조항
- 발표의 완성도가 낮거나 분량이 적더라도, '정상적인 발표의 형태'라면 절대로 점수에 0.0점을 부여해서는 안 된다. 최소 20점 이상 영역에서 루브릭 가이드에 따라 정량 감점하라.
- 0.0점은 오직 앞뒤 맥락이 아예 없는 공백이거나 완전 무음일 때만 부여할 수 있다.

# Instructions
- 모든 응답은 한국어로 작성한다.
- content_feedback: 루브릭 평가 결과에 기반하여 strength, weakness, improvement 조항을 각각 '정확히 딱 3가지씩' 성실하게 리스트로 출력하라.
- persona_questions: [현재 심사위원 구성]에 나열된 선택된 심사위원(persona_type) 각각에 대해 '정확히 딱 1개씩만' 성향을 반영한 질문을 생성하라. 개수와 타입을 완벽하게 준수하라.
"""

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
# 5. 메인 분석 엔진 인터페이스
# ==========================================
async def get_ai_presentation_feedback(script: str, selected_personas: List[str]):
    if not OPENAI_API_KEY:
        raise ValueError("API KEY가 로드되지 않았습니다. .env 파일을 확인하세요.")
    
    clean_script = script.strip() if script else ""
    
    # ⚡ [Rule-Based 4단계 정밀 필터 작동]
    classification = classify_script(clean_script)
    
    if classification == "silent":
        return get_silent_response(selected_personas)
        
    if classification == "chat":
        return get_low_score_response(selected_personas)
        
    if classification == "weak_presentation":
        return get_weak_presentation_response(selected_personas)

    # 🚀 모든 방어선을 통과한 정석 대본만 비용을 투자하여 GPT 루브릭 비평 진행
    clean_script = clean_script.replace("\n", " ").replace("\r", " ").replace("\t", " ")
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    
    try:
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": generate_system_prompt(selected_personas)},
                {"role": "user", "content": f"다음 발표 스크립트를 루브릭 기반으로 철저히 분석해 주세요:\n\n{clean_script}"}
            ],
            response_format={"type": "json_schema", "json_schema": JSON_SCHEMA},
            temperature=0.0
        )

        content = response.choices[0].message.content
        if not content:
            raise HTTPException(status_code=500, detail="AI 응답 생성 실패")

        result = json.loads(content)

        # 🛡️ 3차 후처리 보정 연산부 (GPT 예외 차단)
        # 이미 필터를 안전하게 거치고 올라왔음에도 AI가 폭주하여 0점을 준 경우 발표 최소 하한선인 25.0점으로 강력하게 강제 제어
        script_length = len(clean_script.replace(" ", ""))
        if script_length >= 20:
            if result.get("content_score", 0) == 0.0 and result.get("final_score", 0) == 0.0:
                result["content_score"] = 25.0
                result["final_score"] = 25.0
                result["summary"] = "음성은 정상 감지되었으나 구조적 완결성이 낮아 최소 발표 하한 점수(25점)로 보정되었습니다."

        # 타 파트 변수 영역 간섭 원천 배제 및 무결성 보장
        result["delivery_score"] = 0.0

        # 💡 페르소나 질문 정형화 바인딩 필터
        requested_personas = selected_personas if selected_personas else ["basic"]
        filtered_questions = []
        for p in requested_personas:
            matched = next((q for q in result.get("persona_questions", []) if q.get("persona_type") == p), None)
            if matched:
                filtered_questions.append(matched)
            else:
                filtered_questions.append({
                    "persona_type": p,
                    "question": "해당 성향의 심사위원이 생성한 추가 질문이 없습니다."
                })
        
        result["persona_questions"] = filtered_questions
        return result

    except Exception as e:
        print(f"AI Feedback Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI 분석 중 오류가 발생했습니다: {str(e)}")