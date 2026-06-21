import type { Departure } from "../types.ts";

const ac = (v: boolean | null) => (v === true ? "🟢" : v === false ? "🔴" : "❓");

export function DepartureRow({ d }: { d: Departure }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1f4f3f" }}>
      <span style={{ fontSize: 22 }}>{ac(d.airConditioned)}</span>
      <strong style={{ minWidth: 32 }}>{d.line}</strong>
      <span style={{ flex: 1, opacity: 0.8 }}>{d.headsign}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{d.minutes} min</span>
    </div>
  );
}
