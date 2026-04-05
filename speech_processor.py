import os
import re
import ast
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
    """
    [LLM 검증] 정규식으로 뽑은 후보들 중 문맥상 '진짜 추임새'만 골라냅니다.
    (예: "그 책"의 '그'는 제외하고, "그... 저는"의 '그'만 포함)
    """
    if not potential_fillers:
        return []

    unique_candidates = list(set(potential_fillers))
    
    prompt = f"""
    너는 발표 언어 분석 전문가야. 다음 문장에서 추출된 후보 단어들이 '의미 없는 추임새(필러워드)'인지, 
    아니면 문맥상 '의미가 있는 단어(지시 대명사 등)'인지 판별해줘.
    
    [문장]: "{full_text}"
    [후보 단어들]: {unique_candidates}
    
    '그', '이제', '막' 등이 무언가를 지시하거나 수식하는 경우에는 리스트에서 제외해.
    진짜 의미 없는 추임새인 단어만 파이썬 리스트 형식으로 응답해줘.
    응답 예시: ["음", "어", "그"] (없으면 [] 반환)
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini", # 비용 효율적인 모델 사용
            messages=[{"role": "system", "content": "너는 정확한 언어 분석가야."},
                      {"role": "user", "content": prompt}],
            temperature=0
        )
        
        content = response.choices[0].message.content
        # 응답에서 리스트 형태만 추출
        match = re.search(r"\[.*\]", content)
        if match:
            verified_list = ast.literal_eval(match.group())
            return [word for word in potential_fillers if word in verified_list]
        return potential_fillers
    except Exception as e:
        print(f"⚠️ LLM 검증 실패(원본 유지): {e}")
        return potential_fillers

def get_wpm_feedback(wpm):
    """[WPM 피드백] 속도 수치에 따른 전문 코칭 메시지 생성"""
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
        return {"error": f"파일을 찾을 수 없습니다: {video_path}"}

    try:
        # 1. 오디오 추출
        print(f"--- 🛠️ 오디오 추출 중: {video_path} ---")
        video = VideoFileClip(video_path)
        video.audio.write_audiofile(audio_temp_path, bitrate="64k", logger=None)
        video.close()
        
        # 2. Whisper STT (verbose_json 모드로 타임스탬프 확보)
        print("--- 🎙️ Whisper AI 음성 분석 중... ---")
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

        # 3. [E] Echo 분석 (정규식 후보 추출 -> LLM 문맥 검증)
        filler_patterns = ["음", "어", "그", "이제", "저기", "막"]
        filler_group = f"(?:{'|'.join(filler_patterns)})"
        
        # 1차 후보군 추출
        raw_pattern = rf"(?:^|[\s,?.!])({'|'.join(filler_patterns)})(?=$|[\s,?.!])"
        potential_fillers = re.findall(raw_pattern, full_text)
        
        # 2차 LLM 검증 (지시어 필터링)
        print("--- 🤖 LLM 문맥 검증 진행 중... ---")
        verified_fillers = verify_fillers_with_llm(full_text, potential_fillers)
        
        # 복합 반복 패턴 (예: "저는 어... 저는")
        echo_pattern = rf"(?:^|[\s,?.!])(\S+)(?:\s+{filler_group}[,?.!]?)*\s+\1(?=$|[\s,?.!])"
        echo_matches = [m.group(0).strip() for m in re.finditer(echo_pattern, full_text)]

        # 4. [P] Pause 분석 (2초 이상 침묵)
        pauses = []
        for i in range(len(segments) - 1):
            # 기존: segments[i+1]['start'] - segments[i]['end'] (에러 발생 지점)
            # 수정: 객체 접근 방식(.start, .end)으로 변경
            gap = segments[i+1].start - segments[i].end 
            if gap >= 2.0:
                pauses.append({
                    "at": round(segments[i].end, 1), 
                    "sec": round(gap, 1)
                })

        # 5. [M] Modification 분석 (말 수정 키워드)
        mod_keywords = ["아니", "그게 아니라", "다시 말해서", "정정하자면"]
        mod_found = [word for word in mod_keywords if word in full_text]

        # 6. [W] WPM 분석 및 피드백
        word_count = len(full_text.split())
        wpm = word_count / (duration_sec / 60) if duration_sec > 0 else 0
        wpm_eval = get_wpm_feedback(wpm)

        return {
            "success": True,
            "text": full_text,
            "metrics": {
                "wpm": round(wpm, 1),
                "wpm_info": wpm_eval,
                "filler_count": len(verified_fillers),
                "filler_list": list(set(verified_fillers)),
                "echo_count": len(echo_matches),
                "echo_list": echo_matches,
                "pause_count": len(pauses),
                "pause_list": pauses,
                "mod_count": len(mod_found),
                "duration_sec": round(duration_sec, 1)
            }
        }

    except Exception as e:
        if os.path.exists(audio_temp_path): os.remove(audio_temp_path)
        return {"error": str(e)}

# --- 실행 테스트 ---
if __name__ == "__main__":
# 실행 중인 파일(speech_processor.py)의 절대 경로를 자동으로 계산합니다.
    current_dir = os.path.dirname(os.path.abspath(__file__))
    target_video = os.path.join(current_dir, "Test.mp4")    
    
    #target_video = r""  # 📝 여기에 실제 영상 경로 입력!
    
    result = analyze_video_presentation(target_video)

    if "success" in result:
        m = result['metrics']
        print("\n" + "="*60)
        print("✅ EPM+WPM 통합 분석 리포트")
        print("-" * 60)
        print(f"📝 전체 스크립트:\n{result['text']}")
        print("-" * 60)
        print(f"🗣️ 속도: {m['wpm']} WPM ({m['wpm_info']['status']})")
        print(f"💡 피드백: {m['wpm_info']['feedback']}")
        print(f"⚠️ 추임새: {m['filler_count']}개 {m['filler_list']}")
        print(f"🔁 반복: {m['echo_count']}회 {m['echo_list']}")
        print(f"⏱️ 침묵: {m['pause_count']}회 발견")
        print(f"🛠️ 수정: {m['mod_count']}회 감지")
        print("="*60)
    else:
        print(f"❌ 에러 발생: {result['error']}")