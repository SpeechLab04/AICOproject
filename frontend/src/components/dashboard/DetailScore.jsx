function DetailScore({ score, label }) {
  return (
    <div
      style={{
        background: "#EEF8F4",
        borderRadius: "24px",
        padding: "24px",
        marginBottom: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <strong style={{ fontSize: "22px", color: "#2D3A3A" }}>
        {label}
      </strong>

      <div style={{ color: "#6BB5A6", fontSize: "34px", fontWeight: "900" }}>
        {score}점
      </div>
    </div>
  );
}

export default DetailScore;
