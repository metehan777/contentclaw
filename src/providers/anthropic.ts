import Anthropic from "@anthropic-ai/sdk";
import { BaseProvider } from "./base.js";
import type { GeneratedContent, GenerateConfig, ExternalLink } from "../types/index.js";

export class AnthropicProvider extends BaseProvider {
  name = "anthropic" as const;

  private getClient(config: GenerateConfig) {
    return new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
    });
  }

  async generate(prompt: string, config: GenerateConfig): Promise<GeneratedContent> {
    const client = this.getClient(config);
    const model = config.model || "claude-opus-4-6";

    const tools: any[] = [];
    if (config.webSearch !== false) {
      tools.push({ type: "web_search_20250305", name: "web_search" });
    }

    const message = await client.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
      ...(tools.length > 0 ? { tools } : {}),
    });

    let text = "";
    const citations: ExternalLink[] = [];

    for (const block of message.content) {
      if (block.type === "text") {
        text += block.text;
        if ((block as any).citations) {
          for (const cite of (block as any).citations) {
            if (cite.type === "web_search_result_location" && cite.url) {
              citations.push({
                anchor: cite.title || cite.url,
                url: cite.url,
                title: cite.title,
              });
            }
          }
        }
      }
    }

    const uniqueCitations = citations.filter(
      (c, i, arr) => arr.findIndex((x) => x.url === c.url) === i
    );

    return this.parseResponse(text, uniqueCitations);
  }

  async generateRaw(prompt: string, config: GenerateConfig): Promise<string> {
    const client = this.getClient(config);
    const model = config.model || "claude-opus-4-6";
    const message = await client.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const block = message.content[0];
    return block.type === "text" ? block.text : "";
  }
}
