import { useState } from 'react'

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onLogin({ email, password })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8faff 0%, #eff4ff 100%)',
        fontFamily: 'Arial, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1100px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: '20px',
          alignItems: 'stretch'
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #1d4ed8 100%)',
            borderRadius: '24px',
            padding: 'clamp(24px, 4vw, 36px)',
            color: '#ffffff',
            boxShadow: '0 12px 30px rgba(37, 99, 235, 0.24)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '520px',
            boxSizing: 'border-box'
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 'bold',
                letterSpacing: '0.08em',
                opacity: 0.95
              }}
            >
              AICO
            </p>

            <h1
              style={{
                margin: '14px 0 0 0',
                fontSize: 'clamp(32px, 5vw, 52px)',
                lineHeight: '1.15'
              }}
            >
              AI 발표 코치
            </h1>

            <p
              style={{
                margin: '16px 0 0 0',
                fontSize: 'clamp(16px, 2vw, 20px)',
                lineHeight: '1.7',
                color: 'rgba(255,255,255,0.92)'
              }}
            >
              발표 영상을 업로드하고
              <br />
              자세, 음성, 스크립트 분석 결과를
              <br />
              한눈에 확인해보세요.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '12px',
              marginTop: '28px'
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderRadius: '16px',
                padding: '16px'
              }}
            >
              <strong>자세 분석</strong>
              <p style={{ margin: '8px 0 0 0', lineHeight: '1.6', opacity: 0.92 }}>
                고개 각도와 얼굴 방향을 분석해 발표 태도를 점검합니다.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderRadius: '16px',
                padding: '16px'
              }}
            >
              <strong>음성 분석</strong>
              <p style={{ margin: '8px 0 0 0', lineHeight: '1.6', opacity: 0.92 }}>
                말속도와 필러어를 분석해 더 안정적인 발표를 도와줍니다.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderRadius: '16px',
                padding: '16px'
              }}
            >
              <strong>AI 질문 생성</strong>
              <p style={{ margin: '8px 0 0 0', lineHeight: '1.6', opacity: 0.92 }}>
                발표 내용을 바탕으로 예상 질문과 핵심 피드백을 제공합니다.
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: 'clamp(24px, 4vw, 36px)',
            border: '1px solid #e5e7eb',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: '520px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: '10px',
                fontSize: 'clamp(28px, 4vw, 36px)',
                color: '#111827'
              }}
            >
              로그인
            </h2>

            <p
              style={{
                marginTop: 0,
                marginBottom: '28px',
                color: '#6b7280',
                lineHeight: '1.6'
              }}
            >
              이메일과 비밀번호를 입력하고
              <br />
              발표 분석을 시작해보세요.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}
                >
                  이메일
                </label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: '1px solid #d1d5db',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: 'bold',
                    color: '#374151'
                  }}
                >
                  비밀번호
                </label>
                <input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: '1px solid #d1d5db',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '15px 18px',
                  fontSize: '17px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 8px 18px rgba(37, 99, 235, 0.22)'
                }}
              >
                로그인
              </button>
            </form>

            <div
              style={{
                marginTop: '22px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px',
                lineHeight: '1.6'
              }}
            >
              아직 회원이 아니신가요? <span style={{ color: '#2563eb', fontWeight: 'bold' }}>회원가입</span>
            </div>

            <div
              style={{
                marginTop: '18px',
                padding: '14px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: '14px',
                color: '#6b7280',
                fontSize: '13px',
                lineHeight: '1.6'
              }}
            >
              지금은 화면 테스트용 로그인입니다.
              <br />
              아무 이메일 / 비밀번호나 입력해도 들어갈 수 있게 되어 있어요.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage