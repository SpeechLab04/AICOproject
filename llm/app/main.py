from fastapi import FastAPI, HTTPException
from typing import List
from llm.app.models.schemas import FeedbackInput, FeedbackOutput, ContentFeedback
from llm.app.services.ai_feedback import get_ai_presentation_feedback
from llm.app.services.scoring import calculate_final_score

app = FastAPI(title="AICO AI Feedback API")

@app.post("/feedback", response_model=FeedbackOutput)
async def create_feedback(data: FeedbackInput):
    try:
        # 1. AI 분석 수행 (학교 맞춤형 4인 교수님 및 의도 생성 엔진 레이어 호출)
        ai_res = await get_ai_presentation_feedback(
            script=data.script, 
            selected_personas=data.selected_personas
        )
        
        # 2. 점수 가집계
        c_score = float(ai_res.get("content_score", 0.0))
        
        # 3. 비즈니스 룰에 따른 최종 스코어 연산 함수 매핑
        f_score = calculate_final_score(c_score)

        # 4. 수집된 컴포넌트 안전 맵핑 후 전송
        return FeedbackOutput(
            summary=ai_res.get("summary", ""),
            persona_questions=ai_res.get("persona_questions", []),
            content_feedback=ContentFeedback(**ai_res.get("content_feedback", {})),
            content_score=c_score,
            final_score=f_score
        )
        
    except Exception as e:
        print(f"Server Error: {e}")
        raise HTTPException(status_code=500, detail=f"내용 분석 중 오류 발생: {str(e)}")