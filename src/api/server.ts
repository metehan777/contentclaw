import Fastify from "fastify";
import cors from "@fastify/cors";
import { registerRoutes } from "./routes.js";
import { dashboardPage, docsPage } from "./dashboard.js";
import type { ServerConfig } from "../types/index.js";

export async function createServer(config: ServerConfig) {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });

  app.get("/", async (_request, reply) => {
    reply.type("text/html").send(dashboardPage(config));
  });

  app.get("/docs", async (_request, reply) => {
    reply.type("text/html").send(docsPage(config));
  });

  await registerRoutes(app);

  await app.listen({ port: config.port, host: config.host });

  return app;
}
