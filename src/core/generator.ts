import type {
  SeedEntry,
  GenerateConfig,
  GeneratedContent,
  StoredPage,
  BrandConfig,
  ContentType,
  InternalLink,
  ExternalLink,
} from "../types/index.js";
import { getProvider } from "../providers/index.js";
import { slugify } from "../utils/slugify.js";
import { insertPage, getExistingPageLinks, slugExists } from "./store.js";
import { buildLinkingPromptSection } from "./linker.js";

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

const YMYL_SIGNALS = [
  "health", "medical", "medicine", "disease", "symptom", "treatment", "diagnosis",
  "drug", "medication", "supplement", "vitamin", "diet", "weight loss", "fitness",
  "mental health", "anxiety", "depression", "therapy", "doctor", "nurse",
  "finance", "investment", "stock", "crypto", "bitcoin", "trading", "tax",
  "mortgage", "loan", "credit", "debt", "insurance", "retirement", "banking",
  "legal", "lawyer", "attorney", "lawsuit", "court", "regulation", "compliance",
  "safety", "emergency", "first aid", "poison", "hazard",
  "pregnancy", "fertility", "childbirth", "pediatric",
];

const FORBIDDEN_PHRASES = [
  "in today's fast-paced", "in today's digital age", "in today's world",
  "in this day and age", "in the ever-evolving", "ever-changing landscape",
  "dive into", "dive deep", "delve into", "let's explore",
  "it's important to note", "it's worth noting", "it is worth mentioning",
  "without further ado", "in conclusion", "to sum up", "at the end of the day",
  "game-changer", "game changer", "unlock the power", "unlock the potential",
  "unleash", "harness the power", "navigate the complexities",
  "navigate the landscape", "the landscape of", "in the realm of", "realm of",
  "tapestry", "multifaceted", "holistic approach", "paradigm shift",
  "synergy", "leverage", "utilize", "facilitate", "streamline", "robust",
  "cutting-edge", "groundbreaking", "revolutionize", "elevate your",
  "take your .* to the next level", "embark on", "journey towards",
  "not just .* but also", "whether you're a .* or a", "look no further",
  "buckle up", "the world of", "the power of", "a comprehensive guide",
  "everything you need to know", "the ultimate guide", "demystify", "unravel",
  "it goes without saying", "needless to say", "this is where .* comes in",
  "stays ahead of the curve", "ahead of the curve", "think of it as",
  "picture this", "imagine a world", "fast-paced", "bustling",
  "moreover", "furthermore", "additionally", "consequently",
];

function isYmyl(keyword: string): boolean {
  const lower = keyword.toLowerCase();
  return YMYL_SIGNALS.some((s) => lower.includes(s));
}

function currentDateContext(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleString("en-US", { month: "long" });
  return `TODAY'S DATE: ${month} ${year}. The current year is ${year}.`;
}

function buildBrandSection(brand?: BrandConfig): string {
  if (!brand || (!brand.name && !brand.url)) return "";
  let s = "\nBRAND CONTEXT:";
  if (brand.name) s += `\nBrand name: ${brand.name}`;
  if (brand.url) s += `\nWebsite: ${brand.url}`;
  if (brand.description) s += `\nAbout: ${brand.description}`;
  s += `\nMention the brand naturally where relevant. A subtle reference is enough - do not force it.`;
  return s;
}

