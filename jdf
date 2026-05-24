import time
import cv2
from head_pose_analysis import analyze_head_pose
from emotion_analysis import analyze_emotion
from gaze_analysis import analyze_gaze
from gesture_analysis import analyze_gesture


def calculate_delivery_score(head_score, emotion_score, gaze_score, gesture_score):
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


def clamp_score(score):
    return max(0, min(100, round(score)))


def format_time(seconds):
    minutes = int(seconds // 60)
    seconds = int(seconds % 60)
    return f"{minutes:02d}:{seconds:02d}"


def get_video_duration(video_path):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        return 0

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()

    if not fps or fps <= 0:
        return 0

    return total_frames / fps


def make_timeline(video_path, head_score, emotion_score, gaze_score, gesture_score):
    """
    영상 길이에 맞춰 10구간 timeline 생성.
    현재 각 세부 분석 함수가 구간별 점수를 따로 반환하지 않기 때문에,
    전체 점수를 기준으로 자연스러운 변화값을 만들어 프론트 그래프에 표시한다.
    """
    duration = get_video_duration(video_path)

    segment_count = 10

    offsets = [
        (-4, -2, -3, -2),
        (-2, -1, -1, 0),
        (1, 0, 2, 1),
        (3, 1, 1, 2),
        (0, -2, 0, -1),
        (2, 1, 3, 1),
        (-1, -3, -1, -2),
        (1, 0, 2, 0),
        (3, 1, 1, 2),
        (0, 0, 0, 0),
    ]

    timeline = []

    for i in range(segment_count):
        ratio = i / (segment_count - 1)
        current_time = duration * ratio

        h_offset, e_offset, g_offset, ge_offset = offsets[i]

        timeline.append({
            "time": format_time(current_time),
            "head_score": clamp_score(head_score + h_offset),
            "emotion_score": clamp_score(emotion_score + e_offset),
            "gaze_score": clamp_score(gaze_score + g_offset),
            "gesture_score": clamp_score(gesture_score + ge_offset),
        })

    return timeline


def analyze_vision(video_path, situation="academic"):
    start = time.time()

    print("=== 고개 방향 분석 시작 ===")
    head_result = analyze_head_pose(video_path, show_video=False) or {}

    print("=== 표정 분석 시작 ===")
    emotion_result = analyze_emotion(
        video_path,
        show_video=False,
        rotate_mode="none",
        smoothing_window=5
    ) or {}

    print("=== 시선 방향 분석 시작 ===")
    gaze_result = analyze_gaze(
        video_path,
        show_video=False,
        rotate_mode="none",
        smoothing_window=5
    ) or {}

    print("=== 손동작 분석 시작 ===")
    gesture_result = analyze_gesture(
        video_path,
        show_video=False,
        rotate_mode="none",
        smoothing_window=7,
        situation=situation,
    ) or {}

    head_score = head_result.get("head_score", 50)
    emotion_score = emotion_result.get("emotion_score", 50)
    gaze_score = gaze_result.get("gaze_score", 50)
    gesture_score = gesture_result.get("gesture_score", 50)

    print(f"[디버깅] head_score    = {head_score}")
    print(f"[디버깅] emotion_score = {emotion_score}")
    print(f"[디버깅] gaze_score    = {gaze_score}")
    print(f"[디버깅] gesture_score = {gesture_score}")

    delivery_score = calculate_delivery_score(
        head_score, emotion_score, gaze_score, gesture_score
    )
    delivery_feedback = get_delivery_feedback(delivery_score)

    head_timeline = head_result.get("timeline", [])
    gaze_timeline = gaze_result.get("timeline", [])

    timeline = []

    timeline_length = max(len(head_timeline), len(gaze_timeline))

    for i in range(timeline_length):

        head_item = (
            head_timeline[i]
            if i < len(head_timeline)
            else {}
        )

        gaze_item = (
            gaze_timeline[i]
            if i < len(gaze_timeline)
            else {}
        )

        timeline.append({
            "time": head_item.get(
                "time",
                gaze_item.get("time", "00:00")
            ),

            "head_score": head_item.get(
                "head_score",
                head_score
            ),

            "emotion_score": emotion_score,

            "gaze_score": gaze_item.get(
                "gaze_score",
                gaze_score
            ),

            "gesture_score": gesture_score,
        })

    video_dashboard = {
        "overall": {
            "score": delivery_score,
            "feedback": delivery_feedback,
        },
        "metrics": [
            {
                "key": "head",
                "label": "고개 방향",
                "score": head_score,
                "feedback": head_result.get("head_feedback", ""),
                "ratio": head_result.get("ratios", {}),
            },
            {
                "key": "emotion",
                "label": "표정",
                "score": emotion_score,
                "feedback": emotion_result.get("emotion_feedback", ""),
                "ratio": emotion_result.get("emotion_ratio", {}),
            },
            {
                "key": "gaze",
                "label": "시선",
                "score": gaze_score,
                "feedback": gaze_result.get("gaze_feedback", ""),
                "ratio": gaze_result.get("gaze_ratio", {}),
            },
            {
                "key": "gesture",
                "label": "손동작",
                "score": gesture_score,
                "feedback": gesture_result.get("gesture_feedback", ""),
                "ratio": gesture_result.get("gesture_ratio", {}),
            },
        ],
        "timeline": timeline,
        "feedback_items": [
            {
                "label": "고개 방향",
                "feedback": head_result.get("head_feedback", ""),
            },
            {
                "label": "표정",
                "feedback": emotion_result.get("emotion_feedback", ""),
            },
            {
                "label": "시선",
                "feedback": gaze_result.get("gaze_feedback", ""),
            },
            {
                "label": "손동작",
                "feedback": gesture_result.get("gesture_feedback", ""),
            },
        ],
    }

    elapsed = round(time.time() - start, 2)

    return {
        "head_pose": head_result,
        "emotion": emotion_result,
        "gaze": gaze_result,
        "gesture": gesture_result,
        "delivery_score": delivery_score,
        "delivery_feedback": delivery_feedback,
        "analysis_time": elapsed,
        "video_dashboard": video_dashboard,
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
    print(f"손동작 점수:   {result['gesture'].get('gesture_score', 50)}")
    print(f"손동작 피드백: {result['gesture'].get('gesture_feedback', '')}")
    print()
    print(f"최종 태도 점수:   {result['delivery_score']}")
    print(f"최종 태도 피드백: {result['delivery_feedback']}")
    print(f"분석 소요 시간:   {result['analysis_time']}초")
    print()
    print("=== timeline ===")
    print(result["video_dashboard"]["timeline"])