function StepItem({ number, title, description }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        alignItems: "flex-start",
        background: "#FFFCF7",
        padding: "18px",
        borderRadius: "16px",
        border: "1px solid #C3D8D9",
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          background: "#A1B5D8",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          flexShrink: 0,
        }}
      >
        {number}
      </div>

      <div>
        <h3 style={{ color: "#728291", marginBottom: "6px" }}>{title}</h3>
        <p style={{ color: "#728291", lineHeight: "1.6" }}>{description}</p>
      </div>
    </div>
  );
}

export default StepItem;