function buildExistingPagesSection(
  pages: { slug: string; title: string; keyword: string }[],
  currentSlug: string,
  slugPrefix?: string
): string {
  if (pages.length === 0) return "";
  const relevant = pages
    .filter((p) => p.slug !== currentSlug)
    .slice(0, 30);
  if (relevant.length === 0) return "";

  const prefix = slugPrefix ? `/${slugPrefix.replace(/^\/|\/$/g, "")}` : "";
  const buildPath = (slug: string) => `${prefix}/${slug}`;

  let s = `
INTERNAL LINKING (REQUIRED):
You MUST embed 2-5 internal links as <a> tags inside the body HTML.

CRITICAL RULES FOR INTERNAL LINKS:
1. You may ONLY link to the EXACT URLs listed below. Do NOT invent or guess internal URLs.
2. The href MUST be copied exactly from the "Path" value below. Not modified, not shortened.
3. The anchor text MUST be natural and contextual - do NOT use the page title as anchor text. Write the anchor like a human would naturally reference that topic in a sentence.
4. Example: instead of <a href="/what-is-crawl-budget">Crawl Budget: Definition and Importance for SEO in 2026</a>, write <a href="/what-is-crawl-budget">crawl budget</a> or <a href="/what-is-crawl-budget">managing your crawl budget</a>.

Available pages to link to (pick the most relevant 2-5):
${relevant.map((p) => `- Path: "${buildPath(p.slug)}" | About: "${p.title}"`).join("\n")}

Embed links naturally within paragraphs where the topic is relevant. Never list them at the bottom.`;

  return s;
}

function buildYmylSection(keyword: string): string {
  if (!isYmyl(keyword)) return "";
  return `\nYMYL DISCLAIMER:\nThis is a YMYL topic. Add a disclaimer at the very end of the body:\n<div class="disclaimer"><p><strong>Disclaimer:</strong> This article is for informational purposes only and does not constitute professional medical, financial, legal, or safety advice. Always consult a qualified professional before making decisions based on this content.</p></div>`;
}

const WRITING_RULES = `WRITING RULES:
1. Write like a knowledgeable human. Be direct, specific, useful. No filler.
2. Short sentences. Mix in longer ones for flow. Paragraphs: 2-4 sentences max.
3. Give concrete examples, real numbers, specific names. No vague generalities.
4. Use "you" and "your" to address the reader directly.
5. Body must be clean HTML: h2, h3, p, ul, ol, li, strong, em, a, table, thead, tbody, tr, th, td, div tags only. No h1.
6. Use hyphens (-) for dashes. NEVER use \u2014 or \u2013 characters.
7. No exclamation marks unless quoting someone. No emoji.

FORBIDDEN PHRASES (never use):
${FORBIDDEN_PHRASES.map((p) => `- "${p}"`).join("\n")}

Also avoid:
- Starting sentences with "So," "Well," "Now,"
- Rhetorical questions as section openers
- Generic intros that restate the title
- Filler sentences that say nothing
- Any sentence so generic it could appear in any article about any topic`;

function buildExternalLinkRules(contentType: Exclude<ContentType, "auto">, webSearchEnabled?: boolean): string {
  if (!webSearchEnabled) {
    return `
EXTERNAL LINKS:
Do NOT include any external links (https://...) in the body HTML. You do not have access to verify URLs, so do not invent them.`;
  }

  if (contentType === "listicle" || contentType === "alternatives" || contentType === "review") {
    return `
EXTERNAL LINKS:
Include external links (<a href="https://..." target="_blank" rel="noopener">) to the official homepage for each product/tool/service you mention. Every listed item should link to its real official site. Only use URLs you are certain exist - do NOT invent or guess URLs.`;
  }
  return `
EXTERNAL LINKS:
Include 2-5 external links (<a href="https://..." target="_blank" rel="noopener">) to authoritative sources. Only use URLs you are certain exist - official documentation, well-known sites like Wikipedia, GitHub, or major publications. Do NOT guess or invent URLs. If unsure about a URL, leave it out.`;
}

const OUTPUT_JSON = `Respond ONLY with a valid JSON object. No markdown fences, no text before or after.

{
  "title": "Clear page title",
  "meta_description": "Direct summary under 155 chars",
  "body": "Full HTML content with internal links and external reference links embedded as <a> tags"
}`;

// ---------------------------------------------------------------------------
// Resolve content type: use explicit type or fallback to "blog"
// ---------------------------------------------------------------------------

