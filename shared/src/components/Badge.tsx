import type { CSSProperties, ReactNode } from "react";

type Tone = "cool" | "hot" | "neutral" | "live";

export function Badge({ children, tone = "neutral", fill = "soft", style = {} }: {
  children?: ReactNode; tone?: Tone; fill?: "soft" | "solid"; style?: CSSProperties;
}) {
  const map: Record<Tone, Record<"soft" | "solid", [string, string]>> = {
    cool: { soft: ["var(--cool-50)", "var(--cool-700)"], solid: ["var(--cool-500)", "#fff"] },
    hot: { soft: ["var(--hot-50)", "var(--hot-700)"], solid: ["var(--hot-500)", "#fff"] },
    neutral: { soft: ["var(--slate-100)", "var(--slate-600)"], solid: ["var(--ink-800)", "#fff"] },
    live: { soft: ["var(--cool-50)", "var(--cool-700)"], solid: ["var(--cool-600)", "#fff"] },
  };
  const [bg, fg] = map[tone][fill];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: bg, color: fg, fontFamily: "var(--font-ui)", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", padding: "3px 9px", borderRadius: "var(--radius-pill)", lineHeight: 1.4, whiteSpace: "nowrap", ...style }}>
      {tone === "live" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: fill === "solid" ? "#fff" : "var(--cool-500)", animation: "pragPulse 1.6s var(--ease-in-out) infinite" }} />}
      {children}
    </span>
  );
}
