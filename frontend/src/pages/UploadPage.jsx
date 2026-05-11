import FeatureCard from '../components/FeatureCard'
import StepItem from '../components/StepItem'

function UploadPage({
  fileInputRef,
  selectedFile,
  previewURL,
  loading,
  message,
  onFileChange,
  onButtonClick,
  onUpload,
  userEmail,
  isLoggedIn,
  onLoginClick,
  onLogout
}) {
  return (
    
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8faff 0%, #eff4ff 100%)',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '16px',
          boxSizing: 'border-box'
        }}
      >
        <div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px'
  }}
>
  <div>
    <p
      style={{
        margin: 0,
        fontSize: '14px',
        color: '#6b7280',
        fontWeight: 'bold',
        letterSpacing: '0.06em'
      }}
    >
      AICO
    </p>
  </div>

  {isLoggedIn ? (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap'
      }}
    >
      <span
        style={{
          color: '#374151',
          fontSize: '14px'
        }}
      >
        {userEmail}
      </span>
      <button
        onClick={onLogout}
        style={{
          padding: '10px 14px',
          borderRadius: '12px',
          border: '1px solid #d1d5db',
          backgroundColor: '#ffffff',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        로그아웃
      </button>
    </div>
  ) : (
    <button
      onClick={onLoginClick}
      style={{
        padding: '10px 16px',
        borderRadius: '12px',
        border: 'none',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      로그인
    </button>
  )}
</div>
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '22px',
            marginBottom: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 'bold',
              color: '#111827',
              lineHeight: '1.2'
            }}
          >
            AI 발표 코치
          </h1>
          <p
            style={{
              margin: '10px 0 0 0',
              color: '#4b5563',
              fontSize: 'clamp(15px, 2vw, 20px)',
              lineHeight: '1.6'
            }}
          >
            언제 어디서든 발표 실력을 향상시켜보세요
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: '16px',
            alignItems: 'start'
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #1d4ed8 100%)',
              borderRadius: '22px',
              padding: '24px',
              color: '#ffffff',
              boxShadow: '0 10px 24px rgba(37, 99, 235, 0.22)',
              boxSizing: 'border-box'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 'clamp(22px, 3vw, 30px)',
                    fontWeight: 'bold',
                    lineHeight: '1.35'
                  }}
                >
                  발표 연습 시작하기
                </h2>
                <p
                  style={{
                    margin: '12px 0 0 0',
                    fontSize: 'clamp(14px, 1.8vw, 18px)',
                    lineHeight: '1.7',
                    color: 'rgba(255,255,255,0.92)'
                  }}
                >
                  AI가 당신의 발표를 분석하고 맞춤형 피드백을 제공합니다
                </p>
              </div>

              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '34px',
                  flexShrink: 0
                }}
              >
                ⚡
              </div>
            </div>

            <input
              type="file"
              accept="video/*"
              ref={fileInputRef}
              onChange={onFileChange}
              style={{ display: 'none' }}
            />

            <button
              onClick={onButtonClick}
              style={{
                width: '100%',
                marginTop: '20px',
                backgroundColor: '#ffffff',
                color: '#2563eb',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 16px',
                fontSize: 'clamp(15px, 1.8vw, 18px)',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🎥 영상 업로드하기
            </button>

            {selectedFile && (
              <p
                style={{
                  marginTop: '14px',
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.95)',
                  lineHeight: '1.6',
                  wordBreak: 'break-all'
                }}
              >
                선택한 파일: <strong>{selectedFile.name}</strong>
              </p>
            )}

            {previewURL && (
              <div style={{ marginTop: '16px' }}>
                <video
                  width="100%"
                  controls
                  style={{
                    borderRadius: '14px',
                    backgroundColor: '#000',
                    display: 'block',
                    maxHeight: '340px',
                    objectFit: 'contain'
                  }}
                >
                  <source src={previewURL} type="video/mp4" />
                </video>

                <button
                  onClick={onUpload}
                  disabled={loading}
                  style={{
                    width: '100%',
                    marginTop: '14px',
                    backgroundColor: 'transparent',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.65)',
                    borderRadius: '14px',
                    padding: '13px 16px',
                    fontSize: 'clamp(15px, 1.8vw, 17px)',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? '분석 준비 중...' : '분석 시작하기'}
                </button>
              </div>
            )}

            {message && (
              <p
                style={{
                  marginTop: '14px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  fontSize: '14px'
                }}
              >
                {message}
              </p>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gap: '16px',
              minWidth: 0
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '22px',
                padding: '20px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
                boxSizing: 'border-box'
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(18px, 2vw, 22px)',
                  fontWeight: 'bold',
                  marginTop: 0,
                  marginBottom: '14px',
                  color: '#111827',
                  textAlign: 'center'
                }}
              >
                주요 기능
              </h2>

              <div style={{ display: 'grid', gap: '12px' }}>
                <FeatureCard
                  icon="🎯"
                  title="자세 분석"
                  description="고개 각도와 얼굴 방향을 분석하여 청중과의 아이컨택을 개선합니다"
                  bgColor="#dbeafe"
                />
                <FeatureCard
                  icon="📈"
                  title="음성 분석"
                  description="말 속도, 필러어 사용 빈도를 측정하여 발표 습관을 교정합니다"
                  bgColor="#dcfce7"
                />
                <FeatureCard
                  icon="💬"
                  title="AI 피드백"
                  description="발표 내용을 요약하고 예상 질문을 생성하여 완벽한 준비를 돕습니다"
                  bgColor="#f3e8ff"
                />
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '22px',
                padding: '20px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
                boxSizing: 'border-box'
              }}
            >
              <h2
                style={{
                  fontSize: 'clamp(18px, 2vw, 22px)',
                  fontWeight: 'bold',
                  marginTop: 0,
                  marginBottom: '14px',
                  color: '#111827',
                  textAlign: 'center'
                }}
              >
                사용 방법
              </h2>

              <div style={{ display: 'grid', gap: '12px' }}>
                <StepItem
                  number="1"
                  title="영상 업로드"
                  description="발표 영상을 업로드하고 분석을 시작합니다"
                />
                <StepItem
                  number="2"
                  title="AI 분석 진행"
                  description="자세, 음성, 스크립트 내용을 종합적으로 분석합니다"
                />
                <StepItem
                  number="3"
                  title="결과 확인"
                  description="점수와 피드백, 예상 질문을 확인하고 발표를 개선합니다"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadPage