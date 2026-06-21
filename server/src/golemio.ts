import { config } from "./config.ts";
import type { GolemioDepartureboards, GolemioStops } from "./types.ts";

interface Opts { fetchImpl?: typeof fetch; key?: string }

async function get<T>(url: string, opts: Opts): Promise<T> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(url, { headers: { "x-access-token": opts.key ?? config.golemioKey } });
  if (!res.ok) throw new Error(`Golemio ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

export function fetchDepartureboards(stopId: string, opts: Opts = {}): Promise<GolemioDepartureboards> {
  const u = new URL(`${config.golemioBase}/pid/departureboards`);
  u.searchParams.set("ids", stopId);
  u.searchParams.set("minutesAfter", "99");
  u.searchParams.set("limit", "8");
  u.searchParams.set("order", "real");
  u.searchParams.set("mode", "departures");
  u.searchParams.set("preferredTimezone", "Europe/Prague");
  return get<GolemioDepartureboards>(u.toString(), opts);
}

export function fetchStops(lat: number, lng: number, opts: Opts = {}): Promise<GolemioStops> {
  const u = new URL(`${config.golemioBase}/gtfs/stops`);
  u.searchParams.set("latlng", `${lat},${lng}`); // Golemio returns nearest-first with `distance`
  u.searchParams.set("limit", "40");             // platforms get filtered to location_type 0 downstream
  return get<GolemioStops>(u.toString(), opts);
}
