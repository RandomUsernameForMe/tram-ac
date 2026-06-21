import type { Departure, GolemioDepartureboards, Stop, GolemioStops } from "./types";

export function normalizeDepartures(raw: GolemioDepartureboards): Departure[] {
  const list = raw?.departures ?? [];
  return list
    .filter((d) => d.route?.type === 0) // trams only (GTFS route_type 0); AC variance is a tram thing
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

// Collapse duplicate platform rows (same stop name + platform code). gtfs/stops
// can return several stop_ids for one physical platform; keep the nearest.
export function dedupeStops(stops: Stop[]): Stop[] {
  const seen = new Set<string>();
  const out: Stop[] = [];
  for (const s of stops) {
    const key = `${s.name}|${s.platformCode ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export function normalizeStops(raw: GolemioStops): Stop[] {
  const features = raw?.features ?? [];
  const out: Stop[] = [];
  for (const f of features) {
    const p = f.properties;
    const coords = f.geometry?.coordinates;
    // Only boardable platforms (location_type 0); skip stations/entrances/nodes.
    if (!p || p.location_type !== 0 || !p.stop_id || !coords) continue;
    out.push({
      id: p.stop_id,
      name: String(p.stop_name ?? ""),
      platformCode: p.platform_code ?? undefined,
      lat: coords[1],
      lon: coords[0],
      distanceM: p.distance != null ? Math.round(p.distance) : undefined,
    });
  }
  return out;
}
