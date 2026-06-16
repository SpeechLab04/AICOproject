import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Mic,
  Volume2,
  SkipForward,
  CheckCircle2,
  Maximize,
  Minimize,
} from "lucide-react";
import Header from "../components/Header";

function LivePage() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const audiences =
    JSON.parse(localStorage.getItem("selectedAudiences")) || [];

  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  const setup = JSON.parse(localStorage.getItem("presentationSetup")) || {};
  const setupDuration = setup.duration || null;

  const [isStarted, setIsStarted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [canStart, setCanStart] = useState(false);
  const [cameraStatus, setCameraStatus] = useState("카메라를 준비 중입니다...");
  const [cameraDistance, setCameraDistance] = useState("");
  const [faceRatio, setFaceRatio] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isSelectingTime, setIsSelectingTime] = useState(false);
  const [selectedTime, setSelectedTime] = useState(setupDuration);
  const [remainingTime, setRemainingTime] = useState(null);
  const [showTimer, setShowTimer] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const cameraContainerRef = useRef(null);
  const [presentationEnded, setPresentationEnded] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);

  const [isProcessingAnswer, setIsProcessingAnswer] = useState(false);
  const [qaAnswers, setQaAnswers] = useState([]);
  const [answerTimeLeft, setAnswerTimeLeft] = useState(null);
  

  const answerRecorderRef = useRef(null);
  const answerChunksRef = useRef([]);
  const qaAnswersRef = useRef([]);
  
  const currentQuestion = generatedQuestions[currentQuestionIndex];

  const PERSONA_NAME = {
    mentor: "🎓 김멘토 교수님",
    press: "🔥 이압박 교수님",
    troll: "😈 최비판 교수님",
    basic: "📚 유기본 교수님",
  };

  const [ttsCache, setTtsCache] = useState({});
  const [ttsReady, setTtsReady] = useState(false);
  const [isTtsPlaying, setIsTtsPlaying] = useState(false);

  // 페이지 진입 시 이전 분석 결과 초기화
  useEffect(() => {
    localStorage.removeItem("analysisResult");
    localStorage.removeItem("uploadedVideoUrl");
    localStorage.removeItem("generatedQuestions");
    localStorage.removeItem("qaAnswers"); // 추가
  }, []);

  // 전체화면 상태 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // 페이지 진입 시 카메라 미리보기 시작
  useEffect(() => {
    const startPreview = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("카메라 접근 오류:", error);
      }
    };
    startPreview();

    // 페이지 벗어날 때 카메라 종료
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 발표 시작 전: 1.5초마다 카메라 프레임 체크
  useEffect(() => {
    if (isStarted) return;

    const checkCamera = async () => {
      if (!videoRef.current || !streamRef.current) return;
      if (videoRef.current.videoWidth === 0) return;

      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, -canvas.width, 0);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/check-camera`, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          setCanStart(data.is_valid);
          setCameraDistance(data.distance || "");
          setFaceRatio(data.face_ratio ?? null);
          const distanceMsg = {
            "적당":      "거리 적당해요!",
            "너무 가까움": "조금 멀리\n이동해주세요.",
            "너무 멀음":  "조금 더 가까이\n와주세요.",
            "중앙 벗어남": "가이드라인 안으로\n이동해주세요.",
            "위치 조정":  "상반신이 보이도록\n위로 올려주세요.",
            "얼굴 미감지": "가까이 오거나\n정면을 봐주세요.",
          };
          const dist = (data.distance || "").trim();
          const msg = distanceMsg[dist] || distanceMsg[data.distance] || data.suggestion || dist;
          if (msg) setCameraStatus(msg);
        } catch (e) {
          console.error("카메라 체크 오류:", e);
          setCanStart(false);
          setCameraDistance("");
          setFaceRatio(null);
        }
      }, "image/jpeg", 0.7);
    };

    const interval = setInterval(checkCamera, 1500);
    return () => clearInterval(interval);
  }, [isStarted]);

  // 대기 중일 때 canStart 변화에 따라 카운트다운 시작/초기화
  useEffect(() => {
    if (!isWaiting) return;
    if (canStart) {
      if (countdown === null) setCountdown(5);
    } else {
      setCountdown(null); // 박스 벗어나면 리셋
    }
  }, [canStart, isWaiting]);

  // 3-2-1 카운트다운 타이머
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      startRecording();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 답변 시작 시 60초 타이머 시작, 종료 시 리셋
  useEffect(() => {
    if (isAnswering) {
      setAnswerTimeLeft(60);
    } else {
      setAnswerTimeLeft(null);
    }
  }, [isAnswering]);

  // 답변 타이머 카운트다운
  useEffect(() => {
    if (answerTimeLeft === null) return;
    if (answerTimeLeft <= 0) {
      stopAnswerRecording();
      return;
    }
    const timer = setTimeout(() => setAnswerTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [answerTimeLeft]);

  // 발표 진행 중 남은 시간 타이머
  useEffect(() => {
    if (!isStarted || remainingTime === null || presentationEnded) return;
    if (remainingTime === 0) {
      handlePresentationEnd();
      return;
    }
    const timer = setTimeout(() => setRemainingTime(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [isStarted, remainingTime, presentationEnded]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // 발표 시작하기 버튼 → 대기 모드 진입
  const handlePresentationStart = () => {
    setIsWaiting(true);
    if (cameraContainerRef.current?.requestFullscreen) {
      cameraContainerRef.current.requestFullscreen().catch(err => console.error(err));
    }
  };

  // 카운트다운 0 되면 실제 녹화 시작
  const startRecording = () => {
    setIsStarted(true);
    setIsWaiting(false);
    setCountdown(null);
    setRemainingTime(selectedTime * 60);
    recordedChunksRef.current = [];

    const stream = streamRef.current;
    if (!stream) return;

    const wsUrl = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/ws/audio`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          if (ws.readyState === 1) {
            const arrayBuffer = await event.data.arrayBuffer();
            ws.send(arrayBuffer);
            console.log("audio sent");
          }
        }
      };
      mediaRecorder.start(1000);
    };
  };

  const handlePresentationEnd = async () => {
    setRemainingTime(null); // 타이머 즉시 정지

    // 전체화면 종료
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }

    stopCamera();
    setIsAnalyzing(true);

    try {

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }

      await new Promise(resolve =>
        setTimeout(resolve, 1000)
      );

      const audiences =
        JSON.parse(
          localStorage.getItem("selectedAudiences")
        ) || [];

      const selectedPersonas =
        audiences.map(a => a.id);

      const blob = new Blob(
        recordedChunksRef.current,
        {
          type: "video/webm",
        }
      );

      const formData = new FormData();

      formData.append(
        "file",
        blob,
        "realtime_presentation.webm"
      );

      formData.append(
        "selected_personas",
        JSON.stringify(selectedPersonas)
      );

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/realtime/generate-questions`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.questions) {
        console.error("서버 에러 응답:", data);
        alert("AI가 질문을 생성하는 데 실패했습니다. 다시 시도해 주세요.");
        setIsAnalyzing(false);
        return; // 에러가 났으니 아래 코드를 실행하지 않고 여기서 멈춤!
      }
      
      console.log("질문 생성 결과 =", data);

      setGeneratedQuestions(data.questions);
      setTtsReady(false);
      preloadTTS(data.questions);
      localStorage.setItem(
        "generatedQuestions",
        JSON.stringify(data.questions)
      );
      setIsAnalyzing(false);
      setPresentationEnded(true);


      stopCamera();

    } catch (err) {

      console.error(err);
    }
  };



  const uploadAndNavigate = () => {
    localStorage.setItem(
      "qaAnswers",
      JSON.stringify(qaAnswersRef.current)
    );

    console.log(
      "최종 QA =",
      qaAnswersRef.current
    );
    
    setRemainingTime(null); // 타이머 중지

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch (e) { /* 이미 멈춘 경우 무시 */ }

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    } catch (e) { /* 이미 닫힌 경우 무시 */ }

    setIsUploading(true);

    const blob = new Blob(recordedChunksRef.current, {
      type: "video/webm",
    });

    const savedSetup = JSON.parse(localStorage.getItem("presentationSetup")) || {};
    const actualTopic = savedSetup.topic || "대학 자유 주제 발표";

    const formData = new FormData();
    formData.append("file", blob, "realtime_presentation.webm");

    formData.append("presentation_topic", actualTopic);

    const setupForLive = JSON.parse(localStorage.getItem("presentationSetup")) || {};
    formData.append("presentation_material", setupForLive.material || "");
    formData.append("presentation_script_text", setupForLive.scriptText || "");

    const scenarioForLive = JSON.parse(localStorage.getItem("selectedScenario")) || {};
    formData.append("scenario_id", scenarioForLive.id || "");

    const token = localStorage.getItem("token");

    fetch(`${import.meta.env.VITE_API_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
    .then((res) => {
      if (res.status === 401) {
        alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("token");
        localStorage.removeItem("aicoUser");
        stopCamera();
        navigate("/login");
        return null;
      }
      return res.json();
    })
    .then((data) => {
      if (!data) return;
      console.log("UPLOAD RESULT =", data);
      localStorage.setItem("analysisResult", JSON.stringify(data));
      if (data.video_url) {
        localStorage.setItem("uploadedVideoUrl", data.video_url);
      } else if (data.analysis_summary && data.analysis_summary.video_url) {
        localStorage.setItem("uploadedVideoUrl", data.analysis_summary.video_url);
      }
      
      stopCamera();
      navigate("/dashboard");
    })
    .catch((err) => {
      console.error(err);
      alert("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      setIsUploading(false);
    });
  };

  const handleNextQuestion = () => {

    if (isProcessingAnswer) {
      alert("답변 분석이 끝날 때까지 기다려주세요.");
      return;
    }
    if (currentQuestionIndex < generatedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsAnswering(false);
    } else {
      uploadAndNavigate();
    }
  };

  const preloadTTS = async (questions) => {

    const cache = {};

    for (const q of questions) {

      try {

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/tts-question`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: q.question,
              persona_type: q.persona_type,
            }),
          }
        );

        const blob = await res.blob();

        cache[q.question] =
          URL.createObjectURL(blob);

      } catch (err) {

        console.error(
          "TTS 캐싱 실패",
          err
        );
      }
    }

    setTtsCache(cache);

    setTtsReady(true);
    console.log(
      "TTS 캐싱 완료"
    );
  };

  const readQuestion = async () => {

    if (!currentQuestion?.question) return;

    const audioUrl =
      ttsCache[
        currentQuestion.question
      ];

    if (!audioUrl) {

      console.log(
        "아직 TTS 생성 중"
      );

      return;
    }

    const audio =
      new Audio(audioUrl);

    audio.playbackRate = 1.1;

    audio.onplay = () => setIsTtsPlaying(true);
    audio.onended = () => setIsTtsPlaying(false);
    audio.onerror = (e) => { console.log("재생 실패", e); setIsTtsPlaying(false); };

    await audio.play();
  };

  const startAnswerRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    answerChunksRef.current = [];

    const recorder = new MediaRecorder(stream);

    answerRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        answerChunksRef.current.push(event.data);
      }
    };

    recorder.start();

    setIsAnswering(true);

    console.log("답변 녹음 시작");
  } catch (error) {
    console.error("마이크 접근 오류:", error);
  }
};

const stopAnswerRecording = () => {
  const recorder = answerRecorderRef.current;

  if (!recorder) return;

  recorder.stop();

  recorder.onstop = async () => {

    setIsProcessingAnswer(true);
    const blob = new Blob(
      answerChunksRef.current,
      {
        type: "audio/webm",
      }
    );

    const formData = new FormData();

    formData.append(
      "file",
      blob,
      "answer.webm"
    );

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/stt-answer`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();

    console.log("답변 STT =", data);

    const newAnswer = {
      question: currentQuestion.question,
      audience: currentQuestion.audience,
      answer: data.transcript,
    };

    qaAnswersRef.current = [
      ...qaAnswersRef.current,
      newAnswer,
    ];

    setQaAnswers(qaAnswersRef.current);
    setIsProcessingAnswer(false);
  };

  setIsAnswering(false);
};

  // 건너뛰기: 바로 결과로 이동
  const handleSkip = () => {

    if (isProcessingAnswer) {
      alert("답변 분석이 끝날 때까지 기다려주세요.");
      return;
    }
    uploadAndNavigate();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FCFA",
        color: "#2F3E46",
      }}
    >
      <Header showBack />

      <main
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: isMobile ? "36px 22px 80px" : "54px 60px 100px",
        }}
      >
        {/* 제목 */}
        <div style={{ textAlign: "center", marginBottom: "42px" }}>
          <div
            style={{
              display: "inline-block",
              background: "#C8E4D6",
              color: "#4D8F82",
              padding: "10px 22px",
              borderRadius: "999px",
              fontWeight: "800",
              marginBottom: "22px",
            }}
          >
            실시간 발표 연습
          </div>

          <h2
            style={{
              fontSize: isMobile ? "36px" : "54px",
              color: "#2D3A3A",
              fontWeight: "900",
              marginBottom: "16px",
            }}
          >
            AI 청중과 실시간 발표 연습
          </h2>

          <p
            style={{
              color: "#58706D",
              fontSize: isMobile ? "16px" : "20px",
              lineHeight: "1.7",
            }}
          >
            발표 종료 후 AI 청중이 질문을 생성하고 답변 연습을 진행합니다.
          </p>
        </div>

        {/* 메인 */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.15fr 0.85fr",
            gap: "28px",
          }}
        >
          {/* 카메라 */}
          <div
            style={{
              background: "white",
              borderRadius: "32px",
              padding: isMobile ? "24px" : "34px",
              boxShadow: "0 14px 38px rgba(0,0,0,0.08)",
            }}
          >
            <div
              ref={cameraContainerRef}
              style={{
                height: isMobile ? "260px" : "430px",
                borderRadius: "28px",
                background: "#000",
                overflow: "hidden",
                marginBottom: "24px",
                position: "relative",
               }}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: isFullscreen ? "contain" : "cover",
                  transform: "scaleX(-1)",
                  background: "#000",
                }}
              />

              {/* 발표 중 타이머 */}
              {isStarted && remainingTime !== null && showTimer && (
                <div style={{
                  position: "absolute",
                  top: "16px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: remainingTime <= 30 ? "rgba(229,115,115,0.92)" : "rgba(0,0,0,0.62)",
                  color: "white",
                  padding: "1px 18px",
                  borderRadius: "999px",
                  fontSize: "36px",
                  fontWeight: "900",
                  letterSpacing: "2px",
                  pointerEvents: "none",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }}>
                  {String(Math.floor(remainingTime / 60)).padStart(2, "0")}:{String(remainingTime % 60).padStart(2, "0")}
                </div>
              )}

              {/* 전체화면 토글 버튼 - 페이지 진입부터 항상 표시 */}
              {!presentationEnded && (
                <button
                  onClick={() => {
                    if (isFullscreen) {
                      document.exitFullscreen().catch(err => console.error(err));
                    } else {
                      if (cameraContainerRef.current?.requestFullscreen) {
                        cameraContainerRef.current.requestFullscreen().catch(err => console.error(err));
                      }
                    }
                  }}
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    right: "12px",
                    background: "rgba(0,0,0,0.45)",
                    color: "white",
                    border: "none",
                    padding: "6px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    zIndex: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isFullscreen ? <Minimize size={40} /> : <Maximize size={18} />}
                </button>
              )}

              {/* 전체화면 중 발표 종료 버튼 */}
              {isStarted && !presentationEnded && isFullscreen && (
                <button
                  onClick={handlePresentationEnd}
                  style={{
                    position: "absolute",
                    bottom: "20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(202,216,112,0.9)",
                    color: "#2D3A3A",
                    border: "none",
                    padding: "12px 32px",
                    borderRadius: "999px",
                    fontSize: "16px",
                    fontWeight: "800",
                    cursor: "pointer",
                    zIndex: 10,
                  }}
                >
                  발표 종료하기
                </button>
              )}

              {/* 카운트다운 오버레이 */}
              {countdown !== null && (
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.4)",
                  pointerEvents: "none",
                }}>
                  <div style={{
                    fontSize: "120px",
                    fontWeight: "900",
                    color: "white",
                    textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    lineHeight: 1,
                  }}>
                    {countdown}
                  </div>
                </div>
              )}

              {/* 카메라 가이드라인 - 발표 시작 전에만 표시 */}
              {!isStarted && (
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  pointerEvents: "none",
                }}>
                  {/* 사람 실루엣 SVG - 카메라 전체 크기 기준 */}
                  <svg
                    viewBox="0 0 320 240"
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                      position: "absolute",
                      top: 0, left: 0,
                      width: "100%", height: "100%",
                    }}
                    fill="none"
                  >
                    {/* 사람 실루엣 - 왼쪽아래→어깨→머리호→어깨→오른쪽아래 (하나로 연결) */}
                    <path
                      d="M35,234 C 52,195 62,128 118,128 A 62,62 0 1 1 202,128 C 258,128 268,195 285,234"
                      stroke={canStart ? "#6BB5A6" : "#FF4444"}
                      strokeWidth="2"
                      strokeDasharray="10,7"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>

                  {/* 카메라 상태 오버레이 - 전체화면일 때만 카메라 안에 표시 */}
                  {isFullscreen && cameraStatus && cameraStatus !== "카메라를 준비 중입니다..." && (
                    <div style={{
                      position: "absolute",
                      top: "62%", left: "50%", transform: "translateX(-50%)",
                      background: canStart ? "rgba(76,175,140,0.9)" : "rgba(220,30,30,0.88)",
                      color: "white",
                      padding: "28px 44px",
                      minWidth: "50%",
                      maxWidth: "65%",
                      borderRadius: "20px",
                      textAlign: "center",
                      fontSize: "58px",
                      fontWeight: "900",
                      lineHeight: "1.3",
                      whiteSpace: "nowrap",
                      wordBreak: "keep-all",
                      overflowWrap: "break-word",
                      pointerEvents: "none",
                    }}>
                      {canStart ? "✅ " : ""}{cameraStatus}
                      {faceRatio && (
                        <div style={{
                          fontSize: "28px",
                          fontWeight: "700",
                          marginTop: "8px",
                          opacity: 0.9,
                        }}>
                          현재 거리 약 {(0.18 / faceRatio).toFixed(1)}m
                        </div>
                      )}
                    </div>
                  )}

                  {/* 하단 안내 텍스트 */}
                  <div style={{
                    position: "absolute",
                    bottom: "14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(0,0,0,0.55)",
                    color: "white",
                    padding: "6px 16px",
                    borderRadius: "999px",
                    fontSize: isFullscreen ? "20px" : "13px",
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                  }}>
                    상반신이 가이드라인 안에 들어오게 맞춰주세요
                  </div>
                </div>
              )}
            </div>

            {/* 일반화면 카메라 상태 박스 - 카메라 아래 */}
            {!isFullscreen && !isStarted && cameraStatus && cameraStatus !== "카메라를 준비 중입니다..." && (
              <div style={{
                background: canStart ? "rgba(76,175,140,0.9)" : "rgba(220,30,30,0.88)",
                color: "white",
                padding: "14px 22px",
                borderRadius: "16px",
                textAlign: "center",
                fontSize: "20px",
                fontWeight: "900",
                lineHeight: "1.3",
                whiteSpace: "pre-line",
                wordBreak: "keep-all",
                margin: "10px 0 0",
              }}>
                {canStart ? "✅ " : ""}{cameraStatus}
                {faceRatio && (
                  <div style={{ fontSize: "14px", fontWeight: "700", marginTop: "6px", opacity: 0.9 }}>
                    현재 거리 약 {(0.18 / faceRatio).toFixed(1)}m
                  </div>
                )}
              </div>
            )}

            {!isStarted ? (
              <>
                {setupDuration && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", justifyContent: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#4D8F82", fontWeight: "700", fontSize: "14px" }}>
                      <input
                        type="checkbox"
                        checked={showTimer}
                        onChange={(e) => setShowTimer(e.target.checked)}
                        style={{ width: "16px", height: "16px", accentColor: "#6BB5A6", cursor: "pointer" }}
                      />
                      타이머 표시 ({setupDuration}분)
                    </label>
                  </div>
                )}
                  <>
                    <button
                      onClick={handlePresentationStart}
                      disabled={isWaiting}
                      style={{
                        ...mainButtonStyle,
                        background: isWaiting ? "#B0C4BE" : "#6BB5A6",
                        cursor: isWaiting ? "not-allowed" : "pointer",
                      }}
                    >
                      {isWaiting ? "가이드라인 안으로 들어오세요" : "발표 시작하기"}
                    </button>
                    {!isWaiting && (
                      <div style={{
                        textAlign: "center",
                        marginTop: "10px",
                        fontSize: "13px",
                        color: "#888",
                        fontWeight: "600",
                      }}>
                        발표 시작하기를 누르면 전체화면 모드로 변경됩니다.
                      </div>
                    )}
                  </>
              </>
            ) : !presentationEnded ? (
              <button
                onClick={handlePresentationEnd}
                style={{
                  ...mainButtonStyle,
                  background: "#CAD870",
                }}
              >
                발표 종료하기
              </button>
            ) : (
              <div
                style={{
                  background: "#EEF8F4",
                  borderRadius: "22px",
                  padding: "24px",
                  textAlign: "center",
                  color: "#4B5563",
                  lineHeight: "1.8",
                }}
              >
                <CheckCircle2
                  size={34}
                  color="#6BB5A6"
                  style={{ marginBottom: "10px" }}
                />

                <div
                  style={{
                    fontWeight: "800",
                    color: "#2D3A3A",
                    marginBottom: "8px",
                  }}
                >
                  발표 분석 완료
                </div>

                AI 청중 질문 생성이 완료되었습니다.
              </div>
            )}
          </div>

          {/* 질문 영역 */}
          <div
            style={{
              background: "white",
              borderRadius: "32px",
              padding: isMobile ? "24px" : "34px",
              boxShadow: "0 14px 38px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "24px",
              }}
            >
              <Mic size={24} color="#6BB5A6" />

              <h3
                style={{
                  fontSize: "28px",
                  color: "#2D3A3A",
                  fontWeight: "900",
                }}
              >
                AI 청중 질문
              </h3>
            </div>

            {isUploading ? (
              <div style={{
                background: "#F8FCFA",
                borderRadius: "22px",
                padding: "30px 24px",
                color: "#5C706C",
                textAlign: "center",
                lineHeight: "2",
              }}>
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>📊</div>
                <div style={{ fontWeight: "800", color: "#2D3A3A", marginBottom: "8px" }}>
                  결과 분석 중...
                </div>
                <div>영상을 분석하고 있어요.</div>
                <div>잠시만 기다려주세요.</div>
              </div>
            ) : isAnalyzing ? (
              <div style={{
                background: "#F8FCFA",
                borderRadius: "22px",
                padding: "30px 24px",
                color: "#5C706C",
                textAlign: "center",
                lineHeight: "2",
              }}>
                <div style={{ fontSize: "28px", marginBottom: "10px" }}>🤔</div>
                <div style={{ fontWeight: "800", color: "#2D3A3A", marginBottom: "8px" }}>
                  질문 생성 중...
                </div>
                <div>AI 청중이 질문을 만들고 있어요.</div>
                <div>잠시만 기다려주세요.</div>
              </div>
            ) : !presentationEnded ? (
              <div
                style={{
                  background: "#F8FCFA",
                  borderRadius: "22px",
                  padding: "30px 24px",
                  color: "#5C706C",
                  textAlign: "center",
                  lineHeight: "1.8",
                }}
              >
                발표를 종료하면 AI 청중 질문이 생성됩니다.
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "inline-block",
                    background: "#E5F4EF",
                    color: "#6BB5A6",
                    padding: "8px 16px",
                    borderRadius: "999px",
                    fontWeight: "800",
                    marginBottom: "20px",
                  }}
                >
                  {PERSONA_NAME[currentQuestion?.persona_type]}
                </div>

                <div
                  style={{
                    background: "#F8FCFA",
                    borderRadius: "24px",
                    padding: "26px",
                    lineHeight: "1.8",
                    color: "#2D3A3A",
                    fontSize: isMobile ? "17px" : "19px",
                    marginBottom: "24px",
                    minHeight: "140px",
                  }}
                >
                  Q. {currentQuestion?.question}
                </div>

                <button
                  onClick={readQuestion}
                  disabled={!ttsReady || isTtsPlaying}
                  style={{
                    width: "100%",
                    background: ttsReady && !isTtsPlaying
                      ? "#E5F4EF"
                      : "#F1F5F9",
                    color: ttsReady && !isTtsPlaying
                      ? "#6BB5A6"
                      : "#94A3B8",
                    border: "none",
                    padding: "15px",
                    borderRadius: "18px",
                    fontWeight: "800",
                    marginBottom: "18px",
                    cursor: ttsReady && !isTtsPlaying
                      ? "pointer"
                      : "not-allowed",
                    opacity: ttsReady ? 1 : 0.7,
                  }}
                >
                  <Volume2
                    size={18}
                    style={{
                      verticalAlign: "middle",
                      marginRight: "8px",
                    }}
                  />

                  {isTtsPlaying
                    ? "재생 중..."
                    : ttsReady
                      ? "질문 읽기"
                      : "음성 준비중..."}
                </button>

                <div
                  style={{
                    background: isAnswering ? "#EEF8F4" : "#F8FCFA",
                    borderRadius: "22px",
                    padding: "24px",
                    textAlign: "center",
                    marginBottom: "20px",
                  }}
                >
                  <Mic
                    size={36}
                    color={isAnswering ? "#6BB5A6" : "#A0AEC0"}
                    style={{ marginBottom: "12px" }}
                  />

                  <div
                    style={{
                      color: "#4B5563",
                      lineHeight: "1.7",
                    }}
                  >
                    {isAnswering
                      ? "답변 음성을 분석 중입니다..."
                      : "버튼을 눌러 음성으로 답변하세요"}
                  </div>
                  {isAnswering && answerTimeLeft !== null && (
                    <div style={{
                      marginTop: "10px",
                      fontSize: "22px",
                      fontWeight: "900",
                      color: answerTimeLeft <= 10 ? "#E53E3E" : "#6BB5A6",
                    }}>
                      ⏱ {answerTimeLeft}초
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (!isAnswering) {
                      startAnswerRecording();
                    } else {
                      stopAnswerRecording();
                    }
                  }}
                  style={mainButtonStyle}
                >
                  {isAnswering ? "답변 종료하기" : "답변 시작하기"}
                </button>

                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    marginTop: "18px",
                  }}
                >
                  <button
                    onClick={handleSkip}
                    style={subButtonStyle}
                  >
                    <SkipForward
                      size={18}
                      style={{
                        verticalAlign: "middle",
                        marginRight: "6px",
                      }}
                    />
                    결과 보기
                  </button>

                  <button
                    onClick={handleNextQuestion}
                    disabled={isProcessingAnswer}
                    style={{
                      ...subButtonStyle,
                      opacity: isProcessingAnswer ? 0.5 : 1,
                    }}
                  >
                    {currentQuestionIndex === generatedQuestions.length - 1
                      ? "질의응답 종료"
                      : "다음 질문"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const mainButtonStyle = {
  width: "100%",
  background: "#6BB5A6",
  color: "white",
  border: "none",
  padding: "18px",
  borderRadius: "20px",
  fontSize: "18px",
  fontWeight: "900",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(107,181,166,0.25)",
};

const subButtonStyle = {
  flex: 1,
  background: "white",
  border: "2px solid #C8E4D6",
  color: "#4B5563",
  padding: "14px",
  borderRadius: "18px",
  fontWeight: "800",
  cursor: "pointer",
};

export default LivePage;