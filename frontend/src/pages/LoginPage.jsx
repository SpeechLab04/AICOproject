import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const [mode, setMode] = useState("login");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const pwChecks = {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "signup") {
      if (!userId.includes("@")) {
        alert("올바른 이메일 형식을 입력해주세요. (@ 포함)");
        return;
      }
      if (!pwChecks.length || !pwChecks.letter || !pwChecks.number) {
        alert("비밀번호 조건을 모두 충족해야 합니다.");
        return;
      }
    }

    try {
      // 회원가입
      if (mode === "signup") {
        const signupResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: userId,
              password: password,
            }),
          }
        );

        if (!signupResponse.ok) {
          throw new Error("회원가입 실패. 이미 사용 중인 이메일일 수 있습니다.");
        }

        alert("회원가입이 완료되었습니다.");
        setMode("login");
        return;
      }

      // 로그인
      const formData = new URLSearchParams();
      formData.append("username", userId);
      formData.append("password", password);

      const loginResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        }
      );

      if (!loginResponse.ok) {
        if (loginResponse.status === 423) {
          throw new Error("로그인 5회 실패로 10분간 잠금되었습니다. 잠시 후 다시 시도해주세요.");
        }
        throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
      }

      const data = await loginResponse.json();

      // 토큰 저장
      localStorage.setItem("token", data.access_token);

      const userData = {
        userId,
        nickname: nickname || userId || "Guest User",
        loginTime: new Date().toLocaleString(),
      };

      localStorage.setItem("aicoUser", JSON.stringify(userData));

      alert("로그인되었습니다.");
      navigate("/scenario");

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
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
            placeholder={mode === "signup" ? "이메일 (예: example@email.com)" : "아이디"}
            required
            style={inputStyle}
          />

          {mode === "signup" && (
            <p style={{ fontSize: "12px", color: "#7AA5A0", marginTop: "-8px", marginBottom: "14px", paddingLeft: "4px" }}>
              @ 를 포함한 이메일 형식으로 입력해주세요.
            </p>
          )}

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            type="password"
            required
            style={inputStyle}
          />

          {mode === "signup" && (
            <div style={{ marginTop: "-8px", marginBottom: "14px", paddingLeft: "4px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {[
                { ok: pwChecks.length, text: "8자 이상" },
                { ok: pwChecks.letter, text: "영문자 포함" },
                { ok: pwChecks.number, text: "숫자 포함" },
              ].map(({ ok, text }) => (
                <span key={text} style={{ fontSize: "12px", color: ok ? "#6BB5A6" : "#AABFBB", display: "flex", alignItems: "center", gap: "5px" }}>
                  <span>{ok ? "✓" : "○"}</span> {text}
                </span>
              ))}
            </div>
          )}

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