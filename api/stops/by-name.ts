import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCors } from "../../core/src/cors";
import { fetchStopsByName } from "../../core/src/golemio";
import { normalizeStops } from "../../core/src/normalize";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  const name = req.query.name;
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name query param required" });
    return;
  }
  try {
    const raw = await fetchStopsByName(name);
    res.status(200).json({ stops: normalizeStops(raw) });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
}
