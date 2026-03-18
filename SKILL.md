---
name: contentclaw
description: Universal content engine - generate pages with AI from any topic, analyze competitor sitemaps, and serve via local REST API. Use when the user asks to create content, generate pages, analyze competitors, create glossary entries, landing pages, comparisons, listicles, how-to guides, alternatives, reviews, hub pages, bulk-create articles, expand topics, or start a content API. Features AI content planning with strict accuracy rules, competitor sitemap analysis with Parallel.ai deep extraction, web-grounded external links, natural internal linking with no 404s, emdash stripping, rate limiting, parallel generation, duplicate detection, and template mode. Supports OpenAI, Gemini, Anthropic, xAI, Qwen, and Ollama.
metadata: {"openclaw":{"emoji":"🦞","requires":{"anyBins":["contentclaw"]},"os":["linux","darwin","win32"]}}
---

# ContentClaw - Universal Content Engine

Generate pages with AI for any topic, analyze competitor sitemaps, and serve via local REST API for any CMS. Works for any subject - cooking, fitness, law, SaaS, travel, education, not just SEO. Built by [metehan.ai](https://metehan.ai).

**npm:** [contentclaw](https://www.npmjs.com/package/contentclaw) | **GitHub:** [metehan777/contentclaw](https://github.com/metehan777/contentclaw)

## When to Use

- User wants to generate content pages at scale for any topic
- User wants to analyze a competitor's website/sitemap and generate competing content
- User wants glossary, comparison, listicle, how-to, alternatives, review, landing, hub, or blog pages
- User wants to expand a single topic into a full content strategy (15-25 pages)
- User needs a local REST API to serve generated content to any CMS (WordPress, Webflow, Framer, custom)
- User asks to bulk-create articles with AI using templates and variable files
- User wants duplicate-aware generation that skips existing slugs or refreshes stale content

## Installation

```bash
npm install -g contentclaw
```

## Prerequisites

### API Keys

At least one AI provider API key is required. Set as environment variables or pass via `--api-key` or `contentclaw.config.json`:

| Provider | Environment Variable | Default Model | Notes |
|----------|---------------------|---------------|-------|
| OpenAI | `OPENAI_API_KEY` | `gpt-5.2` | Web search via `web_search` tool |
| Gemini | `GEMINI_API_KEY` | `gemini-3-flash-preview` | Web search via `googleSearch` grounding |
| Anthropic | `ANTHROPIC_API_KEY` | `claude-opus-4-6` | Web search via `web_search_20250305` tool |
| xAI (Grok) | `XAI_API_KEY` | `grok-3` | Web search via `web_search` tool |
| Qwen | `QWEN_API_KEY` | `qwen-max` | No native web search |
| Ollama | *(none needed)* | `llama3` | Local models, no web search |

### Optional Keys

| Key | Purpose |
|-----|---------|
| `PARALLEL_API_KEY` | Deep competitor page extraction via Parallel.ai Extract API |

## Configuration

### Interactive Setup

```bash
contentclaw init
```

This creates `contentclaw.config.json` in the current directory with all settings.

### Config File Structure (`contentclaw.config.json`)

```json
{
  "provider": "openai",
  "model": "gpt-5.2",
  "apiKey": "sk-...",
  "language": "en",
  "tone": "informative",
  "wordCount": 1500,
  "webSearch": true,
  "brand": {
    "name": "Your Brand",
    "url": "https://yourbrand.com",
    "description": "Short brand description for natural mentions in content"
  },
  "internalLinking": {
    "enabled": true,
    "source": "sitemap",
    "sitemapUrl": "https://yourbrand.com/sitemap.xml",
    "urls": [],
    "slugPrefix": "blog"
  },
  "server": {
    "port": 3099,
    "host": "localhost"
  },
  "rateLimit": {
    "openai": { "rpm": 500, "concurrency": 5, "batchSize": 5 },
    "gemini": { "rpm": 1000, "concurrency": 10, "batchSize": 10 }
  }
}
```

### Config Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `provider` | string | `"openai"` | Default AI provider |
| `model` | string | *(per provider)* | Model override |
| `apiKey` | string | *(env var)* | API key (overrides env var) |
| `language` | string | `"en"` | Content language code |
| `tone` | string | `"informative"` | Tone: informative, professional, casual, academic, persuasive, conversational |
| `wordCount` | number | `1500` | Target word count per page |
| `webSearch` | boolean | `true` | Enable web search/grounding for real external links |
| `brand.name` | string | — | Brand name for natural mentions |
| `brand.url` | string | — | Brand website URL |
| `brand.description` | string | — | Short brand description |
| `internalLinking.enabled` | boolean | `false` | Enable internal linking |
| `internalLinking.source` | string | `"manual"` | Link source: `sitemap`, `manual`, or `both` |
| `internalLinking.sitemapUrl` | string | — | Sitemap URL to fetch link targets from |
| `internalLinking.urls` | string[] | `[]` | Manual URL list for internal links |
| `internalLinking.slugPrefix` | string | — | URL path prefix for generated pages (e.g. `"blog"` → `/blog/slug`) |
| `server.port` | number | `3099` | API server port |
| `server.host` | string | `"localhost"` | API server host |
| `rateLimit.<provider>` | object | *(see defaults)* | Per-provider rate limit override |

### Rate Limit Defaults (Tier 1)

| Provider | RPM | Concurrency | Batch Size |
|----------|-----|-------------|------------|
| OpenAI | 500 | 5 | 5 |
| Gemini | 1000 | 10 | 10 |
| Anthropic | 50 | 3 | 3 |
| xAI | 60 | 3 | 3 |
| Qwen | 60 | 3 | 3 |
| Ollama | 999 | 1 | 1 |

You can override any of these in `contentclaw.config.json` under `rateLimit.<provider>`.

## Content Types

| Type | What it generates | Approx. words |
|------|-------------------|---------------|
| `blog` | Long-form article with sections, key takeaways | ~1500 |
| `landing` | Conversion-focused page with hero, benefits, CTA | ~800 |
| `glossary` | Definition with Schema.org markup, related terms | ~500 |
| `comparison` | Head-to-head with comparison table, verdict | ~1200 |
| `listicle` | Ranked list with dynamic count in title (e.g. "7 Best...") | ~1200 |
| `how-to` | Step-by-step with HowTo schema markup | ~1200 |
| `alternatives` | 5-8 alternatives with comparison table, use cases | ~1200 |
| `review` | Pros/cons, pricing, features, verdict | ~1200 |
| `hub` | Pillar page linking to sub-pages, topic overview | ~2000 |
| `auto` | **AI plans a full content strategy** — picks types and keywords automatically (default) | varies |

## Commands

### `contentclaw init`

Interactive setup wizard. Creates `contentclaw.config.json` with provider, model, API key, language, tone, word count, brand info, internal linking config, server port, and web search preference.

### `contentclaw generate [keywords...]`

Main generation command. Generates content pages and stores them in a local SQLite database (`contentclaw.db`).

#### All CLI Flags

| Flag | Description | Default |
|------|-------------|---------|
| `-i, --input <file>` | Seed data file (CSV or JSON) | — |
| `-e, --expand <count>` | Expand each keyword into N long-tail variations | — |
| `-p, --provider <name>` | AI provider: `openai`, `gemini`, `anthropic`, `xai`, `qwen`, `ollama` | config or `openai` |
| `-m, --model <name>` | Model name override | config or provider default |
| `-k, --api-key <key>` | API key override | config or env var |
| `-l, --language <lang>` | Content language | config or `en` |
| `-t, --type <type>` | Content type: `auto`, `blog`, `landing`, `glossary`, `comparison`, `listicle`, `how-to`, `alternatives`, `review`, `hub` | `auto` |
| `--template <pattern>` | Template pattern with `{variables}`, e.g. `"{service} in {city}"` | — |
| `--vars <files...>` | Variable files for template (one value per line, one file per variable) | — |
| `--competitor <sitemap>` | Analyze competitor sitemap URL and generate competing content | — |
| `--no-web-search` | Disable web search/grounding (strips external links from body) | web search on |
| `--force` | Overwrite existing pages with the same slug | skip existing |
| `--refresh <days>` | Only regenerate pages older than N days | — |
| `--json` | Machine-readable JSON output (no spinners, no colors) | — |
| `-y, --yes` | Skip all interactive prompts, use defaults | — |

### `contentclaw serve`

Start the API server with dashboard.

| Flag | Description | Default |
|------|-------------|---------|
| `--port <number>` | Server port | `3099` |
| `--host <address>` | Server host | `localhost` |

## Usage Examples

### AI-Planned Content (Default - `auto` mode)

The AI analyzes the topic and generates 15-25 pages with the best content types and specific, keyword-rich slugs. It's aware of existing pages and won't duplicate them.

```bash
contentclaw generate "sourdough bread" -p openai
contentclaw generate "email marketing" -p gemini
contentclaw generate "kubernetes" -p anthropic --json --yes
```

### Competitor Analysis

Fetches the competitor's sitemap, analyzes their content, finds gaps and opportunities, and generates a plan to beat them. If `PARALLEL_API_KEY` is set, it uses deep page extraction for richer analysis.

```bash
contentclaw generate "seo" --competitor https://ahrefs.com/sitemap.xml -p xai
contentclaw generate "coffee" --competitor https://competitor.com/sitemap.xml -p openai

# With Parallel.ai deep extraction
PARALLEL_API_KEY="key" contentclaw generate "seo" --competitor https://moz.com/sitemap.xml -p gemini
```

### Force a Content Type

```bash
contentclaw generate "what is crawl budget" --type glossary -p openai
contentclaw generate "plumber in Austin" --type landing -p gemini
contentclaw generate "Ahrefs vs Semrush" --type comparison -p xai
contentclaw generate "best project management tools" --type listicle -p anthropic
contentclaw generate "Notion alternatives" --type alternatives -p openai
contentclaw generate "Figma review" --type review -p gemini
contentclaw generate "how to set up Google Analytics" --type how-to -p openai
contentclaw generate "complete guide to technical SEO" --type hub -p anthropic
```

### Expand a Keyword into Variations

```bash
contentclaw generate "coffee" --expand 20 --type glossary -p openai
contentclaw generate "yoga" --expand 15 --type blog -p gemini
```

### Template Mode (Bulk Cross-Multiplication)

Create variable files (one value per line) and a template pattern. ContentClaw generates the Cartesian product.

```bash
# services.txt: plumber, electrician, roofer
# cities.txt: Austin, Dallas, Houston

contentclaw generate --template "{service} in {city}" --vars services.txt cities.txt --type landing -p openai
# Generates 9 pages: plumber in Austin, plumber in Dallas, ... roofer in Houston
```

### Seed File Input

CSV or JSON files with keyword, optional slug, optional type, optional custom_prompt:

```bash
contentclaw generate --input seeds.csv -p gemini
contentclaw generate --input seeds.json -p openai --json --yes
```

**CSV format:**
```csv
keyword,type,slug
best seo tools 2026,listicle,best-seo-tools-2026
what is E-E-A-T,glossary,what-is-eeat
Ahrefs vs Semrush,comparison,ahrefs-vs-semrush
```

**JSON format:**
```json
[
  { "keyword": "best seo tools 2026", "type": "listicle" },
  { "keyword": "what is E-E-A-T", "type": "glossary" }
]
```

### Duplicate Handling

```bash
# Skip existing slugs (default behavior)
contentclaw generate "topic" -p openai

# Force overwrite existing pages
contentclaw generate "topic" --force -p openai

# Only regenerate pages older than 30 days
contentclaw generate "topic" --refresh 30 -p openai
```

### Disable Web Search

```bash
contentclaw generate "topic" --no-web-search -p openai
```

When web search is disabled, external links are stripped from the body to prevent hallucinated URLs.

### Start the API Server

```bash
contentclaw serve
contentclaw serve --port 8080 --host 0.0.0.0
```

## API Endpoints

Default base URL: `http://localhost:3099`

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `GET` | `/api/health` | Health check | — |
| `GET` | `/api/pages` | List pages (paginated) | `?page=1&limit=20&type=blog` |
| `GET` | `/api/pages/:slug` | Get single page with all fields | — |
| `DELETE` | `/api/pages/:slug` | Delete a page | — |
| `POST` | `/api/generate` | Generate pages via API | JSON body (see below) |

### POST `/api/generate` Body

```json
{
  "keywords": ["best seo tools 2026"],
  "provider": "openai",
  "type": "listicle",
  "language": "en"
}
```

### Page Response Shape

```json
{
  "slug": "best-seo-tools-2026",
  "keyword": "best SEO tools 2026",
  "title": "10 Best SEO Tools for 2026",
  "meta_description": "Compare the top SEO tools...",
  "body": "<h2>...</h2><p>...</p>",
  "internal_links": [
    { "anchor": "technical SEO guide", "url": "/blog/technical-seo" }
  ],
  "external_links": [
    { "anchor": "Ahrefs", "url": "https://ahrefs.com", "title": "Ahrefs" }
  ],
  "page_type": "listicle",
  "published_date": "2026-03-18",
  "created_at": "2026-03-18T19:00:00.000Z"
}
```

## Dashboard

Accessible at `http://localhost:3099` when the server is running. Features:

- **Stats cards**: Total pages, content types breakdown, latest page
- **Page grid**: All generated pages with title, slug, type badge, date, internal/external link counts
- **Page detail modal**: Full HTML body preview, meta description, all links
- **Real-time updates**: Auto-refreshes every 3 seconds with toast notifications for new pages (no manual refresh needed)
- **Live indicator**: Pulsing green dot shows the dashboard is connected and updating
- **Warning banner**: Content-at-scale warning about Google penalties
- **Follow SEO Experts page**: Curated list of SEO experts with X and LinkedIn handles
- **API Docs page**: Full endpoint documentation with examples

## Content Quality Features

### Web Search & External Links

When `webSearch` is enabled (default):
- **OpenAI**: Uses `web_search` tool for grounded responses
- **Gemini**: Uses `googleSearch` grounding with citation extraction from `groundingChunks` (filters out Google redirect URLs)
- **Anthropic**: Uses `web_search_20250305` tool
- **xAI**: Uses `web_search` tool
- External links are embedded inline in the HTML body
- For `listicle`, `alternatives`, `review`: links to every product/tool homepage
- For other types: 2-5 authoritative external links
- Provider citations are merged with body-extracted links and deduplicated

When `webSearch` is disabled (`--no-web-search`):
- No external links in body (stripped by post-processor)
- AI is instructed not to include any external URLs

### Internal Linking

- Pulls link targets from sitemap XML, manual URL list, or both
- Queries existing pages from the local SQLite database
- Builds prompt section with available internal pages (filtered by `slugPrefix`, excludes current page)
- Post-processes body HTML to validate all internal links exist — removes any link to a non-existent page
- 2-5 internal links per page with natural, contextual anchor text

### Content Accuracy Rules

The AI planner (`auto` mode and `--competitor` mode) enforces strict rules:
- **Comparisons**: Only products in the same category serving the same purpose (e.g. "Ahrefs vs Semrush" is valid; "Ahrefs vs Perplexity" is invalid)
- **Alternatives**: Main product must be real and well-known; alternatives must serve the same function
- **Reviews**: Only real, currently available products relevant to the topic
- **Listicles**: Every item must be a real, verifiable thing
- **Glossaries**: Real industry terminology that practitioners actually use
- **How-to**: Specific, achievable tasks — not vague concepts

### Post-Processing

All generated content goes through:
1. **Emdash stripping** — `—` → ` - ` and `–` → `-`
2. **External link validation** — strips all `<a href="https://...">` if web search is off
3. **Internal link validation** — removes links to non-existent pages
4. **Link deduplication** — both internal and external links are deduplicated
5. **50+ forbidden AI phrases** blocked (e.g. "in today's fast-paced", "dive deep", "game-changer", "navigate the landscape", etc.)

### Other Quality Features

- **Current year awareness**: Every prompt includes today's date and current year (2026)
- **Brand awareness**: Natural brand mentions when configured (not forced)
- **YMYL disclaimers**: Automatic disclaimer for health, finance, legal topics
- **3+ FAQs**: Added at the end of every content page
- **Comparison tables**: Included in comparison, alternatives, and relevant content types
- **Dynamic listicle titles**: Count in title matches actual list items (not a static number)
- **HowTo schema**: Step-by-step pages include Schema.org HowTo markup
- **Glossary schema**: Definition pages include Schema.org DefinedTerm markup

## Database

ContentClaw uses SQLite (`contentclaw.db`) in the current working directory. Features:

- **Auto-reconnection**: The server detects when the database file changes (inode-based) and reconnects automatically. No need to restart the server after running `generate`.
- **WAL mode**: Write-Ahead Logging for better concurrent read/write performance.
- **Schema migrations**: Automatic column additions when upgrading versions.

### Stored Fields

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Auto-increment primary key |
| `slug` | TEXT | Unique URL slug |
| `keyword` | TEXT | Source keyword |
| `title` | TEXT | Page title |
| `meta_description` | TEXT | Meta description |
| `body` | TEXT | Full HTML body content |
| `internal_links` | TEXT | JSON array of `{anchor, url}` |
| `external_links` | TEXT | JSON array of `{anchor, url, title}` |
| `page_type` | TEXT | Content type (blog, glossary, etc.) |
| `published_date` | TEXT | ISO date string |
| `created_at` | DATETIME | Auto-set on insert |
| `updated_at` | DATETIME | Auto-set on insert/update |

## Rate Limiting & Parallel Generation

- **Per-provider RPM limits**: Enforced via sliding window (60-second window)
- **Concurrency control**: Max simultaneous requests per provider
- **Batch processing**: Pages generated in configurable batch sizes
- **Automatic throttling**: When RPM limit is hit, waits until the window clears
- **In-memory cache**: Identical prompts return cached responses (1-hour TTL, max 10,000 entries)
- **Parallel mode**: Automatically enabled when generating >3 pages with batch size >1

Override defaults in config:

```json
{
  "rateLimit": {
    "gemini": { "rpm": 2000, "concurrency": 15, "batchSize": 15 },
    "openai": { "rpm": 1000, "concurrency": 10, "batchSize": 10 }
  }
}
```

## Competitor Analysis

The `--competitor` flag enables sitemap-based competitor analysis:

1. **Sitemap crawling**: Recursively fetches and parses the competitor's sitemap (supports nested sitemap indexes)
2. **Page extraction** (optional): If `PARALLEL_API_KEY` is set, uses Parallel.ai Extract API to deeply analyze up to 20 relevant competitor pages — extracting titles, topics, and content structure
3. **AI planning**: Feeds the competitor's content map to the AI, which generates a plan to:
   - Find content gaps the competitor doesn't cover
   - Identify weak pages you can do better
   - Discover missing angles, subtopics, and comparisons
   - Match their strong pages with even better versions
4. **Duplicate awareness**: The planner receives your existing page slugs and generates complementary content only

```bash
# Basic competitor analysis
contentclaw generate "seo" --competitor https://ahrefs.com/sitemap.xml -p xai

# With deep page extraction
PARALLEL_API_KEY="key" contentclaw generate "seo" --competitor https://moz.com/sitemap.xml -p gemini --json --yes
```

## Agent Best Practices (OpenClaw Integration)

1. Always use `--json --yes` for parseable, non-interactive output.
2. Use `auto` mode (default) for AI-planned content — it generates the best mix of content types.
3. Use `--competitor` with a sitemap URL to beat a specific competitor.
4. Use `--type` only when the user specifies a single format.
5. For bulk generation (1000+ pages), use `--template` with `--vars` files.
6. After generating, suggest `contentclaw serve` to start the dashboard and API.
7. Set `PARALLEL_API_KEY` for deeper competitor page analysis.
8. Keep web search enabled (default) so external links are real and grounded.
9. Use `--refresh 30` to regenerate stale content without duplicating fresh pages.
10. Check `--json` output's `errors` array to handle failures gracefully.
11. The database auto-reconnects — no need to restart the server between generate runs.
12. For non-English content, pass `-l <lang>` (e.g. `-l tr`, `-l de`, `-l fr`).

## Output Format (`--json`)

### Successful Generation

```json
{
  "success": true,
  "generated": 20,
  "failed": 0,
  "pages": [
    {
      "slug": "best-seo-tools-2026",
      "title": "10 Best SEO Tools for 2026",
      "keyword": "best SEO tools 2026",
      "meta_description": "Compare the top SEO tools for 2026...",
      "published_date": "2026-03-18",
      "page_type": "listicle"
    }
  ],
  "errors": []
}
```

### All Pages Already Exist

```json
{
  "success": true,
  "generated": 0,
  "failed": 0,
  "pages": [],
  "errors": [],
  "message": "All pages already exist. Use --force to regenerate."
}
```

### Error

```json
{
  "success": false,
  "error": "No keywords provided. Use arguments, --input, or --template flag."
}
```

## Supported Providers

| Provider | Web Search | Default Model | Rate Limit (Tier 1) |
|----------|-----------|---------------|---------------------|
| `openai` | Yes (`web_search` tool) | `gpt-5.2` | 500 RPM, 5 concurrent |
| `gemini` | Yes (`googleSearch` grounding) | `gemini-3-flash-preview` | 1000 RPM, 10 concurrent |
| `anthropic` | Yes (`web_search_20250305`) | `claude-opus-4-6` | 50 RPM, 3 concurrent |
| `xai` | Yes (`web_search` tool) | `grok-3` | 60 RPM, 3 concurrent |
| `qwen` | No | `qwen-max` | 60 RPM, 3 concurrent |
| `ollama` | No | `llama3` | 999 RPM, 1 concurrent |
