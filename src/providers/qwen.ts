import OpenAI from "openai";
import { BaseProvider } from "./base.js";
import type { GeneratedContent, GenerateConfig } from "../types/index.js";

export class QwenProvider extends BaseProvider {
  name = "qwen" as const;

  private getClient(config: GenerateConfig) {
    return new OpenAI({
      apiKey: config.apiKey || process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY,
      baseURL: config.baseUrl || "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
  }

  async generate(prompt: string, config: GenerateConfig): Promise<GeneratedContent> {
    const raw = await this.generateRaw(prompt, config);
    return this.parseResponse(raw);
  }

  async generateRaw(prompt: string, config: GenerateConfig): Promise<string> {
    const client = this.getClient(config);
    const model = config.model || "qwen-max";
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0]?.message?.content || "";
  }
}
