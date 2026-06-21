import type { Stop } from "../types.ts";

export function StopList({ stops, onPick }: { stops: Stop[]; onPick: (s: Stop) => void }) {
  return (
    <div>
      <h2>Nearby stops</h2>
      {stops.map((s) => (
        <button key={s.aswId} onClick={() => onPick(s)}
          style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 0", background: "none", color: "inherit", border: "none", borderBottom: "1px solid #1f4f3f" }}>
          {s.name} {s.distanceM != null && <span style={{ opacity: 0.6 }}>· {s.distanceM} m</span>}
        </button>
      ))}
    </div>
  );
}
