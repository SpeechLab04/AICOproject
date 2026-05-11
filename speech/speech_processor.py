import os
import re
import ast
from moviepy import VideoFileClip
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)


def verify_fillers_with_llm(full_text, potential_fillers):
    if not potential_fillers:
        return []

    unique_candidates = list(set(potential_fillers))

    prompt = f"""
너는 발표 언어 분석 전문가야.
다음 문장에서 추출된 후보 단어들이 의미 없는 추임새인지 판별해줘.

[문장]: "{full_text}"
[후보 단어들]: {unique_candidates}

진짜 의미 없는 추임새인 단어만 파이썬 리스트 형식으로 응답해줘.
예: ["음", "어"]
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "너는 정확한 언어 분석가야."},
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )

        content = response.choices[0].message.content
        match = re.search(r"\[.*\]", content)

        if match:
            verified_list = ast.literal_eval(match.group())
            return [word for word in potential_fillers if word in verified_list]

        return potential_fillers

    except Exception:
        return potential_fillers


def get_wpm_feedback(wpm):
    if wpm < 80:
        return "속도가 너무 느려 지루할 수 있습니다. 조금 더 활기차게 말해보세요."
    elif 80 <= wpm < 100:
        return "여유 있는 속도입니다. 중요한 부분에서 속도를 높여 변화를 주세요."
    elif 100 <= wpm <= 135:
        return "뉴스 앵커와 비슷한 이상적인 속도입니다. 전달력이 좋습니다."
    elif 135 < wpm <= 160:
        return "말이 다소 빠릅니다. 문장 사이 호흡을 조금 더 늘려보세요."
    else:
        return "말이 너무 빨라 이해가 어려울 수 있습니다. 의도적으로 천천히 말하는 연습이 필요합니다."


def run_speech_analysis(file_path):
    audio_temp_path = f"{file_path}.mp3"

    try:
        # 1. 영상에서 음성 추출
        video = VideoFileClip(file_path)

        if video.audio is None:
            return {
                "script": "",
                "speed_wpm": 0,
                "filler_count": 0,
                "score": 0,
                "feedback": "영상에서 음성을 찾을 수 없습니다.",
            }

        video.audio.write_audiofile(audio_temp_path, bitrate="64k", logger=None)
        duration_sec = video.duration
        video.close()

        # 2. Whisper STT
        with open(audio_temp_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                prompt="음, 어, 그, 이제, 저기, 막...",
            )

        full_text = transcript.text

        # 3. 말속도 계산
        word_count = len(full_text.split())
        wpm = round(word_count / (duration_sec / 60), 1) if duration_sec > 0 else 0

        # 4. 필러워드 분석
        filler_patterns = ["음", "어", "그", "이제", "저기", "막"]
        raw_pattern = rf"(?:^|[\s,?.!])({'|'.join(filler_patterns)})(?=$|[\s,?.!])"

        potential_fillers = re.findall(raw_pattern, full_text)
        verified_fillers = verify_fillers_with_llm(full_text, potential_fillers)

        filler_count = len(verified_fillers)

        # 5. 음성 점수 계산
        score = 100

        if wpm < 80 or wpm > 160:
            score -= 25
        elif wpm < 100 or wpm > 135:
            score -= 10

        score -= min(filler_count * 3, 30)
        score = max(score, 0)

        feedback = get_wpm_feedback(wpm)

        if filler_count > 0:
            feedback += f" 또한 필러워드가 {filler_count}회 감지되어 불필요한 추임새를 줄이면 더 자연스러운 발표가 될 수 있습니다."

        return {
            "script": full_text,
            "speed_wpm": wpm,
            "filler_count": filler_count,
            "score": score,
            "feedback": feedback,
        }

    except Exception as e:
        return {
            "script": "",
            "speed_wpm": 0,
            "filler_count": 0,
            "score": 0,
            "feedback": f"음성 분석 중 오류가 발생했습니다: {str(e)}",
        }

    finally:
        if os.path.exists(audio_temp_path):
            os.remove(audio_temp_path)