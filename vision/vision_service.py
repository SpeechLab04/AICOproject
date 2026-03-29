import cv2
import json

def analyze_video(video_path):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        return {
            "video_path": video_path,
            "face_detected_frames": 0,
            "total_frames": 0,
            "message": "영상 파일을 열 수 없습니다."
        }

    face_cascade = cv2.CascadeClassifier(
        "vision/haarcascade_frontalface_default.xml"
)

    total_frames = 0
    face_detected_frames = 0
    center_looking_frames = 0

    while True:
        ret, frame = cap.read()

        if not ret:
            break

        total_frames += 1

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )

        if len(faces) > 0:
            face_detected_frames += 1

            for (x, y, w, h) in faces:
                face_center_x = x + w / 2

                frame_center_x = frame.shape[1] / 2

                if abs(face_center_x - frame_center_x) < frame.shape[1] * 0.2:
                    center_looking_frames += 1

    cap.release()

    if total_frames > 0:
        face_detection_rate = round((face_detected_frames / total_frames) * 100, 2)
    else:
        face_detection_rate = 0

    if total_frames > 0:
        center_looking_rate = round((center_looking_frames / total_frames) * 100, 2)
    else:
        center_looking_rate = 0

    result = {
    "영상 정보": {
        "영상 경로": video_path,
        "전체 프레임 수": total_frames
    },
    "분석 결과": {
        "얼굴 검출 프레임 수": face_detected_frames,
        "얼굴 검출률 (%)": face_detection_rate,
        "정면 응시 프레임 수": center_looking_frames,
        "정면 응시 비율 (%)": center_looking_rate,
    },
    "상태": "성공",
    "메시지": "얼굴 검출 분석이 완료되었습니다."
    }
    

    return result


if __name__ == "__main__":
    test_result = analyze_video("vision/test_video.mp4")
    print(json.dumps(test_result, indent=4, ensure_ascii=False))