import type { Stop, Departure } from "shared";
import { AppHeader, DepartureRow, DecisionBanner, decide } from "shared";

const MARK = "/assets/pragac-mark.svg";
const STRIPES = "/assets/warming-stripes.svg";

export function BoardScreen({ stop, board, onBack }: { stop: Stop; board: Departure[]; onBack: () => void }) {
  const decision = decide(board);
  const sub = `${stop.platformCode ? "Nástupiště " + stop.platformCode + " · " : ""}${stop.distanceM != null ? stop.distanceM + " m" : ""}`.trim();
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppHeader onBack={onBack} live title={stop.name} subtitle={sub || undefined} markSrc={MARK} stripesSrc={STRIPES} />
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ padding: "16px 16px 8px" }}>
          {decision && <DecisionBanner {...decision} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 6px" }}>
          <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-accent)" }}>Nejbližší odjezdy</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pragSpin 3.5s linear infinite" }}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
            auto · 10 s
          </span>
        </div>
        <div style={{ margin: "0 12px", background: "var(--surface-card)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
          {board.length === 0 ? <div style={{ padding: 20, color: "var(--text-muted)" }}>Žádné nejbližší odjezdy.</div>
            : board.map((d, i) => (<DepartureRow key={i} line={d.line} headsign={d.headsign} minutes={d.minutes} airConditioned={d.airConditioned} highlight={i < 2} />))}
        </div>
        <div style={{ display: "flex", gap: 8, padding: "14px 18px 22px", color: "var(--text-faint)", fontSize: 12, lineHeight: 1.5 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 1 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          Data o klimatizaci z Golemio / PID. „Neznámo" znamená, že vůz ještě nebyl přiřazen — nikdy nehádáme zeleně.
        </div>
      </div>
    </div>
  );
}
