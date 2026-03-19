import { execFileSync, spawn } from "node:child_process";

const EXEC_OPTIONS = {
  encoding: "utf-8" as const,
  timeout: 300_000,
  maxBuffer: 10 * 1024 * 1024,
};

const VALID_PROVIDERS = new Set([
  "openai", "gemini", "anthropic", "xai", "qwen", "ollama",
]);
const VALID_TYPES = new Set([
  "auto", "blog", "landing", "glossary", "comparison",
  "listicle", "how-to", "alternatives", "review", "hub",
]);

function runFile(bin: string, args: string[], cwd?: string): string {
  return execFileSync(bin, args, {
    ...EXEC_OPTIONS,
    cwd: cwd || process.cwd(),
  }).toString().trim();
}

function ensureBinary(): boolean {
  try {
    runFile("contentclaw", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

function sanitizeKeyword(kw: string): string {
  return kw.replace(/[^\w\s\-.,!?'"()&+:;/\\@#$%=\[\]{}]/g, "").slice(0, 200);
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9\-]*$/.test(slug) && slug.length <= 200;
}

function isValidLang(lang: string): boolean {
  return /^[a-z]{2}(-[A-Z]{2})?$/.test(lang);
}

function notInstalledError() {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: false,
        error: "contentclaw is not installed. Run: npm install -g contentclaw",
      }),
    }],
  };
}

function errorResult(msg: string) {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({ success: false, error: msg }),
    }],
  };
}

export default function register(api: any) {
  api.registerTool({
    name: "contentclaw_generate",
    description:
      "Generate AI-powered content pages from keywords. Supports auto (AI-planned), blog, glossary, comparison, listicle, how-to, alternatives, review, landing, and hub content types. Pages are stored in a local SQLite database and served via REST API.",
    parameters: {
      type: "object",
      properties: {
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Keywords or topics to generate content for",
        },
        provider: {
          type: "string",
          enum: ["openai", "gemini", "anthropic", "xai", "qwen", "ollama"],
          description: "AI provider to use (default: openai)",
        },
        type: {
          type: "string",
          enum: [
            "auto", "blog", "landing", "glossary", "comparison",
            "listicle", "how-to", "alternatives", "review", "hub",
          ],
          description: "Content type. Use 'auto' (default) to let AI plan the best mix.",
        },
        language: {
          type: "string",
          description: "Content language code (default: en)",
        },
        force: {
          type: "boolean",
          description: "Overwrite existing pages with the same slug",
        },
        noWebSearch: {
          type: "boolean",
          description: "Disable web search/grounding (external links will be stripped)",
        },
      },
      required: ["keywords"],
    },
    async execute(_id: string, params: any) {
      if (!ensureBinary()) return notInstalledError();

      const args = ["generate"];

      const keywords: string[] = params.keywords || [];
      for (const kw of keywords) {
        args.push(sanitizeKeyword(kw));
      }

      args.push("--json", "--yes");

      if (params.provider && VALID_PROVIDERS.has(params.provider)) {
        args.push("-p", params.provider);
      }
      if (params.type && VALID_TYPES.has(params.type)) {
        args.push("-t", params.type);
      }
      if (params.language && isValidLang(params.language)) {
        args.push("-l", params.language);
      }
      if (params.force) args.push("--force");
      if (params.noWebSearch) args.push("--no-web-search");

      try {
        const output = runFile("contentclaw", args);
        return { content: [{ type: "text", text: output }] };
      } catch (err: any) {
        return errorResult(err.stderr || err.message || String(err));
      }
    },
  });

  api.registerTool({
    name: "contentclaw_competitor",
    description:
      "Analyze a competitor's sitemap and generate content to beat them. Crawls the sitemap, finds content gaps and opportunities, and creates competing pages.",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Topic focus for the competitor analysis",
        },
        sitemapUrl: {
          type: "string",
          description: "Full URL to the competitor's sitemap.xml",
        },
        provider: {
          type: "string",
          enum: ["openai", "gemini", "anthropic", "xai", "qwen", "ollama"],
          description: "AI provider to use",
        },
      },
      required: ["topic", "sitemapUrl"],
    },
    async execute(_id: string, params: any) {
      if (!ensureBinary()) return notInstalledError();

      if (!isValidUrl(params.sitemapUrl)) {
        return errorResult("Invalid sitemap URL. Must be a valid http:// or https:// URL.");
      }

      const args = [
        "generate",
        sanitizeKeyword(params.topic),
        "--competitor", params.sitemapUrl,
        "--json", "--yes",
      ];

      if (params.provider && VALID_PROVIDERS.has(params.provider)) {
        args.push("-p", params.provider);
      }

      try {
        const output = runFile("contentclaw", args);
        return { content: [{ type: "text", text: output }] };
      } catch (err: any) {
        return errorResult(err.stderr || err.message || String(err));
      }
    },
  });

  api.registerTool({
    name: "contentclaw_pages",
    description:
      "List all generated content pages from the local ContentClaw database. Returns titles, slugs, types, and dates.",
    parameters: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number for pagination (default: 1)",
        },
        limit: {
          type: "number",
          description: "Results per page (default: 20)",
        },
        type: {
          type: "string",
          description: "Filter by content type",
        },
      },
    },
    async execute(_id: string, params: any) {
      if (!ensureBinary()) return notInstalledError();

      const query = new URLSearchParams();
      if (params.page && Number.isInteger(params.page) && params.page > 0) {
        query.set("page", String(params.page));
      }
      if (params.limit && Number.isInteger(params.limit) && params.limit > 0) {
        query.set("limit", String(Math.min(params.limit, 100)));
      }
      if (params.type && VALID_TYPES.has(params.type)) {
        query.set("type", params.type);
      }

      const url = `http://localhost:3099/api/pages?${query.toString()}`;

      try {
        const output = runFile("curl", ["-s", url]);
        return { content: [{ type: "text", text: output }] };
      } catch {
        return errorResult("ContentClaw server is not running. Start it with: contentclaw serve");
      }
    },
  });

  api.registerTool({
    name: "contentclaw_page",
    description:
      "Get a specific generated page by slug. Returns title, meta description, body HTML, internal links, and external links.",
    parameters: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "The page slug to retrieve",
        },
      },
      required: ["slug"],
    },
    async execute(_id: string, params: any) {
      if (!isValidSlug(params.slug)) {
        return errorResult("Invalid slug. Must be lowercase alphanumeric with hyphens.");
      }

      const url = `http://localhost:3099/api/pages/${encodeURIComponent(params.slug)}`;

      try {
        const output = runFile("curl", ["-s", url]);
        return { content: [{ type: "text", text: output }] };
      } catch {
        return errorResult("ContentClaw server is not running. Start it with: contentclaw serve");
      }
    },
  });

  api.registerTool({
    name: "contentclaw_serve",
    description:
      "Start the ContentClaw API server and dashboard on localhost:3099. The server provides REST endpoints for pages and a web dashboard with real-time updates.",
    parameters: {
      type: "object",
      properties: {
        port: {
          type: "number",
          description: "Server port (default: 3099)",
        },
      },
    },
    async execute(_id: string, params: any) {
      if (!ensureBinary()) return notInstalledError();

      const port = (params.port && Number.isInteger(params.port) && params.port > 0 && params.port < 65536)
        ? params.port
        : 3099;

      const child = spawn("contentclaw", ["serve", "--port", String(port)], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            message: `ContentClaw server starting on port ${port}`,
            dashboard: `http://localhost:${port}`,
            api: `http://localhost:${port}/api`,
            docs: `http://localhost:${port}/docs`,
          }),
        }],
      };
    },
  });
}
