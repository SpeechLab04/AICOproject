function AnalysisCard({ title, score, children, onClick, buttonText }) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '16px',
        padding: '18px',
        backgroundColor: '#fafafa',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        minWidth: 0,
        boxSizing: 'border-box'
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: '10px',
          fontSize: 'clamp(18px, 2vw, 22px)'
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: 'clamp(24px, 3vw, 28px)',
          fontWeight: 'bold',
          margin: '12px 0'
        }}
      >
        {score}점
      </p>

      {children}

      <button
        onClick={onClick}
        style={{
          marginTop: '14px',
          padding: '10px 12px',
          borderRadius: '10px',
          border: 'none',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        {buttonText}
      </button>
    </div>
  )
}

export default AnalysisCard