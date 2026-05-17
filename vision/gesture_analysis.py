import cv2
import mediapipe as mp
from collections import deque
import os
from gesture_profiles import GESTURE_PROFILES

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEO_PATH = os.path.join(BASE_DIR, "video", "test_video.mp4")

ROTATE_MODE = "180"
SHOW_VIDEO = True
DRAW_LANDMARKS = True
PREVIEW_MAX_WIDTH = 720
SMOOTHING_WINDOW = 10
MOTION_BUFFER = 20  # 움직임 추적할 프레임 수 (약 0.6초)

GESTURE_LABELS_KO = {
    "pointing": "가리키기",
    "sweep":    "쓸기",
    "emphasis": "강조",
    "active":   "활발",
    "neutral":  "미감지/정지",
}


# =========================
# 보조 함수
# =========================
def rotate_frame(frame, rotate_mode="none"):
    if rotate_mode == "cw":
        return cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)
    elif rotate_mode == "ccw":
        return cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
    elif rotate_mode == "180":
        return cv2.rotate(frame, cv2.ROTATE_180)
    return frame


def resize_for_preview(frame, max_width=720):
    h, w = frame.shape[:2]
    if w > max_width:
        scale = max_width / w
        frame = cv2.resize(frame, (int(w * scale), int(h * scale)))
    return frame


def finger_extended(lm, tip, pip):
    """tip이 pip보다 위에 있으면 펴진 것으로 판단"""
    return lm[tip].y < lm[pip].y


# =========================
# 움직임 메트릭 계산
# =========================
def get_motion_metrics(pos_buffer):
    """
    손목 위치 버퍼로부터 움직임 특성 계산.
    pos_buffer: deque of (x, y) — MediaPipe 정규화 좌표 (0~1)
    """
    if len(pos_buffer) < 3:
        return None

    positions = list(pos_buffer)

    # 프레임 간 이동 거리 합산 → 평균 속도
    total_dist = 0.0
    for i in range(1, len(positions)):
        dx = positions[i][0] - positions[i - 1][0]
        dy = positions[i][1] - positions[i - 1][1]
        total_dist += (dx ** 2 + dy ** 2) ** 0.5
    avg_speed = total_dist / len(positions)

    # 전체 변위 (버퍼 시작 → 끝)
    net_dx = positions[-1][0] - positions[0][0]
    net_dy = positions[-1][1] - positions[0][1]

    # y축 방향 변화 횟수 → 강조 동작(위아래 반복) 감지
    dy_signs = []
    for i in range(1, len(positions)):
        dy = positions[i][1] - positions[i - 1][1]
        if abs(dy) > 0.005:  # 노이즈 필터
            dy_signs.append(1 if dy > 0 else -1)

    direction_changes = (
        sum(1 for i in range(1, len(dy_signs)) if dy_signs[i] != dy_signs[i - 1])
        if len(dy_signs) > 1 else 0
    )

    return {
        "avg_speed":        avg_speed,
        "net_dx":           net_dx,
        "net_dy":           net_dy,
        "total_dist":       total_dist,
        "direction_changes": direction_changes,
    }


# =========================
# 들고 있는 손 감지
# =========================
def is_holding_hand(lm):
    """
    손가락이 거의 접혀있으면 뭔가 들고 있는 것으로 판단.
    검지/중지/약지/소지 중 1개 이하만 펴짐 → 들고 있는 손
    """
    extended = [
        finger_extended(lm, 8,  6),   # 검지
        finger_extended(lm, 12, 10),  # 중지
        finger_extended(lm, 16, 14),  # 약지
        finger_extended(lm, 20, 18),  # 소지
    ]
    return sum(extended) <= 1


def select_active_hand(multi_hand_landmarks):
    """
    감지된 손 중 제스처 분석할 손 선택.
    - 1개: 그 손 사용
    - 2개: 들고 있지 않은 손 우선 선택
    """
    if len(multi_hand_landmarks) == 1:
        return multi_hand_landmarks[0].landmark

    lm0 = multi_hand_landmarks[0].landmark
    lm1 = multi_hand_landmarks[1].landmark

    holding0 = is_holding_hand(lm0)
    holding1 = is_holding_hand(lm1)

    if holding0 and not holding1:
        return lm1  # 손0이 들고 있음 → 손1 사용
    elif holding1 and not holding0:
        return lm0  # 손1이 들고 있음 → 손0 사용
    else:
        return lm0  # 둘 다 자유 or 둘 다 들고 있음 → 첫 번째 손


