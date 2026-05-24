import cv2
import mediapipe as mp
from collections import deque

mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles


# =========================
# 설정값
# =========================
VIDEO_PATH = "video/test_video.mp4"

# 회전 옵션: "none", "cw", "ccw", "180"
# 지금 네 화면처럼 옆으로 돌아가 있으면 보통 "ccw" 또는 "cw" 중 하나면 맞음
ROTATE_MODE = "ccw"

SHOW_VIDEO = True
DRAW_LANDMARKS = True
DRAW_FULL_MESH = False   # True면 얼굴 전체 랜드마크, False면 핵심 점만 표시
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


def resize_for_preview(frame, max_width=480):
    h, w = frame.shape[:2]

    scale = max_width / w
    new_w = int(w * scale)
    new_h = int(h * scale)

    return cv2.resize(frame, (new_w, new_h))


def draw_point(frame, face_landmarks, idx, color=(0, 255, 255), radius=3):
    h, w = frame.shape[:2]
    x = int(face_landmarks.landmark[idx].x * w)
    y = int(face_landmarks.landmark[idx].y * h)
    cv2.circle(frame, (x, y), radius, color, -1)


def get_face_metrics(face_landmarks):
    lm = face_landmarks.landmark

    # 얼굴 기준점
    nose = lm[1]
    face_left = lm[234]
    face_right = lm[454]
    forehead = lm[10]
    chin = lm[152]

    # 입 관련
    mouth_left = lm[61]
    mouth_right = lm[291]
    upper_lip = lm[13]
    lower_lip = lm[14]

    # 눈 관련
    left_eye_top = lm[159]
    left_eye_bottom = lm[145]
    right_eye_top = lm[386]
    right_eye_bottom = lm[374]

    face_width = abs(face_right.x - face_left.x)
    face_height = abs(chin.y - forehead.y)

    if face_width == 0 or face_height == 0:
        return None

    center_x = (face_left.x + face_right.x) / 2
    x_offset = (nose.x - center_x) / face_width

    mouth_width = abs(mouth_right.x - mouth_left.x) / face_width
    mouth_height = abs(lower_lip.y - upper_lip.y) / face_height

    mouth_center_y = (upper_lip.y + lower_lip.y) / 2
    mouth_corner_avg_y = (mouth_left.y + mouth_right.y) / 2

    # 입꼬리가 위로 올라갈수록 positive 가능성 증가
    corner_lift = (mouth_center_y - mouth_corner_avg_y) / face_height

    left_eye_open = abs(left_eye_bottom.y - left_eye_top.y) / face_height
    right_eye_open = abs(right_eye_bottom.y - right_eye_top.y) / face_height
    eye_open_avg = (left_eye_open + right_eye_open) / 2

    return {
        "x_offset": x_offset,
        "mouth_width": mouth_width,
        "mouth_height": mouth_height,
        "corner_lift": corner_lift,
        "eye_open_avg": eye_open_avg,
        "face_width": face_width,
        "face_height": face_height,
    }


def classify_emotion(face_landmarks):
    """
    지금은 오검출 줄이기 위해 positive / neutral 2단계로 분류
    """

    metrics = get_face_metrics(face_landmarks)
    if metrics is None:
        return "neutral", {}

    x_offset = metrics["x_offset"]
    mouth_width = metrics["mouth_width"]
    mouth_height = metrics["mouth_height"]
    corner_lift = metrics["corner_lift"]
    eye_open_avg = metrics["eye_open_avg"]

    # ---------------------------------------
    # 1) 고개를 많이 돌리면 neutral 처리
    #    (옆얼굴에서 positive 오검출 방지)
    # ---------------------------------------
    if abs(x_offset) > 0.10:
        return "neutral", metrics

    # ---------------------------------------
    # 2) 웃음 판정
    #    핵심: 입꼬리 상승 + 입 가로폭 + 약간의 입 변화
    # ---------------------------------------
    big_smile = (
        mouth_width > 0.32 and
        corner_lift > 0.008 and
        mouth_height > 0.012
    )

    soft_smile = (
        mouth_width > 0.28 and
        corner_lift > 0.003 and
        mouth_height > 0.004
    )

    is_smile = (big_smile or soft_smile) and eye_open_avg > 0.008

    if is_smile:
        return "positive", metrics

    return "neutral", metrics


def calculate_emotion_score(emotion_ratio):
    positive = emotion_ratio.get("positive", 0)
    neutral  = emotion_ratio.get("neutral",  0)

    score = 40                  # 기본 베이스
    score += positive * 0.6    # 미소 비율이 핵심 (최대 +60)
    score += neutral  * 0.1    # 무표정도 약간 인정 (최대 +10)

    return max(0, min(100, round(score)))

