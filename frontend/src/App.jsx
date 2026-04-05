import { useRef, useState } from 'react'

function App() {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [previewURL, setPreviewURL] = useState(null)
  const [activeSection, setActiveSection] = useState(null)

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

      const response = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('서버 응답 오류')
      }

      const data = await response.json()
      setMessage(data.message)
      setResult(data)
    } catch (error) {
      console.error('업로드 실패:', error)
      setMessage('업로드 실패: 서버 연결을 확인하세요.')
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

      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '30px',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <h2 style={{ marginBottom: '20px' }}>영상 업로드</h2>

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
            padding: '12px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            marginRight: '10px',
            marginBottom: '10px',
            borderRadius: '10px',
            border: 'none'
          }}
        >
          영상 선택
        </button>

        <button
          onClick={handleUpload}
          style={{
            padding: '12px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '10px',
            borderRadius: '10px',
            border: 'none'
          }}
        >
          분석 시작
        </button>

        {selectedFile && (
          <p style={{ marginTop: '16px' }}>
            선택한 파일: <strong>{selectedFile.name}</strong>
          </p>
        )}

        {previewURL && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '12px' }}>업로드한 영상 미리보기</h3>
            <video
              width="100%"
              controls
              style={{
                maxWidth: '500px',
                borderRadius: '12px'
              }}
            >
              <source src={previewURL} type="video/mp4" />
            </video>
          </div>
        )}

        {loading && (
          <p style={{ marginTop: '20px', fontWeight: 'bold' }}>
            분석 중입니다... ⏳
          </p>
        )}

        {message && (
          <p style={{ marginTop: '16px', fontWeight: 'bold' }}>
            {message}
          </p>
        )}
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
                    <p>{result.script.summary}</p>
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
        </div>
      )}
    </div>
  )
}

export default App