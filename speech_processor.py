import os
import re
from moviepy import VideoFileClip
from dotenv import load_dotenv
from openai import OpenAI


# 1. 환경 설정 및 API 클라이언트 초기화
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("❌ 에러: .env 파일에 OPENAI_API_KEY가 설정되지 않았습니다.")
else:
    client = OpenAI(api_key=api_key)

def analyze_video_presentation(video_path):
    """
    영상 파일을 입력받아 음성 추출, STT, 언어 습관(WPM, 필러워드)을 분석합니다.
    """
    audio_temp_path = "temp_audio.mp3"
    
    if not os.path.exists(video_path):
        return {"error": f"파일을 찾을 수 없습니다: {video_path}"}

    try:
        # [단계 1] 영상에서 오디오 추출
        print(f"--- 🛠️ 오디오 추출 및 압축 시작: {video_path} ---")
        video = VideoFileClip(video_path)
        
        # 영상에 오디오 트랙이 있는지 확인
        if video.audio is None:
            video.close()
            return {"error": "영상에 오디오 트랙이 없습니다. 소리가 있는 영상인지 확인하세요."}
            
        # 64k 비트레이트로 압축하여 mp3 저장
        video.audio.write_audiofile(audio_temp_path, bitrate="64k", logger=None)
        video.close()
        
        # 추출된 오디오 파일 상태 확인
        file_size_kb = os.path.getsize(audio_temp_path) / 1024
        print(f"📊 추출된 오디오 크기: {file_size_kb:.2f} KB")
        
        if file_size_kb < 1: # 1KB 미만이면 사실상 빈 파일
            return {"error": "오디오 추출 결과가 비어있습니다. 코덱이나 파일 권한을 확인하세요."}

        # [단계 2] OpenAI Whisper API를 통한 STT (필러워드 강조 모드)
        print("--- 🎙️ Whisper API 분석 시작 (잠시만 기다려 주세요) ---")
        with open(audio_temp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                # ⭐ 핵심: Whisper가 '음, 어' 등을 생략하지 않도록 강력한 힌트를 줍니다.
                prompt="음, 어, 그, 이제, 저기, 막... 발표 중에 나오는 모든 추임새를 생략하지 말고 있는 그대로 받아쓰기 하세요."
            )

        # 분석 완료 후 임시 파일 삭제 (테스트 중 소리를 확인하고 싶다면 아래 줄을 주석 처리하세요)
        if os.path.exists(audio_temp_path):
            os.remove(audio_temp_path)

        # [단계 3] 데이터 가공 및 분석
        full_text = transcript.text
        
        if not full_text.strip():
            return {"error": "Whisper가 음성을 인식했지만 텍스트로 변환하지 못했습니다. (목소리가 너무 작거나 소음일 수 있음)"}

        duration_sec = transcript.duration
        duration_min = duration_sec / 60

        # 필러워드 패턴 (쉼표, 마침표, 공백 등에 구애받지 않도록 유연하게 설정)
        filler_patterns = ["음", "어", "그", "이제", "저기", "막"]
        filler_details = {}
        total_fillers = 0

        for word in filler_patterns:
            # 패턴: 단어 앞뒤에 문장부호나 공백이 있거나, 문장의 시작/끝인 경우를 모두 포함
            pattern = rf"(?:^|[\s,?.!])({word})(?=$|[\s,?.!])"
            matches = re.findall(pattern, full_text)
            count = len(matches)
            filler_details[word] = count
            total_fillers += count

        # WPM (Words Per Minute) 계산 - 한국어 어절 기준
        word_count = len(full_text.split())
        wpm = word_count / duration_min if duration_min > 0 else 0

        return {
            "success": True,
            "text": full_text,
            "metrics": {
                "wpm": round(wpm, 1),
                "total_fillers": total_fillers,
                "filler_details": filler_details,
                "duration_sec": round(duration_sec, 1)
            }
        }

    except Exception as e:
        if os.path.exists(audio_temp_path):
            os.remove(audio_temp_path)
        return {"error": f"분석 중 치명적 오류 발생: {str(e)}"}

# --- 실시간 실행부 ---
if __name__ == "__main__":
    # 📝 여기에 실제 영상 파일의 경로를 정확히 입력하세요!
    target_video = r" " 

    print("🚀 발표 코칭 AI 분석 시스템 가동...")
    result = analyze_video_presentation(target_video)

    if "error" in result:
        print(f"❌ 분석 실패: {result['error']}")
    else:
        print("\n" + "="*60)
        print("✅ 분석 완료 보고서")
        print("-" * 60)
        print(f"📝 전체 스크립트:\n\n{result['text']}") 
        print("-" * 60)
        print(f"⏱️ 발표 시간: {result['metrics']['duration_sec']}초")
        print(f"🗣️ 말하기 속도: {result['metrics']['wpm']} WPM")
        print(f"⚠️ 총 필러워드(추임새): {result['metrics']['total_fillers']}개")
        print(f"📊 상세 분석: {result['metrics']['filler_details']}")
        print("="*60)