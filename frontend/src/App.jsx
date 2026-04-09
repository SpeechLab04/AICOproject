import { useEffect, useRef, useState } from 'react'

function App() {
  const fileInputRef = useRef(null)

  const [page, setPage] = useState('upload') // upload | loading | result
  const [selectedFile, setSelectedFile] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [previewURL, setPreviewURL] = useState(null)
  const [activeSection, setActiveSection] = useState(null)
  const [currentTip, setCurrentTip] = useState('')
  const [progress, setProgress] = useState(0)

  const tips = [
    '발표 시작 전 첫 문장을 천천히 또렷하게 말해보세요.',
    '청중과 한 번씩 눈을 맞춘다는 느낌으로 시선을 분산해보세요.',
    '필러어를 줄이기 위해 문장 사이에 짧게 쉬어가도 괜찮습니다.',
    '핵심 키워드를 강조할 때는 말속도를 조금 늦춰보세요.',
    '손동작은 너무 크지 않게, 자연스럽게 사용하는 것이 좋습니다.',
    '외운 티를 내기보다 전달한다는 느낌으로 말하는 것이 더 중요합니다.'
  ]

  const getRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * tips.length)
    return tips[randomIndex]
  }

  useEffect(() => {
    let tipInterval
    let progressInterval

    if (page === 'loading') {
      setCurrentTip(getRandomTip())
      setProgress(0)

      tipInterval = setInterval(() => {
        setCurrentTip(getRandomTip())
      }, 2500)

      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return 90
          return prev + Math.floor(Math.random() * 8) + 2
        })
      }, 400)
    }

    return () => {
      if (tipInterval) clearInterval(tipInterval)
      if (progressInterval) clearInterval(progressInterval)
    }
  }, [page])

  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]

    if (file) {
      if (!file.type.startsWith('video/')) {
        alert('영상 파일만 업로드 가능합니다.')
        return
      }

      setSelectedFile(file)
      setPreviewURL(URL.createObjectURL(file))
      setMessage('')
      setResult(null)
      setActiveSection(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('파일을 먼저 선택하세요.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      setLoading(true)
      setMessage('')
      setResult(null)
      setActiveSection(null)
      setPage('loading')

      const uploadResponse = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        throw new Error('업로드 서버 응답 오류')
      }

      const uploadData = await uploadResponse.json()

      const tempScript =
        '이 발표는 AI 발표 코칭 서비스에 대한 설명입니다. 사용자는 영상을 업로드하고 자세, 음성, 스크립트 분석 결과를 받을 수 있습니다.'

      const feedbackResponse = await fetch(
        `http://127.0.0.1:8000/api/v1/ai/feedback?script=${encodeURIComponent(tempScript)}`,
        {
          method: 'POST'
        }
      )

      if (!feedbackResponse.ok) {
        throw new Error('AI 피드백 서버 응답 오류')
      }

      const feedbackData = await feedbackResponse.json()
      const llm = feedbackData.data

      const mergedResult = {
        ...uploadData,
        script: {
          ...uploadData.script,
          score: llm?.content_score ?? uploadData?.script?.score ?? 0,
          summary: llm?.summary ?? uploadData?.script?.summary ?? '',
          questions: llm?.expected_questions ?? uploadData?.script?.questions ?? [],
          strength: llm?.content_feedback?.strength ?? '',
          weakness: llm?.content_feedback?.weakness ?? '',
          improvement: llm?.content_feedback?.improvement ?? ''
        }
      }

      setProgress(100)
      setMessage('업로드 및 AI 분석 완료')
      setResult(mergedResult)

      setTimeout(() => {
        setPage('result')
      }, 400)
    } catch (error) {
      console.error('분석 실패:', error)
      setMessage(`분석 실패: ${error.message}`)
      setPage('upload')
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = {
    flex: '1',
    minWidth: '220px',
    border: '1px solid #ddd',
    borderRadius: '16px',
    padding: '20px',
    backgroundColor: '#fafafa',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  }

  if (page === 'upload') {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f3f4f6',
          fontFamily: 'Arial, sans-serif',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '430px',
            backgroundColor: '#f3f4f6',
            paddingBottom: '40px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              padding: '20px 20px 16px 20px',
              borderBottom: '1px solid #e5e7eb'
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#111827'
              }}
            >
              AI 발표 코치
            </h1>
            <p
              style={{
                margin: '10px 0 0 0',
                color: '#4b5563',
                fontSize: '20px',
                lineHeight: '1.5'
              }}
            >
              언제 어디서든 발표 실력을 향상시켜보세요
            </p>
          </div>

          <div style={{ padding: '18px 14px 0 14px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #1d4ed8 100%)',
                borderRadius: '22px',
                padding: '24px',
                color: '#ffffff',
                boxShadow: '0 10px 24px rgba(37, 99, 235, 0.28)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '22px',
                      fontWeight: 'bold',
                      lineHeight: '1.4'
                    }}
                  >
                    발표 연습 시작하기
                  </h2>
                  <p
                    style={{
                      margin: '14px 0 0 0',
                      fontSize: '18px',
                      lineHeight: '1.6',
                      color: 'rgba(255,255,255,0.92)'
                    }}
                  >
                    AI가 당신의 발표를 분석하고 맞춤형 피드백을 제공합니다
                  </p>
                </div>

                <div
                  style={{
                    width: '92px',
                    height: '92px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.16)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
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
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <button
                onClick={handleButtonClick}
                style={{
                  width: '100%',
                  marginTop: '22px',
                  backgroundColor: '#ffffff',
                  color: '#2563eb',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '15px 18px',
                  fontSize: '18px',
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
                    fontSize: '15px',
                    color: 'rgba(255,255,255,0.95)',
                    lineHeight: '1.5'
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
                      backgroundColor: '#000'
                    }}
                  >
                    <source src={previewURL} type="video/mp4" />
                  </video>

                  <button
                    onClick={handleUpload}
                    disabled={loading}
                    style={{
                      width: '100%',
                      marginTop: '14px',
                      backgroundColor: 'transparent',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.65)',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      fontSize: '17px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {loading ? '분석 준비 중...' : '분석 시작하기'}
                  </button>
                </div>
              )}
            </div>

            {message && (
              <p
                style={{
                  marginTop: '14px',
                  fontWeight: 'bold',
                  color: '#111827',
                  fontSize: '15px'
                }}
              >
                {message}
              </p>
            )}

            <div style={{ marginTop: '26px' }}>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '14px',
                  color: '#111827'
                }}
              >
                주요 기능
              </h2>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  padding: '16px',
                  marginBottom: '12px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#dbeafe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0
                  }}
                >
                  🎯
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#111827' }}>자세 분석</h3>
                  <p style={{ margin: '6px 0 0 0', color: '#4b5563', lineHeight: '1.5', fontSize: '15px' }}>
                    고개 각도와 얼굴 방향을 분석하여 청중과의 아이컨택을 개선합니다
                  </p>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  padding: '16px',
                  marginBottom: '12px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0
                  }}
                >
                  📈
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#111827' }}>음성 분석</h3>
                  <p style={{ margin: '6px 0 0 0', color: '#4b5563', lineHeight: '1.5', fontSize: '15px' }}>
                    말 속도, 필러어 사용 빈도를 측정하여 발표 습관을 교정합니다
                  </p>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  padding: '16px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#f3e8ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    flexShrink: 0
                  }}
                >
                  💬
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', color: '#111827' }}>AI 피드백</h3>
                  <p style={{ margin: '6px 0 0 0', color: '#4b5563', lineHeight: '1.5', fontSize: '15px' }}>
                    발표 내용을 요약하고 예상 질문을 생성하여 완벽한 준비를 돕습니다
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '28px' }}>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '14px',
                  color: '#111827'
                }}
              >
                사용 방법
              </h2>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '14px',
                  alignItems: 'flex-start'
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}
                >
                  1
                </div>
                <div>
                  <p style={{ margin: 0, color: '#111827', fontWeight: 'bold' }}>영상 업로드</p>
                  <p style={{ margin: '4px 0 0 0', color: '#4b5563', lineHeight: '1.5' }}>
                    발표 영상을 업로드하고 분석을 시작합니다
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '14px',
                  alignItems: 'flex-start'
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}
                >
                  2
                </div>
                <div>
                  <p style={{ margin: 0, color: '#111827', fontWeight: 'bold' }}>AI 분석 진행</p>
                  <p style={{ margin: '4px 0 0 0', color: '#4b5563', lineHeight: '1.5' }}>
                    자세, 음성, 스크립트 내용을 종합적으로 분석합니다
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}
              >
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}
                >
                  3
                </div>
                <div>
                  <p style={{ margin: 0, color: '#111827', fontWeight: 'bold' }}>결과 확인</p>
                  <p style={{ margin: '4px 0 0 0', color: '#4b5563', lineHeight: '1.5' }}>
                    점수와 피드백, 예상 질문을 확인하고 발표를 개선합니다
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (page === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9ff',
          fontFamily: 'Arial, sans-serif',
          padding: '24px'
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '700px',
            backgroundColor: '#fff',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}
        >
          <h1 style={{ marginBottom: '12px' }}>분석 중입니다... ⏳</h1>
          <p style={{ color: '#666', marginBottom: '28px' }}>
            발표 영상을 분석하고 있어요. 잠시만 기다려 주세요.
          </p>

          <div
            style={{
              margin: '0 auto 12px auto',
              width: '80%',
              height: '12px',
              backgroundColor: '#eee',
              borderRadius: '999px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#999',
                borderRadius: '999px',
                transition: 'width 0.35s ease'
              }}
            />
          </div>

          <p style={{ marginBottom: '30px', color: '#555', fontWeight: 'bold' }}>
            {progress}%
          </p>

          <div
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: '16px',
              padding: '24px',
              backgroundColor: '#fafafa'
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: '12px' }}>발표 팁</h3>
            <p style={{ margin: 0, fontSize: '18px', lineHeight: '1.7', color: '#444' }}>
              {currentTip}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '24px',
        textAlign: 'center',
        maxWidth: '1100px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif'
      }}
    >
      <h1 style={{ marginBottom: '8px' }}>AICO</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>AI 발표 코칭 서비스</p>

      <div style={{ marginBottom: '20px', textAlign: 'left' }}>
        <button
          onClick={() => setPage('upload')}
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ← 업로드 화면으로
        </button>
      </div>

      {result && (
        <div
          style={{
            textAlign: 'left',
            border: '1px solid #ddd',
            borderRadius: '16px',
            padding: '28px',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>발표 분석 대시보드</h2>

          <div
            style={{
              border: '1px solid #eee',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '28px',
              backgroundColor: '#f8f9ff'
            }}
          >
            <p style={{ fontSize: '18px', marginBottom: '12px' }}>
              <strong>전체 발표 점수</strong>
            </p>
            <p style={{ fontSize: '36px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
              {result.total_score}점
            </p>
            <p style={{ margin: 0, color: '#444', lineHeight: '1.6' }}>
              <strong>총평:</strong> {result.summary}
            </p>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ marginBottom: '12px' }}>발표 영상</h3>
            <video
              width="100%"
              controls
              style={{
                maxWidth: '600px',
                borderRadius: '12px',
                display: 'block',
                margin: '0 auto'
              }}
            >
              <source src={result.video_url} type="video/mp4" />
            </video>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>자세 분석</h3>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '12px 0' }}>
                {result.posture.score}점
              </p>
              <p style={{ margin: 0, lineHeight: '1.6', color: '#444' }}>
                {result.posture.feedback}
              </p>

              <button
                onClick={() => setActiveSection('posture')}
                style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                자세 분석 보러가기 →
              </button>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>음성 분석</h3>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '12px 0' }}>
                {result.voice.score}점
              </p>
              <p style={{ margin: '6px 0', color: '#444' }}>
                말속도: {result.voice.speed_wpm} WPM
              </p>
              <p style={{ margin: '6px 0', color: '#444' }}>
                필러어: {result.voice.filler_count}회
              </p>
              <p style={{ margin: '10px 0 0 0', lineHeight: '1.6', color: '#444' }}>
                {result.voice.feedback}
              </p>

              <button
                onClick={() => setActiveSection('voice')}
                style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                음성 분석 보러가기 →
              </button>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>스크립트 / 질문</h3>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '12px 0' }}>
                {result.script.score}점
              </p>
              <p style={{ lineHeight: '1.6', color: '#444' }}>
                {result.script.summary}
              </p>

              <p style={{ marginTop: '10px', color: '#444' }}>
                <strong>장점:</strong> {result.script.strength}
              </p>
              <p style={{ marginTop: '8px', color: '#444' }}>
                <strong>단점:</strong> {result.script.weakness}
              </p>
              <p style={{ marginTop: '8px', color: '#444' }}>
                <strong>개선점:</strong> {result.script.improvement}
              </p>

              <p style={{ marginTop: '14px', marginBottom: '8px' }}>
                <strong>예상 질문</strong>
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, color: '#444' }}>
                {result.script.questions.map((question, index) => (
                  <li key={index} style={{ marginBottom: '8px', lineHeight: '1.5' }}>
                    {question}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setActiveSection('script')}
                style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                질문 / 스크립트 보러가기 →
              </button>
            </div>
          </div>

          {activeSection && (
            <div
              style={{
                marginTop: '30px',
                padding: '20px',
                border: '2px solid #ddd',
                borderRadius: '16px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <h2>상세 분석</h2>

              {activeSection === 'posture' && (
                <>
                  <h3>자세 분석</h3>
                  <p>{result.posture.score}점</p>
                  <p>{result.posture.feedback}</p>
                </>
              )}

              {activeSection === 'voice' && (
                <>
                  <h3>음성 분석</h3>
                  <p>{result.voice.score}점</p>
                  <p>말속도: {result.voice.speed_wpm} WPM</p>
                  <p>필러어: {result.voice.filler_count}회</p>
                  <p>{result.voice.feedback}</p>
                </>
              )}

              {activeSection === 'script' && (
                <>
                  <h3>스크립트 / 질문</h3>

                  <p><strong>내용 점수:</strong> {result.script.score}점</p>

                  <p><strong>요약</strong></p>
                  <p>{result.script.summary}</p>

                  <p><strong>장점</strong></p>
                  <p>{result.script.strength}</p>

                  <p><strong>단점</strong></p>
                  <p>{result.script.weakness}</p>

                  <p><strong>개선점</strong></p>
                  <p>{result.script.improvement}</p>

                  <p><strong>예상 질문</strong></p>
                  <ul>
                    {result.script.questions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App