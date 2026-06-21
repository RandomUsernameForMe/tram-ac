import type { Departure, Stop } from "./types.ts";

interface Opts { base?: string; fetchImpl?: typeof fetch }
const BASE = import.meta.env?.VITE_API_BASE ?? "http://localhost:3000";

async function jget<T>(url: string, opts: Opts): Promise<T> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getDepartures(aswId: string, opts: Opts = {}): Promise<Departure[]> {
  const base = opts.base ?? BASE;
  const data = await jget<{ departures: Departure[] }>(`${base}/departures?stop=${encodeURIComponent(aswId)}`, opts);
  return data.departures;
}

export async function getStops(lat: number, lon: number, opts: Opts = {}): Promise<Stop[]> {
  const base = opts.base ?? BASE;
  const data = await jget<{ stops: Stop[] }>(`${base}/stops?lat=${lat}&lon=${lon}`, opts);
  return data.stops;
}
