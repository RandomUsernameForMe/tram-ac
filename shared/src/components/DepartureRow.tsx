import type { CSSProperties } from "react";
import { LinePill } from "./LinePill.tsx";
import { StatusPill } from "./StatusPill.tsx";

export function DepartureRow({ line, headsign, minutes, airConditioned, highlight = false, onClick, style = {} }: {
  line: string; headsign: string; minutes: number; airConditioned: boolean | null;
  highlight?: boolean; onClick?: () => void; style?: CSSProperties;
}) {
  const tint = airConditioned === true ? "var(--cool-50)" : airConditioned === false ? "var(--hot-50)" : "transparent";
  const edge = airConditioned === true ? "var(--cool-400)" : airConditioned === false ? "var(--hot-400)" : "var(--slate-300)";
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: highlight ? tint : "var(--surface-card)", borderLeft: `3px solid ${highlight ? edge : "transparent"}`, borderBottom: "1px solid var(--border-subtle)", cursor: onClick ? "pointer" : "default", transition: "background var(--dur-base) var(--ease-out)", ...style }}>
      <LinePill line={line} size="md" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-ui)", fontSize: 16, fontWeight: 600, color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{headsign}</div>
        <div style={{ marginTop: 4 }}><StatusPill status={airConditioned} size="sm" /></div>
      </div>
      <div style={{ textAlign: "right", flex: "none" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 26, color: "var(--ink-900)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{minutes}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginLeft: 3 }}>min</span>
      </div>
    </div>
  );
}
