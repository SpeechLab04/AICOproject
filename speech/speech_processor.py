import os
import re
import ast
import json
import shutil
import uuid
import librosa
import numpy as np

from fastapi import UploadFile, BackgroundTasks
from moviepy import VideoFileClip
from dotenv import load_dotenv
from openai import OpenAI

# --- 1. 환경 설정 및 초기화 ---

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

analysis_results = {}

# --- 2. 분석 보조 함수들 ---

def analyze_speech_vibrancy(audio_path, segments):
    try:
        y, sr = librosa.load(audio_path)

        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)

        all_pitch_values = []

        for t in range(pitches.shape[1]):
            idx = magnitudes[:, t].argmax()
            pitch = pitches[idx, t]

            if pitch > 0:
                all_pitch_values.append(pitch)

        total_std = np.std(all_pitch_values) if all_pitch_values else 0

        # 개선된 vibrancy score 계산
        vibrancy_score = int(
            np.clip(
                round(((total_std - 15) / 45) * 100),
                0,
                100
            )
        )

        monotone_segments = []

        for seg in segments:
            start_sample = int(seg['start'] * sr)
            end_sample = int(seg['end'] * sr)

            if start_sample >= len(y):
                continue

            seg_audio = y[start_sample:end_sample]

            if len(seg_audio) == 0:
                continue

            seg_pitches, seg_mags = librosa.piptrack(
                y=seg_audio,
                sr=sr
            )

            seg_values = []

            for t in range(seg_pitches.shape[1]):
                idx = seg_mags[:, t].argmax()
                pitch = seg_pitches[idx, t]

                if pitch > 0:
                    seg_values.append(pitch)

            # monotone 판정 기준 완화
            if seg_values and np.std(seg_values) < 18:
                monotone_segments.append({
                    "start": round(seg['start'], 1),
                    "end": round(seg['end'], 1)
                })

        return vibrancy_score, monotone_segments

    except Exception as e:
        print("analyze_speech_vibrancy error:", e)
        return 0, []


