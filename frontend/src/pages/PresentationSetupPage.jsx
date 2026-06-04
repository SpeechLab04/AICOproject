import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const PURPOSE_OPTIONS = [
  { id: "class", label: "수업 발표" },
  { id: "club", label: "동아리" },
  { id: "etc", label: "기타" },
];

const TIME_OPTIONS = [3, 5, 7, 10];

function PresentationSetupPage() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;
  const fileInputRef = useRef(null);
  const scriptFileInputRef = useRef(null);

  const [topic, setTopic] = useState("");
  const [purpose, setPurpose] = useState("");
  const [customPurpose, setCustomPurpose] = useState("");
  const [duration, setDuration] = useState(null);
  const [file, setFile] = useState(null);
  const [materialMode, setMaterialMode] = useState("upload");
  const [script, setScript] = useState("");
  const [scriptFile, setScriptFile] = useState(null);
  const [scriptMode, setScriptMode] = useState("upload");

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const handleScriptFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) setScriptFile(selected);
  };

  const handleNext = () => {
    if (!duration) {
      alert("발표 시간을 선택해주세요.");
      return;
    }

    const setup = {
      topic,
      purpose: purpose === "etc" ? customPurpose || "기타" : purpose,
      duration,
      fileName: file ? file.name : null,
      material: materialMode === "text" ? script : "",
      scriptText: scriptMode === "text" ? script : "",
      scriptFileName: scriptFile ? scriptFile.name : null,
    };
    localStorage.setItem("presentationSetup", JSON.stringify(setup));
    navigate("/audience");
  };

  const labelStyle = {
    fontSize: isMobile ? "15px" : "17px",
    fontWeight: "800",
    color: "#2D3A3A",
    marginBottom: "10px",
    display: "block",
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "16px",
    border: "2px solid #E0EDEA",
    fontSize: isMobile ? "15px" : "16px",
    color: "#2D3A3A",
    background: "white",
    outline: "none",
    boxSizing: "border-box",
    transition: "border 0.15s",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FCFA", color: "#2F3E46" }}>
      <Header showBack />

      <main
        style={{
          padding: isMobile ? "36px 22px 100px" : "60px 60px 100px",
          maxWidth: "780px",
          margin: "0 auto",
        }}
      >
        {/* 상단 타이틀 */}
        <div style={{ textAlign: "center", marginBottom: isMobile ? "40px" : "56px" }}>
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
            발표 설정
          </div>
          <h2
            style={{
              fontSize: isMobile ? "30px" : "46px",
              color: "#2D3A3A",
              fontWeight: "900",
              marginBottom: "14px",
              lineHeight: "1.2",
            }}
          >
            발표 정보를 입력해주세요
          </h2>
          <p style={{ color: "#58706D", fontSize: isMobile ? "15px" : "18px", lineHeight: "1.7" }}>
            입력하신 내용을 바탕으로 AI가 더 정확하게 평가합니다.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* 발표 주제 */}
          <div>
            <label style={labelStyle}>
              발표 주제
            </label>
            <input
              type="text"
              placeholder="예) 기후 변화와 탄소 중립 전략"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={inputStyle}
              onFocus={(e) => (e.target.style.border = "2px solid #6BB5A6")}
              onBlur={(e) => (e.target.style.border = "2px solid #E0EDEA")}
            />
          </div>

          {/* 발표 목적 */}
          <div>
            <label style={labelStyle}>발표 목적</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                gap: "12px",
              }}
            >
              {PURPOSE_OPTIONS.map((opt) => {
                const selected = purpose === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setPurpose(selected ? "" : opt.id)}
                    style={{
                      padding: "14px 0",
                      borderRadius: "16px",
                      border: `2px solid ${selected ? "#6BB5A6" : "#E0EDEA"}`,
                      background: selected ? "#E5F4EF" : "white",
                      color: selected ? "#4D8F82" : "#5C706C",
                      fontWeight: "800",
                      fontSize: isMobile ? "14px" : "15px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {purpose === "etc" && (
              <input
                type="text"
                placeholder="발표 목적을 직접 입력하세요"
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
                style={{ ...inputStyle, marginTop: "12px" }}
                onFocus={(e) => (e.target.style.border = "2px solid #6BB5A6")}
                onBlur={(e) => (e.target.style.border = "2px solid #E0EDEA")}
              />
            )}
          </div>

          {/* 발표 시간 */}
          <div>
            <label style={labelStyle}>
              발표 시간 <span style={{ color: "#D96B4C" }}>*</span>
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "12px",
              }}
            >
              {TIME_OPTIONS.map((min) => {
                const selected = duration === min;
                return (
                  <button
                    key={min}
                    onClick={() => setDuration(min)}
                    style={{
                      padding: "18px 0",
                      borderRadius: "16px",
                      border: `2px solid ${selected ? "#6BB5A6" : "#E0EDEA"}`,
                      background: selected ? "#E5F4EF" : "white",
                      color: selected ? "#4D8F82" : "#5C706C",
                      fontWeight: "900",
                      fontSize: isMobile ? "14px" : "15px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {min}분
                  </button>
                );
              })}
            </div>
          </div>

          {/* 발표 자료 파일 */}
          <div>
            <label style={labelStyle}>발표 자료</label>
            <p style={{ color: "#58706D", fontSize: "14px", marginBottom: "12px", marginTop: "-6px" }}>
              사업계획서, 채용공고 등 발표 기준 자료를 업로드하세요.
            </p>
            {/* 탭 */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              {[{ id: "upload", label: "파일 업로드" }, { id: "text", label: "직접 입력" }].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMaterialMode(tab.id)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "12px",
                    border: `2px solid ${materialMode === tab.id ? "#6BB5A6" : "#E0EDEA"}`,
                    background: materialMode === tab.id ? "#E5F4EF" : "white",
                    color: materialMode === tab.id ? "#4D8F82" : "#5C706C",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {materialMode === "upload" ? (
              <div
                onClick={() => fileInputRef.current.click()}
                style={{
                  border: "2px dashed #B2D8CC",
                  borderRadius: "20px",
                  padding: "32px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: file ? "#E5F4EF" : "white",
                  transition: "all 0.15s",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                {file ? (
                  <div>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>📄</div>
                    <p style={{ color: "#4D8F82", fontWeight: "800", fontSize: "15px" }}>
                      {file.name}
                    </p>
                    <p
                      style={{ color: "#6BB5A6", fontSize: "13px", marginTop: "6px", cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    >
                      파일 제거
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>📎</div>
                    <p style={{ color: "#58706D", fontSize: isMobile ? "14px" : "16px" }}>
                      PDF, PPT, PPTX 파일을 업로드하세요
                    </p>
                    <p style={{ color: "#94B5AE", fontSize: "13px", marginTop: "6px" }}>
                      클릭하여 파일 선택
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                placeholder="발표 자료 내용을 직접 입력하세요."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={6}
                style={{ ...inputStyle, resize: "vertical", lineHeight: "1.7" }}
                onFocus={(e) => (e.target.style.border = "2px solid #6BB5A6")}
                onBlur={(e) => (e.target.style.border = "2px solid #E0EDEA")}
              />
            )}
          </div>

          {/* 발표 대본 */}
          <div>
            <label style={labelStyle}>발표 대본</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              {[{ id: "upload", label: "파일 업로드" }, { id: "text", label: "직접 입력" }].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setScriptMode(tab.id)}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "12px",
                    border: `2px solid ${scriptMode === tab.id ? "#6BB5A6" : "#E0EDEA"}`,
                    background: scriptMode === tab.id ? "#E5F4EF" : "white",
                    color: scriptMode === tab.id ? "#4D8F82" : "#5C706C",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {scriptMode === "upload" ? (
              <div
                onClick={() => scriptFileInputRef.current.click()}
                style={{
                  border: "2px dashed #B2D8CC",
                  borderRadius: "20px",
                  padding: "32px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: scriptFile ? "#E5F4EF" : "white",
                  transition: "all 0.15s",
                }}
              >
                <input
                  ref={scriptFileInputRef}
                  type="file"
                  accept=".txt,.docx"
                  onChange={handleScriptFileChange}
                  style={{ display: "none" }}
                />
                {scriptFile ? (
                  <div>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>📝</div>
                    <p style={{ color: "#4D8F82", fontWeight: "800", fontSize: "15px" }}>
                      {scriptFile.name}
                    </p>
                    <p
                      style={{ color: "#6BB5A6", fontSize: "13px", marginTop: "6px", cursor: "pointer" }}
                      onClick={(e) => { e.stopPropagation(); setScriptFile(null); }}
                    >
                      파일 제거
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>📎</div>
                    <p style={{ color: "#58706D", fontSize: isMobile ? "14px" : "16px" }}>
                      TXT, DOCX 파일을 업로드하세요
                    </p>
                    <p style={{ color: "#94B5AE", fontSize: "13px", marginTop: "6px" }}>
                      클릭하여 파일 선택
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                placeholder="발표 대본을 직접 입력하세요."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={6}
                style={{ ...inputStyle, resize: "vertical", lineHeight: "1.7" }}
                onFocus={(e) => (e.target.style.border = "2px solid #6BB5A6")}
                onBlur={(e) => (e.target.style.border = "2px solid #E0EDEA")}
              />
            )}
          </div>

        </div>

        {/* 다음 버튼 */}
        <div style={{ marginTop: "46px", display: "flex", justifyContent: "center" }}>
          <button
            onClick={handleNext}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = "0 14px 28px rgba(107,181,166,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(107,181,166,0.25)";
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

export default PresentationSetupPage;
