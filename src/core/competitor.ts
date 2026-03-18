import { parseStringPromise } from "xml2js";
import type { SeedEntry, ContentType, GenerateConfig } from "../types/index.js";
import { slugify } from "../utils/slugify.js";
import { getProvider } from "../providers/index.js";

export interface CompetitorPage {
  url: string;
  slug: string;
  title?: string;
  lastmod?: string;
}

export interface CompetitorAnalysis {
  domain: string;
  totalUrls: number;
  pages: CompetitorPage[];
}

export async function fetchCompetitorSitemap(sitemapUrl: string): Promise<CompetitorAnalysis> {
  const urls = await crawlSitemap(sitemapUrl);
  const domain = extractDomain(sitemapUrl);

  const pages: CompetitorPage[] = urls.map((entry) => ({
    url: entry.loc,
    slug: extractSlug(entry.loc),
    title: titleFromSlug(extractSlug(entry.loc)),
    lastmod: entry.lastmod,
  }));

  return { domain, totalUrls: pages.length, pages };
}

interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

async function crawlSitemap(url: string): Promise<SitemapEntry[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const result = await parseStringPromise(xml);
  const entries: SitemapEntry[] = [];

  if (result.urlset?.url) {
    for (const entry of result.urlset.url) {
      if (entry.loc?.[0]) {
        entries.push({
          loc: entry.loc[0],
          lastmod: entry.lastmod?.[0],
        });
      }
    }
  }

  if (result.sitemapindex?.sitemap) {
    for (const sitemap of result.sitemapindex.sitemap) {
      if (sitemap.loc?.[0]) {
        try {
          const childEntries = await crawlSitemap(sitemap.loc[0]);
          entries.push(...childEntries);
        } catch {
          // skip unreachable child sitemaps
        }
      }
    }
  }

  return entries;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function extractSlug(url: string): string {
  try {
    const path = new URL(url).pathname;
    return path.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "homepage";
  } catch {
    return "unknown";
  }
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function extractWithParallel(
  urls: string[],
  apiKey: string,
  objective?: string
): Promise<{ url: string; title: string; excerpt: string }[]> {
  const batchSize = 10;
  const results: { url: string; title: string; excerpt: string }[] = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);

    const response = await fetch("https://api.parallel.ai/v1beta/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        urls: batch,
        objective: objective || "Extract the page title, main topic, and key content themes",
        excerpts: true,
        full_content: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Parallel.ai Extract failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;

    if (data.results && Array.isArray(data.results)) {
      for (const r of data.results) {
        results.push({
          url: r.url || "",
          title: r.title || "",
          excerpt: r.excerpt || r.content || "",
        });
      }
    }
  }

  return results;
}

export function buildCompetitorPlanPrompt(
  analysis: CompetitorAnalysis,
  topic: string,
  language: string,
  enrichedPages?: { url: string; title: string; excerpt: string }[],
  existingSlugs?: string[]
): string {
  const year = new Date().getFullYear();
  const samplePages = analysis.pages
    .filter((p) => p.slug !== "homepage" && p.slug.length > 3)
    .slice(0, 80);

  const pagesSection = enrichedPages && enrichedPages.length > 0
    ? enrichedPages.slice(0, 40).map((p) =>
        `- URL: ${p.url}\n  Title: "${p.title}"\n  Content: ${p.excerpt.slice(0, 200)}`
      ).join("\n")
    : samplePages.map((p) =>
        `- /${p.slug} (Title: "${p.title}"${p.lastmod ? `, Updated: ${p.lastmod}` : ""})`
      ).join("\n");

  return `TODAY'S DATE: ${new Date().toLocaleString("en-US", { month: "long" })} ${year}. The current year is ${year}.

You are a content strategist analyzing a competitor's website to create a BETTER content plan.

COMPETITOR: ${analysis.domain} (${analysis.totalUrls} total pages)
TOPIC FOCUS: "${topic}"
LANGUAGE: ${language}

COMPETITOR'S PAGES:
${pagesSection}

YOUR TASK:
Analyze the competitor's content and generate a plan to BEAT them:
1. Find gaps - topics they DON'T cover well or at all
2. Find opportunities - their weak pages you can do better
3. Find angles - subtopics or comparisons they missed
4. Match their strong pages with even better versions

For EACH page, pick the best content type from: blog, glossary, comparison, listicle, landing, how-to, alternatives, review, hub.

ACCURACY RULES (CRITICAL):
- Every product, tool, or service you mention MUST be real and currently active.
- For "comparison": ONLY compare products that are in the SAME category and serve the SAME purpose. "Ahrefs vs Semrush" = both SEO tools = VALID. "Ahrefs vs Perplexity" = different categories = INVALID. "Screaming Frog vs Sitebulb" = both crawlers = VALID.
- For "alternatives": the main product MUST be well-known in this domain. Alternatives MUST serve the same function.
- For "review": ONLY review products that are real, available, and directly relevant to "${topic}".
- For "listicle": every implied item must be a real, verifiable thing.
- For "glossary": use real industry terminology that practitioners actually use.
- For "how-to": specific, achievable tasks - not vague concepts.

PLANNING RULES:
- Only pick types that make REAL SENSE. Do NOT force types that are unnatural.
- Generate keywords real people search for - not generic filler.
- Each keyword must be specific enough for its own dedicated page.
- Include a mix of pages that directly compete AND pages that fill gaps.
- Use ${year} where it adds value.
- Aim for 15-30 pages total. Quality over quantity.
${existingSlugs && existingSlugs.length > 0 ? `
EXISTING PAGES ON YOUR SITE (do NOT duplicate):
${existingSlugs.slice(0, 50).map((s) => `- /${s}`).join("\n")}

Generate pages that COMPLEMENT your existing content while competing with the competitor.` : ""}

Return ONLY a JSON array. No markdown, no explanation:
[
  {"keyword": "specific keyword here", "type": "blog"},
  {"keyword": "what is crawl budget", "type": "glossary"},
  {"keyword": "Screaming Frog vs Sitebulb", "type": "comparison"}
]`;
}

export async function analyzeCompetitor(
  sitemapUrl: string,
  topic: string,
  config: GenerateConfig,
  existingSlugs?: string[]
): Promise<SeedEntry[]> {
  const analysis = await fetchCompetitorSitemap(sitemapUrl);

  let enrichedPages: { url: string; title: string; excerpt: string }[] | undefined;
  const parallelKey = process.env.PARALLEL_API_KEY;

  if (parallelKey) {
    const topPages = analysis.pages
      .filter((p) => {
        const lower = p.slug.toLowerCase();
        return topic.toLowerCase().split(/\s+/).some((w) => lower.includes(w));
      })
      .slice(0, 20);

    if (topPages.length > 0) {
      try {
        enrichedPages = await extractWithParallel(
          topPages.map((p) => p.url),
          parallelKey,
          `Extract the main topic, key arguments, and content structure of this page about "${topic}"`
        );
      } catch {
        // fall back to slug-based analysis
      }
    }
  }

  const provider = getProvider(config.provider);
  const prompt = buildCompetitorPlanPrompt(
    analysis,
    topic,
    config.language || "en",
    enrichedPages,
    existingSlugs
  );

  const raw = await provider.generateRaw(prompt, config);

  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const items = JSON.parse(jsonMatch[0]) as { keyword: string; type: string }[];
      if (Array.isArray(items)) {
        return items
          .filter((item) => item.keyword && item.type)
          .map((item) => ({
            keyword: item.keyword,
            type: item.type as ContentType,
            slug: slugify(item.keyword),
          }));
      }
    } catch {
      // fall through
    }
  }

  return [{ keyword: topic, type: "blog" as ContentType, slug: slugify(topic) }];
}
