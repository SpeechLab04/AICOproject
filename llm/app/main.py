from fastapi import FastAPI, HTTPException
from typing import List
from llm.app.models.schemas import FeedbackInput, FeedbackOutput, ContentFeedback
from llm.app.services.ai_feedback import get_ai_presentation_feedback
# scoring 모듈은 최종 점수 합산용으로만 사용하거나, 필요 없으면 임포트 해제 가능합니다.
from llm.app.services.scoring import calculate_final_score 

app = FastAPI(title="AICO AI Feedback API")

@app.post("/feedback", response_model=FeedbackOutput)
async def create_feedback(data: FeedbackInput):
    try:
        # 1. AI 분석 수행 (스크립트 분석 및 교수님 질문 생성)
        selected_personas = getattr(data, 'selected_personas', ["basic"])
        ai_res = await get_ai_presentation_feedback(
            script=data.script, 
            selected_personas=selected_personas
        )
        
        # 2. 점수 처리
        # 전달 점수(d_score)는 프론트나 다른 모듈에서 계산되어 넘어온 값을 그대로 사용하거나,
        # 여기서는 LLM의 결과인 '내용 점수'에만 집중합니다.
        c_score = float(ai_res.get("content_score", 0))
        
        # 만약 다른 팀원들이 준 delivery_score가 data에 포함되어 있다면 그걸 쓰고, 
        # 없다면 임시로 0점 혹은 받은 값을 그대로 사용합니다.
        d_score = getattr(data, 'delivery_score', 0) 
        
        # 최종 합산 점수 (내용 점수와 전달 점수의 가중치 합산)
        f_score = calculate_final_score(c_score, d_score)

        # 3. 최종 결과 반환
        return FeedbackOutput(
            summary=ai_res.get("summary", ""),
            # 교수님들의 질문 리스트 추출
            persona_questions=ai_res.get("persona_questions", []),
            # 강점, 약점, 개선점 상세 피드백
            content_feedback=ContentFeedback(**ai_res.get("content_feedback", {})),
            content_score=c_score,
            delivery_score=d_score, # 다른 파트에서 계산된 점수 반영
            final_score=f_score
        )
        
    except Exception as e:
        print(f"Server Error: {e}")
        raise HTTPException(status_code=500, detail=f"내용 분석 중 오류 발생: {str(e)}")