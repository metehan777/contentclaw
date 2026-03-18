import inquirer from "inquirer";
import { writeConfig, getDefaultConfig, configExists } from "../utils/config.js";
import { listProviders } from "../providers/index.js";
import * as logger from "../utils/logger.js";
import type { PseoConfig, ProviderName } from "../types/index.js";

const MODEL_DEFAULTS: Record<ProviderName, string> = {
  openai: "gpt-5.2",
  gemini: "gemini-3-flash-preview",
  anthropic: "claude-opus-4-6",
  xai: "grok-3",
  qwen: "qwen-max",
  ollama: "llama3",
};

export async function initCommand(): Promise<void> {
  if (configExists()) {
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: "contentclaw.config.json already exists. Overwrite?",
        default: false,
      },
    ]);
    if (!overwrite) {
      logger.info("Init cancelled.");
      return;
    }
  }

  logger.info("Setting up your ContentClaw project...\n");

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "provider",
      message: "Select your default AI provider:",
      choices: listProviders(),
      default: "openai",
    },
    {
      type: "input",
      name: "model",
      message: "Model name (leave blank for default):",
      default: (ans: { provider: ProviderName }) =>
        MODEL_DEFAULTS[ans.provider] || "",
    },
    {
      type: "password",
      name: "apiKey",
      message: "API key (leave blank to use environment variable):",
      mask: "*",
    },
    {
      type: "input",
      name: "language",
      message: "Content language:",
      default: "en",
    },
    {
      type: "list",
      name: "tone",
      message: "Content tone:",
      choices: [
        "informative",
        "professional",
        "casual",
        "academic",
        "persuasive",
        "conversational",
      ],
      default: "informative",
    },
    {
      type: "number",
      name: "wordCount",
      message: "Target word count per page:",
      default: 1500,
    },
    {
      type: "confirm",
      name: "enableLinking",
      message: "Enable internal linking?",
      default: false,
    },
  ]);

  let linkingConfig = getDefaultConfig().internalLinking;

  if (answers.enableLinking) {
    const linkAnswers = await inquirer.prompt([
      {
        type: "list",
        name: "source",
        message: "Internal link source:",
        choices: [
          { name: "Sitemap XML", value: "sitemap" },
          { name: "Manual URL list", value: "manual" },
          { name: "Both", value: "both" },
        ],
      },
      {
        type: "input",
        name: "sitemapUrl",
        message: "Sitemap URL:",
        when: (ans: { source: string }) =>
          ans.source === "sitemap" || ans.source === "both",
      },
      {
        type: "input",
        name: "urls",
        message:
          "Enter URLs (comma-separated):",
        when: (ans: { source: string }) =>
          ans.source === "manual" || ans.source === "both",
        filter: (input: string) =>
          input
            .split(",")
            .map((u: string) => u.trim())
            .filter(Boolean),
      },
    ]);

    const prefixAnswer = await inquirer.prompt([
      {
        type: "input",
        name: "slugPrefix",
        message: 'URL path prefix for content pages (e.g. "blog", "articles", leave blank for root):',
      },
    ]);

    linkingConfig = {
      enabled: true,
      source: linkAnswers.source,
      sitemapUrl: linkAnswers.sitemapUrl,
      urls: linkAnswers.urls || [],
      slugPrefix: prefixAnswer.slugPrefix || undefined,
    };
  }

  const brandAnswers = await inquirer.prompt([
    {
      type: "input",
      name: "brandName",
      message: "Your brand/site name (optional):",
    },
    {
      type: "input",
      name: "brandUrl",
      message: "Your website URL (optional):",
    },
    {
      type: "input",
      name: "brandDescription",
      message: "Short brand description (optional):",
    },
  ]);

  const serverAnswers = await inquirer.prompt([
    {
      type: "number",
      name: "port",
      message: "API server port:",
      default: 3099,
    },
  ]);

  const webSearchAnswer = await inquirer.prompt([
    {
      type: "confirm",
      name: "webSearch",
      message: "Enable web search/grounding for real-time data in generated content?",
      default: true,
    },
  ]);

  const config: PseoConfig = {
    provider: answers.provider,
    model: answers.model || undefined,
    apiKey: answers.apiKey || undefined,
    language: answers.language,
    tone: answers.tone,
    wordCount: answers.wordCount,
    brand: {
      name: brandAnswers.brandName || undefined,
      url: brandAnswers.brandUrl || undefined,
      description: brandAnswers.brandDescription || undefined,
    },
    internalLinking: linkingConfig,
    server: {
      port: serverAnswers.port,
      host: "localhost",
    },
    webSearch: webSearchAnswer.webSearch,
  };

  writeConfig(config);
  logger.success("Created contentclaw.config.json");
  logger.info('Run "contentclaw generate -i seeds.csv" to start generating pages.');
}
