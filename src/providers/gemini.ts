import { GoogleGenerativeAI } from "@google/generative-ai";
import { BaseProvider } from "./base.js";
import type { GeneratedContent, GenerateConfig, ExternalLink } from "../types/index.js";

export class GeminiProvider extends BaseProvider {
  name = "gemini" as const;

  private getClient(config: GenerateConfig) {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is required. Set GEMINI_API_KEY or provide via config.");
    }
    return { genAI: new GoogleGenerativeAI(apiKey), apiKey };
  }

  async generate(prompt: string, config: GenerateConfig): Promise<GeneratedContent> {
    const { genAI } = this.getClient(config);
    const modelName = config.model || "gemini-3-flash-preview";

    const tools: any[] = [];
    if (config.webSearch !== false) {
      tools.push({ googleSearch: {} });
    }

    const model = genAI.getGenerativeModel({
      model: modelName,
      ...(tools.length > 0 ? { tools } : {}),
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const citations: ExternalLink[] = [];
    const metadata = (result.response as any).candidates?.[0]?.groundingMetadata;
    if (metadata?.groundingChunks) {
      for (const chunk of metadata.groundingChunks) {
        if (chunk.web?.uri) {
          const uri = chunk.web.uri;
          const isRedirect = uri.includes("vertexaisearch.cloud.google.com");
          if (!isRedirect) {
            citations.push({
              anchor: chunk.web.title || chunk.web.uri,
              url: uri,
              title: chunk.web.title,
            });
          }
        }
      }
    }

    if (metadata?.groundingSupports && citations.length === 0) {
      for (const support of metadata.groundingSupports) {
        if (support.segment?.text) {
          const chunkIndices = support.groundingChunkIndices || [];
          for (const idx of chunkIndices) {
            const chunk = metadata.groundingChunks?.[idx];
            if (chunk?.web?.title && !chunk.web.uri.includes("vertexaisearch")) {
              citations.push({
                anchor: chunk.web.title,
                url: chunk.web.uri,
                title: chunk.web.title,
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
    const { genAI } = this.getClient(config);
    const model = genAI.getGenerativeModel({ model: config.model || "gemini-3-flash-preview" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
