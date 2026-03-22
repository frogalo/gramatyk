const transformPolish = (str) => {
  const map = { ć: "_c", ł: "_l", ń: "_n", ś: "_s", ź: "_z_", ż: "_z", ó: "_o", ą: "_a", ę: "_e" };
  let r = "";
  for (const ch of str) r += map[ch] ?? ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return r;
};

export const buildUrl = (word) => {
  const w = word.toLowerCase();
  const t = transformPolish(w);
  const f1 = transformPolish(w.charAt(0));
  const f2 = transformPolish(w.substring(0, 2));
  return `https://www.morfologia.com.pl/${f1}/${f2}/${t}.html`;
};

export const parseMorphTag = (morphText) => {
  const parts = morphText.split(",").map((s) => s.trim()).filter(Boolean);
  const result = {};
  parts.forEach((p, idx) => {
    if (p.includes(":")) {
      const [k, ...v] = p.split(":");
      result[k.trim().toLowerCase()] = v.join(":").trim();
    } else {
      if (idx === 0) {
        result["część mowy"] = p.trim().toLowerCase();
      } else {
        result[p.trim().toLowerCase()] = "tak";
      }
    }
  });
  return result;
};

export const getPOSLabel = (morphObj) => {
  const pos = (morphObj["część mowy"] || "").toLowerCase().trim();
  if (pos.includes("czasownik")) return { label: "Czasownik", variant: "verb" };
  if (pos.includes("rzeczownik")) return { label: "Rzeczownik", variant: "noun" };
  if (pos.includes("przymiotnik")) return { label: "Przymiotnik", variant: "adj" };
  if (pos.includes("liczebnik") || pos.includes("licz.")) return { label: "Liczebnik", variant: "num" };
  if (pos.includes("przysłówek") || pos.includes("przysłów")) return { label: "Przysłówek", variant: "adv" };
  if (pos.includes("zaimek") || pos.includes("zaim.")) return { label: "Zaimek", variant: "pron" };
  if (pos.includes("przyimek") || pos.includes("przyim")) return { label: "Przyimek", variant: "prep" };
  if (pos.includes("spójnik")) return { label: "Spójnik", variant: "conj" };
  if (pos.includes("partykuła")) return { label: "Partykuła", variant: "part" };
  return { label: pos ? pos.charAt(0).toUpperCase() + pos.slice(1) : "—", variant: "other" };
};

