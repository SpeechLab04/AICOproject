import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

// ── 손동작 SVG 데모 ─────────────────────────────────────────────────
const demoBoxStyle = {
  background: "linear-gradient(135deg, #EEF8F4, #F0F9FF)",
  borderRadius: "16px",
  padding: "18px 16px 14px",
  textAlign: "center",
  border: "1.5px dashed #A8D5C8",
  marginBottom: "16px",
};

// 주먹 SVG (정면) - thumbLeft로 엄지 방향 구분
function FistSvg({ thumbLeft }) {
  return (
    <svg viewBox="0 0 70 105" fill="none" style={{ width: "50px", height: "75px" }}>
      <rect x="8" y="44" width="54" height="48" rx="13" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5"/>
      <rect x="12" y="30" width="11" height="22" rx="6" fill="#F5C9A0" stroke="#C08060" strokeWidth="2"/>
      <rect x="26" y="24" width="11" height="26" rx="6" fill="#F5C9A0" stroke="#C08060" strokeWidth="2"/>
      <rect x="40" y="27" width="10" height="23" rx="5" fill="#F5C9A0" stroke="#C08060" strokeWidth="2"/>
      <rect x="51" y="32" width="9" height="18" rx="5" fill="#F5C9A0" stroke="#C08060" strokeWidth="2"/>
      {thumbLeft
        ? <ellipse cx="5" cy="62" rx="8" ry="13" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5"/>
        : <ellipse cx="65" cy="62" rx="8" ry="13" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5"/>}
    </svg>
  );
}

// 손바닥 SVG (정면, 손가락 위로) - thumbLeft로 엄지 방향 구분
function OpenHandSvg({ thumbLeft }) {
  return (
    <svg viewBox="0 0 72 115" fill="none" style={{ width: "50px", height: "80px" }}>
      {thumbLeft ? (
        <>
          <rect x="7"  y="24" width="11" height="36" rx="6" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5"/>
          <rect x="21" y="14" width="12" height="44" rx="6" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5"/>
          <rect x="36" y="10" width="12" height="48" rx="6" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5"/>
          <rect x="51" y="16" width="11" height="42" rx="6" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5"/>
          <path d="M 7 56 Q 4 74 4 84 Q 4 105 36 107 Q 68 105 68 84 Q 68 72 65 56 Z" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5" strokeLinejoin="round"/>
          <ellipse cx="64" cy="70" rx="9" ry="14" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5"/>
        </>
      ) : (
        <>
          <rect x="54" y="24" width="11" height="36" rx="6" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5"/>
          <rect x="39" y="14" width="12" height="44" rx="6" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5"/>
          <rect x="24" y="10" width="12" height="48" rx="6" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5"/>
          <rect x="10" y="16" width="11" height="42" rx="6" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5"/>
          <path d="M 65 56 Q 68 74 68 84 Q 68 105 36 107 Q 4 105 4 84 Q 4 72 7 56 Z" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5" strokeLinejoin="round"/>
          <ellipse cx="8" cy="70" rx="9" ry="14" fill="#F5C9A0" stroke="#C08060" strokeWidth="2.5"/>
        </>
      )}
    </svg>
  );
}

// 정면 손 SVG - 공간분리 제스처용
// 내부선 제거: 채운 도형들을 겹쳐 그리고 CSS drop-shadow로 외곽선만 씌움
function ChopHandSvg({ mirrorX }) {
  const skin = "#F7C89E";
  const ol = "#F07840";
  const shadow = [
    `drop-shadow(2.5px 0 0 ${ol})`, `drop-shadow(-2.5px 0 0 ${ol})`,
    `drop-shadow(0 2.5px 0 ${ol})`, `drop-shadow(0 -2.5px 0 ${ol})`,
    `drop-shadow(2px 2px 0 ${ol})`, `drop-shadow(-2px -2px 0 ${ol})`,
    `drop-shadow(2px -2px 0 ${ol})`, `drop-shadow(-2px 2px 0 ${ol})`,
  ].join(" ");
  return (
    <svg viewBox="0 0 72 114" fill="none"
      style={{ width: "52px", height: "82px", transform: mirrorX ? "scaleX(-1)" : undefined }}>
      {/* 소매 */}
      <rect x="4" y="91" width="62" height="21" rx="9" fill="#D4CCEC" stroke="#9880C4" strokeWidth="2"/>
      <circle cx="18" cy="101" r="3.5" fill="none" stroke="#9880C4" strokeWidth="1.5"/>
      {/* 손 전체 - 외곽만 보임 (내부선 없음) */}
      <g style={{ filter: shadow }}>
        <rect x="5"  y="24" width="13" height="36" rx="6.5" fill={skin}/>  {/* 소지 */}
        <rect x="17" y="16" width="14" height="44" rx="7"   fill={skin}/>  {/* 약지 */}
        <rect x="30" y="10" width="14" height="50" rx="7"   fill={skin}/>  {/* 중지 */}
        <rect x="43" y="16" width="13" height="44" rx="6.5" fill={skin}/>  {/* 검지 */}
        <rect x="3"  y="52" width="58" height="42" rx="18"  fill={skin}/>  {/* 손바닥 */}
        <ellipse cx="62" cy="68" rx="10" ry="14"            fill={skin}/>  {/* 엄지 */}
      </g>
    </svg>
  );
}

function GestureDemo({ type }) {
  if (type === "fist") {
    return (
      <div style={demoBoxStyle}>
        <style>{`
          @keyframes tut-fist-down {
            0%,40% { transform: translateY(0); }
            70%    { transform: translateY(14px); }
            85%,100%{ transform: translateY(0); }
          }
        `}</style>
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "10px" }}>
          <div style={{ animation: "tut-fist-down 1.4s ease-in-out infinite" }}>
            <FistSvg thumbLeft={false} />
          </div>
          <div style={{ animation: "tut-fist-down 1.4s ease-in-out infinite 0.08s" }}>
            <FistSvg thumbLeft={true} />
          </div>
        </div>
      </div>
    );
  }
  if (type === "openhand") {
    return (
      <div style={demoBoxStyle}>
        <style>{`
          @keyframes tut-divide {
            0%,5%   { transform: translate(-28px, -10px); }
            16%     { transform: translate(-28px,   9px); }
            28%,35% { transform: translate(  0px, -10px); }
            46%     { transform: translate(  0px,   9px); }
            58%,65% { transform: translate( 28px, -10px); }
            76%     { transform: translate( 28px,   9px); }
            88%,100%{ transform: translate(-28px, -10px); }
          }
        `}</style>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
          <div style={{ display: "flex", gap: "20px", animation: "tut-divide 3.6s ease-in-out infinite" }}>
            <OpenHandSvg thumbLeft={false} />
            <OpenHandSvg thumbLeft={true} />
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// ── 카메라 가이드라인 (LivePage.jsx와 동일한 실루엣) ─────────────────
function CameraGuideline({ color, detectTurn }) {
  return (
    <svg
      viewBox="0 0 320 240"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
      }}
      fill="none"
    >
      {/* 실시간 모드와 동일한 사람 실루엣 */}
      <path
        d="M35,234 C 52,195 62,128 118,128 A 62,62 0 1 1 202,128 C 258,128 268,195 285,234"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="10,7"
        strokeLinecap="round"
        fill="none"
      />
      {/* 고개 방향 화살표 */}
      {detectTurn === "right" && (
        <path
          d="M 248 62 L 298 62 M 282 46 L 299 62 L 282 78"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {detectTurn === "left" && (
        <path
          d="M 72 62 L 22 62 M 38 46 L 21 62 L 38 78"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

// ── 스텝 정의 ────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "front",
    title: "정면 보기",
    subtitle: "발표의 기본 자세",
    emoji: "😊",
    instruction: "카메라를 정면으로 바라봐주세요.\n얼굴이 가이드라인 안에 들어오면\n자동으로 다음 단계로 넘어갑니다.",
    tip: "1~2m 거리를 유지하고 상반신이 보이도록 위치를 조정해주세요.",
    autoDetect: true,
    detectTurn: null,
  },
  {
    id: "right",
    title: "오른쪽 바라보기",
    subtitle: "청중 시선 처리",
    emoji: "➡️",
    instruction: "발표 시 오른쪽 청중을 바라보는 연습이에요.\n천천히 오른쪽으로 고개를 돌리고\n자세를 유지하면 자동으로 넘어갑니다.",
    tip: "너무 급하게 돌리지 말고 자연스럽게 이동하세요.",
    autoDetect: true,
    detectTurn: "right",
  },
  {
    id: "left",
    title: "왼쪽 바라보기",
    subtitle: "청중 시선 처리",
    emoji: "⬅️",
    instruction: "이번엔 왼쪽 청중을 바라보는 연습이에요.\n천천히 왼쪽으로 고개를 돌리고\n자세를 유지하면 자동으로 넘어갑니다.",
    tip: "오른쪽 → 정면 → 왼쪽 순서로 골고루 바라보는 습관을 만들어보세요.",
    autoDetect: true,
    detectTurn: "left",
  },
  {
    id: "gesture1",
    title: "강조 제스처",
    subtitle: "손동작 연습",
    emoji: "✊",
    instruction: "중요한 내용을 강조할 때 쓰는 제스처예요.\n양 주먹을 아래로 힘있게 내려쳐보세요.",
    tip: "탁자를 가볍게 두드리는 느낌으로 해보세요. 너무 세게 하지 않아도 돼요!",
    autoDetect: false,
    visual: "fist",
  },
  {
    id: "gesture2",
    title: "분할 제스처",
    subtitle: "손동작 연습",
    emoji: "✋",
    instruction: "내용을 나눠서 설명할 때 쓰는 제스처예요.\n손을 세로로 세우고, 왼쪽 → 가운데 → 오른쪽 순서로 내려쳐보세요.",
    tip: '"첫 번째는... 두 번째는..." 하면서 손으로 나누는 동작을 해보세요.',
    autoDetect: false,
    visual: "openhand",
  },
  {
    id: "smile",
    title: "미소 짓기",
    subtitle: "표정 연습",
    emoji: "😄",
    instruction: "발표 중 자연스러운 미소는 청중에게 좋은 인상을 줘요.\n카메라를 보며 자연스럽게 미소 지어보세요.",
    tip: "억지 웃음보다 편안한 표정이 훨씬 좋아요.",
    autoDetect: false,
  },
  {
    id: "voice",
    title: "음성 테스트",
    subtitle: "목소리 확인",
    emoji: "🎤",
    instruction: '"안녕하세요, 발표를 시작하겠습니다."라고 말해보세요.\n목소리가 자신 있게 나오는지 확인해보세요.',
    tip: "발표 전 목소리를 미리 풀어두면 긴장이 줄어들어요.",
    autoDetect: false,
  },
];

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────
function TutorialPage() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const [stepIdx, setStepIdx] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [cameraOk, setCameraOk] = useState(false);
  const [holdCount, setHoldCount] = useState(0);
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const stepIdxRef = useRef(0);
  const detectedRef = useRef(false);
  const holdCountRef = useRef(0);
  const recognitionRef = useRef(null);

  // 카메라 시작
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        console.error("카메라 접근 오류:", e);
      }
    };
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, []);

  const goNext = useCallback(() => {
    holdCountRef.current = 0;
    setHoldCount(0);
    setCameraOk(false);
    const next = stepIdxRef.current + 1;
    if (next < STEPS.length) {
      stepIdxRef.current = next;
      detectedRef.current = false;
      setStepIdx(next);
    } else {
      setCompleted(true);
    }
  }, []);

  const checkCamera = useCallback(async () => {
    if (detectedRef.current) return;
    if (!videoRef.current || !streamRef.current) return;
    if (videoRef.current.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, -canvas.width, 0);

    const currentStep = STEPS[stepIdxRef.current];

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");
      try {
        const res = await fetch("http://127.0.0.1:8000/check-camera", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        const detected = currentStep.detectTurn
          ? data.head_turn === currentStep.detectTurn
          : data.is_valid;

        setCameraOk(detected);

        if (detected) {
          holdCountRef.current = Math.min(holdCountRef.current + 1, 2);
          setHoldCount(holdCountRef.current);
          if (holdCountRef.current >= 2 && !detectedRef.current) {
            detectedRef.current = true;
            setTimeout(() => goNext(), 500);
          }
        } else {
          holdCountRef.current = 0;
          setHoldCount(0);
        }
      } catch (e) {
        console.error("카메라 체크 오류:", e);
      }
    }, "image/jpeg", 0.7);
  }, [goNext]);

  // 스텝 변경 시 인터벌 재설정
  useEffect(() => {
    if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    holdCountRef.current = 0;
    setHoldCount(0);
    setCameraOk(false);
    const step = STEPS[stepIdx];
    if (step?.autoDetect) {
      checkIntervalRef.current = setInterval(checkCamera, 1500);
    }
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
    };
  }, [stepIdx, checkCamera]);

  // 음성 인식 (voice 스텝에서만)
  useEffect(() => {
    const currentStep = STEPS[stepIdx];
    if (currentStep?.id !== "voice") {
      if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch(e) {} recognitionRef.current = null; }
      setVoiceDetected(false);
      setIsListening(false);
      setVoiceTranscript("");
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setVoiceDetected(true); return; } // 미지원 브라우저는 그냥 활성화

    const rec = new SR();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = false;

    rec.onstart  = () => setIsListening(true);
    rec.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join("");
      setVoiceTranscript(text);
      if (text.trim().replace(/\s/g, "").length >= 6) {
        setVoiceDetected(true);
        setIsListening(false);
        try { rec.stop(); } catch(err) {}
      }
    };
    rec.onerror  = (e) => {
      setIsListening(false);
      if (e.error === "not-allowed") setVoiceDetected(true); // 권한 거부 시 그냥 활성화
    };
    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;
    try { rec.start(); } catch(e) {}

    return () => { try { rec.abort(); } catch(e) {} };
  }, [stepIdx]);

  const step = STEPS[stepIdx];
  const progress = Math.round((stepIdx / STEPS.length) * 100);
  const silhouetteColor = cameraOk ? "#6BB5A6" : "#E53E3E";
  const holdPct = (holdCount / 2) * 100;

  // ── 완료 화면 ──────────────────────────────────────────────────────
  if (completed) {
    return (
      <div style={{ minHeight: "100vh", background: "#F8FCFA" }}>
        <Header showBack />
        <main style={{
          maxWidth: "700px",
          margin: "0 auto",
          padding: isMobile ? "60px 22px" : "100px 40px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "72px", marginBottom: "24px" }}>🎉</div>
          <h2 style={{ fontSize: isMobile ? "30px" : "46px", color: "#2D3A3A", fontWeight: "900", marginBottom: "16px" }}>
            튜토리얼 완료!
          </h2>
          <p style={{ fontSize: isMobile ? "15px" : "18px", color: "#58706D", marginBottom: "48px", lineHeight: "1.7", wordBreak: "keep-all" }}>
            모든 기본 연습을 마쳤어요.<br />이제 실제 발표 연습을 시작해보세요!
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "40px" }}>
            {STEPS.map((s) => (
              <div key={s.id} style={{
                background: "white",
                borderRadius: "14px",
                padding: "14px 8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                border: "1px solid #E4F0EA",
                textAlign: "center",
              }}>
                <div style={{ fontSize: "22px", marginBottom: "4px" }}>{s.emoji}</div>
                <div style={{ fontSize: "12px", color: "#6BB5A6", fontWeight: "700" }}>✓</div>
                <div style={{ fontSize: "11px", color: "#58706D", marginTop: "2px", wordBreak: "keep-all" }}>{s.title}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/scenario")}
            style={{
              width: "100%",
              maxWidth: "400px",
              background: "#6BB5A6",
              color: "white",
              padding: isMobile ? "16px" : "18px",
              borderRadius: "18px",
              fontSize: isMobile ? "16px" : "18px",
              fontWeight: "800",
              boxShadow: "0 8px 20px rgba(107,181,166,0.25)",
              border: "none",
              cursor: "pointer",
            }}
          >
            발표 연습 시작하기 →
          </button>
        </main>
      </div>
    );
  }

  // ── 메인 화면 ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F8FCFA" }}>
      <Header showBack />
      <main style={{
        maxWidth: "940px",
        margin: "0 auto",
        padding: isMobile ? "28px 22px 80px" : "44px 40px 100px",
      }}>
        {/* 제목 */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-block",
            background: "#C8E4D6",
            color: "#4D8F82",
            padding: isMobile ? "6px 14px" : "8px 18px",
            borderRadius: "999px",
            fontWeight: "700",
            marginBottom: "12px",
            fontSize: isMobile ? "12px" : "14px",
          }}>
            발표 연습 튜토리얼
          </div>
          <h2 style={{ fontSize: isMobile ? "26px" : "40px", color: "#2D3A3A", fontWeight: "900", marginBottom: "6px" }}>
            {stepIdx + 1}단계: {step.title}
          </h2>
          <p style={{ color: "#6BB5A6", fontSize: "14px", fontWeight: "700" }}>{step.subtitle}</p>
        </div>

        {/* 진행 바 */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                style={{
                  flex: 1,
                  height: "34px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: i < stepIdx ? "13px" : "17px",
                  background: i < stepIdx ? "#6BB5A6" : i === stepIdx ? "#E5F4EF" : "white",
                  border: i === stepIdx ? "2px solid #6BB5A6" : i < stepIdx ? "none" : "1.5px solid #D4EDEA",
                  color: i < stepIdx ? "white" : "inherit",
                  fontWeight: i < stepIdx ? "900" : "normal",
                  transition: "all 0.3s",
                }}
              >
                {i < stepIdx ? "✓" : s.emoji}
              </div>
            ))}
          </div>
          <div style={{ height: "5px", background: "#E4F0EA", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #6BB5A6, #9BC870)",
              borderRadius: "99px",
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ textAlign: "right", fontSize: "12px", color: "#9BB5B0", marginTop: "6px" }}>
            {stepIdx + 1} / {STEPS.length}
          </div>
        </div>

        {/* 카메라 + 안내 */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "24px",
          alignItems: "start",
        }}>
          {/* 카메라 */}
          <div>
            <div style={{
              background: "#1a1a2e",
              borderRadius: "20px",
              overflow: "hidden",
              aspectRatio: "4/3",
              position: "relative",
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                  display: "block",
                }}
              />

              {/* 가이드라인 오버레이 (실시간 모드와 동일) */}
              <CameraGuideline
                color={step.autoDetect ? silhouetteColor : "rgba(255,255,255,0.18)"}
                detectTurn={step.detectTurn}
              />

              {/* hold 진행 바 (자동 감지 단계만) */}
              {step.autoDetect && (
                <div style={{
                  position: "absolute",
                  bottom: "44px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "58%",
                }}>
                  <div style={{
                    height: "5px",
                    background: "rgba(255,255,255,0.25)",
                    borderRadius: "99px",
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${holdPct}%`,
                      background: "#6BB5A6",
                      borderRadius: "99px",
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                </div>
              )}

              {/* 상태 텍스트 */}
              {step.autoDetect && (
                <div style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: cameraOk ? "rgba(76,175,140,0.92)" : "rgba(200,40,40,0.82)",
                  color: "white",
                  padding: "7px 16px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: "700",
                  whiteSpace: "nowrap",
                  transition: "background 0.3s",
                }}>
                  {cameraOk
                    ? `✅ 감지됨! 유지해주세요... (${holdCount}/2)`
                    : step.detectTurn === "right"
                    ? "➡️ 오른쪽으로 고개를 돌려주세요"
                    : step.detectTurn === "left"
                    ? "⬅️ 왼쪽으로 고개를 돌려주세요"
                    : "📹 가이드라인 안으로 들어와주세요"}
                </div>
              )}
            </div>
          </div>

          {/* 안내 패널 */}
          <div style={{
            background: "white",
            borderRadius: "20px",
            padding: isMobile ? "22px" : "28px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            border: "1px solid #E4F0EA",
          }}>
            <div style={{
              display: "inline-block",
              fontSize: "11px",
              fontWeight: "700",
              padding: "3px 10px",
              borderRadius: "999px",
              background: step.autoDetect ? "#E5F4EF" : "#EEF2FF",
              color: step.autoDetect ? "#3a8a72" : "#5b6abf",
              marginBottom: "14px",
            }}>
              {step.autoDetect ? "📹 자동 감지" : "👆 직접 확인"}
            </div>

            <h3 style={{ fontSize: isMobile ? "20px" : "22px", color: "#2D3A3A", fontWeight: "900", marginBottom: "12px" }}>
              {step.emoji} {step.title}
            </h3>

            <p style={{
              color: "#4B5563",
              fontSize: isMobile ? "14px" : "15px",
              lineHeight: "1.9",
              whiteSpace: "pre-line",
              marginBottom: "16px",
              wordBreak: "keep-all",
            }}>
              {step.instruction}
            </p>

            {/* 손동작 데모 */}
            {step.visual && <GestureDemo type={step.visual} />}

            {step.tip && (
              <div style={{
                background: "#FFFBF0",
                border: "1px solid #F0D98A",
                borderRadius: "14px",
                padding: "11px 15px",
                marginBottom: "20px",
              }}>
                <p style={{ fontSize: "12px", color: "#6B5E00", margin: 0, lineHeight: "1.6", wordBreak: "keep-all" }}>
                  💡 {step.tip}
                </p>
              </div>
            )}

            {step.autoDetect ? (
              <div style={{
                textAlign: "center",
                padding: "14px",
                background: "#F8FCFA",
                borderRadius: "14px",
                color: "#6BB5A6",
                fontWeight: "700",
                fontSize: "13px",
                lineHeight: "1.7",
              }}>
                {step.detectTurn === "right"
                  ? "오른쪽으로 고개를 돌리고\n2번 연속 감지되면 자동으로 넘어갑니다"
                  : step.detectTurn === "left"
                  ? "왼쪽으로 고개를 돌리고\n2번 연속 감지되면 자동으로 넘어갑니다"
                  : "카메라 정면을 바라보고\n2번 연속 감지되면 자동으로 넘어갑니다"}
              </div>
            ) : step.id === "voice" ? (
              <div>
                <div style={{
                  textAlign: "center",
                  padding: "14px",
                  marginBottom: "12px",
                  borderRadius: "14px",
                  background: voiceDetected ? "#E5F4EF" : isListening ? "#FFF4E5" : "#F8FCFA",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: voiceDetected ? "#3a8a72" : isListening ? "#D4830A" : "#6B7C79",
                  transition: "all 0.3s",
                }}>
                  {voiceDetected
                    ? `✅ "${voiceTranscript}"`
                    : isListening
                    ? "🎙️ 듣는 중... (6자 이상 말해주세요)"
                    : "🎙️ 마이크를 준비 중이에요..."}
                </div>
                <button
                  onClick={goNext}
                  disabled={!voiceDetected}
                  style={{
                    width: "100%",
                    background: voiceDetected ? "#6BB5A6" : "#C8D8D4",
                    color: "white",
                    padding: "15px",
                    borderRadius: "14px",
                    fontSize: "16px",
                    fontWeight: "800",
                    border: "none",
                    cursor: voiceDetected ? "pointer" : "not-allowed",
                    boxShadow: voiceDetected ? "0 6px 16px rgba(107,181,166,0.3)" : "none",
                    transition: "background 0.3s, box-shadow 0.3s",
                  }}
                >
                  {voiceDetected ? "튜토리얼 끝내기 🎉" : "말하면 버튼이 활성화돼요"}
                </button>
              </div>
            ) : (
              <button
                onClick={goNext}
                style={{
                  width: "100%",
                  background: "#6BB5A6",
                  color: "white",
                  padding: "15px",
                  borderRadius: "14px",
                  fontSize: "16px",
                  fontWeight: "800",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 6px 16px rgba(107,181,166,0.3)",
                }}
              >
                했어요! 다음 단계 →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default TutorialPage;
