import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

function ScenarioPage() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const scenarios = [
    {
      id: "school",
      title: "학교 발표",
      description:
        "수업 발표, 팀 프로젝트 발표, 과제 발표 상황을 연습할 수 있는 시나리오입니다.",
      practiceCount: 0,
    },
    {},
    {},
  ];

  const handleStart = (scenario) => {
    const user = localStorage.getItem("aicoUser");

    if (!user) {
      alert("연습을 시작하려면 로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    localStorage.setItem("selectedScenario", JSON.stringify(scenario));
    navigate("/scenario-detail");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FCFA",
        color: "#2F3E46",
      }}
      
    >
      <Header />


      {/* 본문 */}
      <main
        style={{
          padding: isMobile ? "42px 22px 80px" : "70px 60px 100px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: isMobile ? "42px" : "64px" }}>
          <div
            style={{
              display: "inline-block",
              background: "#C8E4D6",
              color: "#4D8F82",
              padding: isMobile ? "8px 16px" : "10px 22px",
              borderRadius: "999px",
              fontWeight: "700",
              marginBottom: "22px",
              fontSize: isMobile ? "13px" : "16px",
            }}
          >
            발표 상황 선택
          </div>

          <h2
            style={{
              fontSize: isMobile ? "36px" : "54px",
              color: "#2D3A3A",
              fontWeight: "900",
              marginBottom: "18px",
              lineHeight: "1.2",
            }}
          >
            연습할 시나리오를 선택하세요
          </h2>

          <p
            style={{
              color: "#58706D",
              fontSize: isMobile ? "16px" : "20px",
              lineHeight: "1.7",
              wordBreak: "keep-all",
            }}
          >
            현재는 학교 발표 시나리오를 중심으로 발표 연습을 진행합니다.
          </p>
        </div>

        {/* 시나리오 카드 영역 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            maxWidth: "700px",
            margin: "0 auto",
            gap: "28px",
          }}
        >
          {scenarios.map((scenario, idx) => {
            if (!scenario.title) {
                return (
                <div
                    key={idx}
                    style={{
                    minHeight: isMobile ? "210px" : "290px",
                    borderRadius: "30px",
                    background: "rgba(255,255,255,0.45)",
                    border: "2px dashed #DCEBE5",
                    }}
                />
                );
            }

            return (
            <div
              key={scenario.id}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow =
                  "0 20px 45px rgba(70,130,120,0.28)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 30px rgba(0,0,0,0.05)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(-2px) scale(0.98)";
              }}

              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1)";
              }}
              onClick={() => handleStart(scenario)}
              style={{
                background: "white",
                borderRadius: "30px",
                padding: isMobile ? "30px 24px" : "40px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                border: "1px solid #E4F0EA",
                transform: "translateY(0)",
                transition:
                  "transform 0.16s ease, box-shadow 0.2s ease",
                cursor: "pointer",
                }}
            >
              <div
                style={{
                  width: isMobile ? "58px" : "70px",
                  height: isMobile ? "58px" : "70px",
                  borderRadius: "22px",
                  background: "#C8E4D6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "24px",
                  fontSize: isMobile ? "28px" : "34px",
                }}
              >
                🎓
              </div>

              <h3
                style={{
                  fontSize: isMobile ? "26px" : "32px",
                  color: "#2D3A3A",
                  fontWeight: "900",
                  marginBottom: "16px",
                }}
              >
                {scenario.title}
              </h3>

              <p
                style={{
                  color: "#5C706C",
                  fontSize: isMobile ? "15px" : "18px",
                  lineHeight: "1.8",
                  marginBottom: "26px",
                  wordBreak: "keep-all",
                }}
              >
                {scenario.description}
              </p>

              <div
                style={{
                  background: "#F8FCFA",
                  borderRadius: "18px",
                  padding: "18px",
                  marginBottom: "26px",
                  color: "#58706D",
                  fontSize: isMobile ? "14px" : "16px",
                }}
              >
                지금까지 연습한 횟수{" "}
                <strong style={{ color: "#6BB5A6" }}>
                  {scenario.practiceCount}회
                </strong>
              </div>

              <button
                onClick={() => handleStart(scenario)}
                style={{
                  width: "100%",
                  background: "#6BB5A6",
                  color: "white",
                  padding: isMobile ? "15px" : "17px",
                  borderRadius: "18px",
                  fontSize: isMobile ? "16px" : "18px",
                  fontWeight: "800",
                  boxShadow: "0 8px 20px rgba(107,181,166,0.25)",
                }}
              >
                이 시나리오로 연습하기
              </button>
            </div>
            );
        })}
        </div>
      </main>
    </div>
  );
}

export default ScenarioPage;