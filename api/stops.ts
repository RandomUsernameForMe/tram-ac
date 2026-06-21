import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchStops } from "../server/src/golemio.ts";
import { normalizeStops } from "../server/src/normalize.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const lat = Number(req.query.lat), lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.status(400).json({ error: "lat and lon query params required" });
    return;
  }
  try {
    const raw = await fetchStops(lat, lon);
    res.status(200).json({ stops: normalizeStops(raw) });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
}
