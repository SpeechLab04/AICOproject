import { useState } from "react";
import { Video } from "lucide-react";
import { cardStyle, sectionTitle, getFS } from "./dashboardStyles";
import { useIsMobile } from "../../hooks/useIsMobile";

const RATIO_LABELS = {
  head:    { front: "정면", left: "좌측", right: "우측", up: "위", down: "아래" },
  emotion: { positive: "긍정", neutral: "중립" },
  gaze:    { center: "중앙", left: "좌측", right: "우측" },
  gesture: { neutral: "자연스러움", active: "활발함", open_hand: "손펼침", pointing: "가리킴" },
};

function RatioBadges({ metricKey, ratio }) {
  if (!ratio || Object.keys(ratio).length === 0) return null;
  const labelMap = RATIO_LABELS[metricKey] || {};
  const entries = Object.entries(ratio)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);
  if (entries.length === 0) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {entries.map(([key, value]) => (
        <span key={key} style={{
          background: "#EEF8F4",
          color: "#4D8F82",
          fontSize: "13px",
          fontWeight: "700",
          padding: "4px 12px",
          borderRadius: "999px",
          border: "1px solid #C8E4D6",
        }}>
          {labelMap[key] || key} {Math.round(value)}%
        </span>
      ))}
    </div>
  );
}

function VideoMetricRow({ item }) {
  const isMobile = useIsMobile();
  const score = item.score ?? 0;
  const warning = score < 60;

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 52px" : "150px 70px 1fr", gap: isMobile ? "8px" : "20px", alignItems: "center" }}>
      <strong style={{ color: "#2D3A3A", fontSize: isMobile ? "14px" : "18px" }}>
        {item.label}
      </strong>

      <strong style={{ color: warning ? "#D99A2B" : "#6BB5A6", fontSize: isMobile ? "14px" : "18px", textAlign: isMobile ? "right" : "left" }}>
        {score}점
      </strong>

      {!isMobile && (
        <div style={{ height: "12px", background: "#E4F0EA", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{ width: `${score}%`, height: "100%", background: warning ? "#D99A2B" : "#6BB5A6", borderRadius: "999px" }} />
        </div>
      )}
      {isMobile && (
        <div style={{ gridColumn: "1 / 3", height: "8px", background: "#E4F0EA", borderRadius: "999px", overflow: "hidden" }}>
          <div style={{ width: `${score}%`, height: "100%", background: warning ? "#D99A2B" : "#6BB5A6", borderRadius: "999px" }} />
        </div>
      )}
    </div>
  );
}

