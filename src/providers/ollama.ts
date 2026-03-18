import { Ollama } from "ollama";
import { BaseProvider } from "./base.js";
import type { GeneratedContent, GenerateConfig } from "../types/index.js";

export class OllamaProvider extends BaseProvider {
  name = "ollama" as const;

  private getClient(config: GenerateConfig) {
    return new Ollama({
      host: config.baseUrl || process.env.OLLAMA_HOST || "http://localhost:11434",
    });
  }

  async generate(prompt: string, config: GenerateConfig): Promise<GeneratedContent> {
    const raw = await this.generateRaw(prompt, config);
    return this.parseResponse(raw);
  }

  async generateRaw(prompt: string, config: GenerateConfig): Promise<string> {
    const ollama = this.getClient(config);
    const model = config.model || "llama3";
    const response = await ollama.generate({ model, prompt, stream: false });
    return response.response;
  }
}
