import { useState } from "react";
import { FileText, MessageSquare, AlertCircle } from "lucide-react";
import { cardStyle, sectionTitle, getFS } from "./dashboardStyles";
import { useIsMobile } from "../../hooks/useIsMobile";

function SegmentedScript({ segments, scriptText, videoRef }) {
  const isMobile = useIsMobile();
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const jumpTo = (start) => {
    if (videoRef?.current) {
      videoRef.current.currentTime = start;
      videoRef.current.play();
      videoRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (segments && segments.length > 0) {
    return (
      <>
        <p style={{ fontSize: "13px", color: "#7AA5A0", marginBottom: "16px" }}>
          구간을 클릭하면 해당 영상 부분으로 이동합니다.
        </p>
        {segments.map((seg, i) => (
          <span
            key={i}
            onClick={() => jumpTo(seg.start)}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            title={`${seg.start.toFixed(1)}초로 이동`}
            style={{
              cursor: "pointer",
              borderRadius: "6px",
              padding: "2px 4px",
              background: hoveredIdx === i ? "#EEF8F4" : "transparent",
              transition: "background 0.15s",
              lineHeight: "2",
            }}
          >
            {seg.text.trim()}{" "}
          </span>
        ))}
      </>
    );
  }

  return <>{scriptText}</>;
}

function ContentDetail({
  score,
  summary,
  generalQuestions = [],
  audienceQuestions = [],
  scriptText,
  weaknessItems = [],
  segments = [],
  videoRef,
}) {
  const isMobile = useIsMobile();
  const fs = getFS(isMobile);
  return (
    <div style={{ display: "grid", gap: "28px" }}>
      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          <FileText size={28} color="#6BB5A6" />
          내용 분석 결과
        </h3>

        <div style={{
          background: "linear-gradient(135deg, #EEF8F4, #F0F9FF)",
          borderRadius: "24px",
          padding: isMobile ? "20px" : "28px 32px",
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          gap: isMobile ? "16px" : "32px",
          border: "1px solid #D4EDEA",
        }}>
          <div style={{ textAlign: "center", minWidth: isMobile ? "64px" : "90px" }}>
            <div style={{ fontSize: fs.score, fontWeight: "900", color: "#6BB5A6", lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ fontSize: fs.small, color: "#7AA5A0", marginTop: "4px", fontWeight: "700" }}>
              종합 점수
            </div>
          </div>
          <div style={{ width: "1px", height: "50px", background: "#C8E4D6" }} />
          <p style={{ color: "#4B5563", fontSize: fs.body, lineHeight: "1.8", flex: 1 }}>
            발표 내용의 논리성, 구성, 전달력을 종합 분석했습니다.
          </p>
        </div>

        <h4 style={{ fontSize: fs.sectionH, color: "#2D3A3A", marginBottom: "16px", fontWeight: "900" }}>
          발표 내용 요약
        </h4>

        <p style={{ color: "#4B5563", fontSize: fs.label, lineHeight: "1.9", whiteSpace: "pre-line" }}>
          {summary}
        </p>
      </section>

      {weaknessItems.length > 0 && (
        <section style={cardStyle}>
          <h3 style={sectionTitle}>
            <AlertCircle size={28} color="#D99A2B" />
            보완점
          </h3>

          <div style={{ display: "grid", gap: "12px" }}>
            {weaknessItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: "#FFFBF0",
                  border: "1px solid #F0D98A",
                  borderRadius: "18px",
                  padding: "14px 18px",
                  color: "#2D3A3A",
                  fontSize: fs.body,
                  lineHeight: "1.8",
                }}
              >
                · {item}
              </div>
            ))}
          </div>
        </section>
      )}


      {/* 🎯 여기 청중별 질문 코드를 교체 수정했습니다 */}
      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          <MessageSquare size={28} color="#6BB5A6" />
          청중별 질문
        </h3>

        {audienceQuestions.length > 0 ? (
          audienceQuestions.map((item, index) => (
            <div
              key={index}
              style={{ 
                background: "#F8FCFA", 
                borderRadius: "20px", 
                padding: "22px", 
                marginBottom: "16px",
                border: "1px solid #EFF6F4" 
              }}
            >
              <strong style={{ display: "block", color: "#6BB5A6", fontSize: fs.label, marginBottom: "8px" }}>
                {item.audience}
              </strong>
              <p style={{ color: "#2D3A3A", fontSize: fs.label, lineHeight: "1.7", marginBottom: item.intent ? "14px" : "0" }}>
                {item.question}
              </p>

              {/* 💡 질문 의도(Intent) 표출 박스 추가 레이어 */}
              {item.intent && (
                <div 
                  style={{ 
                    background: "#EEF8F4", 
                    padding: "14px 18px", 
                    borderRadius: "14px", 
                    borderLeft: "4px solid #9BC870",
                    marginTop: "4px"
                  }}
                >
                  <p style={{ fontSize: "14px", color: "#58706D", margin: 0, lineHeight: "1.6", wordBreak: "keep-all" }}>
                    💡 <strong>질문 의도:</strong> {item.intent}
                  </p>
                </div>
              )}

              {item.answer && (
                <div
                  style={{
                    background: "#F7F9FF",
                    padding: "16px 18px",
                    borderRadius: "14px",
                    borderLeft: "4px solid #6BB5A6",
                    marginTop: "12px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#58706D",
                      marginBottom: "8px",
                      fontWeight: "700",
                    }}
                  >
                    🎤 내 답변
                  </p>

                  <p
                    style={{
                      margin: 0,
                      color: "#2D3A3A",
                      lineHeight: "1.7",
                    }}
                  >
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: "#6B7C79" }}>선택된 청중 질문이 없습니다.</p>
        )}
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitle}>
          <FileText size={28} color="#6BB5A6" />
          발표 스크립트
        </h3>

        <div
          style={{
            background: "#F8FCFA",
            borderRadius: "22px",
            padding: "28px",
            maxHeight: "360px",
            overflowY: "auto",
            color: "#4B5563",
            fontSize: fs.label,
            lineHeight: "2",
            whiteSpace: "pre-line",
          }}
        >
          <SegmentedScript
            segments={segments}
            scriptText={scriptText}
            videoRef={videoRef}
          />
        </div>
      </section>
    </div>
  );
}

export default ContentDetail;