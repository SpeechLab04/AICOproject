import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

function AudiencePage() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const [selectedAudiences, setSelectedAudiences] = useState([]);

  const audienceTypes = [
    {
      id: "mentor",
      name: "멘토형",
      subtitle: "우호적이고 전문적인 청중",
      detail: "깊이 있는 질문과 피드백을 제공하며, 발표자가 성장하도록 도와줍니다.",
      color: "#6BB5A6",
      bg: "#E5F4EF",
      level: "★★★★",
    },
    {
      id: "pressure",
      name: "압박형",
      subtitle: "엄격하고 전문적인 청중",
      detail: "날카로운 질문과 반박으로 발표 내용을 꼼꼼히 검증합니다.",
      color: "#D96B4C",
      bg: "#FBE8DF",
      level: "★★★★★",
    },
    {
      id: "troll",
      name: "비판형",
      subtitle: "엄격하고 비전문적인 청중",
      detail: "맥락 없는 질문이나 불만족스러운 반응으로 돌발 상황을 연습합니다.",
      color: "#D99A2B",
      bg: "#FFF0D2",
      level: "★★★",
    },
    {
      id: "basic",
      name: "기본형",
      subtitle: "우호적이고 비전문적인 청중",
      detail: "쉬운 질문과 온화한 반응으로 기본 발표 연습에 적합합니다.",
      color: "#4E9CDC",
      bg: "#E3F1FF",
      level: "★★",
    },
  ];

  const handleSelect = (audience) => {
    const alreadySelected = selectedAudiences.some(
      (item) => item.id === audience.id
    );

    if (alreadySelected) {
      setSelectedAudiences(
        selectedAudiences.filter((item) => item.id !== audience.id)
      );
      return;
    }

    if (selectedAudiences.length >= 4) {
      alert("청중은 최대 4명까지 선택할 수 있습니다.");
      return;
    }

    setSelectedAudiences([...selectedAudiences, audience]);
  };

  const handleNext = () => {
    if (selectedAudiences.length === 0) {
      alert("청중을 최소 1명 이상 선택해주세요.");
      return;
    }

    localStorage.setItem("selectedAudiences", JSON.stringify(selectedAudiences));
    navigate("/practice-mode");
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
          padding: isMobile ? "36px 22px 80px" : "60px 60px 100px",
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: isMobile ? "36px" : "54px",
          }}
        >
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
            청중 설정
          </div>

          <h2
            style={{
              fontSize: isMobile ? "34px" : "52px",
              color: "#2D3A3A",
              fontWeight: "900",
              marginBottom: "16px",
              lineHeight: "1.2",
            }}
          >
            발표를 들을 청중을 선택하세요
          </h2>

          <p
            style={{
              color: "#58706D",
              fontSize: isMobile ? "16px" : "20px",
              lineHeight: "1.7",
              wordBreak: "keep-all",
            }}
          >
            원하는 청중 유형을 선택하세요. 최대 4명까지 선택할 수 있습니다.
          </p>

          <p
            style={{
              marginTop: "14px",
              color: "#6BB5A6",
              fontSize: isMobile ? "15px" : "17px",
              fontWeight: "800",
            }}
          >
            선택된 청중 {selectedAudiences.length}/4명
          </p>
        </div>

        {/* 청중 카드 */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(2, minmax(260px, 1fr))",
            gap: isMobile ? "20px" : "28px",
          }}
        >
          {audienceTypes.map((audience) => {
            const isSelected = selectedAudiences.some(
              (item) => item.id === audience.id
            );

            return (
              <div
                key={audience.id}
                onClick={() => handleSelect(audience)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow =
                    "0 18px 38px rgba(0,0,0,0.12)";
                }}

                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 30px rgba(0,0,0,0.05)";
                }}
                style={{
                  background: isSelected ? audience.bg : "white",
                  borderRadius: "28px",
                  padding: isMobile ? "26px 24px" : "34px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                  border: `2px solid ${
                    isSelected ? audience.color : audience.bg
                  }`,
                  cursor: "pointer",
                  transform: "translateY(0)",
                  transition: "all 0.18s ease",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    background: isSelected ? "white" : audience.bg,
                    color: audience.color,
                    padding: "8px 16px",
                    borderRadius: "999px",
                    fontWeight: "900",
                    marginBottom: "22px",
                  }}
                >
                  {audience.name}
                </div>

                <h3
                  style={{
                    fontSize: isMobile ? "23px" : "28px",
                    color: "#2D3A3A",
                    fontWeight: "900",
                    marginBottom: "8px",
                  }}
                >
                  {audience.subtitle}
                </h3>

                <p
                  style={{
                    color: "#5C706C",
                    fontSize: isMobile ? "15px" : "17px",
                    lineHeight: "1.7",
                    marginBottom: "20px",
                    wordBreak: "keep-all",
                  }}
                >
                  {audience.detail}
                </p>

                <div
                  style={{
                    background: "white",
                    borderRadius: "18px",
                    padding: "16px",
                    color: audience.color,
                    fontWeight: "800",
                  }}
                >
                  난이도 {audience.level}
                </div>
              </div>
            );
          })}
        </section>

        {/* 다음 버튼 */}
        <div
          style={{
            marginTop: isMobile ? "34px" : "46px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <button
            onClick={handleNext}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow =
                "0 14px 28px rgba(107,181,166,0.35)";
            }}

            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(107,181,166,0.25)";
            }}
            style={{
              background: "#6BB5A6",
              color: "white",
              border: "none",
              padding: isMobile ? "16px 30px" : "18px 46px",
              borderRadius: "20px",
              fontSize: isMobile ? "17px" : "20px",
              fontWeight: "900",
              boxShadow: "0 8px 20px rgba(107,181,166,0.25)",
              width: isMobile ? "100%" : "auto",
              transform: "translateY(0)",
              transition: "all 0.18s ease",
              cursor: "pointer",
            }}
          >
            발표 방식 선택하기
          </button>
        </div>
      </main>
    </div>
  );
}

export default AudiencePage;