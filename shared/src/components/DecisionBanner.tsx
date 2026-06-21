import type { CSSProperties, ReactNode } from "react";
import { LinePill } from "./LinePill.tsx";

function BgSnow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" style={{ position: "absolute", right: -18, bottom: -28, width: 190, height: 190, opacity: 0.14, transform: "rotate(8deg)" }}>
      <line x1="12" y1="2" x2="12" y2="22" /><line x1="3.3" y1="7" x2="20.7" y2="17" /><line x1="3.3" y1="17" x2="20.7" y2="7" />
      <path d="M12 4.5l-2-2M12 4.5l2-2M12 19.5l-2 2M12 19.5l2 2M4.6 7.8l-2.6.2M4.6 7.8l.2-2.6M19.4 16.2l2.6-.2M19.4 16.2l-.2 2.6M4.6 16.2l-2.6-.2M4.6 16.2l.2 2.6M19.4 7.8l2.6.2M19.4 7.8l-.2-2.6" />
    </svg>
  );
}
function BgFlame() {
  return <svg viewBox="0 0 24 24" fill="#fff" style={{ position: "absolute", right: -16, bottom: -30, width: 190, height: 190, opacity: 0.15, transform: "rotate(-6deg)" }}><path d="M13 1.6c.8 3.4-1.5 4.8-1.5 7.1 0 1.1.8 1.9 1.7 1.9 1 0 1.6-.7 1.7-1.8 1.8 1.5 3.1 3.7 3.1 6.2a6 6 0 0 1-12 0c0-2.4 1.2-4.3 2.4-5.9.2 1.1 1 1.8 1.9 1.8-1.4-2.7-.6-6 2.8-9.3Z" /></svg>;
}

export type DecisionTone = "cool" | "hot" | "unknown";
export interface Decision { tone: DecisionTone; eyebrow: string; title: string; detail?: string; minutes?: number; line?: string; }

export function DecisionBanner({ tone = "cool", eyebrow, title, detail, minutes, line, style = {} }: Decision & { style?: CSSProperties }) {
  const cfg = {
    cool: { bg: "var(--blaze-ice)", accent: "#bfe9ff", soft: "rgba(255,255,255,0.16)", glow: "var(--glow-cool)", Bg: BgSnow },
    hot: { bg: "var(--blaze-fire)", accent: "#ffd9c2", soft: "rgba(255,255,255,0.18)", glow: "var(--glow-hot)", Bg: BgFlame },
    unknown: { bg: "var(--slate-600)", accent: "var(--slate-100)", soft: "rgba(255,255,255,0.14)", glow: "var(--shadow-md)", Bg: null as null | (() => ReactNode) },
  }[tone];
  const Bg = cfg.Bg;
  return (
    <div style={{ position: "relative", background: cfg.bg, color: "#fff", borderRadius: "var(--radius-xl)", padding: "22px 24px", boxShadow: cfg.glow, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "var(--thermal-strip-h)", background: "var(--thermal-strip)" }} />
      {Bg && <Bg />}
      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          {eyebrow && <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: cfg.accent, marginBottom: 10 }}>{eyebrow}</div>}
          <div style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.02, textShadow: "0 2px 16px rgba(0,0,0,0.28)" }}>{title}</div>
          {detail && <div style={{ marginTop: 10, fontSize: 15, color: "rgba(255,255,255,0.9)", lineHeight: 1.45 }}>{detail}</div>}
          {line && <div style={{ marginTop: 16 }}><LinePill line={line} tone="outline" style={{ background: cfg.soft, color: "#fff", borderColor: "rgba(255,255,255,0.5)" }} /></div>}
        </div>
        {minutes != null && (
          <div style={{ flex: "none", textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 58, lineHeight: 1, color: "#fff", fontVariantNumeric: "tabular-nums", textShadow: "0 2px 18px rgba(0,0,0,0.32)" }}>{minutes}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: cfg.accent }}>min</div>
          </div>
        )}
      </div>
    </div>
  );
}
