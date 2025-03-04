"use client";

import {useState} from "react";
import Head from "next/head";
import "../styles/index.css"; // Ensure the CSS file exists in the styles folder

export default function Home() {
    const [verb, setVerb] = useState("");
    const [tableData, setTableData] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Transform Polish characters into specific strings for the filename and folder parts.
    const transformPolish = (str) => {
        const specialMap = {
            "ć": "_c",
            "ł": "_l",
            "ń": "_n",
            "ś": "_s",
            "ź": "_z",
            "ż": "_z",
            "ó": "_o",
        };

        let result = "";
        for (const ch of str) {
            if (specialMap[ch]) {
                result += specialMap[ch];
            } else {
                // For other letters, remove diacritics.
                result += ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            }
        }
        return result;
    };

    // Fetches the page, parses the table, and creates a data structure.
    const generateAndFetchTable = () => {
        if (!verb.trim()) {
            setTableData(null);
            return;
        }
        setLoading(true);
        setError("");
        setTableData(null);

        const lowerVerb = verb.trim().toLowerCase();

        // Compute transformed verb (preserving underscores for Polish letters)
        const transformedVerb = transformPolish(lowerVerb);

        // For folder parts, use the transformed version.
        const folder1 = transformedVerb.charAt(0);
        let folder2;
        if (transformedVerb.includes("_")) {
            // Find the first occurrence of "_" and take characters up to index + 2.
            const idx = transformedVerb.indexOf("_");
            folder2 = transformedVerb.slice(0, idx + 2);
        } else {
            folder2 = transformedVerb.slice(0, 2);
        }

        // Generate target URL using the transformed word for the filename.
        const targetUrl = `https://www.morfologia.com.pl/${folder1}/${folder2}/${transformedVerb}.html`;
        // Use our API route (serverless function) to bypass CORS issues.
        const proxyUrl = `/api/proxy?disableCache=true&url=${encodeURIComponent(
            targetUrl
        )}`;

        fetch(proxyUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Błąd sieci");
                }
                return response.text();
            })
            .then((html) => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");
                const table = doc.querySelector("table");
                if (table) {
                    const rows = Array.from(table.querySelectorAll("tr"));
                    const dataRows = rows.filter(
                        (row) => row.querySelectorAll("td").length > 0
                    );
                    if (dataRows.length === 0) {
                        setError("Nie znaleziono wyników.");
                    } else {
                        const parsedData = dataRows.map((row) => {
                            const cells = row.querySelectorAll("td");
                            const word = cells[0]?.textContent.trim();
                            const morphText = cells[1]?.textContent.trim();
                            return {word, morphText};
                        });
                        const validRows = parsedData.filter(
                            (row) => row.word && row.morphText
                        );
                        if (validRows.length === 0) {
                            setError("Brak wyników");
                            setTableData(null);
                        } else {
                            setTableData(validRows);
                        }
                    }
                } else {
                    setError("Nie znaleziono tabeli.");
                }
                setLoading(false);
            })
            .catch((err) => {
                setError(`Błąd przy pobieraniu zawartości: ${err.message}`);
                setLoading(false);
            });
    };

    // Format the morphological text into a collection of <span> elements.
    const formatMorph = (morphText) => {
        // Split by comma, trim each part, and filter out empty strings.
        const parts = morphText
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s !== "");
        return parts.map((part, index) => {
            const [key, ...rest] = part.split(":");
            const value = rest.join(":").trim();
            let className = "morph-box";
            if (key.toLowerCase() === "część mowy") {
                className += " morph-czesc-mowy";
            } else if (key.toLowerCase() === "liczba") {
                className += " morph-liczba";
            }
            // } else if (key.toLowerCase() === "rodzaj") {
            //     className += " morph-rodzaj";
            // }
            return (
                <span key={index} className={className}>
          {value}
        </span>
            );
        });
    };

    // Handle Enter key press
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            generateAndFetchTable();
        }
    };

    return (
        <div className="container">
            <Head>
                <title>Gramatyk</title>
            </Head>
            <h1>Gramatyk</h1>
            <p>Podaj słowo (np. tworzyć, wysyłać, odmieniać, zgon, bóg):</p>
            <div className="input-group">
                <input
                    type="text"
                    value={verb}
                    onChange={(e) => setVerb(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="np. tworzyć"
                    className="input"
                />
                <button onClick={generateAndFetchTable} className="generate-button">
                    Pobierz tabelę
                </button>
            </div>
            {loading && <p style={{textAlign: "center"}}>Ładowanie...</p>}
            {error && <p style={{textAlign: "center"}}>{error}</p>}
            {tableData && (
                <div className="result">
                    <table>
                        <thead>
                        <tr>
                            <th>Słowo</th>
                            <th>Odmiana morfologiczna</th>
                        </tr>
                        </thead>
                        <tbody>
                        {tableData.map((row, index) => (
                            <tr key={index}>
                                <td>{row.word}</td>
                                <td>{formatMorph(row.morphText)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
