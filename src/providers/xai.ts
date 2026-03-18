import OpenAI from "openai";
import { BaseProvider } from "./base.js";
import type { GeneratedContent, GenerateConfig, ExternalLink } from "../types/index.js";

export class XAIProvider extends BaseProvider {
  name = "xai" as const;

  private getClient(config: GenerateConfig) {
    return new OpenAI({
      apiKey: config.apiKey || process.env.XAI_API_KEY,
      baseURL: config.baseUrl || "https://api.x.ai/v1",
    });
  }

  async generate(prompt: string, config: GenerateConfig): Promise<GeneratedContent> {
    const client = this.getClient(config);
    const model = config.model || "grok-4-1-fast";

    if (config.webSearch !== false) {
      try {
        const response = await (client as any).responses.create({
          model,
          input: [{ role: "user", content: prompt }],
          tools: [{ type: "web_search" }],
        });

        const citations: ExternalLink[] = [];
        if (response.output) {
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
        }

        const uniqueCitations = citations.filter(
          (c, i, arr) => arr.findIndex((x) => x.url === c.url) === i
        );

        const text = response.output_text || "";
        return this.parseResponse(text, uniqueCitations);
      } catch {
        // fall back to chat completions if responses API fails
      }
    }

    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
    });
    return this.parseResponse(response.choices[0]?.message?.content || "");
  }

  async generateRaw(prompt: string, config: GenerateConfig): Promise<string> {
    const client = this.getClient(config);
    const model = config.model || "grok-4-1-fast";
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0]?.message?.content || "";
  }
}