export async function fetchWordData(word) {
  const w = word.trim().toLowerCase();
  
  const morfologiaFetch = async (queryWord) => {
    const url = `/api/proxy?disableCache=true&url=${encodeURIComponent(buildUrl(queryWord))}`;
    try {
      const ms = await fetch(url);
      if (ms.ok) {
         const html = await ms.text();
         if (html) {
            const doc = new DOMParser().parseFromString(html, "text/html");
            const rows = Array.from(doc.querySelectorAll("table tr"))
              .filter((r) => r.querySelectorAll("td").length > 0)
              .map((r) => {
                const cells = r.querySelectorAll("td");
                return { word: cells[0]?.textContent.trim(), morphText: cells[1]?.textContent.trim() };
              })
              .filter((r) => r.word && r.morphText);
            if (rows.length > 0) return rows;
         }
      }
    } catch (_) {}
    return null;
  };

  const primaryRows = await morfologiaFetch(w);
  if (primaryRows) return primaryRows;

  const sjpUrl = `/api/proxy?disableCache=true&url=${encodeURIComponent(`https://sjp.pl/${encodeURIComponent(w)}`)}`;
  const sr = await fetch(sjpUrl);
  if (!sr.ok) throw new Error("Brak wyników w słownikach");
  const sjpBody = await sr.text();
  const sjpDoc = new DOMParser().parseFromString(sjpBody, "text/html");
  const wtab = sjpDoc.querySelector("table.wtab");
  
  if (!wtab) {
     // If SJP has no table, extract root word candidates from links
     const candidateLinks = Array.from(sjpDoc.querySelectorAll("a")).map(a => a.textContent.trim());
     const possibleLemmas = candidateLinks.filter(cand => 
         cand && cand.toLowerCase() !== w && cand.length > 1 && 
         /^[a-ząćęłńóśźż]+$/i.test(cand) &&
         !["sjp", "lista", "komentarze", "więcej", "info", "twitter"].includes(cand.toLowerCase())
     );
     for (let i = 0; i < Math.min(4, possibleLemmas.length); i++) {
         const rescueRows = await morfologiaFetch(possibleLemmas[i].toLowerCase());
         if (rescueRows) return rescueRows;
     }
     throw new Error("Brak wyników w słownikach");
  }
  
  let lemma = "";
  const alcNodes = Array.from(sjpDoc.querySelectorAll("a.lc")).map(n => n.textContent.trim());
  if (alcNodes.length > 0) lemma = alcNodes[0];
  if (!lemma) {
     const titleRow = Array.from(sjpDoc.querySelectorAll("table.wtab tr")).find(tr => !tr.querySelector("td") && tr.querySelector("th"));
     if (titleRow) lemma = titleRow.textContent.trim();
  }
  lemma = lemma || sjpDoc.querySelector("h1")?.textContent.trim() || w;

  const sjpFormsMap = new Map();
  sjpFormsMap.set(lemma, "lemat (SJP)");
  
  const sjpCodeMap = {
    "B": { f: "rozkazujący", pos: "czasownik" },
    "H": { f: "przeszły, przypuszczający", pos: "czasownik" },
    "e": { f: "bezosobowa forma przeszła", pos: "czasownik" },
    "~": { f: "imiesłowy", pos: "czasownik" },
    "J": { f: "teraźniejszy/przyszły", pos: "czasownik" },
    "I": { f: "teraźniejszy/przyszły", pos: "czasownik" },
    "E (+b)": { f: "imiesłów przymiotnikowy", pos: "przymiotnik" },
    "E": { f: "imiesłów przymiotnikowy", pos: "przymiotnik" },
    "j (+b)": { f: "bezokolicznik/rzecz. odczasownikowy", pos: "czasownik" },
    "j": { f: "bezokolicznik/rzecz. odczasownikowy", pos: "czasownik" },
    "K": { f: "przymiotnik", pos: "przymiotnik" },
    "X": { f: "przymiotnik", pos: "przymiotnik" },
    "Y": { f: "przymiotnik", pos: "przymiotnik" },
    "x": { f: "przymiotnik", pos: "przymiotnik" },
    "y": { f: "przysłówek", pos: "przysłówek" },
    "b": { f: "przeczenie", pos: "przymiotnik" }
  };

  sjpDoc.querySelectorAll("table.wtab tr").forEach(tr => {
      const th = tr.querySelector("th");
      const td = tr.querySelector("td");
      if (th && td && th.querySelector("tt")) {
          const code = th.querySelector("tt").textContent.trim();
          const mapD = sjpCodeMap[code] || { f: `kod (${code})`, pos: "—" };
          
          td.textContent.split(",").map(s => s.trim()).forEach(f => {
              if (f && !sjpFormsMap.has(f)) {
                 sjpFormsMap.set(f, mapD);
              }
          });
      }
  });

  // Try to find actual POS from Morfologia using candidates
  let resolvedPos = "—";
  const tryWords = [...new Set([...alcNodes, lemma])].filter(c => c && c !== w);
  for (const cand of tryWords) {
     const rescueRows = await morfologiaFetch(cand);
     if (rescueRows && rescueRows.length > 0) {
         const parsed = parseMorphTag(rescueRows[0].morphText || "");
         if (parsed["część mowy"]) {
             resolvedPos = parsed["część mowy"];
             break;
         }
     }
  }
  
  return Array.from(sjpFormsMap.entries()).map(([f, mapD]) => ({ 
      word: f, 
      morphText: `część mowy: ${resolvedPos !== "—" ? resolvedPos : mapD.pos}, cechy: ${mapD.f}` 
  }));
}

