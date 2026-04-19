function LoadingPage({ progress, currentTip }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9ff',
        fontFamily: 'Arial, sans-serif',
        padding: 'clamp(16px, 3vw, 24px)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          backgroundColor: '#fff',
          borderRadius: '24px',
          padding: 'clamp(24px, 4vw, 40px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}
      >
        <h1
          style={{
            marginBottom: '12px',
            fontSize: 'clamp(28px, 4vw, 36px)'
          }}
        >
          분석 중입니다... ⏳
        </h1>

        <p
          style={{
            color: '#666',
            marginBottom: '28px',
            lineHeight: '1.6',
            fontSize: 'clamp(15px, 2vw, 16px)'
          }}
        >
          발표 영상을 분석하고 있어요. 잠시만 기다려 주세요.
        </p>

        <div
          style={{
            margin: '0 auto 12px auto',
            width: '100%',
            maxWidth: '520px',
            height: '14px',
            backgroundColor: '#eee',
            borderRadius: '999px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#2563eb',
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
            borderRadius: '18px',
            padding: 'clamp(18px, 3vw, 24px)',
            backgroundColor: '#fafafa'
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: '12px',
              fontSize: 'clamp(18px, 2.5vw, 20px)'
            }}
          >
            발표 팁
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 'clamp(16px, 2.2vw, 18px)',
              lineHeight: '1.7',
              color: '#444'
            }}
          >
            {currentTip}
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoadingPage