import json
import re
from typing import List
from openai import AsyncOpenAI, RateLimitError, APIStatusError, APIConnectionError
from fastapi import HTTPException
from llm.app.core.config import OPENAI_API_KEY, OPENAI_MODEL


# ==========================================
# 1. 👥 페르소나 상세 정의
# ==========================================
PERSONA_DETAILS = {
    "mentor": """[멘토형 — 친절하고 전문적인 교수님]
- 성격: 발표자의 성장을 돕는 따뜻한 전문가. 논리적 완성도를 높일 수 있는 방향을 제시함.
- 질문 방식: 스크립트 내 '핵심 개념'이나 '방법론'의 타당성을 묻고, 보완점을 제안.
- 지시: 반드시 스크립트 내 특정 키워드를 인용하여 질문하고, 정중한 존댓말을 사용하세요.""",

    "press": """[압박형 — 까다롭고 날카로운 전문가 교수님]
- 성격: 높은 전문성으로 논리적 허점과 근거의 빈약함을 집요하게 파고듦.
- 질문 방식: 발표자가 제시한 '근거'의 취약점을 공격하거나 반대 사례를 제시.
- 지시: 날카로운 통찰력을 보여주되 인신공격은 금지. 권위적이지만 존댓말을 사용하세요.""",

    "troll": """[트롤형 — 무성의하고 맥락 없는 교수님]
- 성격: 발표에 관심이 없고 지엽적인 부분에 집착함. 전문성은 낮으나 까다로운 태도.
- 질문 방식: 이미 설명한 내용을 재질문하거나 주제와 무관한 지엽적 트집.
- 지시: 무성의한 태도를 유지하되, 존댓말은 반드시 사용하세요.""",

    "basic": """[기본형 — 친절하지만 원론적인 교수님]
- 성격: 발표자의 노력을 격려하며 무난하고 표준적인 질문을 던짐.
- 질문 방식: 발표 '의의', '청중 타겟', '추후 발전 방향'에 대해 묻는 방식.
- 지시: 부드럽고 따뜻한 말투로, 발표자가 충분히 설명할 기회를 주는 질문을 하세요."""
}


# ==========================================
# 2. 🛡️ 스크립트 분류 엔진 (물리적 지표 기반 최소 제어)
# ==========================================
def classify_script(script: str) -> str:
    text = script.strip()
    cleaned = text.replace(" ", "")

    # 1단계: 완전 무음 / 공백 최소 분량 미달 판정 (Silent)
    if not cleaned or len(cleaned) < 5:
        return "silent"

    # 2단계: Whisper STT 특성(문장부호 누락)을 감안한 텍스트 절대 길이 검증 (Weak Presentation)
    if len(cleaned) < 25:
        return "weak_presentation"

    return "presentation"


# ==========================================
# 3. 🔩 실무형 타입 및 배열 정형화 가드 함수
# ==========================================
def safe_float(value, default=0.0) -> float:
    """🎯 [버그 패치 1 반영]: 소수점 뇌절 및 타 자료형 오염을 철저하게 분리 수금하는 정규식 서치 가드"""
    try:
        if isinstance(value, str):
            match = re.search(r"-?\d+(\.\d+)?", value)
            if match:
                return float(match.group(0))
        return float(value)
    except (TypeError, ValueError):
        return default


def normalize_feedback(arr: list, fallback: List[str]) -> List[str]:
    """GPT가 피드백 개수를 2개나 4개로 뇌절칠 때 정확히 3개 배열로 컷/패딩하여 프론트 UI 깨짐을 막는 가드"""
    if not isinstance(arr, list):
        return fallback
    arr = [str(x).strip() for x in arr if str(x).strip()]
    if len(arr) >= 3:
        return arr[:3]
    while len(arr) < 3:
        arr.append(fallback[len(arr)])
    return arr


# ==========================================
# 4. 고정 응답 함수 (서버 내부 즉시 반환 레이어)
# ==========================================
def get_silent_response(selected_personas: List[str]) -> dict:
    personas = selected_personas if selected_personas else ["basic"]
    return {
        "summary": "발표 스크립트가 존재하지 않거나 발표로 인정할 수 있는 유의미한 음성이 감지되지 않았습니다.",
        "persona_questions": [{"persona_type": p, "question": "아무런 발표도 진행되지 않아 질문을 드릴 수가 없습니다."} for p in personas],
        "content_feedback": {
            "strength": ["음성 신호 확인이 불가능합니다.", "텍스트 데이터 분량이 존재하지 않습니다.", "분석을 진행할 기본 대상이 없습니다."],
            "weakness": ["발표 대본의 절대적인 텍스트 길이가 부족합니다.", "도입-전개-결론의 구조적 전개가 일어나지 않았습니다.", "프로젝트에 대한 설명 정보량이 전무합니다."],
            "improvement": ["마이크 녹음 상태 및 오디오 환경을 재점검해 보세요.", "연습하고자 하는 발표의 스크립트 내용을 정상적으로 입력해 주세요.", "의도적인 무음 상태가 지속되었는지 확인이 필요합니다."]
        },
        "structure_score": 0.0,
        "evidence_score": 0.0,
        "expression_score": 0.0,
        "content_score": 0.0,
        "delivery_score": 0.0,
        "final_score": 0.0
    }