export async function analyzeSentence(sentence) {
  const tokens = [];
  const regex = /([\p{L}]+)|([^\p{L}]+)/gu;
  let match;
  while ((match = regex.exec(sentence)) !== null) {
    if (match[1]) tokens.push({ text: match[1], isWord: true });
    else tokens.push({ text: match[2], isWord: false });
  }

  if (!tokens.some(t => t.isWord)) throw new Error("Nie znaleziono słów");

  const fetchMorfologia = async (w) => {
    const morfologiaUrl = `/api/proxy?disableCache=true&url=${encodeURIComponent(buildUrl(w))}`;
    try {
      const ms = await fetch(morfologiaUrl);
      if (ms.ok) {
         const html = await ms.text();
         if (html) {
            const doc = new DOMParser().parseFromString(html, "text/html");
            const allRows = Array.from(doc.querySelectorAll("table tr")).filter(r => r.querySelectorAll("td").length > 0);
            if (allRows.length > 0) {
              const lemma = allRows[0].querySelectorAll("td")[0]?.textContent.trim();
              const rowWithData = allRows.find(r => r.querySelectorAll("td")[1]?.textContent.trim());
              const morphText = rowWithData ? rowWithData.querySelectorAll("td")[1].textContent.trim() : "";
              const morphData = morphText ? parseMorphTag(morphText) : {};
              if (morphText) {
                return { found: true, lemma: lemma || w, morphData };
              }
            }
         }
      }
    } catch (_) {}
    return null;
  };

  return Promise.all(tokens.map(async (token) => {
    if (!token.isWord) return token;
    
    const word = token.text.toLowerCase();
    
    let mData = await fetchMorfologia(word);
    if (mData) {
      return { ...token, ...mData };
    }
    
    // Fallback SJP
    try {
      const sjpUrl = `/api/proxy?disableCache=true&url=${encodeURIComponent(`https://sjp.pl/${encodeURIComponent(word)}`)}`;
      const sr = await fetch(sjpUrl);
      if (sr.ok) {
         const sjpBody = await sr.text();
         if (sjpBody) {
            const sjpDoc = new DOMParser().parseFromString(sjpBody, "text/html");
            const wtab = sjpDoc.querySelector("table.wtab");
            if (wtab) {
               let sjpLemma = "";
               const alcNodes = Array.from(sjpDoc.querySelectorAll("a.lc")).map(n => n.textContent.trim());
               if (alcNodes.length > 0) sjpLemma = alcNodes[0];
               if (!sjpLemma) {
                  const titleRow = Array.from(sjpDoc.querySelectorAll("table.wtab tr")).find(tr => !tr.querySelector("td") && tr.querySelector("th"));
                  if (titleRow) sjpLemma = titleRow.textContent.trim();
               }
               sjpLemma = sjpLemma || sjpDoc.querySelector("h1")?.textContent.trim() || word;
               
               const sjpCodeMap = {
                  "B": { f: "rozkazujący", pos: "czasownik" },
                  "H": { f: "przeszły, przypuszczający", pos: "czasownik" },
                  "e": { f: "bezosobowa forma przeszła", pos: "czasownik" },
                  "~": { f: "imiesłowy", pos: "czasownik" },
                  "J": { f: "teraźniejszy/przyszły", pos: "czasownik" },
                  "I": { f: "teraźniejszy/przyszły", pos: "czasownik" },
                  "E (+b)": { f: "imiesłów przymiotnikowy", pos: "przymiotnik" },
                  "E": { f: "imiesłów przymiotnikowy", pos: "przymiotnik" },
                  "j (+b)": { f: "bezokolicznik/rzecz. odczasownikowy", pos: "czasownik" },
                  "j": { f: "bezokolicznik/rzecz. odczasownikowy", pos: "czasownik" },
                  "K": { f: "przymiotnik", pos: "przymiotnik" },
                  "X": { f: "przymiotnik", pos: "przymiotnik" },
                  "Y": { f: "przymiotnik", pos: "przymiotnik" },
                  "x": { f: "przymiotnik", pos: "przymiotnik" },
                  "y": { f: "przysłówek", pos: "przysłówek" },
                  "b": { f: "przeczenie", pos: "przymiotnik" }
               };
               
               let foundSjpFeatures = "SJP.pl";
               let inferredPos = "—";
               let xWords = [];

               sjpDoc.querySelectorAll("table.wtab tr").forEach(tr => {
                  const th = tr.querySelector("th");
                  const td = tr.querySelector("td");
                  if (th && td) {
                     const thText = th.textContent.trim();
                     if (thText === "x" || thText === "y" || thText === "z") {
                        const w = td.textContent.split(",")[0].trim();
                        if (w) xWords.push(w);
                     }
                     const tt = th.querySelector("tt");
                     if (tt) {
                        const code = tt.textContent.trim();
                        const cellWords = td.textContent.split(",").map(s => s.trim());
                        if (cellWords.includes(word) && sjpCodeMap[code]) {
                            foundSjpFeatures = sjpCodeMap[code].f;
                            inferredPos = sjpCodeMap[code].pos;
                        }
                     }
                  }
               });

               let morphData = { "część mowy": inferredPos, "cechy": foundSjpFeatures };

               // Retry in Morfologia to resolve unknown POS
               const tryWords = [...new Set([...alcNodes, sjpLemma, ...xWords])].filter(w => w && w !== word);
               for (const cand of tryWords) {
                  const retryData = await fetchMorfologia(cand);
                  if (retryData && retryData.morphData && retryData.morphData["część mowy"]) {
                      morphData["część mowy"] = retryData.morphData["część mowy"];
                      break;
                  }
               }
               
               return { ...token, found: true, lemma: sjpLemma, morphData, fromSJP: true };
            } else {
               const candidateLinks = Array.from(sjpDoc.querySelectorAll("a")).map(a => a.textContent.trim());
               const possibleLemmas = candidateLinks.filter(cand => 
                   cand && cand.toLowerCase() !== word && cand.length > 1 && 
                   /^[a-ząćęłńóśźż]+$/i.test(cand) &&
                   !["sjp", "lista", "komentarze", "więcej", "info", "twitter"].includes(cand.toLowerCase())
               );
               for (let i = 0; i < Math.min(4, possibleLemmas.length); i++) {
                   const candLemma = possibleLemmas[i].toLowerCase();
                   const rescueData = await fetchMorfologia(candLemma);
                   if (rescueData && rescueData.morphData && rescueData.morphData["część mowy"]) {
                       return { ...token, found: true, lemma: candLemma, morphData: rescueData.morphData, fromSJP: true };
                   }
               }
            }
         }
      }
    } catch (_) {}
    
    return { ...token, found: false };
  }));
}
