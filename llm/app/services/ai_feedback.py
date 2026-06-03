import json
import re
from typing import List
from openai import AsyncOpenAI, RateLimitError, APIStatusError, APIConnectionError
from fastapi import HTTPException
from llm.app.core.config import OPENAI_API_KEY, OPENAI_MODEL


# ==========================================
# 1. 👥 전문 심사위원(청중) 10인 상세 정의 및 의도 가이드
# ==========================================
PERSONA_DETAILS = {
    # ── 표준 직무/전문군 7인 ──────────────────────────────────
    "hr_manager": """[인사담당자 — 태도, 소통력, 조직 적합성 검증]
- 역할 및 최고 강점: 지원자의 협업 능력, 전달력, 조직 융화 및 비즈니스 매너 평가의 최고 전문가.
- 질문 스타일: 갈등 해결 경험, 협업 과정에서의 본인의 역할, 발표 태도 및 소통 방식에 대해 질문.
- 의도 가이드: 이 질문을 통해 발표자의 '소통 및 협업 역량'을 확인하고자 함을 명시하세요.""",

    "tech_developer": """[현직 개발자 — 기술적 타당성 및 구현 가능성 검증]
- 역할 및 최고 강점: 아키텍처, 사용 기술의 타당성, 코드 무결성 및 성능 최적화 평가의 최고 전문가.
- 질문 스타일: 선택한 기술 스택의 이유, 데이터 흐름, 예외 처리 및 확장성 문제를 송곳처럼 날카롭게 질문.
- 의도 가이드: 이 질문을 통해 발표 내용의 '기술적 구체성과 아키텍처 타당성'을 확인하고자 함을 명시하세요.""",

    "executive": """[임원진 — 비즈니스 가치 및 거시적 방향성 검증]
- 역할 및 최고 강점: 프로젝트의 궁극적인 기대 효과, ROI(투자 대비 효율), 시장 경쟁력 평가의 최고 전문가.
- 질문 스타일: "그래서 이 서비스가 기존 시장과 다른 점이 무엇인가?", "수익 모델이나 확장 계획은 무엇인가?" 등 거시적 질문.
- 의도 가이드: 이 질문을 통해 프로젝트의 '사업적 가치 및 거시적 비전'을 확인하고자 함을 명시하세요.""",

    "academic_professor": """[연구 중심 교수 — 이론적 배경 및 논리적 완결성 검증]
- 역할 및 최고 강점: 연구 방법론, 데이터의 신뢰성, 선행 연구 분석 및 학술적 가치 평가의 최고 전문가.
- 질문 스타일: 주장에 대한 학술적/통계적 근거, 개념의 명확한 정의, 도출된 결론의 논리적 모순을 지적하는 질문.
- 의도 가이드: 이 질문을 통해 발표의 '학술적/논리적 완결성과 근거의 신뢰성'을 확인하고자 함을 명시하세요.""",

    "vc_investor": """[창업 투자자(VC) — 시장성 및 문제 해결력 검증]
- 역할 및 최고 강점: 타겟 고객의 페인 포인트(Pain Point) 명확성, 시장 규모, 성장 가능성 평가의 최고 전문가.
- 질문 스타일: "이 문제를 겪는 진짜 고객을 만나봤나?", "진입 장벽을 어떻게 구축할 것인가?" 등 날카로운 시장 중심 질문.
- 의도 가이드: 이 질문을 통해 아이디어의 '실제 시장성 및 현실적 문제 해결력'을 확인하고자 함을 명시하세요.""",

    "product_marketer": """[프로덕트 마케터 — 청중 타겟팅 및 유저 획득 전략 검증]
- 역할 및 최고 강점: 사용자 경험(UX), 대중을 설득하는 스토리텔링, 초기 유저 확보(GTM) 전략 평가의 최고 전문가.
- 질문 스타일: 발표의 스토리라인 구성, 핵심 가치 제안(UVP)의 명확성, 초기 사용자 유치 방안에 대해 질문.
- 의도 가이드: 이 질문을 통해 발표의 '스토리텔링 흡입력 및 유저 중심 사고'를 확인하고자 함을 명시하세요.""",

    "peer_evaluator": """[동료 평가자 — 협업 시너지 및 프로젝트 기여도 검증]
- 역할 및 최고 강점: 팀원 관점에서의 실질적인 업무 분담, 직관적인 UI/UX 편의성 평가의 최고 전문가.
- 질문 스타일: 사용자가 느낄 첫인상, 팀 프로젝트 시 발생한 파트별 병목 현상 극복 과정 등 실무 밀착형 질문.
- 의도 가이드: 이 질문을 통해 실무 레벨에서의 '사용자 편의성 및 동료 간 협업 시너지'를 확인하고자 함을 명시하세요.""",

    # ── ⚡ 고난도 매운맛 / 빌런형 3인 ──────────────────────────
    "sharp_critic": """[송곳형 평가위원 — 논리적 허점을 무섭게 파고드는 공격적 압박러]
- 역할 및 최고 강점: 발표 내용 중 가장 취약하거나 준비가 덜 된 약점을 본능적으로 찾아내 뼈를 때리는 공격 전문가.
- 질문 스타일: 공격적이고 회의적인 어조로 핵심을 타격. "이 부분은 완전히 비현실적인데 대책이 있긴 한가요?", "근거가 빈약한데 본인만의 착각 아닌가요?" 등 정곡을 찌름.
- 의도 가이드: 이 질문을 통해 유화적인 분위기를 깨뜨려 발표자의 평정심을 흔들고, 최악의 압박 면접/질의 상황에서 '논리적 수습 능력 및 위기 방어 역량'을 검증하고자 함을 명시하세요.""",

    "distracted_troll": """[무심한 척 허점을 찌르는 고난도 위원 — 앞선 내용 재질문 및 어려운 전문 용어로 압박]
- 역할 및 최고 강점: 발표에 큰 흥미가 없는 듯 시큰둥한 태도를 유지하지만, 발표자가 무심코 넘긴 허점이나 고난도 개념을 툭 던져 당황시키는 심사위원.
- 질문 스타일: 영혼 없는 어조로 질문. "아까 서두에서 핵심 알고리즘이나 원리를 다루신 것 같은데, 정확히 어떤 메커니즘인지 기억이 안 나니 다시 한번 설명해 보라"고 하거나, 발표 주제와 연관된 "학술적/기술적인 고난도 전문 용어나 상위 개념"을 언급하며 이에 대한 본인의 견해나 반영 여부를 기습적으로 질문.
- 의도 가이드: 이 질문을 통해 발표자가 앞에서 이미 설명한 본인의 핵심 논리를 청중에게 다시 한번 명확하고 쉽게 각인시킬 수 있는지(재설명 역량), 그리고 예상치 못한 어려운 전문 용어 앞에서도 당황하지 않고 아는 선에서 유연하게 대처하는지 검증하고자 함을 명시하세요.""",

    "conservative_elder": """[보수적인 꼰대 심사위원 — 변화를 거부하고 기존 방식만 고집하는 청중]
- 역할 및 최고 강점: 새로운 기술이나 트렌드에 극도로 회의적이며 "라떼는 수작업으로 다 했다"는 마인드의 장벽.
- 질문 스타일: 팔짱을 끼고 혀를 차는 듯한 뉘앙스. "굳이 AI나 복잡한 시스템 안 쓰고 엑셀이나 사람이 직접 해도 될 것 같은데 돈 아깝게 왜 만들었죠?"라며 가치를 폄하함.
- 의도 가이드: 보수적인 투자자나 조직의 상사를 설득해야 하는 비즈니스 현실을 반영한 것으로, 서비스의 '필연적인 도입 당위성과 혁신성'을 감정이 아닌 객관적 데이터로 입증할 수 있는지 검증하고자 함을 명시하세요."""
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

    # 2단계: Whisper STT 특성을 감안한 텍스트 절대 길이 검증 (Weak Presentation)
    if len(cleaned) < 25:
        return "weak_presentation"

    return "presentation"


# ==========================================
# 3. 🔩 실무형 타입 및 배열 정형화 가드 함수
# ==========================================
def safe_float(value, default=0.0) -> float:
    """🎯 소수점 뇌절 및 타 자료형 오염을 철저하게 분리 수금하는 정규식 서치 가드"""
    try:
        if isinstance(value, str):
            match = re.search(r"-?\d+(\.\d+)?", value)
            if match:
                return float(match.group(0))
        return float(value)
    except (TypeError, ValueError):
        return default


def normalize_feedback(arr: list, fallback: List[str]) -> List[str]:
    """GPT가 피드백 개수를 초과하거나 미달하게 뇌절칠 때 정확히 3개 배열로 컷/패딩하여 프론트 UI 깨짐을 막는 가드"""
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
    personas = selected_personas if selected_personas else ["hr_manager"]
    return {
        "summary": "발표 스크립트가 존재하지 않거나 발표로 인정할 수 있는 유의미한 음성이 감지되지 않았습니다.",
        "persona_questions": [
            {
                "persona_type": p, 
                "question": "아무런 발표도 진행되지 않아 질문을 드릴 수가 없습니다.",
                "intent": "음성 입력 여부 및 최소 정보량 도달을 확인하기 위한 시스템 가드입니다."
            } for p in personas
        ],
        "content_feedback": {
            "strength": ["음성 신호 확인이 불가능합니다.", "텍스트 데이터 분량이 존재하지 않습니다.", "분석을 진행할 기본 대상이 없습니다."],
            "weakness": ["발표 대본의 절대적인 텍스트 길이가 부족합니다.", "도입-전개-결론의 구조적 전개가 일어나지 않았습니다.", "프로젝트에 대한 설명 정보량이 전무합니다."],
            "improvement": ["마이크 녹음 상태 및 오디오 환경을 재점검해 보세요.", "연습하고자 하는 발표의 스크립트 내용을 정상적으로 입력해 주세요.", "의도적인 무음 상태가 지속되었는지 확인이 필요합니다."]
        },
        "structure_score": 0.0, "evidence_score": 0.0, "expression_score": 0.0,
        "content_score": 0.0, "final_score": 0.0 # ❌ delivery_score 지움
    }

def get_weak_presentation_response(selected_personas: List[str]) -> dict:
    personas = selected_personas if selected_personas else ["hr_manager"]
    return {
        "summary": "발표의 오프닝이나 의도는 감지되었으나, 본문 설명의 분량이 너무 짧아 구체적인 루브릭 비평이 불가능합니다.",
        "persona_questions": [
            {
                "persona_type": p, 
                "question": "발표 형식을 갖추지 않아 질문이 불가능합니다. 본문 내용을 채워 다시 발표해주세요.",
                "intent": "발표의 최소 분량(25자 이상) 확보를 유도하고 본론 구성을 촉구하기 위함입니다."
            } for p in personas
        ],
        "content_feedback": {
            "strength": ["기본적인 발표 의도 표현 형식을 시도하려는 의지가 확인되었습니다.", "스피치를 시작하려는 서두 연결 시도가 감지되었습니다.", "최소한의 음성 입력 텍스트화가 완료되었습니다."],
            "weakness": ["발표 본문의 정보량이 지나치게 짧아 내용 비평이 불가능합니다.", "주제를 설명할 구체적인 기능이나 근거가 생략되어 있습니다.", "전개 및 결론으로 이어지는 거시 논리 구조가 결여되었습니다."],
            "improvement": ["준비하신 과제나 서비스의 핵심 본문을 최소 3문장 이상 추가해 보세요.", "서론만 말하고 끝나지 않도록 주요 특징 및 구현 내용을 기술해 주세요.", "전달하고자 하는 핵심 정보를 풍부하게 서술한 뒤 재도전해 보세요."]
        },
        "structure_score": 35.0, "evidence_score": 15.0, "expression_score": 25.0,
        "content_score": 25.0, "final_score": 25.0 
    }


# ==========================================
# 5.  [속도 최적화] 시스템 프롬프트 생성
# ==========================================
def generate_system_prompt(selected_personas: List[str]) -> str:
    valid_personas = [p for p in selected_personas if p in PERSONA_DETAILS]
    if not valid_personas:
        valid_personas = ["hr_manager"]

    persona_section = "\n".join(PERSONA_DETAILS[p] for p in valid_personas)

    return f"""
# Role
너는 발표(팀플, 면접, 창업 피칭, 기술 스피치 등)를 채점하고 날카로운 질문을 던지는 '전문가 청중 심사위원단'이다.
단어 매칭 대신 전체 문맥과 직무/전문 영역별 핵심 정보 전달 흐름을 기준으로 채점하라.

[현재 심사위원단 구성 (선택된 청중)]
{persona_section}

# 📊 최우선 채점 및 질문 가이드라인
1. [역할 몰입]: 선택된 각각의 심사위원의 '역할 및 최고 강점'과 '질문 스타일'에 100% 빙의하여 질문을 생성하라.
2. [🎯 질문 의도(intent) 필수 포함]: 대시보드 표출용 필드이다. 질문을 던진 심사위원이 왜 이 질문을 했는지, 이 질문을 통해 발표자의 어떤 핵심 역량이나 논리적 구멍을 검증하고 싶었는지를 명확하고 정중한 어조의 한국어로 설명하라.
3. [구조 및 사담]:
   - 발표 도중 촬영/녹음 관련 혼잣말이나 청중 외 대화가 1회라도 감지되면 structure_score를 40점 이하로 제한하고 summary에 사담 감지 사실을 명시하라.
   - 100% 순수 잡담/장난이면 전 항목을 20점 미만으로 제한하라.
4. [설명 단위 및 완결성 평가]: 기능, 구조, 방법론, 계획 등 독립적 설명 단위가 많을수록 우수한 발표다. 
   **[치명적 감점]**: 문장이 유창하더라도 내용 알맹이가 없거나 서론(도입)만 말하다가 급격히 종료된 미완성 발표는 'evidence_score'를 절대 30점 이하로 하방 고정하라.

# Evaluation Rubric (100점 만점 기준 정밀 채점)
1. structure_score (가중치 40%): 오프닝(인사/소개) 및 도입->전개->결론 흐름의 명확성
2. evidence_score (가중치 40%): 청중 성격에 맞는 구체적 설명 단위의 설득력 및 데이터/논리 근거
3. expression_score (가중치 20%): 주제에 적합한 전문 어휘 구사력 및 질의응답력

# 🗮 점수 산출 공식
content_score = (structure_score * 0.4) + (evidence_score * 0.4) + (expression_score * 0.2)
delivery_score = 0.0
final_score = content_score

# Instructions
- 모든 응답은 한국어로 작성한다.
- content_feedback: strength, weakness, improvement 조항을 핵심만 '정확히 딱 3가지씩' 짧고 명확한 문장으로 리스트 출력하라.
- persona_questions: 선택된 심사위원(persona_type)별로 질문(question) 1개와 그 질문의 의도(intent) 1개를 1:1 세트로 정확히 매칭하여 생성하라.
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
                            "enum": [
                                "hr_manager", "tech_developer", "executive", "academic_professor", 
                                "vc_investor", "product_marketer", "peer_evaluator",
                                "sharp_critic", "distracted_troll", "conservative_elder"
                            ]
                        },
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

    # 🎯 [확장 패치]: 한글/영문 매핑을 총 10인 체제에 맞춰 완벽 정비
    persona_map = {
        # 기존 기본 7인
        "hr_manager": "hr_manager", "인사담당자": "hr_manager", "인사": "hr_manager", "hr": "hr_manager",
        "tech_developer": "tech_developer", "현직개발자": "tech_developer", "개발자": "tech_developer", "tech": "tech_developer",
        "executive": "executive", "임원진": "executive", "임원": "executive", "대표": "executive",
        "academic_professor": "academic_professor", "교수님": "academic_professor", "교수": "academic_professor", "연구원": "academic_professor",
        "vc_investor": "vc_investor", "투자자": "vc_investor", "창업투자자": "vc_investor", "vc": "vc_investor",
        "product_marketer": "product_marketer", "마케터": "product_marketer", "기획자": "product_marketer",
        "peer_evaluator": "peer_evaluator", "동료평가자": "peer_evaluator", "동료": "peer_evaluator", "팀원": "peer_evaluator",
        
        # 새롭게 정비된 까다로운/고난도 3인
        "sharp_critic": "sharp_critic", "송곳형": "sharp_critic", "공격형": "sharp_critic", "압박형": "sharp_critic", "공격": "sharp_critic",
        "distracted_troll": "distracted_troll", "트롤형": "distracted_troll", "고난도": "distracted_troll", "재질문": "distracted_troll", "전문용어": "distracted_troll", "무심한형": "distracted_troll",
        "conservative_elder": "conservative_elder", "보수적": "conservative_elder", "꼰대형": "conservative_elder", "고인물": "conservative_elder"
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
        selected_personas = ["hr_manager"]
        
    clean_script = script.strip() if script else ""
    classification = classify_script(clean_script)

    # ── 즉시 반환 레이어 (서버 내부 연산) ──────────────────
    if classification == "silent":
        return get_silent_response(selected_personas)

    if classification == "weak_presentation":
        return get_weak_presentation_response(selected_personas)

    # ── OpenAI 비동기 연산 레이어 ──────────────────────────
    clean_script = clean_script.replace("\n", " ").replace("\r", " ").replace("\t", " ")
    client = AsyncOpenAI(api_key=OPENAI_API_KEY)

    try:
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
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
            max_tokens=1000  # 💡 의도(intent) 문장이 추가되므로 버퍼를 위해 1000토큰 설정
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

        # 💡 페르소나 질문 및 의도(Intent) 싱크 가드 레이어
        requested_personas = list(dict.fromkeys(selected_personas)) if selected_personas else ["hr_manager"]
        
        raw_questions = result.get("persona_questions", [])
        if not isinstance(raw_questions, list):
            raw_questions = []

        filtered_questions = []
        for p in requested_personas:
            matched = next((q for q in raw_questions if isinstance(q, dict) and q.get("persona_type") == p), None)
            if matched:
                # intent 필드가 누락되었을 경우 기본값 바인딩 가드
                if "intent" not in matched or not matched["intent"]:
                    matched["intent"] = "해당 전문가 그룹의 핵심 역량 검증을 위한 종합 질의입니다."
                filtered_questions.append(matched)
            else:
                filtered_questions.append({
                    "persona_type": p,
                    "question": "해당 성향의 심사위원이 생성한 추가 질문이 없습니다.",
                    "intent": "발표 분량 부족 혹은 특정 영역의 논리 누락으로 인해 상세 검증 의도를 도출하지 못했습니다."
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