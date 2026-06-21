import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCors } from "../core/src/cors";
import { fetchStops, fetchDepartureboards } from "../core/src/golemio";
import { normalizeStops, normalizeDepartures, dedupeStops } from "../core/src/normalize";

const CANDIDATES = 14; // nearest physical platforms to board-check (bounds Golemio calls)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  const lat = Number(req.query.lat), lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.status(400).json({ error: "lat and lon query params required" });
    return;
  }
  try {
    const raw = await fetchStops(lat, lon);
    const candidates = dedupeStops(normalizeStops(raw)).slice(0, CANDIDATES);
    // Keep only stops that actually serve trams (gtfs/stops has no mode info).
    const boards = await Promise.all(
      candidates.map((s) => fetchDepartureboards(s.id).then(normalizeDepartures).catch(() => [])),
    );
    const stops = candidates.filter((_, i) => boards[i].length > 0);
    res.status(200).json({ stops });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
}
