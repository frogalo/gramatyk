export function TopBar({ activeNav, setActiveNav, setIsSidebarOpen }) {
  return (
    <header className="topbar-header">
      <div className="topbar-container">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsSidebarOpen(true)}
          title="Menu"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "1.5rem" }}>menu</span>
        </button>

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
