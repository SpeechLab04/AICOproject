import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  AlertCircle,
  Target,
  Mic,
  FileText,
  RotateCcw,
  Video,
  MessageSquare,
  Eye,
  Volume2,
  Brain,
  User,
  Smile,
  Hand,
  Lightbulb,
  Clock,
} from "lucide-react";
import Header from "../components/Header";

function DashboardPage() {
  const navigate = useNavigate();
  const [selectedAnalysis, setSelectedAnalysis] = useState("video");
  const videoRef = useRef(null);
  const [voiceDetailResult, setVoiceDetailResult] = useState(null);


  const analysisResult = JSON.parse(
    localStorage.getItem("analysisResult") || "null"
  );

  const scenario =
    JSON.parse(localStorage.getItem("selectedScenario")) || {
      title: "학교 발표",
    };

  const audiences =
    JSON.parse(localStorage.getItem("selectedAudiences")) || [];

  const uploadedVideoUrl =
    analysisResult?.video_url || localStorage.getItem("uploadedVideoUrl");

  const totalScore = Math.round(
    Number(analysisResult?.total_score || 83)
  );

  const postureScore = analysisResult?.posture?.score || 0;
  const postureFeedback =
    analysisResult?.posture?.feedback || "발표 자세 분석 결과입니다.";
  const videoDashboard = analysisResult?.posture?.video_dashboard || null;

  const videoMetrics = videoDashboard?.metrics || [
    {
      key: "head",
      label: "고개 방향",
      score: analysisResult?.posture?.head_pose?.head_score || 0,
      feedback: analysisResult?.posture?.head_pose?.head_feedback || "",
    },
    {
      key: "emotion",
      label: "표정",
      score: analysisResult?.posture?.emotion?.emotion_score || 0,
      feedback: analysisResult?.posture?.emotion?.emotion_feedback || "",
    },
    {
      key: "gaze",
      label: "시선",
      score: analysisResult?.posture?.gaze?.gaze_score || 0,
      feedback: analysisResult?.posture?.gaze?.gaze_feedback || "",
    },
    {
      key: "gesture",
      label: "손동작",
      score: analysisResult?.posture?.gesture?.gesture_score || 0,
      feedback: analysisResult?.posture?.gesture?.gesture_feedback || "",
    },
  ];

  const videoTimeline = videoDashboard?.timeline || [];

  useEffect(() => {
    const fetchVoiceDetail = async () => {
      const fileId = analysisResult?.voice?.file_id;

      if (!fileId) return;

      try {
        const response = await fetch(`http://127.0.0.1:8000/result/${fileId}`);
        const data = await response.json();

        if (data.status === "processing") {
          console.log("음성 상세 분석 진행 중");
          return;
        }

        if (data.success) {
          setVoiceDetailResult(data);
        }
      } catch (error) {
        console.error("음성 상세 분석 조회 실패:", error);
      }
    };

    fetchVoiceDetail();

    const timer = setInterval(fetchVoiceDetail, 3000);

    return () => clearInterval(timer);
  }, []);

  const voiceData = voiceDetailResult || analysisResult?.voice || {};
  console.log("voiceData:", voiceData);
  console.log("summary:", voiceData.summary);
  const voiceSummary = voiceData.summary || {};
  const voiceHabits = voiceData.speech_habits || {};
  const voiceTimeline = voiceData.timeline_events || {};

  const voiceScore = voiceSummary.vibrancy_score || voiceData.score || 0;
  const speedWpm = voiceSummary.wpm || voiceData.speed_wpm || 0;
  const fillerCount = voiceHabits.filler_count || voiceData.filler_count || 0;
  const voiceFeedback =
    voiceSummary.feedback || voiceData.feedback || "음성 분석 결과입니다.";

  const contentScore = analysisResult?.script?.score || 83;
  const scriptSummary =
    analysisResult?.script?.summary || "발표 내용 요약 결과입니다.";
  const scriptText =
    analysisResult?.script?.full_script || "스크립트 결과가 없습니다.";
  const expectedQuestions = analysisResult?.script?.questions || [];

  const audienceQuestions =
    audiences.length > 0
      ? audiences.map((audience, index) => ({
          audience: audience.name,
          questions: [
            index === 0
              ? "이 발표 주제를 선택한 이유는 무엇인가요?"
              : index === 1
              ? "기존 서비스와 비교했을 때 차별점은 무엇인가요?"
              : index === 2
              ? "실제 사용자에게 어떤 도움이 될 수 있나요?"
              : "이 서비스를 앞으로 어떻게 발전시킬 계획인가요?",
          ],
        }))
      : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FCFA",
        color: "#2F3E46",
      }}
    >
      <Header />

      <main
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "50px 60px 100px",
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <h2
            style={{
              fontSize: "42px",
              fontWeight: "900",
              color: "#2D3A3A",
              marginBottom: "10px",
            }}
          >
            AI 발표 코칭 결과
          </h2>

          <p style={{ color: "#6B7C79", fontSize: "18px" }}>
            {scenario.title} · {new Date().toLocaleDateString()}
          </p>
        </div>

        <section
          style={{
            background: "linear-gradient(135deg, #6BB5A6, #94CDD8)",
            color: "white",
            borderRadius: "32px",
            padding: "42px",
            textAlign: "center",
            boxShadow: "0 16px 36px rgba(107,181,166,0.28)",
            marginBottom: "28px",
          }}
        >
          <p
            style={{
              fontWeight: "800",
              marginBottom: "12px",
              fontSize: "18px",
            }}
          >
            종합 점수
          </p>

          <h1
            style={{
              fontSize: "78px",
              fontWeight: "900",
              marginBottom: "18px",
            }}
          >
            {totalScore}
          </h1>

          <div
            style={{
              height: "12px",
              background: "rgba(255,255,255,0.32)",
              borderRadius: "999px",
              overflow: "hidden",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                width: `${totalScore}%`,
                height: "100%",
                background: "white",
                borderRadius: "999px",
              }}
            />
          </div>

          <strong style={{ fontSize: "18px" }}>
            발표 분석이 완료되었습니다 🎉
          </strong>
        </section>

        <section style={cardStyle}>
          <h3 style={sectionTitle}>
            <Video size={28} color="#6BB5A6" />
            발표 영상
          </h3>

          {uploadedVideoUrl ? (
            <video
              ref={videoRef}
              src={uploadedVideoUrl}
              controls
              style={{
                width: "100%",
                borderRadius: "24px",
                maxHeight: "520px",
                background: "black",
                objectFit: "contain",
              }}
            />
          ) : (
            <div
              style={{
                background: "#F8FCFA",
                borderRadius: "22px",
                padding: "46px",
                textAlign: "center",
                color: "#6B7C79",
              }}
            >
              영상 데이터를 불러올 수 없습니다.
            </div>
          )}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "24px",
            marginBottom: "28px",
          }}
        >
          <SummaryCard
            icon={<CheckCircle size={26} color="#6BB5A6" />}
            title="강점"
            items={[
              "발표 흐름이 자연스럽습니다",
              "청중과의 시선 처리가 안정적입니다",
              "핵심 내용을 잘 전달하고 있습니다",
            ]}
          />

          <SummaryCard
            icon={<AlertCircle size={26} color="#9BC870" />}
            title="개선사항"
            items={[
              "필러워드 사용을 줄여보세요",
              "답변 시 근거를 조금 더 보강해보세요",
              "핵심 키워드를 조금 더 강조해보세요",
            ]}
          />
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            marginBottom: "28px",
          }}
        >
          <AnalysisCard
            active={selectedAnalysis === "video"}
            icon={<Eye size={28} color="#6BB5A6" />}
            title="영상 분석"
            desc="자세, 시선, 발표 태도 분석"
            onClick={() => setSelectedAnalysis("video")}
          />

          <AnalysisCard
            active={selectedAnalysis === "voice"}
            icon={<Volume2 size={28} color="#6BB5A6" />}
            title="음성 분석"
            desc={`말속도 ${speedWpm} WPM · 필러워드 ${fillerCount}회`}
            onClick={() => setSelectedAnalysis("voice")}
          />

          <AnalysisCard
            active={selectedAnalysis === "content"}
            icon={<Brain size={28} color="#6BB5A6" />}
            title="내용 분석"
            desc="스크립트, 구성, 논리성 분석"
            onClick={() => setSelectedAnalysis("content")}
          />
        </section>

        {selectedAnalysis === "video" && (
          <VideoDetail
            score={postureScore}
            feedback={postureFeedback}
            metrics={videoMetrics}
            timeline={videoTimeline}
          />
        )}

        {selectedAnalysis === "voice" && (
          <VoiceDetail
            score={voiceScore}
            videoRef={videoRef}
            speedWpm={speedWpm}
            fillerCount={fillerCount}
            feedback={voiceFeedback}
            summary={voiceSummary}
            habits={voiceHabits}
            timeline={voiceTimeline}
          />
        )}

        {selectedAnalysis === "content" && (
          <ContentDetail
            score={contentScore}
            summary={scriptSummary}
            expectedQuestions={expectedQuestions}
            audienceQuestions={audienceQuestions}
            scriptText={scriptText}
          />
        )}

        <div
          style={{
            marginTop: "34px",
            display: "flex",
            gap: "16px",
          }}
        >
          <button
            onClick={() => navigate("/practice-mode")}
            style={primaryButton}
          >
            <RotateCcw
              size={20}
              style={{ verticalAlign: "middle", marginRight: "8px" }}
            />
            다시 연습하기
          </button>

          <button onClick={() => navigate("/")} style={secondaryButton}>
            홈으로 이동
          </button>
        </div>
      </main>
    </div>
  );
}

