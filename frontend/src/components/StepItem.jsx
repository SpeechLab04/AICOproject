function StepItem({ number, title, description }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        padding: '14px',
        borderRadius: '16px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e5e7eb'
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
        {number}
      </div>

      <div>
        <p style={{ margin: 0, color: '#111827', fontWeight: 'bold' }}>{title}</p>
        <p style={{ margin: '4px 0 0 0', color: '#4b5563', lineHeight: '1.6' }}>
          {description}
        </p>
      </div>
    </div>
  )
}

export default StepItem