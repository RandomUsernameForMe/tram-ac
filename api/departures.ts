import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCors } from "../server/src/cors";
import { fetchDepartureboards } from "../server/src/golemio";
import { normalizeDepartures } from "../server/src/normalize";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  const stop = req.query.stop;
  if (!stop || typeof stop !== "string") {
    res.status(400).json({ error: "stop query param required" });
    return;
  }
  try {
    const raw = await fetchDepartureboards(stop);
    res.status(200).json({ departures: normalizeDepartures(raw) });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
}
