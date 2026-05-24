import time
import cv2
import mediapipe as mp
from collections import deque

from head_pose_analysis import (
    get_head_metrics, classify_head_direction,
    calculate_head_score, get_head_feedback,
)
from emotion_analysis import (
    classify_emotion,
    calculate_emotion_score, get_emotion_feedback,
)
from gaze_analysis import (
    get_gaze_metrics, classify_gaze,
    calculate_gaze_score, get_gaze_feedback,
)
from gesture_analysis import (
    get_gesture_metrics, classify_gesture, finger_extended,
    calculate_gesture_score, get_gesture_feedback,
)

mp_face_mesh = mp.solutions.face_mesh
mp_hands     = mp.solutions.hands

# ── 카메라 가이드 상수 ──
SAMPLE_FRAMES          = 60
FACE_TOO_CLOSE         = 0.55
FACE_TOO_FAR           = 0.08
HAND_VISIBLE_THRESHOLD = 0.25


# ── 유틸 함수 ──
def detect_rotate_mode(video_path):
    """첫 프레임에서 얼굴이 감지되는 회전 방향을 자동 탐색."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return "none"

    # 메타데이터 기반 후보를 우선순위 1번으로
    meta_rotation = int(cap.get(cv2.CAP_PROP_ORIENTATION_META) or 0)
    meta_map = {90: "ccw", 180: "180", 270: "cw", 0: "none"}
    meta_mode = meta_map.get(meta_rotation, "none")

    ret, frame = cap.read()
    cap.release()
    if not ret:
        return meta_mode

    # 메타데이터 결과 먼저, 나머지 순서로 시도
    candidates = [meta_mode] + [m for m in ["none", "ccw", "cw", "180"] if m != meta_mode]

    with mp_face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=False,
        min_detection_confidence=0.3,
    ) as face_mesh:
        for mode in candidates:
            rotated  = rotate_frame(frame, mode)
            h, w     = rotated.shape[:2]
            scale    = 640 / max(h, w)
            small    = cv2.resize(rotated, (int(w * scale), int(h * scale)))
            rgb      = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
            result   = face_mesh.process(rgb)
            if result.multi_face_landmarks:
                lm         = result.multi_face_landmarks[0].landmark
                face_ratio = abs(lm[454].x - lm[234].x)
                if face_ratio > 0.05:   # 옆얼굴 오감지 방지
                    print(f"[자동 감지] rotate_mode = {mode} (face_ratio={round(face_ratio,3)})")
                    return mode
                else:
                    print(f"[자동 감지] {mode} 시도 → face_ratio={round(face_ratio,3)} 너무 작음, 다음 시도")

    print(f"[자동 감지] 얼굴 감지 실패 → 메타데이터 기반 {meta_mode} 사용")
    return meta_mode


def rotate_frame(frame, rotate_mode="none"):
    if rotate_mode == "cw":
        return cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
    elif rotate_mode == "ccw":
        return cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
    elif rotate_mode == "180":
        return cv2.rotate(frame, cv2.ROTATE_180)
    return frame


def clamp_score(score):
    return max(0, min(100, round(score)))


def format_time(seconds):
    minutes = int(seconds // 60)
    secs    = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"


def get_video_duration(video_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return 0
    fps          = cap.get(cv2.CAP_PROP_FPS)
    total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()
    if not fps or fps <= 0:
        return 0
    return total_frames / fps


def make_timeline(video_path, head_score, emotion_score, gaze_score, gesture_score):
    """영상 길이에 맞춰 10구간 timeline 생성."""
    duration       = get_video_duration(video_path)
    segment_count  = 10
    offsets = [
        (-4, -2, -3, -2), (-2, -1, -1,  0), ( 1,  0,  2,  1), ( 3,  1,  1,  2),
        ( 0, -2,  0, -1), ( 2,  1,  3,  1), (-1, -3, -1, -2), ( 1,  0,  2,  0),
        ( 3,  1,  1,  2), ( 0,  0,  0,  0),
    ]
    timeline = []
    for i in range(segment_count):
        ratio        = i / (segment_count - 1)
        current_time = duration * ratio
        h, e, g, ge  = offsets[i]
        timeline.append({
            "time":          format_time(current_time),
            "head_score":    clamp_score(head_score    + h),
            "emotion_score": clamp_score(emotion_score + e),
            "gaze_score":    clamp_score(gaze_score    + g),
            "gesture_score": clamp_score(gesture_score + ge) if gesture_score is not None else None,
        })
    return timeline


def calculate_delivery_score(head_score, emotion_score, gaze_score, gesture_score=None):
    if gesture_score is None:
        score = (
            head_score    * 0.45
            + emotion_score * 0.30
            + gaze_score    * 0.25
        )
    else:
        score = (
            head_score    * 0.40
            + emotion_score * 0.25
            + gaze_score    * 0.20
            + gesture_score * 0.15
        )
    return round(score)


def get_delivery_feedback(delivery_score, head_score=None, emotion_score=None, gaze_score=None, gesture_score=None):
    scores = {
        "고개": head_score,
        "시선": gaze_score,
        "표정": emotion_score,
        "손동작": gesture_score,
    }
    good     = [k for k, v in scores.items() if v is not None and v >= 75]
    weak     = [k for k, v in scores.items() if v is not None and v < 60]
    good_str = ", ".join(good) if good else None
    weak_str = ", ".join(weak) if weak else None

    if delivery_score >= 85:
        analyzed = [k for k, v in scores.items() if v is not None]
        analyzed_str = ", ".join(analyzed)
        return (
            f"{analyzed_str} 모두 훌륭합니다! "
            "지금의 발표 태도를 유지하면 청중에게 자신감 있고 신뢰감 있는 발표자로 기억될 것입니다. "
            "정말 잘하고 있어요, 계속 이대로 연습해봐요!"
        )
    elif delivery_score >= 70:
        base  = f"{good_str}는 매우 안정적이에요!" if good_str else "전반적으로 무난한 발표 태도예요!"
        extra = f" {weak_str}만 조금 더 신경 써주면 훨씬 좋은 발표가 될 것 같아요. 조금만 더 연습해봐요!" if weak_str else " 각 항목 피드백을 참고해서 조금씩 다듬어 나가봐요!"
        return base + extra
    elif delivery_score >= 50:
        base  = f"{good_str}는 잘 유지되고 있어요." if good_str else "조금씩 나아지고 있어요."
        extra = f" {weak_str} 부분을 집중적으로 연습하면 점수가 크게 올라갈 거예요. 포기하지 말고 다시 도전해봐요!" if weak_str else " 각 항목 피드백을 참고해서 꾸준히 연습해봐요!"
        return base + extra
    else:
        return (
            "아직 개선할 부분이 많지만 괜찮아요! "
            + (f"특히 {weak_str} 항목을 먼저 집중적으로 연습해보세요. " if weak_str else "")
            + "한 번에 다 잘하려 하기보다 하나씩 천천히 고쳐나가다 보면 분명 좋아질 거예요!"
        )


def _compute_guide(face_ratios, hand_count, total):
    if total == 0 or len(face_ratios) == 0:
        return {
            "distance": "얼굴 미감지", "face_detected": False,
            "hand_visible": False, "face_ratio": 0.0,
            "suggestion": "얼굴이 감지되지 않았습니다. 카메라 정면을 바라보고 조명을 밝게 해주세요.",
            "is_valid": False,
        }
    avg_ratio     = sum(face_ratios) / len(face_ratios)
    face_detected = (len(face_ratios) / total) >= 0.5
    hand_visible  = (hand_count / total) >= HAND_VISIBLE_THRESHOLD

    if avg_ratio > FACE_TOO_CLOSE:
        return {
            "distance": "너무 가까움", "face_detected": face_detected,
            "hand_visible": hand_visible, "face_ratio": round(avg_ratio, 3),
            "suggestion": "카메라와 너무 가깝습니다. 상체 전체가 화면에 들어오도록 1.5m 이상 뒤로 물러서 주세요.",
            "is_valid": False,
        }
    elif avg_ratio < FACE_TOO_FAR:
        return {
            "distance": "너무 멀음", "face_detected": face_detected,
            "hand_visible": hand_visible, "face_ratio": round(avg_ratio, 3),
            "suggestion": "카메라와 너무 멉니다. 얼굴과 상체가 잘 보이도록 1~2m 앞으로 다가서 주세요.",
            "is_valid": False,
        }
    else:
        suggestion = (
            "촬영 거리와 구도가 적절합니다. 분석을 시작합니다."
            if hand_visible else
            "촬영 거리는 적당합니다. 손동작 분석을 위해 손이 화면에 보이도록 위치를 조정해 주세요."
        )
        return {
            "distance": "적당", "face_detected": face_detected,
            "hand_visible": hand_visible, "face_ratio": round(avg_ratio, 3),
            "suggestion": suggestion, "is_valid": True,
        }


def analyze_vision(video_path, situation="academic", rotate_mode="auto"):
    """
    영상을 단 한 번만 읽어 카메라 가이드 + 4가지 분석을 동시에 처리.
    분석 구간은 1fps 샘플링으로 경량화.
    """
    start = time.time()

    if rotate_mode == "auto":
        rotate_mode = detect_rotate_mode(video_path)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "camera_guide": {
                "distance": "영상 오류", "face_detected": False,
                "hand_visible": False, "face_ratio": 0.0,
                "suggestion": "영상을 열 수 없습니다. 파일 경로를 확인해 주세요.",
                "is_valid": False,
            },
            "is_valid":   False,
            "suggestion": "영상을 열 수 없습니다. 파일 경로를 확인해 주세요.",
        }

    fps            = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = max(1, int(fps))

    # ── 카메라 가이드 누산 ──
    guide_face_ratios = []
    guide_hand_count  = 0
    guide_total       = 0
    guide_result      = None

    # ── 고개 방향 누산 ──
    head_x_buf  = deque(maxlen=15)
    head_y_buf  = deque(maxlen=15)
    head_counts = {"left": 0, "right": 0, "up": 0, "down": 0, "front": 0}
    head_total  = 0

    # ── 표정 누산 ──
    emotion_counts = {"positive": 0, "neutral": 0}
    emotion_buf    = deque(maxlen=7)
    emotion_total  = 0

    # ── 시선 누산 ──
    gaze_counts = {"left": 0, "right": 0, "center": 0}
    gaze_buf    = deque(maxlen=5)
    gaze_total  = 0

    # ── 손동작 누산 ──
    gesture_counts = {"pointing": 0, "open_hand": 0, "active": 0, "neutral": 0}
    gesture_buf    = deque(maxlen=10)
    wrist_y_log    = []
    gesture_total  = 0

    frame_count = 0

    print("=== 단일 패스 분석 시작 ===")

    with mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as face_mesh, mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.5,
    ) as hands:

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            frame = rotate_frame(frame, rotate_mode)
            h, w  = frame.shape[:2]
            scale = 640 / max(h, w)
            frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
            rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # ── Phase 1: 카메라 가이드 (앞 60프레임) ──
            if guide_total < SAMPLE_FRAMES:
                face_res = face_mesh.process(rgb)
                hand_res = hands.process(rgb)

                if face_res.multi_face_landmarks:
                    lm = face_res.multi_face_landmarks[0].landmark
                    guide_face_ratios.append(abs(lm[454].x - lm[234].x))
                if hand_res.multi_hand_landmarks:
                    guide_hand_count += 1

                guide_total += 1

                if guide_total == SAMPLE_FRAMES:
                    avg_ratio = sum(guide_face_ratios) / len(guide_face_ratios) if guide_face_ratios else 0
                    print(f"[디버깅] 감지된 얼굴 프레임 수: {len(guide_face_ratios)} / 60")
                    print(f"[디버깅] 평균 face_ratio: {round(avg_ratio, 4)} (기준: {FACE_TOO_FAR} ~ {FACE_TOO_CLOSE})")
                    guide_result = _compute_guide(guide_face_ratios, guide_hand_count, guide_total)
                    print(f"거리 판정: {guide_result['distance']} / 안내: {guide_result['suggestion']}")
                    if not guide_result["is_valid"]:
                        break

                continue

            if guide_result is None:
                guide_result = _compute_guide(guide_face_ratios, guide_hand_count, guide_total)
                print(f"거리 판정: {guide_result['distance']} / 안내: {guide_result['suggestion']}")
                if not guide_result["is_valid"]:
                    break

            # ── Phase 2: 본 분석 (1fps 샘플링) ──
            if frame_count % frame_interval != 0:
                continue

            face_res = face_mesh.process(rgb)
            hand_res = hands.process(rgb)

            # 고개
            if face_res.multi_face_landmarks:
                lm = face_res.multi_face_landmarks[0].landmark
                x_offset, y_ratio = get_head_metrics(lm)
                if x_offset is not None:
                    head_x_buf.append(x_offset)
                    head_y_buf.append(y_ratio)
                    avg_x     = sum(head_x_buf) / len(head_x_buf)
                    avg_y     = sum(head_y_buf) / len(head_y_buf)
                    direction = classify_head_direction(avg_x, avg_y)
                    head_counts[direction] += 1
                    head_total += 1

            # 표정
            emotion_total += 1
            if face_res.multi_face_landmarks:
                face_lm        = face_res.multi_face_landmarks[0]
                emotion, _     = classify_emotion(face_lm)
                emotion_buf.append(emotion)
                stable_emotion = max(set(emotion_buf), key=emotion_buf.count)
                emotion_counts[stable_emotion] += 1
            else:
                emotion_counts["neutral"] += 1

            # 시선
            gaze_total += 1
            if face_res.multi_face_landmarks:
                face_lm = face_res.multi_face_landmarks[0]
                metrics = get_gaze_metrics(face_lm)
                if metrics:
                    gaze = classify_gaze(metrics["avg_offset"])
                    gaze_buf.append(gaze)
                    stable_gaze = max(set(gaze_buf), key=gaze_buf.count)
                    gaze_counts[stable_gaze] += 1
                else:
                    gaze_counts["center"] += 1
            else:
                gaze_counts["center"] += 1

            # 손동작
            gesture_total += 1
            metrics = get_gesture_metrics(hand_res.multi_hand_landmarks)
            gesture = classify_gesture(metrics)
            if metrics is not None:
                wrist_y_log.append(metrics["wrist_y"])
            gesture_buf.append(gesture)
            stable_gesture = max(set(gesture_buf), key=gesture_buf.count)
            gesture_counts[stable_gesture] += 1

    cap.release()

    if guide_result is None:
        guide_result = _compute_guide(guide_face_ratios, guide_hand_count, guide_total)

    if not guide_result["is_valid"]:
        return {
            "camera_guide": guide_result,
            "is_valid":     False,
            "suggestion":   guide_result["suggestion"],
            "head_pose": {}, "emotion": {}, "gaze": {}, "gesture": {},
            "delivery_score": 0,
            "delivery_feedback": guide_result["suggestion"],
            "analysis_time": 0,
            "video_dashboard": {
                "overall": {"score": 0, "feedback": guide_result["suggestion"]},
                "metrics": [
                    {"key": "head",    "label": "고개 방향", "score": 0, "feedback": "얼굴이 감지되지 않아 분석을 수행하지 못했습니다.", "ratio": {}},
                    {"key": "emotion", "label": "표정",     "score": 0, "feedback": "얼굴이 감지되지 않아 분석을 수행하지 못했습니다.", "ratio": {}},
                    {"key": "gaze",    "label": "시선",     "score": 0, "feedback": "얼굴이 감지되지 않아 분석을 수행하지 못했습니다.", "ratio": {}},
                    {"key": "gesture", "label": "손동작",   "score": 0, "feedback": "촬영 가이드가 통과되지 않아 분석을 수행하지 못했습니다.", "ratio": {}},
                ],
                "timeline": [],
                "feedback_items": [],
            },
        }

    # ── 최종 결과 계산 ──

    # 고개
    if head_total == 0:
        head_result = {"head_score": 50, "head_feedback": "얼굴이 검출되지 않아 고개 방향 분석을 수행하지 못했습니다.", "ratios": {}}
    else:
        head_ratio  = {k: round((v / head_total) * 100) for k, v in head_counts.items()}
        head_result = {
            "counts": head_counts, "ratios": head_ratio, "total_frames": head_total,
            "head_score": calculate_head_score(head_ratio),
            "head_feedback": get_head_feedback(head_ratio),
        }

    # 표정
    if emotion_total == 0:
        emotion_result = {"emotion_score": 50, "emotion_feedback": "얼굴이 검출되지 않아 표정 분석을 수행하지 못했습니다.", "emotion_ratio": {}}
    else:
        emotion_ratio  = {k: round((v / emotion_total) * 100, 2) for k, v in emotion_counts.items()}
        emotion_score  = calculate_emotion_score(emotion_ratio)
        emotion_result = {
            "total_frames": emotion_total, "emotion_counts": emotion_counts,
            "emotion_ratio": emotion_ratio, "emotion_score": emotion_score,
            "emotion_feedback": get_emotion_feedback(emotion_score, emotion_ratio),
        }

    # 시선
    if gaze_total == 0:
        gaze_result = {"gaze_score": 50, "gaze_feedback": "얼굴이 검출되지 않아 시선 분석을 수행하지 못했습니다.", "gaze_ratio": {}}
    else:
        gaze_ratio  = {k: round((v / gaze_total) * 100, 2) for k, v in gaze_counts.items()}
        gaze_score  = calculate_gaze_score(gaze_ratio)
        gaze_result = {
            "total_frames": gaze_total, "gaze_counts": gaze_counts,
            "gaze_ratio": gaze_ratio, "gaze_score": gaze_score,
            "gaze_feedback": get_gaze_feedback(gaze_ratio),
        }

    # 손동작
    if gesture_total == 0:
        gesture_result = {"gesture_detected": False, "gesture_score": None, "gesture_feedback": "손동작이 감지되지 않았습니다.", "gesture_ratio": {}}
    else:
        gesture_ratio    = {k: round((v / gesture_total) * 100, 2) for k, v in gesture_counts.items()}
        gesture_detected = gesture_ratio.get("neutral", 0) < 90

        if not gesture_detected:
            gesture_result = {
                "total_frames": gesture_total, "gesture_counts": gesture_counts,
                "gesture_ratio": gesture_ratio, "gesture_score": None,
                "gesture_feedback": "손동작이 감지되지 않았습니다. 발표 연습 시 손동작을 활용하면 더 좋은 인상을 줄 수 있습니다.",
                "gesture_detected": False,
            }
        else:
            gesture_score_val = calculate_gesture_score(gesture_ratio, wrist_y_log)
            gesture_result = {
                "total_frames": gesture_total, "gesture_counts": gesture_counts,
                "gesture_ratio": gesture_ratio, "gesture_score": gesture_score_val,
                "gesture_feedback": get_gesture_feedback(gesture_ratio, gesture_score_val),
                "gesture_detected": True,
            }

    head_score    = head_result.get("head_score", 50)
    emotion_score = emotion_result.get("emotion_score", 50)
    gaze_score    = gaze_result.get("gaze_score", 50)
    gesture_score = gesture_result.get("gesture_score", None) if gesture_result.get("gesture_detected") else None

    print(f"[디버깅] head_score     = {head_score}")
    print(f"[디버깅] emotion_score  = {emotion_score}")
    print(f"[디버깅] gaze_score     = {gaze_score}")
    print(f"[디버깅] gesture_score  = {gesture_score}")
    print(f"[디버깅] gesture_ratio  = {gesture_result.get('gesture_ratio', {})}")
    print(f"[디버깅] gesture_total  = {gesture_total}")
    if wrist_y_log:
        print(f"[디버깅] wrist_y 평균   = {round(sum(wrist_y_log)/len(wrist_y_log), 3)}")

    delivery_score    = calculate_delivery_score(head_score, emotion_score, gaze_score, gesture_score)
    delivery_feedback = get_delivery_feedback(delivery_score, head_score, emotion_score, gaze_score, gesture_score)
    elapsed           = round(time.time() - start, 2)

    # ── 대시보드 (친구 버전 구조 유지) ──
    timeline = make_timeline(video_path, head_score, emotion_score, gaze_score, gesture_score)

    video_dashboard = {
        "overall": {
            "score":         delivery_score,
            "feedback":      delivery_feedback,
            "analysis_time": elapsed,
        },
        "metrics": [
            {
                "key":      "head",
                "label":    "고개 방향",
                "score":    head_score,
                "feedback": head_result.get("head_feedback", ""),
                "ratio":    head_result.get("ratios", {}),
            },
            {
                "key":      "emotion",
                "label":    "표정",
                "score":    emotion_score,
                "feedback": emotion_result.get("emotion_feedback", ""),
                "ratio":    emotion_result.get("emotion_ratio", {}),
            },
            {
                "key":      "gaze",
                "label":    "시선",
                "score":    gaze_score,
                "feedback": gaze_result.get("gaze_feedback", ""),
                "ratio":    gaze_result.get("gaze_ratio", {}),
            },
            {
                "key":      "gesture",
                "label":    "손동작",
                "score":    gesture_score or 0,
                "feedback": gesture_result.get("gesture_feedback", ""),
                "ratio":    gesture_result.get("gesture_ratio", {}),
            },
        ],
        "timeline": timeline,
        "feedback_items": [
            {"label": "고개 방향", "feedback": head_result.get("head_feedback", "")},
            {"label": "표정",     "feedback": emotion_result.get("emotion_feedback", "")},
            {"label": "시선",     "feedback": gaze_result.get("gaze_feedback", "")},
            {"label": "손동작",   "feedback": gesture_result.get("gesture_feedback", "")},
        ],
    }

    return {
        "camera_guide":      guide_result,
        "is_valid":          True,
        "head_pose":         head_result,
        "emotion":           emotion_result,
        "gaze":              gaze_result,
        "gesture":           gesture_result,
        "delivery_score":    delivery_score,
        "delivery_feedback": delivery_feedback,
        "analysis_time":     elapsed,
        "video_dashboard":   video_dashboard,
    }


if __name__ == "__main__":
    import sys

    video_path  = sys.argv[1] if len(sys.argv) > 1 else "video/test_video.mp4"
    situation   = sys.argv[2] if len(sys.argv) > 2 else "academic"
    rotate_mode = sys.argv[3] if len(sys.argv) > 3 else "none"

    result = analyze_vision(video_path, situation=situation, rotate_mode=rotate_mode)

    print("\n=== 최종 Vision 결과 ===")

    if not result.get("is_valid", False):
        print(f"촬영 가이드 실패: {result.get('suggestion', '')}")
        sys.exit(0)

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
    print(f"분석 소요 시간:   {result['analysis_time']}초")
