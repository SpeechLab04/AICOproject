import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useIsMobile } from "../hooks/useIsMobile";
import RESOURCES from "../data/resources.jsx";

function ResourcesPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [selected, setSelected] = React.useState(null);
  const [tab, setTab] = React.useState("tip");

  const handleClick = (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    setSelected(selected === id ? null : id);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FCFA", color: "#2F3E46" }}>
      <Header showBack />
      <main
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: isMobile ? "36px 22px 80px" : "60px 40px 100px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: isMobile ? "36px" : "54px" }}>
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
            자료실
          </div>
          <h2
            style={{
              fontSize: isMobile ? "30px" : "46px",
              color: "#2D3A3A",
              fontWeight: "900",
              marginBottom: "12px",
              lineHeight: "1.2",
            }}
          >
            발표 정보 공유
          </h2>
          <p style={{ color: "#58706D", fontSize: isMobile ? "15px" : "18px" }}>
            더 나은 발표를 위한 가이드를 확인하세요.
          </p>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          {[{ key: "all", label: "전체" }, { key: "tip", label: "발표 팁" }, { key: "guide", label: "발표 가이드" }].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setSelected(null); }}
              style={{
                padding: "10px 24px",
                borderRadius: "12px",
                border: `2px solid ${tab === key ? "#6BB5A6" : "#E0EDEA"}`,
                background: tab === key ? "#E5F4EF" : "white",
                color: tab === key ? "#4D8F82" : "#5C706C",
                fontWeight: "700",
                fontSize: isMobile ? "14px" : "16px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          {(tab === "all" ? RESOURCES : RESOURCES.filter((item) => item.category === tab)).map((item) => (
            <div
              key={item.id}
              onClick={() => handleClick(item.id)}
              style={{
                background: "white",
                borderRadius: "20px",
                padding: isMobile ? "20px" : "28px 32px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
                border: "1.5px solid #E5F0EC",
                cursor: "pointer",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6BB5A6";
                e.currentTarget.querySelector("h3").style.color = "#6BB5A6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E5F0EC";
                e.currentTarget.querySelector("h3").style.color = "#2D3A3A";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "800", color: "#2D3A3A" }}>
                    {item.title}
                  </h3>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: item.category === "tip" ? "#E5F4EF" : "#E3F1FF",
                    color: item.category === "tip" ? "#4D8F82" : "#4E9CDC",
                  }}>
                    {item.category === "tip" ? "발표 팁" : "발표 가이드"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "13px", color: "#9BB5B0" }}>{item.date}</span>
                  <span style={{ color: "#6BB5A6", fontWeight: "700" }}>{selected === item.id ? "▲" : "▼"}</span>
                </div>
              </div>
              {selected === item.id && (
                <div
                  style={{
                    marginTop: "16px",
                    color: "#4B5563",
                    fontSize: isMobile ? "14px" : "19px",
                    lineHeight: "1.9",
                    wordBreak: "keep-all",
                  }}
                >
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default ResourcesPage;
