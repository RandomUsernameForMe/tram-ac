import { config } from "./config.ts";
import type { GolemioDepartureboards, GolemioStops } from "./types.ts";

interface Opts { fetchImpl?: typeof fetch; key?: string }

async function get<T>(url: string, opts: Opts): Promise<T> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(url, { headers: { "x-access-token": opts.key ?? config.golemioKey } });
  if (!res.ok) throw new Error(`Golemio ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

export function fetchDepartureboards(aswId: string, opts: Opts = {}): Promise<GolemioDepartureboards> {
  const u = new URL(`${config.golemioBase}/pid/departureboards`);
  u.searchParams.set("aswIds", aswId);
  u.searchParams.set("minutesAfter", "99");
  u.searchParams.set("limit", "8");
  u.searchParams.set("order", "real");
  u.searchParams.set("mode", "departures");
  u.searchParams.set("preferredTimezone", "Europe/Prague");
  return get<GolemioDepartureboards>(u.toString(), opts);
}

export function fetchStops(lat: number, lng: number, opts: Opts = {}): Promise<GolemioStops> {
  const u = new URL(`${config.golemioBase}/gtfs/stops`);
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lng", String(lng));
  u.searchParams.set("range", "700");
  u.searchParams.set("limit", "20");
  return get<GolemioStops>(u.toString(), opts);
}
