import cv2
import mediapipe as mp
from collections import deque
import os

mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEO_PATH = os.path.join(BASE_DIR, "video", "test_video.mp4")

ROTATE_MODE = "ccw"   # "none", "cw", "ccw", "180"
SHOW_VIDEO = True
DRAW_LANDMARKS = True
PREVIEW_MAX_WIDTH = 480
SMOOTHING_WINDOW = 5


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
    if w > max_width:
        scale = max_width / w
        new_w = int(w * scale)
        new_h = int(h * scale)
        frame = cv2.resize(frame, (new_w, new_h))
    return frame


def draw_point(frame, face_landmarks, idx, color=(0, 255, 0), radius=2):
    h, w = frame.shape[:2]
    x = int(face_landmarks.landmark[idx].x * w)
    y = int(face_landmarks.landmark[idx].y * h)
    cv2.circle(frame, (x, y), radius, color, -1)


def get_eye_center(p1, p2):
    return (p1.x + p2.x) / 2, (p1.y + p2.y) / 2


def get_avg_point(landmarks, indices):
    x = sum(landmarks[i].x for i in indices) / len(indices)
    y = sum(landmarks[i].y for i in indices) / len(indices)
    return x, y


def get_gaze_metrics(face_landmarks):
    landmarks = face_landmarks.landmark

    # 왼쪽 눈 양 끝
    left_eye_outer = landmarks[33]
    left_eye_inner = landmarks[133]

    # 오른쪽 눈 양 끝
    right_eye_inner = landmarks[362]
    right_eye_outer = landmarks[263]

    # 홍채(iris) 중심 계산용
    left_iris_indices = [468, 469, 470, 471, 472]
    right_iris_indices = [473, 474, 475, 476, 477]

    # 왼쪽 눈 중심 / 홍채 중심
    left_eye_center_x, _ = get_eye_center(left_eye_outer, left_eye_inner)
    left_iris_center_x, _ = get_avg_point(landmarks, left_iris_indices)

    # 오른쪽 눈 중심 / 홍채 중심
    right_eye_center_x, _ = get_eye_center(right_eye_inner, right_eye_outer)
    right_iris_center_x, _ = get_avg_point(landmarks, right_iris_indices)

    # 각 눈 너비
    left_eye_width = abs(left_eye_inner.x - left_eye_outer.x)
    right_eye_width = abs(right_eye_outer.x - right_eye_inner.x)

    if left_eye_width == 0 or right_eye_width == 0:
        return None

    # 눈 중심 대비 홍채 중심의 상대 위치
    left_offset = (left_iris_center_x - left_eye_center_x) / left_eye_width
    right_offset = (right_iris_center_x - right_eye_center_x) / right_eye_width

    avg_offset = (left_offset + right_offset) / 2

    return {
        "left_offset": left_offset,
        "right_offset": right_offset,
        "avg_offset": avg_offset
    }


def classify_gaze(avg_offset):
    left_threshold = -0.08
    right_threshold = 0.08

    if avg_offset < left_threshold:
        return "left"
    elif avg_offset > right_threshold:
        return "right"
    return "center"


def calculate_gaze_score(gaze_ratio):
    center = gaze_ratio.get("center", 0)
    left   = gaze_ratio.get("left",   0)
    right  = gaze_ratio.get("right",  0)

    lr = left + right

    # ── 구간 기반 기본 점수 (center 비율 기준) ──
    if center > 70:
        score = 88
    elif center > 55:
        score = 73
    elif center > 40:
        score = 57
    else:
        score = 38

    # ── 세부 보정 ──
    # 좌우 적당히 → 청중 고르게 바라보는 자연스러운 시선
    if 10 <= lr <= 25:
        score += 5
    elif lr > 45:
        score -= 10

    return max(0, min(100, round(score)))


def get_gaze_feedback(gaze_ratio):
    center = gaze_ratio.get("center", 0)
    left = gaze_ratio.get("left", 0)
    right = gaze_ratio.get("right", 0)

    lr = left + right

    if center >= 70:
        return "정면 시선을 비교적 안정적으로 유지하고 있습니다."
    elif 10 <= lr <= 30 and center >= 50:
        return "정면을 유지하면서도 좌우로 자연스럽게 시선을 분산하고 있습니다."
    elif lr > 40:
        return "좌우 시선 이동이 다소 많아 시선이 산만해 보일 수 있습니다."
    else:
        return "전반적으로 무난하지만 시선을 조금 더 안정적으로 유지하면 좋습니다."


