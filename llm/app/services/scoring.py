def clamp(score: float) -> float:
    return max(0, min(score, 100))

def calculate_delivery_score(wpm, filler_count, head_pose, eye_contact):
    score = 100.0
    if wpm is not None:
        if wpm < 120 or wpm > 170: score -= 10
    score -= min(filler_count * 2, 20)
    if head_pose is not None: score = score * 0.7 + head_pose * 0.3
    if eye_contact is not None: score = score * 0.7 + eye_contact * 0.3
    return round(clamp(score), 1)

def calculate_final_score(c_score, d_score):
    return round(clamp((c_score * 0.6) + (d_score * 0.4)), 1)