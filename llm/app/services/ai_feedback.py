import json
import re
from typing import List
from openai import AsyncOpenAI, RateLimitError, APIStatusError, APIConnectionError
from fastapi import HTTPException
from llm.app.core.config import OPENAI_API_KEY, OPENAI_MODEL

# ==========================================
# 1. 👥 학교 상황별 교수님 심사위원 4인 상세 정의
# ==========================================
PERSONA_DETAILS = {
    "mentor": """[멘토형 — 학술적 지도와 성장을 유도하는 다정한 지도교수님]
- 성격 및 심사 태도: 학생들의 노력을 존중하며 리액션이 좋지만, 학술적/기술적 완성도에는 타협이 없는 따뜻한 전문가입니다. 단순히 깎아내리려는 목적이 아니라 맹점을 스스로 깨닫고 보완(Scale-up)할 수 있는 이정표를 제시합니다.
- 질문 설계 가이드: 제출된 스크립트 안에서 가장 핵심이 되는 전공 용어, 아키텍처, 혹은 분석 방법론 키워드를 최소 1개 이상 직접 인용하여 질문하세요. 예: "방금 발표에서 ~알고리즘을 사용하셨다고 언급했는데..." 형태를 취합니다. 부드럽고 격려하는 뉘앙스의 정중한 존댓말을 유지하세요.
- 질문 의도(Intent) 생성 규칙: 스크립트가 가진 근본적인 한계나 차별점을 짚어주며, '이 부분을 어떻게 보완하면 논문이나 실제 서비스 레벨로 확장할 수 있는지'에 대한 발전적 가능성과 방법론적 타당성을 검증하려는 교육적 동기임을 명시하세요.""",

    "press": """[압박형 — 송곳 같은 통찰로 허점을 파고드는 심사위원장 스타일 교수님]
- 성격 및 심사 태도: 날카롭고 권위적이며 엄격합니다. 발표에 흐르는 느슨한 분위기나 "좋은 게 좋은 거다"식의 발표를 용납하지 않으며, 데이터의 공백이나 논리적 비약, 예외 처리 미비점을 본능적으로 찾아내 압박합니다.
- 질문 설계 가이드: 스크립트 내에서 가장 근거가 빈약한 주장, 데이터 통계의 신뢰성, 혹은 현실성이 부족한 파트를 집요하게 타격하세요. 타당한 반대 사례(Counter-example)를 기습적으로 제시하거나 비판적인 어조로 허점을 찔러야 합니다. 단, 인신공격이나 무례한 표현은 금지하며 철저히 학술적/기술적 팩트로만 압박하는 차가운 존댓말을 구사하세요.
- 질문 의도(Intent) 생성 규칙: 가장 취약한 논리 구조를 정면으로 찔렀을 때, 발표자가 당황하거나 감정에 치우치지 않고 지정 주제의 도메인 지식과 객관적 근거를 활용해 유연하게 수습·방어하는 '위기 대처 능력 및 논리적 무결성'을 한계치까지 검증하려는 평가 목적임을 명시하세요.""",

    "troll": """[트롤형 — 내용의 본질을 비껴간 채 지엽적인 기능이나 오해로 트집 잡는 교수님]
- 성격 및 심사 태도: 발표 스크립트의 내용을 듣기는 했으나, 프로젝트의 핵심 가치나 메인 알고리즘에는 관심이 없습니다. 대신 발표자가 예시로 잠깐 언급한 부가 기능, 사소한 수치, 혹은 본인이 잘못 이해한 맥락 하나에 꽂혀서 "이게 왜 필요한지 모르겠다"며 장벽을 치는 까다로운 성향의 고인물 심사위원입니다.
- 질문 설계 가이드: 스크립트 내용 중에서 발표자가 '서브 기능'이나 '부가적인 설명'으로 가볍게 언급하고 넘어간 마이너한 부분을 찾아내세요. 그리고 그것이 마치 프로젝트 전체의 치명적인 문제인 것처럼 오해하거나 왜곡하여, "주객이 전도된 것 아닌가?", "이 기능은 왜 넣었나?" 등의 방식으로 뜬금없는 태클 질문을 던지세요. 말투는 다소 무성의하고 시큰둥하지만, 정중한 존댓말 어조는 유지해야 합니다.
- 질문 의도(Intent) 생성 규칙: 청중이 발표의 메인 맥락을 오해했거나 프로젝트의 비본질적인(지엽적인) 내용에 꽂혀 부정적인 피드백을 던질 때, 감정적으로 흔들리지 않고 정중하게 오해를 바로잡으며 다시 제출된 발표 주제의 본질로 청중의 시선을 부드럽게 끌고 오는 '맥락 리드 역량 및 유연한 방어 소통력'을 검증하려는 의도임을 명시하세요.""",

    "basic": """[기본형 — 평화로운 발표장을 지향하는 원론적이고 온화한 학과장 교수님]
- 성격 및 심사 태도: 학생들의 긴장을 풀어주기 위해 항상 인자한 미소를 지으며 발표 내용 전반을 칭찬해 줍니다. 굳이 어려운 전공 심층 지식을 꺼내 압박하기보다, 누구나 공감할 수 있는 보편적이고 표준적인 질문을 던져 발표자에게 추가적인 어필 기회를 제공합니다.
- 질문 설계 가이드: 프로젝트의 '최종 기대 효과', '이 서비스를 실제로 이용할 타겟 청중 설정의 이유', 혹은 '이번 학기가 끝난 뒤 조원들과 구상 중인 추후 발전/우회 방향' 등 발표의 뼈대가 되는 원론적인 질문을 던지세요. 따뜻하고 부드러운 말투로 발표자가 준비한 답변을 편안하게 쏟아낼 수 있도록 멍석을 깔아주는 질문 형태여야 합니다.
- 질문 의도(Intent) 생성 규칙: 복잡한 기술이나 수식을 떠나 이 프로젝트가 가진 본질적인 기획 의도와 '사회적/사업적/학술적 가치', 그리고 프로젝트의 '거시적인 기대 효과 및 지속 발전 가능성'을 종합적으로 확인하고 학생에게 답변 기회를 주려는 원론적 동기임을 명시하세요."""
}


