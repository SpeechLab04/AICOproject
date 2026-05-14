import { useRef } from "react";

function MagneticButton({ children, style, ...props }) {
  const buttonRef = useRef(null);

  const handleMouseMove = (e) => {
    const button = buttonRef.current;

    const rect = button.getBoundingClientRect();

    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    button.style.transform = `
      translate(${x * 0.3}px, ${y * 0.3}px)
    `;
  };

  const handleMouseLeave = () => {
    const button = buttonRef.current;

    button.style.transform = "translate(0px, 0px)";
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition:
        "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
        cursor: "pointer",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default MagneticButton;