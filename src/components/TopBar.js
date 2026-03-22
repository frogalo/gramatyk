export function TopBar({ activeNav, setActiveNav }) {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 30,
      background: "rgba(251,249,244,0.92)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid rgba(177,179,169,0.15)",
      padding: "0 2rem",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        height: "64px", maxWidth: "1200px", margin: "0 auto",
      }}>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[["help_outline", "Pomoc", "about"], ["settings", "Ustawienia", "settings"]].map(([icon, title, route]) => (
            <button key={icon} title={title} 
              onClick={() => setActiveNav?.(route)}
              style={{
              padding: "0.5rem", borderRadius: "0.375rem",
              display: "flex", alignItems: "center",
              color: activeNav === route ? "var(--on-surface)" : "var(--primary)",
              background: activeNav === route ? "rgba(49,51,44,0.05)" : "transparent"
            }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--on-surface)"}
            onMouseLeave={e => { if (activeNav !== route) e.currentTarget.style.color = "var(--primary)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>{icon}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