def verify_fillers_with_llm(full_text, potential_fillers):

    if not potential_fillers:
        return []

    unique_candidates = list(set(potential_fillers))

    prompt = f"""
    너는 발표 언어 분석 전문가야.

    아래 문장에서 추출된 후보 단어들 중,
    실제 의미 없는 추임새(필러워드)만 골라줘.

    [문장]
    "{full_text}"

    [후보 단어]
    {unique_candidates}

    반드시 Python 리스트 형식으로만 응답해.
    예:
    ["음", "어"]
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "너는 정확한 한국어 언어 분석가야."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0
        )

        content = response.choices[0].message.content

        match = re.search(r"\[.*\]", content)

        if match:
            verified_list = ast.literal_eval(match.group())

            return [
                word for word in potential_fillers
                if word in verified_list
            ]

        return potential_fillers

    except Exception as e:
        print("verify_fillers_with_llm error:", e)
        return potential_fillers


def get_wpm_feedback(wpm):

    if wpm < 80:
        return {
            "status": "매우 느림",
            "color": "Gray",
            "feedback": "속도가 너무 느려 지루할 수 있습니다. 조금 더 활기차게 말해보세요."
        }

    elif 80 <= wpm < 100:
        return {
            "status": "조금 느림",
            "color": "Blue",
            "feedback": "여유 있는 속도입니다. 중요한 부분에서 속도를 높여 변화를 주세요."
        }

    elif 100 <= wpm <= 135:
        return {
            "status": "적절함",
            "color": "Green",
            "feedback": "뉴스 앵커와 비슷한 아주 이상적인 속도입니다! 전달력이 높습니다."
        }

    elif 135 < wpm <= 160:
        return {
            "status": "조금 빠름",
            "color": "Orange",
            "feedback": "말이 다소 빠릅니다. 문장 사이 호흡을 늘려보세요."
        }

    else:
        return {
            "status": "매우 빠름",
            "color": "Red",
            "feedback": "너무 빨라 이해가 어렵습니다. 의도적으로 천천히 말하는 연습이 필요합니다."
        }


# --- 3. 백그라운드 정밀 분석 로직 ---

def run_detailed_analysis(
    file_id,
    full_text,
    segments,
    duration_sec,
    audio_path
):

    try:

        vibrancy_score, monotone_timeline = analyze_speech_vibrancy(
            audio_path,
            segments
        )

        # 한국어 필러워드 확장
        filler_patterns = [
            "음",
            "어",
            "그",
            "이제",
            "저기",
            "막",
            "약간",
            "뭐랄까",
            "사실",
            "그러니까",
            "아",
            "일단"
        ]

        # segment 기반 필러 검출
        potential_fillers = []

        for seg in segments:

            seg_text = seg.get("text", "")

            cleaned_seg_text = re.sub(
                r"[^\w\s가-힣]",
                " ",
                seg_text
            )

            for filler in filler_patterns:

                pattern = rf"(?:^|\s){re.escape(filler)}(?:$|\s)"

                if re.search(pattern, cleaned_seg_text):
                    potential_fillers.append(filler)

        verified_fillers = verify_fillers_with_llm(
            full_text,
            potential_fillers
        )

        # 반복어 탐지
        filler_group = f"(?:{'|'.join(filler_patterns)})"

        echo_pattern = (
            rf"(?:^|[\s,?.!…])"
            rf"(\S+)"
            rf"(?:\s+{filler_group}[,?.!…]?)*"
            rf"\s+\1"
            rf"(?=$|[\s,?.!…])"
        )

        echo_matches = [
            m.group(0).strip()
            for m in re.finditer(echo_pattern, full_text)
        ]

        # 수정 발화 탐지
        mod_keywords = [
            "아니",
            "그게 아니라",
            "다시 말해서",
            "정정하자면"
        ]

        mod_found = [
            word for word in mod_keywords
            if word in full_text
        ]

        # pause 탐지
        pauses = []

        for i in range(len(segments) - 1):

            gap = (
                segments[i + 1]['start']
                - segments[i]['end']
            )

            if gap >= 2.0:
                pauses.append({
                    "at": round(segments[i]['end'], 1),
                    "duration": round(gap, 1)
                })

        # 실제 speaking duration 계산
        speech_duration = sum(
            seg['end'] - seg['start']
            for seg in segments
        )

        # 한국어 기반 속도 계산
        cleaned_text = re.sub(r"\s+", "", full_text)

        char_count = len(cleaned_text)

        # 한국어 평균 단어 길이 보정
        estimated_words = char_count / 3.5

        wpm = round(
            estimated_words / (speech_duration / 60),
            1
        ) if speech_duration > 0 else 0

        wpm_eval = get_wpm_feedback(wpm)

        analysis_results[file_id] = {
            "success": True,

            "summary": {
                "wpm": wpm,
                "vibrancy_score": vibrancy_score,
                "status": wpm_eval["status"],
                "color": wpm_eval["color"],
                "feedback": wpm_eval["feedback"],
                "total_duration": round(duration_sec, 1),
                "speech_duration": round(speech_duration, 1)
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
                "monotone_sections": monotone_timeline
            }
        }

    except Exception as e:

        print("run_detailed_analysis error:", e)

        analysis_results[file_id] = {
            "success": False,
            "error": str(e)
        }

    finally:

        if os.path.exists(audio_path):
            os.remove(audio_path)


# --- 4. 메인 비즈니스 로직 함수 ---

def process_voice_analysis(
    file: UploadFile,
    background_tasks: BackgroundTasks
):

    file_id = str(uuid.uuid4())

    video_path = os.path.join(
        UPLOAD_DIR,
        f"{file_id}_{file.filename}"
    )

    audio_temp_path = os.path.join(
        UPLOAD_DIR,
        f"{file_id}_temp.mp3"
    )

    try:

        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        video = VideoFileClip(video_path)

        video.audio.write_audiofile(
            audio_temp_path,
            bitrate="64k",
            logger=None
        )

        duration_sec = video.duration

        video.close()

        with open(audio_temp_path, "rb") as audio_file:

            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                prompt="음, 어, 그, 이제, 저기, 막, 약간, 뭐랄까..."
            )

        full_text = transcript.text

        def get_segment_value(segment, key, default=None):

            if isinstance(segment, dict):
                return segment.get(key, default)

            return getattr(segment, key, default)

        # text 추가
        segments_data = []

        for s in transcript.segments:

            segments_data.append({
                "start": get_segment_value(s, "start", 0),
                "end": get_segment_value(s, "end", 0),
                "text": get_segment_value(s, "text", "")
            })

        background_tasks.add_task(
            run_detailed_analysis,
            file_id,
            full_text,
            segments_data,
            duration_sec,
            audio_temp_path
        )

        return {
            "success": True,
            "file_id": file_id,
            "full_script": full_text,
            "message": "스크립트 추출 완료. 세부 분석 진행 중."
        }

    except Exception as e:

        print("process_voice_analysis error:", e)

        if os.path.exists(audio_temp_path):
            os.remove(audio_temp_path)

        return {
            "success": False,
            "error": str(e)
        }

    finally:

        if os.path.exists(video_path):
            os.remove(video_path)


def get_voice_result(file_id: str):

    result = analysis_results.get(file_id)

    if not result:
        return {
            "status": "processing",
            "message": "아직 분석 중입니다."
        }

    return result