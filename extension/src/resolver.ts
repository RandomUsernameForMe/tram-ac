import type { Stop, Departure } from "./types.ts";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export function pickPlatform(
  platforms: { stop: Stop; departures: Departure[] }[],
  leg: { line: string; destination: string; platformCode?: string },
): Stop | null {
  // Most reliable: Maps detail view names the platform (e.g. "Nástupiště A").
  if (leg.platformCode) {
    const byPlat = platforms.find((p) => p.stop.platformCode?.toUpperCase() === leg.platformCode!.toUpperCase());
    if (byPlat) return byPlat.stop;
  }
  // Else match the platform whose departures on this line head toward the destination.
  const dest = norm(leg.destination);
  if (!dest) return null;
  for (const p of platforms) {
    const hit = p.departures.some((d) => d.line === leg.line && norm(d.headsign).includes(dest));
    if (hit) return p.stop;
  }
  return null;
}