def classify_script(script: str) -> str:
    text = script.strip()
    cleaned = text.replace(" ", "")
    if not cleaned or len(cleaned) < 5: return "silent"
    if len(cleaned) < 25: return "weak_presentation"
    return "presentation"


def safe_float(value, default=0.0) -> float:
    try:
        if isinstance(value, str):
            match = re.search(r"-?\d+(\.\d+)?", value)
            if match: return float(match.group(0))
        return float(value)
    except (TypeError, ValueError): return default


def normalize_feedback(arr: list, fallback: List[str]) -> List[str]:
    if not isinstance(arr, list): return fallback
    arr = [str(x).strip() for x in arr if str(x).strip()]
    if len(arr) >= 3: return arr[:3]
    while len(arr) < 3: arr.append(fallback[len(arr)])
    return arr


def get_silent_response(selected_personas: List[str]) -> dict:
    personas = selected_personas if selected_personas else ["mentor"]
    return {
        "summary": "발표 데이터가 존재하지 않습니다.",
        "content_critique": "발표 대본 분량 미달로 인해 종합 루브릭 비평을 진행할 수 없습니다.",
        "persona_questions": [{"persona_type": p, "question": "아무런 발표도 진행되지 않아 질문을 드릴 수가 없습니다.", "intent": "시스템 가드입니다."} for p in personas],
        "content_feedback": {
            "strength": ["음성 신호 확인 불가", "데이터 공백", "분석 대상 없음"],
            "weakness": ["절대적 길이 부족", "구조적 전개 결여", "정보량 전무"],
            "improvement": ["마이크 상태 재점검", "정상적인 대본 입력", "녹음 환경 재확인"]
        },
        "structure_score": 0.0, "evidence_score": 0.0, "expression_score": 0.0, "content_score": 0.0, "final_score": 0.0
    }

def get_weak_presentation_response(selected_personas: List[str]) -> dict:
    personas = selected_personas if selected_personas else ["mentor"]
    return {
        "summary": "발표의 도입부 및 서두 연결 시도가 확인되었습니다.",
        "content_critique": "발표의 전체적인 분량이 너무 짧아 구체적인 루브릭 비평이 불가능하며, 도입부 이후의 전개 구조가 결여되어 있습니다.",
        "persona_questions": [{"persona_type": p, "question": "발표 형식을 갖추지 않아 질문이 불가능합니다. 본문을 채워주세요.", "intent": "본론 구성을 촉구하기 위함입니다."} for p in personas],
        "content_feedback": {
            "strength": ["발표 표현 시도 감지", "스피치 서두 연결 시도", "텍스트화 완료"],
            "weakness": ["정보량 지나치게 짧음", "구체적 근거 생략", "거시 논리 구조 결여"],
            "improvement": ["핵심 본문 3문장 이상 추가", "주요 특징 및 구현내용 서술", "정보를 풍부하게 서술 후 재도전"]
        },
        "structure_score": 35.0, "evidence_score": 15.0, "expression_score": 25.0, "content_score": 25.0, "final_score": 25.0 
    }


