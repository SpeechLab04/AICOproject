import { useEffect } from 'react'

function ResultPage({ result, activeSection, setActiveSection, goToUpload }) {
  useEffect(() => {
    if (!activeSection) {
      setActiveSection('posture')
    }
  }, [activeSection, setActiveSection])

  if (!result) return null

  const questions = result?.script?.questions ?? []
  const summary = result?.script?.summary ?? '요약 내용이 없습니다.'
  const strength = result?.script?.strength ?? '장점 정보가 없습니다.'
  const weakness = result?.script?.weakness ?? '보완점 정보가 없습니다.'
  const improvement = result?.script?.improvement ?? '개선점 정보가 없습니다.'
  const scriptText =
    result?.script?.original_text ??
    result?.script?.full_text ??
    result?.script?.text ??
    '발표 원문이 없습니다.'

  const tabButtonStyle = (isActive) => ({
    flex: 1,
    border: 'none',
    borderRadius: '999px',
    padding: '12px 10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    backgroundColor: isActive ? '#ffffff' : 'transparent',
    color: '#111827',
    boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
    transition: 'all 0.2s ease'
  })

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
          maxWidth: '820px',
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
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(28px, 4vw, 38px)',
                color: '#111827'
              }}
            >
              AICO
            </h1>
            <p style={{ color: '#6b7280', margin: '8px 0 0 0' }}>AI 발표 코칭 서비스</p>
          </div>

          <button
            onClick={goToUpload}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              fontWeight: 'bold'
            }}
          >
            ← 업로드 화면으로
          </button>
        </div>

        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '24px',
            padding: '20px',
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
          }}
        >
          <h2
            style={{
              textAlign: 'center',
              marginTop: 0,
              marginBottom: '20px',
              fontSize: 'clamp(24px, 4vw, 32px)'
            }}
          >
            발표 분석 대시보드
          </h2>

          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '18px',
              padding: '20px',
              backgroundColor: '#f8f9ff',
              marginBottom: '22px'
            }}
          >
            <p style={{ fontSize: '16px', marginBottom: '10px' }}>
              <strong>전체 발표 점수</strong>
            </p>

            <p
              style={{
                fontSize: 'clamp(30px, 5vw, 42px)',
                fontWeight: 'bold',
                margin: '0 0 12px 0',
                color: '#4b5563'
              }}
            >
              {result.total_score}점
            </p>

            <p style={{ margin: 0, color: '#374151', lineHeight: '1.7' }}>
              <strong>총평:</strong> {result.summary}
            </p>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '20px' }}>발표 영상</h3>
            <video
              width="100%"
              controls
              style={{
                width: '100%',
                maxWidth: '100%',
                borderRadius: '16px',
                display: 'block',
                margin: '0 auto',
                backgroundColor: '#000',
                maxHeight: '420px',
                objectFit: 'contain'
              }}
            >
              <source src={result.video_url} type="video/mp4" />
            </video>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              backgroundColor: '#f3f4f6',
              borderRadius: '999px',
              padding: '6px',
              marginBottom: '20px'
            }}
          >
            <button
              onClick={() => setActiveSection('posture')}
              style={tabButtonStyle(activeSection === 'posture')}
            >
              자세
            </button>

            <button
              onClick={() => setActiveSection('voice')}
              style={tabButtonStyle(activeSection === 'voice')}
            >
              음성
            </button>

            <button
              onClick={() => setActiveSection('script')}
              style={tabButtonStyle(activeSection === 'script')}
            >
              내용
            </button>
          </div>

          {activeSection === 'posture' && (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                padding: '22px'
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: '18px' }}>🎯 발표 자세 분석</h2>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #eef2f7',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '16px'
                }}
              >
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>자세 점수</p>
                <p
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#4b5563'
                  }}
                >
                  {result.posture.score}점
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #eef2f7',
                  borderRadius: '14px',
                  padding: '16px'
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: '12px' }}>자세 피드백</h3>
                <p style={{ margin: 0, lineHeight: '1.9', color: '#374151' }}>
                  {result.posture.feedback}
                </p>
              </div>
            </div>
          )}

          {activeSection === 'voice' && (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                padding: '22px'
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: '18px' }}>🎤 음성 분석</h2>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px'
                }}
              >
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #eef2f7',
                    borderRadius: '14px',
                    padding: '16px'
                  }}
                >
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>음성 점수</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '30px', fontWeight: 'bold', color: '#4b5563' }}>
                    {result.voice.score}점
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #eef2f7',
                    borderRadius: '14px',
                    padding: '16px'
                  }}
                >
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>말속도</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '30px', fontWeight: 'bold', color: '#4b5563' }}>
                    {result.voice.speed_wpm}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '13px' }}>WPM</p>
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #eef2f7',
                    borderRadius: '14px',
                    padding: '16px'
                  }}
                >
                  <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>필러어</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '30px', fontWeight: 'bold', color: '#4b5563' }}>
                    {result.voice.filler_count}회
                  </p>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #eef2f7',
                  borderRadius: '14px',
                  padding: '16px'
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: '12px' }}>음성 피드백</h3>
                <p style={{ margin: 0, lineHeight: '1.9', color: '#374151' }}>
                  {result.voice.feedback}
                </p>
              </div>
            </div>
          )}

          {activeSection === 'script' && (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                padding: '22px'
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: '18px' }}>💬 발표 내용 분석</h2>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #eef2f7',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '16px'
                }}
              >
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>내용 점수</p>
                <p
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#4b5563'
                  }}
                >
                  {result.script.score}점
                </p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: '16px'
                }}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #eef2f7',
                    borderRadius: '14px',
                    padding: '16px'
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: '12px' }}>발표 내용 요약</h3>
                  <p style={{ margin: 0, lineHeight: '1.9', color: '#374151' }}>{summary}</p>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #eef2f7',
                    borderRadius: '14px',
                    padding: '16px'
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: '12px' }}>핵심 포인트</h3>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#374151' }}>
                    <li style={{ marginBottom: '10px', lineHeight: '1.8' }}>{strength}</li>
                    <li style={{ marginBottom: '10px', lineHeight: '1.8' }}>{weakness}</li>
                    <li style={{ lineHeight: '1.8' }}>{improvement}</li>
                  </ul>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #eef2f7',
                    borderRadius: '14px',
                    padding: '16px'
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: '12px' }}>예상 질문</h3>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    {questions.length > 0 ? (
                      questions.map((question, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: '12px',
                            padding: '14px 16px',
                            border: '1px solid #eef2f7'
                          }}
                        >
                          <strong style={{ color: '#4f46e5' }}>Q{index + 1}.</strong>{' '}
                          <span style={{ color: '#374151', lineHeight: '1.7' }}>
                            {question}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p style={{ margin: 0, color: '#374151' }}>예상 질문이 없습니다.</p>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #eef2f7',
                    borderRadius: '14px',
                    padding: '16px'
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: '12px' }}>발표 원문</h3>

                  <div
                    style={{
                      maxHeight: '260px',
                      overflowY: 'auto',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      padding: '16px',
                      lineHeight: '1.9',
                      color: '#374151',
                      border: '1px solid #eef2f7',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {scriptText}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultPage