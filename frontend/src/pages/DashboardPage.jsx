import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import {
  CheckCircle,
  AlertCircle,
  Eye,
  Volume2,
  Brain,
  RotateCcw,
  Video,
} from "lucide-react";
import Header from "../components/Header";
import AnalysisCard from "../components/dashboard/AnalysisCard";
import SummaryCard from "../components/dashboard/SummaryCard";
import VideoDetail from "../components/dashboard/VideoDetail";
import VoiceDetail from "../components/dashboard/VoiceDetail";
import ContentDetail from "../components/dashboard/ContentDetail";
import { cardStyle, sectionTitle } from "../components/dashboard/dashboardStyles";

function DashboardPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedAnalysis, setSelectedAnalysis] = useState("video");
  const videoRef = useRef(null);
  const [voiceDetailResult, setVoiceDetailResult] = useState(null);

  const analysisResult = JSON.parse(localStorage.getItem("analysisResult") || "null");
  const scenario = JSON.parse(localStorage.getItem("selectedScenario")) || { title: "학교 발표" };
  const audiences = JSON.parse(localStorage.getItem("selectedAudiences")) || [];
  const uploadedVideoUrl = analysisResult?.video_url || localStorage.getItem("uploadedVideoUrl");

  const totalScore = analysisResult?.total_score !== undefined ? Math.round(Number(analysisResult.total_score)) : 83;

  const postureScore = analysisResult?.posture?.score || 0;
  const postureFeedback = analysisResult?.posture?.feedback || "발표 자세 분석 결과입니다.";
  const videoDashboard = analysisResult?.posture?.video_dashboard || null;

  const videoMetrics = videoDashboard?.metrics || [
    {
      key: "head",
      label: "고개 방향",
      score: analysisResult?.posture?.head_pose?.head_score || 0,
      feedback: analysisResult?.posture?.head_pose?.head_feedback || "",
    },
    {
      key: "emotion",
      label: "표정",
      score: analysisResult?.posture?.emotion?.emotion_score || 0,
      feedback: analysisResult?.posture?.emotion?.emotion_feedback || "",
    },
    {
      key: "gaze",
      label: "시선",
      score: analysisResult?.posture?.gaze?.gaze_score || 0,
      feedback: analysisResult?.posture?.gaze?.gaze_feedback || "",
    },
    {
      key: "gesture",
      label: "손동작",
      score: analysisResult?.posture?.gesture?.gesture_score || 0,
      feedback: analysisResult?.posture?.gesture?.gesture_feedback || "",
    },
  ];

  const videoTimeline = videoDashboard?.timeline || [];

  useEffect(() => {
    const fileId = analysisResult?.voice?.file_id;
    if (!fileId) return;

    // 이미 summary가 있으면 폴링 불필요
    if (analysisResult?.voice?.summary) {
      setVoiceDetailResult(analysisResult.voice);
      return;
    }

    const fetchVoiceDetail = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/result/${fileId}`);
        const data = await response.json();

        if (data.status === "processing") return;
        if (data.success) {
          setVoiceDetailResult(data);
          clearInterval(timer);
        }
      } catch (error) {
        console.error("음성 상세 분석 조회 실패:", error);
      }
    };

    fetchVoiceDetail();
    const timer = setInterval(fetchVoiceDetail, 3000);
    return () => clearInterval(timer);
  }, []);

  const voiceData = voiceDetailResult || analysisResult?.voice || {};
  const voiceSummary = voiceData.summary || {};
  const voiceHabits = voiceData.speech_habits || {};
  const voiceTimeline = voiceData.timeline_events || {};

  const voiceScore = voiceSummary.vibrancy_score || voiceData.score || 0;
  const speedWpm = voiceSummary.wpm || voiceData.speed_wpm || 0;
  const fillerCount = voiceHabits.filler_count || voiceData.filler_count || 0;
  const voiceFeedback = voiceSummary.feedback || voiceData.feedback || "음성 분석 결과입니다.";

  const voiceScript = analysisResult?.script?.full_script || "";
  const voiceSegments = voiceData.segments || [];

  const contentScore = analysisResult?.script?.score !== undefined ? analysisResult.script.score : 83;
  const scriptSummary = analysisResult?.script?.summary || "발표 내용 요약 결과입니다.";
  const scriptText = analysisResult?.script?.full_script || "스크립트 결과가 없습니다.";
  const generalQuestions = analysisResult?.script?.general_questions || [];
  const personaQuestions = analysisResult?.script?.persona_questions || analysisResult?.script?.questions || [];

  const contentFeedback = analysisResult?.script?.content_feedback || {};
  const strengthItems = contentFeedback.strength?.length > 0
    ? contentFeedback.strength
    : ["발표 흐름이 자연스럽습니다", "청중과의 시선 처리가 안정적입니다", "핵심 내용을 잘 전달하고 있습니다"];
  const improvementItems = contentFeedback.improvement?.length > 0
    ? contentFeedback.improvement
    : ["필러워드 사용을 줄여보세요", "답변 시 근거를 조금 더 보강해보세요", "핵심 키워드를 조금 더 강조해보세요"];

  const PERSONA_LABEL = {
  hr_manager: "인사담당자",
  tech_developer: "현직 개발자",
  executive: "임원진",
  academic_professor: "연구 중심 교수",
  vc_investor: "창업 투자자(VC)",
  product_marketer: "프로덕트 마케터",
  peer_evaluator: "동료 평가자",
  sharp_critic: "송곳형 평가위원",
  distracted_troll: "고난도 질문위원",
  conservative_elder: "보수적 꼰대위원",
};

  const audienceQuestions = personaQuestions.map((q) => ({
    audience: PERSONA_LABEL[q.persona_type] || q.persona_type,
    question: q.question,
    intent: q.intent || "질문 의도를 분석 중입니다."
  }));

  return (
    <div style={{ minHeight: "100vh", background: "#F8FCFA", color: "#2F3E46" }}>
      <Header />

      <main style={{ maxWidth: "1180px", margin: "0 auto", padding: isMobile ? "24px 16px 60px" : "50px 60px 100px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontSize: isMobile ? "26px" : "42px", fontWeight: "900", color: "#2D3A3A", marginBottom: "10px" }}>
            AI 발표 코칭 결과
          </h2>
          <p style={{ color: "#6B7C79", fontSize: isMobile ? "14px" : "18px" }}>
            {scenario.title} · {new Date().toLocaleDateString()}
          </p>
        </div>

        <section
          style={{
            background: "linear-gradient(135deg, #6BB5A6, #94CDD8)",
            color: "white",
            borderRadius: "32px",
            padding: isMobile ? "28px 20px" : "42px",
            textAlign: "center",
            boxShadow: "0 16px 36px rgba(107,181,166,0.28)",
            marginBottom: "28px",
          }}
        >
          <p style={{ fontWeight: "800", marginBottom: "12px", fontSize: isMobile ? "15px" : "18px" }}>
            종합 점수
          </p>
          <h1 style={{ fontSize: isMobile ? "56px" : "78px", fontWeight: "900", marginBottom: "18px" }}>
            {totalScore}
          </h1>
          <div
            style={{
              height: "12px",
              background: "rgba(255,255,255,0.32)",
              borderRadius: "999px",
              overflow: "hidden",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                width: `${totalScore}%`,
                height: "100%",
                background: "white",
                borderRadius: "999px",
              }}
            />
          </div>
          <strong style={{ fontSize: "18px" }}>발표 분석이 완료되었습니다 🎉</strong>
        </section>

        <section style={cardStyle}>
          <h3 style={sectionTitle}>
            <Video size={28} color="#6BB5A6" />
            발표 영상
          </h3>

          {uploadedVideoUrl ? (
            <video
              ref={videoRef}
              src={uploadedVideoUrl}
              controls
              style={{
                width: "100%",
                borderRadius: "24px",
                maxHeight: "520px",
                background: "black",
                objectFit: "contain",
              }}
            />
          ) : (
            <div
              style={{
                background: "#F8FCFA",
                borderRadius: "22px",
                padding: "46px",
                textAlign: "center",
                color: "#6B7C79",
              }}
            >
              영상 데이터를 불러올 수 없습니다.
            </div>
          )}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: "16px", marginBottom: "28px" }}>
          <SummaryCard
            icon={<CheckCircle size={26} color="#6BB5A6" />}
            title="강점"
            items={strengthItems}
          />
          <SummaryCard
            icon={<AlertCircle size={26} color="#9BC870" />}
            title="개선사항"
            items={improvementItems}
          />
        </section>

        {isMobile ? (
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            {[
              { key: "video", icon: <Eye size={16} color={selectedAnalysis === "video" ? "white" : "#6BB5A6"} />, label: "영상 분석" },
              { key: "voice", icon: <Volume2 size={16} color={selectedAnalysis === "voice" ? "white" : "#6BB5A6"} />, label: "음성 분석" },
              { key: "content", icon: <Brain size={16} color={selectedAnalysis === "content" ? "white" : "#6BB5A6"} />, label: "내용 분석" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedAnalysis(tab.key)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px",
                  padding: "10px 0",
                  borderRadius: "999px",
                  background: selectedAnalysis === tab.key ? "#6BB5A6" : "white",
                  color: selectedAnalysis === tab.key ? "white" : "#6BB5A6",
                  fontSize: "13px",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: selectedAnalysis === tab.key
                    ? "0 4px 12px rgba(107,181,166,0.35)"
                    : "0 2px 8px rgba(0,0,0,0.06)",
                  border: selectedAnalysis === tab.key ? "none" : "1.5px solid #D4EDEA",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "28px" }}>
            <AnalysisCard
              active={selectedAnalysis === "video"}
              icon={<Eye size={28} color="#6BB5A6" />}
              title="영상 분석"
              desc="자세, 시선, 발표 태도 분석"
              onClick={() => setSelectedAnalysis("video")}
            />
            <AnalysisCard
              active={selectedAnalysis === "voice"}
              icon={<Volume2 size={28} color="#6BB5A6" />}
              title="음성 분석"
              desc={`말속도 ${speedWpm} WPM · 필러워드 ${fillerCount}회`}
              onClick={() => setSelectedAnalysis("voice")}
            />
            <AnalysisCard
              active={selectedAnalysis === "content"}
              icon={<Brain size={28} color="#6BB5A6" />}
              title="내용 분석"
              desc="스크립트, 구성, 논리성 분석"
              onClick={() => setSelectedAnalysis("content")}
            />
          </section>
        )}

        {selectedAnalysis === "video" && (
          <VideoDetail
            score={postureScore}
            feedback={postureFeedback}
            metrics={videoMetrics}
            timeline={videoTimeline}
          />
        )}

        {selectedAnalysis === "voice" && (
          <VoiceDetail
            score={voiceScore}
            videoRef={videoRef}
            speedWpm={speedWpm}
            fillerCount={fillerCount}
            feedback={voiceFeedback}
            summary={voiceSummary}
            habits={voiceHabits}
            timeline={voiceTimeline}
            scriptText={voiceScript}
            fillerOccurrences={voiceHabits.filler_occurrences || []}
          />
        )}

        {selectedAnalysis === "content" && (
          <ContentDetail
            score={contentScore}
            summary={scriptSummary}
            generalQuestions={generalQuestions}
            audienceQuestions={audienceQuestions}
            scriptText={scriptText}
            weaknessItems={contentFeedback.weakness || []}
            segments={voiceSegments}
            videoRef={videoRef}
          />
        )}

        <div style={{ marginTop: "34px", display: "flex", gap: "16px" }}>
          <button onClick={() => navigate("/practice-mode")} style={primaryButton}>
            <RotateCcw size={20} style={{ verticalAlign: "middle", marginRight: "8px" }} />
            다시 연습하기
          </button>
          <button onClick={() => navigate("/")} style={secondaryButton}>
            홈으로 이동
          </button>
        </div>
      </main>
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

export default DashboardPage;
