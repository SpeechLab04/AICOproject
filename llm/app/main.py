from fastapi import FastAPI, HTTPException
from app.models.schemas import FeedbackInput, FeedbackOutput, ContentFeedback
from app.services.ai_feedback import get_ai_presentation_feedback
from app.services.scoring import calculate_delivery_score, calculate_final_score

app = FastAPI(title="AICO AI Feedback API")

@app.post("/feedback", response_model=FeedbackOutput)
async def create_feedback(data: FeedbackInput):
    try:
        ai_res = await get_ai_presentation_feedback(data.script)
        
        d_score = calculate_delivery_score(data.wpm, data.filler_count, data.head_pose_score, data.eye_contact_score)
        c_score = float(ai_res.get("content_score", 0))
        f_score = calculate_final_score(c_score, d_score)

        return FeedbackOutput(
            summary=ai_res.get("summary", ""),
            expected_questions=ai_res.get("expected_questions", []),
            content_feedback=ContentFeedback(**ai_res.get("content_feedback", {})),
            content_score=c_score, delivery_score=d_score, final_score=f_score
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))