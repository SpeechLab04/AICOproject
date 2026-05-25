import { useState } from "react";
import { Mic, FileText } from "lucide-react";
import { cardStyle, sectionTitle, getFS } from "./dashboardStyles";
import { useIsMobile } from "../../hooks/useIsMobile";

function HighlightedScript({ text, fillerOccurrences, videoRef }) {
  if (!text) return null;

  const occurrences = fillerOccurrences || [];
  if (occurrences.length === 0) {
    return <>{text}</>;
  }

  const fillerSet = new Set(occurrences.map((o) => o.word));
  const occurrencesByWord = {};
  for (const occ of occurrences) {
    if (!occurrencesByWord[occ.word]) occurrencesByWord[occ.word] = [];
    occurrencesByWord[occ.word].push(occ.at);
  }

  const wordCounters = {};
  const tokens = text.split(/([\s,.!?\n]+)/);
  const parts = tokens.map((token, i) => {
    const stripped = token.replace(/[,.!?\s\n]/g, "");
    if (stripped && fillerSet.has(stripped)) {
      const idx = wordCounters[stripped] || 0;
      const timestamps = occurrencesByWord[stripped] || [];
      const at = timestamps[Math.min(idx, timestamps.length - 1)];
      wordCounters[stripped] = idx + 1;
      return { type: "filler", content: token, at, key: i };
    }
    return { type: "text", content: token, key: i };
  });

  const jumpTo = (at) => {
    if (videoRef?.current) {
      videoRef.current.currentTime = at;
      videoRef.current.play();
      videoRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <>
      {parts.map((p) =>
        p.type === "filler" ? (
          <mark
            key={p.key}
            style={{
              background: "#FFE4E4",
              color: "#C0424A",
              borderRadius: "4px",
              padding: "1px 5px",
              cursor: "pointer",
              fontWeight: "800",
              border: "1px solid #F0C0C0",
            }}
            title={`${p.at}초로 이동`}
            onClick={() => jumpTo(p.at)}
          >
            {p.content}
          </mark>
        ) : (
          <span key={p.key}>{p.content}</span>
        )
      )}
    </>
  );
}

function VoiceDetail({
  score,
  speedWpm,
  fillerCount,
  feedback,
  summary,
  habits,
  timeline,
  videoRef,
  scriptText,
  fillerOccurrences = [],
}) {
  const isMobile = useIsMobile();
  const fs = getFS(isMobile);
  const wpm = Math.round(speedWpm || 0);
  const vibrancyScore = Math.round(score || 0);
  const [activePoint, setActivePoint] = useState(null);

  const fillerTotal = habits.filler_count || fillerCount || 0;
  const echoCount = habits.echo_count || 0;
  const modCount = habits.modification_count || 0;

  const statusColorMap = {
    "매우 느림": "#8B949E",
    "조금 느림": "#94CDD8",
    "적절함":    "#6BB5A6",
    "조금 빠름": "#D99A2B",
    "매우 빠름": "#E5534B",
  };
  const statusLabel = wpm === 0 ? "분석 중" : (summary.status || "분석 완료");
  const wpmStatus = {
    label: statusLabel,
    color: statusColorMap[statusLabel] || "#AABFBB",
  };

  const voiceMetrics = [
    {
      key: "wpm",
      label: "말하기 속도",
      score: wpm > 0 ? Math.min(100, Math.round((wpm / 160) * 100)) : 0,
      feedback: wpm > 0
        ? feedback || "말하기 속도 분석 결과입니다."
        : "음성이 아직 인식되지 않았습니다.",
    },
    {
      key: "vibrancy",
      label: "목소리 활력",
      score: vibrancyScore,
      feedback: vibrancyScore > 0
        ? "억양 변화와 목소리 활력 정도를 분석한 결과입니다."
        : "활력 점수가 아직 인식되지 않았습니다.",
    },
    {
      key: "filler",
      label: "추임새 사용",
      score: fillerTotal ? Math.max(0, 100 - fillerTotal * 10) : 100,
      feedback: fillerTotal > 0
        ? `추임새가 ${fillerTotal}회 감지되었습니다. 문장 사이에 잠깐 멈추는 연습을 해보세요.`
        : "불필요한 추임새가 거의 없었습니다.",
    },
    {
      key: "repeat",
      label: "반복 표현",
      score: echoCount ? Math.max(0, 100 - echoCount * 15) : 100,
      feedback: echoCount > 0
        ? `반복 표현이 ${echoCount}회 감지되었습니다.`
        : "반복 표현이 거의 없었습니다.",
    },
  ];

  const voiceTotalScore = vibrancyScore > 0
    ? Math.round(voiceMetrics.reduce((sum, m) => sum + m.score, 0) / voiceMetrics.length)
    : 0;

  const totalDuration = summary.total_duration || 1;

  return (
    <section style={cardStyle}>
      <h3 style={sectionTitle}>
        <Mic size={28} color="#6BB5A6" />
        음성 분석 결과
      </h3>

      {/* 총점 배너 */}
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
            {voiceTotalScore}
          </div>
          <div style={{ fontSize: fs.small, color: "#7AA5A0", marginTop: "4px", fontWeight: "700" }}>
            종합 점수
          </div>
        </div>
        <div style={{ width: "1px", height: "50px", background: "#C8E4D6" }} />
        <p style={{ color: "#4B5563", fontSize: fs.body, lineHeight: "1.8", flex: 1 }}>
          {voiceTotalScore > 0
            ? "말하기 속도, 목소리 활력, 추임새 사용, 반복 표현을 종합 분석했습니다."
            : "음성 분석 결과가 아직 인식되지 않았습니다. 조용한 환경에서 또렷한 목소리로 다시 촬영해보세요."}
        </p>
      </div>

      {/* 핵심 수치 4개 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: "10px", marginBottom: "28px" }}>
        <StatCard
          label="말하기 속도"
          value={wpm > 0 ? `${wpm}` : "–"}
          unit="WPM"
          badge={wpmStatus.label}
          badgeColor={wpmStatus.color}
        />
        <StatCard
          label="목소리 활력"
          value={vibrancyScore > 0 ? `${vibrancyScore}` : "–"}
          unit="점"
          badge={vibrancyScore >= 70 ? "양호" : vibrancyScore > 0 ? "보통" : "분석 중"}
          badgeColor={vibrancyScore >= 70 ? "#6BB5A6" : vibrancyScore > 0 ? "#D99A2B" : "#AABFBB"}
        />
        <StatCard
          label="추임새"
          value={`${fillerTotal}`}
          unit="회"
          badge={fillerTotal === 0 ? "없음" : fillerTotal <= 3 ? "적음" : "많음"}
          badgeColor={fillerTotal === 0 ? "#6BB5A6" : fillerTotal <= 3 ? "#D99A2B" : "#E5534B"}
        />
        <StatCard
          label="반복 표현"
          value={`${echoCount}`}
          unit="회"
          badge={echoCount === 0 ? "없음" : echoCount <= 2 ? "적음" : "많음"}
          badgeColor={echoCount === 0 ? "#6BB5A6" : echoCount <= 2 ? "#D99A2B" : "#E5534B"}
        />
      </div>

      {/* 항목별 점수 바 */}
      <div style={{ marginBottom: "28px" }}>
        <h4 style={{ fontSize: fs.sectionH, fontWeight: "900", color: "#2D3A3A", marginBottom: "16px" }}>
          항목별 점수
        </h4>
        <div style={{ display: "grid", gap: "16px" }}>
          {voiceMetrics.map((item) => {
            const warn = item.score < 60;
            return (
              <div key={item.key}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: fs.label, fontWeight: "700", color: "#2D3A3A" }}>{item.label}</span>
                  <span style={{ fontSize: fs.label, fontWeight: "900", color: warn ? "#D99A2B" : "#6BB5A6" }}>
                    {item.score}점
                  </span>
                </div>
                <div style={{ height: "8px", background: "#E4F0EA", borderRadius: "999px", overflow: "hidden", marginBottom: "6px" }}>
                  <div style={{
                    width: `${item.score}%`,
                    height: "100%",
                    background: warn ? "#D99A2B" : "#6BB5A6",
                    borderRadius: "999px",
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <p style={{ fontSize: fs.body, color: "#7AA5A0", lineHeight: "1.6" }}>{item.feedback}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 언어 습관 */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
        <div style={habitBox}>
          <div style={habitBoxHeader}>
            <span style={{ ...habitBoxTitle, fontSize: fs.label }}>추임새 목록</span>
            <span style={{ ...countBadge, background: fillerTotal > 0 ? "#FFF3E0" : "#EEF8F4", color: fillerTotal > 0 ? "#D99A2B" : "#6BB5A6" }}>
              총 {fillerTotal}회
            </span>
          </div>
          {(habits.filler_list || []).length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {habits.filler_list.map((word, idx) => (
                <span key={idx} style={{ ...fillerTag, fontSize: isMobile ? "13px" : "16px", padding: isMobile ? "4px 10px" : "6px 14px" }}>{word}</span>
              ))}
            </div>
          ) : (
            <p style={emptyText}>감지된 추임새가 없습니다.</p>
          )}
        </div>

        <div style={habitBox}>
          <div style={habitBoxHeader}>
            <span style={{ ...habitBoxTitle, fontSize: fs.label }}>반복 표현</span>
            <span style={{ ...countBadge, background: echoCount > 0 ? "#FFF3E0" : "#EEF8F4", color: echoCount > 0 ? "#D99A2B" : "#6BB5A6" }}>
              총 {echoCount}회
            </span>
          </div>
          {(habits.duplicate_details || []).length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {habits.duplicate_details.map((item, idx) => (
                <span key={idx} style={{ ...repeatTag, fontSize: isMobile ? "13px" : "16px", padding: isMobile ? "4px 10px" : "6px 14px" }}>{item}</span>
              ))}
            </div>
          ) : (
            <p style={emptyText}>감지된 반복 표현이 없습니다.</p>
          )}
        </div>

        {(habits.modification_list || []).length > 0 && (
          <div style={{ ...habitBox, gridColumn: isMobile ? "auto" : "1 / 3" }}>
            <div style={habitBoxHeader}>
              <span style={{ ...habitBoxTitle, fontSize: fs.label }}>수정 발화</span>
              <span style={{ ...countBadge, background: "#FFF3E0", color: "#D99A2B" }}>
                총 {modCount}회
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {habits.modification_list.map((item, idx) => (
                <span key={idx} style={{ ...modTag, fontSize: isMobile ? "13px" : "16px", padding: isMobile ? "4px 10px" : "6px 14px" }}>{item}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 타임라인 */}
      <div style={habitBox}>
        <div style={{ ...habitBoxHeader, marginBottom: "16px", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "6px" : "0" }}>
          <span style={{ ...habitBoxTitle, fontSize: fs.label }}>발표 타임라인</span>
          <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "#6B7C79" }}>
            <span><b style={{ color: "#D99A2B" }}>●</b> 침묵 구간</span>
            <span><b style={{ color: "#94CDD8" }}>●</b> 단조로운 구간</span>
          </div>
        </div>

        <div style={{ position: "relative", height: "56px" }}>
          <div style={{
            position: "absolute", top: "22px", left: 0, right: 0,
            height: "10px", background: "#E5F4EF", borderRadius: "999px",
          }} />

          {(timeline.monotone_sections || []).map((mono, idx) => (
            <button
              key={idx}
              onClick={() => { if (videoRef?.current) { videoRef.current.currentTime = mono.start; videoRef.current.play(); videoRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); } }}
              style={{
                position: "absolute", top: "22px", height: "10px",
                left: `${(mono.start / totalDuration) * 100}%`,
                width: `${((mono.end - mono.start) / totalDuration) * 100}%`,
                background: "#94CDD8", borderRadius: "999px", cursor: "pointer", border: "none",
              }}
              title={`${mono.start.toFixed(1)}초 ~ ${mono.end.toFixed(1)}초 단조로운 말투`}
            />
          ))}

          {(timeline.pause_details || []).map((pause, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActivePoint(`pause-${idx}`);
                if (videoRef?.current) { videoRef.current.currentTime = pause.at; videoRef.current.play(); videoRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); }
              }}
              style={{
                position: "absolute", top: "14px",
                left: `${(pause.at / totalDuration) * 100}%`,
                width: "24px", height: "24px", borderRadius: "50%",
                background: "#D99A2B", border: "3px solid white",
                transform: "translateX(-50%)", cursor: "pointer",
                boxShadow: activePoint === `pause-${idx}` ? "0 0 0 3px rgba(217,154,43,0.35)" : "0 2px 6px rgba(0,0,0,0.12)",
                transition: "box-shadow 0.2s",
              }}
              title={`${pause.at.toFixed(1)}초 · ${pause.duration.toFixed(1)}초 침묵`}
            />
          ))}
        </div>

        {(timeline.pause_details || []).length === 0 && (timeline.monotone_sections || []).length === 0 && (
          <p style={{ ...emptyText, marginTop: "8px" }}>타임라인 데이터가 없습니다.</p>
        )}
      </div>

      {/* 발표 스크립트 */}
      {scriptText && (
        <div style={{ ...habitBox, marginTop: "16px" }}>
          <div style={{ ...habitBoxHeader, marginBottom: "16px", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? "6px" : "0" }}>
            <span style={{ ...habitBoxTitle, fontSize: fs.label }}>
              <FileText size={16} color="#6BB5A6" style={{ verticalAlign: "middle", marginRight: "6px" }} />
              발표 스크립트
            </span>
            {fillerOccurrences.length > 0 && (
              <span style={{ fontSize: "12px", color: "#9B5A60" }}>
                <span style={{ color: "#C0424A", fontWeight: "800" }}>●</span>
                {" "}추임새 클릭 시 해당 구간으로 이동
              </span>
            )}
          </div>
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "22px",
            maxHeight: "320px",
            overflowY: "auto",
            color: "#4B5563",
            fontSize: "17px",
            lineHeight: "2",
            whiteSpace: "pre-line",
            border: "1px solid #E4F0EA",
          }}>
            <HighlightedScript
              text={scriptText}
              fillerOccurrences={fillerOccurrences}
              videoRef={videoRef}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, unit, badge, badgeColor }) {
  return (
    <div style={{
      background: "#F8FCFA",
      border: "1px solid #E4F0EA",
      borderRadius: "20px",
      padding: "20px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "13px", color: "#7AA5A0", fontWeight: "700", marginBottom: "8px" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "3px", marginBottom: "10px" }}>
        <span style={{ fontSize: "34px", fontWeight: "900", color: "#2D3A3A", lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: "14px", color: "#7AA5A0", fontWeight: "700" }}>{unit}</span>
      </div>
      <span style={{
        display: "inline-block",
        background: `${badgeColor}22`,
        color: badgeColor,
        fontSize: "12px",
        fontWeight: "800",
        padding: "3px 10px",
        borderRadius: "999px",
      }}>
        {badge}
      </span>
    </div>
  );
}

const habitBox = {
  background: "#F8FCFA",
  border: "1px solid #E4F0EA",
  borderRadius: "20px",
  padding: "22px",
};

const habitBoxHeader = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "14px",
};

const habitBoxTitle = {
  fontSize: "18px",
  fontWeight: "900",
  color: "#2D3A3A",
};

const countBadge = {
  fontSize: "13px",
  fontWeight: "800",
  padding: "3px 10px",
  borderRadius: "999px",
};

const fillerTag = {
  background: "#FFF3E0",
  color: "#C17B20",
  fontSize: "16px",
  fontWeight: "800",
  padding: "6px 14px",
  borderRadius: "999px",
  border: "1px solid #F0D098",
};

const repeatTag = {
  background: "#FFF0F0",
  color: "#C0424A",
  fontSize: "16px",
  fontWeight: "800",
  padding: "6px 14px",
  borderRadius: "999px",
  border: "1px solid #F0C0C0",
};

const modTag = {
  background: "#E5F4EF",
  color: "#4D8F82",
  fontSize: "16px",
  fontWeight: "800",
  padding: "6px 14px",
  borderRadius: "999px",
};

const emptyText = {
  fontSize: "16px",
  color: "#AABFBB",
  lineHeight: "1.6",
};

export default VoiceDetail;
