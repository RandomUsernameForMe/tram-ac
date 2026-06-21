import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCors } from "../../core/src/cors";
import { fetchAllStopNames } from "../../core/src/golemio";
import { getStopNames, matchNames } from "../../core/src/stopIndex";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  const q = req.query.q;
  if (!q || typeof q !== "string" || q.trim().length < 2) {
    res.status(400).json({ error: "q must be at least 2 chars" });
    return;
  }
  try {
    const names = await getStopNames(() => fetchAllStopNames());
    res.status(200).json({ names: matchNames(names, q, 10) });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
}