export function resolveContentType(seed: SeedEntry, config: GenerateConfig): Exclude<ContentType, "auto"> {
  const explicit = seed.type || config.contentType;
  if (explicit && explicit !== "auto") return explicit as Exclude<ContentType, "auto">;
  return "blog";
}

// ---------------------------------------------------------------------------
// Per-type prompt builders
// ---------------------------------------------------------------------------

function sharedSections(seed: SeedEntry, config: GenerateConfig, linkingSection: string): string {
  const currentSlug = seed.slug || slugify(seed.keyword);
  const contentType = resolveContentType(seed, config);
  return `${buildYmylSection(seed.keyword)}
${buildExternalLinkRules(contentType, config.webSearch)}

${buildExistingPagesSection(config.existingPages || [], currentSlug, config.slugPrefix)}
${linkingSection}

${OUTPUT_JSON}`;
}

function buildBlogPrompt(seed: SeedEntry, config: GenerateConfig, ls: string): string {
  return `${currentDateContext()}
${buildBrandSection(config.brand)}

Write a thorough article about: "${seed.keyword}"
${seed.category ? `Category: "${seed.category}"` : ""}
Language: ${config.language || "en"}
Tone: ${config.tone || "informative"}
Target length: ~${config.wordCount || 1500} words

${WRITING_RULES}

STRUCTURE GUIDELINES (adapt to the topic):
- Start with something useful immediately.
- Use h2 sections that break the topic into logical parts.
- Include specific data, examples, or comparisons where they add value.
- If a comparison table makes sense for this topic, include one. If not, skip it.
- If FAQs make sense, add 2-3. If not, skip them.
- End with a practical takeaway.

Every paragraph must teach something specific.
${sharedSections(seed, config, ls)}`;
}

function buildLandingPrompt(seed: SeedEntry, config: GenerateConfig, ls: string): string {
  return `${currentDateContext()}
${buildBrandSection(config.brand)}

Create a programmatic SEO landing page for: "${seed.keyword}"
${seed.category ? `Category: "${seed.category}"` : ""}
Language: ${config.language || "en"}
Tone: ${config.tone || "professional"}
Target length: ~${config.wordCount || 800} words

This is a SERVICE/LOCATION/PRODUCT landing page, NOT a blog post. Goal: rank and convert.

${WRITING_RULES}

LANDING PAGE STRUCTURE:
- Clear value proposition for this specific query.
- Location-specific or product-specific details if applicable.
- Social proof cues: results, benchmarks, outcomes.
- Practical details: pricing ranges, timelines, features.
- Short comparison table if it helps decision-making.
- Clear next step for the reader.
- No FAQ section unless the query strongly implies informational intent.
${sharedSections(seed, config, ls)}`;
}

function buildGlossaryPrompt(seed: SeedEntry, config: GenerateConfig, ls: string): string {
  const term = seed.keyword
    .replace(/^(what (?:is|are) |define |definition of |meaning of )/i, "")
    .replace(/( meaning| definition| glossary)$/i, "")
    .trim();

  return `${currentDateContext()}
${buildBrandSection(config.brand)}

Write a glossary definition page for the term: "${term}"
Original query: "${seed.keyword}"
${seed.category ? `Category: "${seed.category}"` : ""}
Language: ${config.language || "en"}

This is a GLOSSARY ENTRY, not a blog post. Reference-style, focused.

${WRITING_RULES}

GLOSSARY PAGE STRUCTURE:
- Start with a clear, concise definition in 1-2 sentences.
- "Why it matters" or "How it works" section (2-3 short paragraphs).
- "Common examples" or "Types" section if relevant.
- Short comparison vs similar terms if helpful (table or list).
- 400-700 words total. No FAQs. No forced tables.

SCHEMA MARKUP - wrap the definition:
<div class="glossary-entry" itemscope itemtype="https://schema.org/DefinedTerm">
  <h2 itemprop="name">${term}</h2>
  <div itemprop="description"><p>Definition here...</p></div>
</div>

Continue with remaining content outside the schema wrapper.
${sharedSections(seed, config, ls)}`;
}

