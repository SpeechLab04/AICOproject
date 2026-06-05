import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Trophy,
  BarChart3,
  Clock3,
  LogOut,
  ClipboardList,
  UserX,
} from "lucide-react";
import Header from "../components/Header";
import { useIsMobile } from "../hooks/useIsMobile";

function MyPage() {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const isMobile = useIsMobile();

  const [records, setRecords] = useState([]);

  const userData = JSON.parse(localStorage.getItem("aicoUser")) || {};
  const userEmail = userData.userId || localStorage.getItem("userEmail") || "guest@aico.ai";

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/records?limit=30&offset=0`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("token");
        localStorage.removeItem("aicoUser");
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("기록 조회 실패");

      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error("기록 조회 오류:", error);
    }
  };

  const averageScore =
    records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + (r.final_score || 0), 0) / records.length)
      : 0;

  const totalSeconds = records.reduce((sum, r) => sum + (r.voice_analysis?.duration_sec || 0), 0);
  const totalTime = totalSeconds >= 3600
    ? `${Math.floor(totalSeconds / 3600)}시간 ${Math.floor((totalSeconds % 3600) / 60)}분 ${Math.floor(totalSeconds % 60)}초`
    : totalSeconds >= 60
    ? `${Math.floor(totalSeconds / 60)}분 ${Math.floor(totalSeconds % 60)}초`
    : totalSeconds > 0
    ? `${Math.round(totalSeconds)}초`
    : "-";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("aicoUser");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  const handleWithdraw = () => {
    if (!window.confirm("정말 회원 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.")) return;
    alert("현재 준비 중인 기능입니다.");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FCFA", color: "#2F3E46" }}>
      <Header showBack />

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: isMobile ? "24px 16px 60px" : "50px 60px 100px" }}>

        {/* 프로필 */}
        <section style={{
          background: "linear-gradient(135deg, #6BB5A6, #94CDD8)",
          borderRadius: "34px",
          padding: isMobile ? "24px" : "42px",
          color: "white",
          boxShadow: "0 16px 36px rgba(107,181,166,0.24)",
          marginBottom: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "16px" : "28px" }}>
            <div style={{
              width: isMobile ? "72px" : "110px",
              height: isMobile ? "72px" : "110px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
              flexShrink: 0,
            }}>
              <User size={isMobile ? 36 : 54} />
            </div>
            <div>
              <h2 style={{ fontSize: isMobile ? "26px" : "42px", fontWeight: "900", marginBottom: "8px" }}>
                마이페이지
              </h2>
              <p style={{ fontSize: isMobile ? "13px" : "18px", opacity: 0.92 }}>{userEmail}</p>
            </div>
          </div>
        </section>

        {/* 통계 카드 */}
        <section style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
          gap: "14px",
          marginBottom: "24px",
        }}>
          <StatCard icon={<Trophy size={24} color="#6BB5A6" />} value={`${averageScore}점`} label="평균 발표 점수" isMobile={isMobile} />
          <StatCard icon={<BarChart3 size={24} color="#6BB5A6" />} value={`${records.length}회`} label="총 연습 횟수" isMobile={isMobile} />
          <div style={{ gridColumn: isMobile ? "1 / 3" : "auto" }}>
            <StatCard icon={<Clock3 size={24} color="#6BB5A6" />} value={totalTime} label="총 연습 시간" isMobile={isMobile} />
          </div>
        </section>

        {/* 성장 추이 차트 */}
        <section style={{
          background: "white",
          borderRadius: "30px",
          padding: isMobile ? "20px" : "34px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          border: "1px solid #E4F0EA",
          marginBottom: "24px",
        }}>
          <h3 style={{ fontSize: isMobile ? "20px" : "30px", fontWeight: "900", color: "#2D3A3A", marginBottom: "22px" }}>
            실력 성장 추이
          </h3>
          <ScoreChart records={records} />
        </section>

        {/* 발표 기록 / 새 연습 버튼 */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexDirection: isMobile ? "column" : "row" }}>
          <button
            onClick={() => navigate("/records")}
            style={{
              flex: 1,
              background: "white",
              color: "#6BB5A6",
              border: "2px solid #6BB5A6",
              borderRadius: "20px",
              padding: isMobile ? "14px" : "18px",
              fontSize: isMobile ? "15px" : "18px",
              fontWeight: "900",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <ClipboardList size={18} />
            발표 기록 보기 {records.length > 0 && `(${records.length}개)`}
          </button>

          <button
            onClick={() => navigate("/practice-mode")}
            style={{
              flex: 1,
              background: "#6BB5A6",
              color: "white",
              border: "none",
              borderRadius: "20px",
              padding: isMobile ? "14px" : "18px",
              fontSize: isMobile ? "15px" : "18px",
              fontWeight: "900",
              cursor: "pointer",
              boxShadow: "0 8px 20px rgba(107,181,166,0.25)",
            }}
          >
            새 발표 연습하기
          </button>
        </div>

        {/* 로그아웃 / 회원탈퇴 */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              background: "white",
              color: "#6BB5A6",
              border: "2px solid #6BB5A6",
              borderRadius: "16px",
              padding: isMobile ? "12px" : "16px",
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <LogOut size={16} />
            로그아웃
          </button>

          <button
            onClick={handleWithdraw}
            style={{
              flex: 1,
              background: "white",
              color: "#D9534F",
              border: "2px solid #F2C5C3",
              borderRadius: "16px",
              padding: isMobile ? "12px" : "16px",
              fontSize: isMobile ? "14px" : "16px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <UserX size={16} />
            회원탈퇴
          </button>
        </div>

      </main>
    </div>
  );
}

function ScoreChart({ records }) {
  const [clickedIdx, setClickedIdx] = useState(null);
  const isMobile = useIsMobile();

  if (!records || records.length === 0) {
    return <p style={{ color: "#6B7C79" }}>그래프를 표시할 기록이 없습니다.</p>;
  }

  const sortedRecords = [...records]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-30);

  const width = 900;
  const height = isMobile ? 340 : 280;
  const padL = 42;
  const padR = 20;
  const padT = 20;
  const padB = isMobile ? 100 : 65;

  const fs = isMobile ? { axis: 26, label: 24, tooltip: 28 } : { axis: 12, label: 11, tooltip: 13 };
  const dotR = isMobile ? 12 : 6;
  const dotRActive = isMobile ? 16 : 8;
  const strokeW = isMobile ? 5 : 3;

  const maxScore = 100;
  const minScore = 0;

  const getX = (index) =>
    sortedRecords.length === 1
      ? (width - padL - padR) / 2 + padL
      : padL + (index * (width - padL - padR)) / (sortedRecords.length - 1);

  const getY = (score) =>
    height - padB - ((score - minScore) / (maxScore - minScore)) * (height - padT - padB);

  const points = sortedRecords.map((record, index) => ({
    x: getX(index),
    y: getY(record.final_score || 0),
    score: record.final_score || 0,
    date: formatShortDate(record.created_at),
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div>
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        onClick={() => setClickedIdx(null)}
      >
        {[0, 25, 50, 75, 100].map((score) => {
          const y = getY(score);
          return (
            <g key={score}>
              <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#E4F0EA" />
              <text x="8" y={y + 4} fontSize={fs.axis} fill="#6B7C79">{score}</text>
            </g>
          );
        })}

        <polyline points={polyline} fill="none" stroke="#6BB5A6" strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, index) => (
          <g
            key={index}
            onClick={(e) => { e.stopPropagation(); setClickedIdx(clickedIdx === index ? null : index); }}
            style={{ cursor: "pointer" }}
          >
            <circle cx={p.x} cy={p.y} r="20" fill="transparent" />
            <circle
              cx={p.x}
              cy={p.y}
              r={clickedIdx === index ? dotRActive : dotR}
              fill={clickedIdx === index ? "#4A9A8B" : "#6BB5A6"}
              stroke="white"
              strokeWidth="3"
            />
          </g>
        ))}

        {clickedIdx !== null && (() => {
          const p = points[clickedIdx];
          const tw = isMobile ? 160 : 90;
          const th = isMobile ? 60 : 34;
          const tx = Math.max(padL, Math.min(p.x - tw / 2, width - padR - tw));
          const ty = Math.max(8, p.y - (isMobile ? 80 : 50));
          return (
            <g>
              <rect x={tx} y={ty} width={tw} height={th} rx="12" fill="#2D3A3A" />
              <text x={tx + tw / 2} y={ty + th / 2 + fs.tooltip / 3} textAnchor="middle" fontSize={fs.tooltip} fill="white" fontWeight="700">
                {Math.round(p.score)}점
              </text>
            </g>
          );
        })()}

        {points.map((p, index) => (
          <text
            key={`label-${index}`}
            x={p.x}
            y={height - padB + (isMobile ? 28 : 18)}
            fontSize={fs.label}
            fill="#6B7C79"
            textAnchor="end"
            transform={`rotate(-40, ${p.x}, ${height - padB + (isMobile ? 28 : 18)})`}
          >
            {p.date}
          </text>
        ))}
      </svg>
    </div>
  );
}

function StatCard({ icon, value, label, isMobile }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "22px",
      padding: isMobile ? "16px 12px" : "26px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
      border: "1px solid #E4F0EA",
    }}>
      <div style={{ marginBottom: "14px" }}>{icon}</div>
      <strong style={{ display: "block", fontSize: isMobile ? "20px" : "30px", color: "#2D3A3A", marginBottom: "6px" }}>
        {value}
      </strong>
      <span style={{ color: "#6B7C79", fontSize: isMobile ? "11px" : "14px" }}>{label}</span>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatShortDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default MyPage;
