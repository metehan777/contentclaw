import type { AIProvider, GeneratedContent, GenerateConfig, ExternalLink } from "../types/index.js";

export abstract class BaseProvider implements AIProvider {
  abstract name: AIProvider["name"];

  abstract generate(prompt: string, config: GenerateConfig): Promise<GeneratedContent>;

  abstract generateRaw(prompt: string, config: GenerateConfig): Promise<string>;

  protected parseResponse(raw: string, citations?: ExternalLink[]): GeneratedContent {
    let cleaned = raw.trim();

    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      cleaned = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.title || parsed.body) {
        return {
          title: parsed.title || "",
          meta_description: parsed.meta_description || parsed.metaDescription || "",
          body: parsed.body || parsed.content || "",
          internal_links: parsed.internal_links || parsed.internalLinks || [],
          external_links: citations || [],
        };
      }
    } catch {
      // fall through to text parsing
    }

    const result = this.parseFromText(cleaned);
    result.external_links = citations || [];
    return result;
  }

  private parseFromText(text: string): GeneratedContent {
    const titleMatch = text.match(/(?:title|Title|TITLE):\s*(.+?)(?:\n|$)/);
    const metaMatch = text.match(
      /(?:meta_description|Meta Description|META_DESCRIPTION):\s*(.+?)(?:\n|$)/
    );

    const title = titleMatch?.[1]?.trim() || "Untitled";
    const meta = metaMatch?.[1]?.trim() || "";

    let body = text;
    if (titleMatch) {
      body = body.replace(titleMatch[0], "");
    }
    if (metaMatch) {
      body = body.replace(metaMatch[0], "");
    }

    return {
      title,
      meta_description: meta,
      body: body.trim(),
    };
  }
}
