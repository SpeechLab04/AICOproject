import cv2
import mediapipe as mp
from collections import deque
import os

mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VIDEO_PATH = os.path.join(BASE_DIR, "video", "test_video.mp4")

ROTATE_MODE = "ccw"
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

    left_eye_outer = landmarks[33]
    left_eye_inner = landmarks[133]

    right_eye_inner = landmarks[362]
    right_eye_outer = landmarks[263]

    left_iris_indices = [468, 469, 470, 471, 472]
    right_iris_indices = [473, 474, 475, 476, 477]

    left_eye_center_x, _ = get_eye_center(left_eye_outer, left_eye_inner)
    left_iris_center_x, _ = get_avg_point(landmarks, left_iris_indices)

    right_eye_center_x, _ = get_eye_center(right_eye_inner, right_eye_outer)
    right_iris_center_x, _ = get_avg_point(landmarks, right_iris_indices)

    left_eye_width = abs(left_eye_inner.x - left_eye_outer.x)
    right_eye_width = abs(right_eye_outer.x - right_eye_inner.x)

    if left_eye_width == 0 or right_eye_width == 0:
        return None

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
    """
    교실 대면 발표 기준:
      - 좌·중앙·우 모두 청중이므로 어디를 봐도 기본적으로 좋음
      - 좌우를 골고루 스캔할수록 보너스
      - 한쪽만 치우치면 패널티
    """
    center = gaze_ratio.get("center", 0)
    left   = gaze_ratio.get("left",   0)
    right  = gaze_ratio.get("right",  0)
    lr     = left + right

    score = 50  # 기본 베이스

    # 1. 좌우 스캔 비율 보너스 (20~60%가 이상적)
    if 20 <= lr <= 60:
        score += 20
    elif 10 <= lr < 20:
        score += 10
    elif lr < 10:
        score += 2   # 정면 위주도 나쁘진 않지만 소소한 가산만

    # 2. 좌우 균형 보너스
    if lr > 5:
        balance = min(left, right) / (max(left, right) + 1e-6)
        if balance >= 0.4:
            score += 15
        elif balance >= 0.2:
            score += 8

    # 3. 극단적 한쪽 치우침 패널티
    if lr > 5:
        imbalance = max(left, right) / (min(left, right) + 1e-6)
        if imbalance >= 4.0:
            score -= min((imbalance - 4.0) * 4, 15)

    return max(0, min(100, round(score)))


def get_gaze_feedback(gaze_ratio):
    center = gaze_ratio.get("center", 0)
    left   = gaze_ratio.get("left",   0)
    right  = gaze_ratio.get("right",  0)
    lr     = left + right

    if lr > 5:
        imbalance = max(left, right) / (min(left, right) + 1e-6)
    else:
        imbalance = 1.0

    dominant = "오른쪽" if right > left else "왼쪽"
    other    = "왼쪽"   if right > left else "오른쪽"

    if lr > 60:
        return (
            f"좌우로 시선을 자주 움직였어요. "
            f"정면 응시 비율이 {int(center)}%로 낮아요. 정면을 더 자주 바라봐야 집중감을 줄 수 있어요. "
            f"목표는 정면 40% 이상, 좌우 합쳐서 20~60%예요."
        )
    elif lr >= 40 and imbalance < 1.5:
        return (
            f"눈동자를 왼쪽·정면·오른쪽으로 매우 활발하고 균형 있게 움직였어요. "
            f"청중 전체와 적극적으로 눈을 맞추는 이상적인 시선이에요! 지금처럼 유지해봐요."
        )
    elif lr >= 20 and imbalance < 1.5:
        return (
            f"눈동자가 좌우 {int(lr)}%, 정면 {int(center)}%로 골고루 움직였어요. "
            f"청중 전체와 눈을 맞추는 안정적인 시선이에요! 지금처럼 유지해봐요."
        )
    elif lr >= 20 and imbalance < 3:
        return (
            f"좌우 눈 맞춤은 {int(lr)}%로 충분한데 {dominant} 쪽으로 약간 치우쳐 있어요. "
            f"{other} 청중에게도 조금 더 시선을 보내보세요. 목표는 좌우 균형 있게 각 10% 이상이에요."
        )
    elif lr >= 20 and imbalance >= 3:
        return (
            f"눈동자가 {dominant} 방향으로 많이 치우쳐 있었어요({int(max(left, right))}%). "
            f"{other} 청중과도 눈을 맞춰야 발표가 균형 있어 보여요. "
            f"목표는 좌우 눈 맞춤 각 10% 이상이에요."
        )
    elif lr >= 10 and imbalance < 2:
        return (
            f"좌우 눈 맞춤이 {int(lr)}%로 조금 적어요. "
            f"한 문장 말하고 나면 왼쪽이나 오른쪽으로 시선을 한 번씩 옮겨보세요. "
            f"목표는 좌우 눈 맞춤 합쳐서 20% 이상이에요."
        )
    elif lr >= 10 and imbalance >= 2:
        return (
            f"좌우 눈 맞춤이 {int(lr)}%로 적고 {dominant} 쪽으로 치우쳐 있어요. "
            f"왼쪽·정면·오른쪽을 고르게 바라보는 연습을 해보세요. "
            f"목표는 좌우 눈 맞춤 합쳐서 20% 이상, 균형 있게예요."
        )
    elif lr >= 5:
        return (
            f"눈동자가 정면에 거의 고정되어 있어요. 좌우 눈 맞춤이 {int(lr)}%에 불과해요. "
            f"발표 중 왼쪽·오른쪽 청중에게도 시선을 보내주세요. "
            f"목표는 좌우 눈 맞춤 합쳐서 20% 이상이에요."
        )
    else:
        return (
            f"눈동자가 정면에 완전히 고정되어 있어요. "
            f"카메라만 바라보면 특정 청중과만 소통하는 것처럼 보일 수 있어요. "
            f"왼쪽·오른쪽 청중에게도 시선을 자연스럽게 보내보세요. "
            f"목표는 좌우 눈 맞춤 합쳐서 20% 이상이에요."
        )


