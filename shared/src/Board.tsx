import type { Departure } from "./types.ts";
import { DepartureRow } from "./DepartureRow.tsx";

export function Board({ stopName, platformCode, departures }: { stopName: string; platformCode?: string; departures: Departure[] }) {
  return (
    <div>
      <h2>{stopName}{platformCode && <span style={{ opacity: 0.6, fontWeight: 400 }}> · {platformCode}</span>}</h2>
      {departures.length === 0 ? <p>No upcoming departures.</p>
        : departures.map((d, i) => <DepartureRow key={i} d={d} />)}
    </div>
  );
}