def get_weak_presentation_response(selected_personas: List[str]) -> dict:
    personas = selected_personas if selected_personas else ["basic"]
    return {
        "summary": "발표의 오프닝이나 의도는 감지되었으나, 본문 설명의 분량이 너무 짧아 구체적인 루브릭 비평이 불가능합니다.",
        "persona_questions": [{"persona_type": p, "question": "발표 형식을 갖추지 않아 질문이 불가능합니다. 본문 내용을 채워 다시 발표해주세요."} for p in personas],
        "content_feedback": {
            "strength": ["기본적인 발표 의도 표현 형식을 시도하려는 의지가 확인되었습니다.", "스피치를 시작하려는 서두 연결 시도가 감지되었습니다.", "최소한의 음성 입력 텍스트화가 완료되었습니다."],
            "weakness": ["발표 본문의 정보량이 지나치게 짧아 내용 비평이 불가능합니다.", "주제를 설명할 구체적인 기능이나 근거가 생략되어 있습니다.", "전개 및 결론으로 이어지는 거시 논리 구조가 결여되었습니다."],
            "improvement": ["준비하신 과제나 서비스의 핵심 본문을 최소 3문장 이상 추가해 보세요.", "서론만 말하고 끝나지 않도록 주요 특징 및 구현 내용을 기술해 주세요.", "전달하고자 하는 핵심 정보를 풍부하게 서술한 뒤 재도전해 보세요."]
        },
        "structure_score": 35.0,
        "evidence_score": 15.0,
        "expression_score": 25.0,
        "content_score": 25.0,
        "delivery_score": 0.0,
        "final_score": 25.0
    }


# ==========================================
# 5. ⚡ [속도 최적화] 시스템 프롬프트 생성
# ==========================================
def generate_system_prompt(selected_personas: List[str]) -> str:
    valid_personas = [p for p in selected_personas if p in PERSONA_DETAILS]
    if not valid_personas:
        valid_personas = ["basic"]

    persona_section = "\n".join(PERSONA_DETAILS[p] for p in valid_personas)

    return f"""
# Role
너는 발표(팀플, 창업 피칭, 자기소개 등)를 채점하는 '루브릭 기반 내용 심사위원'이다. 
단어 매칭 대신 전체 문맥과 정보 전달 흐름을 기준으로 채점하라.

[현재 심사위원 구성]
{persona_section}

#  최우선 채점 가이드라인

1. [ STT 노이즈] 문맥상 유추 가능한 오타는 정상 단어로 간주하되, 없는 내용을 과도하게 상상해서 채우지 마라.
2. [구조 및 사담]
   - 인사와 팀/주제 소개가 포함된 올바른 오프닝 여부를 structure_score에 적극 반영하라.
   - 구어체 필러("아", "그러니까", "음" 등)는 감점하지 마라.
   - 발표 도중 촬영/녹음 관련 혼잣말이나 청중 외 대화가 1회라도 감지되면 structure_score를 40점 이하로 제한하고 summary에 사담 감지 사실을 명시하라.
   - 100% 순수 잡담/장난이면 전 항목을 20점 미만으로 제한하라.
3. [ 설명 단위 및 완결성 평가] 기능, 구조, 방법론, 계획 등 독립적 설명 단위가 많을수록 우수한 발표다. 
    **[치명적 감점]**: 문장이 깔끔하고 유창하더라도, 내용 알맹이가 없거나 서론(도입)만 말하다가 급격히 종료된 미완성 발표는 'evidence_score'를 절대 30점 이하로 하방 고정하라.
4. [ 진행형 상황] 중간 공유, 피칭, 자기소개도 정상 수용하며, 구체적인 향후 계획은 결론 구조로 인정하라.

# 📊 채점 앵커 (Few-shot)
- [완벽 구조 + 설명 단위 3개 이상 + 명확한 근거] → 구조:90 / 근거:85 / 표현:85
- [오프닝·전개 우수 + 결론 미완성 + 설명 2개] → 구조:60 / 근거:55 / 표현:65
- [문장은 자연스러우나 알맹이/설명이 전혀 없음] → 구조:50 / 근거:35 / 표현:60
- [발표 중 촬영/녹음 관련 사담 1회 감지] → 구조:40이하 / 근거:GPT재량 / 표현:GPT재량
- [발표가 아닌 100% 일상 잡담, 장난성 입력] → 구조:15이하 / 근거:10이하 / 표현:15이하

# Evaluation Rubric (100점 만점 기준 정밀 채점)
1. structure_score (가중치 40%): 오프닝(인사/소개) 및 도입->전개->결론 흐름의 명확성 (순수 잡담은 15점 이하)
2. evidence_score (가중치 40%): 상황에 맞는 구체적인 설명 단위, 아이디어, 방법론의 설득력
3. expression_score (가중치 20%): 주제에 적합한 어휘 구사력 및 질의응답력

# 🗮 점수 산출 공식
content_score = (structure_score * 0.4) + (evidence_score * 0.4) + (expression_score * 0.2)
delivery_score = 0.0
final_score = content_score

# Instructions
- 모든 응답은 한국어로 작성한다.
- content_feedback: strength, weakness, improvement 조항을 핵심만 '정확히 딱 3가지씩' 짧고 명확한 문장으로 리스트 출력하라. (장황하게 쓰지 말 것)
- persona_questions: 선택된 심사위원(persona_type)별로 날카로운 질문을 '정확히 딱 1개씩만' 생성하라.
"""


