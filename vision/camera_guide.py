import cv2
import mediapipe as mp
import os

mp_face_mesh = mp.solutions.face_mesh
mp_hands     = mp.solutions.hands

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── 거리 판별 기준 (얼굴 너비 / 프레임 너비 비율) ──
FACE_TOO_CLOSE = 0.40   # 40% 이상 → 너무 가까움  (약 0.5m 이내)
FACE_TOO_FAR   = 0.08   # 8% 이하  → 너무 멀음    (약 3m 이상)
# 8% ~ 40% → 적당 (약 0.8m ~ 3m)

SAMPLE_FRAMES          = 60    # 분석할 최대 프레임 수 (약 2초)
HAND_VISIBLE_THRESHOLD = 0.25  # 25% 이상 프레임에서 손이 보여야 '손 감지'로 판정


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


# =========================
# 메인 검사 함수
# =========================
def check_camera_guide(video_path, rotate_mode="none"):
    """
    영상 앞부분(최대 SAMPLE_FRAMES 프레임)을 샘플링해
    촬영 거리·구도 적절성을 검증.

    Returns:
        dict: {
            "distance":      "너무 가까움" | "적당" | "너무 멀음" | "얼굴 미감지",
            "face_detected": bool,
            "hand_visible":  bool,
            "face_ratio":    float,   # 얼굴 너비 / 프레임 너비 평균 비율
            "suggestion":    str,     # 사용자에게 보여줄 안내 메시지
            "is_valid":      bool,    # 분석 진행 가능 여부
        }
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "distance":      "영상 오류",
            "face_detected": False,
            "hand_visible":  False,
            "face_ratio":    0.0,
            "suggestion":    "영상을 열 수 없습니다. 파일 경로를 확인해 주세요.",
            "is_valid":      False,
        }

    face_ratios         = []
    hand_detected_count = 0
    total_sampled       = 0

    with mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=False,
        min_detection_confidence=0.3,
        min_tracking_confidence=0.3,
    ) as face_mesh, mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as hands:

        while total_sampled < SAMPLE_FRAMES:
            ret, frame = cap.read()
            if not ret:
                break

            frame = rotate_frame(frame, rotate_mode)
            total_sampled += 1

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # ── 얼굴 크기 측정 ──
            face_result = face_mesh.process(rgb)
            if face_result.multi_face_landmarks:
                lm = face_result.multi_face_landmarks[0].landmark
                face_left  = lm[234].x
                face_right = lm[454].x
                face_ratio = abs(face_right - face_left)
                face_ratios.append(face_ratio)

            # ── 손 감지 여부 ──
            hand_result = hands.process(rgb)
            if hand_result.multi_hand_landmarks:
                hand_detected_count += 1

    cap.release()

    # ── 얼굴 미감지 ──
    if total_sampled == 0 or len(face_ratios) == 0:
        return {
            "distance":      "얼굴 미감지",
            "face_detected": False,
            "hand_visible":  False,
            "face_ratio":    0.0,
            "suggestion":    "얼굴이 감지되지 않았습니다. 카메라 정면을 바라보고 조명을 밝게 해주세요.",
            "is_valid":      False,
        }

    avg_face_ratio = sum(face_ratios) / len(face_ratios)
    face_detected  = (len(face_ratios) / total_sampled) >= 0.5
    hand_visible   = (hand_detected_count / total_sampled) >= HAND_VISIBLE_THRESHOLD

    # ── 거리 판별 ──
    if avg_face_ratio > FACE_TOO_CLOSE:
        distance   = "너무 가까움"
        suggestion = (
            "카메라와 너무 가깝습니다. "
            "상체 전체가 화면에 들어오도록 1~1.3m 거리를 유지해 주세요."
        )
        is_valid = False

    elif avg_face_ratio < FACE_TOO_FAR:
        distance   = "너무 멀음"
        suggestion = (
            "카메라와 너무 멉니다. "
            "얼굴과 상체가 잘 보이도록 1~1.3m 거리를 유지해 주세요."
        )
        is_valid = False

    else:
        distance = "적당"
        is_valid = True
        if not hand_visible:
            suggestion = (
                "촬영 거리는 적당합니다. "
                "손동작 분석을 위해 손이 화면에 보이도록 위치를 조정해 주세요."
            )
        else:
            suggestion = "촬영 거리와 구도가 적절합니다. 분석을 시작합니다."

    return {
        "distance":      distance,
        "face_detected": face_detected,
        "hand_visible":  hand_visible,
        "face_ratio":    round(avg_face_ratio, 3),
        "suggestion":    suggestion,
        "is_valid":      is_valid,
    }


if __name__ == "__main__":
    import sys
    video_path  = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE_DIR, "video", "test_video.mp4")
    rotate_mode = sys.argv[2] if len(sys.argv) > 2 else "none"
    show_video  = sys.argv[3] == "show" if len(sys.argv) > 3 else False

    print("=== 촬영 가이드라인 검사 ===")
    print(f"영상: {video_path}\n")

    # show_video 모드: 영상 프레임 직접 확인
    if show_video:
        cap = cv2.VideoCapture(video_path)
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame = rotate_frame(frame, rotate_mode)
            cv2.imshow("Camera Guide Preview (ESC to exit)", frame)
            if cv2.waitKey(30) & 0xFF == 27:
                break
        cap.release()
        cv2.destroyAllWindows()

    result = check_camera_guide(video_path, rotate_mode=rotate_mode)

    print(f"거리 판정:   {result['distance']}")
    print(f"얼굴 감지:   {'✅' if result['face_detected'] else '❌'}")
    print(f"손 감지:     {'✅' if result['hand_visible'] else '❌'}")
    print(f"얼굴 비율:   {result['face_ratio']} (기준: 0.08 ~ 0.40)")
    print(f"분석 가능:   {'✅ 가능' if result['is_valid'] else '❌ 불가'}")
    print(f"\n안내 메시지: {result['suggestion']}")
