import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCors } from "../server/src/cors";

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  res.status(200).json({ status: "ok" });
}