# ==========================================
# 5. 🔩 시스템 프롬프트 생성기 (필드 역할 엄격 분리)
# ==========================================
def generate_system_prompt(selected_personas: List[str], topic: str) -> str:
    valid_personas = [p for p in selected_personas if p in PERSONA_DETAILS]
    if not valid_personas: valid_personas = ["mentor"]

    persona_section = "\n".join(PERSONA_DETAILS[p] for p in valid_personas)
    display_topic = topic.strip() if topic else "대학 자유 주제 발표"

    return f"""
# Role
너는 대학 발표를 채점하고 날카로운 심사평과 예상 질문을 던지는 '교수님 심사위원단'이다.

# 📌 [가장 중요] 이번 발표의 고정 주제 및 채점 제한 룰
1. 이번 조/학생이 발표하는 구체적인 주제는 **[{display_topic}]** 이다. 이 주제의 도메인 지식에 통달한 심사위원으로서 평가하라.
2. **[경고 - 필드 역할 분리 고정]**:
   - `summary` 필드: 유저의 스크립트를 분석하여 어떤 흐름으로 무엇을 설명했는지 **객관적인 내용 요약**만 한국어 2~3문장으로 작성하라. 절대 점수 평가나 비판, 아쉬운 점 등을 이 필드에 적지 마라.
   - `content_critique` 필드: 발표 내용의 아쉬운 점, 구조적 한계, 데이터 부족, 전달 방식의 미흡함 등 **날카로운 총평 및 지적 사항**을 여기에 따로 완전히 분리하여 작성하라.

[현재 심사위원단 구성 (선택된 교수님 성향)]
{persona_section}

# 📊 최우선 채점 및 질문 가이드라인
1. [주제 매칭 채점]: 유저의 발표가 제시된 주제 **[{display_topic}]**의 핵심을 잘 관통하고 있는지 채점하라. 
2. [역할 몰입]: 선택된 각각의 교수님 페르소나의 '성격', '질문 방식', '지시사항'에 100% 빙의하여 날카로운 예상 질문(`question`)을 생성하라.
3. [🎯 교수님 관점의 질문 의도(`intent`) 정밀 생성]: 해당 교수님이 지정 주제 **[{display_topic}]** 사이의 어떤 논리적 구멍을 검증하고 싶어서 이 질문을 던졌는지 '교수로서의 구체적인 출제 동기와 의도'를 작성하라.

# Evaluation Rubric (100점 만점 기준 정밀 채점)
1. structure_score (가중치 40%): 오프닝 및 도입->전개->결론 흐름의 명확성
2. evidence_score (가중치 40%): 지정 주제인 **[{display_topic}]**에 걸맞은 데이터/학술적/기술적 근거의 풍부함과 설득력
3. expression_score (가중치 20%): 해당 학과 및 지정 주제에 적합한 전공/전문 어휘 구사력 및 내용 전달의 유연성 (★실시간 질의응답력은 채점 제외)

# Instructions
- 모든 응답은 한국어로 작성한다.
- content_feedback: strength, weakness, improvement 조항을 핵심만 '정확히 딱 3가지씩' 리스트 출력하라.
"""


