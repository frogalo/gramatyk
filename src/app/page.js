"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ── helpers ── */
const transformPolish = (str) => {
  const map = { ć: "_c", ł: "_l", ń: "_n", ś: "_s", ź: "_z_", ż: "_z", ó: "_o" };
  let r = "";
  for (const ch of str) r += map[ch] ?? ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return r;
};

const buildUrl = (word) => {
  const t = transformPolish(word.toLowerCase());
  const f1 = t.charAt(0);
  const f2 = t.includes("_") ? t.slice(0, t.indexOf("_") + 2) : t.slice(0, 2);
  return `https://www.morfologia.com.pl/${f1}/${f2}/${t}.html`;
};

const parseMorphTag = (morphText) => {
  const parts = morphText.split(",").map((s) => s.trim()).filter(Boolean);
  const result = {};
  parts.forEach((p) => {
    const [k, ...v] = p.split(":");
    result[k.trim().toLowerCase()] = v.join(":").trim();
  });
  return result;
};

const getPOSLabel = (morphObj) => {
  const pos = morphObj["część mowy"] || "";
  if (pos === "czasownik") return { label: "Czasownik", variant: "verb" };
  if (pos === "rzeczownik") return { label: "Rzeczownik", variant: "noun" };
  if (pos === "przymiotnik") return { label: "Przymiotnik", variant: "adj" };
  return { label: pos || "—", variant: "other" };
};

const LS_HISTORY_KEY = "leksyka_history";

const readHistory = () => {
  try { return JSON.parse(localStorage.getItem(LS_HISTORY_KEY) || "[]"); }
  catch { return []; }
};

const saveToHistory = (word, count) => {
  const history = readHistory();
  const idx = history.findIndex((h) => h.word === word);
  if (idx !== -1) history.splice(idx, 1);
  history.unshift({ word, count, ts: Date.now() });
  localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
};

const removeFromHistory = (word) => {
  const history = readHistory().filter((h) => h.word !== word);
  localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(history));
};