function buildComparisonPrompt(seed: SeedEntry, config: GenerateConfig, ls: string): string {
  return `${currentDateContext()}
${buildBrandSection(config.brand)}

Write a comparison page for: "${seed.keyword}"
${seed.category ? `Category: "${seed.category}"` : ""}
Language: ${config.language || "en"}
Tone: ${config.tone || "informative"}
Target length: ~${config.wordCount || 1200} words

This is a COMPARISON page. Help the reader decide between options.

${WRITING_RULES}

COMPARISON PAGE STRUCTURE:
- Quick verdict upfront (2-3 sentences). Which wins for which use case.
- Key differences in h2 sections. Cover factors that matter for choosing.
- Comparison table with real data points, specs, prices, features (required).
- For each factor, state which is better and why. No wishy-washy "it depends."
- Use cases: "Choose A if you need X. Choose B if you need Y."
- Concrete recommendation at the end.
- 2-3 FAQs if they address real decision questions.

Real names, real numbers, real specs. No "Product A" vs "Product B" placeholders.
${sharedSections(seed, config, ls)}`;
}

function buildListiclePrompt(seed: SeedEntry, config: GenerateConfig, ls: string): string {
  return `${currentDateContext()}
${buildBrandSection(config.brand)}

Write a list-based page for: "${seed.keyword}"
${seed.category ? `Category: "${seed.category}"` : ""}
Language: ${config.language || "en"}
Tone: ${config.tone || "informative"}
Target length: ~${config.wordCount || 1200} words

This is a LIST/RANKING page. Curated options with clear reasoning.

${WRITING_RULES}

TITLE RULE:
- The title MUST include the actual number of items you list (e.g. "7 Best...", "12 Top...").
- Do NOT use a round/generic number unless it matches. Count your items first, then set the title.

LIST PAGE STRUCTURE:
- Selection criteria (1-2 sentences).
- Each item gets its own h2: name, what makes it notable, who it's for, key specs, downsides.
- Real product/tool/method names. No made-up examples.
- Summary comparison table showing all items side by side.
- Order with purpose: best overall first, then by use case or price.
- 80-150 words per item.
- "How to choose" section at the end.
${sharedSections(seed, config, ls)}`;
}

function buildHowToPrompt(seed: SeedEntry, config: GenerateConfig, ls: string): string {
  return `${currentDateContext()}
${buildBrandSection(config.brand)}

Write a step-by-step how-to guide for: "${seed.keyword}"
${seed.category ? `Category: "${seed.category}"` : ""}
Language: ${config.language || "en"}
Tone: ${config.tone || "instructional"}
Target length: ~${config.wordCount || 1200} words

This is a HOW-TO page. The reader wants clear, actionable steps.

${WRITING_RULES}

HOW-TO PAGE STRUCTURE:
- Brief intro: what they'll achieve and prerequisites (tools, time estimate).
- Numbered steps using h2 tags: "Step 1: [Action]", "Step 2: [Action]", etc.
- Each step: clear action + why it matters + specific details (exact settings, commands, amounts).
- Pro tips or common mistakes inline where relevant.
- "Troubleshooting" or "Common issues" section if the task has known pitfalls.
- End with expected result: what success looks like.
- Use schema-ready markup:
<div class="how-to" itemscope itemtype="https://schema.org/HowTo">
  <meta itemprop="name" content="How to...">
  (steps go here)
</div>
${sharedSections(seed, config, ls)}`;
}

