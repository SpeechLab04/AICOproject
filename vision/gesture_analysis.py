import cv2
import mediapipe as mp
from collections import deque
import os

mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEO_PATH = os.path.join(BASE_DIR, "video", "test_video.mp4")

ROTATE_MODE = "ccw"
SHOW_VIDEO = True
DRAW_LANDMARKS = True
PREVIEW_MAX_WIDTH = 720
SMOOTHING_WINDOW = 7


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
    """tip이 pip보다 위에 있으면(y가 작으면) 펴진 것으로 판단"""
    return lm[tip].y < lm[pip].y


def get_gesture_metrics(multi_hand_landmarks):
    """
    감지된 손 전체에서 제스처 메트릭 추출.
    반환: dict 또는 None
    """
    if not multi_hand_landmarks:
        return None

    hands_data = []

    for hand_lm in multi_hand_landmarks:
        lm = hand_lm.landmark

        # ── 손가락 펴짐 여부 ──
        # 엄지: x축 기준 (손 방향 무관하게 tip과 ip 거리로 근사)
        thumb_ext  = abs(lm[4].x - lm[3].x) > 0.02
        index_ext  = finger_extended(lm, 8,  6)
        middle_ext = finger_extended(lm, 12, 10)
        ring_ext   = finger_extended(lm, 16, 14)
        pinky_ext  = finger_extended(lm, 20, 18)

        extended_fingers = [thumb_ext, index_ext, middle_ext, ring_ext, pinky_ext]
        extended_count = sum(extended_fingers)

        # ── 손목 높이 (y가 작을수록 화면 위쪽 = 손이 올라간 상태) ──
        wrist_y = lm[0].y  # 0~1 정규화값

        hands_data.append({
            "extended_count": extended_count,
            "index_ext": index_ext,
            "middle_ext": middle_ext,
            "ring_ext": ring_ext,
            "pinky_ext": pinky_ext,
            "thumb_ext": thumb_ext,
            "wrist_y": wrist_y,
        })

    hand_count = len(hands_data)

    # 양손 감지 시 평균, 단일 손이면 그대로
    avg_extended = sum(h["extended_count"] for h in hands_data) / hand_count
    avg_wrist_y  = sum(h["wrist_y"] for h in hands_data) / hand_count

    # 대표 손(첫 번째) 기준으로 손가락 상태 사용
    primary = hands_data[0]

    return {
        "hand_count": hand_count,
        "extended_count": primary["extended_count"],
        "avg_extended": avg_extended,
        "index_ext": primary["index_ext"],
        "middle_ext": primary["middle_ext"],
        "ring_ext": primary["ring_ext"],
        "pinky_ext": primary["pinky_ext"],
        "thumb_ext": primary["thumb_ext"],
        "wrist_y": avg_wrist_y,
    }


def classify_gesture(metrics):
    """
    메트릭 → 제스처 레이블 분류.

    레이블 정의:
      pointing   : 검지만 펴짐 → 자료/화면 가리키기
      open_hand  : 4~5개 손가락 펴짐 → 강조·설명 제스처
      active     : 2~3개 손가락 펴짐 → 일반적인 손 사용
      neutral    : 손 미감지 또는 모두 접힘
    """
    if metrics is None:
        return "neutral"

    ec = metrics["extended_count"]
    idx = metrics["index_ext"]
    mid = metrics["middle_ext"]
    rng = metrics["ring_ext"]
    pnk = metrics["pinky_ext"]

    # pointing: 검지만 펴지고 나머지는 접힘
    if idx and not mid and not rng and not pnk:
        return "pointing"

    # open_hand: 손가락 4개 이상 펴짐
    if ec >= 4:
        return "open_hand"

    # active: 2~3개 펴짐
    if ec >= 2:
        return "active"

    return "neutral"


def calculate_gesture_score(gesture_ratio, avg_wrist_y_series):
    """
    손동작 점수 계산 (0~100).

    채점 기준:
      - pointing + open_hand + active 비율이 높을수록 가산
      - 완전 neutral(손을 전혀 안 씀) 비율이 높으면 감점
      - 손 높이: 너무 낮으면(아래로 늘어뜨림) 소폭 감점
    """
    pointing   = gesture_ratio.get("pointing", 0)
    open_hand  = gesture_ratio.get("open_hand", 0)
    active     = gesture_ratio.get("active", 0)
    neutral    = gesture_ratio.get("neutral", 0)

    gesture_use = pointing + open_hand + active  # 손을 사용한 비율

    score = 50

    # 손 사용 비율 가산 (최대 +35)
    score += min(gesture_use * 0.35, 35)

    # pointing은 추가 가산 (자료 지시 → 명확한 의도 표현)
    score += min(pointing * 0.15, 10)

    # neutral 과다 감점
    if neutral > 60:
        score -= (neutral - 60) * 0.3

    # 손 높이 평균: 0.7 이상이면 손이 너무 내려가 있음 (화면 아래쪽)
    if avg_wrist_y_series:
        avg_y = sum(avg_wrist_y_series) / len(avg_wrist_y_series)
        if avg_y > 0.75:
            score -= 10
        elif avg_y > 0.65:
            score -= 5

    return max(0, min(100, round(score)))


