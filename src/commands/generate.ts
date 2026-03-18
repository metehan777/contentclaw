import ora from "ora";
import chalk from "chalk";
import fs from "node:fs";
import inquirer from "inquirer";
import { readConfig, configExists } from "../utils/config.js";
import { parseSeedFile } from "../core/seed.js";
import { generateAndStore, expandKeyword, resolveContentType, expandTemplate, smartExpand } from "../core/generator.js";
import { slugify } from "../utils/slugify.js";
import { fetchInternalLinks } from "../core/linker.js";
import { getDb, closeDb, getExistingSlugs, slugExists, getPageAge } from "../core/store.js";
import { analyzeCompetitor, fetchCompetitorSitemap } from "../core/competitor.js";
import { RateLimiter } from "../utils/rate-limiter.js";
import * as logger from "../utils/logger.js";
import type { ProviderName, GenerateConfig, SeedEntry, ContentType, RateLimitConfig, DEFAULT_RATE_LIMITS } from "../types/index.js";

const VALID_TYPES = [
  "auto", "blog", "landing", "glossary", "comparison", "listicle",
  "how-to", "alternatives", "review", "hub",
];

interface GenerateOptions {
  input?: string;
  provider?: string;
  model?: string;
  apiKey?: string;
  language?: string;
  expand?: string;
  type?: string;
  template?: string;
  vars?: string[];
  json?: boolean;
  yes?: boolean;
  competitor?: string;
  noWebSearch?: boolean;
  force?: boolean;
  refresh?: string;
}

function parseVarsFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
}

