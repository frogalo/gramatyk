import { useState } from "react";
import { getPOSLabel } from "../lib/api";

export function SentenceResults({ sentenceResults, setQuery, doWordAnalysis }) {
  const [hoveredPos, setHoveredPos] = useState(null);

  if (!sentenceResults) return null;

  const presentVariants = new Set();
  sentenceResults.forEach(item => {
    if (item.isWord) {
      if (!item.found) presentVariants.add("error");
      else {
        const pd = item.morphData ? getPOSLabel(item.morphData) : { variant: "other" };
        presentVariants.add(pd.variant);
      }
    }
  });

  const legendItems = [
    { variant: "verb", bg: "var(--tertiary-container)", color: "var(--on-tertiary-container)", label: "Czasownik" },
    { variant: "noun", bg: "var(--secondary-container)", color: "var(--on-secondary-container)", label: "Rzeczownik" },
    { variant: "adj", bg: "#ccfbf1", color: "#0f766e", label: "Przymiotnik" },
    { variant: "num", bg: "#fef3c7", color: "#92400e", label: "Liczebnik" },
    { variant: "adv", bg: "#e0e7ff", color: "#3730a3", label: "Przysłówek" },
    { variant: "pron", bg: "#fce7f3", color: "#9d174d", label: "Zaimek" },
    { variant: "prep", bg: "#f3f4f6", color: "#374151", label: "Przyimek" },
    { variant: "conj", bg: "#ffedd5", color: "#c2410c", label: "Spójnik" },
    { variant: "part", bg: "#ffe4e6", color: "#be123c", label: "Partykuła" },
    { variant: "other", bg: "var(--surface-container-highest)", color: "var(--on-surface-variant)", label: "Inne" },
    { variant: "error", bg: "var(--error-container)", color: "var(--error)", label: "Nieznane" }
  ];

  const visibleLegendItems = legendItems.filter(item => presentVariants.has(item.variant));

  return (
    <section style={{ maxWidth: "860px", margin: "0 auto" }}>
      <div style={{
        background: "var(--surface-container-lowest)", borderRadius: "1rem",
        padding: "2.5rem", boxShadow: "var(--shadow-ambient)",
        border: "1px solid rgba(177,179,169,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
           <p style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.45 }}>Składnia zdania</p>
           <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.75rem", fontWeight: 600 }}>
             {visibleLegendItems.map(item => (
               <span key={item.variant} 
                 style={{ 
                   display: "flex", alignItems: "center", gap: "0.4rem", 
                   cursor: "pointer", 
                   opacity: hoveredPos ? (hoveredPos === item.variant ? 1 : 0.25) : 1,
                   transition: "opacity 0.2s"
                 }}
                 onMouseEnter={() => setHoveredPos(item.variant)}
                 onMouseLeave={() => setHoveredPos(null)}
                 onClick={() => setHoveredPos(hoveredPos === item.variant ? null : item.variant)}
               >
                 <span style={{ 
                     background: item.bg, color: item.color, 
                     padding: "0.25rem 0.5rem", borderRadius: "0.375rem", 
                     fontSize: "0.625rem", letterSpacing: "0.08em", textTransform: "uppercase" 
                 }}>
                     {item.variant === "error" && !hoveredPos ? <span style={{ opacity: 0.6 }}>{item.label}</span> : item.label}
                 </span>
               </span>
             ))}
           </div>
        </div>

        <div style={{ 
          lineHeight: "2.5", fontSize: "1.75rem", fontFamily: "var(--font-serif)",
          color: "var(--on-surface)", padding: "1rem 0"
        }}>
          {sentenceResults.map((item, i) => {
            if (!item.isWord) {
               return <span key={i} style={{ whiteSpace: "pre-wrap", opacity: 0.6 }}>{item.text}</span>;
            }

            const posData = item.morphData ? getPOSLabel(item.morphData) : { variant: "other", label: "Inne" };
            const styles = {
              verb:  { bg: "var(--tertiary-container)", border: "var(--tertiary)", textHover: "var(--on-tertiary-container)" },
              noun:  { bg: "var(--secondary-container)", border: "var(--secondary)", textHover: "var(--on-secondary-container)" },
              adj:   { bg: "#ccfbf1", border: "#14b8a6", textHover: "#0f766e" },
              num:   { bg: "#fef3c7", border: "#f59e0b", textHover: "#92400e" },
              adv:   { bg: "#e0e7ff", border: "#6366f1", textHover: "#3730a3" },
              pron:  { bg: "#fce7f3", border: "#ec4899", textHover: "#9d174d" },
              prep:  { bg: "#f3f4f6", border: "#9ca3af", textHover: "#374151" },
              conj:  { bg: "#ffedd5", border: "#f97316", textHover: "#c2410c" },
              part:  { bg: "#ffe4e6", border: "#f43f5e", textHover: "#be123c" },
              other: { bg: "var(--surface-container-highest)", border: "var(--outline)", textHover: "var(--on-surface)" },
              error: { bg: "var(--error-container)", border: "var(--error)", textHover: "var(--on-error-container)" }
            };
            const sVariant = item.found ? posData.variant : "error";
            const s = styles[sVariant] || styles.other;
            
            let shortLabel = "inne";
            if (posData.label === "Czasownik") shortLabel = "czas.";
            else if (posData.label === "Rzeczownik") shortLabel = "rzecz.";
            else if (posData.label === "Przymiotnik") shortLabel = "przym.";
            else if (posData.label === "Liczebnik") shortLabel = "licz.";
            else if (posData.label === "Przysłówek") shortLabel = "przys.";
            else if (posData.label === "Zaimek") shortLabel = "zaim.";
            else if (posData.label === "Przyimek") shortLabel = "przyim.";
            else if (posData.label === "Spójnik") shortLabel = "spój.";
            else if (posData.label === "Partykuła") shortLabel = "part.";
            else if (posData.label === "—") shortLabel = "niezn.";

            const isDimmed = hoveredPos && sVariant !== hoveredPos;
            const sOpacity = isDimmed ? 0.2 : 1;

            return (
              <ruby key={i} style={{ rubyPosition: "over", margin: "0 0.1rem", opacity: sOpacity, transition: "opacity 0.2s" }}>
                <span style={{
                  position: "relative", display: "inline-block",
                  cursor: "pointer", transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  borderBottom: `2.5px solid ${s.border}`,
                  background: s.bg,
                  color: s.textHover,
                  borderRadius: "0.25rem",
                  padding: "0.1rem 0.35rem",
                  fontWeight: 600,
                }}
                onClick={() => { setQuery(item.text); doWordAnalysis(item.text, true); }}
                title={item.found ? `Lemat: ${item.lemma}\nCzęść mowy: ${posData.label}` : "Brak w słowniku widocznych form"}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-float)";
                  e.currentTarget.style.filter = "brightness(0.92)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.filter = "brightness(1)";
                }}
                >
                  {item.text}
                </span>
                <rt style={{ 
                   fontSize: "0.5rem", fontWeight: 700, textTransform: "uppercase", 
                   color: s.border, opacity: 0.9, letterSpacing: "0.05em",
                   transform: "translateY(3px)" 
                }}>
                   {item.found ? shortLabel : "?"}
                </rt>
              </ruby>
            );
          })}
        </div>
        
        <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(177,179,169,0.15)", fontSize: "0.875rem", opacity: 0.6, display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
           <span className="material-symbols-outlined" style={{ fontSize: "1.25rem", opacity: 0.8 }}>info</span>
           <p>Kliknij najeżdżając na dowolne słowo zdania, by zobaczyć pełną analizę. Rozpoznawanie jest oparte o formę podstawową wyrazu (lemat) oraz część mowy ze Słownika Morfologicznego.</p>
        </div>
      </div>
    </section>
  );
}
