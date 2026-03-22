import { NavItem } from "./Navigation";

export function Sidebar({ activeNav, setActiveNav, resetAnalysis, inputRef }) {
  return (
    <aside style={{
      position: "fixed", left: 0, top: 0, height: "100%", width: "240px", zIndex: 40,
      background: "#e9e1ce",
      boxShadow: "var(--shadow-ambient)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Brand */}
      <div style={{ padding: "1.5rem 1.25rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <img src="/logo.jpg" alt="Gramatyk Logo" style={{ width: "24px", height: "24px", objectFit: "cover", mixBlendMode: "multiply", borderRadius: "4px" }} />
        <h1 style={{
          fontFamily: "var(--font-serif)", fontSize: "1.375rem",
          fontStyle: "italic", fontWeight: 700, color: "var(--on-surface)",
          letterSpacing: "-0.02em"
        }}>Gramatyk</h1>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0.5rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
        <NavItem icon="book" label="Słownik" active={activeNav === "dictionary"} onClick={() => setActiveNav("dictionary")} />
        <NavItem icon="history" label="Historia" active={activeNav === "history"} onClick={() => setActiveNav("history")} />
        <NavItem icon="star" label="Ulubione" active={activeNav === "fav"} onClick={() => setActiveNav("fav")} />
        <NavItem icon="info" label="O aplikacji" active={activeNav === "about"} onClick={() => setActiveNav("about")} />
      </nav>

      {/* New Analysis FAB in sidebar */}
      <div style={{ padding: "1rem 1.25rem 1.5rem" }}>
        <button
          onClick={() => { 
            setActiveNav("dictionary"); 
            resetAnalysis(); 
            setTimeout(() => inputRef.current?.focus(), 50); 
          }}
          style={{
            width: "100%", padding: "0.75rem",
            background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dim) 100%)",
            color: "var(--on-primary)", borderRadius: "0.5rem",
            fontWeight: 600, fontSize: "0.875rem",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>add</span>
          Nowa analiza
        </button>

        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(177,179,169,0.2)" }}>
          <NavItem icon="settings" label="Ustawienia" active={activeNav === "settings"} onClick={() => setActiveNav("settings")} />
        </div>
      </div>
    </aside>
  );
}