# ==========================================
# 6. JSON 스키마 (`content_critique` 필드 확보)
# ==========================================
JSON_SCHEMA = {
    "name": "presentation_feedback_schema",
    "strict": False,
    "schema": {
        "type": "object",
        "properties": {
            "summary": {"type": "string"},
            "content_critique": {"type": "string"},  # 👈 새롭게 추가된 비평 전용 필드
            "persona_questions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "persona_type": {"type": "string", "enum": ["mentor", "press", "troll", "basic"]},
                        "question": {"type": "string"},
                        "intent": {"type": "string"}
                    },
                    "required": ["persona_type", "question", "intent"]
                }
            },
            "content_feedback": {
                "type": "object",
                "properties": {
                    "strength":     {"type": "array", "items": {"type": "string"}},
                    "weakness":     {"type": "array", "items": {"type": "string"}},
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
            "summary", "content_critique", "persona_questions", "content_feedback",
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
    selected_personas: List[str],
    topic: str = "대학 자유 주제 발표",
    material: str = "",
    presentation_script: str = ""
) -> dict:

    if not OPENAI_API_KEY: raise ValueError("API KEY가 로드되지 않았습니다. .env 파일을 확인하세요.")

    persona_map = {
        "mentor": "mentor", "멘토": "mentor", "멘토형": "mentor", "교수님": "mentor",
        "press": "press", "압박": "press", "압박형": "press", "까다로운": "press",
        "troll": "troll", "트롤": "troll", "troll형": "troll", "무성의": "troll",
        "basic": "basic", "기본": "basic", "기본형": "basic", "원론적인": "basic"
    }
    
    if selected_personas:
        standardized_personas = []
        for p in selected_personas:
            p_clean = str(p).strip()
            if p_clean in persona_map: standardized_personas.append(persona_map[p_clean])
        selected_personas = list(dict.fromkeys(standardized_personas))
    
    if not selected_personas: selected_personas = ["mentor"]
        
    clean_script = script.strip() if script else ""
    classification = classify_script(clean_script)

    if classification == "silent": return get_silent_response(selected_personas)
    if classification == "weak_presentation": return get_weak_presentation_response(selected_personas)

    clean_script = clean_script.replace("\n", " ").replace("\r", " ").replace("\t", " ")
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    try:
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": generate_system_prompt(selected_personas, topic)},
                {"role": "user", "content": (
                    f"지정된 발표 주제인 [{topic}] 기준에 맞춰 다음 발표 스크립트를 루브릭 기반으로 철저히 분석해 주세요.\n\n"
                    + (f"[발표 기준 자료]\n{material.strip()}\n\n" if material and material.strip() else "")
                    + (f"[사전 작성 대본]\n{presentation_script.strip()}\n\n" if presentation_script and presentation_script.strip() else "")
                    + f"[실제 발표 스크립트]\n{clean_script}"
                )}
            ],
            response_format={"type": "json_schema", "json_schema": JSON_SCHEMA},
            temperature=0.0,
            max_tokens=1000
        )

        content = response.choices[0].message.content
        if not content: raise HTTPException(status_code=500, detail="AI 응답 생성 실패")

        result = json.loads(content)

        struct_s = safe_float(result.get("structure_score", 0.0))
        evid_s = safe_float(result.get("evidence_score", 0.0))
        expr_s = safe_float(result.get("expression_score", 0.0))

        struct_s = max(0.0, min(struct_s, 100.0))
        evid_s = max(0.0, min(evid_s, 100.0))
        expr_s = max(0.0, min(expr_s, 100.0))

        calc_content_score = (struct_s * 0.4) + (evid_s * 0.4) + (expr_s * 0.2)

        result["structure_score"] = float(struct_s)
        result["evidence_score"] = float(evid_s)
        result["expression_score"] = float(expr_s)
        result["content_score"] = float(calc_content_score)
        result["delivery_score"] = 0.0
        result["final_score"] = float(calc_content_score)

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

        requested_personas = list(dict.fromkeys(selected_personas)) if selected_personas else ["mentor"]
        raw_questions = result.get("persona_questions", [])
        if not isinstance(raw_questions, list): raw_questions = []

        fallback_intents = {
            "mentor": f"지정 주제인 [{topic}]의 핵심 이론 및 방법론 중 미흡한 조각을 채우고 학술적 성장을 견인하려는 교육적 의도입니다.",
            "press": f"지정 주제인 [{topic}]에 대한 근거 데이터 레이어의 허점을 압박하여 위기 방어력 및 전공 전문성을 정밀 검증하려는 평가 의도입니다.",
            "troll": "청중이 발표 흐름을 놓쳤거나 지엽적인 트집을 잡을 때, 당황하지 않고 핵심 논리를 재설명하여 납득시키는 설득 역량을 확인하려는 의도입니다.",
            "basic": f"지정 주제인 [{topic}]을 기획하게 된 근본적인 배경 및 향후 발전 가능성을 확인하려는 원론적 의도입니다."
        }

        filtered_questions = []
        for p in requested_personas:
            matched = next((q for q in raw_questions if isinstance(q, dict) and q.get("persona_type") == p), None)
            if matched:
                if "intent" not in matched or not matched["intent"] or len(matched["intent"]) < 5:
                    matched["intent"] = fallback_intents.get(p, "지정 주제의 심층 검증을 위한 질의 의도입니다.")
                filtered_questions.append(matched)
            else:
                filtered_questions.append({
                    "persona_type": p,
                    "question": "발표 구성 요소가 부족하여 교수님의 추가 예상 질문이 생성되지 않았습니다.",
                    "intent": fallback_intents.get(p)
                })

        result["persona_questions"] = filtered_questions
        return result

    except json.JSONDecodeError: raise HTTPException(status_code=500, detail="AI 응답 파싱 실패")
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))