import os
import re
import ast
import json
import shutil
import uuid
import librosa  # 추가
import numpy as np # 추가
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from moviepy import VideoFileClip
from dotenv import load_dotenv
from openai import OpenAI

# --- 1. 환경 설정 및 초기화 ---
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 분석 결과를 임시 저장할 딕셔너리
analysis_results = {}

# --- 2. 분석 보조 함수들 ---

# 생동감 및 단조로움 분석 함수 (추가)
def analyze_speech_vibrancy(audio_path, segments):
    try:
        y, sr = librosa.load(audio_path)
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        
        # 1. 전체 피치 값 추출
        all_pitch_values = [pitches[magnitudes[:, t].argmax(), t] for t in range(pitches.shape[1]) if pitches[magnitudes[:, t].argmax(), t] > 0]
        
        # 2. 전체 생동감 점수 계산 (표준편차 기반)
        total_std = np.std(all_pitch_values) if all_pitch_values else 0
        vibrancy_score = min(100, round((total_std / 30) * 100)) # 30Hz 기준 100점
        
        # 3. 구간별 단조로움 판별
        monotone_segments = []
        for seg in segments:
            start_sample, end_sample = int(seg['start'] * sr), int(seg['end'] * sr)
            if start_sample >= len(y): continue
            
            seg_audio = y[start_sample:end_sample]
            if len(seg_audio) == 0: continue
            
            seg_pitches, seg_mags = librosa.piptrack(y=seg_audio, sr=sr)
            seg_values = [seg_pitches[seg_mags[:, t].argmax(), t] for t in range(seg_pitches.shape[1]) if seg_pitches[seg_mags[:, t].argmax(), t] > 0]
            
            if seg_values and np.std(seg_values) < 15: # 15Hz 미만이면 단조로운 구간으로 기록
                monotone_segments.append({"start": round(seg['start'], 1), "end": round(seg['end'], 1)})
        
        return vibrancy_score, monotone_segments
    except:
        return 0, []

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

# --- 3. 백그라운드 정밀 분석 로직 ---

def run_detailed_analysis(file_id, full_text, segments, duration_sec, audio_path): # audio_path 추가
    """지수님이 개발한 EPM 및 세부 분석 로직을 백그라운드에서 실행합니다."""
    try:
        # 0. 생동감/단조로움 분석 수행 (추가)
        vibrancy_score, monotone_timeline = analyze_speech_vibrancy(audio_path, segments)

        # 1. 습관 분석 (Fillers, Echo, Modification)
        filler_patterns = ["음", "어", "그", "이제", "저기", "막"]
        filler_group = f"(?:{'|'.join(filler_patterns)})"
        raw_pattern = rf"(?:^|[\s,?.!])({'|'.join(filler_patterns)})(?=$|[\s,?.!])"
        
        potential_fillers = re.findall(raw_pattern, full_text)
        verified_fillers = verify_fillers_with_llm(full_text, potential_fillers)
        
        echo_pattern = rf"(?:^|[\s,?.!])(\S+)(?:\s+{filler_group}[,?.!]?)*\s+\1(?=$|[\s,?.!])"
        echo_matches = [m.group(0).strip() for m in re.finditer(echo_pattern, full_text)]

        mod_keywords = ["아니", "그게 아니라", "다시 말해서", "정정하자면"]
        mod_found = [word for word in mod_keywords if word in full_text]

        # 2. 흐름 분석 (Pauses)
        pauses = []
        for i in range(len(segments) - 1):
            gap = segments[i+1]['start'] - segments[i]['end'] 
            if gap >= 2.0:
                pauses.append({"at": round(segments[i]['end'], 1), "duration": round(gap, 1)})

        # 3. 속도 및 EPM 요약
        word_count = len(full_text.split())
        wpm = round(word_count / (duration_sec / 60), 1) if duration_sec > 0 else 0
        wpm_eval = get_wpm_feedback(wpm)

        # 4. 결과 저장 (프론트엔드가 file_id로 조회 가능하도록)
        analysis_results[file_id] = {
            "success": True,
            "summary": {
                "wpm": wpm,
                "vibrancy_score": vibrancy_score, # 추가
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
                "pause_details": pauses,
                "monotone_sections": monotone_timeline # 추가
            }
        }
    except Exception as e:
        analysis_results[file_id] = {"success": False, "error": str(e)}
    finally:
        # 모든 분석이 끝난 후 오디오 파일 삭제 (수정)
        if os.path.exists(audio_path): os.remove(audio_path)

# --- 4. 메인 API 엔드포인트 ---

@app.post("/analyze")
async def analyze_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    video_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    audio_temp_path = os.path.join(UPLOAD_DIR, f"{file_id}_temp.mp3")

    try:
        # 1. 파일 저장
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. 오디오 추출 및 정보 획득
        video = VideoFileClip(video_path)
        video.audio.write_audiofile(audio_temp_path, bitrate="64k", logger=None)
        duration_sec = video.duration
        video.close()

        # 3. Whisper STT (텍스트 우선 추출)
        with open(audio_temp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                prompt="음, 어, 그, 이제, 저기, 막..."
            )

        full_text = transcript.text
        segments_data = [{"start": s['start'], "end": s['end']} for s in transcript.segments]

        # 4. 세부 분석을 백그라운드로 예약 (audio_temp_path 전달)
        background_tasks.add_task(run_detailed_analysis, file_id, full_text, segments_data, duration_sec, audio_temp_path)

        # 5. 스크립트 즉시 반환
        return {
            "success": True,
            "file_id": file_id,
            "full_script": full_text,
            "message": "스크립트 추출 완료. 질의응답을 시작하세요. 세부 분석은 진행 중입니다."
        }

    except Exception as e:
        if os.path.exists(audio_temp_path): os.remove(audio_temp_path) # 에러 시 삭제
        return {"success": False, "error": str(e)}
    finally:
        if os.path.exists(video_path): os.remove(video_path)
        # audio_temp_path 삭제는 백그라운드 태스크 내부(finally)로 이동함

@app.get("/result/{file_id}")
async def get_analysis_result(file_id: str):
    result = analysis_results.get(file_id)
    if not result:
        return {"status": "processing", "message": "아직 분석 중입니다. 잠시만 기다려 주세요."}
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)