# ==========================================
# 6. JSON 스키마 (strict: False 모드로 속도/성공률 극대화)
# ==========================================
JSON_SCHEMA = {
    "name": "presentation_feedback_schema",
    "strict": False,
    "schema": {
        "type": "object",
        "properties": {
            "summary": {"type": "string"},
            "persona_questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "persona_type": {
                            "type": "string",
                            "enum": ["mentor", "press", "troll", "basic"]
                        },
                        "question": {"type": "string"}
                    },
                    "required": ["persona_type", "question"]
                }
            },
            "content_feedback": {
                "type": "object",
                "properties": {
                    "strength":    {"type": "array", "items": {"type": "string"}},
                    "weakness":    {"type": "array", "items": {"type": "string"}},
                    "improvement": {"type": "array", "items": {"type": "string"}}
                },
                "required": ["strength", "weakness", "improvement"]
            },
            "structure_score":  {"type": "number"},
            "evidence_score":   {"type": "number"},
            "expression_score": {"type": "number"},
            "content_score":    {"type": "number"},
            "delivery_score":   {"type": "number"},
            "final_score":      {"type": "number"}
        },
        "required": [
            "summary", "persona_questions", "content_feedback",
            "structure_score", "evidence_score", "expression_score",
            "content_score", "delivery_score", "final_score"
        ]
    }
}


# ==========================================
# 7. 메인 분석 엔진 인터페이스
# ==========================================
async def get_ai_presentation_feedback(
    script: str,
    selected_personas: List[str]
) -> dict:

    if not OPENAI_API_KEY:
        raise ValueError("API KEY가 로드되지 않았습니다. .env 파일을 확인하세요.")