function TimelineChart({ data }) {
  const [hovered, setHovered] = useState(null);

  const width = 900;
  const height = 300;
  const padding = 46;

  const getX = (index) =>
    padding + (index * (width - padding * 2)) / (data.length - 1);

  const getY = (score) =>
    height - padding - (score / 100) * (height - padding * 2);

  const makeLine = (key) =>
    data.map((item, index) => `${getX(index)},${getY(item[key])}`).join(" ");

  const lines = [
    { key: "head_score", label: "고개 방향", color: "#6BB5A6" },
    { key: "emotion_score", label: "표정", color: "#D99A2B" },
    { key: "gaze_score", label: "시선", color: "#94CDD8" },
    { key: "gesture_score", label: "손동작", color: "#9BC870" },
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <svg width={width} height={height}>
        {[0, 25, 50, 75, 100].map((value) => (
          <g key={value}>
            <line
              x1={padding}
              x2={width - padding}
              y1={getY(value)}
              y2={getY(value)}
              stroke="#E4F0EA"
            />
            <text x="10" y={getY(value) + 5} fontSize="13" fill="#6B7C79">
              {value}
            </text>
          </g>
        ))}

        {data.map((item, index) => (
          <text
            key={item.time}
            x={getX(index) - 16}
            y={height - 12}
            fontSize="13"
            fill="#6B7C79"
          >
            {item.time}
          </text>
        ))}

        {lines.map((line) => (
          <polyline
            key={line.key}
            points={makeLine(line.key)}
            fill="none"
            stroke={line.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {lines.map((line) =>
          data.map((item, index) => {
            const x = getX(index);
            const y = getY(item[line.key]);

            return (
              <g
                key={`${line.key}-${index}`}
                onMouseEnter={() =>
                  setHovered({
                    x,
                    y,
                    text: `${item.time} / ${line.label}: ${item[line.key]}점`,
                  })
                }
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                <circle cx={x} cy={y} r="14" fill="transparent" />
                <circle cx={x} cy={y} r="6" fill={line.color} stroke="white" strokeWidth="2" />
              </g>
            );
          })
        )}

        {hovered && (
          <g>
            {(() => {
              const tooltipWidth = 190;
              const tooltipHeight = 36;
              const tooltipX = Math.max(
                10,
                Math.min(hovered.x - tooltipWidth / 2, width - tooltipWidth - 10)
              );
              const tooltipY = Math.max(10, hovered.y - 48);

              return (
                <>
                  <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx="10" fill="#2D3A3A" />
                  <text
                    x={tooltipX + tooltipWidth / 2}
                    y={tooltipY + 23}
                    textAnchor="middle"
                    fontSize="13"
                    fill="white"
                    fontWeight="700"
                  >
                    {hovered.text}
                  </text>
                </>
              );
            })()}
          </g>
        )}
      </svg>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          marginTop: "8px",
          color: "#6B7C79",
          fontSize: "15px",
        }}
      >
        {lines.map((line) => (
          <span key={line.key}>
            <span style={{ color: line.color }}>●</span> {line.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function VideoDetail({ score, feedback, metrics, timeline }) {
  const isMobile = useIsMobile();
  const fs = getFS(isMobile);
  return (
    <section style={cardStyle}>
      <h3 style={sectionTitle}>
        <Video size={28} color="#6BB5A6" />
        영상 분석 결과
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
        <p style={{ color: "#4B5563", fontSize: fs.body, lineHeight: "1.8", flex: 1, whiteSpace: "pre-line" }}>
          {feedback || "발표 영상을 기반으로 자세, 표정, 시선, 손동작을 종합 분석했습니다."}
        </p>
      </div>

      <div style={{ background: "#F8FCFA", borderRadius: "26px", padding: isMobile ? "20px 16px" : "30px", border: "1px solid #E4F0EA", marginBottom: "28px" }}>
        <h4 style={{ fontSize: fs.sectionH, color: "#2D3A3A", fontWeight: "900", marginBottom: isMobile ? "16px" : "24px" }}>
          항목별 태도 점수
        </h4>

        <div style={{ display: "grid", gap: "22px" }}>
          {metrics.map((item) => (
            <VideoMetricRow key={item.key || item.label} item={item} />
          ))}
        </div>
      </div>

      <div style={{ background: "#F8FCFA", borderRadius: "26px", padding: isMobile ? "20px 16px" : "30px", border: "1px solid #E4F0EA", marginBottom: "28px" }}>
        <h4 style={{ fontSize: fs.sectionH, color: "#2D3A3A", fontWeight: "900", marginBottom: isMobile ? "16px" : "24px" }}>
          시간 구간별 점수 변화
        </h4>

        {timeline.length > 0 ? (
          <TimelineChart data={timeline} />
        ) : (
          <p style={{ color: "#6B7C79", fontSize: fs.body }}>
            시간 구간별 분석 데이터는 아직 없습니다.
          </p>
        )}
      </div>

      <div style={{ background: "#F8FCFA", borderRadius: "26px", padding: isMobile ? "20px 16px" : "30px", border: "1px solid #E4F0EA" }}>
        <h4 style={{ fontSize: fs.sectionH, color: "#2D3A3A", fontWeight: "900", marginBottom: isMobile ? "16px" : "24px" }}>
          항목별 피드백
        </h4>

        <div style={{ display: "grid", gap: "14px" }}>
          {metrics.map((item) => (
            <div key={item.key || item.label} style={{ background: "white", borderRadius: "18px", padding: isMobile ? "14px 16px" : "20px 22px", border: "1px solid #E4F0EA" }}>
              <strong style={{ display: "block", color: "#2D3A3A", fontSize: fs.label, marginBottom: "8px" }}>
                {item.label}
              </strong>
              <p style={{ color: "#4B5563", fontSize: fs.body, lineHeight: "1.8", whiteSpace: "pre-line", marginBottom: "10px" }}>
                {item.feedback}
              </p>
              <RatioBadges metricKey={item.key} ratio={item.ratio} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default VideoDetail;
