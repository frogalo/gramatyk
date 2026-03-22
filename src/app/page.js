"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchWordData, analyzeSentence } from "../lib/api";
import { readHistory, saveToHistory, removeFromHistory, clearAllHistory } from "../lib/history";
import { readFavorites, saveToFavorites, removeFromFavorites, isFavorite } from "../lib/favorites";
import { readSettings, updateSetting } from "../lib/settings";
import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { SentenceResults } from "../components/SentenceResults";
import { WordResults } from "../components/WordResults";

export default function Home() {
  const [activeNav, setActiveNav] = useState("dictionary");
  const [analysisMode, setAnalysisMode] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [inlineLoading, setInlineLoading] = useState(false);
  const [error, setError] = useState("");
  const [tableData, setTableData] = useState(null);
  const [currentWord, setCurrentWord] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [settings, setSettings] = useState({ fontSize: "normal", saveHistory: true, hideUnknown: false });
  const [sentenceResults, setSentenceResults] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { 
    setHistory(readHistory()); 
    setFavorites(readFavorites());
    setSettings(readSettings());
  }, []);
  
  const refreshHistory = useCallback(() => setHistory(readHistory()), []);
  const refreshFavorites = useCallback(() => setFavorites(readFavorites()), []);

  const handleToggleFavorite = useCallback((word) => {
    if (isFavorite(word)) removeFromFavorites(word);
    else saveToFavorites(word);
    refreshFavorites();
  }, [refreshFavorites]);

  const handleSettingsChange = (key, val) => {
    updateSetting(key, val);
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const resetAnalysis = useCallback(() => {
    setQuery(""); setTableData(null); setSentenceResults(null); 
    setError(""); setSelectedRow(null);
  }, []);

  const doWordAnalysis = useCallback(async (word, isInline = false) => {
    const w = word.trim().toLowerCase();
    if (!w) return;
    
    if (isInline) setInlineLoading(true);
    else { setLoading(true); setSentenceResults(null); }
    
    setError(""); setTableData(null); setSelectedRow(null);
    setCurrentWord(w);
    
    try {
      const rows = await fetchWordData(w);
      setTableData(rows);
      if (settings.saveHistory) {
         saveToHistory(w, rows.length);
         refreshHistory();
      }
    } catch (e) {
      setError(`Nie znaleziono wyników ("${w}").`);
    } finally {
      setLoading(false);
      setInlineLoading(false);
    }
  }, [refreshHistory]);

  const doSentenceAnalysis = useCallback(async (sentence) => {
    const s = sentence.trim();
    if (!s) return;
    setLoading(true); setError(""); setTableData(null); setSentenceResults(null);
    setCurrentWord(s);
    try {
      const res = await analyzeSentence(s);
      setSentenceResults(res);
      const totalWords = res.filter(r => r.isWord).length;
      if (settings.saveHistory) {
         saveToHistory(s, totalWords);
         refreshHistory();
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [refreshHistory]);

  const handleAnalyze = useCallback((forceWord) => {
    const w = forceWord ?? query;
    if (!w.trim()) return;
    
    const isSentence = w.trim().includes(" ");
    setAnalysisMode(isSentence);
    
    if (isSentence) doSentenceAnalysis(w);
    else doWordAnalysis(w);
  }, [query, doWordAnalysis, doSentenceAnalysis]);

  const handleKeyDown = (e) => { if (e.key === "Enter") handleAnalyze(); };

  const handleExampleClick = (word) => {
    setQuery(word);
    handleAnalyze(word);
  };

  const handleHistoryClick = (word) => {
    setQuery(word);
    handleAnalyze(word);
    setActiveNav("dictionary");
  };

  const deleteHistory = (e, word) => {
    e.stopPropagation();
    removeFromHistory(word); refreshHistory();
  };

  const clearAll = () => {
    clearAllHistory(); refreshHistory();
  };

  const EXAMPLES = ["tworzyć", "bóg", "odmieniać", "wysyłać"];
  const hasResults = tableData && tableData.length > 0;

  return (
    <div className="layout-container">
      {/* ── SIDEBAR ── */}
      <Sidebar 
         activeNav={activeNav} setActiveNav={setActiveNav} 
         resetAnalysis={resetAnalysis} inputRef={inputRef} 
         isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
      />

      <div 
        className={`mobile-backdrop ${isSidebarOpen ? "open" : ""}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* ── MAIN ── */}
      <main className="main-content">
        <TopBar 
          activeNav={activeNav} setActiveNav={setActiveNav} 
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* ── CONTENT ── */}
        <div className="content-padding" style={{ fontSize: settings.fontSize === "large" ? "1.1rem" : "1rem" }}>
          {activeNav === "dictionary" && (
            <>
              <section style={{ maxWidth: "760px", margin: "0 auto 2rem" }}>
                <div style={{
                  background: "var(--surface-container-lowest)",
                  borderRadius: "0.75rem", padding: "2rem",
                  boxShadow: "var(--shadow-ambient)",
                  border: "1px solid rgba(177,179,169,0.1)",
                }}>
                  {/* Input */}
                  <div style={{ position: "relative", marginBottom: "1.25rem" }}>
                    <textarea
                      ref={inputRef}
                      value={query}
                      maxLength={200}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                         if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAnalyze();
                         }
                      }}
                      placeholder="Wpisz słowo lub całe zdanie do analizy…"
                      style={{
                        width: "100%", height: "120px", resize: "none",
                        background: "var(--surface-container-high)",
                        borderRadius: "0.5rem",
                        padding: "1.1rem 1.4rem",
                        fontSize: "1.125rem", fontWeight: 500, fontFamily: "inherit",
                        color: "var(--on-surface)",
                        transition: "all 0.2s",
                      }}
                      onFocus={e => { e.target.style.background = "var(--surface-container-lowest)"; e.target.style.boxShadow = "0 0 0 1px var(--primary)"; }}
                      onBlur={e => { e.target.style.background = "var(--surface-container-high)"; e.target.style.boxShadow = "none"; }}
                    />
                    <div style={{
                      position: "absolute", right: "1rem", bottom: "1rem",
                      display: "flex", alignItems: "center", gap: "1rem", pointerEvents: "none",
                      opacity: 0.5, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      <span style={{ 
                        opacity: query.length >= 200 ? 1 : 0.7, 
                        color: query.length >= 200 ? "var(--error)" : "inherit",
                        fontVariantNumeric: "tabular-nums"
                      }}>
                        {query.length} / 200
                      </span>
                      <div style={{ width: "1px", height: "12px", background: "currentColor", opacity: 0.3 }} />
                      <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        Enter, aby analizować
                        <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>keyboard_return</span>
                      </span>
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
                        <button onClick={resetAnalysis}
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

              {!loading && <SentenceResults sentenceResults={sentenceResults} setQuery={setQuery} doWordAnalysis={doWordAnalysis} />}

              {inlineLoading && sentenceResults && (
                <div style={{ textAlign: "center", padding: "2rem", opacity: 0.5 }}>
                  <div style={{
                    width: "24px", height: "24px", border: "2px solid var(--outline-variant)",
                    borderTopColor: "var(--primary)", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite", margin: "0 auto 0.5rem",
                  }} />
                  <p style={{ fontSize: "0.75rem", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>Analizuję słowo…</p>
                </div>
              )}

              {(!loading && !inlineLoading) && hasResults && (
                <WordResults 
                  tableData={tableData} 
                  currentWord={currentWord} 
                  selectedRow={selectedRow} 
                  setSelectedRow={setSelectedRow} 
                  doWordAnalysis={doWordAnalysis} 
                  inlineLoading={inlineLoading} 
                  sentenceResults={sentenceResults} 
                  isFavorite={favorites.includes(currentWord)}
                  toggleFavorite={handleToggleFavorite}
                />
              )}
            </>
          )}

          {activeNav === "history" && (
            <div style={{ maxWidth: "720px", margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", fontWeight: 700 }}>Historia wyszukiwania</h2>
                  <p style={{ fontSize: "0.8rem", opacity: 0.5, marginTop: "0.25rem" }}>{history.length} {history.length === 1 ? "wyszukiwanie" : "wyszukiwań"}</p>
                </div>
                {history.length > 0 && (
                  <button onClick={clearAll} style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.5, padding: "0.4rem 0.75rem", borderRadius: "0.375rem", color: "var(--error)" }}
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
                      <div>
                        <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.125rem", fontWeight: 700, color: "var(--on-surface)" }}>{item.word}</span>
                        <span style={{ display: "block", fontSize: "0.75rem", opacity: 0.5, marginTop: "0.25rem" }}>
                          {item.count} {item.count === 1 ? "forma" : "form / części zdania"} • {new Date(item.ts).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={(e) => deleteHistory(e, item.word)} style={{ opacity: 0.3, padding: "0.4rem", borderRadius: "0.25rem" }}
                          onMouseEnter={e => e.currentTarget.style.opacity = 1}
                          onMouseLeave={e => e.currentTarget.style.opacity = 0.3}
                        ><span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>delete</span></button>
                        <span className="material-symbols-outlined" style={{ opacity: 0.3, fontSize: "1.2rem", padding: "0.4rem" }}>chevron_right</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeNav === "fav" && (
            <div style={{ maxWidth: "720px", margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", fontWeight: 700 }}>Ulubione słowa</h2>
                  <p style={{ fontSize: "0.8rem", opacity: 0.5, marginTop: "0.25rem" }}>{favorites.length} {favorites.length === 1 ? "pozycja" : "pozycji"}</p>
                </div>
              </div>

              {favorites.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 2rem", opacity: 0.4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>star</span>
                   <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.125rem", fontStyle: "italic" }}>Brak ulubionych.</p>
                   <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>Oznacz gwiazdką dowolne słowo podczas analizy.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  {favorites.map((word) => (
                    <div key={word}
                      onClick={() => handleHistoryClick(word)}
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
                      <div>
                        <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.125rem", fontWeight: 700, color: "var(--on-surface)" }}>{word}</span>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(word); }} style={{ padding: "0.4rem", borderRadius: "0.25rem", color: "#f59e0b" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: "1.2rem", fontVariationSettings: "'FILL' 1" }}>star</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeNav === "settings" && (
            <div style={{ maxWidth: "720px", margin: "0 auto" }}>
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.75rem", fontWeight: 700 }}>Ustawienia</h2>
                <p style={{ fontSize: "0.8rem", opacity: 0.5, marginTop: "0.25rem" }}>Dostosuj zachowanie aplikacji do swoich potrzeb</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Save History */}
                <div style={{ 
                  background: "var(--surface-container-lowest)", padding: "1.5rem", 
                  borderRadius: "0.75rem", border: "1px solid rgba(177,179,169,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.25rem" }}>Zapisuj do historii</h3>
                    <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>Ostatnio wyszukiwane słowa oraz całe zdania będą zapamiętywane w wirtualnej pamięci przeglądarki.</p>
                  </div>
                  <label style={{ position: "relative", display: "inline-block", width: "40px", height: "24px", flexShrink: 0 }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={settings.saveHistory} onChange={(e) => handleSettingsChange("saveHistory", e.target.checked)} />
                    <span style={{ 
                       position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, 
                       backgroundColor: settings.saveHistory ? "var(--primary)" : "var(--outline-variant)", 
                       transition: "0.4s", borderRadius: "24px",
                    }}>
                       <span style={{ 
                         position: "absolute", height: "18px", width: "18px", left: settings.saveHistory ? "19px" : "3px", bottom: "3px", 
                         backgroundColor: settings.saveHistory ? "var(--on-primary)" : "white", transition: "0.4s", borderRadius: "50%",
                       }} />
                    </span>
                  </label>
                </div>

                {/* Font Size */}
                <div style={{ 
                  background: "var(--surface-container-lowest)", padding: "1.5rem", 
                  borderRadius: "0.75rem", border: "1px solid rgba(177,179,169,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.25rem" }}>Zwiększony tekst</h3>
                    <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>Powiększa główne elementy wyników wyszukiwań dla lepszej czytelności tekstów naukowych.</p>
                  </div>
                  <label style={{ position: "relative", display: "inline-block", width: "40px", height: "24px", flexShrink: 0 }}>
                    <input type="checkbox" style={{ opacity: 0, width: 0, height: 0 }} checked={settings.fontSize === "large"} onChange={(e) => handleSettingsChange("fontSize", e.target.checked ? "large" : "normal")} />
                    <span style={{ 
                       position: "absolute", cursor: "pointer", top: 0, left: 0, right: 0, bottom: 0, 
                       backgroundColor: settings.fontSize === "large" ? "var(--primary)" : "var(--outline-variant)", 
                       transition: "0.4s", borderRadius: "24px",
                    }}>
                       <span style={{ 
                         position: "absolute", height: "18px", width: "18px", left: settings.fontSize === "large" ? "19px" : "3px", bottom: "3px", 
                         backgroundColor: settings.fontSize === "large" ? "var(--on-primary)" : "white", transition: "0.4s", borderRadius: "50%",
                       }} />
                    </span>
                  </label>
                </div>

              </div>
            </div>
          )}

          {activeNav === "about" && (
            <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center", opacity: 0.7, lineHeight: 1.6 }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", color: "var(--on-surface)" }}>O aplikacji Gramatyk</h2>
              <p>Gramatyk to zaawansowane narzędzie do parsowania lingwistycznego online.</p>
              <p style={{ fontSize: "0.875rem", opacity: 0.7, marginTop: "1rem" }}>
                 Umożliwia szczegółową dekompozycję zdań lub pojedynczych słów. Algorytmy pod spodem łączą dane ze Słownika Morfologicznego w formy i lemantyzują wyniki, a w razie nieobecności danego wyrazu odpytują ogólnopolski słownik języka polskiego SJP.pl.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
