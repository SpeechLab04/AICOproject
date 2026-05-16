import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileVideo, CheckCircle } from "lucide-react";
import Header from "../components/Header";

function UploadPage() {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < 768;

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://aico-backend-a7bu.onrender.com";
    

  const scenario =
    JSON.parse(localStorage.getItem("selectedScenario")) || {
      title: "학교 발표",
    };

  const audiences = JSON.parse(localStorage.getItem("selectedAudiences")) || [];

  const audienceText =
    audiences.length > 0
      ? audiences.map((item) => item.name).join(", ")
      : "선택 없음";

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("동영상 파일만 업로드할 수 있습니다.");
      return;
    }

    const url = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(url);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert("분석할 영상을 먼저 선택해주세요.");
      return;
    }

    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    const selectedAudiences =
      JSON.parse(localStorage.getItem("selectedAudiences")) || [];

    const selectedPersonas = selectedAudiences.map((item) => item.id);

    formData.append("selected_personas", JSON.stringify(selectedPersonas));

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("분석 실패");
      }

      const result = await response.json();

      localStorage.setItem("analysisResult", JSON.stringify(result));
      localStorage.setItem("uploadedVideoName", selectedFile.name);

      if (result.video_url) {
        localStorage.setItem("uploadedVideoUrl", result.video_url);
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("분석 오류:", error);
      alert("분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
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
          maxWidth: "980px",
          margin: "0 auto",
          padding: isMobile ? "36px 22px 80px" : "54px 60px 100px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: isMobile ? "36px" : "50px",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#C8E4D6",
              color: "#4D8F82",
              padding: isMobile ? "8px 16px" : "10px 22px",
              borderRadius: "999px",
              fontWeight: "800",
              marginBottom: "22px",
              fontSize: isMobile ? "13px" : "16px",
            }}
          >
            영상 업로드
          </div>

          <h2
            style={{
              fontSize: isMobile ? "36px" : "54px",
              color: "#2D3A3A",
              fontWeight: "900",
              marginBottom: "16px",
              lineHeight: "1.2",
            }}
          >
            발표 영상을 업로드하세요
          </h2>

          <p
            style={{
              color: "#58706D",
              fontSize: isMobile ? "16px" : "20px",
              lineHeight: "1.7",
              wordBreak: "keep-all",
            }}
          >
            녹화된 발표 영상을 업로드하면 자세, 음성, 발표 내용을 분석합니다.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
              justifyContent: "center",
              marginTop: "26px",
              background: "white",
              padding: isMobile ? "12px 18px" : "14px 28px",
              borderRadius: "999px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              color: "#58706D",
              fontSize: isMobile ? "14px" : "16px",
            }}
          >
            <span>
              시나리오:{" "}
              <strong style={{ color: "#2D3A3A" }}>{scenario.title}</strong>
            </span>
            <span style={{ color: "#C8E4D6" }}>|</span>
            <span>
              청중:{" "}
              <strong style={{ color: "#2D3A3A" }}>{audienceText}</strong>
            </span>
          </div>
        </div>

        <section
          style={{
            background: "white",
            borderRadius: "32px",
            padding: isMobile ? "32px 24px" : "48px",
            boxShadow: "0 14px 38px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <label
            style={{
              display: "block",
              border: "2px dashed #C8E4D6",
              borderRadius: "28px",
              padding: isMobile ? "42px 20px" : "60px 30px",
              background: "#F8FCFA",
              cursor: "pointer",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow =
                "0 14px 30px rgba(107,181,166,0.16)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <div
              style={{
                width: isMobile ? "82px" : "100px",
                height: isMobile ? "82px" : "100px",
                borderRadius: "50%",
                background: "#E5F4EF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <Upload size={isMobile ? 42 : 52} color="#6BB5A6" />
            </div>

            <h3
              style={{
                fontSize: isMobile ? "24px" : "30px",
                fontWeight: "900",
                marginBottom: "12px",
                color: "#2D3A3A",
              }}
            >
              동영상 파일 선택
            </h3>

            <p
              style={{
                color: "#5C706C",
                fontSize: isMobile ? "15px" : "17px",
                lineHeight: "1.7",
              }}
            >
              MP4, MOV 등 발표 영상 파일을 선택해주세요.
            </p>
          </label>

          {previewUrl && (
            <video
              src={previewUrl}
              controls
              style={{
                width: "100%",
                borderRadius: "24px",
                marginTop: "28px",
                maxHeight: isMobile ? "260px" : "420px",
                objectFit: "contain",
                background: "black",
                boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
              }}
            />
          )}

          {selectedFile && (
            <div
              style={{
                marginTop: "28px",
                background: "#E5F4EF",
                borderRadius: "22px",
                padding: isMobile ? "20px" : "24px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                textAlign: "left",
              }}
            >
              <FileVideo size={30} color="#6BB5A6" />
              <div style={{ flex: 1 }}>
                <strong
                  style={{
                    display: "block",
                    color: "#2D3A3A",
                    marginBottom: "4px",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedFile.name}
                </strong>
                <span style={{ color: "#5C706C", fontSize: "14px" }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <CheckCircle size={26} color="#6BB5A6" />
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            style={{
              width: "100%",
              marginTop: "30px",
              background: "#6BB5A6",
              color: "white",
              border: "none",
              padding: isMobile ? "16px" : "18px",
              borderRadius: "22px",
              fontSize: isMobile ? "17px" : "20px",
              fontWeight: "900",
              boxShadow: "0 8px 20px rgba(107,181,166,0.25)",
              cursor: isAnalyzing ? "not-allowed" : "pointer",
              transform: "translateY(0)",
              transition: "all 0.18s ease",
              opacity: selectedFile && !isAnalyzing ? 1 : 0.65,
            }}
            onMouseEnter={(e) => {
              if (!selectedFile || isAnalyzing) return;
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow =
                "0 14px 28px rgba(107,181,166,0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 20px rgba(107,181,166,0.25)";
            }}
          >
            {isAnalyzing ? "분석 중입니다..." : "분석 시작하기"}
          </button>
        </section>
      </main>
    </div>
  );
}

export default UploadPage;