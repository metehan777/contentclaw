import OpenAI from "openai";
import { BaseProvider } from "./base.js";
import type { GeneratedContent, GenerateConfig, ExternalLink } from "../types/index.js";

export class OpenAIProvider extends BaseProvider {
  name = "openai" as const;

  private getClient(config: GenerateConfig) {
    return new OpenAI({
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
    });
  }

  async generate(prompt: string, config: GenerateConfig): Promise<GeneratedContent> {
    const client = this.getClient(config);
    const model = config.model || "gpt-5.4";

    const tools: any[] = [];
    if (config.webSearch !== false) {
      tools.push({ type: "web_search" });
    }

    const response = await client.responses.create({
      model,
      input: prompt,
      ...(tools.length > 0 ? { tools } : {}),
    });

    const citations: ExternalLink[] = [];
    for (const item of response.output) {
      if (item.type === "message" && item.content) {
        for (const block of item.content) {
          if (block.type === "output_text" && block.annotations) {
            for (const ann of block.annotations) {
              if (ann.type === "url_citation" && ann.url) {
                citations.push({
                  anchor: ann.title || ann.url,
                  url: ann.url,
                  title: ann.title,
                });
              }
            }
          }
        }
      }
    }

    const uniqueCitations = citations.filter(
      (c, i, arr) => arr.findIndex((x) => x.url === c.url) === i
    );

    return this.parseResponse(response.output_text, uniqueCitations);
  }

  async generateRaw(prompt: string, config: GenerateConfig): Promise<string> {
    const client = this.getClient(config);
    const model = config.model || "gpt-5.4";
    const response = await client.responses.create({ model, input: prompt });
    return response.output_text;
  }
}
