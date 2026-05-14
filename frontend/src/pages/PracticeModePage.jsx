import { useNavigate } from "react-router-dom";
import { Upload, Sparkles, Video, FileText } from "lucide-react";
import Header from "../components/Header";

function PracticeModePage() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const scenario =
    JSON.parse(localStorage.getItem("selectedScenario")) || {
      title: "학교 발표",
    };

  const audiences =
    JSON.parse(localStorage.getItem("selectedAudiences")) || [];

  const audienceText =
    audiences.length > 0
      ? audiences.map((item) => item.name).join(", ")
      : "선택 없음";

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
        <div
          style={{
            textAlign: "center",
            marginBottom: isMobile ? "36px" : "50px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#C8E4D6",
              color: "#4D8F82",
              padding: isMobile ? "8px 16px" : "10px 22px",
              borderRadius: "999px",
              fontWeight: "800",
              marginBottom: "22px",
              fontSize: isMobile ? "13px" : "16px",
            }}
          >
            발표 방식 선택
          </div>

          <h2
            style={{
              fontSize: isMobile ? "36px" : "54px",
              color: "#2D3A3A",
              fontWeight: "900",
              marginBottom: "16px",
              lineHeight: "1.2",
            }}
          >
            코칭 방식을 선택하세요
          </h2>

          <p
            style={{
              color: "#58706D",
              fontSize: isMobile ? "16px" : "20px",
              lineHeight: "1.7",
              wordBreak: "keep-all",
            }}
          >
            영상을 업로드하거나 실시간으로 발표를 분석받을 수 있습니다.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: "26px",
              background: "white",
              padding: isMobile ? "12px 18px" : "14px 28px",
              borderRadius: "999px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              color: "#58706D",
              fontSize: isMobile ? "14px" : "16px",
            }}
          >
            <span>
              시나리오:{" "}
              <strong style={{ color: "#2D3A3A" }}>{scenario.title}</strong>
            </span>
            <span style={{ color: "#C8E4D6" }}>|</span>
            <span>
              청중:{" "}
              <strong style={{ color: "#2D3A3A" }}>{audienceText}</strong>
            </span>
          </div>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: isMobile ? "24px" : "34px",
          }}
        >
          <ModeCard
            icon={<Upload size={54} color="#6BB5A6" />}
            iconBg="#E5F4EF"
            title="영상 업로드"
            description="이미 녹화된 발표 영상을 업로드하여 상세한 분석을 받아보세요."
            infoTitle="분석 항목"
            items={[
              "영상: 자세, 제스처, 표정 분석",
              "음성: 속도, 필러워드, 발음",
              "LLM: 스크립트 및 예상 질문",
            ]}
            buttonText="영상 업로드하기"
            buttonColor="#6BB5A6"
            onClick={() => navigate("/upload")}
            isMobile={isMobile}
          />

          <ModeCard
            icon={<Sparkles size={54} color="#5FAF9F" />}
            iconBg="#E8F5F1"
            title="실시간 분석"
            description="지금 바로 발표를 시작하고 실시간으로 질문과 피드백을 받아보세요."
            infoTitle="실시간 기능"
            items={[
              "음성 스크립트 실시간 추출",
              "AI가 발표 중 질문 생성",
              "질문에 대한 답변 분석",
            ]}
            buttonText="실시간 분석 시작"
            buttonColor="#5FAF9F"
            onClick={() => navigate("/live")}
            isMobile={isMobile}
          />
        </section>

        <section
          style={{
            marginTop: isMobile ? "30px" : "42px",
            background: "#EEF8F4",
            borderRadius: "26px",
            padding: isMobile ? "26px 22px" : "34px 42px",
            color: "#2F3E46",
          }}
        >
          <h3
            style={{
              fontSize: isMobile ? "22px" : "26px",
              marginBottom: "22px",
              fontWeight: "900",
            }}
          >
            💡 어떤 방식이 좋을까요?
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
              gap: "26px",
            }}
          >
            <div>
              <h4 style={{ marginBottom: "12px", fontSize: "18px" }}>
                영상 업로드를 추천하는 경우
              </h4>
              <p style={tipTextStyle}>· 이미 녹화된 발표 영상이 있는 경우</p>
              <p style={tipTextStyle}>· 자세한 분석 결과를 확인하고 싶은 경우</p>
              <p style={tipTextStyle}>· 발표 태도와 음성을 함께 점검하고 싶은 경우</p>
            </div>

            <div>
              <h4 style={{ marginBottom: "12px", fontSize: "18px" }}>
                실시간 분석을 추천하는 경우
              </h4>
              <p style={tipTextStyle}>· 즉시 발표 연습을 시작하고 싶은 경우</p>
              <p style={tipTextStyle}>· 예상 질문과 답변 연습이 필요한 경우</p>
              <p style={tipTextStyle}>· 발표 후 바로 피드백을 받고 싶은 경우</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ModeCard({
  icon,
  iconBg,
  title,
  description,
  infoTitle,
  items,
  buttonText,
  buttonColor,
  onClick,
  isMobile,
}) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "32px",
        padding: isMobile ? "34px 26px" : "48px 42px",
        boxShadow: "0 14px 38px rgba(0,0,0,0.08)",
        textAlign: "center",
        transform: "translateY(0)",
        transition: "all 0.18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-7px)";
        e.currentTarget.style.boxShadow = "0 22px 48px rgba(0,0,0,0.13)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 14px 38px rgba(0,0,0,0.08)";
      }}
    >
      <div
        style={{
          width: isMobile ? "86px" : "108px",
          height: isMobile ? "86px" : "108px",
          borderRadius: "50%",
          background: iconBg,
          margin: "0 auto 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontSize: isMobile ? "28px" : "34px",
          color: "#111827",
          fontWeight: "900",
          marginBottom: "18px",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: "#4B5563",
          fontSize: isMobile ? "16px" : "19px",
          lineHeight: "1.7",
          wordBreak: "keep-all",
          marginBottom: "34px",
        }}
      >
        {description}
      </p>

      <div
        style={{
          background: iconBg,
          borderRadius: "20px",
          padding: isMobile ? "20px" : "24px",
          textAlign: "left",
          marginBottom: "32px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "14px",
            color: "#111827",
            fontWeight: "900",
          }}
        >
          <FileText size={20} color={buttonColor} />
          {infoTitle}
        </div>

        {items.map((item, index) => (
          <p
            key={index}
            style={{
              color: "#2F3E46",
              lineHeight: "1.8",
              fontSize: isMobile ? "14px" : "16px",
            }}
          >
            ✓ {item}
          </p>
        ))}
      </div>

      <button
        onClick={onClick}
        style={{
          width: "100%",
          background: buttonColor,
          color: "white",
          border: "none",
          padding: isMobile ? "16px" : "18px",
          borderRadius: "22px",
          fontSize: isMobile ? "17px" : "20px",
          fontWeight: "900",
          boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
          cursor: "pointer",
          transform: "translateY(0)",
          transition: "all 0.18s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.boxShadow = "0 16px 32px rgba(0,0,0,0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 10px 24px rgba(0,0,0,0.12)";
        }}
      >
        {buttonText}
      </button>
    </div>
  );
}

const tipTextStyle = {
  color: "#4B5563",
  lineHeight: "1.9",
  fontSize: "16px",
};

export default PracticeModePage;