import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Mic,
  Volume2,
  SkipForward,
  CheckCircle2,
} from "lucide-react";
import Header from "../components/Header";

function LivePage() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const audiences =
    JSON.parse(localStorage.getItem("selectedAudiences")) || [];

  const generatedQuestions =
    audiences.length > 0
      ? audiences.map((audience, idx) => ({
          id: idx + 1,
          audience: audience.name,
          question:
            idx === 0
              ? "이 발표 주제를 선택한 이유는 무엇인가요?"
              : idx === 1
              ? "AICO 서비스의 가장 큰 차별점은 무엇인가요?"
              : idx === 2
              ? "실제 사용자에게 어떤 도움이 될 수 있나요?"
              : "이 서비스를 어떻게 발전시킬 계획인가요?",
        }))
      : [];

  const [isStarted, setIsStarted] = useState(false);
  const [presentationEnded, setPresentationEnded] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);

  const currentQuestion = generatedQuestions[currentQuestionIndex];

  const handlePresentationStart = () => {
    setIsStarted(true);
  };

  const handlePresentationEnd = () => {
    setPresentationEnded(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < generatedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setIsAnswering(false);
    } else {
      navigate("/dashboard");
    }
  };

  const handleSkip = () => {
    handleNextQuestion();
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
          maxWidth: "1180px",
          margin: "0 auto",
          padding: isMobile ? "36px 22px 80px" : "54px 60px 100px",
        }}
      >
        {/* 제목 */}
        <div style={{ textAlign: "center", marginBottom: "42px" }}>
          <div
            style={{
              display: "inline-block",
              background: "#C8E4D6",
              color: "#4D8F82",
              padding: "10px 22px",
              borderRadius: "999px",
              fontWeight: "800",
              marginBottom: "22px",
            }}
          >
            실시간 발표 연습
          </div>

          <h2
            style={{
              fontSize: isMobile ? "36px" : "54px",
              color: "#2D3A3A",
              fontWeight: "900",
              marginBottom: "16px",
            }}
          >
            AI 청중과 실시간 발표 연습
          </h2>

          <p
            style={{
              color: "#58706D",
              fontSize: isMobile ? "16px" : "20px",
              lineHeight: "1.7",
            }}
          >
            발표 종료 후 AI 청중이 질문을 생성하고 답변 연습을 진행합니다.
          </p>
        </div>

        {/* 메인 */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.15fr 0.85fr",
            gap: "28px",
          }}
        >
          {/* 카메라 */}
          <div
            style={{
              background: "white",
              borderRadius: "32px",
              padding: isMobile ? "24px" : "34px",
              boxShadow: "0 14px 38px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                height: isMobile ? "260px" : "430px",
                borderRadius: "28px",
                background: "#E5F4EF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "16px",
                color: "#6BB5A6",
                marginBottom: "24px",
              }}
            >
              <Video size={68} />

              <strong style={{ fontSize: "20px" }}>
                {isStarted
                  ? "실시간 발표 진행 중"
                  : "카메라 연결 대기 중"}
              </strong>
            </div>

            {!isStarted ? (
              <button
                onClick={handlePresentationStart}
                style={mainButtonStyle}
              >
                발표 시작하기
              </button>
            ) : !presentationEnded ? (
              <button
                onClick={handlePresentationEnd}
                style={{
                  ...mainButtonStyle,
                  background: "#CAD870",
                }}
              >
                발표 종료하기
              </button>
            ) : (
              <div
                style={{
                  background: "#EEF8F4",
                  borderRadius: "22px",
                  padding: "24px",
                  textAlign: "center",
                  color: "#4B5563",
                  lineHeight: "1.8",
                }}
              >
                <CheckCircle2
                  size={34}
                  color="#6BB5A6"
                  style={{ marginBottom: "10px" }}
                />

                <div
                  style={{
                    fontWeight: "800",
                    color: "#2D3A3A",
                    marginBottom: "8px",
                  }}
                >
                  발표 분석 완료
                </div>

                AI 청중 질문 생성이 완료되었습니다.
              </div>
            )}
          </div>

          {/* 질문 영역 */}
          <div
            style={{
              background: "white",
              borderRadius: "32px",
              padding: isMobile ? "24px" : "34px",
              boxShadow: "0 14px 38px rgba(0,0,0,0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "24px",
              }}
            >
              <Mic size={24} color="#6BB5A6" />

              <h3
                style={{
                  fontSize: "28px",
                  color: "#2D3A3A",
                  fontWeight: "900",
                }}
              >
                AI 청중 질문
              </h3>
            </div>

            {!presentationEnded ? (
              <div
                style={{
                  background: "#F8FCFA",
                  borderRadius: "22px",
                  padding: "30px 24px",
                  color: "#5C706C",
                  textAlign: "center",
                  lineHeight: "1.8",
                }}
              >
                발표를 종료하면 AI 청중 질문이 생성됩니다.
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "inline-block",
                    background: "#E5F4EF",
                    color: "#6BB5A6",
                    padding: "8px 16px",
                    borderRadius: "999px",
                    fontWeight: "800",
                    marginBottom: "20px",
                  }}
                >
                  {currentQuestion?.audience}
                </div>

                <div
                  style={{
                    background: "#F8FCFA",
                    borderRadius: "24px",
                    padding: "26px",
                    lineHeight: "1.8",
                    color: "#2D3A3A",
                    fontSize: isMobile ? "17px" : "19px",
                    marginBottom: "24px",
                    minHeight: "140px",
                  }}
                >
                  Q. {currentQuestion?.question}
                </div>

                <button
                  style={{
                    width: "100%",
                    background: "#E5F4EF",
                    color: "#6BB5A6",
                    border: "none",
                    padding: "15px",
                    borderRadius: "18px",
                    fontWeight: "800",
                    marginBottom: "18px",
                    cursor: "pointer",
                  }}
                >
                  <Volume2
                    size={18}
                    style={{
                      verticalAlign: "middle",
                      marginRight: "8px",
                    }}
                  />
                  질문 읽기
                </button>

                <div
                  style={{
                    background: isAnswering ? "#EEF8F4" : "#F8FCFA",
                    borderRadius: "22px",
                    padding: "24px",
                    textAlign: "center",
                    marginBottom: "20px",
                  }}
                >
                  <Mic
                    size={36}
                    color={isAnswering ? "#6BB5A6" : "#A0AEC0"}
                    style={{ marginBottom: "12px" }}
                  />

                  <div
                    style={{
                      color: "#4B5563",
                      lineHeight: "1.7",
                    }}
                  >
                    {isAnswering
                      ? "답변 음성을 분석 중입니다..."
                      : "버튼을 눌러 음성으로 답변하세요"}
                  </div>
                </div>

                <button
                  onClick={() => setIsAnswering(!isAnswering)}
                  style={mainButtonStyle}
                >
                  {isAnswering ? "답변 종료하기" : "답변 시작하기"}
                </button>

                <div
                  style={{
                    display: "flex",
                    gap: "14px",
                    marginTop: "18px",
                  }}
                >
                  <button
                    onClick={handleSkip}
                    style={subButtonStyle}
                  >
                    <SkipForward
                      size={18}
                      style={{
                        verticalAlign: "middle",
                        marginRight: "6px",
                      }}
                    />
                    질문 건너뛰기
                  </button>

                  <button
                    onClick={handleNextQuestion}
                    style={subButtonStyle}
                  >
                    다음 질문
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const mainButtonStyle = {
  width: "100%",
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

const subButtonStyle = {
  flex: 1,
  background: "white",
  border: "2px solid #C8E4D6",
  color: "#4B5563",
  padding: "14px",
  borderRadius: "18px",
  fontWeight: "800",
  cursor: "pointer",
};

export default LivePage;