# =========================
# 제스처 분류
# =========================
def classify_gesture(motion_metrics, index_extended):
    """
    움직임 메트릭 → 제스처 레이블 분류.

    레이블 정의:
      pointing  : 검지 펴고 방향성 있게 이동 → 화면/자료 가리키기
      sweep     : 빠른 수평 이동              → 설명하며 손 쓸기
      emphasis  : 위아래 반복 진동            → 강조할 때 손 두드리기
      active    : 활발한 일반 손 움직임       → 자연스러운 설명 제스처
      neutral   : 거의 움직임 없음 or 손 미감지
    """
    if motion_metrics is None:
        return "neutral"

    speed   = motion_metrics["avg_speed"]
    net_dx  = motion_metrics["net_dx"]
    net_dy  = motion_metrics["net_dy"]
    changes = motion_metrics["direction_changes"]

    # 거의 안 움직임 → neutral
    if speed < 0.005:
        return "neutral"

    # 수평 쓸기: 좌우 이동이 상하보다 1.5배 이상 크고 이동량 충분
    if abs(net_dx) > 0.10 and abs(net_dx) > abs(net_dy) * 1.5:
        return "sweep"

    # 강조: y방향 반복 진동 (방향 전환 3회 이상)
    if changes >= 3 and speed > 0.008:
        return "emphasis"

    # 가리키기: 검지 펴고 이동
    if index_extended and speed > 0.006:
        return "pointing"

    # 일반 활발한 움직임
    if speed > 0.007:
        return "active"

    return "neutral"


# =========================
# 점수 계산
# =========================
def calculate_gesture_score(gesture_ratio, situation="academic"):
    """
    손동작 점수 계산 (0~100).
    구간 기반 + 다양성 보너스. situation별 보정은 gesture_profiles.py 참고.
    """
    profile = GESTURE_PROFILES.get(situation, GESTURE_PROFILES["academic"])
    s = profile["scoring"]

    pointing = gesture_ratio.get("pointing", 0)
    sweep    = gesture_ratio.get("sweep",    0)
    emphasis = gesture_ratio.get("emphasis", 0)
    active   = gesture_ratio.get("active",   0)

    gesture_use = pointing + sweep + emphasis + active

    # ── 구간 기반 기본 점수 (gesture_use 비율 기준) ──
    if gesture_use > 70:
        score = 85
    elif gesture_use > 50:
        score = 72
    elif gesture_use > 30:
        score = 58
    elif gesture_use > 10:
        score = 42
    else:
        score = 25

    # ── 다양성 보너스 (사용한 제스처 종류 수) ──
    variety = sum([
        pointing > 3,
        sweep    > 3,
        emphasis > 3,
        active   > 3,
    ])
    if variety >= 4:
        score += 10
    elif variety == 3:
        score += 7
    elif variety == 2:
        score += 4

    # pointing 보너스 (명확한 지시 동작)
    if pointing > 10:
        score += 3

    # 과도한 제스처 감점 (면접 등 상황별)
    if s["over_gesture_threshold"] is not None and gesture_use > s["over_gesture_threshold"]:
        score -= (gesture_use - s["over_gesture_threshold"]) * s["over_gesture_penalty"]

    return max(0, min(100, round(score)))


# =========================
# 피드백
# =========================
def get_gesture_feedback(gesture_ratio, gesture_score, situation="academic"):
    profile = GESTURE_PROFILES.get(situation, GESTURE_PROFILES["academic"])
    fb = profile["feedback"]

    neutral = gesture_ratio.get("neutral", 0)

    if neutral > 90:
        return fb["no_hand"]
    if gesture_score >= 80:
        return fb["high"]
    elif gesture_score >= 60:
        return fb["mid"]
    else:
        return fb["low"]


