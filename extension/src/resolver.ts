import type { Stop, Departure } from "./types.ts";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export function pickPlatform(
  platforms: { stop: Stop; departures: Departure[] }[],
  leg: { line: string; destination: string },
): Stop | null {
  const dest = norm(leg.destination);
  if (!dest) return null;
  for (const p of platforms) {
    const hit = p.departures.some((d) => d.line === leg.line && norm(d.headsign).includes(dest));
    if (hit) return p.stop;
  }
  return null;
}
