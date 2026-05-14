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
} from "lucide-react";
import Header from "../components/Header";

function DashboardPage() {
  const navigate = useNavigate();
  const [selectedAnalysis, setSelectedAnalysis] = useState("video");

  const scenario =
    JSON.parse(localStorage.getItem("selectedScenario")) || {
      title: "학교 발표",
    };

  const audiences = JSON.parse(localStorage.getItem("selectedAudiences")) || [];
  const uploadedVideoUrl = localStorage.getItem("uploadedVideoUrl");

  const score = 83;

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
      : [
          {
            audience: "기본형",
            questions: ["이 발표의 핵심 내용을 한 문장으로 설명할 수 있나요?"],
          },
        ];

  const expectedQuestions = [
    "AI 분석의 정확도는 어느 정도인가요?",
    "기존 발표 교육 방식과 비교했을 때 어떤 장점이 있나요?",
    "개인정보 보호는 어떻게 이루어지나요?",
    "실시간 피드백도 가능한가요?",
    "면접이나 기업 발표 상황으로도 확장할 수 있나요?",
  ];

  const scriptText =
    localStorage.getItem("liveScript") ||
    `AICO는 AI 기반 발표 코칭 시스템입니다. 사용자가 발표 영상을 업로드하거나 실시간으로 발표를 진행하면, AI가 자세, 음성, 발표 내용을 분석하여 맞춤형 피드백을 제공합니다.

영상 분석에서는 고개 방향과 얼굴 방향을 바탕으로 발표자의 아이컨택과 발표 태도를 평가합니다. 음성 분석에서는 말하기 속도와 필러어 사용 빈도를 측정하여 전달력을 개선할 수 있도록 돕습니다.

또한 LLM을 활용하여 발표 내용을 요약하고, 발표 상황에 맞는 예상 질문을 생성합니다. 이를 통해 사용자는 발표 후 질의응답까지 함께 연습할 수 있으며, 반복 연습을 통해 발표 역량을 향상시킬 수 있습니다.`;

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
          <p style={{ fontWeight: "800", marginBottom: "12px", fontSize: "18px" }}>
            종합 점수
          </p>

          <h1
            style={{
              fontSize: "78px",
              fontWeight: "900",
              marginBottom: "18px",
            }}
          >
            {score}
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
                width: `${score}%`,
                height: "100%",
                background: "white",
                borderRadius: "999px",
              }}
            />
          </div>

          <strong style={{ fontSize: "18px" }}>훌륭한 발표였습니다 🎉</strong>
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
                lineHeight: "1.7",
              }}
            >
              저장된 발표 영상이 없습니다.
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
              "청중과의 아이컨택이 우수합니다",
              "말하기 속도가 적절합니다",
              "발표 내용의 흐름이 자연스럽습니다",
            ]}
          />

          <SummaryCard
            icon={<AlertCircle size={26} color="#9BC870" />}
            title="개선사항"
            items={[
              "필러워드 사용을 조금 더 줄여보세요",
              "핵심 키워드를 더 강조하면 좋습니다",
              "질문 답변 시 근거를 조금 더 보강해보세요",
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
            desc="자세, 제스처, 눈맞춤 분석"
            onClick={() => setSelectedAnalysis("video")}
          />

          <AnalysisCard
            active={selectedAnalysis === "voice"}
            icon={<Volume2 size={28} color="#6BB5A6" />}
            title="음성 분석"
            desc="속도, 필러워드, 음량 분석"
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

        {selectedAnalysis === "video" && <VideoDetail />}
        {selectedAnalysis === "voice" && <VoiceDetail />}
        {selectedAnalysis === "content" && (
          <ContentDetail
            audienceQuestions={audienceQuestions}
            expectedQuestions={expectedQuestions}
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
          <button onClick={() => navigate("/practice-mode")} style={primaryButton}>
            <RotateCcw size={20} style={{ verticalAlign: "middle", marginRight: "8px" }} />
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

function VideoDetail() {
  return (
    <section style={cardStyle}>
      <h3 style={sectionTitle}>
        <Target size={28} color="#6BB5A6" />
        영상 분석 상세
      </h3>

      <DetailScore score={78} label="영상 분석 점수" />

      <MetricBar label="정면 응시 비율" value={82.3} desc="청중과의 아이컨택이 우수합니다." />
      <MetricBar label="고개 각도 안정성" value={78} desc="적절한 고개 각도를 유지하고 있습니다." />
      <MetricBar label="자세 안정성" value={80} desc="발표 중 자세 변화가 안정적입니다." />
    </section>
  );
}

function VoiceDetail() {
  const fillerData = [
    { label: "음", count: 4 },
    { label: "어", count: 3 },
    { label: "그", count: 2 },
    { label: "저", count: 2 },
    { label: "이제", count: 1 },
  ];

  return (
    <section style={cardStyle}>
      <h3 style={sectionTitle}>
        <Mic size={28} color="#6BB5A6" />
        음성 분석 상세
      </h3>

      <DetailScore score={85} label="음성 분석 점수" />

      <VoiceRow label="말하기 속도" value="145 WPM" desc="적절한 속도입니다." />
      <VoiceRow label="침묵 구간" value="8회" desc="평균 1.2초 침묵이 감지되었습니다." />
      <VoiceRow label="음량" value="78.5%" desc="적절한 음량입니다." />

      <div style={{ marginTop: "34px" }}>
        <h4 style={{ fontSize: "22px", marginBottom: "20px", color: "#2D3A3A" }}>
          필러워드 사용
        </h4>

        <div
          style={{
            height: "260px",
            display: "flex",
            alignItems: "end",
            gap: "24px",
            borderBottom: "2px solid #DDEBE6",
            padding: "0 20px",
          }}
        >
          {fillerData.map((item) => (
            <div key={item.label} style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  height: `${item.count * 42}px`,
                  background: "#94CDD8",
                  borderRadius: "12px 12px 0 0",
                  marginBottom: "10px",
                }}
              />
              <strong style={{ color: "#2D3A3A" }}>{item.label}</strong>
              <p style={{ color: "#6B7C79", marginTop: "6px" }}>{item.count}회</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContentDetail({ audienceQuestions, expectedQuestions, scriptText }) {
  return (
    <div style={{ display: "grid", gap: "28px" }}>
      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          <FileText size={28} color="#6BB5A6" />
          내용 분석 상세
        </h3>

        <DetailScore score={83} label="내용 분석 점수" />

        <h4 style={{ fontSize: "24px", color: "#2D3A3A", marginBottom: "16px" }}>
          발표 내용 요약
        </h4>

        <p
          style={{
            color: "#4B5563",
            fontSize: "18px",
            lineHeight: "1.9",
            wordBreak: "keep-all",
          }}
        >
          AICO는 사용자의 발표 영상과 음성을 분석하여 발표 태도, 말하기 습관,
          발표 내용의 구조를 평가하는 AI 발표 코칭 서비스입니다. 사용자는
          시나리오와 청중 유형을 선택하여 실전과 유사한 발표 연습을 진행할 수
          있습니다.
        </p>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          <CheckCircle size={28} color="#6BB5A6" />
          핵심 포인트
        </h3>

        {[
          "웹 기반으로 접근 가능한 발표 코칭 시스템",
          "고개 방향과 얼굴 방향을 활용한 자세 분석",
          "음성 인식을 통한 말 속도와 필러워드 분석",
          "LLM 기반 발표 요약 및 질문 생성",
        ].map((item, index) => (
          <p
            key={index}
            style={{
              color: "#4B5563",
              fontSize: "18px",
              lineHeight: "1.9",
            }}
          >
            ✓ {item}
          </p>
        ))}
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          <MessageSquare size={28} color="#6BB5A6" />
          청중별 질문
        </h3>

        {audienceQuestions.map((item, index) => (
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
        ))}
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          <MessageSquare size={28} color="#6BB5A6" />
          예상 질문
        </h3>

        {expectedQuestions.map((question, index) => (
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
            <strong style={{ color: "#6BB5A6" }}>Q{index + 1}.</strong>{" "}
            {question}
          </div>
        ))}
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

function MetricBar({ label, value, desc }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
          fontSize: "18px",
          fontWeight: "800",
          color: "#2D3A3A",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#6BB5A6" }}>{value}%</span>
      </div>

      <div
        style={{
          height: "10px",
          background: "#E4F0EA",
          borderRadius: "999px",
          overflow: "hidden",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: "#6BB5A6",
          }}
        />
      </div>

      <p style={{ color: "#6B7C79" }}>{desc}</p>
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