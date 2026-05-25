function AnalysisCard({ active, icon, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "#E5F4EF" : "white",
        borderRadius: "28px",
        padding: "34px 28px",
        boxShadow: active
          ? "0 16px 36px rgba(107,181,166,0.18)"
          : "0 10px 30px rgba(0,0,0,0.05)",
        border: active ? "2px solid #6BB5A6" : "1px solid #E4F0EA",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.18s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          width: "68px",
          height: "68px",
          borderRadius: "50%",
          background: active ? "white" : "#E5F4EF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 22px",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontSize: "26px",
          marginBottom: "14px",
          color: "#2D3A3A",
          fontWeight: "900",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          color: "#6B7C79",
          fontSize: "17px",
          lineHeight: "1.7",
        }}
      >
        {desc}
      </p>
    </button>
  );
}

export default AnalysisCard;