def analyze_gaze(
    video_path,
    smoothing_window=5,
    show_video=True,
    rotate_mode="none",
    preview_max_width=480,
    draw_landmarks=True
):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError(f"비디오를 열 수 없습니다: {video_path}")

    gaze_counts = {
        "left": 0,
        "right": 0,
        "center": 0
    }

    total_frames = 0
    gaze_buffer = deque(maxlen=smoothing_window)

    if show_video:
        cv2.namedWindow("Gaze Analysis", cv2.WINDOW_AUTOSIZE)

    with mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
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

            stable_gaze = "center"
            metrics = None

            if results.multi_face_landmarks:
                face_landmarks = results.multi_face_landmarks[0]
                metrics = get_gaze_metrics(face_landmarks)

                if metrics is not None:
                    gaze = classify_gaze(metrics["avg_offset"])
                    gaze_buffer.append(gaze)
                    stable_gaze = max(set(gaze_buffer), key=gaze_buffer.count)
                    gaze_counts[stable_gaze] += 1

                if draw_landmarks:
                    key_points = [
                        33, 133, 362, 263,
                        468, 469, 470, 471, 472,
                        473, 474, 475, 476, 477
                    ]
                    for idx in key_points:
                        draw_point(frame, face_landmarks, idx, color=(0, 255, 0), radius=2)
            else:
                gaze_counts["center"] += 1

            if show_video:
                cv2.putText(
                    frame,
                    f"Gaze: {stable_gaze}",
                    (20, 35),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.9,
                    (0, 255, 0),
                    2
                )

                if metrics is not None:
                    cv2.putText(
                        frame,
                        f"avg_offset: {metrics['avg_offset']:.3f}",
                        (20, 70),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (255, 255, 255),
                        2
                    )
                    cv2.putText(
                        frame,
                        f"left_offset: {metrics['left_offset']:.3f}",
                        (20, 98),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55,
                        (255, 255, 255),
                        2
                    )
                    cv2.putText(
                        frame,
                        f"right_offset: {metrics['right_offset']:.3f}",
                        (20, 126),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55,
                        (255, 255, 255),
                        2
                    )

                preview = resize_for_preview(frame, max_width=preview_max_width)
                cv2.imshow("Gaze Analysis", preview)

                key = cv2.waitKey(1) & 0xFF
                if key == 27 or key == ord("q"):
                    break

    cap.release()
    cv2.destroyAllWindows()

    if total_frames == 0:
        raise ValueError("처리된 프레임이 없습니다.")

    gaze_ratio = {
        key: round((value / total_frames) * 100, 2)
        for key, value in gaze_counts.items()
    }

    gaze_score = calculate_gaze_score(gaze_ratio)
    gaze_feedback = get_gaze_feedback(gaze_ratio)

    return {
        "total_frames": total_frames,
        "gaze_counts": gaze_counts,
        "gaze_ratio": gaze_ratio,
        "gaze_score": gaze_score,
        "gaze_feedback": gaze_feedback
    }


if __name__ == "__main__":
    print(f"현재 분석 중인 영상: {VIDEO_PATH}")

    result = analyze_gaze(
        video_path=VIDEO_PATH,
        smoothing_window=SMOOTHING_WINDOW,
        show_video=SHOW_VIDEO,
        rotate_mode=ROTATE_MODE,
        preview_max_width=PREVIEW_MAX_WIDTH,
        draw_landmarks=DRAW_LANDMARKS
    )

    print("=== 시선 방향 분석 결과 ===")
    print(f"총 처리 프레임 수: {result['total_frames']}")
    print(f"시선별 개수: {result['gaze_counts']}")
    print(f"시선별 비율(%): {result['gaze_ratio']}")
    print(f"시선 점수: {result['gaze_score']}")
    print(f"시선 피드백: {result['gaze_feedback']}")