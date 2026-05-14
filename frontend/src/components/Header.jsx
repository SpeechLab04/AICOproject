import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Header({ showBack = false }) {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const [menuOpen, setMenuOpen] = useState(false);

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
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "white",
              border: "2px solid #6BB5A6",
              color: "#6BB5A6",
              padding: isMobile ? "8px 16px" : "10px 24px",
              borderRadius: "30px",
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            이전
          </button>
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