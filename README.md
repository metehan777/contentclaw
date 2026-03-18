# ContentClaw

[![npm version](https://img.shields.io/npm/v/contentclaw.svg)](https://www.npmjs.com/package/contentclaw)
[![GitHub](https://img.shields.io/github/stars/metehan777/contentclaw)](https://github.com/metehan777/contentclaw)

**Universal Content Engine** - Generate pages with AI from any topic, analyze competitor sitemaps, and serve via local REST API for any CMS.

[npm](https://www.npmjs.com/package/contentclaw) | [GitHub](https://github.com/metehan777/contentclaw) | Built by [metehan.ai](https://metehan.ai)

## What is ContentClaw?

ContentClaw is a universal content engine. Give it any topic - cooking, fitness, SaaS, law, travel, education - or point it at a competitor's sitemap, and it generates a full content strategy with AI-planned page types, web-grounded facts, and verified external links. No hallucinated URLs, no emdashes, no AI filler.

**How it works:**

1. Give it a topic: `contentclaw generate "sourdough bread"`
2. Or analyze a competitor: `contentclaw generate "seo" --competitor https://competitor.com/sitemap.xml`
3. The AI plans a content strategy - glossary entries, comparisons, how-to guides, reviews, etc.
4. Each page gets web-grounded content with real external links inline
5. Start the API server, connect your CMS

## Key Features

- **AI-powered content planning** - The AI decides which page types make sense for any topic
- **Competitor analysis** - Feed a competitor's sitemap, get a content plan that beats them
- **Parallel.ai integration** - Deep page extraction from competitor sites when `PARALLEL_API_KEY` is set
- **Web search/grounding** - OpenAI, Gemini, Anthropic, and xAI use native web search for real-time data
- **Real external links** - When web search is enabled, external links are real URLs embedded inline in content. When disabled, they're stripped to prevent hallucination
- **Natural internal linking** - Links only to pages that actually exist (no 404s), natural anchor text
- **Accuracy rules** - Comparisons only between same-category products, real product names only, no nonsense pairings
- **No AI-isms** - Emdashes stripped, 50+ forbidden phrases blocked, humanized writing enforced
- **Rate limiting & parallel generation** - Built-in RPM limits for 5000+ pages
- **Live dashboard** - Real-time auto-updates as pages generate, no server restart needed
- **Duplicate detection** - Skips existing pages by default, `--force` to overwrite
- **9 content types** - blog, landing, glossary, comparison, listicle, how-to, alternatives, review, hub

## Competitor Analysis

Analyze a competitor's sitemap and generate content that beats them:

```bash
# Analyze competitor and generate competing content
contentclaw generate "seo" --competitor https://ahrefs.com/sitemap.xml

# With Parallel.ai for deep page extraction (optional)
PARALLEL_API_KEY="your-key" contentclaw generate "seo" --competitor https://moz.com/sitemap.xml

# Any topic, any competitor
contentclaw generate "sourdough" --competitor https://kingarthurbaking.com/sitemap.xml
contentclaw generate "fitness" --competitor https://muscleandstrength.com/sitemap.xml
```

**How it works:**
1. Fetches the competitor's sitemap (supports sitemap indexes)
2. If `PARALLEL_API_KEY` is set, uses Parallel.ai Extract API to deeply analyze their top pages
3. The AI identifies gaps, weak pages, and missed angles
4. Generates 15-30 pages that directly compete with or fill gaps in their content

## Page Types

| Type | Structure |
|------|-----------|
| `blog` | Long-form article, ~1500 words |
| `landing` | Conversion-focused service/location page, ~800 words |
| `glossary` | Reference definition with Schema.org markup, 400-700 words |
| `comparison` | Head-to-head with comparison table, ~1200 words |
| `listicle` | Ranked list with dynamic item count in title, ~1200 words |
| `how-to` | Step-by-step with HowTo schema, ~1200 words |
| `alternatives` | 5-8 alternatives with comparison table, ~1200 words |
| `review` | Pros/cons, pricing, verdict, ~1200 words |
| `hub` | Pillar page linking to sub-pages, ~2000 words |
| `auto` | AI plans a full content strategy (default) |

## Supported AI Providers

| Provider | Default Model | Web Search | Env Variable |
|----------|--------------|------------|--------------|
| OpenAI | gpt-5.4 | Responses API `web_search` | `OPENAI_API_KEY` |
| Google Gemini | gemini-3-flash-preview | Google Search grounding | `GEMINI_API_KEY` |
| Anthropic | claude-opus-4-6 | `web_search_20250305` | `ANTHROPIC_API_KEY` |
| X.ai | grok-4-1-fast | Responses API `web_search` | `XAI_API_KEY` |
| Qwen | qwen-max | - | `QWEN_API_KEY` |
| Ollama | any local model | - | `OLLAMA_HOST` |

## Installation

```bash
npm install -g contentclaw
```

## Quick Start

```bash
# AI plans a full content strategy (15-25 pages per topic)
contentclaw generate "sourdough bread" -p openai

# Analyze a competitor's sitemap
contentclaw generate "seo" --competitor https://ahrefs.com/sitemap.xml -p gemini

# Single blog post
contentclaw generate "how to start a podcast in 2026" --type blog

# Glossary entries via expansion
contentclaw generate "machine learning" --expand 20 --type glossary

# Template mode: cross-multiply for 5000+ pages
contentclaw generate --template "{service} in {city}" --vars services.txt cities.txt --type landing

# Start the API server
contentclaw serve
```

Dashboard at `http://localhost:3099`, API docs at `http://localhost:3099/docs`.

## CLI Commands

### `contentclaw init`

Interactive setup wizard that creates `contentclaw.config.json`.

### `contentclaw generate`

```bash
# Auto mode (AI plans content strategy)
contentclaw generate "email marketing"

# Competitor analysis
contentclaw generate "fitness" --competitor https://competitor.com/sitemap.xml

# Force type
contentclaw generate "plumber in Austin" --type landing

# Multiple keywords
contentclaw generate "best CRM tools" "what is SEO" "Ahrefs vs Semrush"

# Template mode
contentclaw generate --template "{service} in {city}" --vars services.txt cities.txt --type landing

# Disable web search (external links will be stripped)
contentclaw generate "topic" --no-web-search

# Force overwrite existing pages
contentclaw generate "topic" --force

# Refresh pages older than 30 days
contentclaw generate "topic" --refresh 30
```

**Options:**

| Flag | Description |
|------|-------------|
| `[keywords...]` | One or more keywords |
| `--competitor <sitemap>` | Competitor sitemap URL to analyze |
| `-t, --type <type>` | Content type: `auto`, `blog`, `landing`, `glossary`, `comparison`, `listicle`, `how-to`, `alternatives`, `review`, `hub` |
| `-i, --input <file>` | Seed data file (CSV or JSON) |
| `--template <pattern>` | Template with {variables} for cross-multiplying |
| `--vars <files...>` | Variable files for template |
| `-e, --expand <count>` | Expand keyword into N variations |
| `-p, --provider <name>` | AI provider override |
| `-m, --model <name>` | Model override |
| `-k, --api-key <key>` | API key override |
| `-l, --language <lang>` | Content language (default: `en`) |
| `--no-web-search` | Disable web search/grounding (strips external links) |
| `--force` | Overwrite existing pages with the same slug |
| `--refresh <days>` | Only regenerate pages older than N days |
| `--json` | JSON output (machine-readable) |
| `-y, --yes` | Skip interactive prompts |

### `contentclaw serve`

```bash
contentclaw serve
contentclaw serve --port 8080
```

## Content Quality

- **Real external links** - When web search is enabled (default), external links to official product sites and authoritative sources are embedded inline in the content. When web search is off, external links are stripped to prevent hallucination.
- **No 404 internal links** - Internal links validated against existing pages in the database. Links to non-existent pages are automatically removed.
- **Natural anchor text** - Internal link anchors use contextual language, not copy-pasted page titles.
- **No emdashes** - All em-dashes and en-dashes automatically stripped and replaced with hyphens.
- **Accuracy enforced** - Comparisons only between same-category products (no "Ahrefs vs Perplexity" nonsense). Reviews and alternatives must reference real, currently available products.
- **50+ forbidden phrases** blocked (e.g., "in today's fast-paced", "dive deep", "game-changer").

## External Links

External links behavior depends on web search:

**Web search ON (default):**
- AI is instructed to include real external links inline in the content
- Listicles/reviews/alternatives: each product links to its official homepage
- Other types: 2-5 authoritative reference links
- Links are grounded by the provider's web search (real URLs)

**Web search OFF (`--no-web-search`):**
- All external links are stripped from generated content
- Prevents hallucinated/404 URLs when the AI has no web access

## Parallel.ai Integration

Parallel.ai is used as a **scraping and research tool** for competitor analysis. When `PARALLEL_API_KEY` is set:

- **`--competitor` mode**: Uses Parallel.ai Extract API to deeply analyze competitor pages - extracting titles, topics, and content structure for smarter content planning
- Without the key, competitor analysis still works using URL/slug-based inference

```bash
export PARALLEL_API_KEY="your-key"
contentclaw generate "seo" --competitor https://competitor.com/sitemap.xml
```

## Rate Limiting & Parallel Generation

Built-in rate limiting with Tier 1 defaults per provider:

| Provider | Default RPM | Concurrency | Batch Size |
|----------|------------|-------------|------------|
| OpenAI | 500 | 5 | 5 |
| Gemini | 1000 | 10 | 10 |
| Anthropic | 50 | 3 | 3 |
| xAI | 60 | 3 | 3 |
| Qwen | 60 | 3 | 3 |
| Ollama | 999 | 1 | 1 |

Override in `contentclaw.config.json`:

```json
{
  "rateLimit": {
    "openai": { "rpm": 1000, "concurrency": 10, "batchSize": 10 }
  }
}
```

## Duplicate Detection

```bash
# First run: generates 20 pages
contentclaw generate "technical seo"

# Second run: skips existing, generates NEW complementary pages
contentclaw generate "technical seo"

# Force overwrite all
contentclaw generate "technical seo" --force

# Only refresh pages older than 30 days
contentclaw generate "technical seo" --refresh 30
```

## Template Mode

Cross-multiply variables for bulk pSEO:

```bash
contentclaw generate --template "{service} in {city}" --vars services.txt cities.txt --type landing
# 50 cities x 20 services = 1000 landing pages
```

## Seed Data Format

### CSV

```csv
keyword,category,type
best running shoes 2026,shoes,listicle
plumber in Austin,services,landing
what is SEO,marketing,glossary
```

### JSON

```json
[
  { "keyword": "best running shoes 2026", "type": "listicle" },
  { "keyword": "what is programmatic SEO", "type": "glossary" }
]
```

## REST API

### `GET /api/pages?page=1&limit=20`

List all pages with pagination.

### `GET /api/pages/:slug`

Single page with body HTML, internal links, and external links.

### `POST /api/generate`

```bash
curl -X POST http://localhost:3099/api/generate \
  -H "Content-Type: application/json" \
  -d '{"seed_data":[{"keyword":"what is SEO","type":"glossary"}]}'
```

### `DELETE /api/pages/:slug`

### `GET /api/health`

## Config Reference

`contentclaw.config.json`:

```json
{
  "provider": "openai",
  "model": "gpt-5.4",
  "language": "en",
  "tone": "informative",
  "wordCount": 1500,
  "webSearch": true,
  "brand": {
    "name": "My Brand",
    "url": "https://mybrand.com",
    "description": "Short brand description"
  },
  "internalLinking": {
    "enabled": false,
    "source": "manual",
    "urls": [],
    "slugPrefix": "blog"
  },
  "rateLimit": {
    "openai": { "rpm": 500, "concurrency": 5, "batchSize": 5 }
  },
  "server": {
    "port": 3099,
    "host": "localhost"
  }
}
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | OpenAI provider |
| `GEMINI_API_KEY` | Google Gemini provider |
| `ANTHROPIC_API_KEY` | Anthropic provider |
| `XAI_API_KEY` | X.ai (Grok) provider |
| `QWEN_API_KEY` | Qwen provider |
| `OLLAMA_HOST` | Ollama (default: `http://localhost:11434`) |
| `PARALLEL_API_KEY` | Parallel.ai Extract API for competitor analysis |

## OpenClaw Integration

ContentClaw offers two levels of integration with [OpenClaw](https://docs.openclaw.ai):

### Option 1: SKILL.md (Lightweight)

Copy the bundled skill file so OpenClaw agents know how to use the CLI:

```bash
cp $(npm root -g)/contentclaw/SKILL.md ~/.openclaw/skills/contentclaw/SKILL.md
```

The agent will shell out to `contentclaw` with `--json --yes` flags.

### Option 2: Native Plugin (Full Integration)

Install the native OpenClaw plugin for direct tool registration - no shelling out:

```bash
openclaw plugins install @contentclaw/openclaw-plugin
```

This registers 5 tools into the OpenClaw runtime:

| Tool | Description |
|------|-------------|
| `contentclaw_generate` | Generate content pages from keywords with all CLI options |
| `contentclaw_competitor` | Analyze competitor sitemap and generate competing content |
| `contentclaw_pages` | List generated pages (paginated, filterable) |
| `contentclaw_page` | Get a specific page by slug with full HTML and links |
| `contentclaw_serve` | Start the API server and dashboard |

Configure in `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "contentclaw": {
        "config": {
          "defaultProvider": "openai",
          "language": "en",
          "webSearch": true
        }
      }
    }
  }
}
```

The plugin ships with `openclaw.plugin.json` (manifest + JSON Schema config validation), bundled skills, and `uiHints` for config UI rendering. See [`openclaw-plugin/`](./openclaw-plugin/) for the full source.

## License

MIT - built by [metehan.ai](https://metehan.ai)
