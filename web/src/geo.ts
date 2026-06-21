import type { Stop } from "./types.ts";

function haversineM(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLon = toRad(bLon - aLon);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function withDistanceSorted(stops: Stop[], lat: number, lon: number): Stop[] {
  return stops
    .map((s) => ({ ...s, distanceM: Math.round(haversineM(lat, lon, s.lat, s.lon)) }))
    .sort((a, b) => a.distanceM! - b.distanceM!);
}
