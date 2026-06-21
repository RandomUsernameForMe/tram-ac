import type { Departure, GolemioDepartureboards, Stop, GolemioStops } from "./types.ts";

export function normalizeDepartures(raw: GolemioDepartureboards): Departure[] {
  const list = raw?.departures ?? [];
  return list
    .map((d): Departure => {
      const acRaw = d.trip?.is_air_conditioned;
      return {
        line: String(d.route?.short_name ?? ""),
        headsign: String(d.trip?.headsign ?? ""),
        minutes: Number(d.departure_timestamp?.minutes ?? 0),
        airConditioned: acRaw === true ? true : acRaw === false ? false : null,
      };
    })
    .sort((a, b) => a.minutes - b.minutes);
}

export function normalizeStops(raw: GolemioStops): Stop[] {
  const features = raw?.features ?? [];
  const out: Stop[] = [];
  for (const f of features) {
    const node = f.properties?.asw_node_id;
    const stop = f.properties?.asw_stop_id;
    const coords = f.geometry?.coordinates;
    if (node == null || stop == null || !coords) continue;
    out.push({
      aswId: `${node}_${stop}`,
      name: String(f.properties?.stop_name ?? ""),
      lat: coords[1],
      lon: coords[0],
    });
  }
  return out;
}