# =========================
# 메인 분석 함수
# =========================
def analyze_gesture(
    video_path,
    smoothing_window=10,
    show_video=True,
    rotate_mode="none",
    preview_max_width=720,
    draw_landmarks=True,
    situation="academic",
):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"비디오를 열 수 없습니다: {video_path}")

    gesture_counts = {
        "pointing": 0,
        "sweep":    0,
        "emphasis": 0,
        "active":   0,
        "neutral":  0,
    }

    total_frames     = 0
    one_hand_frames  = 0  # 한 손이 뭔가를 들고 있던 프레임 수
    gesture_buffer   = deque(maxlen=smoothing_window)
    pos_buffer       = deque(maxlen=MOTION_BUFFER)  # 손목 위치 추적용

    if show_video:
        cv2.namedWindow("Gesture Analysis", cv2.WINDOW_AUTOSIZE)

    with mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.6,
        min_tracking_confidence=0.5,
    ) as hands:

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame = rotate_frame(frame, rotate_mode)
            total_frames += 1

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results   = hands.process(rgb_frame)

            index_ext = False
            gesture   = "neutral"

            if results.multi_hand_landmarks:
                # 들고 있는 손 제외하고 활성 손 선택
                lm = select_active_hand(results.multi_hand_landmarks)
                pos_buffer.append((lm[0].x, lm[0].y))

                # 한 손이 뭔가 들고 있는지 카운트
                if len(results.multi_hand_landmarks) == 2:
                    lm0 = results.multi_hand_landmarks[0].landmark
                    lm1 = results.multi_hand_landmarks[1].landmark
                    if is_holding_hand(lm0) != is_holding_hand(lm1):
                        one_hand_frames += 1

                # 검지 펴짐 여부
                index_ext = finger_extended(lm, 8, 6)

                # 움직임 기반 제스처 분류
                motion  = get_motion_metrics(pos_buffer)
                gesture = classify_gesture(motion, index_ext)

                if draw_landmarks:
                    for hand_lm in results.multi_hand_landmarks:
                        mp_drawing.draw_landmarks(
                            frame,
                            hand_lm,
                            mp_hands.HAND_CONNECTIONS,
                            mp_drawing_styles.get_default_hand_landmarks_style(),
                            mp_drawing_styles.get_default_hand_connections_style(),
                        )

            # 스무딩 적용 후 카운트
            gesture_buffer.append(gesture)
            stable = max(set(gesture_buffer), key=gesture_buffer.count)
            gesture_counts[stable] += 1

            if show_video:
                color_map = {
                    "pointing": (0, 200, 255),
                    "sweep":    (0, 255, 100),
                    "emphasis": (255, 100, 0),
                    "active":   (255, 200, 0),
                    "neutral":  (180, 180, 180),
                }
                cv2.putText(
                    frame, f"Gesture: {stable}",
                    (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.0,
                    color_map.get(stable, (255, 255, 255)), 2,
                )

                motion = get_motion_metrics(pos_buffer)
                if motion:
                    cv2.putText(frame, f"speed: {motion['avg_speed']:.4f}",
                        (20, 78), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                    cv2.putText(frame, f"net_dx: {motion['net_dx']:.3f}",
                        (20, 104), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                    cv2.putText(frame, f"dir_changes: {motion['direction_changes']}",
                        (20, 130), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

                preview = resize_for_preview(frame, max_width=preview_max_width)
                cv2.imshow("Gesture Analysis", preview)

                key = cv2.waitKey(1) & 0xFF
                if key == 27 or key == ord("q"):
                    break

    cap.release()
    cv2.destroyAllWindows()

    if total_frames == 0:
        raise ValueError("처리된 프레임이 없습니다.")

    gesture_ratio = {
        key: round((value / total_frames) * 100, 2)
        for key, value in gesture_counts.items()
    }

    # 전체 프레임의 30% 이상에서 한 손이 뭔가를 들고 있었으면 한손 발표 모드
    one_hand_mode = (one_hand_frames / total_frames) >= 0.30

    # 손이 90% 이상 미감지면 손동작 없음 처리
    gesture_detected = gesture_ratio.get("neutral", 0) < 90

    if not gesture_detected:
        return {
            "total_frames":     total_frames,
            "gesture_counts":   gesture_counts,
            "gesture_ratio":    gesture_ratio,
            "gesture_score":    None,
            "gesture_feedback": "손동작이 감지되지 않았습니다. 발표 연습 시 손동작을 활용하면 더 좋은 인상을 줄 수 있습니다.",
            "gesture_detected": False,
            "one_hand_mode":    one_hand_mode,
        }

    gesture_score    = calculate_gesture_score(gesture_ratio, situation)
    gesture_feedback = get_gesture_feedback(gesture_ratio, gesture_score, situation)

    return {
        "total_frames":     total_frames,
        "gesture_counts":   gesture_counts,
        "gesture_ratio":    gesture_ratio,
        "gesture_score":    gesture_score,
        "gesture_feedback": gesture_feedback,
        "gesture_detected": True,
        "one_hand_mode":    one_hand_mode,
    }


if __name__ == "__main__":
    import sys
    video_path = sys.argv[1] if len(sys.argv) > 1 else VIDEO_PATH

    print(f"현재 분석 중인 영상: {video_path}")
    print(f"회전 모드: {ROTATE_MODE}")

    result = analyze_gesture(
        video_path=video_path,
        smoothing_window=SMOOTHING_WINDOW,
        show_video=SHOW_VIDEO,
        rotate_mode=ROTATE_MODE,
        preview_max_width=PREVIEW_MAX_WIDTH,
        draw_landmarks=DRAW_LANDMARKS,
    )

    print("=== 손동작 분석 결과 ===")
    print(f"총 처리 프레임 수: {result['total_frames']}")
    print("제스처별 비율(%):")
    for key, val in result['gesture_ratio'].items():
        print(f"  {GESTURE_LABELS_KO.get(key, key)}: {val}%")
    print(f"손동작 점수:     {result['gesture_score']}")
    print(f"손동작 피드백:   {result['gesture_feedback']}")
    print(f"손동작 감지여부: {result['gesture_detected']}")
    print(f"한손 발표 모드:  {'✅ 감지됨 (한 손으로 자료를 들고 발표)' if result['one_hand_mode'] else '❌ 미감지 (양손 자유 발표)'}")
