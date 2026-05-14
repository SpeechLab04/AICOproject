import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MagneticButton from "../components/MagneticButton";

function HomePage() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;
  const [menuOpen, setMenuOpen] = useState(false);

  const user = localStorage.getItem("aicoUser");

  const handleLogout = () => {
    localStorage.removeItem("aicoUser");
    alert("로그아웃되었습니다.");
    navigate("/");
    window.location.reload();
  };

  const handleScenarioClick = () => {
    navigate("/scenario");
  };

  const features = [
    {
      title: "자세 분석",
      text: "고개 각도와 얼굴 방향을 분석하여 청중과의 아이컨택을 개선합니다",
      color: "#C8E4D6",
    },
    {
      title: "음성 분석",
      text: "말 속도, 필러어 사용 빈도를 측정하여 발표 습관을 교정합니다",
      color: "#94CDD8",
    },
    {
      title: "AI 질문 생성",
      text: "발표 내용을 요약하고 예상 질문을 생성하여 준비를 돕습니다",
      color: "#CAD870",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FCFA",
        color: "#2F3E46",
      }}
    >
      {/* 네비게이션 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: isMobile ? "18px 22px" : "24px 60px",
          position: "relative",
        }}
      >
        {/* 로고 */}
        <button
          onClick={() => navigate("/")}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <h1
            style={{
              color: "#6BB5A6",
              fontSize: isMobile ? "30px" : "38px",
              fontWeight: "800",
              lineHeight: "1",
              letterSpacing: "-1px",
            }}
          >
            AICO
          </h1>

          <p
            style={{
              color: "#7AA5A0",
              marginTop: "5px",
              fontSize: isMobile ? "12px" : "15px",
              fontWeight: "500",
            }}
          >
            AI Coach
          </p>
        </button>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {user ? (
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "2px solid #6BB5A6",
                color: "#6BB5A6",
                padding: isMobile ? "8px 16px" : "10px 24px",
                borderRadius: "30px",
                fontSize: isMobile ? "14px" : "16px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              로그아웃
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "transparent",
                border: "2px solid #6BB5A6",
                color: "#6BB5A6",
                padding: isMobile ? "8px 18px" : "10px 24px",
                borderRadius: "30px",
                fontSize: isMobile ? "14px" : "16px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              로그인
            </button>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: isMobile ? "42px" : "46px",
              height: isMobile ? "42px" : "46px",
              borderRadius: "14px",
              border: "2px solid #DDEEE8",
              background: "white",
              color: "#6BB5A6",
              fontSize: "22px",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: isMobile ? "72px" : "82px",
              right: isMobile ? "22px" : "60px",
              width: isMobile ? "210px" : "240px",
              background: "white",
              borderRadius: "22px",
              padding: "14px",
              boxShadow: "0 18px 45px rgba(0,0,0,0.08)",
              border: "1px solid #E6F2ED",
              zIndex: 20,
            }}
          >
            <MenuItem text="홈" onClick={() => navigate("/")} />
            <MenuItem text="시나리오" onClick={handleScenarioClick} />

            {user ? (
              <>
                <MenuItem text="마이페이지" onClick={() => navigate("/mypage")} />
                <MenuItem text="로그아웃" onClick={handleLogout} />
              </>
            ) : (
              <MenuItem text="로그인" onClick={() => navigate("/login")} />
            )}
          </div>
        )}
      </div>

      {/* 메인 */}
      <main
        style={{
          textAlign: "center",
          marginTop: isMobile ? "54px" : "75px",
          padding: isMobile ? "0 22px" : "0 20px",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "#C8E4D6",
            color: "#4D8F82",
            padding: isMobile ? "8px 16px" : "10px 22px",
            borderRadius: "999px",
            fontWeight: "700",
            marginBottom: isMobile ? "24px" : "28px",
            fontSize: isMobile ? "13px" : "16px",
          }}
        >
          AI 발표 코칭 시스템
        </div>

        <h1
          style={{
            fontSize: isMobile ? "44px" : "72px",
            marginBottom: isMobile ? "22px" : "26px",
            color: "#2D3A3A",
            fontWeight: "900",
            lineHeight: "1.15",
            letterSpacing: "-2px",
          }}
        >
          AICO 발표 코칭
        </h1>

        <p
          style={{
            fontSize: isMobile ? "17px" : "24px",
            lineHeight: "1.8",
            color: "#58706D",
            wordBreak: "keep-all",
          }}
        >
          AI가 발표 영상을 분석하고
          <br />
          발표 습관 개선과 예상 질문 생성을 도와드립니다.
        </p>

        <div
          style={{
            marginTop: isMobile ? "34px" : "50px",
            display: "flex",
            justifyContent: "center",
            gap: isMobile ? "12px" : "20px",
            flexWrap: "wrap",
          }}
        >
          <MagneticButton
            onClick={handleScenarioClick}
            style={{
              background: "#6BB5A6",
              color: "white",
              border: "none",
              padding: isMobile ? "14px 24px" : "18px 40px",
              borderRadius: "18px",
              fontSize: isMobile ? "16px" : "20px",
              fontWeight: "800",
              boxShadow: "0 8px 20px rgba(107,181,166,0.25)",
              minWidth: isMobile ? "160px" : "auto",
            }}
          >
            시나리오 보러가기
          </MagneticButton>

          {!user && (
            <MagneticButton
              onClick={() => navigate("/login")}
              style={{
                background: "white",
                color: "#6BB5A6",
                border: "2px solid #6BB5A6",
                padding: isMobile ? "14px 24px" : "18px 40px",
                borderRadius: "18px",
                fontSize: isMobile ? "16px" : "20px",
                fontWeight: "800",
                minWidth: isMobile ? "110px" : "auto",
              }}
            >
              로그인
            </MagneticButton>
          )}
        </div>
      </main>

      {/* 소개 카드 */}
      <section
        style={{
          marginTop: isMobile ? "86px" : "140px",
          padding: isMobile ? "0 20px 80px" : "0 60px 100px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: isMobile ? "30px" : "42px",
            marginBottom: isMobile ? "36px" : "60px",
            color: "#2D3A3A",
            fontWeight: "900",
          }}
        >
          우리 서비스 소개
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit, minmax(260px, 1fr))",
            gap: isMobile ? "20px" : "30px",
          }}
        >
          {features.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "white",
                borderRadius: "28px",
                padding: isMobile ? "30px 24px" : "40px 30px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  width: isMobile ? "56px" : "70px",
                  height: isMobile ? "56px" : "70px",
                  borderRadius: "50%",
                  background: item.color,
                  marginBottom: isMobile ? "18px" : "24px",
                }}
              />

              <h3
                style={{
                  fontSize: isMobile ? "22px" : "28px",
                  marginBottom: "16px",
                  color: "#2D3A3A",
                  fontWeight: "800",
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  lineHeight: "1.8",
                  color: "#5C706C",
                  fontSize: isMobile ? "15px" : "18px",
                  wordBreak: "keep-all",
                }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MenuItem({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "14px 16px",
        background: "transparent",
        border: "none",
        borderRadius: "14px",
        textAlign: "left",
        color: "#374151",
        fontSize: "16px",
        fontWeight: "700",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#F3FAF7";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {text}
    </button>
  );
}

export default HomePage;