def format_time(seconds):
    minutes = int(seconds // 60)
    seconds = int(seconds % 60)
    return f"{minutes:02d}:{seconds:02d}"


def get_segment_index(frame_index, total_frames, segment_count=10):
    if total_frames <= 0:
        return 0

    ratio = frame_index / total_frames
    index = int(ratio * segment_count)

    if index >= segment_count:
        index = segment_count - 1

    return index


def make_ratio(counts, total):
    if total <= 0:
        return {
            "left": 0,
            "right": 0,
            "center": 0,
        }

    return {
        key: round((value / total) * 100)
        for key, value in counts.items()
    }


def analyze_gaze(
    video_path,
    smoothing_window=5,
    show_video=True,
    rotate_mode="none",
    preview_max_width=480,
    draw_landmarks=True,
    segment_count=10,
):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError(f"비디오를 열 수 없습니다: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    gaze_counts = {
        "left": 0,
        "right": 0,
        "center": 0
    }

    segment_counts = [
        {
            "left": 0,
            "right": 0,
            "center": 0
        }
        for _ in range(segment_count)
    ]

    segment_totals = [0 for _ in range(segment_count)]

    total_frames = 0
    frame_index = 0

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

            frame_index += 1

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

                    segment_index = get_segment_index(
                        frame_index,
                        total_video_frames,
                        segment_count
                    )

                    segment_counts[segment_index][stable_gaze] += 1
                    segment_totals[segment_index] += 1

                if draw_landmarks:
                    key_points = [
                        33, 133, 362, 263,
                        468, 469, 470, 471, 472,
                        473, 474, 475, 476, 477
                    ]

                    for idx in key_points:
                        draw_point(
                            frame,
                            face_landmarks,
                            idx,
                            color=(0, 255, 0),
                            radius=2
                        )

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

                preview = resize_for_preview(
                    frame,
                    max_width=preview_max_width
                )

                cv2.imshow("Gaze Analysis", preview)

                key = cv2.waitKey(1) & 0xFF
                if key == 27 or key == ord("q"):
                    break

    cap.release()
    cv2.destroyAllWindows()

    if total_frames == 0:
        raise ValueError("처리된 프레임이 없습니다.")

    gaze_ratio = make_ratio(gaze_counts, total_frames)

    gaze_score = calculate_gaze_score(gaze_ratio)
    gaze_feedback = get_gaze_feedback(gaze_ratio)

    timeline = []

    duration = total_video_frames / fps if fps and fps > 0 else 0

    for i in range(segment_count):
        if segment_count == 1:
            current_time = 0
        else:
            current_time = duration * (i / (segment_count - 1))

        segment_ratio = make_ratio(
            segment_counts[i],
            segment_totals[i]
        )

        segment_score = calculate_gaze_score(segment_ratio)

        timeline.append({
            "time": format_time(current_time),
            "gaze_score": segment_score,
            "gaze_ratio": segment_ratio,
            "detected_frames": segment_totals[i],
        })

    return {
        "total_frames": total_frames,
        "gaze_counts": gaze_counts,
        "gaze_ratio": gaze_ratio,
        "gaze_score": gaze_score,
        "gaze_feedback": gaze_feedback,
        "timeline": timeline,
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
    print(f"timeline: {result['timeline']}")