import { useRef, useState } from 'react'

function App() {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [message, setMessage] = useState('') // 업로드 성공이나 실패 문구 화면에 띄움

  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
      setMessage('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('파일을 먼저 선택하세요.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile) // 여기서 'file'은 backend랑 이름이 같아야 함.

    try {
      const response = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      setMessage(`${data.message} / 파일명: ${data.filename}`)
    } catch (error) {
      console.error('업로드 실패:', error)
      setMessage('업로드 실패')
    }
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>AICO</h1>
      <p>AI 발표 코칭 서비스</p>

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
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        영상 선택
      </button>

      <button
        onClick={handleUpload}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        서버로 업로드
      </button>

      {selectedFile && (
        <p style={{ marginTop: '20px' }}>
          선택한 파일: {selectedFile.name}
        </p>
      )}

      {message && (
        <p style={{ marginTop: '20px' }}>
          {message}
        </p>
      )}
    </div>
  )
}

export default App