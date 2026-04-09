import cv2
import mediapipe as mp
from collections import deque, Counter

mp_face_mesh = mp.solutions.face_mesh


def get_head_direction(landmarks):
    nose = landmarks[1]          # 코 끝
    left_face = landmarks[234]   # 얼굴 왼쪽
    right_face = landmarks[454]  # 얼굴 오른쪽
    top_face = landmarks[10]     # 이마 위쪽
    chin = landmarks[152]        # 턱

    # 얼굴 중심
    center_x = (left_face.x + right_face.x) / 2

    # 얼굴 크기
    face_width = right_face.x - left_face.x
    face_height = chin.y - top_face.y

    if face_width <= 0 or face_height <= 0:
        return "front"

    # 정규화된 좌우 편차
    x_offset = (nose.x - center_x) / face_width

    # 얼굴 높이 대비 코의 상대 위치
    nose_relative_y = (nose.y - top_face.y) / face_height

    # -----------------------------
    # 튜닝값
    # -----------------------------
    front_x_threshold = 0.1   # 정면 범위 넓힘
    up_threshold = 0.43        # 이보다 작으면 위
    down_threshold = 0.62      # 이보다 크면 아래

    # 좌우 먼저 너무 민감하지 않게
    if x_offset > front_x_threshold:
        return "left"
    elif x_offset < -front_x_threshold:
        return "right"

    # 상하 판별
    if nose_relative_y < 0.48:
        return "up"
    elif nose_relative_y > 0.60:
        return "down"

    return "front"


def analyze_head_pose(video_path, buffer_size=15, show_video=True):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("영상을 열 수 없습니다.")
        return None

    direction_buffer = deque(maxlen=buffer_size)

    direction_counts = {
        "left": 0,
        "right": 0,
        "up": 0,
        "down": 0,
        "front": 0
    }

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

            frame = cv2.flip(frame, 1)  # 거울모드처럼 보기 좋게
            # 화면 표시용 크기 조절
            display_frame = cv2.resize(frame, (720, 1280))
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            result = face_mesh.process(rgb_frame)

            stable_direction = "no_face"

            if result.multi_face_landmarks:
                face_landmarks = result.multi_face_landmarks[0]
                landmarks = face_landmarks.landmark

                direction = get_head_direction(landmarks)
                direction_buffer.append(direction)

                stable_direction = Counter(direction_buffer).most_common(1)[0][0]
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
        key: round((value / total_processed_frames) * 100, 2)
        for key, value in direction_counts.items()
    }

    return {
        "counts": direction_counts,
        "ratios": direction_ratio,
        "total_frames": total_processed_frames
    }


if __name__ == "__main__":
    video_path = "test_video.mp4"   # 필요하면 경로 수정
    result = analyze_head_pose(video_path, buffer_size=10, show_video=True)

    if result:
        print("\n=== 고개 방향 분석 결과 ===")
        print("총 처리 프레임 수:", result["total_frames"])
        print("방향별 개수:", result["counts"])
        print("방향별 비율(%):", result["ratios"])