import { execSync } from "node:child_process";

function run(cmd: string, cwd?: string): string {
  return execSync(cmd, {
    cwd: cwd || process.cwd(),
    encoding: "utf-8",
    timeout: 300_000,
    maxBuffer: 10 * 1024 * 1024,
  }).trim();
}

function ensureBinary(): boolean {
  try {
    run("contentclaw --version");
    return true;
  } catch {
    return false;
  }
}

export default function register(api: any) {
  // Tool: Generate content pages
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
            "auto",
            "blog",
            "landing",
            "glossary",
            "comparison",
            "listicle",
            "how-to",
            "alternatives",
            "review",
            "hub",
          ],
          description:
            "Content type. Use 'auto' (default) to let AI plan the best mix.",
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
          description:
            "Disable web search/grounding (external links will be stripped)",
        },
      },
      required: ["keywords"],
    },
    async execute(_id: string, params: any) {
      if (!ensureBinary()) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  "contentclaw is not installed. Run: npm install -g contentclaw",
              }),
            },
          ],
        };
      }

      const args = ["contentclaw", "generate"];
      args.push(...(params.keywords || []));
      args.push("--json", "--yes");

      if (params.provider) args.push("-p", params.provider);
      if (params.type) args.push("-t", params.type);
      if (params.language) args.push("-l", params.language);
      if (params.force) args.push("--force");
      if (params.noWebSearch) args.push("--no-web-search");

      try {
        const output = run(args.join(" "));
        return { content: [{ type: "text", text: output }] };
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: err.stderr || err.message || String(err),
              }),
            },
          ],
        };
      }
    },
  });

  // Tool: Analyze competitor sitemap
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
      if (!ensureBinary()) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  "contentclaw is not installed. Run: npm install -g contentclaw",
              }),
            },
          ],
        };
      }

      const args = [
        "contentclaw",
        "generate",
        JSON.stringify(params.topic),
        "--competitor",
        params.sitemapUrl,
        "--json",
        "--yes",
      ];
      if (params.provider) args.push("-p", params.provider);

      try {
        const output = run(args.join(" "));
        return { content: [{ type: "text", text: output }] };
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: err.stderr || err.message || String(err),
              }),
            },
          ],
        };
      }
    },
  });

  // Tool: List generated pages
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
      if (!ensureBinary()) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  "contentclaw is not installed. Run: npm install -g contentclaw",
              }),
            },
          ],
        };
      }

      const port = 3099;
      let url = `http://localhost:${port}/api/pages?`;
      if (params.page) url += `page=${params.page}&`;
      if (params.limit) url += `limit=${params.limit}&`;
      if (params.type) url += `type=${params.type}&`;

      try {
        const output = run(`curl -s "${url}"`);
        return { content: [{ type: "text", text: output }] };
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  "ContentClaw server is not running. Start it with: contentclaw serve",
              }),
            },
          ],
        };
      }
    },
  });

  // Tool: Get a specific page
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
      try {
        const output = run(
          `curl -s "http://localhost:3099/api/pages/${params.slug}"`
        );
        return { content: [{ type: "text", text: output }] };
      } catch (err: any) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  "ContentClaw server is not running. Start it with: contentclaw serve",
              }),
            },
          ],
        };
      }
    },
  });

  // Tool: Start the server
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
      if (!ensureBinary()) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error:
                  "contentclaw is not installed. Run: npm install -g contentclaw",
              }),
            },
          ],
        };
      }

      const port = params.port || 3099;
      try {
        execSync(`contentclaw serve --port ${port} &`, {
          encoding: "utf-8",
          timeout: 5000,
          stdio: "ignore",
        });
      } catch {
        // background process - expected to "fail" exec since it keeps running
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `ContentClaw server starting on port ${port}`,
              dashboard: `http://localhost:${port}`,
              api: `http://localhost:${port}/api`,
              docs: `http://localhost:${port}/docs`,
            }),
          },
        ],
      };
    },
  });
}
