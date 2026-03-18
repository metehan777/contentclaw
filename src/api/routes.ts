import type { FastifyInstance } from "fastify";
import { getPages, getPageBySlug, deletePageBySlug } from "../core/store.js";
import { generateAndStore } from "../core/generator.js";
import { readConfig } from "../utils/config.js";
import type { SeedEntry, ProviderName } from "../types/index.js";

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  app.get("/api/pages", async (request) => {
    const { page = "1", limit = "20" } = request.query as Record<string, string>;
    return getPages(parseInt(page, 10), parseInt(limit, 10));
  });

  app.get("/api/pages/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const page = getPageBySlug(slug);
    if (!page) {
      return reply.status(404).send({ error: "Page not found" });
    }
    return page;
  });

  app.delete("/api/pages/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const deleted = deletePageBySlug(slug);
    if (!deleted) {
      return reply.status(404).send({ error: "Page not found" });
    }
    return { success: true, slug };
  });

  app.post("/api/generate", async (request, reply) => {
    const body = request.body as {
      provider?: ProviderName;
      model?: string;
      seed_data: SeedEntry[];
    };

    if (!body.seed_data || !Array.isArray(body.seed_data) || body.seed_data.length === 0) {
      return reply
        .status(400)
        .send({ error: "seed_data array is required and must not be empty" });
    }

    let config;
    try {
      config = readConfig();
    } catch {
      config = null;
    }

    const generateConfig = {
      provider: body.provider || config?.provider || "openai" as ProviderName,
      model: body.model || config?.model,
      apiKey: config?.apiKey,
      language: config?.language || "en",
      tone: config?.tone || "informative",
      wordCount: config?.wordCount || 1500,
    };

    const results = [];
    const errors = [];

    for (const seed of body.seed_data) {
      try {
        const page = await generateAndStore(seed, generateConfig);
        results.push({
          slug: page.slug,
          keyword: page.keyword,
          title: page.title,
          status: "success",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        errors.push({ keyword: seed.keyword, error: message });
      }
    }

    return {
      generated: results.length,
      failed: errors.length,
      results,
      errors,
    };
  });
}