# 🎯 [해결 패치]: 프론트에서 'pressure'나 '압박형' 어떤 걸로 보내든 'press'로 완벽 매핑
    persona_map = {
        "mentor": "mentor", "멘토형": "mentor", "멘토": "mentor",
        "press": "press", "pressure": "press", "압박형": "press", "압박": "press", "비판형": "press",
        "troll": "troll", "troll형": "troll", "트롤형": "troll", "트롤": "troll",
        "basic": "basic", "기본형": "basic", "기본": "basic"
    }
    
    # 전달받은 리스트 표준화 변환
    if selected_personas:
        standardized_personas = []
        for p in selected_personas:
            p_clean = str(p).strip()
            if p_clean in persona_map:
                standardized_personas.append(persona_map[p_clean])
        selected_personas = list(dict.fromkeys(standardized_personas))
    
    if not selected_personas:
        selected_personas = ["basic"]
        
    clean_script = script.strip() if script else ""
    classification = classify_script(clean_script)

    # ── 즉시 반환 레이어 (서버 내부 연산) ──────────────────
    if classification == "silent":
        return get_silent_response(selected_personas)

    if classification == "weak_presentation":
        return get_weak_presentation_response(selected_personas)

    # ── OpenAI 비동기 연산 레이어 ──────────────────────────
    clean_script = (
        clean_script
        .replace("\n", " ")
        .replace("\r", " ")
        .replace("\t", " ")
    )

    client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    try:
        # 🎯 [속도 대혁신]: 유저님의 지적대로 max_tokens 가드 배치 및 가벼운 mini 모델 사용
        # config 설정에서 model이 'gpt-4o-mini'로 잡혀있는지 꼭 확인해 주세요!
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,  # 💡 gpt-4o-mini 설정 권장
            messages=[
                {
                    "role": "system",
                    "content": generate_system_prompt(selected_personas)
                },
                {
                    "role": "user",
                    "content": f"다음 발표 스크립트를 루브릭 기반으로 철저히 분석해 주세요:\n\n{clean_script}"
                }
            ],
            response_format={"type": "json_schema", "json_schema": JSON_SCHEMA},
            temperature=0.0,
            max_tokens=800  # 🔥 [핵심 패치]: 출력 토큰 강제 제한으로 API 속도 병목 완전 해결
        )

        content = response.choices[0].message.content
        if not content:
            raise HTTPException(status_code=500, detail="AI 응답 생성 실패")

        result = json.loads(content)

        # 🛡️ 3차 후처리 안전 제어 및 코드 클램핑부 (Type Safe 가드)
        struct_s = safe_float(result.get("structure_score", 0.0))
        evid_s = safe_float(result.get("evidence_score", 0.0))
        expr_s = safe_float(result.get("expression_score", 0.0))

        struct_s = max(0.0, min(struct_s, 100.0))
        evid_s = max(0.0, min(evid_s, 100.0))
        expr_s = max(0.0, min(expr_s, 100.0))

        calc_content_score = (struct_s * 0.4) + (evid_s * 0.4) + (expr_s * 0.2)

        # GPT 환각으로 전 항목 0점 반환한 경우만 방어 (25점 하한 보정 제거)
        if calc_content_score == 0.0:
            calc_content_score = 10.0
            result["summary"] = "채점 오류로 최소 점수(10점)로 보정되었습니다."

        # 최종 데이터 무결성 강제 동기화 매핑
        result["structure_score"] = float(struct_s)
        result["evidence_score"] = float(evid_s)
        result["expression_score"] = float(expr_s)
        result["content_score"] = float(calc_content_score)
        result["delivery_score"] = 0.0
        result["final_score"] = float(calc_content_score)

        # 프론트엔드 UI 레이아웃 유지를 위한 피드백 배열 3개 고정 보정화 레이어
        inner_feedback = result.get("content_feedback", {})
        
        fallback_strength = ["주제 전달을 위한 설명 시도가 감지되었습니다.", "기본적인 발표 흐름이 정비되어 있습니다.", "발표자로서 정보를 소통하려는 의도가 확인됩니다."]
        fallback_weakness = ["발표 세부 정보량의 확장 여지가 남아있습니다.", "일부 논리 구조의 흐름이 다소 뭉개져 있습니다.", "본론을 뒷받침할 구체적인 예시가 보완되면 좋습니다."]
        fallback_improvement = ["설명 단위를 조금 더 다양화하여 분량을 늘려보세요.", "도입부의 주제 소개를 조금 더 명확히 명시해 보세요.", "향후 계획에 대한 실행 방향성을 덧붙여 보세요."]

        if isinstance(inner_feedback, dict):
            result["content_feedback"] = {
                "strength": normalize_feedback(inner_feedback.get("strength"), fallback_strength),
                "weakness": normalize_feedback(inner_feedback.get("weakness"), fallback_weakness),
                "improvement": normalize_feedback(inner_feedback.get("improvement"), fallback_improvement)
            }
        else:
            result["content_feedback"] = {
                "strength": fallback_strength, "weakness": fallback_weakness, "improvement": fallback_improvement
            }

        # 💡 페르소나 질문 싱크 및 타입 오염 필터 (중복 제거)
        requested_personas = list(dict.fromkeys(selected_personas)) if selected_personas else ["basic"]
        
        raw_questions = result.get("persona_questions", [])
        if not isinstance(raw_questions, list):
            raw_questions = []

        filtered_questions = []
        for p in requested_personas:
            matched = next((q for q in raw_questions if isinstance(q, dict) and q.get("persona_type") == p), None)
            if matched:
                filtered_questions.append(matched)
            else:
                filtered_questions.append({
                    "persona_type": p,
                    "question": "해당 성향의 심사위원이 생성한 추가 질문이 없습니다."
                })

        if len(filtered_questions) == 0:
            filtered_questions.append({
                "persona_type": "basic",
                "question": "발표 전반적인 준비 과정과 기획 의도에 대해 간략히 추가 설명해 주시겠습니까?"
            })

        result["persona_questions"] = filtered_questions
        return result

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI 응답 파싱 실패: JSON 형식 오류")
    except RateLimitError:
        raise HTTPException(status_code=429, detail="API 요청 한도 초과. 잠시 후 재시도하세요.")
    except APIStatusError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI API 오류: {e.message}")
    except APIConnectionError:
        raise HTTPException(status_code=503, detail="OpenAI 서버 연결 실패. 네트워크를 확인하세요.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"알 수 없는 서버 내부 오류: {str(e)}")