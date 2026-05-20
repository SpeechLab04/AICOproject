import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Trophy,
  BarChart3,
  Clock3,
  ChevronRight,
  LogOut,
  Trash2,
} from "lucide-react";
import Header from "../components/Header";

function MyPage() {
  const navigate = useNavigate();
  const API_BASE_URL = "http://127.0.0.1:8000";

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const response = await fetch(`${API_BASE_URL}/records?limit=20&offset=0`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        alert("로그인이 만료되었습니다. 다시 로그인해주세요.");

        localStorage.removeItem("token");
        localStorage.removeItem("aicoUser");

        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("기록 조회 실패");
      }

      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error("기록 조회 오류:", error);
      alert("기록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const averageScore =
    records.length > 0
      ? Math.round(
          records.reduce((sum, record) => sum + (record.final_score || 0), 0) /
            records.length
        )
      : 0;

  const practiceCount = records.length;
  const totalTime = "-";

  const handleRecordClick = (record) => {
    const restoredResult = {
      message: "기록 조회 완료",
      record_id: record.id,
      total_score: record.final_score || 0,
      summary: record.summary || "",
      posture: {
        score: record.delivery_score || 0,
        feedback: record.visual_analysis?.delivery_feedback || "",
        head_pose: record.visual_analysis?.head_pose || {},
        emotion: record.visual_analysis?.emotion || {},
        gaze: record.visual_analysis?.gaze || {},
        gesture: record.visual_analysis?.gesture || {},
        video_dashboard: record.visual_analysis?.video_dashboard || {},
      },
      voice: record.voice_analysis || {},
      script: {
        score: record.content_score || 0,
        summary: record.summary || "",
        full_script: record.stt_result || "",
        questions: record.persona_questions || [],
        content_feedback: {
          strength: record.strength || "",
          weakness: record.weakness || "",
          improvement: record.improvement || "",
        },
        content_score: record.content_score || 0,
        delivery_score: record.delivery_score || 0,
        final_score: record.final_score || 0,
      },
    };

    localStorage.setItem("analysisResult", JSON.stringify(restoredResult));
    navigate("/dashboard");
  };

  const handleDelete = async (e, recordId) => {
    e.stopPropagation();

    const confirmDelete = window.confirm(
      "정말 이 발표 기록을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다."
    );

    if (!confirmDelete) return;

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_BASE_URL}/records/${recordId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("삭제 실패");
      }

      alert("기록이 삭제되었습니다.");
      fetchRecords();
    } catch (error) {
      console.error("삭제 오류:", error);
      alert("기록 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("aicoUser");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FCFA", color: "#2F3E46" }}>
      <Header showBack />

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "50px 60px 100px" }}>
        <section style={profileSection}>
          <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
            <div style={profileIcon}>
              <User size={54} />
            </div>
            <div>
              <h2 style={{ fontSize: "42px", fontWeight: "900", marginBottom: "10px" }}>
                마이페이지
              </h2>
              <p style={{ fontSize: "18px", opacity: 0.92 }}>{userEmail}</p>
            </div>
          </div>
        </section>

        <section style={statsGrid}>
          <StatCard icon={<Trophy size={30} color="#6BB5A6" />} value={`${averageScore}점`} label="평균 발표 점수" />
          <StatCard icon={<BarChart3 size={30} color="#6BB5A6" />} value={`${practiceCount}회`} label="총 연습 횟수" />
          <StatCard icon={<Clock3 size={30} color="#6BB5A6" />} value={totalTime} label="총 연습 시간" />
        </section>

        <section style={cardStyle}>
          <h3 style={sectionTitle}>발표 실력 성장 추이</h3>
          <ScoreChart records={records} />
        </section>

        <section style={cardStyle}>
          <h3 style={sectionTitle}>최근 발표 기록</h3>

          {isLoading ? (
            <p style={{ color: "#6B7C79" }}>기록을 불러오는 중입니다...</p>
          ) : records.length === 0 ? (
            <p style={{ color: "#6B7C79" }}>아직 저장된 발표 기록이 없습니다.</p>
          ) : (
            <div style={{ display: "grid", gap: "18px" }}>
              {records.map((record) => (
                <div
                  key={record.id}
                  onClick={() => handleRecordClick(record)}
                  style={recordItemStyle}
                >
                  <div>
                    <strong style={recordTitle}>발표 기록 #{record.id}</strong>
                    <span style={{ color: "#6B7C79" }}>
                      {formatDate(record.created_at)}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={scoreBadge}>{Math.round(record.final_score || 0)}점</div>

                    <button
                      onClick={(e) => handleDelete(e, record.id)}
                      style={deleteButton}
                    >
                      <Trash2 size={18} />
                    </button>

                    <ChevronRight color="#9CA3AF" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={{ display: "flex", gap: "16px" }}>
          <button onClick={() => navigate("/practice-mode")} style={primaryButton}>
            새 발표 연습하기
          </button>

          <button onClick={handleLogout} style={secondaryButton}>
            <LogOut size={18} style={{ verticalAlign: "middle", marginRight: "8px" }} />
            로그아웃
          </button>
        </div>
      </main>
    </div>
  );
}

function ScoreChart({ records }) {
  if (!records || records.length === 0) {
    return <p style={{ color: "#6B7C79" }}>그래프를 표시할 기록이 없습니다.</p>;
  }

  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  const width = 900;
  const height = 260;
  const padding = 42;

  const scores = sortedRecords.map((record) => record.final_score || 0);
  const maxScore = 100;
  const minScore = 0;

  const points = sortedRecords.map((record, index) => {
    const x =
      sortedRecords.length === 1
        ? width / 2
        : padding + (index * (width - padding * 2)) / (sortedRecords.length - 1);

    const y =
      height -
      padding -
      ((record.final_score || 0) - minScore) /
        (maxScore - minScore) *
        (height - padding * 2);

    return { x, y, score: record.final_score || 0, date: formatDate(record.created_at) };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={width} height={height}>
        {[0, 25, 50, 75, 100].map((score) => {
          const y =
            height -
            padding -
            ((score - minScore) / (maxScore - minScore)) * (height - padding * 2);

          return (
            <g key={score}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#E4F0EA" />
              <text x="8" y={y + 4} fontSize="12" fill="#6B7C79">
                {score}
              </text>
            </g>
          );
        })}

        <polyline
          points={polyline}
          fill="none"
          stroke="#6BB5A6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, index) => (
          <g key={index}>
            <circle cx={p.x} cy={p.y} r="6" fill="#6BB5A6" />
            <text x={p.x - 12} y={p.y - 12} fontSize="12" fill="#2D3A3A">
              {Math.round(p.score)}점
            </text>
            <text x={p.x - 22} y={height - 12} fontSize="11" fill="#6B7C79">
              {p.date}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div style={statCardStyle}>
      <div style={{ marginBottom: "18px" }}>{icon}</div>
      <strong style={{ display: "block", fontSize: "38px", color: "#2D3A3A", marginBottom: "8px" }}>
        {value}
      </strong>
      <span style={{ color: "#6B7C79", fontSize: "17px" }}>{label}</span>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const profileSection = {
  background: "linear-gradient(135deg, #6BB5A6, #94CDD8)",
  borderRadius: "34px",
  padding: "42px",
  color: "white",
  boxShadow: "0 16px 36px rgba(107,181,166,0.24)",
  marginBottom: "30px",
};

const profileIcon = {
  width: "110px",
  height: "110px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(10px)",
};

const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "22px",
  marginBottom: "30px",
};

const statCardStyle = {
  background: "white",
  borderRadius: "28px",
  padding: "30px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  border: "1px solid #E4F0EA",
};

const cardStyle = {
  background: "white",
  borderRadius: "30px",
  padding: "34px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  border: "1px solid #E4F0EA",
  marginBottom: "28px",
};

const sectionTitle = {
  fontSize: "30px",
  fontWeight: "900",
  color: "#2D3A3A",
  marginBottom: "26px",
};

const recordItemStyle = {
  background: "#F8FCFA",
  borderRadius: "22px",
  padding: "22px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  transition: "all 0.18s ease",
  cursor: "pointer",
};

const recordTitle = {
  display: "block",
  fontSize: "22px",
  color: "#2D3A3A",
  marginBottom: "6px",
};

const scoreBadge = {
  background: "#E5F4EF",
  color: "#6BB5A6",
  padding: "12px 18px",
  borderRadius: "16px",
  fontWeight: "900",
  fontSize: "20px",
};

const deleteButton = {
  background: "white",
  color: "#D9534F",
  border: "1px solid #F2C5C3",
  borderRadius: "14px",
  padding: "10px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
};

const primaryButton = {
  flex: 1,
  background: "#6BB5A6",
  color: "white",
  border: "none",
  padding: "18px",
  borderRadius: "20px",
  fontSize: "18px",
  fontWeight: "900",
  cursor: "pointer",
  boxShadow: "0 8px 20px rgba(107,181,166,0.25)",
};

const secondaryButton = {
  flex: 1,
  background: "white",
  color: "#6BB5A6",
  border: "2px solid #6BB5A6",
  padding: "18px",
  borderRadius: "20px",
  fontSize: "18px",
  fontWeight: "900",
  cursor: "pointer",
};

export default MyPage;