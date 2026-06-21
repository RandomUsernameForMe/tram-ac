import { useState } from "react";
import type { Stop } from "shared";
import { AppHeader, SegmentedControl, Input, StopRow } from "shared";

const MARK = "/assets/pragac-mark.svg";
const STRIPES = "/assets/warming-stripes.svg";

export function StopsScreen({ stops, onPick }: { stops: Stop[]; onPick: (s: Stop) => void }) {
  const [tab, setTab] = useState("near");
  const [q, setQ] = useState("");
  const filtered = tab === "near" ? stops : stops.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppHeader live markSrc={MARK} stripesSrc={STRIPES} />
      <div style={{ flex: "none", padding: "16px 16px 10px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>{tab === "near" ? "Zastávky poblíž" : "Najít zastávku"}</div>
        <SegmentedControl value={tab} onChange={setTab} style={{ alignSelf: "flex-start" }} options={[{ value: "near", label: "Poblíž" }, { value: "search", label: "Hledat" }]} />
        {tab === "search" && (
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Název zastávky…" iconLeft={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>} />
        )}
        {tab === "near" && (
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-muted)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--cool-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="4" /></svg>
            Poloha přibližná · řazeno dle vzdálenosti
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, color: "var(--text-muted)", fontSize: 15 }}>Žádná zastávka neodpovídá „{q}".</div>
        ) : (
          filtered.map((s) => (<StopRow key={s.id} name={s.name} platformCode={s.platformCode} distanceM={s.distanceM} onClick={() => onPick(s)} />))
        )}
      </div>
    </div>
  );
}