function buildAlternativesPrompt(seed: SeedEntry, config: GenerateConfig, ls: string): string {
  const subject = seed.keyword
    .replace(/^alternatives? (?:to|for) /i, "")
    .replace(/ alternative(?:s)?$/i, "")
    .replace(/ replacement(?:s)?$/i, "")
    .replace(/ substitute(?:s)?$/i, "")
    .trim();

  return `${currentDateContext()}
${buildBrandSection(config.brand)}

Write an alternatives page: find alternatives to "${subject}"
Original query: "${seed.keyword}"
${seed.category ? `Category: "${seed.category}"` : ""}
Language: ${config.language || "en"}
Tone: ${config.tone || "informative"}
Target length: ~${config.wordCount || 1200} words

This is an ALTERNATIVES page. The reader wants options to replace or compare against "${subject}".

${WRITING_RULES}

ALTERNATIVES PAGE STRUCTURE:
- Brief intro: why someone might look for alternatives (cost, features, limitations of ${subject}).
- 5-8 alternatives, each with its own h2.
- For each: name, what it does differently, pricing, best for whom, key advantage over ${subject}.
- Comparison table: ${subject} vs all alternatives on key metrics.
- "How to choose" section at the end.
- Real products, real pricing, real differences.
${sharedSections(seed, config, ls)}`;
}

function buildReviewPrompt(seed: SeedEntry, config: GenerateConfig, ls: string): string {
  const product = seed.keyword
    .replace(/^review (?:of )?/i, "")
    .replace(/ review(?: \d{4})?$/i, "")
    .replace(/ honest review$/i, "")
    .replace(/ worth it$/i, "")
    .replace(/^is /i, "")
    .replace(/ good$/i, "")
    .replace(/ worth$/i, "")
    .trim();

  return `${currentDateContext()}
${buildBrandSection(config.brand)}

Write a review page for: "${product}"
Original query: "${seed.keyword}"
${seed.category ? `Category: "${seed.category}"` : ""}
Language: ${config.language || "en"}
Tone: ${config.tone || "honest"}
Target length: ~${config.wordCount || 1200} words

This is a REVIEW page. Give an honest, balanced assessment.

${WRITING_RULES}

REVIEW PAGE STRUCTURE:
- Quick verdict (2-3 sentences): is it worth it, and for whom.
- "What is ${product}" section: brief overview, what it does, who makes it.
- Pros section with specific, concrete positives.
- Cons section with real drawbacks.
- Key features breakdown with h2/h3 sections.
- Pricing information.
- "Who should use ${product}" and "Who should skip it" sections.
- Comparison table vs 2-3 closest competitors.
- Final verdict with specific recommendation.
${sharedSections(seed, config, ls)}`;
}

function buildHubPrompt(seed: SeedEntry, config: GenerateConfig, ls: string): string {
  return `${currentDateContext()}
${buildBrandSection(config.brand)}

Write a pillar/hub page for the topic: "${seed.keyword}"
${seed.category ? `Category: "${seed.category}"` : ""}
Language: ${config.language || "en"}
Tone: ${config.tone || "authoritative"}
Target length: ~${config.wordCount || 2000} words

This is a HUB/PILLAR page. Definitive overview that links out to more specific sub-pages.

${WRITING_RULES}

HUB PAGE STRUCTURE:
- Strong opening that establishes authority on this topic.
- Break the topic into 6-10 major subtopics, each with its own h2 section.
- Each section: 2-3 paragraphs covering key points, then naturally link to deeper content.
- Include a "quick reference" or overview table summarizing the subtopics.
- End with a logical reading order or learning path for someone new to this topic.

This page should heavily link to other pages on the site.
${sharedSections(seed, config, ls)}`;
}

// ---------------------------------------------------------------------------
// Prompt router
// ---------------------------------------------------------------------------

export function buildPrompt(
  seed: SeedEntry,
  config: GenerateConfig,
  linkingSection: string
): string {
  if (seed.custom_prompt) {
    return `${currentDateContext()}
${buildBrandSection(config.brand)}

${seed.custom_prompt}

${WRITING_RULES}
${sharedSections(seed, config, linkingSection)}`;
  }

  const contentType = resolveContentType(seed, config);

  switch (contentType) {
    case "glossary": return buildGlossaryPrompt(seed, config, linkingSection);
    case "comparison": return buildComparisonPrompt(seed, config, linkingSection);
    case "listicle": return buildListiclePrompt(seed, config, linkingSection);
    case "landing": return buildLandingPrompt(seed, config, linkingSection);
    case "how-to": return buildHowToPrompt(seed, config, linkingSection);
    case "alternatives": return buildAlternativesPrompt(seed, config, linkingSection);
    case "review": return buildReviewPrompt(seed, config, linkingSection);
    case "hub": return buildHubPrompt(seed, config, linkingSection);
    case "blog":
    default: return buildBlogPrompt(seed, config, linkingSection);
  }
}

