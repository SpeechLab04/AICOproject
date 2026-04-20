import os
import re
import ast
import json
import shutil
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from moviepy import VideoFileClip
from dotenv import load_dotenv
from openai import OpenAI

# --- 1. 환경 설정 및 초기화 ---
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

app = FastAPI()

# CORS 설정 (프론트엔드에서 API 접근 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- 2. 분석 보조 함수들 ---

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

# --- 3. 메인 API 엔드포인트 ---

@app.post("/analyze")
async def analyze_video(file: UploadFile = File(...)):
    # 1. 고유 파일명 생성
    file_id = str(uuid.uuid4())
    video_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    audio_temp_path = os.path.join(UPLOAD_DIR, f"{file_id}_temp.mp3")

    try:
        # 2. 파일 저장
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. 오디오 추출
        video = VideoFileClip(video_path)
        video.audio.write_audiofile(audio_temp_path, bitrate="64k", logger=None)
        duration_sec = video.duration
        video.close()

        # 4. Whisper STT
        with open(audio_temp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                prompt="음, 어, 그, 이제, 저기, 막... 모든 추임새를 생략 없이 받아쓰세요."
            )

        full_text = transcript.text
        segments = transcript.segments

        # 5. 세부 분석 로직
        filler_patterns = ["음", "어", "그", "이제", "저기", "막"]
        filler_group = f"(?:{'|'.join(filler_patterns)})"
        raw_pattern = rf"(?:^|[\s,?.!])({'|'.join(filler_patterns)})(?=$|[\s,?.!])"
        potential_fillers = re.findall(raw_pattern, full_text)
        verified_fillers = verify_fillers_with_llm(full_text, potential_fillers)
        
        echo_pattern = rf"(?:^|[\s,?.!])(\S+)(?:\s+{filler_group}[,?.!]?)*\s+\1(?=$|[\s,?.!])"
        echo_matches = [m.group(0).strip() for m in re.finditer(echo_pattern, full_text)]

        pauses = []
        for i in range(len(segments) - 1):
            gap = segments[i+1].start - segments[i].end 
            if gap >= 2.0:
                pauses.append({"at": round(segments[i].end, 1), "duration": round(gap, 1)})

        mod_keywords = ["아니", "그게 아니라", "다시 말해서", "정정하자면"]
        mod_found = [word for word in mod_keywords if word in full_text]

        word_count = len(full_text.split())
        wpm = round(word_count / (duration_sec / 60), 1) if duration_sec > 0 else 0
        wpm_eval = get_wpm_feedback(wpm)

        # 6. 최종 결과 반환
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
                "duplicate_details": echo_matches,
                "modification_count": len(mod_found),
                "modification_list": mod_found
            },
            "timeline_events": {
                "pause_count": len(pauses),
                "pause_details": pauses
            }
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

    finally:
        # 7. 사용한 임시 파일 즉시 삭제
        if os.path.exists(video_path): os.remove(video_path)
        if os.path.exists(audio_temp_path): os.remove(audio_temp_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    #test
    