import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchDepartureboards } from "../server/src/golemio.ts";
import { normalizeDepartures } from "../server/src/normalize.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
