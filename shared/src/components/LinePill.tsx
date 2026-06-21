import type { CSSProperties } from "react";

export function LinePill({ line, tone = "ink", size = "md", style = {} }: {
  line: string; tone?: "ink" | "cool" | "hot" | "outline"; size?: "sm" | "md" | "lg"; style?: CSSProperties;
}) {
  const sizes = { sm: { font: 13, pad: "2px 8px", min: 26 }, md: { font: 15, pad: "3px 10px", min: 32 }, lg: { font: 20, pad: "5px 13px", min: 42 } };
  const s = sizes[size];
  const tones = {
    ink: { bg: "var(--ink-800)", fg: "#fff" }, cool: { bg: "var(--cool-600)", fg: "#fff" },
    hot: { bg: "var(--hot-500)", fg: "#fff" }, outline: { bg: "transparent", fg: "var(--ink-800)" },
  };
  const t = tones[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: s.min, padding: s.pad, background: t.bg, color: t.fg, border: tone === "outline" ? "1.5px solid var(--ink-800)" : "none", borderRadius: "var(--radius-xs)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: s.font, lineHeight: 1.1, fontVariantNumeric: "tabular-nums", ...style }}>
      {line}
    </span>
  );
}
