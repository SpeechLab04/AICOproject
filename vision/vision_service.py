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
    get_motion_metrics, classify_gesture,
    is_holding_hand, select_active_hand, finger_extended,
    calculate_gesture_score, get_gesture_feedback,
    MOTION_BUFFER,
)

mp_face_mesh = mp.solutions.face_mesh
mp_hands     = mp.solutions.hands

# ── 카메라 가이드 상수 ──
SAMPLE_FRAMES          = 60
FACE_TOO_CLOSE         = 0.40
FACE_TOO_FAR           = 0.08
HAND_VISIBLE_THRESHOLD = 0.25


def rotate_frame(frame, rotate_mode="none"):
    if rotate_mode == "cw":
        return cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
    elif rotate_mode == "ccw":
        return cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
    elif rotate_mode == "180":
        return cv2.rotate(frame, cv2.ROTATE_180)
    return frame


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


def get_delivery_feedback(delivery_score):
    if delivery_score >= 85:
        return "고개 방향, 표정, 시선, 손동작이 전반적으로 안정적인 발표 태도입니다."
    elif delivery_score >= 70:
        return "전반적으로 무난한 발표 태도이지만, 일부 요소를 조금 더 보완하면 좋습니다."
    elif delivery_score >= 50:
        return "발표 태도는 무난하지만 시선, 표정, 손동작 관리에서 개선 여지가 있습니다."
    else:
        return "고개 방향, 표정, 시선, 손동작 전반에서 개선이 필요합니다."


