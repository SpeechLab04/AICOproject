import os
import re
import ast
import json  # JSON 출력을 위해 추가
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

def verify_fillers_with_llm(full_text, potential_fillers):
    if not potential_fillers: return []
    unique_candidates = list(set(potential_fillers))
    
    prompt = f"""
    너는 발표 언어 분석 전문가야. 다음 문장에서 추출된 후보 단어들이 '의미 없는 추임새(필러워드)'인지, 
    아니면 문맥상 '의미가 있는 단어(지시 대명사 등)'인지 판별해줘.
    [문장]: "{full_text}"
    [후보 단어들]: {unique_candidates}
    진짜 의미 없는 추임새인 단어만 파이썬 리스트 형식으로 응답해줘. 예: ["음", "어"]
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": "너는 정확한 언어 분석가야."},
                      {"role": "user", "content": prompt}],
            temperature=0
        )
        content = response.choices[0].message.content
        match = re.search(r"\[.*\]", content)
        if match:
            verified_list = ast.literal_eval(match.group())
            return [word for word in potential_fillers if word in verified_list]
        return potential_fillers
    except:
        return potential_fillers

def get_wpm_feedback(wpm):
    if wpm < 80:
        return {"status": "매우 느림", "color": "Gray", "feedback": "속도가 너무 느려 지루할 수 있습니다. 조금 더 활기차게 말해보세요."}
    elif 80 <= wpm < 100:
        return {"status": "조금 느림", "color": "Blue", "feedback": "여유 있는 속도입니다. 중요한 부분에서 속도를 높여 변화를 주세요."}
    elif 100 <= wpm <= 135:
        return {"status": "적절함", "color": "Green", "feedback": "뉴스 앵커와 비슷한 아주 이상적인 속도입니다! 전달력이 높습니다."}
    elif 135 < wpm <= 160:
        return {"status": "조금 빠름", "color": "Orange", "feedback": "말이 다소 빠릅니다. 문장 사이 호흡을 늘려보세요."}
    else:
        return {"status": "매우 빠름", "color": "Red", "feedback": "너무 빨라 이해가 어렵습니다. 의도적으로 천천히 말하는 연습이 필요합니다."}

def analyze_video_presentation(video_path):
    audio_temp_path = "temp_audio.mp3"
    if not os.path.exists(video_path):
        return {"success": False, "error": f"파일을 찾을 수 없습니다: {video_path}"}

    try:
        # 1. 오디오 추출 및 Whisper 분석
        video = VideoFileClip(video_path)
        video.audio.write_audiofile(audio_temp_path, bitrate="64k", logger=None)
        video.close()
        
        with open(audio_temp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                prompt="음, 어, 그, 이제, 저기, 막... 모든 추임새를 생략 없이 받아쓰세요."
            )
        if os.path.exists(audio_temp_path): os.remove(audio_temp_path)

        full_text = transcript.text
        duration_sec = transcript.duration
        segments = transcript.segments

        # 2. [E] Echo & Filler 분석
        filler_patterns = ["음", "어", "그", "이제", "저기", "막"]
        filler_group = f"(?:{'|'.join(filler_patterns)})"
        raw_pattern = rf"(?:^|[\s,?.!])({'|'.join(filler_patterns)})(?=$|[\s,?.!])"
        potential_fillers = re.findall(raw_pattern, full_text)
        verified_fillers = verify_fillers_with_llm(full_text, potential_fillers)
        
        echo_pattern = rf"(?:^|[\s,?.!])(\S+)(?:\s+{filler_group}[,?.!]?)*\s+\1(?=$|[\s,?.!])"
        echo_matches = [m.group(0).strip() for m in re.finditer(echo_pattern, full_text)]

        # 3. [P] Pause 분석
        pauses = []
        for i in range(len(segments) - 1):
            gap = segments[i+1].start - segments[i].end 
            if gap >= 2.0:
                pauses.append({"at": round(segments[i].end, 1), "duration": round(gap, 1)})

        # 4. [M] Modification 분석
        mod_keywords = ["아니", "그게 아니라", "다시 말해서", "정정하자면"]
        mod_found = [word for word in mod_keywords if word in full_text]

        # 5. [W] WPM 분석
        word_count = len(full_text.split())
        wpm = round(word_count / (duration_sec / 60), 1) if duration_sec > 0 else 0
        wpm_eval = get_wpm_feedback(wpm)

        # ✨ 데이터를 계층적으로 구조화 (프론트엔드 전달용)
        return {
            "success": True,
            "full_script": full_text,
            "summary": {
                "wpm": wpm,
                "status": wpm_eval["status"],
                "color": wpm_eval["color"],
                "feedback": wpm_eval["feedback"],
                "total_duration": round(duration_sec, 1)
            },
            "speech_habits": {
                "filler_count": len(verified_fillers),
                "filler_list": list(set(verified_fillers)),
                "echo_count": len(echo_matches),
                "duplicate_details": echo_matches, # 팀원들에게 말한 그 이름!
                "modification_count": len(mod_found),
                "modification_list": mod_found
            },
            "timeline_events": {
                "pause_count": len(pauses),
                "pause_details": pauses
            }
        }

    except Exception as e:
        if os.path.exists(audio_temp_path): os.remove(audio_temp_path)
        return {"success": False, "error": str(e)}

# --- 실행 테스트 ---
if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    target_video = os.path.join(current_dir, "Test4.mp4")    
    
    print("🚀 발표 데이터 분석 및 JSON 구조화 시작...")
    result = analyze_video_presentation(target_video)

    # 📝 결과를 예쁜 JSON 형식으로 출력
    # ensure_ascii=False를 해야 한글이 안 깨집니다.
    print(json.dumps(result, indent=4, ensure_ascii=False))