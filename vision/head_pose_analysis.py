import cv2
import mediapipe as mp
from collections import deque
import sys

mp_face_mesh = mp.solutions.face_mesh


def get_head_metrics(landmarks):
    nose = landmarks[1]
    left_face = landmarks[234]
    right_face = landmarks[454]
    top_face = landmarks[10]
    chin = landmarks[152]

    center_x = (left_face.x + right_face.x) / 2
    face_width = right_face.x - left_face.x
    face_height = chin.y - top_face.y

    if face_width <= 0 or face_height <= 0:
        return None, None

    x_offset = (nose.x - center_x) / face_width
    nose_relative_y = (nose.y - top_face.y) / face_height

    return x_offset, nose_relative_y


def classify_head_direction(avg_x_offset, avg_y_ratio):
    front_x_threshold = 0.18
    up_threshold = 0.44
    down_threshold = 0.60

    if avg_x_offset > front_x_threshold:
        return "right"
    elif avg_x_offset < -front_x_threshold:
        return "left"

    if avg_y_ratio < up_threshold:
        return "up"
    elif avg_y_ratio > down_threshold:
        return "down"

    return "front"


def calculate_head_score(ratios):
    front = ratios.get("front", 0)
    left  = ratios.get("left",  0)
    right = ratios.get("right", 0)
    up    = ratios.get("up",    0)
    down  = ratios.get("down",  0)

    lr    = left + right
    score = 100

    # 1. 정면 비율: 50% 미만 감점, 80% 초과도 감점 (정면만 보면 로봇같음)
    if front < 50:
        score -= (50 - front) * 1.5
    elif front > 80:
        score -= (front - 80) * 1.0

    # 2. 아래 보기: 원고 의존 → 강한 감점
    score -= down * 1.5

    # 3. 위 보기: 약한 감점
    score -= up * 0.5

    # 4. 좌우 스캔: 15-35% 범위 보너스, 너무 없어도 감점
    if 15 <= lr <= 35:
        score += 5
    elif lr < 10:
        score -= (10 - lr) * 0.5   # 좌우 스캔 거의 없으면 감점
    elif lr > 45:
        score -= (lr - 45) * 0.5

    # 5. 좌우 불균형 패널티: 한쪽이 다른 쪽의 3배 이상이면 감점
    if lr > 5:
        imbalance = max(left, right) / (min(left, right) + 1e-6)
        if imbalance >= 3.0:
            score -= min((imbalance - 3.0) * 3, 10)

    return max(0, min(100, round(score)))


def get_head_feedback(ratios):
    front = ratios.get("front", 0)
    left  = ratios.get("left",  0)
    right = ratios.get("right", 0)
    down  = ratios.get("down",  0)
    up    = ratios.get("up",    0)

    lr = left + right

    if down >= 20:
        return (
            f"발표 중 아래를 {down}% 보셨어요. 청중 입장에서 자신감이 없어 보일 수 있어요. "
            f"원고 대신 핵심 키워드만 메모해두고 카메라를 보며 말하는 연습을 해보세요. "
            f"목표는 아래 보기 10% 이하예요."
        )
    elif front >= 65 and 15 <= lr <= 35:
        return (
            f"정면을 {front}% 유지하면서 좌우 청중도 {lr}% 고르게 바라봤어요. "
            f"청중 전체와 소통하는 이상적인 발표 자세예요! 지금처럼 계속 유지해봐요."
        )
    elif front >= 70 and down <= 10:
        return (
            f"정면을 {front}% 안정적으로 유지했어요. "
            f"다만 좌우 청중을 바라본 비율이 {lr}%로 조금 적어요. "
            f"발표 중 왼쪽 → 정면 → 오른쪽 순으로 시선을 이동하면 더 많은 청중과 소통하는 느낌을 줄 수 있어요. "
            f"목표는 좌우 합쳐서 15~35%예요."
        )
    elif front < 40:
        return (
            f"정면을 유지한 비율이 {front}%로 낮아 다소 산만해 보일 수 있어요. "
            f"한 문장을 말하는 동안 카메라를 고정해서 바라보는 연습을 해보세요. "
            f"목표는 정면 50% 이상이에요."
        )
    elif up >= 15:
        return (
            f"위를 바라본 비율이 {up}%로 다소 높아요. 내용을 기억하려고 위를 보는 경우가 많은데, "
            f"발표 전 내용을 충분히 숙지하면 자연스럽게 카메라를 바라볼 수 있어요. "
            f"목표는 위 보기 10% 이하예요."
        )
    elif lr < 10:
        return (
            f"정면을 {front}% 잘 유지했지만, 좌우 청중을 바라본 비율이 {lr}%로 적어요. "
            f"발표 중 왼쪽 → 정면 → 오른쪽 순으로 시선을 이동하면 "
            f"청중 전체가 집중하는 발표가 돼요. 목표는 좌우 합쳐서 15~35%예요."
        )
    else:
        return (
            f"정면 {front}%, 좌우 {lr}%, 아래 {down}%로 전반적으로 안정적인 자세예요. "
            f"좌우 청중을 조금 더 균형 있게 바라보면 더 좋은 인상을 줄 수 있어요."
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
            "up": 0,
            "down": 0,
            "front": 0,
        }

    return {
        key: round((value / total) * 100)
        for key, value in counts.items()
    }


