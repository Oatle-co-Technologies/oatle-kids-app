import "./LocalBackButton.css";

export default function LocalBackButton({ onClick, label = "Back", className = "" }) {
  return (
    <button
      className={`local-back-button ${className}`.trim()}
      type="button"
      onClick={onClick}
      aria-label={label}
    >
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  );
}
