import { useEffect, useRef, useState } from 'react'
import LoginPage from './pages/LoginPage'
import UploadPage from './pages/UploadPage'
import LoadingPage from './pages/LoadingPage'
import ResultPage from './pages/ResultPage'
import { tips } from './data/tips'

function App() {
  const fileInputRef = useRef(null)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const [page, setPage] = useState('upload') // upload | login | loading | result
  const [selectedFile, setSelectedFile] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [previewURL, setPreviewURL] = useState(null)
  const [activeSection, setActiveSection] = useState(null)
  const [currentTip, setCurrentTip] = useState('')
  const [progress, setProgress] = useState(0)

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

  useEffect(() => {
    return () => {
      if (previewURL) {
        URL.revokeObjectURL(previewURL)
      }
    }
  }, [previewURL])

  const handleLogin = ({ email, password }) => {
    if (!email || !password) {
      alert('이메일과 비밀번호를 입력하세요.')
      return
    }

    setIsLoggedIn(true)
    setUserEmail(email)
    setPage('upload')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserEmail('')
    setPage('upload')
    setSelectedFile(null)
    setMessage('')
    setLoading(false)
    setResult(null)
    setPreviewURL(null)
    setActiveSection(null)
    setCurrentTip('')
    setProgress(0)
  }

  const goToLogin = () => {
    setPage('login')
  }

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
    if (!isLoggedIn) {
      alert('로그인 후 이용 가능합니다.')
      setPage('login')
      return
    }

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

  if (page === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        goToHome={() => setPage('upload')}
      />
    )
  }

  if (page === 'upload') {
    return (
      <UploadPage
        fileInputRef={fileInputRef}
        selectedFile={selectedFile}
        previewURL={previewURL}
        loading={loading}
        message={message}
        onFileChange={handleFileChange}
        onButtonClick={handleButtonClick}
        onUpload={handleUpload}
        userEmail={userEmail}
        isLoggedIn={isLoggedIn}
        onLoginClick={goToLogin}
        onLogout={handleLogout}
      />
    )
  }

  if (page === 'loading') {
    return <LoadingPage progress={progress} currentTip={currentTip} />
  }

  return (
    <ResultPage
      result={result}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      goToUpload={() => setPage('upload')}
      userEmail={userEmail}
      onLogout={handleLogout}
    />
  )
}

export default App