function AnalysisCard({ active, icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#E5F4EF" : "white",
        borderRadius: "28px",
        padding: "34px 28px",
        boxShadow: active
          ? "0 16px 36px rgba(107,181,166,0.18)"
          : "0 10px 30px rgba(0,0,0,0.05)",
        border: active ? "2px solid #6BB5A6" : "1px solid #E4F0EA",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          width: "68px",
          height: "68px",
          borderRadius: "50%",
          background: active ? "white" : "#E5F4EF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 22px",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontSize: "26px",
          marginBottom: "14px",
          color: "#2D3A3A",
          fontWeight: "900",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: "#6B7C79",
          fontSize: "17px",
          lineHeight: "1.7",
        }}
      >
        {desc}
      </p>
    </button>
  );
}

function DetailScore({ score, label }) {
  return (
    <div
      style={{
        background: "#EEF8F4",
        borderRadius: "24px",
        padding: "24px",
        marginBottom: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <strong
        style={{
          fontSize: "22px",
          color: "#2D3A3A",
        }}
      >
        {label}
      </strong>

      <div
        style={{
          color: "#6BB5A6",
          fontSize: "34px",
          fontWeight: "900",
        }}
      >
        {score}점
      </div>
    </div>
  );
}

function VideoDetail({ score, feedback, metrics, timeline }) {
  return (
    <section style={cardStyle}>
      <h3 style={sectionTitle}>
        <Video size={28} color="#6BB5A6" />
        영상 분석 결과
      </h3>

      <p style={{ color: "#6B7C79", fontSize: "18px", lineHeight: "1.7", marginBottom: "28px" }}>
        발표 영상을 기반으로 자세, 표정, 시선, 손동작을 종합 분석했습니다.
      </p>

      <div style={{ background: "#EEF8F4", borderRadius: "26px", padding: "30px", marginBottom: "28px" }}>
        <p style={{ color: "#6B7C79", fontWeight: "800", marginBottom: "8px" }}>
          종합 태도 점수
        </p>
        <strong style={{ display: "block", fontSize: "56px", color: "#6BB5A6", fontWeight: "900", marginBottom: "18px" }}>
          {score}점
        </strong>
        <p style={{ color: "#2D3A3A", fontSize: "18px", lineHeight: "1.8", whiteSpace: "pre-line" }}>
          {feedback}
        </p>
      </div>

      <div style={{ background: "#F8FCFA", borderRadius: "26px", padding: "30px", border: "1px solid #E4F0EA", marginBottom: "28px" }}>
        <h4 style={{ fontSize: "24px", color: "#2D3A3A", fontWeight: "900", marginBottom: "24px" }}>
          항목별 태도 점수
        </h4>

        <div style={{ display: "grid", gap: "22px" }}>
          {metrics.map((item) => (
            <VideoMetricRow key={item.key || item.label} item={item} />
          ))}
        </div>
      </div>

      <div style={{ background: "#F8FCFA", borderRadius: "26px", padding: "30px", border: "1px solid #E4F0EA", marginBottom: "28px" }}>
        <h4 style={{ fontSize: "24px", color: "#2D3A3A", fontWeight: "900", marginBottom: "24px" }}>
          시간 구간별 점수 변화
        </h4>

        {timeline.length > 0 ? (
          <TimelineChart data={timeline} />
        ) : (
          <p style={{ color: "#6B7C79" }}>
            시간 구간별 분석 데이터는 아직 없습니다.
          </p>
        )}
      </div>

      <div style={{ background: "#F8FCFA", borderRadius: "26px", padding: "30px", border: "1px solid #E4F0EA" }}>
        <h4 style={{ fontSize: "24px", color: "#2D3A3A", fontWeight: "900", marginBottom: "24px" }}>
          항목별 피드백
        </h4>

        <div style={{ display: "grid", gap: "14px" }}>
          {metrics.map((item) => (
            <div key={item.key || item.label} style={{ background: "white", borderRadius: "18px", padding: "20px 22px", border: "1px solid #E4F0EA" }}>
              <strong style={{ display: "block", color: "#2D3A3A", fontSize: "18px", marginBottom: "10px" }}>
                {item.label}
              </strong>
              <p style={{ color: "#4B5563", lineHeight: "1.8", whiteSpace: "pre-line" }}>
                {item.feedback}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoMetricRow({ item }) {
  const score = item.score ?? 0;
  const warning = score < 60;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "150px 70px 1fr", gap: "20px", alignItems: "center" }}>
      <strong style={{ color: "#2D3A3A", fontSize: "18px" }}>
        {item.label}
      </strong>

      <strong style={{ color: warning ? "#D99A2B" : "#6BB5A6", fontSize: "18px" }}>
        {score}점
      </strong>

      <div style={{ height: "12px", background: "#E4F0EA", borderRadius: "999px", overflow: "hidden" }}>
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: warning ? "#D99A2B" : "#6BB5A6",
            borderRadius: "999px",
          }}
        />
      </div>
    </div>
  );
}

function TimelineChart({ data }) {
  const [hovered, setHovered] = useState(null);

  const width = 900;
  const height = 300;
  const padding = 46;

  const getX = (index) =>
    padding + (index * (width - padding * 2)) / (data.length - 1);

  const getY = (score) =>
    height - padding - (score / 100) * (height - padding * 2);

  const makeLine = (key) =>
    data.map((item, index) => `${getX(index)},${getY(item[key])}`).join(" ");

  const lines = [
    { key: "head_score", label: "고개 방향", color: "#6BB5A6" },
    { key: "emotion_score", label: "표정", color: "#D99A2B" },
    { key: "gaze_score", label: "시선", color: "#94CDD8" },
    { key: "gesture_score", label: "손동작", color: "#9BC870" },
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={width} height={height}>
        {[0, 25, 50, 75, 100].map((value) => (
          <g key={value}>
            <line
              x1={padding}
              x2={width - padding}
              y1={getY(value)}
              y2={getY(value)}
              stroke="#E4F0EA"
            />
            <text x="10" y={getY(value) + 5} fontSize="13" fill="#6B7C79">
              {value}
            </text>
          </g>
        ))}

        {data.map((item, index) => (
          <text
            key={item.time}
            x={getX(index) - 16}
            y={height - 12}
            fontSize="13"
            fill="#6B7C79"
          >
            {item.time}
          </text>
        ))}

        {lines.map((line) => (
          <polyline
            key={line.key}
            points={makeLine(line.key)}
            fill="none"
            stroke={line.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {lines.map((line) =>
          data.map((item, index) => {
            const x = getX(index);
            const y = getY(item[line.key]);

            return (
              <g
                key={`${line.key}-${index}`}
                onMouseEnter={() =>
                  setHovered({
                    x,
                    y,
                    text: `${item.time} / ${line.label}: ${item[line.key]}점`,
                  })
                }
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <circle cx={x} cy={y} r="14" fill="transparent" />
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill={line.color}
                  stroke="white"
                  strokeWidth="2"
                />
              </g>
            );
          })
        )}

        {hovered && (
          <g>
            {(() => {
              const tooltipWidth = 190;
              const tooltipHeight = 36;
              const tooltipX = Math.max(
                10,
                Math.min(hovered.x - tooltipWidth / 2, width - tooltipWidth - 10)
              );
              const tooltipY = Math.max(10, hovered.y - 48);

              return (
                <>
                  <rect
                    x={tooltipX}
                    y={tooltipY}
                    width={tooltipWidth}
                    height={tooltipHeight}
                    rx="10"
                    fill="#2D3A3A"
                  />
                  <text
                    x={tooltipX + tooltipWidth / 2}
                    y={tooltipY + 23}
                    textAnchor="middle"
                    fontSize="13"
                    fill="white"
                    fontWeight="700"
                  >
                    {hovered.text}
                  </text>
                </>
              );
            })()}
          </g>
        )}
      </svg>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          marginTop: "8px",
          color: "#6B7C79",
          fontSize: "15px",
        }}
      >
        {lines.map((line) => (
          <span key={line.key}>
            <span style={{ color: line.color }}>●</span> {line.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function VoiceDetail({
  score,
  speedWpm,
  fillerCount,
  feedback,
  summary,
  habits,
  timeline,
  videoRef,
}) {
  const wpm = Math.round(speedWpm || 0);
  const vibrancyScore = Math.round(score || 0);
  const [activePoint, setActivePoint] = useState(null);
  const wpmNeedleDegree = Math.min(
    90,
    Math.max(-90, ((wpm - 120) / 40) * 90)
  );
  const voiceMetrics = [
    {
      key: "wpm",
      label: "말하기 속도",
      score: wpm > 0 ? Math.min(100, Math.round((wpm / 160) * 100)) : 0,
      feedback:
        wpm > 0
          ? feedback || "말하기 속도 분석 결과입니다."
          : "말하기 속도가 아직 인식되지 않았습니다. 발표 음성이 또렷하게 녹음되도록 조용한 환경에서 다시 촬영해보세요.",
    },
    {
      key: "vibrancy",
      label: "목소리 활력",
      score: vibrancyScore,
      feedback:
        vibrancyScore > 0
          ? "억양 변화와 목소리 활력 정도를 분석한 결과입니다."
          : "목소리 활력 점수가 아직 인식되지 않았습니다. 너무 작은 목소리나 주변 소음이 있으면 분석이 어려울 수 있습니다.",
    },
    {
      key: "filler",
      label: "추임새 사용",
      score: habits.filler_count || fillerCount ? Math.max(0, 100 - (habits.filler_count || fillerCount) * 10) : 100,
      feedback:
        (habits.filler_count || fillerCount) > 0
          ? `불필요한 추임새가 ${habits.filler_count || fillerCount}회 감지되었습니다. 문장 사이에 잠깐 멈추는 방식으로 말하면 더 안정적으로 들립니다.`
          : "불필요한 추임새가 크게 감지되지 않았습니다.",
    },
    {
      key: "repeat",
      label: "반복 표현",
      score: habits.echo_count ? Math.max(0, 100 - habits.echo_count * 15) : 100,
      feedback:
        habits.echo_count > 0
          ? `반복 표현이 ${habits.echo_count}회 감지되었습니다. 같은 단어를 반복하기보다 문장을 짧게 정리해 말하는 연습이 필요합니다.`
          : "반복 표현이 크게 감지되지 않았습니다.",
    },
  ];

  const voiceTotalScore =
    vibrancyScore > 0
      ? Math.round(
          voiceMetrics.reduce((sum, item) => sum + item.score, 0) /
            voiceMetrics.length
        )
      : 0;

  return (
    <section style={cardStyle}>
      <h3 style={sectionTitle}>
        <Mic size={28} color="#6BB5A6" />
        음성 분석 결과
      </h3>

      <p style={{ color: "#6B7C79", fontSize: "18px", lineHeight: "1.7", marginBottom: "28px" }}>
        발표 음성을 기반으로 말하기 속도, 목소리 활력, 추임새 사용, 반복 표현을 종합 분석했습니다.
      </p>

      <div style={{ background: "#EEF8F4", borderRadius: "26px", padding: "30px", marginBottom: "28px" }}>
        <p style={{ color: "#6B7C79", fontWeight: "800", marginBottom: "8px" }}>
          음성 분석 총점
        </p>

        <strong style={{ display: "block", fontSize: "56px", color: "#6BB5A6", fontWeight: "900", marginBottom: "18px" }}>
          {voiceTotalScore}점
        </strong>

        <p style={{ color: "#2D3A3A", fontSize: "18px", lineHeight: "1.8", whiteSpace: "pre-line" }}>
          {voiceTotalScore > 0
            ? "말하기 속도, 목소리 활력, 불필요한 추임새 사용, 반복 표현을 종합한 음성 분석 점수입니다."
            : "음성 분석 결과가 아직 충분히 인식되지 않았습니다. 조용한 환경에서 또렷한 목소리로 다시 촬영해보세요."}
        </p>
      </div>

      <div style={{ background: "#F8FCFA", borderRadius: "26px", padding: "30px", border: "1px solid #E4F0EA", marginBottom: "28px" }}>
        <h4 style={{ fontSize: "24px", color: "#2D3A3A", fontWeight: "900", marginBottom: "24px" }}>
          항목별 음성 점수
        </h4>

        <div style={{ display: "grid", gap: "22px" }}>
          {voiceMetrics.map((item) => (
            <VideoMetricRow key={item.key} item={item} />
          ))}
        </div>
      </div>

      <div style={voiceDashboardGrid}>
        <div style={voiceHalfBox}>
          <h4 style={voiceBoxTitle}>말하기 속도 (WPM)</h4>

          <div style={wpmArcBox}>
            <div style={wpmGaugePanel}>
              <div style={wpmSegmentLabels}>
                <span>매우 느림</span>
                <span>조금 느림</span>
                <span>적절함</span>
                <span>조금 빠름</span>
                <span>매우 빠름</span>
              </div>

              <div style={wpmArc}>
                <div style={wpmInnerMask} />
                <div
                  style={{
                    ...wpmArcNeedle,
                    transform: `translateX(-50%) rotate(${wpmNeedleDegree}deg)`,
                  }}
                />
                <div style={wpmNeedleDot} />

                <div style={wpmArcCenter}>
                  <strong>{wpm}</strong>
                  <span>{summary.status || "분석 완료"}</span>
                </div>
              </div>

              <div style={wpmCaption}>
                {summary.feedback || feedback || "말하기 속도 분석 결과입니다."}
              </div>
            </div>
          </div>
        </div>

        <div style={voiceHalfBox}>
          <h4 style={voiceBoxTitle}>목소리 활력 점수</h4>

          <div style={voiceCircleScoreBox}>
            <div
              style={{
                ...voiceCircleScore,
                background: `conic-gradient(#6BB5A6 0% ${vibrancyScore}%, #E5F4EF ${vibrancyScore}% 100%)`,
              }}
            >
              <div style={voiceCircleInner}>
                <strong>{vibrancyScore}</strong>
                <span>점</span>
              </div>
            </div>
          </div>

          <p style={voiceFeedbackText}>억양 변화와 목소리 활력 정도를 분석한 점수입니다.</p>
        </div>

        <div style={voiceWideBox}>
          <h4 style={voiceBoxTitle}>언어 습관 분석</h4>

          <div style={habitDashboard}>
            <div style={habitDonutBox}>
              <div style={habitDonut}>
                <div style={habitDonutInner}>
                  <strong>총 {habits.filler_count || fillerCount || 0}회</strong>
                  <span>사용</span>
                </div>
              </div>
            </div>

            <div style={habitLegendBox}>
              <p style={habitSubTitle}>불필요한 추임새</p>

              {(habits.filler_list || []).map((word, idx) => {
                const colors = ["#6BB5A6", "#94CDD8", "#9BC870", "#D99A2B", "#CAD870"];
                const color = colors[idx % colors.length];

                return (
                  <div key={idx} style={habitLegendItem}>
                    <span style={{ ...habitFlag, color }}>●</span>
                    <span>{word}</span>
                    
                  </div>
                );
              })}
            </div>
          </div>
        </div>



          <div style={voiceWideBox}>
            <h4 style={voiceBoxTitle}>말 수정 및 중복 표현</h4>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "22px" }}>
              <MiniVoiceStat label="추임새 사용" value={`${habits.filler_count || fillerCount || 0}회`} />
              <MiniVoiceStat label="반복 표현" value={`${habits.echo_count || 0}회`} />
              <MiniVoiceStat label="수정 발화" value={`${habits.modification_count || 0}회`} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={speechDetailBox}>
                <strong style={speechDetailTitle}>반복 표현</strong>

                {(habits.duplicate_details || []).length > 0 ? (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {habits.duplicate_details.map((item, idx) => (
                      <div key={idx} style={speechDetailItem}>
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={speechEmptyText}>반복 표현이 크게 감지되지 않았습니다.</p>
                )}
              </div>

              <div style={speechDetailBox}>
                <strong style={speechDetailTitle}>수정 발화</strong>

                {(habits.modification_list || []).length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {habits.modification_list.map((item, idx) => (
                      <span key={idx} style={speechTag}>
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={speechEmptyText}>수정 발화가 크게 감지되지 않았습니다.</p>
                )}
              </div>
            </div>
          </div>

          <div style={voiceWideBox}>
            <h4 style={voiceBoxTitle}>발표 타임라인</h4>

            <div style={interactiveTimeline}>
              <div style={timelineBase} />

              {(timeline.pause_details || []).map((pause, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActivePoint(`pause-${idx}`);

                    if (videoRef?.current) {
                      videoRef.current.currentTime = pause.at;
                      videoRef.current.play();
                    }
                  }}
                  style={{
                    ...timelinePoint,
                    left: `${(pause.at / (summary.total_duration || 1)) * 100}%`,
                    background: "#D99A2B",
                    transform:
                      activePoint === `pause-${idx}`
                        ? "translateX(-50%) scale(1.35)"
                        : "translateX(-50%) scale(1)",
                  }}
                  title={`${pause.at.toFixed(1)}초 · ${pause.duration.toFixed(1)}초 동안 침묵`}
                />
              ))}

              {(timeline.monotone_sections || []).map((mono, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (videoRef?.current) {
                      videoRef.current.currentTime = mono.start;
                      videoRef.current.play();
                    }
                  }}
                  style={{
                    ...timelineBlock,
                    left: `${(mono.start / (summary.total_duration || 1)) * 100}%`,
                    width: `${((mono.end - mono.start) / (summary.total_duration || 1)) * 100}%`,
                  }}
                  title={`${mono.start.toFixed(1)}초 ~ ${mono.end.toFixed(1)}초 단조로운 말투`}
                />
              ))}
            </div>

            <div style={timelineLegend}>
              <span><b style={{ color: "#D99A2B" }}>●</b> 침묵 구간</span>
              <span><b style={{ color: "#94CDD8" }}>●</b> 단조로운 구간</span>
            </div>
          </div>

        
      </div>
    </section>
  );
}

function MiniVoiceStat({ label, value }) {
  return (
    <div style={miniVoiceStat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ContentDetail({
  score,
  summary,
  expectedQuestions,
  audienceQuestions,
  scriptText,
}) {
  return (
    <div style={{ display: "grid", gap: "28px" }}>
      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          <FileText size={28} color="#6BB5A6" />
          내용 분석 결과
        </h3>

        <DetailScore score={score} label="내용 분석 점수" />

        <h4
          style={{
            fontSize: "24px",
            color: "#2D3A3A",
            marginBottom: "16px",
          }}
        >
          발표 내용 요약
        </h4>

        <p
          style={{
            color: "#4B5563",
            fontSize: "18px",
            lineHeight: "1.9",
            whiteSpace: "pre-line",
          }}
        >
          {summary}
        </p>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          <MessageSquare size={28} color="#6BB5A6" />
          청중별 질문
        </h3>

        {audienceQuestions.length > 0 ? (
          audienceQuestions.map((item, index) => (
            <div
              key={index}
              style={{
                background: "#F8FCFA",
                borderRadius: "20px",
                padding: "22px",
                marginBottom: "16px",
              }}
            >
              <strong
                style={{
                  display: "block",
                  color: "#6BB5A6",
                  fontSize: "18px",
                  marginBottom: "12px",
                }}
              >
                {item.audience}
              </strong>

              {item.questions.map((question, qIndex) => (
                <p
                  key={qIndex}
                  style={{
                    color: "#2D3A3A",
                    fontSize: "18px",
                    lineHeight: "1.7",
                    marginBottom: "8px",
                  }}
                >
                  Q{qIndex + 1}. {question}
                </p>
              ))}
            </div>
          ))
        ) : (
          <p style={{ color: "#6B7C79" }}>선택된 청중 질문이 없습니다.</p>
        )}
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          <MessageSquare size={28} color="#6BB5A6" />
          예상 질문
        </h3>

        {expectedQuestions.length > 0 ? (
          expectedQuestions.map((question, index) => {
            const questionText =
              typeof question === "string"
                ? question
                : question?.question || "질문 내용이 없습니다.";

            const personaType =
              typeof question === "object"
                ? question?.persona_type
                : null;

            return (
              <div
                key={index}
                style={{
                  background: "#F8FCFA",
                  borderRadius: "18px",
                  padding: "18px 22px",
                  marginBottom: "14px",
                  color: "#2D3A3A",
                  fontSize: "18px",
                  lineHeight: "1.7",
                }}
              >
                <strong style={{ color: "#6BB5A6" }}>
                  Q{index + 1}
                  {personaType ? ` (${personaType})` : ""}.
                </strong>{" "}

                {questionText}
              </div>
            );
          })
        ) : (
          <p style={{ color: "#6B7C79" }}>
            생성된 예상 질문이 없습니다.
          </p>
        )}
      </section>
      
      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          <FileText size={28} color="#6BB5A6" />
          발표 스크립트
        </h3>

        <div
          style={{
            background: "#F8FCFA",
            borderRadius: "22px",
            padding: "28px",
            maxHeight: "360px",
            overflowY: "auto",
            color: "#4B5563",
            fontSize: "18px",
            lineHeight: "2",
            whiteSpace: "pre-line",
          }}
        >
          {scriptText}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ icon, title, items }) {
  return (
    <div style={cardStyle}>
      <h3
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "24px",
          color: "#2D3A3A",
          marginBottom: "22px",
        }}
      >
        {icon}
        {title}
      </h3>

      {items.map((item, idx) => (
        <p
          key={idx}
          style={{
            color: "#4B5563",
            lineHeight: "1.9",
            fontSize: "17px",
          }}
        >
          · {item}
        </p>
      ))}
    </div>
  );
}

function VoiceRow({ label, value, desc }) {
  return (
    <div
      style={{
        borderBottom: "1px solid #E4F0EA",
        padding: "20px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "18px",
          fontWeight: "800",
          marginBottom: "8px",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#6BB5A6" }}>{value}</span>
      </div>

      <p style={{ color: "#6B7C79" }}>{desc}</p>
    </div>
  );
}

const cardStyle = {
  background: "white",
  borderRadius: "28px",
  padding: "34px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  border: "1px solid #E4F0EA",
  marginBottom: "28px",
};

const tableHeaderStyle = {
  padding: "16px",
  textAlign: "center",
  fontWeight: "900",
  color: "#2D3A3A",
  borderBottom: "1px solid #DDEBE6",
};

const tableCellStyle = {
  padding: "16px",
  textAlign: "center",
  color: "#4B5563",
  borderBottom: "1px solid #E4F0EA",
};

const sectionTitle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "28px",
  color: "#2D3A3A",
  marginBottom: "30px",
  fontWeight: "900",
};

const primaryButton = {
  flex: 1,
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

const secondaryButton = {
  flex: 1,
  background: "white",
  color: "#6BB5A6",
  border: "2px solid #6BB5A6",
  padding: "18px",
  borderRadius: "20px",
  fontSize: "18px",
  fontWeight: "900",
  cursor: "pointer",
};

const voiceBox = {
  background: "#F8FCFA",
  borderRadius: "26px",
  padding: "30px",
  border: "1px solid #E4F0EA",
};

const voiceBoxTitle = {
  fontSize: "24px",
  fontWeight: "900",
  color: "#2D3A3A",
  marginBottom: "22px",
};

const wpmGaugeWrap = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "22px",
};

const wpmGauge = {
  width: "260px",
  height: "150px",
  borderRadius: "260px 260px 0 0",
  background: "linear-gradient(90deg, #CAD870, #6BB5A6, #94CDD8)",
  position: "relative",
  overflow: "hidden",
};

const wpmNeedle = {
  position: "absolute",
  bottom: "0",
  left: "50%",
  width: "4px",
  height: "120px",
  background: "white",
  transform: "translateX(-50%) rotate(18deg)",
  transformOrigin: "bottom center",
  borderRadius: "999px",
};

const wpmCenter = {
  position: "absolute",
  bottom: "-62px",
  left: "50%",
  transform: "translateX(-50%)",
  width: "150px",
  height: "150px",
  borderRadius: "50%",
  background: "white",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#2D3A3A",
};

const circleScoreWrap = {
  display: "flex",
  justifyContent: "center",
  margin: "10px 0 22px",
};

const circleScore = {
  width: "170px",
  height: "170px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const circleInner = {
  width: "128px",
  height: "128px",
  borderRadius: "50%",
  background: "white",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#2D3A3A",
  fontSize: "18px",
};

const voiceFeedbackText = {
  color: "#4B5563",
  fontSize: "17px",
  lineHeight: "1.8",
  textAlign: "center",
};

const miniVoiceStat = {
  background: "white",
  borderRadius: "20px",
  padding: "22px",
  border: "1px solid #E4F0EA",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  color: "#6B7C79",
};

const voiceTag = {
  display: "inline-block",
  background: "#E5F4EF",
  color: "#4D8F82",
  padding: "9px 15px",
  borderRadius: "999px",
  marginRight: "8px",
  marginBottom: "8px",
  fontWeight: "800",
};

const voiceListItem = {
  background: "white",
  borderRadius: "16px",
  padding: "16px 18px",
  color: "#2D3A3A",
  border: "1px solid #E4F0EA",
};

const timelineBar = {
  position: "relative",
  height: "16px",
  background: "#E5F4EF",
  borderRadius: "999px",
  marginTop: "28px",
};

const timelineMarker = {
  position: "absolute",
  top: "-7px",
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  border: "4px solid white",
  boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
};

const timelineSection = {
  position: "absolute",
  top: "0",
  height: "16px",
  background: "#94CDD8",
  borderRadius: "999px",
};

const voiceTotalBox = {
  background: "linear-gradient(135deg, #E5F4EF, #F8FCFA)",
  borderRadius: "28px",
  padding: "34px",
  border: "1px solid #C8E4D6",
  marginBottom: "24px",
  display: "grid",
  gridTemplateColumns: "220px 1fr",
  gap: "28px",
  alignItems: "center",
};

const voiceDashboardGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
  marginBottom: "28px",
  alignItems: "stretch",
};

const voiceWideBox = {
  gridColumn: "1 / 3",
  background: "#F8FCFA",
  borderRadius: "26px",
  padding: "30px",
  border: "1px solid #E4F0EA",
};

const voiceHalfBox = {
  background: "#F8FCFA",
  borderRadius: "26px",
  padding: "30px",
  border: "1px solid #E4F0EA",
};

const wpmArcBox = {
  display: "flex",
  justifyContent: "center",
  margin: "8px 0 8px",
};

const wpmGaugePanel = {
  width: "100%",
  maxWidth: "420px",
  margin: "0 auto",
  borderRadius: "24px",
  padding: "22px 18px 18px",
  position: "relative",
};

const wpmSegmentLabels = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "6px",
  marginBottom: "10px",
  color: "#2D3A3A",
  fontSize: "13px",
  fontWeight: "900",
  textAlign: "center",
};

const wpmArc = {
  width: "320px",
  height: "160px",
  margin: "0 auto",
  borderRadius: "320px 320px 0 0",
  background:
    "conic-gradient(from 270deg at 50% 100%, \
    #8B949E 0deg, \
    #6FA8DC 38deg, \
    #67C587 82deg, \
    #F4B942 128deg, \
    #E5534B 180deg, \
    transparent 180deg)",
  position: "relative",
  overflow: "hidden",
};

const wpmInnerMask = {
  position: "absolute",
  left: "50%",
  bottom: "0",
  transform: "translateX(-50%)",
  width: "190px",
  height: "95px",
  borderRadius: "190px 190px 0 0",
  background: "#EEF8F4",
  zIndex: 1,
};

const wpmArcNeedle = {
  position: "absolute",
  bottom: "0",
  left: "50%",
  width: "5px",
  height: "128px",
  background: "white",
  transform: "translateX(-50%) rotate(0deg)",
  transformOrigin: "bottom center",
  borderRadius: "999px",
  zIndex: 3,
  boxShadow: "0 0 10px rgba(0,0,0,0.15)",
};

const wpmNeedleDot = {
  position: "absolute",
  left: "50%",
  bottom: "-12px",
  transform: "translateX(-50%)",
  width: "26px",
  height: "26px",
  borderRadius: "50%",
  background: "#2D3A3A",
  border: "5px solid white",
  zIndex: 4,
};

const wpmArcCenter = {
  position: "absolute",
  left: "50%",
  bottom: "18px",
  transform: "translateX(-50%)",
  zIndex: 5,
  color: "#2D3A3A",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const wpmCaption = {
  margin: "12px auto 0",
  background: "white",
  borderRadius: "999px",
  padding: "10px 18px",
  width: "fit-content",
  maxWidth: "90%",
  color: "#4B5563",
  fontSize: "15px",
  fontWeight: "700",
  textAlign: "center",
};

const miniDonutArea = {
  display: "grid",
  gridTemplateColumns: "150px 1fr",
  gap: "24px",
  alignItems: "center",
};

const miniDonut = {
  width: "130px",
  height: "130px",
  borderRadius: "50%",
  background: "conic-gradient(#6BB5A6 0% 70%, #E5F4EF 70% 100%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#2D3A3A",
};

const voiceCircleScoreBox = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  marginTop: "70px",
  marginBottom: "30px",
};

const voiceCircleScore = {
  width: "170px",
  height: "170px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const voiceCircleInner = {
  width: "126px",
  height: "126px",
  borderRadius: "50%",
  background: "white",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#2D3A3A",
};

const habitDashboard = {
  display: "grid",
  gridTemplateColumns: "240px 1fr",
  gap: "36px",
  alignItems: "center",
};

const habitDonutBox = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "220px",
};

const habitDonut = {
  width: "170px",
  height: "170px",
  minWidth: "170px",
  minHeight: "170px",
  borderRadius: "50%",
  background:
    "conic-gradient(#6BB5A6 0% 50%, #94CDD8 50% 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const habitDonutInner = {
  width: "108px",
  height: "108px",
  borderRadius: "50%",
  background: "#F8FCFA",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#2D3A3A",
  fontSize: "15px",
  fontWeight: "800",
};

const habitLegendBox = {
  display: "grid",
  gap: "8px",
};

const habitSubTitle = {
  color: "#6B7C79",
  fontWeight: "900",
  marginBottom: "4px",
};

const habitLegendItem = {
  padding: "10px 4px",
  display: "grid",
  gridTemplateColumns: "18px auto",
  alignItems: "center",
  gap: "6px",
  color: "#2D3A3A",
  fontWeight: "800",
};

const habitFlag = {
  color: "#6BB5A6",
  fontSize: "14px",
};

const habitEmptyBox = {
  background: "white",
  border: "1px solid #E4F0EA",
  borderRadius: "16px",
  padding: "16px 18px",
  color: "#6B7C79",
  fontWeight: "700",
};

const interactiveTimeline = {
  position: "relative",
  height: "90px",
  marginTop: "18px",
};

const timelineBase = {
  position: "absolute",
  top: "38px",
  left: 0,
  right: 0,
  height: "12px",
  background: "#E5F4EF",
  borderRadius: "999px",
};

const timelinePoint = {
  position: "absolute",
  top: "28px",
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  border: "4px solid white",
  transform: "translateX(-50%)",
  cursor: "pointer",
  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
  transition: "all 0.2s ease",
};

const timelineBlock = {
  position: "absolute",
  top: "32px",
  height: "14px",
  background: "#94CDD8",
  borderRadius: "999px",
  cursor: "pointer",
};

const timelineLegend = {
  display: "flex",
  gap: "20px",
  marginTop: "18px",
  color: "#6B7C79",
  fontWeight: "700",
};

const speechDetailBox = {
  background: "white",
  borderRadius: "20px",
  padding: "20px",
  border: "1px solid #E4F0EA",
};

const speechDetailTitle = {
  display: "block",
  color: "#2D3A3A",
  fontSize: "18px",
  fontWeight: "900",
  marginBottom: "14px",
};

const speechDetailItem = {
  background: "#F8FCFA",
  borderRadius: "14px",
  padding: "12px 14px",
  color: "#2D3A3A",
  fontWeight: "800",
  border: "1px solid #E4F0EA",
};

const speechTag = {
  background: "#E5F4EF",
  color: "#4D8F82",
  padding: "9px 14px",
  borderRadius: "999px",
  fontWeight: "900",
};

const speechEmptyText = {
  color: "#6B7C79",
  lineHeight: "1.7",
};

export default DashboardPage;