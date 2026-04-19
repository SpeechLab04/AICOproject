function FeatureCard({ icon, title, description, bgColor }) {
  return (
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
          backgroundColor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          flexShrink: 0
        }}
      >
        {icon}
      </div>

      <div>
        <h3
          style={{
            margin: 0,
            fontSize: '17px',
            color: '#111827',
            lineHeight: '1.4'
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: '6px 0 0 0',
            color: '#4b5563',
            lineHeight: '1.6',
            fontSize: '15px'
          }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}

export default FeatureCard