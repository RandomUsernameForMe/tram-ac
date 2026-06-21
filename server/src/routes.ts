import type { FastifyInstance } from "fastify";
import { fetchDepartureboards, fetchStops } from "./golemio.ts";
import { normalizeDepartures, normalizeStops } from "./normalize.ts";

export async function routes(app: FastifyInstance) {
  app.get("/health", async () => ({ status: "ok" }));

  app.get("/departures", async (req, reply) => {
    const stop = (req.query as any)?.stop;
    if (!stop || typeof stop !== "string") {
      return reply.code(400).send({ error: "stop query param required" });
    }
    const raw = await fetchDepartureboards(stop);
    return { departures: normalizeDepartures(raw) };
  });

  app.get("/stops", async (req, reply) => {
    const q = req.query as any;
    const lat = Number(q?.lat), lon = Number(q?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return reply.code(400).send({ error: "lat and lon query params required" });
    }
    const raw = await fetchStops(lat, lon);
    return { stops: normalizeStops(raw) };
  });
}