// ---------------------------------------------------------------------------
// Link extraction from generated HTML
// ---------------------------------------------------------------------------

function extractLinksFromBody(body: string, slugPrefix?: string): { internal: InternalLink[]; external: ExternalLink[] } {
  const internal: InternalLink[] = [];
  const external: ExternalLink[] = [];
  const prefix = slugPrefix ? `/${slugPrefix.replace(/^\/|\/$/g, "")}` : "";
  const pattern = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  while ((match = pattern.exec(body)) !== null) {
    const url = match[1];
    const anchor = match[2].replace(/<[^>]*>/g, "").trim();
    if (!anchor) continue;
    const isExternal = url.startsWith("http://") || url.startsWith("https://");
    const isInternal = url.startsWith("/") || (prefix && url.startsWith(prefix));
    if (isExternal) {
      external.push({ anchor, url });
    } else if (isInternal) {
      internal.push({ anchor, url });
    }
  }
  return { internal, external };
}

// ---------------------------------------------------------------------------
// Template expansion: cross-multiply variables
// ---------------------------------------------------------------------------

export function expandTemplate(
  template: string,
  variableLists: Record<string, string[]>
): SeedEntry[] {
  const varNames = Object.keys(variableLists);
  if (varNames.length === 0) return [{ keyword: template }];

  const combinations: Record<string, string>[] = [{}];
  for (const varName of varNames) {
    const values = variableLists[varName];
    const expanded: Record<string, string>[] = [];
    for (const combo of combinations) {
      for (const val of values) {
        expanded.push({ ...combo, [varName]: val });
      }
    }
    combinations.length = 0;
    combinations.push(...expanded);
  }

  return combinations.map((combo) => {
    let keyword = template;
    for (const [varName, val] of Object.entries(combo)) {
      keyword = keyword.replace(new RegExp(`\\{${varName}\\}`, "gi"), val);
    }
    return { keyword, slug: slugify(keyword) };
  });
}

// ---------------------------------------------------------------------------
// AI-powered smart expansion (replaces static fanOut)
// ---------------------------------------------------------------------------