def analyze_head_pose(video_path, buffer_size=15, show_video=True, segment_count=10):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("영상을 열 수 없습니다.")
        return None

    fps = cap.get(cv2.CAP_PROP_FPS)
    total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    x_offset_buffer = deque(maxlen=buffer_size)
    y_ratio_buffer = deque(maxlen=buffer_size)

    direction_counts = {
        "left": 0,
        "right": 0,
        "up": 0,
        "down": 0,
        "front": 0,
    }

    segment_counts = [
        {
            "left": 0,
            "right": 0,
            "up": 0,
            "down": 0,
            "front": 0,
        }
        for _ in range(segment_count)
    ]

    segment_totals = [0 for _ in range(segment_count)]

    total_processed_frames = 0
    frame_index = 0

    avg_x_offset = 0
    avg_y_ratio = 0

    with mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as face_mesh:

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_index += 1

            frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            result = face_mesh.process(rgb_frame)
            stable_direction = "no_face"

            if result.multi_face_landmarks:
                face_landmarks = result.multi_face_landmarks[0]
                landmarks = face_landmarks.landmark

                x_offset, y_ratio = get_head_metrics(landmarks)

                if x_offset is not None and y_ratio is not None:
                    x_offset_buffer.append(x_offset)
                    y_ratio_buffer.append(y_ratio)

                    avg_x_offset = sum(x_offset_buffer) / len(x_offset_buffer)
                    avg_y_ratio = sum(y_ratio_buffer) / len(y_ratio_buffer)

                    stable_direction = classify_head_direction(
                        avg_x_offset,
                        avg_y_ratio
                    )

                    direction_counts[stable_direction] += 1
                    total_processed_frames += 1

                    segment_index = get_segment_index(
                        frame_index,
                        total_video_frames,
                        segment_count
                    )
                    segment_counts[segment_index][stable_direction] += 1
                    segment_totals[segment_index] += 1

                    h, w, _ = frame.shape
                    for idx in [1, 10, 152, 234, 454]:
                        x = int(landmarks[idx].x * w)
                        y = int(landmarks[idx].y * h)
                        cv2.circle(frame, (x, y), 3, (0, 255, 0), -1)

            if show_video:
                display_width = 720
                h, w, _ = frame.shape
                display_height = int(h * (display_width / w))
                display_frame = cv2.resize(
                    frame,
                    (display_width, display_height)
                )

                cv2.putText(
                    display_frame,
                    f"Direction: {stable_direction}",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 0, 255),
                    2,
                )

                cv2.putText(
                    display_frame,
                    f"x_offset: {avg_x_offset:.3f}",
                    (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 255),
                    2,
                )

                cv2.putText(
                    display_frame,
                    f"y_ratio: {avg_y_ratio:.3f}",
                    (20, 110),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 255),
                    2,
                )

                cv2.imshow("Head Pose Analysis", display_frame)
                key = cv2.waitKey(1) & 0xFF
                if key == 27:
                    break

    cap.release()
    cv2.destroyAllWindows()

    if total_processed_frames == 0:
        print("얼굴이 검출된 프레임이 없습니다.")
        return None

    direction_ratio = make_ratio(direction_counts, total_processed_frames)
    head_score = calculate_head_score(direction_ratio)
    head_feedback = get_head_feedback(direction_ratio)

    timeline = []

    duration = total_video_frames / fps if fps and fps > 0 else 0

    for i in range(segment_count):
        if segment_count == 1:
            current_time = 0
        else:
            current_time = duration * (i / (segment_count - 1))

        segment_ratio = make_ratio(segment_counts[i], segment_totals[i])
        segment_score = calculate_head_score(segment_ratio)

        timeline.append({
            "time": format_time(current_time),
            "head_score": segment_score,
            "head_ratio": segment_ratio,
            "detected_frames": segment_totals[i],
        })

    return {
        "counts": direction_counts,
        "ratios": direction_ratio,
        "total_frames": total_processed_frames,
        "head_score": head_score,
        "head_feedback": head_feedback,
        "timeline": timeline,
    }


if __name__ == "__main__":
    if len(sys.argv) > 1:
        video_path = sys.argv[1]
    else:
        video_path = "video/test_video.mp4"

    result = analyze_head_pose(video_path, buffer_size=10, show_video=True)

    if result:
        print("\n=== 고개 방향 분석 결과 ===")
        print("총 처리 프레임 수:", result["total_frames"])
        print("방향별 비율(%):", result["ratios"])
        print("고개 방향 점수:", result["head_score"])
        print("피드백:", result["head_feedback"])
        print("timeline:", result["timeline"])