/* ── POS chip ── */
function POSChip({ variant, label }) {
  const styles = {
    verb:  { background: "var(--tertiary-container)", color: "var(--on-tertiary-container)" },
    noun:  { background: "var(--secondary-container)", color: "var(--on-secondary-container)" },
    adj:   { background: "var(--primary-container)", color: "var(--on-primary-container)" },
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

/* ── Feature chip ── */
function FeatureChip({ label }) {
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

/* ── Nav item ── */
function NavItem({ icon, label, active, onClick }) {
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

/* ── Main ── */
export default function Home() {
  const [activeNav, setActiveNav] = useState("dictionary");
  const [analysisMode, setAnalysisMode] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tableData, setTableData] = useState(null);
  const [currentWord, setCurrentWord] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [history, setHistory] = useState([]);
  const [sentenceResults, setSentenceResults] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { setHistory(readHistory()); }, []);

  const refreshHistory = useCallback(() => setHistory(readHistory()), []);

  /* word lookup */
  const doWordAnalysis = useCallback((word) => {
    const w = word.trim().toLowerCase();
    if (!w) return;
    setLoading(true); setError(""); setTableData(null); setSelectedRow(null);
    setSentenceResults(null); setCurrentWord(w);
    const proxyUrl = `/api/proxy?disableCache=true&url=${encodeURIComponent(buildUrl(w))}`;
    fetch(proxyUrl)
      .then((r) => { if (!r.ok) throw new Error("Błąd sieci"); return r.text(); })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const rows = Array.from(doc.querySelectorAll("table tr"))
          .filter((r) => r.querySelectorAll("td").length > 0)
          .map((r) => {
            const cells = r.querySelectorAll("td");
            return { word: cells[0]?.textContent.trim(), morphText: cells[1]?.textContent.trim() };
          })
          .filter((r) => r.word && r.morphText);
        if (!rows.length) { setError('Nie znaleziono wynikow dla "' + w + '".'); setLoading(false); return; }
        setTableData(rows);
        saveToHistory(w, rows.length);
        refreshHistory();
        setLoading(false);
      })
      .catch((e) => { setError(`Błąd: ${e.message}`); setLoading(false); });
  }, [refreshHistory]);

  /* sentence analysis */
  const doSentenceAnalysis = useCallback((sentence) => {
    const words = sentence.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return;
    setLoading(true); setError(""); setTableData(null); setSentenceResults(null);
    setCurrentWord(sentence.trim());
    Promise.all(words.map((word) => {
      const url = `/api/proxy?disableCache=true&url=${encodeURIComponent(buildUrl(word))}`;
      return fetch(url).then(r => r.ok ? r.text() : "").then(html => {
        if (!html) return { word, found: false };
        const doc = new DOMParser().parseFromString(html, "text/html");
        const found = doc.querySelectorAll("table tr td").length > 0;
        return { word, found };
      }).catch(() => ({ word, found: false }));
    })).then(res => { setSentenceResults(res); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const handleAnalyze = useCallback((forceWord) => {
    const w = forceWord ?? query;
    if (!w.trim()) return;
    if (analysisMode) doSentenceAnalysis(w);
    else doWordAnalysis(w);
  }, [query, analysisMode, doWordAnalysis, doSentenceAnalysis]);

  const handleKeyDown = (e) => { if (e.key === "Enter") handleAnalyze(); };

  const handleExampleClick = (word) => {
    setQuery(word); setAnalysisMode(false);
    doWordAnalysis(word);
  };

  const handleHistoryClick = (word) => {
    setQuery(word); setAnalysisMode(false);
    doWordAnalysis(word);
    setActiveNav("dictionary");
  };

  const deleteHistory = (e, word) => {
    e.stopPropagation();
    removeFromHistory(word); refreshHistory();
  };

  const clearAllHistory = () => {
    localStorage.removeItem(LS_HISTORY_KEY); refreshHistory();
  };

  /* selected row detail */
  const detailRow = selectedRow !== null && tableData ? tableData[selectedRow] : null;
  const detailMorph = detailRow ? parseMorphTag(detailRow.morphText) : null;

  const hasResults = tableData && tableData.length > 0;
  const EXAMPLES = ["tworzyć", "bóg", "odmieniać", "wysyłać"];

  /* ─────────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", minHeight: "100dvh", background: "var(--background)" }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        position: "fixed", left: 0, top: 0, height: "100%", width: "240px", zIndex: 40,
        background: "#f2f0ea",
        boxShadow: "var(--shadow-ambient)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Brand */}
        <div style={{ padding: "1.5rem 1.25rem 1rem" }}>
          <h1 style={{
            fontFamily: "var(--font-serif)", fontSize: "1.375rem",
            fontStyle: "italic", fontWeight: 700, color: "var(--on-surface)",
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
            onClick={() => { setActiveNav("dictionary"); setQuery(""); setTableData(null); setSentenceResults(null); setError(""); setSelectedRow(null); setTimeout(() => inputRef.current?.focus(), 50); }}
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
            <NavItem icon="settings" label="Ustawienia" active={false} onClick={() => {}} />
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ marginLeft: "240px", flex: 1, display: "flex", flexDirection: "column", minHeight: "100dvh" }}>

        {/* Top App Bar */}
        <header style={{
          position: "sticky", top: 0, zIndex: 30,
          background: "rgba(251,249,244,0.92)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(177,179,169,0.15)",
          padding: "0 2rem",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            height: "64px", maxWidth: "1200px", margin: "0 auto",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
              <div>
                <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 700 }}>Gramatyk</p>
                <p style={{ fontSize: "0.6rem", color: "var(--primary)", opacity: 0.7, letterSpacing: "0.05em", fontWeight: 600 }}>Morfologia języka polskiego</p>
              </div>
              {/* Mode Toggle */}
              <div style={{
                display: "flex", background: "var(--surface-container)",
                borderRadius: "0.5rem", padding: "0.2rem", gap: "0.1rem",
              }}>
                {[["Słowo", false], ["Zdanie", true]].map(([m, mode]) => {
                  const isActive = analysisMode === mode;
                  return (
                    <button key={m} onClick={() => { setAnalysisMode(mode); setTableData(null); setSentenceResults(null); setError(""); }}
                      style={{
                        padding: "0.35rem 1.1rem", fontSize: "0.8rem", fontWeight: isActive ? 700 : 500,
                        borderRadius: "0.35rem",
                        background: isActive ? "var(--surface-container-lowest)" : "transparent",
                        color: "var(--on-surface)", opacity: isActive ? 1 : 0.55,
                        boxShadow: isActive ? "var(--shadow-ambient)" : "none",
                        transition: "all 0.2s",
                      }}>{m}</button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[["help_outline", "Pomoc"], ["settings", "Ustawienia"]].map(([icon, title]) => (
                <button key={icon} title={title} style={{
                  padding: "0.5rem", color: "var(--primary)", borderRadius: "0.375rem",
                  display: "flex", alignItems: "center",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--on-surface)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--primary)"}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "1.2rem" }}>{icon}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── CONTENT ── */}
        <div style={{ flex: 1, padding: "2rem 2rem 4rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>

          {/* ── DICTIONARY VIEW ── */}
          {activeNav === "dictionary" && (
            <>
              {/* Search Card */}
              <section style={{ maxWidth: "760px", margin: "0 auto 2rem" }}>
                <div style={{
                  background: "var(--surface-container-lowest)",
                  borderRadius: "0.75rem", padding: "2rem",
                  boxShadow: "var(--shadow-ambient)",
                  border: "1px solid rgba(177,179,169,0.1)",
                }}>
                  {/* Input */}
                  <div style={{ position: "relative", marginBottom: "1.25rem" }}>
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={analysisMode ? "Wpisz zdanie do analizy…" : "Szukaj słowa lub wklej tekst…"}
                      style={{
                        width: "100%",
                        background: "var(--surface-container-high)",
                        borderRadius: "0.5rem",
                        padding: "1.1rem 11rem 1.1rem 1.4rem",
                        fontSize: "1.125rem", fontWeight: 500,
                        color: "var(--on-surface)",
                        transition: "all 0.2s",
                      }}
                      onFocus={e => { e.target.style.background = "var(--surface-container-lowest)"; e.target.style.boxShadow = "0 0 0 1px var(--primary)"; }}
                      onBlur={e => { e.target.style.background = "var(--surface-container-high)"; e.target.style.boxShadow = "none"; }}
                    />
                    <div style={{
                      position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)",
                      display: "flex", alignItems: "center", gap: "0.5rem", pointerEvents: "none",
                      opacity: 0.35, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>
                      Enter, aby analizować
                      <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>keyboard_return</span>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, opacity: 0.45, marginRight: "0.25rem" }}>Przykłady:</span>
                      {EXAMPLES.map((ex) => (
                        <button key={ex} onClick={() => handleExampleClick(ex)} style={{
                          padding: "0.25rem 0.75rem",
                          background: ex === "bóg" ? "var(--primary-container)" : "var(--surface-container-high)",
                          color: "var(--on-surface)", borderRadius: "9999px",
                          fontSize: "0.8rem", fontWeight: ex === "bóg" ? 700 : 500,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--primary-container)"}
                        onMouseLeave={e => e.currentTarget.style.background = ex === "bóg" ? "var(--primary-container)" : "var(--surface-container-high)"}
                        >{ex}</button>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {query && (
                        <button onClick={() => { setQuery(""); setTableData(null); setSentenceResults(null); setError(""); setSelectedRow(null); }}
                          style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", fontWeight: 600, opacity: 0.55, borderRadius: "0.375rem" }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0.55}
                        >Wyczyść</button>
                      )}
                      <button
                        onClick={() => handleAnalyze()}
                        disabled={loading || !query.trim()}
                        style={{
                          padding: "0.6rem 1.75rem", fontSize: "0.875rem", fontWeight: 700,
                          background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dim) 100%)",
                          color: "var(--on-primary)", borderRadius: "0.5rem",
                          boxShadow: "0 4px 12px rgba(95,94,94,0.2)",
                          opacity: loading || !query.trim() ? 0.5 : 1,
                          transform: "scale(1)", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { if (!loading && query.trim()) e.currentTarget.style.transform = "scale(0.98)"; }}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                      >
                        {loading ? "Analizuję…" : "Analizuj"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Error */}
              {error && (
                <div style={{
                  maxWidth: "760px", margin: "0 auto 1.5rem",
                  background: "var(--error-container)", color: "var(--on-error-container)",
                  borderRadius: "0.5rem", padding: "0.75rem 1rem",
                  fontSize: "0.875rem", fontWeight: 500,
                  display: "flex", alignItems: "center", gap: "0.5rem",
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>warning</span>
                  {error}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
                  <div style={{
                    width: "32px", height: "32px", border: "2px solid var(--outline-variant)",
                    borderTopColor: "var(--primary)", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite", margin: "0 auto 1rem",
                  }} />
                  <p style={{ fontSize: "0.875rem", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>Pobieranie danych morfologicznych…</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
                </div>
              )}

              {/* ── Sentence Results ── */}
              {!loading && sentenceResults && (
                <section style={{ maxWidth: "760px", margin: "0 auto" }}>
                  <div style={{
                    background: "var(--surface-container-lowest)", borderRadius: "0.75rem",
                    padding: "2rem", boxShadow: "var(--shadow-ambient)",
                    border: "1px solid rgba(177,179,169,0.1)",
                  }}>
                    <p style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.45, marginBottom: "1.25rem" }}>Analiza zdania</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", lineHeight: 2.5 }}>
                      {sentenceResults.map((item, i) => (
                        <span key={i} style={{
                          fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600,
                          padding: "0.2rem 0.6rem", borderRadius: "0.375rem",
                          background: item.found ? "var(--tertiary-container)" : "var(--error-container)",
                          color: item.found ? "var(--on-tertiary-container)" : "var(--on-error-container)",
                          cursor: "pointer", transition: "opacity 0.15s",
                        }}
                        onClick={() => { setQuery(item.word); setAnalysisMode(false); doWordAnalysis(item.word); }}
                        title={item.found ? "Kliknij, aby analizować" : "Nie znaleziono w bazie"}
                        >{item.word}</span>
                      ))}
                    </div>
                    <p style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "1rem" }}>
                      <span style={{ color: "var(--tertiary)", fontWeight: 700 }}>■</span> Znaleziono w bazie morfologicznej &nbsp;
                      <span style={{ color: "var(--error)", fontWeight: 700 }}>■</span> Nie znaleziono
                    </p>
                  </div>
                </section>
              )}

              {/* ── Word Results ── */}
              {!loading && hasResults && !sentenceResults && (
                <>
                  {/* Results meta bar */}
                  <div style={{
                    maxWidth: "1100px", margin: "0 auto 1.25rem",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingBottom: "0.75rem", borderBottom: "1px solid rgba(177,179,169,0.15)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.4 }}>Zapytanie</span>
                        <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.375rem", fontStyle: "italic", fontWeight: 700 }}>{currentWord}</span>
                      </div>
                      <div style={{ width: "1px", height: "16px", background: "rgba(177,179,169,0.3)" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.4 }}>Źródło</span>
                        <span style={{
                          fontSize: "0.75rem", fontWeight: 500, padding: "0.15rem 0.5rem",
                          background: "var(--secondary-container)", color: "var(--on-secondary-container)",
                          borderRadius: "0.25rem",
                        }}>morfologia.com.pl</span>
                      </div>
                      <div style={{ width: "1px", height: "16px", background: "rgba(177,179,169,0.3)" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.4 }}>Znaleziono</span>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>{tableData.length} form</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(window.location.href + "?q=" + encodeURIComponent(currentWord)); }}
                      style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", fontWeight: 700, opacity: 0.5, borderRadius: "0.375rem", padding: "0.25rem 0.5rem" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>link</span>
                      Kopiuj link
                    </button>
                  </div>

                  {/* Table + Detail */}
                  <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: detailRow ? "1fr 340px" : "1fr", gap: "1.5rem", alignItems: "start" }}>

                    {/* ── Table ── */}
                    <div style={{
                      background: "var(--surface-container-lowest)", borderRadius: "0.75rem",
                      overflow: "hidden", border: "1px solid rgba(177,179,169,0.1)",
                      boxShadow: "var(--shadow-ambient)",
                    }}>
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
                </>
              )}
            </>
          )}

          {/* ── HISTORY VIEW ── */}
          {activeNav === "history" && (
            <div style={{ maxWidth: "720px", margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", fontWeight: 700 }}>Historia wyszukiwania</h2>
                  <p style={{ fontSize: "0.8rem", opacity: 0.5, marginTop: "0.25rem" }}>{history.length} {history.length === 1 ? "wyszukiwanie" : "wyszukiwań"}</p>
                </div>
                {history.length > 0 && (
                  <button onClick={clearAllHistory} style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.5, padding: "0.4rem 0.75rem", borderRadius: "0.375rem", color: "var(--error)" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                  >Wyczyść wszystko</button>
                )}
              </div>

              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 2rem", opacity: 0.4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>history</span>
                   <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.125rem", fontStyle: "italic" }}>Brak wyszukiwań.</p>
                   <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>Twoje ostatnie analizy pojawią się tutaj.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  {history.map((item) => (
                    <div key={item.word}
                      onClick={() => handleHistoryClick(item.word)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "0.9rem 1.25rem", borderRadius: "0.5rem",
                        background: "var(--surface-container-lowest)", cursor: "pointer",
                        transition: "background 0.12s",
                        border: "1px solid rgba(177,179,169,0.08)",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface-container-low)"}
                      onMouseLeave={e => e.currentTarget.style.background = "var(--surface-container-lowest)"}
                    >
                      <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
                        <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 700 }}>{item.word}</span>
                        <span style={{ fontSize: "0.75rem", opacity: 0.45 }}>{item.count} form</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontSize: "0.7rem", opacity: 0.35 }}>{new Date(item.ts).toLocaleDateString("pl-PL")}</span>
                        <button onClick={(e) => deleteHistory(e, item.word)} style={{ opacity: 0.3, padding: "0.2rem", borderRadius: "0.25rem" }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = "var(--error)"; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = 0.3; e.currentTarget.style.color = "inherit"; }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>close</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── FAVOURITES VIEW ── */}
          {activeNav === "fav" && (
            <div style={{ maxWidth: "720px", margin: "0 auto", textAlign: "center", padding: "6rem 2rem", opacity: 0.4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>star</span>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontStyle: "italic", marginBottom: "0.5rem" }}>Ulubione — wkrótce</h2>
              <p style={{ fontSize: "0.875rem" }}>Będziesz mógł dodawać słowa i formy do zakładek.</p>
            </div>
          )}

          {/* ── ABOUT VIEW ── */}
          {activeNav === "about" && (
            <div style={{ maxWidth: "620px", margin: "0 auto" }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>O aplikacji Gramatyk</h2>
              <p style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.4, marginBottom: "2rem" }}>Morfologia języka polskiego</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", color: "var(--on-surface)" }}>
                {[
                  ["Czym jest Gramatyk?", "Gramatyk to zaawansowane narzędzie do eksploracji morfologii języka polskiego. Pobiera dane na żywo z morfologia.com.pl i prezentuje je w przejrzystym, czytelnym interfejsie."],
                  ["Źródło danych", "Wszystkie dane morfologiczne pochodzą z serwisu morfologia.com.pl — kompleksowej bazy morfologii języka polskiego. Gramatyk stanowi elegancki interfejs do tej bazy."],
                  ["Tryb słowa", "Wpisz pojedyncze polskie słowo, aby zobaczyć wszystkie jego formy odmiany, części mowy oraz cechy gramatyczne takie jak przypadek, liczba i rodzaj."],
                  ["Tryb zdania", "Wpisz całe zdanie. Gramatyk przeanalizuje każde słowo i wyróżni te, które są obecne w bazie morfologicznej — pomocne przy identyfikacji nieregularnych form."],
                ].map(([title, body]) => (
                  <div key={title} style={{ background: "var(--surface-container-lowest)", borderRadius: "0.75rem", padding: "1.25rem 1.5rem", border: "1px solid rgba(177,179,169,0.1)" }}>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>{title}</h3>
                    <p style={{ fontSize: "0.875rem", opacity: 0.7, lineHeight: 1.7 }}>{body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Mobile FAB / fixed ── */}
      <button
        onClick={() => { setActiveNav("dictionary"); setQuery(""); setTableData(null); setSentenceResults(null); setError(""); setSelectedRow(null); setTimeout(() => inputRef.current?.focus(), 50); }}
        style={{
          position: "fixed", bottom: "1.75rem", right: "1.75rem",
          width: "52px", height: "52px", borderRadius: "50%",
          background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-dim) 100%)",
          color: "var(--on-primary)", boxShadow: "var(--shadow-float)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 50, transition: "transform 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        title="Nowa analiza"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "1.5rem" }}>add</span>
      </button>
    </div>
  );
}