function buildSmartExpandPrompt(topic: string, language: string, existingSlugs?: string[]): string {
  const year = new Date().getFullYear();

  return `${currentDateContext()}

You are a content strategist. Given the topic "${topic}", generate a comprehensive content plan for a website.

This tool is UNIVERSAL - not just for SEO topics. The topic could be anything: cooking, fitness, software, finance, travel, education, law, medicine, art, gaming, etc. Adapt your plan to the topic's industry.

For EACH page, decide the best content type from: blog, glossary, comparison, listicle, landing, how-to, alternatives, review, hub.

ACCURACY RULES (CRITICAL):
- Every product, tool, or service you mention MUST be real and currently active. No made-up names.
- For "comparison": ONLY compare products/tools/services that are in the SAME category and serve the SAME purpose. "Ahrefs vs Semrush" is valid (both are SEO tools). "Ahrefs vs Perplexity" is INVALID (different categories). "KitchenAid vs Cuisinart" is valid (both are kitchen appliances). "KitchenAid vs Uber" is INVALID.
- For "alternatives": the main product MUST be a real, well-known product in the topic's domain. The alternatives MUST serve the same function.
- For "review": ONLY review products that are real, currently available, and directly relevant to the topic.
- For "listicle": every item in the implied list MUST be a real, verifiable thing. Be specific about what you're listing and why.
- For "glossary": terms MUST be real industry/domain terminology that practitioners actually use.
- For "how-to": tasks MUST be specific, achievable actions - not vague concepts.

PLANNING RULES:
- Only pick types that make REAL SENSE for this topic. Do NOT force types that are unnatural.
- Generate keywords that real people actually search for. Not generic filler.
- Each keyword should be specific enough to warrant its own dedicated page.
- Use ${year} in keywords where it adds value (product reviews, best-of lists, annual guides).
- Aim for 15-25 pages total. Quality over quantity.
- Think about what a real person interested in "${topic}" would actually want to read.

Language: ${language}
${existingSlugs && existingSlugs.length > 0 ? `
EXISTING PAGES (do NOT duplicate these - generate NEW content only):
${existingSlugs.slice(0, 50).map((s) => `- /${s}`).join("\n")}

Generate pages that COMPLEMENT the existing ones, not repeat them. Find gaps, related subtopics, or deeper dives that aren't covered yet.` : ""}

Return ONLY a JSON array. No markdown, no explanation:
[
  {"keyword": "specific keyword here", "type": "blog"},
  {"keyword": "what is crawl budget", "type": "glossary"},
  {"keyword": "Screaming Frog vs Sitebulb", "type": "comparison"}
]`;
}

export interface SmartExpandResult {
  keyword: string;
  type: Exclude<ContentType, "auto">;
}

export async function smartExpand(
  topic: string,
  config: GenerateConfig,
  existingSlugs?: string[]
): Promise<SeedEntry[]> {
  const provider = getProvider(config.provider);
  const prompt = buildSmartExpandPrompt(topic, config.language || "en", existingSlugs);
  const raw = await provider.generateRaw(prompt, config);

  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const items = JSON.parse(jsonMatch[0]) as SmartExpandResult[];
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

  return [{ keyword: topic, type: "blog", slug: slugify(topic) }];
}

// ---------------------------------------------------------------------------
// Generation & storage
// ---------------------------------------------------------------------------

export async function generatePage(
  seed: SeedEntry,
  config: GenerateConfig
): Promise<GeneratedContent> {
  const provider = getProvider(config.provider);
  const linkingSection = buildLinkingPromptSection(config.internalLinks || []);
  const prompt = buildPrompt(seed, config, linkingSection);
  return provider.generate(prompt, config);
}

function stripEmdashes(text: string): string {
  return text.replace(/\u2014/g, " - ").replace(/\u2013/g, "-");
}

function validateInternalLinks(
  body: string,
  existingPages: { slug: string; title: string; keyword: string }[],
  slugPrefix?: string
): string {
  const existingSlugs = new Set(existingPages.map((p) => p.slug));
  const prefix = slugPrefix ? `/${slugPrefix.replace(/^\/|\/$/g, "")}` : "";

  return body.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>.*?<\/a>/gi, (fullMatch, url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) return fullMatch;
    const slug = url.replace(prefix + "/", "").replace(/^\//, "");
    if (existingSlugs.has(slug)) return fullMatch;
    const anchor = fullMatch.replace(/<\/?a[^>]*>/gi, "");
    return anchor;
  });
}

function stripHallucinatedExternalLinks(body: string): string {
  return body.replace(/<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>/gi, (_match, _url, anchor) => {
    return anchor.replace(/<[^>]*>/g, "");
  });
}

export async function generateAndStore(
  seed: SeedEntry,
  config: GenerateConfig
): Promise<StoredPage> {
  const freshPages = getExistingPageLinks();
  config.existingPages = freshPages;

  const contentType = resolveContentType(seed, config);
  const content = await generatePage(seed, config);
  const slug = seed.slug || slugify(seed.keyword);
  const now = new Date().toISOString();

  let body = content.body;
  body = stripEmdashes(body);
  if (!config.webSearch) {
    body = stripHallucinatedExternalLinks(body);
  }
  body = validateInternalLinks(body, freshPages, config.slugPrefix);

  content.title = stripEmdashes(content.title);
  content.meta_description = stripEmdashes(content.meta_description);

  const { internal: bodyInternalLinks, external: bodyExternalLinks } =
    extractLinksFromBody(body, config.slugPrefix);

  const uniqueInternalLinks = bodyInternalLinks.filter(
    (link, i, arr) => arr.findIndex((l) => l.url === link.url) === i
  );

  const allExternalLinks = [...bodyExternalLinks, ...(content.external_links || [])];
  const uniqueExternalLinks = allExternalLinks.filter(
    (link, i, arr) => arr.findIndex((l) => l.url === link.url) === i
  );

  return insertPage({
    slug,
    keyword: seed.keyword,
    title: content.title,
    meta_description: content.meta_description,
    body,
    internal_links: JSON.stringify(uniqueInternalLinks),
    external_links: JSON.stringify(uniqueExternalLinks),
    page_type: contentType,
    published_date: now,
  });
}

// ---------------------------------------------------------------------------
// Simple keyword expansion (for --expand with specific type)
// ---------------------------------------------------------------------------

export function buildExpandPrompt(topic: string, count: number, language: string, contentType?: ContentType): string {
  const year = new Date().getFullYear();

  const typeGuidance = contentType && contentType !== "auto"
    ? TYPE_EXPAND_GUIDANCE[contentType]
    : `Mix different search intents: informational, commercial, comparison, definitional, reviews, and alternatives.`;

  return `${currentDateContext()}

Generate exactly ${count} specific long-tail keyword variations for programmatic SEO pages about: "${topic}"

${typeGuidance}

Each keyword should be specific enough to be its own page. When a year reference helps, use ${year}.

Language: ${language}

Return ONLY a JSON array of keyword strings. No markdown, no explanation:
["keyword one", "keyword two", ...]`;
}

const TYPE_EXPAND_GUIDANCE: Record<Exclude<ContentType, "auto">, string> = {
  blog: `Generate article-worthy keywords. Focus on guides, strategies, educational queries.`,
  landing: `Generate service/product/location page keywords. Transactional or local intent: "{service} in {city}", "{product} pricing", "hire {profession}".`,
  glossary: `Generate definition keywords: "what is {term}", "{concept} meaning", "{acronym} explained". Focus on industry terminology. Each keyword should be a different specific term.`,
  comparison: `Generate comparison keywords: "{A} vs {B}", "difference between {X} and {Y}". Use real product/tool names.`,
  listicle: `Generate ranking keywords: "best {product} for {use case}", "top {N} {tools}", "cheapest {service}".`,
  "how-to": `Generate instructional keywords: "how to {action}", "step by step {process}", "{task} tutorial".`,
  alternatives: `Generate alternatives keywords using real product names: "{product} alternatives", "tools like {product}", "free {product} alternatives".`,
  review: `Generate review keywords using real product names: "{product} review ${new Date().getFullYear()}", "is {product} worth it".`,
  hub: `Generate broad topic keywords suitable for pillar/hub pages that can link to many sub-topics.`,
};

export async function expandKeyword(
  topic: string,
  count: number,
  config: GenerateConfig
): Promise<string[]> {
  const provider = getProvider(config.provider);
  const prompt = buildExpandPrompt(topic, count, config.language || "en", config.contentType);
  const raw = await provider.generateRaw(prompt, config);

  const jsonMatch = raw.match(/\[[\s\S]*?\]/);
  if (jsonMatch) {
    try {
      const keywords = JSON.parse(jsonMatch[0]);
      if (Array.isArray(keywords)) {
        return keywords
          .filter((k: unknown) => typeof k === "string" && k.length > 0)
          .slice(0, count);
      }
    } catch {
      // fall through
    }
  }

  return raw
    .split("\n")
    .map((line: string) => line.replace(/^[\d\-\.\*\s"]+/, "").replace(/["',\]\[]+$/g, "").trim())
    .filter((line: string) => line.length > 5 && line.length < 100)
    .slice(0, count);
}
