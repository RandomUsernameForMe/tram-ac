import type { CSSProperties } from "react";

function Snowflake({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="3" x2="12" y2="21" /><line x1="4.2" y1="7.5" x2="19.8" y2="16.5" /><line x1="4.2" y1="16.5" x2="19.8" y2="7.5" />
      <path d="M12 5.6 l-2 -2 M12 5.6 l2 -2 M12 18.4 l-2 2 M12 18.4 l2 2" />
    </svg>
  );
}
function Flame({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d="M13 1.6c.8 3.4-1.5 4.8-1.5 7.1 0 1.1.8 1.9 1.7 1.9 1 0 1.6-.7 1.7-1.8 1.8 1.5 3.1 3.7 3.1 6.2a6 6 0 0 1-12 0c0-2.4 1.2-4.3 2.4-5.9.2 1.1 1 1.8 1.9 1.8-1.4-2.7-.6-6 2.8-9.3Z" /></svg>;
}
function Unknown({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.2 9a2.8 2.8 0 1 1 4.3 2.4c-.9.6-1.5 1-1.5 2.1" /><line x1="12" y1="17" x2="12" y2="17" /></svg>;
}

export function StatusPill({ status, size = "md", showLabel = true, style = {} }: {
  status: boolean | null; size?: "sm" | "md" | "lg"; showLabel?: boolean; style?: CSSProperties;
}) {
  const cfg = status === true
    ? { bg: "var(--status-ac-soft)", fg: "var(--status-ac-ink)", dot: "var(--status-ac)", Glyph: Snowflake, label: "Klima" }
    : status === false
    ? { bg: "var(--status-noac-soft)", fg: "var(--status-noac-ink)", dot: "var(--status-noac)", Glyph: Flame, label: "Bez klimy" }
    : { bg: "var(--status-unknown-soft)", fg: "var(--status-unknown-ink)", dot: "var(--status-unknown)", Glyph: Unknown, label: "Neznámo" };
  const sizes = { sm: { pad: "3px 9px", gap: 5, font: 11, glyph: 13 }, md: { pad: "5px 12px", gap: 7, font: 13, glyph: 16 }, lg: { pad: "8px 16px", gap: 9, font: 15, glyph: 20 } };
  const s = sizes[size];
  const { Glyph } = cfg;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: s.gap, background: cfg.bg, color: cfg.fg, borderRadius: "var(--radius-pill)", padding: s.pad, fontFamily: "var(--font-ui)", fontWeight: 600, fontSize: s.font, lineHeight: 1, whiteSpace: "nowrap", ...style }}>
      <Glyph size={s.glyph} color={cfg.dot} />{showLabel && cfg.label}
    </span>
  );
}
