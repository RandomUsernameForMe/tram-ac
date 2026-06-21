import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Board } from "shared";
import type { Stop, Departure, ScrapedLeg } from "./types.ts";
import { searchStops, stopsByName, departures } from "./api.ts";
import { pickPlatform } from "./resolver.ts";

async function resolveLeg(leg: ScrapedLeg): Promise<{ stop: Stop; deps: Departure[] } | null> {
  const platforms = await stopsByName(leg.stopName);
  const withDeps = await Promise.all(platforms.map(async (stop) => ({ stop, departures: await departures(stop.id) })));
  const chosen = pickPlatform(withDeps, leg);
  const hit = chosen ? withDeps.find((w) => w.stop.id === chosen.id)! : null;
  return hit ? { stop: hit.stop, deps: hit.departures } : null;
}

function App() {
  const [board, setBoard] = useState<{ stop: Stop; deps: Departure[] } | null>(null);
  const [q, setQ] = useState("");
  const [names, setNames] = useState<string[]>([]);
  const [note, setNote] = useState("Searching the route…");

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) { setNote("Search a stop below."); return; }
      chrome.tabs.sendMessage(tab.id, { type: "getRoute" }, async (resp) => {
        const leg: ScrapedLeg | null = chrome.runtime.lastError ? null : resp?.leg ?? null;
        if (!leg) { setNote("No tram leg detected — search a stop below."); return; }
        try {
          const r = await resolveLeg(leg);
          if (r) { setBoard(r); setNote(""); }
          else { setNote(`Couldn't pinpoint the platform for line ${leg.line} → ${leg.destination}. Search below.`); setQ(leg.stopName); }
        } catch { setNote("Lookup failed — search a stop below."); }
      });
    });
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setNames([]); return; }
    let active = true;
    searchStops(q).then((n) => active && setNames(n)).catch(() => {});
    return () => { active = false; };
  }, [q]);

  async function choose(name: string) {
    setNames([]); setQ(name);
    const platforms = await stopsByName(name);
    const withDeps = await Promise.all(platforms.map(async (stop) => ({ stop, deps: await departures(stop.id) })));
    if (withDeps[0]) { setBoard(withDeps[0]); setNote(withDeps.length > 1 ? "Multiple platforms — showing one; pick another below." : ""); }
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: 12, color: "#eaf5f0", background: "#0b3d2e", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 18 }}>PragAC ❄️</h1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a stop…"
        style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }} />
      {names.map((n) => (
        <button key={n} onClick={() => choose(n)} style={{ display: "block", width: "100%", textAlign: "left", padding: 6, background: "none", color: "inherit", border: "none", borderBottom: "1px solid #1f4f3f" }}>{n}</button>
      ))}
      {note && <p style={{ opacity: 0.8 }}>{note}</p>}
      {board && <Board stopName={board.stop.name} platformCode={board.stop.platformCode} departures={board.deps} />}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
