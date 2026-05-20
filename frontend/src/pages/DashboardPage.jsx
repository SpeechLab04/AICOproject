import { useState } from "react";
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

  const voiceScore = analysisResult?.voice?.score || 85;
  const speedWpm = analysisResult?.voice?.speed_wpm || 140;
  const fillerCount = analysisResult?.voice?.filler_count || 0;
  const voiceFeedback =
    analysisResult?.voice?.feedback || "음성 분석 결과입니다.";

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
            speedWpm={speedWpm}
            fillerCount={fillerCount}
            feedback={voiceFeedback}
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

function VoiceDetail({ score, speedWpm, fillerCount, feedback }) {
  return (
    <section style={cardStyle}>
      <h3 style={sectionTitle}>
        <Mic size={28} color="#6BB5A6" />
        음성 분석 상세
      </h3>

      <DetailScore score={score} label="음성 분석 점수" />

      <VoiceRow
        label="말하기 속도"
        value={`${speedWpm} WPM`}
        desc="발표 음성에서 측정된 말하기 속도입니다."
      />

      <VoiceRow
        label="필러워드 사용"
        value={`${fillerCount}회`}
        desc={feedback}
      />

      <div style={{ marginTop: "34px" }}>
        <h4
          style={{
            fontSize: "22px",
            marginBottom: "20px",
            color: "#2D3A3A",
          }}
        >
          필러워드 사용 비율
        </h4>

        <div
          style={{
            background: "#F8FCFA",
            borderRadius: "22px",
            padding: "28px",
          }}
        >
          <div
            style={{
              height: "18px",
              background: "#E4F0EA",
              borderRadius: "999px",
              overflow: "hidden",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                width: `${Math.min(fillerCount * 8, 100)}%`,
                height: "100%",
                background: "#94CDD8",
              }}
            />
          </div>

          <p
            style={{
              color: "#6B7C79",
              fontSize: "16px",
            }}
          >
            필러워드 사용 횟수 기반 분석 결과입니다.
          </p>
        </div>
      </div>
    </section>
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
          내용 분석 상세
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

export default DashboardPage;