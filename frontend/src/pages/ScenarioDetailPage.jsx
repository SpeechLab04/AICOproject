import { useNavigate } from "react-router-dom";
import { GraduationCap, BarChart3, Clock, Target } from "lucide-react";
import Header from "../components/Header";

function ScenarioDetailPage() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const scenario =
    JSON.parse(localStorage.getItem("selectedScenario")) || {
      title: "학교 발표",
      description:
        "학교에서 진행하는 발표 및 프레젠테이션을 위한 연습 시나리오입니다.",
      practiceCount: 0,
    };

  const goals = [
    "명확한 발표 내용 전달",
    "적절한 시간 관리",
    "청중과의 눈맞춤",
    "질문에 대한 효과적인 답변",
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FCFA", color: "#2F3E46" }}>
      <Header showBack />
        
      

      <main style={{ maxWidth: "980px", margin: "0 auto", padding: isMobile ? "35px 22px 80px" : "55px 40px 100px" }}>
        <section style={cardStyle}>
          <div style={{ display: "flex", gap: "26px", alignItems: "flex-start", flexDirection: isMobile ? "column" : "row" }}>
            <div style={iconBox}>
              <GraduationCap size={44} color="white" />
            </div>

            <div>
              <h2 style={{ fontSize: isMobile ? "32px" : "38px", marginBottom: "16px", color: "#111827" }}>
                {scenario.title}
              </h2>
              <p style={{ fontSize: isMobile ? "16px" : "20px", lineHeight: "1.7", color: "#4B5563", wordBreak: "keep-all" }}>
                학교에서 진행하는 발표 및 프레젠테이션을 위한 연습 시나리오입니다.
                청중 앞에서 진행하는 발표 상황을 시뮬레이션하여 실전처럼 연습할 수 있습니다.
              </p>
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "32px 0" }} />

          <div
            style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
                gap: "26px",
                textAlign: "center",
            }}
            >
            <InfoItem icon={<BarChart3 size={28} color="#6BB5A6" />} value={`${scenario.practiceCount || 0}`} label="연습 횟수" />
            <InfoItem icon={<Clock size={28} color="#94CDD8" />} value="5-10분" label="권장 시간" />
          </div>
        </section>

        <section style={{ ...cardStyle, marginTop: "34px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
            <Target size={28} color="#6BB5A6" />
            <h3 style={{ fontSize: isMobile ? "26px" : "32px", color: "#111827" }}>학습 목표</h3>
          </div>

          <div style={{ display: "grid", gap: "18px" }}>
            {goals.map((goal, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: isMobile ? "16px" : "18px", color: "#374151" }}>
                <span style={numberBadge}>{index + 1}</span>
                {goal}
              </div>
            ))}
          </div>
        </section>

        <button
          onClick={() => navigate("/audience")}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-5px)";
            e.currentTarget.style.boxShadow =
              "0 14px 28px rgba(107,181,166,0.35)";
          }}

          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 8px 20px rgba(107,181,166,0.25)";
          }}

          style={{
            width: "100%",
            marginTop: "34px",
            background: "#6BB5A6",
            color: "white",
            padding: isMobile ? "16px" : "18px",
            borderRadius: "20px",
            fontSize: isMobile ? "17px" : "20px",
            fontWeight: "900",
            boxShadow: "0 8px 20px rgba(107,181,166,0.25)",
            transform: "translateY(0)",
            transition: "all 0.18s ease",
            cursor: "pointer",
          }}
        >
          다음 단계로 이동하기
        </button>
      </main>
    </div>
  );
}

function InfoItem({ icon, value, label }) {
  return (
    <div>
      <div style={{ marginBottom: "10px" }}>{icon}</div>
      <strong style={{ display: "block", fontSize: "28px", color: "#111827", marginBottom: "6px" }}>
        {value}
      </strong>
      <span style={{ color: "#4B5563" }}>{label}</span>
    </div>
  );
}

const logoButton = {
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  textAlign: "left",
};

const backButton = {
  background: "white",
  border: "2px solid #6BB5A6",
  color: "#6BB5A6",
  padding: "10px 24px",
  borderRadius: "30px",
  fontSize: "16px",
  fontWeight: "700",
};

const cardStyle = {
  background: "white",
  borderRadius: "30px",
  padding: "38px",
  boxShadow: "0 12px 34px rgba(0,0,0,0.08)",
};

const iconBox = {
  width: "92px",
  height: "92px",
  borderRadius: "18px",
  background: "#6BB5A6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const numberBadge = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  background: "#C8E4D6",
  color: "#2F3E46",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  flexShrink: 0,
};

export default ScenarioDetailPage;