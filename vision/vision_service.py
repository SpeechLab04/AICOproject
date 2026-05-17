import time
from head_pose_analysis import analyze_head_pose
from emotion_analysis import analyze_emotion
from gaze_analysis import analyze_gaze
from gesture_analysis import analyze_gesture


def calculate_delivery_score(head_score, emotion_score, gaze_score, gesture_score=None):
    if gesture_score is None:
        HEAD_WEIGHT = 0.45
        EMOTION_WEIGHT = 0.30
        GAZE_WEIGHT = 0.25

        score = (
            head_score * HEAD_WEIGHT
            + emotion_score * EMOTION_WEIGHT
            + gaze_score * GAZE_WEIGHT
        )
    else:
        HEAD_WEIGHT = 0.40
        EMOTION_WEIGHT = 0.25
        GAZE_WEIGHT = 0.20
        GESTURE_WEIGHT = 0.15

        score = (
            head_score * HEAD_WEIGHT
            + emotion_score * EMOTION_WEIGHT
            + gaze_score * GAZE_WEIGHT
            + gesture_score * GESTURE_WEIGHT
        )

    return round(score)


def get_delivery_feedback(delivery_score):
    if delivery_score >= 85:
        return "고개 방향, 표정, 시선, 손동작이 전반적으로 안정적인 발표 태도입니다."
    elif delivery_score >= 70:
        return "전반적으로 무난한 발표 태도이지만, 일부 요소를 조금 더 보완하면 좋습니다."
    elif delivery_score >= 50:
        return "발표 태도는 무난하지만 시선, 표정, 손동작 관리에서 개선 여지가 있습니다."
    else:
        return "고개 방향, 표정, 시선, 손동작 전반에서 개선이 필요합니다."


def analyze_vision(video_path, situation="academic"):
    start = time.time()

    print("=== 고개 방향 분석 시작 ===")
    head_result = analyze_head_pose(video_path, show_video=False)

    print("=== 표정 분석 시작 ===")
    emotion_result = analyze_emotion(
        video_path,
        show_video=False,
        rotate_mode="none",
        smoothing_window=5,
    )

    print("=== 시선 방향 분석 시작 ===")
    gaze_result = analyze_gaze(
        video_path,
        show_video=False,
        rotate_mode="none",
        smoothing_window=5,
    )

    print("=== 손동작 분석 시작 ===")
    gesture_result = analyze_gesture(
        video_path,
        show_video=False,
        rotate_mode="ccw",
        smoothing_window=7,
        situation=situation,
    )

    # 분석 함수가 None을 반환해도 서버가 터지지 않도록 기본값 처리
    if head_result is None:
        head_result = {
            "head_score": 50,
            "head_feedback": "얼굴이 검출되지 않아 고개 방향 분석을 수행하지 못했습니다.",
            "direction_ratios": {},
        }

    if emotion_result is None:
        emotion_result = {
            "emotion_score": 50,
            "emotion_feedback": "얼굴이 검출되지 않아 표정 분석을 수행하지 못했습니다.",
        }

    if gaze_result is None:
        gaze_result = {
            "gaze_score": 50,
            "gaze_feedback": "얼굴이 검출되지 않아 시선 분석을 수행하지 못했습니다.",
        }

    if gesture_result is None:
        gesture_result = {
            "gesture_detected": False,
            "gesture_score": None,
            "gesture_feedback": "손동작이 감지되지 않았습니다.",
        }

    head_score = head_result.get("head_score", 50)
    emotion_score = emotion_result.get("emotion_score", 50)
    gaze_score = gaze_result.get("gaze_score", 50)

    gesture_detected = gesture_result.get("gesture_detected", False)
    gesture_score = (
        gesture_result.get("gesture_score", None)
        if gesture_detected
        else None
    )

    print(f"[디버깅] head_score    = {head_score}")
    print(f"[디버깅] emotion_score = {emotion_score}")
    print(f"[디버깅] gaze_score    = {gaze_score}")
    print(f"[디버깅] gesture_score = {gesture_score} (감지: {gesture_detected})")

    delivery_score = calculate_delivery_score(
        head_score,
        emotion_score,
        gaze_score,
        gesture_score,
    )
    delivery_feedback = get_delivery_feedback(delivery_score)

    elapsed = round(time.time() - start, 2)

    return {
        "head_pose": head_result,
        "emotion": emotion_result,
        "gaze": gaze_result,
        "gesture": gesture_result,
        "delivery_score": delivery_score,
        "delivery_feedback": delivery_feedback,
        "analysis_time": elapsed,
    }


if __name__ == "__main__":
    import sys

    video_path = sys.argv[1] if len(sys.argv) > 1 else "video/test_video.mp4"
    situation = sys.argv[2] if len(sys.argv) > 2 else "academic"

    result = analyze_vision(video_path, situation=situation)

    print("\n=== 최종 Vision 결과 ===")
    print(f"고개 점수:     {result['head_pose'].get('head_score', 50)}")
    print(f"고개 피드백:   {result['head_pose'].get('head_feedback', '')}")
    print()
    print(f"표정 점수:     {result['emotion'].get('emotion_score', 50)}")
    print(f"표정 피드백:   {result['emotion'].get('emotion_feedback', '')}")
    print()
    print(f"시선 점수:     {result['gaze'].get('gaze_score', 50)}")
    print(f"시선 피드백:   {result['gaze'].get('gaze_feedback', '')}")
    print()
    print(f"손동작 점수:   {result['gesture'].get('gesture_score', None)}")
    print(f"손동작 피드백: {result['gesture'].get('gesture_feedback', '')}")
    print()
    print(f"최종 태도 점수:   {result['delivery_score']}")
    print(f"최종 태도 피드백: {result['delivery_feedback']}")