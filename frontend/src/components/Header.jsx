import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function getTokenRemaining() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const remaining = Math.floor(payload.exp - Date.now() / 1000);
    if (remaining <= 0) return null;
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  } catch {
    return null;
  }
}

function Header({ showBack = false }) {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const [menuOpen, setMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getTokenRemaining);

  useEffect(() => {
    // 페이지 로드 시 즉시 체크
    if (!getTokenRemaining() && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("aicoUser");
    }

    const interval = setInterval(() => {
      const remaining = getTokenRemaining();
      setTimeLeft(remaining);
      if (!remaining && localStorage.getItem("token")) {
        localStorage.removeItem("token");
        localStorage.removeItem("aicoUser");
        alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
        navigate("/login");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const user = localStorage.getItem("aicoUser");

  const handleLogout = () => {
    localStorage.removeItem("aicoUser");
    alert("로그아웃 되었습니다.");
    navigate("/");
  };

  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isMobile ? "18px 22px" : "24px 60px",
        position: "relative",
        zIndex: 100,
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
          }}
        >
          AI Coach
        </p>
      </button>

      {/* 오른쪽 */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>


        {/* 남은 시간 */}
        {user && timeLeft && (
          <span style={{
            fontSize: isMobile ? "13px" : "15px",
            color: timeLeft < "05:00" ? "#D96B4C" : "#7AA5A0",
            fontWeight: "700",
            background: "white",
            border: "2px solid #DDEEE8",
            borderRadius: "12px",
            padding: "6px 12px",
          }}>
            ⏱ {timeLeft}
          </span>
        )}

        {/* 햄버거 */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            width: isMobile ? "48px" : "52px",
            height: isMobile ? "48px" : "52px",
            borderRadius: "16px",
            border: "2px solid #DDEEE8",
            background: "white",
            cursor: "pointer",
            fontSize: "24px",
            color: "#6BB5A6",
            fontWeight: "700",
          }}
        >
          ☰
        </button>
      </div>

      {/* 메뉴 */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: isMobile ? "80px" : "92px",
            right: isMobile ? "22px" : "60px",
            background: "white",
            borderRadius: "24px",
            padding: "16px",
            width: isMobile ? "220px" : "250px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
            border: "1px solid #E6F2ED",
          }}
        >
          <MenuItem text="홈" onClick={() => navigate("/")} />
          <MenuItem text="자료실" onClick={() => navigate("/resources")} />

          {user ? (
            <>
              <MenuItem
                text="시나리오"
                onClick={() => navigate("/scenario")}
              />

              <MenuItem
                text="마이페이지"
                onClick={() => navigate("/mypage")}
              />

              <MenuItem
                text="발표 기록"
                onClick={() => navigate("/records")}
              />

              <MenuItem text="로그아웃" onClick={handleLogout} />
            </>
          ) : (
            <MenuItem
              text="로그인"
              onClick={() => navigate("/login")}
            />
          )}
        </div>
      )}
    </header>
  );
}

function MenuItem({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "14px 16px",
        border: "none",
        background: "transparent",
        borderRadius: "14px",
        textAlign: "left",
        fontSize: "16px",
        color: "#374151",
        cursor: "pointer",
        fontWeight: "600",
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

export default Header;