def get_gesture_feedback(gesture_ratio, gesture_score):
    pointing  = gesture_ratio.get("pointing", 0)
    open_hand = gesture_ratio.get("open_hand", 0)
    active    = gesture_ratio.get("active", 0)
    neutral   = gesture_ratio.get("neutral", 0)

    gesture_use = pointing + open_hand + active

    if neutral > 70:
        return "손 제스처가 거의 없어 발표가 다소 경직되어 보일 수 있습니다. 설명할 때 자연스럽게 손을 활용해 보세요."
    elif gesture_score >= 80:
        return "손 제스처를 적극적으로 활용하여 발표 내용을 효과적으로 전달하고 있습니다."
    elif gesture_score >= 65:
        return "손 제스처를 적절히 사용하고 있습니다. 핵심 내용에서 조금 더 강조 제스처를 활용하면 좋습니다."
    elif pointing > 20:
        return "자료를 가리키는 제스처가 많습니다. 설명 제스처(손바닥 펼치기 등)도 함께 활용해 보세요."
    else:
        return "손 제스처를 조금 더 다양하게 사용하면 청중의 집중도를 높일 수 있습니다."


def analyze_gesture(
    video_path,
    smoothing_window=7,
    show_video=True,
    rotate_mode="none",
    preview_max_width=720,
    draw_landmarks=True,
):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"비디오를 열 수 없습니다: {video_path}")

    gesture_counts = {
        "pointing":  0,
        "open_hand": 0,
        "active":    0,
        "neutral":   0,
    }

    total_frames = 0
    gesture_buffer = deque(maxlen=smoothing_window)
    wrist_y_log = []   # 손 높이 추이 기록

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
            results = hands.process(rgb_frame)

            metrics = get_gesture_metrics(results.multi_hand_landmarks)
            gesture = classify_gesture(metrics)

            gesture_buffer.append(gesture)
            stable_gesture = max(set(gesture_buffer), key=gesture_buffer.count)
            gesture_counts[stable_gesture] += 1

            if metrics is not None:
                wrist_y_log.append(metrics["wrist_y"])

            if draw_landmarks and results.multi_hand_landmarks:
                for hand_lm in results.multi_hand_landmarks:
                    mp_drawing.draw_landmarks(
                        frame,
                        hand_lm,
                        mp_hands.HAND_CONNECTIONS,
                        mp_drawing_styles.get_default_hand_landmarks_style(),
                        mp_drawing_styles.get_default_hand_connections_style(),
                    )

            if show_video:
                label_color = {
                    "pointing":  (0, 200, 255),
                    "open_hand": (0, 255, 100),
                    "active":    (255, 200, 0),
                    "neutral":   (180, 180, 180),
                }.get(stable_gesture, (255, 255, 255))

                cv2.putText(
                    frame,
                    f"Gesture: {stable_gesture}",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1.0,
                    label_color,
                    2,
                )

                if metrics:
                    cv2.putText(frame, f"hands: {metrics['hand_count']}", (20, 78),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)
                    cv2.putText(frame, f"extended: {metrics['extended_count']}/5", (20, 104),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)
                    cv2.putText(frame, f"wrist_y: {metrics['wrist_y']:.2f}", (20, 130),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)

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

    gesture_score = calculate_gesture_score(gesture_ratio, wrist_y_log)
    gesture_feedback = get_gesture_feedback(gesture_ratio, gesture_score)

    return {
        "total_frames":    total_frames,
        "gesture_counts":  gesture_counts,
        "gesture_ratio":   gesture_ratio,
        "gesture_score":   gesture_score,
        "gesture_feedback": gesture_feedback,
    }


if __name__ == "__main__":
    print(f"현재 분석 중인 영상: {VIDEO_PATH}")
    print(f"회전 모드: {ROTATE_MODE}")

    result = analyze_gesture(
        video_path=VIDEO_PATH,
        smoothing_window=SMOOTHING_WINDOW,
        show_video=SHOW_VIDEO,
        rotate_mode=ROTATE_MODE,
        preview_max_width=PREVIEW_MAX_WIDTH,
        draw_landmarks=DRAW_LANDMARKS,
    )

    print("=== 손동작 분석 결과 ===")
    print(f"총 처리 프레임 수: {result['total_frames']}")
    print(f"제스처별 개수: {result['gesture_counts']}")
    print(f"제스처별 비율(%): {result['gesture_ratio']}")
    print(f"손동작 점수: {result['gesture_score']}")
    print(f"손동작 피드백: {result['gesture_feedback']}")