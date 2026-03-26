import { useRef, useState } from 'react'

function App() {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const handleButtonClick = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setSelectedFile(file)
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
          cursor: 'pointer'
        }}
      >
        영상 업로드
      </button>

      {selectedFile && (
        <p style={{ marginTop: '20px' }}>
          선택한 파일: {selectedFile.name}
        </p>
      )}
    </div>
  )
}

export default App