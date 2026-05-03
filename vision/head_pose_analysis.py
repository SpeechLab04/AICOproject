import cv2
import mediapipe as mp
from collections import deque
import sys

mp_face_mesh = mp.solutions.face_mesh


def get_head_metrics(landmarks):
    nose = landmarks[1]          # 코 끝
    left_face = landmarks[234]   # 얼굴 왼쪽
    right_face = landmarks[454]  # 얼굴 오른쪽
    top_face = landmarks[10]     # 이마 위쪽
    chin = landmarks[152]        # 턱

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

    # 좌우 먼저 판별
    if avg_x_offset > front_x_threshold:
        return "right"
    elif avg_x_offset < -front_x_threshold:
        return "left"

    # 상하 판별
    if avg_y_ratio < up_threshold:
        return "up"
    elif avg_y_ratio > down_threshold:
        return "down"

    return "front"

def analyze_head_pose(video_path, buffer_size=15, show_video=True):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("영상을 열 수 없습니다.")
        return None

    x_offset_buffer = deque(maxlen=buffer_size)
    y_ratio_buffer = deque(maxlen=buffer_size)

    direction_counts = {
        "left": 0,
        "right": 0,
        "up": 0,
        "down": 0,
        "front": 0
    }

    def calculate_head_score(ratios):
        front = ratios.get("front", 0)
        left = ratios.get("left", 0)
        right = ratios.get("right", 0)
        up = ratios.get("up", 0)
        down = ratios.get("down", 0)

        lr = left + right
        score = 100

        # 정면 부족 감점
        if front < 40:
            score -= (40 - front) * 1.2

        # 아래 보는 비율 (가장 큰 감점)
        score -= down * 1.0

        # 위는 약하게 반영
        score -= up * 0.2

        # 좌우는 적당하면 긍정
        if 10 <= lr <= 30:
            score += 3

        # 좌우가 너무 많으면 감점
        elif lr > 40:
            score -= (lr - 40) * 0.3

        return max(0, min(100, round(score)))


    def get_head_feedback(ratios):
        front = ratios.get("front", 0)
        left = ratios.get("left", 0)
        right = ratios.get("right", 0)
        down = ratios.get("down", 0)
        up = ratios.get("up", 0)

        lr = left + right

        if down >= 30:
            return "아래를 보는 비율이 높아 청중과의 시선 연결이 약해 보일 수 있습니다."
        elif front >= 70 and down <= 10:
            return "정면을 안정적으로 잘 유지한 발표 자세입니다."
        elif front >= 50 and 10 <= lr <= 30:
            return "정면을 잘 유지하면서도 청중을 고르게 바라보는 자연스러운 발표 자세입니다."
        elif front < 35:
            return "정면을 유지하는 비율이 낮아 다소 산만해 보일 수 있습니다."
        elif up >= 20:
            return "위쪽을 보는 비율이 다소 높아 보여 시선을 조금 더 안정적으로 유지하면 좋습니다."
        else:
            return "전반적으로 안정적인 자세이지만, 정면 응시를 조금 더 의식하면 더 좋은 인상을 줄 수 있습니다."

    total_processed_frames = 0

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

            # 90도 회전 보정
            frame = cv2.rotate(frame, cv2.ROTATE_90_COUNTERCLOCKWISE)

            #frame = cv2.flip(frame, 1)  # 거울모드처럼 보기 좋게
            # 화면 표시용 크기 조절
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

                    stable_direction = classify_head_direction(avg_x_offset, avg_y_ratio)

                    direction_counts[stable_direction] += 1
                    total_processed_frames += 1

                    # 주요 점 좌표 표시
                    h, w, _ = frame.shape
                    for idx in [1, 10, 152, 234, 454]:
                        x = int(landmarks[idx].x * w)
                        y = int(landmarks[idx].y * h)
                        cv2.circle(frame, (x, y), 3, (0, 255, 0), -1)

            if show_video:
                display_width = 720
                h, w, _ = frame.shape
                display_height = int(h * (display_width / w))
                display_frame = cv2.resize(frame, (display_width, display_height))

                cv2.putText(
                    display_frame,
                    f"Direction: {stable_direction}",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 0, 255),
                    2
                )

                cv2.putText(display_frame, f"x_offset: {avg_x_offset:.3f}", (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                cv2.putText(display_frame, f"y_ratio: {avg_y_ratio:.3f}", (20, 110),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

                cv2.imshow("Head Pose Analysis", display_frame)
                key = cv2.waitKey(1) & 0xFF
                if key == 27:  # ESC
                    break

    cap.release()
    cv2.destroyAllWindows()

    if total_processed_frames == 0:
        print("얼굴이 검출된 프레임이 없습니다.")
        return None

    direction_ratio = {
        key: round((value / total_processed_frames) * 100)
        for key, value in direction_counts.items()
    }

    head_score = calculate_head_score(direction_ratio)
    head_feedback = get_head_feedback(direction_ratio)

    return {
        "counts": direction_counts,
        "ratios": direction_ratio,
        "total_frames": total_processed_frames,
        "head_score": head_score,
        "head_feedback": head_feedback
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