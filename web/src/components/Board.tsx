import type { Departure } from "../types.ts";
import { DepartureRow } from "./DepartureRow.tsx";

export function Board({ stopName, departures, onBack }: { stopName: string; departures: Departure[]; onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: 12 }}>← stops</button>
      <h2>{stopName}</h2>
      {departures.length === 0 ? <p>No upcoming departures.</p>
        : departures.map((d, i) => <DepartureRow key={i} d={d} />)}
    </div>
  );
}
