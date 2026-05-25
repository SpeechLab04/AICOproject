import { cardStyle } from "./dashboardStyles";

function SummaryCard({ icon, title, items }) {
  return (
    <div style={cardStyle}>
      <h3
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "24px",
          color: "#2D3A3A",
          marginBottom: "22px",
        }}
      >
        {icon}
        {title}
      </h3>

      {items.map((item, idx) => (
        <p
          key={idx}
          style={{
            color: "#4B5563",
            lineHeight: "1.9",
            fontSize: "17px",
          }}
        >
          · {item}
        </p>
      ))}
    </div>
  );
}

export default SummaryCard;
