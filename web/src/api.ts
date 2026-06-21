import type { Departure, Stop } from "./types.ts";

interface Opts { base?: string; fetchImpl?: typeof fetch }
// Same-origin on Vercel (API served at /api/*). Override with VITE_API_BASE for split hosting.
const BASE = import.meta.env?.VITE_API_BASE ?? "";

async function jget<T>(url: string, opts: Opts): Promise<T> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getDepartures(stopId: string, opts: Opts = {}): Promise<Departure[]> {
  const base = opts.base ?? BASE;
  const data = await jget<{ departures: Departure[] }>(`${base}/api/departures?stop=${encodeURIComponent(stopId)}`, opts);
  return data.departures;
}

export async function getStops(lat: number, lon: number, opts: Opts = {}): Promise<Stop[]> {
  const base = opts.base ?? BASE;
  const data = await jget<{ stops: Stop[] }>(`${base}/api/stops?lat=${lat}&lon=${lon}`, opts);
  return data.stops;
}
