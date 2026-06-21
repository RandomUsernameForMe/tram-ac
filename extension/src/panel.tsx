import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Badge, LinePill, StatusPill, DecisionBanner, Input, StopRow, decide } from "shared";
import type { Stop, Departure, ScrapedLeg } from "./types.ts";
import { searchStops, stopsByName, departures } from "./api.ts";
import { pickPlatform } from "./resolver.ts";

const MARK = "/assets/pragac-mark.svg";
const STRIPES = "/assets/warming-stripes.svg";

async function resolveLeg(leg: ScrapedLeg): Promise<{ stop: Stop; deps: Departure[] } | null> {
  const platforms = await stopsByName(leg.stopName);
  const withDeps = await Promise.all(platforms.map(async (stop) => ({ stop, departures: await departures(stop.id) })));
  const chosen = pickPlatform(withDeps, leg);
  const hit = chosen ? withDeps.find((w) => w.stop.id === chosen.id)! : null;
  return hit ? { stop: hit.stop, deps: hit.departures } : null;
}

function Header({ stopName, line }: { stopName?: string; line?: string }) {
  const sub = stopName ? `${stopName}${line ? " · linka " + line : ""}` : "Najdi zastávku níže";
  return (
    <div style={{ flex: "none", background: "var(--surface-card)", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" }}>
        <img src={MARK} width="30" height="30" alt="" style={{ flex: "none" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-strong)" }}>Klima na lince</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</div>
        </div>
        <Badge tone="live">Živě</Badge>
      </div>
      <div style={{ height: 5, background: "var(--ink-900)" }}><img src={STRIPES} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "fill" }} /></div>
    </div>
  );
}

function Row({ d, planned }: { d: Departure; planned: boolean }) {
  const tint = d.airConditioned === true ? "var(--cool-50)" : d.airConditioned === false ? "var(--hot-50)" : "transparent";
  const edge = d.airConditioned === true ? "var(--cool-400)" : d.airConditioned === false ? "var(--hot-400)" : "var(--slate-300)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", background: planned ? tint : "var(--surface-card)", borderLeft: `3px solid ${planned ? edge : "transparent"}`, borderBottom: "1px solid var(--border-subtle)" }}>
      <LinePill line={d.line} size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.headsign}</div>
        <div style={{ marginTop: 3 }}><StatusPill status={d.airConditioned} size="sm" /></div>
      </div>
      {planned && <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-faint)", flex: "none" }}>Tvůj</span>}
      <div style={{ flex: "none", textAlign: "right" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 21, color: "var(--ink-900)", fontVariantNumeric: "tabular-nums" }}>{d.minutes}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", marginLeft: 2 }}>min</span>
      </div>
    </div>
  );
}

function App() {
  const [board, setBoard] = useState<{ stop: Stop; deps: Departure[] } | null>(null);
  const [legLine, setLegLine] = useState<string | undefined>(undefined);
  const [q, setQ] = useState("");
  const [names, setNames] = useState<string[]>([]);
  const [note, setNote] = useState("Hledám trasu…");

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) { setNote("Najdi zastávku níže."); return; }
      chrome.tabs.sendMessage(tab.id, { type: "getRoute" }, async (resp) => {
        const leg: ScrapedLeg | null = chrome.runtime.lastError ? null : resp?.leg ?? null;
        if (!leg) { setNote("Žádná tramvajová trasa — najdi zastávku níže."); return; }
        setLegLine(leg.line);
        try {
          const r = await resolveLeg(leg);
          if (r) { setBoard(r); setNote(""); }
          else { setNote(`Nelze určit nástupiště pro linku ${leg.line} → ${leg.destination}. Hledej níže.`); setQ(leg.stopName); }
        } catch { setNote("Načtení selhalo — najdi zastávku níže."); }
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
    if (withDeps[0]) { setBoard(withDeps[0]); setNote(withDeps.length > 1 ? "Více nástupišť — zobrazeno jedno." : ""); }
  }

  const decision = board ? decide(board.deps) : null;
  const sorted = board ? [...board.deps].sort((a, b) => a.minutes - b.minutes) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--surface-page)", fontFamily: "var(--font-ui)" }}>
      <Header stopName={board?.stop.name} line={legLine} />
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hledat zastávku…" iconLeft={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>} />
        {names.length > 0 && (
          <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {names.map((n) => <StopRow key={n} name={n} onClick={() => choose(n)} />)}
          </div>
        )}
        {decision && <DecisionBanner {...decision} />}
        {note && !board && <div style={{ padding: "11px 13px", background: "var(--slate-100)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", color: "var(--slate-600)", fontSize: 12.5, lineHeight: 1.45 }}>{note}</div>}
        {board && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 2px 8px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", color: "var(--text-accent)" }}>Nejbližší odjezdy</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-muted)" }}>auto · 10 s</span>
            </div>
            <div style={{ background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
              {sorted.map((d, i) => <Row key={i} d={d} planned={d.line === legLine} />)}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, color: "var(--text-faint)", fontSize: 11.5, lineHeight: 1.5, padding: "0 2px 4px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          PragAC čte živá data PID. Klima se ukáže jen pro spoje v dispečerském okně.
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
