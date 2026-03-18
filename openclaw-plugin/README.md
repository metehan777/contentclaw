# ContentClaw OpenClaw Plugin

Native [OpenClaw](https://docs.openclaw.ai) plugin for [ContentClaw](https://www.npmjs.com/package/contentclaw) - generate AI-powered content pages at scale, analyze competitor sitemaps, and serve via REST API.

## Installation

### Prerequisites

```bash
npm install -g contentclaw
```

### Install the plugin

```bash
openclaw plugins install contentclaw-openclaw-plugin
```

Or install from local path:

```bash
openclaw plugins install ./openclaw-plugin
```

## Registered Tools

| Tool | Description |
|------|-------------|
| `contentclaw_generate` | Generate content pages from keywords (auto, blog, glossary, comparison, listicle, how-to, alternatives, review, landing, hub) |
| `contentclaw_competitor` | Analyze competitor sitemap and generate competing content |
| `contentclaw_pages` | List all generated pages from the database |
| `contentclaw_page` | Get a specific page by slug with full HTML body and links |
| `contentclaw_serve` | Start the ContentClaw API server and dashboard |

## Configuration

Add to your OpenClaw config under `plugins.entries.contentclaw.config`:

```json
{
  "plugins": {
    "entries": {
      "contentclaw": {
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.4",
          "language": "en",
          "webSearch": true
        }
      }
    }
  }
}
```

## Example Agent Prompts

```
Generate 20 pages about "technical SEO" using OpenAI
Analyze ahrefs.com sitemap and create competing content about SEO
Show me all generated pages
Start the content dashboard
```

## Links

- [ContentClaw npm](https://www.npmjs.com/package/contentclaw)
- [ContentClaw GitHub](https://github.com/metehan777/contentclaw)
- [OpenClaw Docs](https://docs.openclaw.ai/plugin)

Built by [metehan.ai](https://metehan.ai)
