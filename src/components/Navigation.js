export function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: "0.75rem",
      width: "100%", padding: "0.65rem 1rem",
      borderRadius: "0.5rem",
      background: active ? "var(--primary)" : "transparent",
      color: active ? "var(--on-primary)" : "var(--on-surface)",
      opacity: active ? 1 : 0.7,
      fontSize: "0.875rem", fontWeight: 500,
      transition: "all 0.15s ease",
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(49,51,44,0.05)"; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>{icon}</span>
      {label}
    </button>
  );
}