def get_emotion_feedback(score, ratio):
    positive = ratio.get("positive", 0)
    neutral  = ratio.get("neutral",  0)

    if score >= 85:
        return (
            f"발표 중 밝은 표정을 {int(positive)}% 유지했어요. "
            f"미소는 청중에게 친근감과 신뢰감을 주는 가장 강력한 도구예요. "
            f"지금처럼 계속 유지해봐요!"
        )
    elif score >= 70:
        return (
            f"밝은 표정이 {int(positive)}% 나왔어요. 조금 더 늘리면 좋겠어요. "
            f"중요한 내용을 말하기 직전에 살짝 미소를 지으면 청중의 집중도를 높일 수 있어요. "
            f"목표는 30% 이상이에요."
        )
    elif score >= 50:
        return (
            f"밝은 표정이 {int(positive)}%로 다소 적어요. 무표정하게 보일 수 있어요. "
            f"발표 전 거울을 보며 미소 짓는 연습을 해보세요. "
            f"입꼬리를 살짝 올리는 것만으로도 인상이 크게 달라져요. 목표는 30% 이상이에요."
        )
    else:
        return (
            f"밝은 표정이 {int(positive)}%로 매우 적어요. 청중에게 긴장된 인상을 줄 수 있어요. "
            f"발표 전 '이' 발음을 5초간 유지하거나, 볼을 부풀렸다 터트리는 표정 스트레칭을 해보세요. "
            f"얼굴 근육이 풀리면 자연스러운 표정이 나와요."
        )


def analyze_emotion(
    video_path,
    smoothing_window=7,
    show_video=True,
    rotate_mode="none",
    preview_max_width=720,
    draw_landmarks=True,
    draw_full_mesh=True
):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError(f"비디오를 열 수 없습니다: {video_path}")

    emotion_counts = {
        "positive": 0,
        "neutral": 0
    }

    total_frames = 0
    emotion_buffer = deque(maxlen=smoothing_window)

    if show_video:
        cv2.namedWindow("Emotion Analysis", cv2.WINDOW_AUTOSIZE)

    with mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as face_mesh:

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame = rotate_frame(frame, rotate_mode)
            total_frames += 1

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)

            stable_emotion = "neutral"
            metrics = {}

            if results.multi_face_landmarks:
                face_landmarks = results.multi_face_landmarks[0]

                # 감정 분류
                emotion, metrics = classify_emotion(face_landmarks)
                emotion_buffer.append(emotion)
                stable_emotion = max(set(emotion_buffer), key=emotion_buffer.count)
                emotion_counts[stable_emotion] += 1

                if draw_landmarks:
                    if draw_full_mesh:
                        mp_drawing.draw_landmarks(
                            image=frame,
                            landmark_list=face_landmarks,
                            connections=mp_face_mesh.FACEMESH_TESSELATION,
                            landmark_drawing_spec=None,
                            connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style()
                        )
                    else:
                        key_points = [1, 10, 152, 234, 454, 61, 291, 13, 14, 159, 145, 386, 374]
                        for idx in key_points:
                            draw_point(frame, face_landmarks, idx)

                    # 핵심 포인트는 더 강조
                    highlight_points = [61, 291, 13, 14, 1, 234, 454]
                    for idx in highlight_points:
                        draw_point(frame, face_landmarks, idx, color=(0, 255, 255), radius=4)

            else:
                emotion_counts["neutral"] += 1

            if show_video:
                y = 35
                cv2.putText(
                    frame,
                    f"Emotion: {stable_emotion}",
                    (20, y),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.9,
                    (0, 255, 0),
                    2
                )

                y += 35
                if metrics:
                    cv2.putText(
                        frame,
                        f"x_offset: {metrics['x_offset']:.3f}",
                        (20, y),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (255, 255, 255),
                        2
                    )
                    y += 28
                    cv2.putText(
                        frame,
                        f"mouth_width: {metrics['mouth_width']:.3f}",
                        (20, y),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (255, 255, 255),
                        2
                    )
                    y += 28
                    cv2.putText(
                        frame,
                        f"mouth_height: {metrics['mouth_height']:.3f}",
                        (20, y),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (255, 255, 255),
                        2
                    )
                    y += 28
                    cv2.putText(
                        frame,
                        f"corner_lift: {metrics['corner_lift']:.3f}",
                        (20, y),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (255, 255, 255),
                        2
                    )

                preview = resize_for_preview(frame, max_width=480)
                cv2.imshow("Emotion Analysis", preview)

                key = cv2.waitKey(20) & 0xFF
                if key == 27 or key == ord("q"):  # ESC 또는 q 종료
                    break

    cap.release()
    cv2.destroyAllWindows()

    if total_frames == 0:
        raise ValueError("처리된 프레임이 없습니다.")

    emotion_ratio = {
        key: round((value / total_frames) * 100, 2)
        for key, value in emotion_counts.items()
    }

    emotion_score = calculate_emotion_score(emotion_ratio)
    emotion_feedback = get_emotion_feedback(emotion_score, emotion_ratio)

    return {
        "total_frames": total_frames,
        "emotion_counts": emotion_counts,
        "emotion_ratio": emotion_ratio,
        "emotion_score": emotion_score,
        "emotion_feedback": emotion_feedback
    }


if __name__ == "__main__":
    print(f"현재 분석 중인 영상: {VIDEO_PATH}")
    print(f"회전 모드: {ROTATE_MODE}")

    result = analyze_emotion(
        video_path=VIDEO_PATH,
        smoothing_window=SMOOTHING_WINDOW,
        show_video=SHOW_VIDEO,
        rotate_mode=ROTATE_MODE,
        preview_max_width=PREVIEW_MAX_WIDTH,
        draw_landmarks=DRAW_LANDMARKS,
        draw_full_mesh=DRAW_FULL_MESH
    )

    print("=== 표정 분석 결과 ===")
    print(f"총 처리 프레임 수: {result['total_frames']}")
    print(f"표정별 개수: {result['emotion_counts']}")
    print(f"표정별 비율(%): {result['emotion_ratio']}")
    print(f"표정 점수: {result['emotion_score']}")
    print(f"표정 피드백: {result['emotion_feedback']}")