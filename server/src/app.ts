import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { routes } from "./routes.ts";

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });
  app.register(cors, { origin: true });
  app.register(routes);
  return app;
}
