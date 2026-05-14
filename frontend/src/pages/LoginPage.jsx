import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const [mode, setMode] = useState("login");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const userData = {
      userId,
      nickname: nickname || userId || "Guest User",
      loginTime: new Date().toLocaleString(),
    };

    localStorage.setItem("aicoUser", JSON.stringify(userData));
    alert(mode === "login" ? "로그인되었습니다." : "회원가입이 완료되었습니다.");
    navigate("/scenario");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FCFA",
        padding: isMobile ? "18px 22px" : "24px 60px",
        color: "#2F3E46",
      }}
    >
      <button
        onClick={() => navigate("/")}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
          marginBottom: isMobile ? "54px" : "80px",
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

      <div
        style={{
          maxWidth: "440px",
          margin: "0 auto",
          background: "white",
          borderRadius: "30px",
          padding: isMobile ? "34px 26px" : "44px 40px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        }}
      >
        <h2
          style={{
            fontSize: isMobile ? "30px" : "36px",
            fontWeight: "900",
            color: "#2D3A3A",
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          {mode === "login" ? "로그인" : "회원가입"}
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#7AA5A0",
            marginBottom: "34px",
            lineHeight: "1.6",
          }}
        >
          AICO 발표 코칭을 시작해보세요.
        </p>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임"
              style={inputStyle}
            />
          )}

          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="아이디"
            required
            style={inputStyle}
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            type="password"
            required
            style={inputStyle}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              background: "#6BB5A6",
              color: "white",
              padding: "16px",
              borderRadius: "18px",
              fontSize: "18px",
              fontWeight: "800",
              marginTop: "10px",
              boxShadow: "0 8px 20px rgba(107,181,166,0.25)",
            }}
          >
            {mode === "login" ? "로그인하기" : "회원가입하기"}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            marginTop: "22px",
            fontSize: "14px",
            color: "#7AA5A0",
          }}
        >
          <button style={textButtonStyle}>아이디 찾기</button>
          <span>|</span>
          <button style={textButtonStyle}>비밀번호 찾기</button>
        </div>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          style={{
            width: "100%",
            marginTop: "26px",
            background: "#F8FCFA",
            color: "#6BB5A6",
            border: "1px solid #C8E4D6",
            padding: "14px",
            borderRadius: "16px",
            fontWeight: "700",
          }}
        >
          {mode === "login"
            ? "아직 계정이 없나요? 회원가입"
            : "이미 계정이 있나요? 로그인"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "16px",
  marginBottom: "14px",
  borderRadius: "16px",
  border: "1px solid #DDEBE6",
  fontSize: "16px",
  outline: "none",
  color: "#2F3E46",
};

const textButtonStyle = {
  background: "none",
  border: "none",
  color: "#7AA5A0",
  cursor: "pointer",
  fontSize: "14px",
};

export default LoginPage;