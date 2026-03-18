import { Command } from "commander";
import { showBanner } from "./utils/logger.js";
import { initCommand } from "./commands/init.js";
import { generateCommand } from "./commands/generate.js";
import { serveCommand } from "./commands/serve.js";

const program = new Command();

const isJsonMode = process.argv.includes("--json");
if (!isJsonMode) {
  showBanner();
}

program
  .name("contentclaw")
  .description("ContentClaw - Programmatic SEO engine. Generate pages with AI, serve via API.")
  .version("3.4.0");

program
  .command("init")
  .description("Initialize a new ContentClaw project")
  .action(async () => {
    await initCommand();
  });

program
  .command("generate [keywords...]")
  .description("Generate SEO pages from keywords or seed file")
  .option("-i, --input <file>", "Seed data file (CSV or JSON)")
  .option("-e, --expand <count>", "Expand each keyword into N long-tail variations for pSEO")
  .option("-p, --provider <name>", "AI provider (openai, gemini, anthropic, xai, qwen, ollama)")
  .option("-m, --model <name>", "Model name override")
  .option("-k, --api-key <key>", "API key override")
  .option("-l, --language <lang>", "Content language", "en")
  .option("-t, --type <type>", "Content type: auto, blog, landing, glossary, comparison, listicle, how-to, alternatives, review, hub", "auto")
  .option("--template <pattern>", 'Template pattern with {variables}, e.g. "{service} in {city}"')
  .option("--vars <files...>", "Variable files for template (one value per line, one file per variable)")
  .option("--json", "Output results as JSON (machine-readable)")
  .option("-y, --yes", "Skip interactive prompts, use defaults")
  .option("--competitor <sitemap>", "Analyze competitor sitemap URL and generate competing content")
  .option("--no-web-search", "Disable web search/grounding for this run")
  .option("--force", "Overwrite existing pages with the same slug")
  .option("--refresh <days>", "Only regenerate pages older than N days")
  .action(async (keywords: string[], options) => {
    await generateCommand(keywords, options);
  });

program
  .command("serve")
  .description("Start the API server with dashboard")
  .option("--port <number>", "Server port", "3099")
  .option("--host <address>", "Server host", "localhost")
  .action(async (options) => {
    await serveCommand(options);
  });

program.parse();
