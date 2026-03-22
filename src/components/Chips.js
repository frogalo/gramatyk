export function POSChip({ variant, label }) {
  const styles = {
    verb:  { background: "var(--tertiary-container)", color: "var(--on-tertiary-container)" },
    noun:  { background: "var(--secondary-container)", color: "var(--on-secondary-container)" },
    adj:   { background: "#ccfbf1", color: "#0f766e" },
    num:   { background: "#fef3c7", color: "#92400e" },
    adv:   { background: "#e0e7ff", color: "#3730a3" },
    pron:  { background: "#fce7f3", color: "#9d174d" },
    prep:  { background: "#f3f4f6", color: "#374151" },
    conj:  { background: "#ffedd5", color: "#c2410c" },
    part:  { background: "#ffe4e6", color: "#be123c" },
    other: { background: "var(--surface-container-highest)", color: "var(--on-surface-variant)" },
  };
  return (
    <span style={{
      ...styles[variant] || styles.other,
      padding: "0.2rem 0.5rem",
      borderRadius: "0.375rem",
      fontSize: "0.625rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    }}>{label}</span>
  );
}

export function FeatureChip({ label }) {
  return (
    <span style={{
      background: "var(--primary-container)",
      color: "var(--on-primary-container)",
      padding: "0.15rem 0.45rem",
      borderRadius: "0.25rem",
      fontSize: "0.625rem",
      fontWeight: 600,
      letterSpacing: "0.04em",
    }}>{label}</span>
  );
}