export async function generateCommand(
  keywords: string[],
  options: GenerateOptions
): Promise<void> {
  const jsonMode = !!options.json;
  const autoYes = !!options.yes;
  let seeds: SeedEntry[] = [];

  if (options.template) {
    const template = options.template;
    const varFiles = options.vars || [];
    const placeholders = template.match(/\{(\w+)\}/g)?.map((p) => p.slice(1, -1)) || [];

    if (placeholders.length === 0) {
      const msg = `Template "${template}" has no {variable} placeholders.`;
      if (jsonMode) { console.log(JSON.stringify({ success: false, error: msg })); }
      else { logger.error(msg); }
      process.exit(1);
    }

    const variableLists: Record<string, string[]> = {};

    for (let i = 0; i < placeholders.length; i++) {
      const varName = placeholders[i];
      if (varFiles[i]) {
        try {
          variableLists[varName] = parseVarsFile(varFiles[i]);
          if (!jsonMode) {
            logger.info(`Loaded ${variableLists[varName].length} values for {${varName}} from ${varFiles[i]}`);
          }
        } catch (err) {
          const msg = `Failed to read vars file for {${varName}}: ${err instanceof Error ? err.message : String(err)}`;
          if (jsonMode) { console.log(JSON.stringify({ success: false, error: msg })); }
          else { logger.error(msg); }
          process.exit(1);
        }
      } else if (!autoYes) {
        const answer = await inquirer.prompt([{
          type: "input",
          name: "values",
          message: `Enter values for {${varName}} (comma-separated):`,
        }]);
        variableLists[varName] = answer.values.split(",").map((v: string) => v.trim()).filter(Boolean);
      } else {
        const msg = `No values provided for {${varName}}. Use --vars or provide a file.`;
        if (jsonMode) { console.log(JSON.stringify({ success: false, error: msg })); }
        else { logger.error(msg); }
        process.exit(1);
      }
    }

    seeds = expandTemplate(template, variableLists);
    if (!jsonMode) {
      logger.success(`Template expanded into ${chalk.cyan(String(seeds.length))} keyword combinations`);
      if (seeds.length <= 20) {
        seeds.forEach((s, i) => console.log(chalk.gray(`  ${String(i + 1).padStart(3)}. `) + s.keyword));
      } else {
        seeds.slice(0, 10).forEach((s, i) => console.log(chalk.gray(`  ${String(i + 1).padStart(3)}. `) + s.keyword));
        console.log(chalk.gray(`  ... and ${seeds.length - 10} more`));
      }
      console.log("");
    }
  }

  if (options.input && !options.template) {
    if (!jsonMode) {
      const spinner = ora("Reading seed file...").start();
      try {
        seeds = parseSeedFile(options.input);
        spinner.succeed(`Loaded ${seeds.length} seed entries from ${options.input}`);
      } catch (err) {
        spinner.fail("Failed to read seed file");
        logger.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    } else {
      try {
        seeds = parseSeedFile(options.input);
      } catch (err) {
        console.log(JSON.stringify({ success: false, error: `Failed to read seed file: ${err instanceof Error ? err.message : String(err)}` }));
        process.exit(1);
      }
    }
  }

  if (keywords.length > 0 && !options.expand && !options.template) {
    seeds.push(...keywords.map((kw) => ({ keyword: kw })));
  }

  if (seeds.length === 0 && !options.expand && keywords.length === 0 && !options.template) {
    if (autoYes) {
      const msg = "No keywords provided. Use arguments, --input, or --template flag.";
      if (jsonMode) { console.log(JSON.stringify({ success: false, error: msg })); }
      else { logger.error(msg); }
      process.exit(1);
    }

    const answers = await inquirer.prompt([{
      type: "input",
      name: "keywords",
      message: "Enter keywords (comma-separated):",
    }]);

    const entered = answers.keywords.split(",").map((k: string) => k.trim()).filter(Boolean);
    if (entered.length === 0) {
      logger.error("No keywords provided.");
      process.exit(1);
    }
    seeds = entered.map((kw: string) => ({ keyword: kw }));
  }

  let config;
  if (configExists()) {
    config = readConfig();
  }

  const provider = (options.provider || config?.provider || "openai") as ProviderName;
  const model = options.model || config?.model;
  const apiKey = options.apiKey || config?.apiKey;
  const language = options.language || config?.language || "en";
  const contentType = (VALID_TYPES.includes(options.type || "") ? options.type : "auto") as ContentType;

  const { DEFAULT_RATE_LIMITS: defaultLimits } = await import("../types/index.js");
  const providerRateLimit = config?.rateLimit?.[provider] || defaultLimits[provider];

  const generateConfig: GenerateConfig = {
    provider,
    model,
    apiKey,
    language,
    tone: config?.tone || "informative",
    wordCount: config?.wordCount || 1500,
    brand: config?.brand,
    slugPrefix: config?.internalLinking?.slugPrefix,
    contentType,
    webSearch: config?.webSearch !== false && !options.noWebSearch,
    rateLimit: providerRateLimit,
  };

  if (options.expand && !options.template) {
    const expandCount = parseInt(options.expand, 10) || 20;
    const topics = keywords.length > 0 ? keywords : seeds.map((s) => s.keyword);

    if (topics.length === 0) {
      if (autoYes) {
        const msg = "No topic provided for expansion. Pass a keyword argument.";
        if (jsonMode) { console.log(JSON.stringify({ success: false, error: msg })); }
        else { logger.error(msg); }
        process.exit(1);
      }
      const answers = await inquirer.prompt([{
        type: "input",
        name: "topic",
        message: "Enter a topic to expand into multiple pages:",
      }]);
      if (!answers.topic.trim()) { logger.error("No topic provided."); process.exit(1); }
      topics.push(answers.topic.trim());
    }

    seeds = [];
    for (const topic of topics) {
      const expandSpinner = jsonMode ? null : ora(
        `Expanding "${chalk.cyan(topic)}" into ${expandCount} keywords...`
      ).start();
      try {
        const expanded = await expandKeyword(topic, expandCount, generateConfig);
        if (expandSpinner) {
          expandSpinner.succeed(`Expanded "${topic}" into ${chalk.cyan(expanded.length)} keywords`);
          console.log("");
          expanded.forEach((kw, i) => console.log(chalk.gray(`  ${String(i + 1).padStart(2)}. `) + kw));
          console.log("");
        }
        seeds.push(...expanded.map((kw) => ({ keyword: kw })));
      } catch (err) {
        if (expandSpinner) {
          expandSpinner.fail(`Failed to expand "${topic}": ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    if (seeds.length === 0) {
      const msg = "No keywords generated from expansion.";
      if (jsonMode) { console.log(JSON.stringify({ success: false, error: msg })); }
      else { logger.error(msg); }
      process.exit(1);
    }
  }

  getDb();
  const existingSlugSet = getExistingSlugs();
  const existingSlugList = [...existingSlugSet];

  if (options.competitor) {
    const sitemapUrl = options.competitor;
    const topic = seeds.length > 0 ? seeds[0].keyword : (keywords.length > 0 ? keywords[0] : "");

    if (!topic) {
      const msg = "Provide a topic keyword along with --competitor to focus the analysis. Example: contentclaw generate \"seo\" --competitor https://example.com/sitemap.xml";
      if (jsonMode) { console.log(JSON.stringify({ success: false, error: msg })); }
      else { logger.error(msg); }
      process.exit(1);
    }

    const sitemapSpinner = jsonMode ? null : ora(
      `Fetching competitor sitemap from ${chalk.cyan(sitemapUrl)}...`
    ).start();

    try {
      const analysis = await fetchCompetitorSitemap(sitemapUrl);
      if (sitemapSpinner) {
        sitemapSpinner.succeed(
          `Found ${chalk.cyan(String(analysis.totalUrls))} pages on ${chalk.cyan(analysis.domain)}`
        );
      }

      const parallelKey = process.env.PARALLEL_API_KEY;
      if (parallelKey && !jsonMode) {
        logger.info(`Parallel.ai key detected - using Extract API for deep page analysis`);
      }

      const planSpinner = jsonMode ? null : ora(
        `Analyzing competitor content and planning attack strategy for "${chalk.cyan(topic)}"...`
      ).start();

      const planned = await analyzeCompetitor(
        sitemapUrl,
        topic,
        generateConfig,
        existingSlugList.length > 0 ? existingSlugList : undefined
      );

      if (planSpinner) {
        planSpinner.succeed(`Planned ${chalk.cyan(String(planned.length))} pages to compete with ${analysis.domain}`);
        console.log("");
        planned.forEach((s, i) => {
          console.log(
            chalk.gray(`  ${String(i + 1).padStart(2)}. `) +
            chalk.dim(`[${s.type}] `) +
            s.keyword
          );
        });
        console.log("");
      }

      seeds = planned;
    } catch (err) {
      if (sitemapSpinner) {
        sitemapSpinner.fail(`Competitor analysis failed: ${err instanceof Error ? err.message : String(err)}`);
      }
      const msg = `Competitor analysis failed: ${err instanceof Error ? err.message : String(err)}`;
      if (jsonMode) { console.log(JSON.stringify({ success: false, error: msg })); }
      else { logger.error(msg); }
      process.exit(1);
    }
  } else if (contentType === "auto" && !options.expand && !options.template) {
    const originalSeeds = [...seeds];
    seeds = [];

    for (const seed of originalSeeds) {
      if (seed.type && seed.type !== "auto") {
        seeds.push(seed);
        continue;
      }

      const planSpinner = jsonMode ? null : ora(
        `Planning content for "${chalk.cyan(seed.keyword)}"...`
      ).start();

      try {
        const planned = await smartExpand(seed.keyword, generateConfig, existingSlugList.length > 0 ? existingSlugList : undefined);
        if (planSpinner) {
          planSpinner.succeed(`Planned ${chalk.cyan(String(planned.length))} pages for "${seed.keyword}"`);
          console.log("");
          planned.forEach((s, i) => {
            console.log(
              chalk.gray(`  ${String(i + 1).padStart(2)}. `) +
              chalk.dim(`[${s.type}] `) +
              s.keyword
            );
          });
          console.log("");
        }
        seeds.push(...planned);
      } catch (err) {
        if (planSpinner) {
          planSpinner.fail(`Planning failed for "${seed.keyword}": ${err instanceof Error ? err.message : String(err)}`);
        }
        seeds.push(seed);
      }
    }
  }

  if (!jsonMode) {
    logger.info(`Provider: ${chalk.cyan(provider)}${model ? ` (${model})` : ""}`);
    if (contentType !== "auto") {
      logger.info(`Content type: ${chalk.cyan(contentType)}`);
    }
    logger.info(`Web search: ${chalk.cyan(generateConfig.webSearch ? "enabled" : "disabled")}`);
    logger.info(`Rate limit: ${chalk.cyan(`${providerRateLimit.rpm} RPM`)} | Concurrency: ${chalk.cyan(String(providerRateLimit.concurrency))}`);
    logger.info(`Generating ${chalk.cyan(String(seeds.length))} page(s)...\n`);
  }

  let internalLinks: string[] = [];
  if (config?.internalLinking?.enabled) {
    const linkSpinner = jsonMode ? null : ora("Fetching internal links...").start();
    try {
      internalLinks = await fetchInternalLinks(config.internalLinking);
      if (linkSpinner) linkSpinner.succeed(`Loaded ${internalLinks.length} internal link URLs`);
    } catch (err) {
      if (linkSpinner) linkSpinner.warn(`Could not fetch internal links: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  generateConfig.internalLinks = internalLinks;

  const forceOverwrite = !!options.force;
  const refreshDays = options.refresh ? parseInt(options.refresh, 10) : 0;
  const refreshMs = refreshDays * 24 * 60 * 60 * 1000;

  if (!forceOverwrite) {
    const before = seeds.length;
    seeds = seeds.filter((seed) => {
      const slug = seed.slug || slugify(seed.keyword);
      if (!existingSlugSet.has(slug)) return true;

      if (refreshDays > 0) {
        const age = getPageAge(slug);
        if (age !== null && age > refreshMs) return true;
      }

      return false;
    });
    const skipped = before - seeds.length;
    if (skipped > 0 && !jsonMode) {
      logger.info(`Skipped ${chalk.yellow(String(skipped))} page(s) that already exist. Use ${chalk.cyan("--force")} to overwrite.`);
    }
  }

  if (seeds.length === 0) {
    if (jsonMode) {
      console.log(JSON.stringify({ success: true, generated: 0, failed: 0, pages: [], errors: [], message: "All pages already exist. Use --force to regenerate." }));
    } else {
      logger.success("All pages already exist. Nothing to generate.");
      logger.info(`Use ${chalk.cyan("--force")} to overwrite or ${chalk.cyan("--refresh <days>")} to update pages older than N days.`);
    }
    closeDb();
    return;
  }

  let successCount = 0;
  let failCount = 0;
  const jsonPages: { slug: string; title: string; keyword: string; meta_description: string; published_date: string; page_type: string }[] = [];
  const jsonErrors: { keyword: string; error: string }[] = [];

  const limiter = new RateLimiter(providerRateLimit);
  const batchSize = providerRateLimit.batchSize || providerRateLimit.concurrency || 3;
  const useParallel = seeds.length > 3 && batchSize > 1;

  if (useParallel) {
    if (!jsonMode) {
      logger.info(`Using parallel generation (batch size: ${batchSize})\n`);
    }

    const spinners = new Map<number, ReturnType<typeof ora>>();

    await limiter.executeBatch(
      seeds,
      async (seed) => {
        const detectedType = resolveContentType(seed, generateConfig);
        return { page: await generateAndStore(seed, generateConfig), detectedType, seed };
      },
      batchSize,
      (result, index) => {
        if (!result) return;
        const { page, detectedType } = result;
        successCount++;
        jsonPages.push({
          slug: page.slug,
          title: page.title,
          keyword: page.keyword,
          meta_description: page.meta_description,
          published_date: page.published_date,
          page_type: detectedType,
        });
        if (!jsonMode) {
          const progress = `[${index + 1}/${seeds.length}]`;
          console.log(
            chalk.green("  ✔ ") +
            chalk.gray(progress + " ") +
            chalk.dim(`[${detectedType}] `) +
            chalk.green(page.title) +
            chalk.gray(` -> /${page.slug}`)
          );
        }
      },
      (err, item, index) => {
        failCount++;
        jsonErrors.push({ keyword: item.keyword, error: err.message });
        if (!jsonMode) {
          const progress = `[${index + 1}/${seeds.length}]`;
          console.log(
            chalk.red("  ✗ ") +
            chalk.gray(progress + " ") +
            chalk.red(`Failed: ${item.keyword} - ${err.message}`)
          );
        }
      }
    );
  } else {
    for (let i = 0; i < seeds.length; i++) {
      const seed = seeds[i];
      const detectedType = resolveContentType(seed, generateConfig);
      const progress = `[${i + 1}/${seeds.length}]`;
      const pageSpinner = jsonMode ? null : ora(
        `${progress} ${chalk.dim(`[${detectedType}]`)} ${chalk.cyan(seed.keyword)}`
      ).start();

      try {
        const page = await limiter.execute(() => generateAndStore(seed, generateConfig));
        if (pageSpinner) {
          pageSpinner.succeed(
            `${progress} ${chalk.dim(`[${detectedType}]`)} ${chalk.green(page.title)} -> /${page.slug}`
          );
        }
        successCount++;
        jsonPages.push({
          slug: page.slug,
          title: page.title,
          keyword: page.keyword,
          meta_description: page.meta_description,
          published_date: page.published_date,
          page_type: detectedType,
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (pageSpinner) {
          pageSpinner.fail(`${progress} Failed: ${seed.keyword} - ${errMsg}`);
        }
        failCount++;
        jsonErrors.push({ keyword: seed.keyword, error: errMsg });
      }
    }
  }

  closeDb();

  if (jsonMode) {
    console.log(JSON.stringify({
      success: failCount === 0,
      generated: successCount,
      failed: failCount,
      pages: jsonPages,
      errors: jsonErrors,
    }));
  } else {
    console.log("");
    logger.success(
      `Generation complete: ${chalk.green(`${successCount} succeeded`)}, ${chalk.red(`${failCount} failed`)}`
    );
    logger.info('Run "contentclaw serve" to start the API server and access your pages.');

    if (successCount > 10) {
      console.log("");
      console.log(chalk.yellow("  ⚠  ") + chalk.yellow.bold("Content at scale - read this before publishing"));
      console.log(chalk.gray("  ─────────────────────────────────────────────────────────────────"));
      console.log(chalk.gray("  Publishing large volumes of AI-generated content all at once can"));
      console.log(chalk.gray("  trigger Google quality filters or algorithm penalties. Your rankings"));
      console.log(chalk.gray("  may initially rise, then drop significantly after an update."));
      console.log("");
      console.log(chalk.gray("  Best practices:"));
      console.log(chalk.gray("    • Publish gradually - drip-feed pages over days or weeks"));
      console.log(chalk.gray("    • Review and edit content before publishing"));
      console.log(chalk.gray("    • Add unique value - images, data, personal experience"));
      console.log(chalk.gray("    • Monitor Google Search Console for manual actions"));
      console.log(chalk.gray("    • Follow SEO experts to stay updated on algorithm changes"));
      console.log(chalk.gray("  ─────────────────────────────────────────────────────────────────"));
      console.log(chalk.gray("  Learn more: ") + chalk.cyan("http://localhost:3099/experts"));
      console.log("");
    }
  }
}
