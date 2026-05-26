def clamp(score: float) -> float:
    return max(0, min(score, 100))

def calculate_final_score(c_score: float) -> float:
    # 💡 내용 점수가 0점(잡담/무음)이면 최종 점수도 당연히 0점
    if c_score == 0.0:
        return 0.0
    return round(clamp(c_score), 1)