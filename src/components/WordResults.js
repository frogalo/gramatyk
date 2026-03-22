import { parseMorphTag, getPOSLabel } from "../lib/api";
import { POSChip, FeatureChip } from "./Chips";

export function WordResults({ 
  tableData, currentWord, 
  selectedRow, setSelectedRow, 
  doWordAnalysis, 
  inlineLoading, sentenceResults,
  isFavorite, toggleFavorite
}) {
  if (!tableData || tableData.length === 0) return null;

  const detailRow = selectedRow !== null ? tableData[selectedRow] : null;
  const detailMorph = detailRow ? parseMorphTag(detailRow.morphText) : null;

  return (
    <div style={{ marginTop: sentenceResults ? "2rem" : "0" }}>
      {/* Results meta bar */}
      <div style={{
        maxWidth: "1100px", margin: "0 auto 1.25rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingBottom: "0.75rem", borderBottom: "1px solid rgba(177,179,169,0.15)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.375rem", fontStyle: "italic", fontWeight: 700 }}>{currentWord}</span>
          </div>
          <div style={{ width: "1px", height: "16px", background: "rgba(177,179,169,0.3)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.4 }}>Źródło</span>
            <span style={{
              fontSize: "0.75rem", fontWeight: 500, padding: "0.15rem 0.5rem",
              background: "var(--secondary-container)", color: "var(--on-secondary-container)",
              borderRadius: "0.25rem",
            }}>{tableData[0]?.morphText?.includes('SJP') ? "sjp.pl" : "morfologia.com.pl"}</span>
          </div>
          <div style={{ width: "1px", height: "16px", background: "rgba(177,179,169,0.3)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.4 }}>Znaleziono</span>
            <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>{tableData.length} form</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => { toggleFavorite?.(currentWord) }}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", fontWeight: 700, opacity: isFavorite ? 1 : 0.5, borderRadius: "0.375rem", padding: "0.25rem 0.5rem", color: isFavorite ? "#f59e0b" : "var(--on-surface)" }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => { if (!isFavorite) e.currentTarget.style.opacity = 0.5 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "0.875rem", fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>star</span>
            {isFavorite ? "Ulubione" : "Dodaj"}
          </button>
        </div>
      </div>

      {/* Table + Detail */}
      <div className={`results-grid ${detailRow ? "has-detail" : ""}`}>
        {/* ── Table ── */}
        <div className="table-wrapper">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface-container-low)" }}>
                {["Forma", "Lemat", "Część mowy", "Cechy"].map((h) => (
                  <th key={h} style={{
                    padding: "0.9rem 1.25rem", textAlign: "left",
                    fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.1em", opacity: 0.45, color: "var(--on-surface)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => {
                const morph = parseMorphTag(row.morphText);
                const pos = getPOSLabel(morph);
                const featureParts = row.morphText.split(",").map(s => s.trim()).filter(s => !s.toLowerCase().startsWith("część mowy") && !s.toLowerCase().startsWith("rodzaj") && s);
                const isSelected = selectedRow === i;
                return (
                  <tr key={i}
                    onClick={() => setSelectedRow(isSelected ? null : i)}
                    style={{
                      background: isSelected ? "var(--surface-container-low)" : "transparent",
                      cursor: "pointer", transition: "background 0.12s",
                      outline: isSelected ? "1px solid rgba(95,94,94,0.15)" : "none",
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "var(--surface-container-low)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ padding: "0.85rem 1.25rem" }}>
                      <span style={{
                        fontFamily: "var(--font-serif)", fontSize: "1.125rem", fontWeight: 700,
                        color: isSelected ? "var(--primary)" : "var(--on-surface)",
                        transition: "color 0.12s",
                      }}>{row.word}</span>
                    </td>
                    <td style={{ padding: "0.85rem 1.25rem", fontSize: "0.8125rem", fontWeight: 500, opacity: 0.65 }}>{currentWord}</td>
                    <td style={{ padding: "0.85rem 1.25rem" }}><POSChip variant={pos.variant} label={pos.label} /></td>
                    <td style={{ padding: "0.85rem 1.25rem" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {featureParts.slice(0, 4).map((f, fi) => {
                          const val = f.includes(":") ? f.split(":").slice(1).join(":").trim() : f;
                          return val ? <FeatureChip key={fi} label={val} /> : null;
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail Panel ── */}
        {detailRow && detailMorph && (
          <aside style={{
            background: "var(--surface-container-low)", borderRadius: "0.75rem",
            padding: "1.5rem", border: "1px solid rgba(177,179,169,0.1)",
            boxShadow: "var(--shadow-ambient)",
            position: "sticky", top: "80px",
            display: "flex", flexDirection: "column", gap: "1.25rem",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(177,179,169,0.15)" }}>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.45 }}>Szczegóły</span>
              <button onClick={() => setSelectedRow(null)} style={{ opacity: 0.4, borderRadius: "0.25rem", padding: "0.2rem" }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0.4}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>close</span>
              </button>
            </div>

            {/* Word display */}
            <div style={{ textAlign: "center", padding: "1rem 0", borderBottom: "1px solid rgba(177,179,169,0.1)" }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: "2.75rem", fontWeight: 700, display: "block", letterSpacing: "-0.02em", lineHeight: 1.1 }}>{detailRow.word}</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", opacity: 0.4, fontStyle: "italic" }}>Lemat:</span>
                <span style={{ fontFamily: "var(--font-serif)", fontSize: "0.9rem", fontWeight: 700 }}>{currentWord}</span>
              </div>
            </div>

            {/* Morph breakdown */}
            <div>
               <p style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.4, marginBottom: "0.75rem" }}>Analiza morfologiczna</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {Object.entries(detailMorph).filter(([k]) => k !== "część mowy").map(([k, v]) => (
                  <div key={k} style={{
                    background: "var(--surface-container-lowest)", padding: "0.6rem 0.75rem",
                    borderRadius: "0.5rem", border: "1px solid rgba(177,179,169,0.06)",
                  }}>
                    <span style={{ display: "block", fontSize: "0.55rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.4, marginBottom: "0.25rem" }}>{k}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* POS note */}
            {detailMorph["część mowy"] && (
              <div style={{
                background: "var(--tertiary-container)", padding: "0.75rem 1rem",
                borderRadius: "0.5rem", border: "1px solid rgba(69,103,73,0.12)",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "var(--tertiary)", flexShrink: 0, marginTop: "0.1rem" }}>info</span>
                  <div>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--on-tertiary-container)", display: "block", marginBottom: "0.25rem" }}>Część mowy</span>
                    <p style={{ fontSize: "0.75rem", color: "var(--on-tertiary-container)", opacity: 0.85, lineHeight: 1.5 }}>{detailMorph["część mowy"]}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => { doWordAnalysis(detailRow.word); setSelectedRow(null); }}
              style={{
                width: "100%", padding: "0.7rem",
                background: "var(--surface-container-highest)",
                border: "1px solid rgba(177,179,169,0.2)",
                borderRadius: "0.5rem", fontSize: "0.8rem", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                color: "var(--on-surface)", transition: "all 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-container)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--surface-container-highest)"}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>history_edu</span>
              Analizuj tę formę
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}
