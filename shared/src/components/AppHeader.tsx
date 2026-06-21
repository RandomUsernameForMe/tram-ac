import { Badge } from "./Badge.tsx";

// PragAC wordmark lockup + thermal underline + optional live badge / back button.
// markSrc / stripesSrc let each app point at its own public asset path.
export function AppHeader({ onBack, live = false, title, subtitle, markSrc, stripesSrc }: {
  onBack?: () => void; live?: boolean; title?: string; subtitle?: string; markSrc: string; stripesSrc: string;
}) {
  return (
    <div style={{ flex: "none", background: "var(--surface-card)", borderBottom: "1px solid var(--border-subtle)" }}>
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
          {onBack ? (
            <button onClick={onBack} aria-label="Zpět" style={{ flex: "none", width: 38, height: 38, borderRadius: 999, border: "1px solid var(--border-subtle)", background: "var(--surface-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-800)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
          ) : (
            <img src={markSrc} width="34" height="34" alt="" style={{ flex: "none" }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {title ? (
              <>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
                {subtitle && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{subtitle}</div>}
              </>
            ) : (
              <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>Prag<span style={{ color: "var(--cool-600)" }}>AC</span></div>
            )}
          </div>
          {live && <Badge tone="live">Živě</Badge>}
        </div>
        <div style={{ height: 6, background: "var(--ink-900)" }}>
          <img src={stripesSrc} alt="" style={{ display: "block", width: "100%", height: "100%", objectFit: "fill" }} />
        </div>
      </div>
    </div>
  );
}