def _compute_guide(face_ratios, hand_count, total):
    """카메라 가이드 최종 판정."""
    if total == 0 or len(face_ratios) == 0:
        return {
            "distance":      "얼굴 미감지",
            "face_detected": False,
            "hand_visible":  False,
            "face_ratio":    0.0,
            "suggestion":    "얼굴이 감지되지 않았습니다. 카메라 정면을 바라보고 조명을 밝게 해주세요.",
            "is_valid":      False,
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


def analyze_vision(video_path, situation="academic", rotate_mode="none"):
    """
    영상을 단 한 번만 읽어 카메라 가이드 + 4가지 분석을 동시에 처리.
    분석 구간은 1fps 샘플링으로 경량화.
    """
    start = time.time()

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
    frame_interval = max(1, int(fps))   # 1fps 샘플링 간격

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
    gesture_counts  = {"pointing": 0, "sweep": 0, "emphasis": 0, "active": 0, "neutral": 0}
    gesture_buf     = deque(maxlen=10)
    pos_buffer      = deque(maxlen=MOTION_BUFFER)
    gesture_total   = 0
    one_hand_frames = 0

    frame_count = 0

    print("=== 단일 패스 분석 시작 ===")

    with mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,          # 홍채 랜드마크 포함 (시선 분석용)
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
            frame = cv2.resize(frame, (640, 360))
            rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # ──────────────────────────────────────────
            # PHASE 1: 카메라 가이드 (앞 SAMPLE_FRAMES 프레임)
            # ──────────────────────────────────────────
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
                    guide_result = _compute_guide(guide_face_ratios, guide_hand_count, guide_total)
                    print(f"거리 판정: {guide_result['distance']} / 안내: {guide_result['suggestion']}")
                    if not guide_result["is_valid"]:
                        break

                continue   # 가이드 프레임은 본 분석 제외

            # 가이드가 완료되기 전에 영상이 끝난 경우
            if guide_result is None:
                guide_result = _compute_guide(guide_face_ratios, guide_hand_count, guide_total)
                print(f"거리 판정: {guide_result['distance']} / 안내: {guide_result['suggestion']}")
                if not guide_result["is_valid"]:
                    break

            # ──────────────────────────────────────────
            # PHASE 2: 본 분석 (1fps 샘플링)
            # ──────────────────────────────────────────
            if frame_count % frame_interval != 0:
                continue

            face_res = face_mesh.process(rgb)
            hand_res = hands.process(rgb)

            # ── 고개 방향 ──
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

            # ── 표정 ──
            emotion_total += 1
            if face_res.multi_face_landmarks:
                face_lm       = face_res.multi_face_landmarks[0]
                emotion, _    = classify_emotion(face_lm)
                emotion_buf.append(emotion)
                stable_emotion = max(set(emotion_buf), key=emotion_buf.count)
                emotion_counts[stable_emotion] += 1
            else:
                emotion_counts["neutral"] += 1

            # ── 시선 ──
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

            # ── 손동작 ──
            gesture_total += 1
            if hand_res.multi_hand_landmarks:
                lm = select_active_hand(hand_res.multi_hand_landmarks)
                pos_buffer.append((lm[0].x, lm[0].y))

                if len(hand_res.multi_hand_landmarks) == 2:
                    lm0 = hand_res.multi_hand_landmarks[0].landmark
                    lm1 = hand_res.multi_hand_landmarks[1].landmark
                    if is_holding_hand(lm0) != is_holding_hand(lm1):
                        one_hand_frames += 1

                index_ext = finger_extended(lm, 8, 6)
                motion    = get_motion_metrics(pos_buffer)
                gesture   = classify_gesture(motion, index_ext)
            else:
                gesture = "neutral"

            gesture_buf.append(gesture)
            stable_gesture = max(set(gesture_buf), key=gesture_buf.count)
            gesture_counts[stable_gesture] += 1

    cap.release()

    # 영상이 너무 짧아 가이드가 한 번도 완료 안 된 경우
    if guide_result is None:
        guide_result = _compute_guide(guide_face_ratios, guide_hand_count, guide_total)

    if not guide_result["is_valid"]:
        return {
            "camera_guide": guide_result,
            "is_valid":     False,
            "suggestion":   guide_result["suggestion"],
        }

    # ── 최종 결과 계산 ──

    # 고개
    if head_total == 0:
        head_result = {
            "head_score":    50,
            "head_feedback": "얼굴이 검출되지 않아 고개 방향 분석을 수행하지 못했습니다.",
            "direction_ratios": {},
        }
    else:
        head_ratio  = {k: round((v / head_total) * 100) for k, v in head_counts.items()}
        head_result = {
            "counts":       head_counts,
            "ratios":       head_ratio,
            "total_frames": head_total,
            "head_score":   calculate_head_score(head_ratio),
            "head_feedback": get_head_feedback(head_ratio),
        }

    # 표정
    if emotion_total == 0:
        emotion_result = {
            "emotion_score":    50,
            "emotion_feedback": "얼굴이 검출되지 않아 표정 분석을 수행하지 못했습니다.",
        }
    else:
        emotion_ratio  = {k: round((v / emotion_total) * 100, 2) for k, v in emotion_counts.items()}
        emotion_score  = calculate_emotion_score(emotion_ratio)
        emotion_result = {
            "total_frames":   emotion_total,
            "emotion_counts": emotion_counts,
            "emotion_ratio":  emotion_ratio,
            "emotion_score":  emotion_score,
            "emotion_feedback": get_emotion_feedback(emotion_score, emotion_ratio),
        }

    # 시선
    if gaze_total == 0:
        gaze_result = {
            "gaze_score":    50,
            "gaze_feedback": "얼굴이 검출되지 않아 시선 분석을 수행하지 못했습니다.",
        }
    else:
        gaze_ratio  = {k: round((v / gaze_total) * 100, 2) for k, v in gaze_counts.items()}
        gaze_score  = calculate_gaze_score(gaze_ratio)
        gaze_result = {
            "total_frames": gaze_total,
            "gaze_counts":  gaze_counts,
            "gaze_ratio":   gaze_ratio,
            "gaze_score":   gaze_score,
            "gaze_feedback": get_gaze_feedback(gaze_ratio),
        }

    # 손동작
    if gesture_total == 0:
        gesture_result = {
            "gesture_detected": False,
            "gesture_score":    None,
            "gesture_feedback": "손동작이 감지되지 않았습니다.",
            "one_hand_mode":    False,
        }
    else:
        gesture_ratio    = {k: round((v / gesture_total) * 100, 2) for k, v in gesture_counts.items()}
        one_hand_mode    = (one_hand_frames / gesture_total) >= 0.30
        gesture_detected = gesture_ratio.get("neutral", 0) < 90

        if not gesture_detected:
            gesture_result = {
                "total_frames":   gesture_total,
                "gesture_counts": gesture_counts,
                "gesture_ratio":  gesture_ratio,
                "gesture_score":  None,
                "gesture_feedback": "손동작이 감지되지 않았습니다. 발표 연습 시 손동작을 활용하면 더 좋은 인상을 줄 수 있습니다.",
                "gesture_detected": False,
                "one_hand_mode":    one_hand_mode,
            }
        else:
            gesture_score  = calculate_gesture_score(gesture_ratio, situation)
            gesture_result = {
                "total_frames":   gesture_total,
                "gesture_counts": gesture_counts,
                "gesture_ratio":  gesture_ratio,
                "gesture_score":  gesture_score,
                "gesture_feedback": get_gesture_feedback(gesture_ratio, gesture_score, situation),
                "gesture_detected": True,
                "one_hand_mode":    one_hand_mode,
            }

    head_score    = head_result.get("head_score", 50)
    emotion_score = emotion_result.get("emotion_score", 50)
    gaze_score    = gaze_result.get("gaze_score", 50)
    gesture_score = gesture_result.get("gesture_score", None) if gesture_result.get("gesture_detected") else None

    print(f"[디버깅] head_score    = {head_score}")
    print(f"[디버깅] emotion_score = {emotion_score}")
    print(f"[디버깅] gaze_score    = {gaze_score}")
    print(f"[디버깅] gesture_score = {gesture_score}")

    delivery_score    = calculate_delivery_score(head_score, emotion_score, gaze_score, gesture_score)
    delivery_feedback = get_delivery_feedback(delivery_score)
    elapsed           = round(time.time() - start, 2)

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
