---
name: contentclaw
description: Universal content engine - generate pages with AI from any topic, analyze competitor sitemaps, and serve via local REST API. Use when the user asks to create content, generate pages, analyze competitors, create glossary entries, landing pages, comparisons, listicles, how-to guides, alternatives, reviews, hub pages, bulk-create articles, expand topics, or start a content API. Features AI content planning with strict accuracy rules, competitor sitemap analysis with Parallel.ai deep extraction, web-grounded external links, natural internal linking with no 404s, emdash stripping, rate limiting, parallel generation, duplicate detection, and template mode. Supports OpenAI, Gemini, Anthropic, xAI, Qwen, and Ollama.
metadata: {"openclaw":{"emoji":"🦞","requires":{"anyBins":["contentclaw"]},"os":["linux","darwin","win32"]}}
---

# ContentClaw - Universal Content Engine

Generate pages with AI for any topic, analyze competitor sitemaps, and serve via local REST API for any CMS. Works for any subject - cooking, fitness, law, SaaS, travel, education, not just SEO. Built by metehan.ai.

## When to Use

- User wants to generate content pages at scale for any topic
- User wants to analyze a competitor's website/sitemap
- User wants glossary, comparison, listicle, how-to, or review pages
- User wants to expand a topic into many pages
- User needs a local API to serve generated content
- User asks to bulk-create articles with AI

## Prerequisites

```bash
npm install -g contentclaw
```

API key for at least one provider:
- `OPENAI_API_KEY`, `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `QWEN_API_KEY`
- Ollama needs no key
- `PARALLEL_API_KEY` (optional) - for deep competitor page extraction

## Content Quality

- **Real external links** - When web search is on (default), links to real product sites and authoritative sources are embedded inline. When off, external links are stripped.
- **No 404 internal links** - Validated against existing pages in DB.
- **Natural anchor text** - Contextual language, not copy-pasted titles.
- **No emdashes** - Automatically stripped and replaced with hyphens.
- **Accuracy enforced** - Comparisons only between same-category products. No nonsense pairings.
- **50+ forbidden AI phrases** blocked.

## Content Types

| Type | What it generates |
|------|-------------------|
| `blog` | Long-form article (~1500 words) |
| `landing` | Conversion-focused page (~800 words) |
| `glossary` | Definition with Schema.org markup (~500 words) |
| `comparison` | Head-to-head with table (~1200 words) |
| `listicle` | Ranked list with dynamic count in title (~1200 words) |
| `how-to` | Step-by-step with HowTo schema (~1200 words) |
| `alternatives` | 5-8 alternatives with comparison table (~1200 words) |
| `review` | Pros/cons, pricing, verdict (~1200 words) |
| `hub` | Pillar page linking to sub-pages (~2000 words) |
| `auto` | **AI plans a content strategy** (default) |

## Core Commands

### AI-planned content (default)

```bash
contentclaw generate "sourdough bread" --provider openai --json --yes
contentclaw generate "email marketing" --provider gemini --json --yes
```

### Competitor analysis

```bash
contentclaw generate "seo" --competitor https://ahrefs.com/sitemap.xml --json --yes
PARALLEL_API_KEY="key" contentclaw generate "seo" --competitor https://moz.com/sitemap.xml --json --yes
```

### Force a content type

```bash
contentclaw generate "what is programmatic SEO" --type glossary --json --yes
contentclaw generate "plumber in Austin" --type landing --json --yes
```

### Expand / template / seed file

```bash
contentclaw generate "coffee" --expand 20 --type glossary --json --yes
contentclaw generate --template "{service} in {city}" --vars services.txt cities.txt --type landing --json --yes
contentclaw generate --input seeds.csv --json --yes
```

### Duplicate handling

```bash
contentclaw generate "topic" --force --json --yes
contentclaw generate "topic" --refresh 30 --json --yes
```

### Start API server

```bash
contentclaw serve --port 3099
```

Endpoints:
- `GET /api/pages` - list all pages (`?page=1&limit=20`)
- `GET /api/pages/:slug` - single page with external links
- `POST /api/generate` - generate via API
- `DELETE /api/pages/:slug` - delete
- `GET /api/health` - health check

Dashboard at `http://localhost:3099` with live auto-updates.

## Important Flags

| Flag | Description |
|------|-------------|
| `--json` | Machine-readable JSON output |
| `-y, --yes` | Skip interactive prompts |
| `--competitor <sitemap>` | Competitor sitemap URL to analyze |
| `-t, --type <type>` | Force content type |
| `--template <pattern>` | Template with {variables} |
| `--vars <files...>` | Variable files |
| `-p, --provider <name>` | AI provider (openai, gemini, anthropic, xai, qwen, ollama) |
| `-m, --model <name>` | Model override |
| `-k, --api-key <key>` | API key override |
| `-l, --language <lang>` | Content language (default: `en`) |
| `-e, --expand <count>` | Expand keyword into N variations |
| `-i, --input <file>` | Seed file (CSV or JSON) |
| `--no-web-search` | Disable web search (strips external links) |
| `--force` | Overwrite existing pages |
| `--refresh <days>` | Regenerate pages older than N days |

## Agent Best Practices

1. Always use `--json --yes` for parseable, non-interactive output.
2. Use `auto` mode (default) for AI-planned content.
3. Use `--competitor` with a sitemap URL to beat a specific competitor.
4. Use `--type` only when the user specifies a single format.
5. For bulk generation (1000+ pages), use `--template` with `--vars`.
6. After generating, suggest `contentclaw serve` for the dashboard.
7. Set `PARALLEL_API_KEY` for deep competitor page analysis.
8. Keep web search enabled (default) so external links are real.

## Output Format (--json)

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
      "meta_description": "...",
      "published_date": "2026-03-18",
      "page_type": "listicle"
    }
  ],
  "errors": []
}
```
