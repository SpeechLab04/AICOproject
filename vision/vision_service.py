def analyze_video(video_path):
    result = {
        "video_path": video_path,
        "eye_contact_score": 0,
        "head_pose_score": 0,
        "vision_score": 0,
        "total_frames": 0,
        "detected_frames": 0,
        "message": "비전 분석 기본 구조가 생성되었습니다."
    }
    return result


if __name__ == "__main__":
    test_result = analyze_video("test_video.mp4")
    print(test_result)