import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Trash2, ClipboardList } from "lucide-react";
import Header from "../components/Header";
import { useIsMobile } from "../hooks/useIsMobile";

const PAGE_SIZE = 10;

function RecordsPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const API_BASE_URL = "http://127.0.0.1:8000";

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

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
      const response = await fetch(`${API_BASE_URL}/records?limit=50&offset=0`, {
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
      alert("기록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

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
    if (!window.confirm("정말 이 발표 기록을 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.")) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_BASE_URL}/records/${recordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("삭제 실패");
      alert("기록이 삭제되었습니다.");
      fetchRecords();
    } catch (error) {
      console.error("삭제 오류:", error);
      alert("기록 삭제 중 오류가 발생했습니다.");
    }
  };

  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const pagedRecords = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FCFA", color: "#2F3E46" }}>
      <Header showBack />

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: isMobile ? "24px 16px 60px" : "50px 60px 100px" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
          <div style={{
            width: isMobile ? "48px" : "60px",
            height: isMobile ? "48px" : "60px",
            borderRadius: "18px",
            background: "linear-gradient(135deg, #6BB5A6, #94CDD8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <ClipboardList size={isMobile ? 24 : 30} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: isMobile ? "24px" : "36px", fontWeight: "900", color: "#2D3A3A", lineHeight: 1 }}>
              발표 기록
            </h2>
            {!isLoading && (
              <p style={{ fontSize: isMobile ? "13px" : "15px", color: "#7AA5A0", marginTop: "6px" }}>
                총 {records.length}개의 기록
              </p>
            )}
          </div>
        </div>

        {/* 기록 목록 */}
        <div style={{
          background: "white",
          borderRadius: "30px",
          padding: isMobile ? "20px" : "34px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          border: "1px solid #E4F0EA",
        }}>
          {isLoading ? (
            <p style={{ color: "#6B7C79", textAlign: "center", padding: "40px 0" }}>
              기록을 불러오는 중입니다...
            </p>
          ) : records.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: "#6B7C79", fontSize: isMobile ? "15px" : "18px", marginBottom: "20px" }}>
                아직 저장된 발표 기록이 없습니다.
              </p>
              <button
                onClick={() => navigate("/practice-mode")}
                style={{
                  background: "#6BB5A6",
                  color: "white",
                  border: "none",
                  borderRadius: "16px",
                  padding: "12px 28px",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                첫 발표 연습하기
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gap: "12px", marginBottom: totalPages > 1 ? "24px" : 0 }}>
                {pagedRecords.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => handleRecordClick(record)}
                    style={{
                      background: "#F8FCFA",
                      borderRadius: "18px",
                      padding: isMobile ? "14px 16px" : "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      border: "1px solid #E4F0EA",
                      transition: "box-shadow 0.18s ease",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(107,181,166,0.15)"}
                    onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                  >
                    <div>
                      <strong style={{
                        display: "block",
                        fontSize: isMobile ? "15px" : "20px",
                        color: "#2D3A3A",
                        marginBottom: "4px",
                      }}>
                        발표 기록 #{record.id}
                      </strong>
                      <span style={{ color: "#6B7C79", fontSize: isMobile ? "12px" : "14px" }}>
                        {formatDate(record.created_at)}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <ScoreBadge score={record.final_score} isMobile={isMobile} />

                      <button
                        onClick={(e) => handleDelete(e, record.id)}
                        style={{
                          background: "white",
                          color: "#D9534F",
                          border: "1px solid #F2C5C3",
                          borderRadius: "10px",
                          padding: "8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>

                      <ChevronRight size={isMobile ? 18 : 22} color="#9CA3AF" />
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: isMobile ? "36px" : "42px",
                        height: isMobile ? "36px" : "42px",
                        borderRadius: "12px",
                        border: p === page ? "none" : "1px solid #E4F0EA",
                        background: p === page ? "#6BB5A6" : "white",
                        color: p === page ? "white" : "#6B7C79",
                        fontSize: isMobile ? "14px" : "16px",
                        fontWeight: p === page ? "900" : "600",
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

      </main>
    </div>
  );
}

function ScoreBadge({ score, isMobile }) {
  const value = Math.round(score || 0);
  const color = value >= 80 ? "#6BB5A6" : value >= 60 ? "#D99A2B" : "#E5534B";
  const bg = value >= 80 ? "#E5F4EF" : value >= 60 ? "#FFF8E6" : "#FEF0EF";

  return (
    <div style={{
      background: bg,
      color,
      padding: isMobile ? "6px 12px" : "10px 16px",
      borderRadius: "12px",
      fontWeight: "900",
      fontSize: isMobile ? "14px" : "18px",
    }}>
      {value}점
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

export default RecordsPage;
