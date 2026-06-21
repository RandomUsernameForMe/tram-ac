import type { Departure, Stop } from "./types.ts";

const BASE = "https://tram-ac.vercel.app";

async function jget<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export const searchStops = (q: string) =>
  jget<{ names: string[] }>(`/api/stops/search?q=${encodeURIComponent(q)}`).then((d) => d.names);
export const stopsByName = (name: string) =>
  jget<{ stops: Stop[] }>(`/api/stops/by-name?name=${encodeURIComponent(name)}`).then((d) => d.stops);
export const departures = (stopId: string) =>
  jget<{ departures: Departure[] }>(`/api/departures?stop=${encodeURIComponent(stopId)}`).then((d) => d.departures);
