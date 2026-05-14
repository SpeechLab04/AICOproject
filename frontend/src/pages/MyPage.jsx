import { useNavigate } from "react-router-dom";
import {
  User,
  Trophy,
  BarChart3,
  Clock3,
  ChevronRight,
  LogOut,
} from "lucide-react";
import Header from "../components/Header";

function MyPage() {
  const navigate = useNavigate();

  const userEmail = localStorage.getItem("userEmail") || "guest@aico.ai";

  const practiceCount = 12;
  const averageScore = 84;
  const totalTime = "3시간 24분";

  const recentRecords = [
    {
      title: "학교 발표",
      score: 83,
      date: "2026. 05. 15",
    },
    {
      title: "프로젝트 발표",
      score: 87,
      date: "2026. 05. 12",
    },
    {
      title: "면접 연습",
      score: 79,
      date: "2026. 05. 09",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");

    navigate("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FCFA",
        color: "#2F3E46",
      }}
    >
      <Header showBack />

      <main
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "50px 60px 100px",
        }}
      >
        {/* 프로필 */}
        <section
          style={{
            background: "linear-gradient(135deg, #6BB5A6, #94CDD8)",
            borderRadius: "34px",
            padding: "42px",
            color: "white",
            boxShadow: "0 16px 36px rgba(107,181,166,0.24)",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px",
            }}
          >
            <div
              style={{
                width: "110px",
                height: "110px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
              }}
            >
              <User size={54} />
            </div>

            <div>
              <h2
                style={{
                  fontSize: "42px",
                  fontWeight: "900",
                  marginBottom: "10px",
                }}
              >
                마이페이지
              </h2>

              <p
                style={{
                  fontSize: "18px",
                  opacity: 0.92,
                }}
              >
                {userEmail}
              </p>
            </div>
          </div>
        </section>

        {/* 통계 */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "22px",
            marginBottom: "30px",
          }}
        >
          <StatCard
            icon={<Trophy size={30} color="#6BB5A6" />}
            value={`${averageScore}점`}
            label="평균 발표 점수"
          />

          <StatCard
            icon={<BarChart3 size={30} color="#6BB5A6" />}
            value={`${practiceCount}회`}
            label="총 연습 횟수"
          />

          <StatCard
            icon={<Clock3 size={30} color="#6BB5A6" />}
            value={totalTime}
            label="총 연습 시간"
          />
        </section>

        {/* 최근 기록 */}
        <section
          style={{
            background: "white",
            borderRadius: "30px",
            padding: "34px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            border: "1px solid #E4F0EA",
            marginBottom: "28px",
          }}
        >
          <h3
            style={{
              fontSize: "30px",
              fontWeight: "900",
              color: "#2D3A3A",
              marginBottom: "26px",
            }}
          >
            최근 발표 기록
          </h3>

          <div
            style={{
              display: "grid",
              gap: "18px",
            }}
          >
            {recentRecords.map((record, idx) => (
              <div
                key={idx}
                style={{
                  background: "#F8FCFA",
                  borderRadius: "22px",
                  padding: "22px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.18s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 24px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "22px",
                      color: "#2D3A3A",
                      marginBottom: "6px",
                    }}
                  >
                    {record.title}
                  </strong>

                  <span
                    style={{
                      color: "#6B7C79",
                    }}
                  >
                    {record.date}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "18px",
                  }}
                >
                  <div
                    style={{
                      background: "#E5F4EF",
                      color: "#6BB5A6",
                      padding: "12px 18px",
                      borderRadius: "16px",
                      fontWeight: "900",
                      fontSize: "20px",
                    }}
                  >
                    {record.score}점
                  </div>

                  <ChevronRight color="#9CA3AF" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 버튼 */}
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          <button
            onClick={() => navigate("/practice-mode")}
            style={primaryButton}
          >
            새 발표 연습하기
          </button>

          <button
            onClick={handleLogout}
            style={secondaryButton}
          >
            <LogOut
              size={18}
              style={{
                verticalAlign: "middle",
                marginRight: "8px",
              }}
            />
            로그아웃
          </button>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: "28px",
        padding: "30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        border: "1px solid #E4F0EA",
      }}
    >
      <div style={{ marginBottom: "18px" }}>{icon}</div>

      <strong
        style={{
          display: "block",
          fontSize: "38px",
          color: "#2D3A3A",
          marginBottom: "8px",
        }}
      >
        {value}
      </strong>

      <span
        style={{
          color: "#6B7C79",
          fontSize: "17px",
        }}
      >
        {label}
      </span>
    </div>
  );
}

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